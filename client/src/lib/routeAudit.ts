export const publicRouteDestinations = [
  "/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/news", "/visit", "/contact", "/leadership", "/give", "/sign-in",
] as const;

export const memberRouteDestinations = ["/member", "/member/ministry", "/family-hub"] as const;
export const staffRouteDestinations = ["/admin", "/admin/approvals", "/admin/prayer-requests", "/admin/member-insights"] as const;
export const legacyRouteRedirects = [{ from: "/account", to: "/sign-in" }] as const;

export function routesHaveNoDuplicates(routes: readonly string[]) {
  return new Set(routes).size === routes.length;
}
