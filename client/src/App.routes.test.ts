import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
describe("application route destinations", () => {
  it("keeps public journeys and the private admin endpoint registered", () => {
    const app = source("client/src/App.tsx");
    ["/", "/about", "/ministries", "/junior-church", "/sermons", "/events", "/announcements", "/media", "/visit", "/contact", "/leadership", "/give", "/sign-in", "/master-setup", "/admin", "/admin/prayer-requests"].forEach(path => expect(app).toContain(`path=\"${path}`));
    expect(app).not.toContain('path="/member"'); expect(app).not.toContain('path="/family-hub"'); expect(app).not.toContain('path="/admin/member-insights"');
  });
  it("keeps sign-in and admin links out of public navigation", () => {
    const header = source("client/src/components/SiteHeader.tsx"); const footer = source("client/src/components/SiteFooter.tsx");
    expect(header).not.toContain('{ label: "Sign in", href: "/sign-in" }'); expect(footer).not.toContain('{ label: "Sign in", href: "/sign-in" }'); expect(header).not.toContain('{ label: "News", href: "/news" }');
  });
  it("uses a single administrator workspace", () => { expect(source("client/src/pages/SignIn.tsx")).toContain('setLocation("/admin")'); expect(source("client/src/components/DashboardLayout.tsx")).not.toContain('role === "member"'); });
});
