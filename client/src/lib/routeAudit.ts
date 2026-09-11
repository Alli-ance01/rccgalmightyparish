export const publicRouteDestinations = [
  "/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/visit", "/contact", "/leadership", "/give",
] as const;

export const memberRouteDestinations = ["/member", "/member/ministry", "/family-hub"] as const;
export const staffRouteDestinations = ["/admin", "/admin/approvals", "/admin/prayer-requests", "/admin/member-insights"] as const;
export const privateRouteDestinations = ["/sign-in", "/master-setup"] as const;
export const legacyRouteRedirects = [{ from: "/account", to: "/sign-in" }, { from: "/news", to: "/announcements" }] as const;

export function routesHaveNoDuplicates(routes: readonly string[]) {
  return new Set(routes).size === routes.length;
}
