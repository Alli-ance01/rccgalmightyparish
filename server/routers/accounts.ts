import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { JUNIOR_AGE_CATEGORIES, MEMBER_UPDATE_AUDIENCES, MINISTRY_INTERESTS, SERVICE_AVAILABILITY } from "../models";

const staffRoles = ["worker", "ministry_leader", "editor", "admin"] as const;
const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(10, "Use at least 10 characters for your password.").max(128);
const memberProfileInput = z.object({
  ministryInterests: z.array(z.enum(MINISTRY_INTERESTS)).max(MINISTRY_INTERESTS.length),
  serviceAvailability: z.enum(SERVICE_AVAILABILITY).nullable(),
  wantsParishUpdates: z.boolean(),
  isGuardian: z.boolean(),
  juniorAgeCategories: z.array(z.enum(JUNIOR_AGE_CATEGORIES)).max(JUNIOR_AGE_CATEGORIES.length),
}).superRefine((value, context) => {
  if (!value.isGuardian && value.juniorAgeCategories.length) context.addIssue({ code: "custom", path: ["juniorAgeCategories"], message: "Only a parent or guardian can select Junior Church categories." });
});
const memberUpdateInput = z.object({
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(10).max(2500),
  audience: z.enum(MEMBER_UPDATE_AUDIENCES),
  audienceValues: z.array(z.string().trim().min(1).max(80)).max(10),
  isPublished: z.boolean(),
}).superRefine((value, context) => {
  if (value.audience === "all" && value.audienceValues.length) context.addIssue({ code: "custom", path: ["audienceValues"], message: "A parish-wide update cannot have segment values." });
  if (value.audience !== "all" && !value.audienceValues.length) context.addIssue({ code: "custom", path: ["audienceValues"], message: "Choose at least one audience value." });
});
const accountInput = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password,
  accountType: z.enum(["member", "staff"]),
  requestedRole: z.enum(staffRoles).optional(),
  requestNote: z.string().trim().max(500).optional(),
  onboarding: memberProfileInput.optional(),
});

const masterProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "master_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Master Admin access is required." });
  }
  return next();
});
const memberReviewProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  return next();
});

function setLocalSession(ctx: { req: any; res: any }, token: string) {
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}

export const accountRouter = router({
  setupStatus: publicProcedure.query(async () => ({ needsSetup: !(await db.hasMasterAdmin()), masterEmail: ENV.initialMasterAdminEmail })),
  setupMasterAdmin: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120), email, password, setupToken: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    if (await db.hasMasterAdmin()) throw new TRPCError({ code: "CONFLICT", message: "The Master Admin account has already been created." });
    if (!ENV.initialMasterAdminSetupToken || input.setupToken !== ENV.initialMasterAdminSetupToken) throw new TRPCError({ code: "FORBIDDEN", message: "The setup token is invalid or missing from the server configuration." });
    if (input.email !== ENV.initialMasterAdminEmail) throw new TRPCError({ code: "FORBIDDEN", message: "This setup is restricted to the configured Master Admin email." });
    if (await db.getUserByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email." });
    const user = await db.createMasterAdmin({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12) });
    const sessionToken = await sdk.createLocalSession(user);
    setLocalSession(ctx, sessionToken);
    return { user, sessionToken };
  }),
  register: publicProcedure.input(accountInput).mutation(async ({ input }) => {
    if (await db.getUserByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email." });
    if (input.accountType === "staff" && !input.requestedRole) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose the staff role you are requesting." });
    const account = await db.createAccount({
      name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), accountType: input.accountType,
      requestedRole: input.accountType === "staff" ? input.requestedRole : undefined, requestNote: input.requestNote,
    });
    if (input.accountType === "member" && input.onboarding) await db.saveMemberProfile({ ...input.onboarding, userId: account.id, onboardingCompleted: true });
    return { account, message: input.accountType === "staff" ? "Your staff access request is awaiting Master Admin approval." : "Your member account is ready. You can now sign in." };
  }),
  signIn: publicProcedure.input(z.object({ email, password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const user = await db.getUserByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
    if (user.accountStatus === "pending") throw new TRPCError({ code: "FORBIDDEN", message: "Your staff request is still awaiting Master Admin approval." });
    if (user.accountStatus === "rejected") throw new TRPCError({ code: "FORBIDDEN", message: "This staff request was not approved. Contact the Master Admin for guidance." });
    if (user.accountStatus === "suspended") throw new TRPCError({ code: "FORBIDDEN", message: "This account has been suspended." });
    await db.touchUser(user.id);
    const publicUser = db.toPublicUser(user);
    const sessionToken = await sdk.createLocalSession(publicUser);
    setLocalSession(ctx, sessionToken);
    return { user: publicUser, sessionToken };
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => db.getMemberProfile(ctx.user.id)),
    savePreferences: protectedProcedure.input(memberProfileInput).mutation(({ ctx, input }) => db.saveMemberProfile({ ...input, userId: ctx.user.id, onboardingCompleted: true })),
    updateName: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120) })).mutation(({ ctx, input }) => db.updateAccountName(ctx.user.id, input.name)),
    changePassword: protectedProcedure.input(z.object({ currentPassword: z.string().min(1), newPassword: password })).mutation(async ({ ctx, input }) => {
      if (!(await bcrypt.compare(input.currentPassword, ctx.user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your current password is incorrect." });
      return db.updateAccountPassword(ctx.user.id, await bcrypt.hash(input.newPassword, 12));
    }),
  }),
  memberHub: router({
    eventInterestIds: protectedProcedure.query(({ ctx }) => db.listEventInterestIds(ctx.user.id)),
    setEventInterest: protectedProcedure.input(z.object({ eventId: z.string().regex(/^[a-f\d]{24}$/i), interested: z.boolean() })).mutation(({ ctx, input }) => db.setEventInterest({ ...input, userId: ctx.user.id })),
    updates: protectedProcedure.query(({ ctx }) => db.listMemberUpdatesForUser(ctx.user.id)),
  }),
  memberManagement: router({
    listProfiles: memberReviewProcedure.query(() => db.listMemberProfilesForStaff()),
    listUpdates: memberReviewProcedure.query(() => db.listMemberUpdatesForStaff()),
    createUpdate: memberReviewProcedure.input(memberUpdateInput).mutation(({ ctx, input }) => db.createMemberUpdate({ ...input, createdBy: ctx.user.id })),
  }),
  requests: router({
    list: masterProcedure.query(() => db.listAccessRequests()),
    decide: masterProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), decision: z.enum(["approve", "reject"]), role: z.enum(staffRoles).optional(), note: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => db.decideStaffRequest({ ...input, approverId: ctx.user.id })),
    suspend: masterProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })).mutation(({ ctx, input }) => db.suspendAccount(input.id, ctx.user.id)),
    managed: masterProcedure.input(z.object({ status: z.enum(["active", "rejected", "suspended"]).optional() }).optional()).query(({ input }) => db.listManagedStaff(input?.status)),
    changeRole: masterProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), role: z.enum(staffRoles) })).mutation(({ ctx, input }) => db.changeStaffRole(input.id, input.role, ctx.user.id)),
    reactivate: masterProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })).mutation(({ ctx, input }) => db.reactivateStaff(input.id, ctx.user.id)),
  }),
});
