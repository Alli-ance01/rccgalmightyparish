import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("application route destinations", () => {
  it("keeps all primary visitor journeys and staff entry points registered", () => {
    const app = source("client/src/App.tsx");
    ["/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/news", "/visit", "/contact", "/leadership", "/give", "/sign-in", "/member", "/member/ministry", "/family-hub", "/admin", "/admin/approvals", "/admin/member-insights"].forEach(path => expect(app).toContain(`path=\"${path}`));
    expect(app).toContain('path="/account" component={LegacyAccountRedirect}');
    expect(app).not.toContain('import Account');
  });

  it("uses one shared sign-in destination and keeps legacy account bookmarks from reaching a dead end", () => {
    const header = source("client/src/components/SiteHeader.tsx");
    const footer = source("client/src/components/SiteFooter.tsx");
    expect(header).toContain('{ label: "Announcements", href: "/announcements" }');
    expect(footer).toContain('{ label: "Sign in", href: "/sign-in" }');
    expect(header).not.toContain('href: "/account"');
    expect(footer).not.toContain('href: "/account"');
    expect(footer).not.toContain('href="#"');
  });
});
