import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  hasMasterAdmin: vi.fn(), getUserByEmail: vi.fn(), createAccount: vi.fn(), createMasterAdmin: vi.fn(), touchUser: vi.fn(),
  listAccessRequests: vi.fn(), decideStaffRequest: vi.fn(), suspendAccount: vi.fn(), toPublicUser: vi.fn((user: Record<string, unknown>) => user),
}));
const sdkMock = vi.hoisted(() => ({ sdk: { createLocalSession: vi.fn().mockResolvedValue("local-session") } }));
vi.mock("./db", () => dbMock);
vi.mock("./_core/sdk", () => sdkMock);
import { appRouter } from "./routers";

function contextFor(role: "member" | "admin" | "master_admin"): TrpcContext {
  const now = new Date();
  return { user: { id: "507f1f77bcf86cd799439011", openId: `local:${role}@tapchurch.org`, name: "TAP Tester", email: `${role}@tapchurch.org`, passwordHash: "hash", accountType: role === "member" ? "member" : "staff", accountStatus: "active", role, requestedRole: null, requestNote: null, approvalNote: null, approvedBy: null, approvedAt: now, suspendedAt: null, createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

describe("local TAP account approval workflow", () => {
  beforeEach(() => { vi.clearAllMocks(); dbMock.getUserByEmail.mockResolvedValue(undefined); dbMock.createAccount.mockResolvedValue({ id: "507f1f77bcf86cd799439012", accountStatus: "pending" }); });

  it("creates staff accounts as pending requests rather than active staff sessions", async () => {
    const caller = appRouter.createCaller(contextFor("member"));
    const result = await caller.account.register({ name: "Ministry Worker", email: "worker@tapchurch.org", password: "secure-password", accountType: "staff", requestedRole: "editor", requestNote: "I help with weekly notices." });
    expect(result.message).toContain("awaiting Master Admin approval");
    expect(dbMock.createAccount).toHaveBeenCalledWith(expect.objectContaining({ accountType: "staff", requestedRole: "editor" }));
  });

  it("allows only the Master Admin to approve a staff request", async () => {
    const caller = appRouter.createCaller(contextFor("master_admin"));
    dbMock.decideStaffRequest.mockResolvedValue({ id: "507f1f77bcf86cd799439012", accountStatus: "active", role: "editor" });
    await expect(caller.account.requests.decide({ id: "507f1f77bcf86cd799439012", decision: "approve", role: "editor" })).resolves.toMatchObject({ accountStatus: "active", role: "editor" });
    expect(dbMock.decideStaffRequest).toHaveBeenCalledWith(expect.objectContaining({ approverId: "507f1f77bcf86cd799439011", decision: "approve", role: "editor" }));
    const nonMaster = appRouter.createCaller(contextFor("admin"));
    await expect(nonMaster.account.requests.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses pending staff access at sign-in", async () => {
    const caller = appRouter.createCaller(contextFor("member"));
    dbMock.getUserByEmail.mockResolvedValue({ ...contextFor("member").user, passwordHash: await bcrypt.hash("secure-password", 12), accountStatus: "pending" });
    await expect(caller.account.signIn({ email: "worker@tapchurch.org", password: "secure-password" })).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("awaiting") });
  });
});
