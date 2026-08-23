import { describe, expect, it } from "vitest";
import { managedStaffFilter } from "./db";

describe("managed staff filter", () => {
  it("excludes master admins and pending requests from the default governance collection", () => {
    expect(managedStaffFilter()).toEqual({
      accountType: "staff",
      role: { $ne: "master_admin" },
      accountStatus: { $in: ["active", "rejected", "suspended"] },
    });
  });

  it("allows Master Admin views to target one non-pending staff status", () => {
    expect(managedStaffFilter("suspended")).toMatchObject({ accountStatus: "suspended" });
  });
});
