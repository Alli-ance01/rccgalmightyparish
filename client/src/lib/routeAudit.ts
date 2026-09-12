export const publicRouteDestinations = [
  "/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/visit", "/contact", "/leadership", "/give",
] as const;
export const adminRouteDestinations = ["/admin"] as const;
export const privateRouteDestinations = ["/sign-in", "/master-setup"] as const;
export const legacyRouteRedirects = [{ from: "/account", to: "/sign-in" }, { from: "/news", to: "/announcements" }] as const;
export function routesHaveNoDuplicates(routes: readonly string[]) { return new Set(routes).size === routes.length; }
