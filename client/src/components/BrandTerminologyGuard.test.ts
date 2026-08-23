import { describe, expect, it } from "vitest";
import { normalizeBrandTerminology } from "./BrandTerminologyGuard";

describe("normalizeBrandTerminology", () => {
  it("replaces the old church label while keeping RCCG TAP as the only abbreviation", () => {
    expect(normalizeBrandTerminology("Welcome to TAP Church. Use your TAP account and make TAP home.")).toBe("Welcome to RCCG, The Almighty Parish. Use your RCCG TAP account and make RCCG TAP home.");
  });
});
