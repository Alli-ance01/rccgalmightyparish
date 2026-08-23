import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("homepage Upcoming Events section", () => {
  it("filters future events, provides a weekly-service fallback, and links visitors to the full calendar", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("const upcomingEvents = events.filter");
    expect(home).toContain("new Date(event.startsAt).getTime() >= Date.now()");
    expect(home).toContain("Weekly services & upcoming events.");
    expect(home).toContain("View full calendar");
    expect(home).toContain("href=\"/events\"");
    expect(home).toContain("There is always room for you.");
  });
});
