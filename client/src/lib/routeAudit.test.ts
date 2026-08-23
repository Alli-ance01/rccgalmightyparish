import { describe, expect, it } from "vitest";
import { publicRouteDestinations, routesHaveNoDuplicates } from "./routeAudit";

describe("public route destinations", () => {
  it("keeps the key visitor journeys direct and non-duplicated", () => {
    expect(routesHaveNoDuplicates(publicRouteDestinations)).toBe(true);
    expect(publicRouteDestinations).toEqual(expect.arrayContaining(["/visit", "/sermons", "/announcements", "/account", "/sign-in"]));
  });
});
