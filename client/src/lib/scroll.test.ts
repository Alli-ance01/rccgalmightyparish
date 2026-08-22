import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRouteScroll } from "./scroll";

describe("resetRouteScroll", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("moves a destination page to the top without a smooth-scroll delay", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });

    resetRouteScroll();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });
});
