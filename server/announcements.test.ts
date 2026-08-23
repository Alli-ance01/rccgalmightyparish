import { describe, expect, it } from "vitest";
import { activeAnnouncementFilter } from "./db";

describe("active announcement filter", () => {
  it("requires publication and constrains both optional schedule boundaries", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    expect(activeAnnouncementFilter(now)).toEqual({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
      ],
    });
  });
});
