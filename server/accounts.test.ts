import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  hasMasterAdmin: vi.fn(), getUserByEmail: vi.fn(), createAccount: vi.fn(), createMasterAdmin: vi.fn(), touchUser: vi.fn(),
  listAccessRequests: vi.fn(), decideStaffRequest: vi.fn(), suspendAccount: vi.fn(), listManagedStaff: vi.fn(), changeStaffRole: vi.fn(), reactivateStaff: vi.fn(), updateAccountName: vi.fn(), updateAccountPassword: vi.fn(), toPublicUser: vi.fn((user: Record<string, unknown>) => user),
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

  it("returns a session token with a successful local sign-in for cross-origin browser requests", async () => {
    const context = contextFor("admin");
    const caller = appRouter.createCaller(context);
    dbMock.getUserByEmail.mockResolvedValue({ ...context.user, email: "admin@tapchurch.org", passwordHash: await bcrypt.hash("secure-password", 12) });

    await expect(caller.account.signIn({ email: "admin@tapchurch.org", password: "secure-password" })).resolves.toMatchObject({
      user: expect.objectContaining({ role: "admin", email: "admin@tapchurch.org" }),
      sessionToken: "local-session",
    });
    expect(sdkMock.sdk.createLocalSession).toHaveBeenCalledWith(expect.objectContaining({ email: "admin@tapchurch.org" }));
  });

  it("limits staff governance actions to the Master Admin", async () => {
    const id = "507f1f77bcf86cd799439012";
    const master = appRouter.createCaller(contextFor("master_admin"));
    dbMock.listManagedStaff.mockResolvedValue([{ id, accountStatus: "active", role: "worker" }]);
    dbMock.changeStaffRole.mockResolvedValue({ id, accountStatus: "active", role: "editor" });
    dbMock.suspendAccount.mockResolvedValue({ id, accountStatus: "suspended" });
    dbMock.reactivateStaff.mockResolvedValue({ id, accountStatus: "active" });

    await expect(master.account.requests.managed()).resolves.toHaveLength(1);
    await expect(master.account.requests.changeRole({ id, role: "editor" })).resolves.toMatchObject({ role: "editor" });
    await expect(master.account.requests.suspend({ id })).resolves.toMatchObject({ accountStatus: "suspended" });
    await expect(master.account.requests.reactivate({ id })).resolves.toMatchObject({ accountStatus: "active" });
    expect(dbMock.changeStaffRole).toHaveBeenCalledWith(id, "editor", "507f1f77bcf86cd799439011");
    expect(dbMock.reactivateStaff).toHaveBeenCalledWith(id, "507f1f77bcf86cd799439011");

    const admin = appRouter.createCaller(contextFor("admin"));
    await expect(admin.account.requests.changeRole({ id, role: "editor" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.account.requests.reactivate({ id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets signed-in users update only their own profile after confirming their current password", async () => {
    const context = contextFor("member");
    context.user.passwordHash = await bcrypt.hash("current-password", 12);
    const caller = appRouter.createCaller(context);
    dbMock.updateAccountName.mockResolvedValue({ id: context.user.id, name: "Updated TAP Member" });
    dbMock.updateAccountPassword.mockResolvedValue({ id: context.user.id });

    await expect(caller.account.profile.updateName({ name: "Updated TAP Member" })).resolves.toMatchObject({ name: "Updated TAP Member" });
    await expect(caller.account.profile.changePassword({ currentPassword: "current-password", newPassword: "new-secure-password" })).resolves.toMatchObject({ id: context.user.id });
    expect(dbMock.updateAccountName).toHaveBeenCalledWith(context.user.id, "Updated TAP Member");
    expect(dbMock.updateAccountPassword).toHaveBeenCalledWith(context.user.id, expect.any(String));
    await expect(caller.account.profile.changePassword({ currentPassword: "wrong-password", newPassword: "another-secure-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
