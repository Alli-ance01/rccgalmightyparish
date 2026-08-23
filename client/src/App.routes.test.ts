import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("application route destinations", () => {
  it("keeps all primary visitor journeys and staff entry points registered", () => {
    const app = source("client/src/App.tsx");
    ["/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/news", "/visit", "/contact", "/leadership", "/give", "/sign-in", "/member", "/admin", "/admin/approvals"].forEach(path => expect(app).toContain(`path=\"${path}`));
    expect(app).not.toContain('path="/account"');
  });

  it("uses an intentional staff sign-in destination and exposes account and announcement routes from shared navigation", () => {
    const header = source("client/src/components/SiteHeader.tsx");
    const footer = source("client/src/components/SiteFooter.tsx");
    expect(header).toContain('{ label: "Announcements", href: "/announcements" }');
    expect(footer).toContain('{ label: "Staff sign in", href: "/sign-in" }');
    expect(header).not.toContain('href: "/account"');
    expect(footer).not.toContain('href: "/account"');
    expect(footer).not.toContain('href="#"');
  });
});
