import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("account loading recovery", () => {
  it("provides a retry path instead of an indefinite loading message", () => {
    const account = readFileSync(resolve(process.cwd(), "client/src/pages/Account.tsx"), "utf8");
    const footer = readFileSync(resolve(process.cwd(), "client/src/components/SiteFooter.tsx"), "utf8");
    expect(account).toContain("Still connecting?");
    expect(account).toContain("Retry account");
    expect(account).toContain("We could not open your account.");
    expect(footer).toContain('{ label: "My account", href: "/account" }');
  });
});
