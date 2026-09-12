import { describe, expect, it } from "vitest";
import { adminRouteDestinations, legacyRouteRedirects, privateRouteDestinations, publicRouteDestinations, routesHaveNoDuplicates } from "./routeAudit";
describe("route destinations", () => {
  it("keeps public and private routes distinct and non-duplicated", () => {
    expect(routesHaveNoDuplicates(publicRouteDestinations)).toBe(true);
    expect(publicRouteDestinations).toEqual(expect.arrayContaining(["/visit", "/sermons", "/announcements"]));
    expect(publicRouteDestinations).not.toContain("/sign-in");
    expect(privateRouteDestinations).toEqual(expect.arrayContaining(["/sign-in", "/master-setup"]));
    expect(adminRouteDestinations).toEqual(["/admin"]);
    expect(legacyRouteRedirects).toContainEqual({ from: "/account", to: "/sign-in" });
    expect(legacyRouteRedirects).toContainEqual({ from: "/news", to: "/announcements" });
  });
});
