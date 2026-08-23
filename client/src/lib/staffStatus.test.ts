import { describe, expect, it } from "vitest";
import { splitStaffByStatus } from "./staffStatus";

describe("splitStaffByStatus", () => {
  it("keeps active, rejected, and suspended staff in distinct Master Admin collections", () => {
    const accounts = [
      { id: "active", accountStatus: "active" },
      { id: "rejected", accountStatus: "rejected" },
      { id: "suspended", accountStatus: "suspended" },
      { id: "pending", accountStatus: "pending" },
    ];
    const sections = splitStaffByStatus(accounts);
    expect(sections.active.map(account => account.id)).toEqual(["active"]);
    expect(sections.rejected.map(account => account.id)).toEqual(["rejected"]);
    expect(sections.suspended.map(account => account.id)).toEqual(["suspended"]);
  });
});
