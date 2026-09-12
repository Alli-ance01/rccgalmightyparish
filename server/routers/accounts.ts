import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(10, "Use at least 10 characters for your password.").max(128);
function setLocalSession(ctx: { req: any; res: any }, token: string) { ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS }); }

export const accountRouter = router({
  setupStatus: publicProcedure.query(async () => ({ needsSetup: !(await db.hasAdmin()), adminEmail: ENV.initialMasterAdminEmail })),
  setupAdmin: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120), email, password, setupToken: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    if (await db.hasAdmin()) throw new TRPCError({ code: "CONFLICT", message: "The administrator account has already been created." });
    if (!ENV.initialMasterAdminSetupToken || input.setupToken !== ENV.initialMasterAdminSetupToken) throw new TRPCError({ code: "FORBIDDEN", message: "The setup token is invalid or missing from the server configuration." });
    if (input.email !== ENV.initialMasterAdminEmail) throw new TRPCError({ code: "FORBIDDEN", message: "This setup is restricted to the configured administrator email." });
    if (await db.getUserByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email." });
    const user = await db.createAdmin({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12) });
    const sessionToken = await sdk.createLocalSession(user); setLocalSession(ctx, sessionToken); return { user, sessionToken };
  }),
  signIn: publicProcedure.input(z.object({ email, password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const user = await db.getUserByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
    if (user.role !== "admin" || user.accountStatus !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Only active administrators can sign in." });
    await db.touchUser(user.id); const publicUser = db.toPublicUser(user); const sessionToken = await sdk.createLocalSession(publicUser); setLocalSession(ctx, sessionToken); return { user: publicUser, sessionToken };
  }),
  profile: router({
    updateName: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120) })).mutation(async ({ ctx, input }) => { if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." }); return db.updateAccountName(ctx.user.id, input.name); }),
    changePassword: publicProcedure.input(z.object({ currentPassword: z.string().min(1), newPassword: password })).mutation(async ({ ctx, input }) => { if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." }); if (!(await bcrypt.compare(input.currentPassword, ctx.user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your current password is incorrect." }); return db.updateAccountPassword(ctx.user.id, await bcrypt.hash(input.newPassword, 12)); }),
  }),
});
