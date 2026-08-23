import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const prayerTeamProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "master_admin"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Prayer requests are visible to administrators only." });
  return next({ ctx });
});

export const prayerRouter = router({
  submit: publicProcedure.input(z.object({
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    request: z.string().trim().min(10, "Please share a little more so the prayer team can pray with you.").max(4000),
    wantsFollowUp: z.boolean(),
  })).mutation(({ input }) => db.createPrayerRequest({
    name: input.name?.trim() || null,
    email: input.email?.trim().toLowerCase() || null,
    request: input.request.trim(),
    wantsFollowUp: input.wantsFollowUp,
    status: "new",
    reviewedBy: null,
    reviewedAt: null,
  })),
  list: prayerTeamProcedure.input(z.object({ status: z.enum(["new", "prayed", "closed"]).optional() }).optional()).query(({ input }) => db.listPrayerRequests(input?.status)),
  updateStatus: prayerTeamProcedure.input(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["new", "prayed", "closed"]) })).mutation(({ ctx, input }) => db.updatePrayerRequestStatus(input.id, input.status, ctx.user.id)),
});
