import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

describe("auth.logout", () => {
  it("clears the administrator session cookie and reports success", async () => {
    const cleared: Array<[string, Record<string, unknown>]> = [];
    const ctx: TrpcContext = { user: { id: "507f1f77bcf86cd799439011", openId: "sample-admin", email: "admin@example.com", name: "Administrator", passwordHash: "test-hash", accountType: "admin", accountStatus: "active", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: (name: string, options: Record<string, unknown>) => cleared.push([name, options]) } as TrpcContext["res"] };
    const result = await appRouter.createCaller(ctx).auth.logout();
    expect(result).toEqual({ success: true }); expect(cleared).toHaveLength(1); expect(cleared[0]?.[0]).toBe(COOKIE_NAME); expect(cleared[0]?.[1]).toMatchObject({ maxAge: -1, secure: true, sameSite: "none", httpOnly: true, path: "/" });
  });
});
