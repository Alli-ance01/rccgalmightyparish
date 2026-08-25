import { describe, expect, it } from "vitest";
import { legacyRouteRedirects, memberRouteDestinations, publicRouteDestinations, routesHaveNoDuplicates, staffRouteDestinations } from "./routeAudit";

describe("public route destinations", () => {
  it("keeps the key visitor journeys direct and non-duplicated", () => {
    expect(routesHaveNoDuplicates(publicRouteDestinations)).toBe(true);
    expect(publicRouteDestinations).toEqual(expect.arrayContaining(["/visit", "/sermons", "/announcements", "/sign-in"]));
    expect(publicRouteDestinations).not.toContain("/account");
    expect(routesHaveNoDuplicates(memberRouteDestinations)).toBe(true);
    expect(routesHaveNoDuplicates(staffRouteDestinations)).toBe(true);
    expect(legacyRouteRedirects).toContainEqual({ from: "/account", to: "/sign-in" });
  });
});
