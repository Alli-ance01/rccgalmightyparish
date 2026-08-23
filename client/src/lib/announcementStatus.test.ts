import { describe, expect, it } from "vitest";
import { getAnnouncementStatus } from "./announcementStatus";

describe("getAnnouncementStatus", () => {
  const now = new Date("2026-08-23T12:00:00.000Z");
  it("distinguishes draft, scheduled, active, and expired announcements", () => {
    expect(getAnnouncementStatus({ isActive: false }, now)).toBe("Draft");
    expect(getAnnouncementStatus({ isActive: true, startsAt: "2026-08-24T12:00:00.000Z" }, now)).toBe("Scheduled");
    expect(getAnnouncementStatus({ isActive: true, startsAt: "2026-08-22T12:00:00.000Z", endsAt: "2026-08-24T12:00:00.000Z" }, now)).toBe("Active");
    expect(getAnnouncementStatus({ isActive: true, endsAt: "2026-08-22T12:00:00.000Z" }, now)).toBe("Expired");
  });
});
