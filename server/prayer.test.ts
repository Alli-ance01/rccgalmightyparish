import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({ createPrayerRequest: vi.fn(), listPrayerRequests: vi.fn(), updatePrayerRequestStatus: vi.fn() }));
vi.mock("./db", () => dbMock);

import { prayerRouter } from "./routers/prayer";

function contextFor(role: "member" | "admin" | "master_admin"): TrpcContext {
  return { user: { id: "507f1f77bcf86cd799439011", openId: `tap-${role}`, name: "TAP Tester", email: "tester@tapchurch.org", passwordHash: "hash", accountType: role === "member" ? "member" : "staff", accountStatus: "active", role, requestedRole: null, requestNote: null, approvalNote: null, approvedBy: null, approvedAt: null, suspendedAt: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("prayer request router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts a public prayer request without requiring the requester to expose their identity", async () => {
    dbMock.createPrayerRequest.mockResolvedValue("507f1f77bcf86cd799439012");
    const caller = prayerRouter.createCaller({ ...contextFor("member"), user: null });
    await expect(caller.submit({ request: "Please pray for wisdom and strength in this season.", wantsFollowUp: false })).resolves.toBe("507f1f77bcf86cd799439012");
    expect(dbMock.createPrayerRequest).toHaveBeenCalledWith(expect.objectContaining({ name: null, email: null, status: "new", wantsFollowUp: false }));
  });

  it("restricts confidential request review to administrators", async () => {
    const member = prayerRouter.createCaller(contextFor("member"));
    await expect(member.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const admin = prayerRouter.createCaller(contextFor("admin"));
    dbMock.listPrayerRequests.mockResolvedValue([]);
    await expect(admin.list({ status: "new" })).resolves.toEqual([]);
    expect(dbMock.listPrayerRequests).toHaveBeenCalledWith("new");
  });
});
