import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global keyboard focus treatment", () => {
  it("keeps a visible focus indicator for interactive public and staff controls", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 3px solid #0b4ab8");
    expect(css).toContain("outline-offset: 3px");
  });
});
