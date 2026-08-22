import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

const staffRoles = ["worker", "ministry_leader", "editor", "admin"] as const;
const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(10, "Use at least 10 characters for your password.").max(128);
const accountInput = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password,
  accountType: z.enum(["member", "staff"]),
  requestedRole: z.enum(staffRoles).optional(),
  requestNote: z.string().trim().max(500).optional(),
});

const masterProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "master_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Master Admin access is required." });
  }
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
    setLocalSession(ctx, await sdk.createLocalSession(user));
    return user;
  }),
  register: publicProcedure.input(accountInput).mutation(async ({ input }) => {
    if (await db.getUserByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email." });
    if (input.accountType === "staff" && !input.requestedRole) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose the staff role you are requesting." });
    const account = await db.createAccount({
      name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), accountType: input.accountType,
      requestedRole: input.accountType === "staff" ? input.requestedRole : undefined, requestNote: input.requestNote,
    });
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
    setLocalSession(ctx, await sdk.createLocalSession(publicUser));
    return publicUser;
  }),
  requests: router({
    list: masterProcedure.query(() => db.listAccessRequests()),
    decide: masterProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), decision: z.enum(["approve", "reject"]), role: z.enum(staffRoles).optional(), note: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => db.decideStaffRequest({ ...input, approverId: ctx.user.id })),
    suspend: masterProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })).mutation(({ ctx, input }) => db.suspendAccount(input.id, ctx.user.id)),
  }),
});
