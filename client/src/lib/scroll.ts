export function resetRouteScroll() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
}
