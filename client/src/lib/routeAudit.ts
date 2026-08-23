export const publicRouteDestinations = [
  "/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/news", "/visit", "/contact", "/leadership", "/give", "/account", "/sign-in",
] as const;

export function routesHaveNoDuplicates(routes: readonly string[]) {
  return new Set(routes).size === routes.length;
}
