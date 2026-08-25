import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("interactive parish platform", () => {
  it("keeps Junior Church parent-led and uses the corrected category names", () => {
    const junior = source("client/src/pages/JuniorChurch.tsx");
    const family = source("client/src/pages/FamilyHub.tsx");
    const options = source("client/src/lib/memberOptions.ts");
    expect(junior).toContain("Family Hub");
    expect(family).toContain("No child profiles or direct child accounts");
    expect(options).toContain('label: "Junior Teens"');
    expect(options).toContain('label: "0–5"');
  });

  it("limits staff member insights to the dedicated protected workspace", () => {
    const page = source("client/src/pages/MemberInsights.tsx");
    const layout = source("client/src/components/DashboardLayout.tsx");
    expect(page).toContain("Administrator access required");
    expect(page).toContain("No child names or child accounts are displayed or stored.");
    expect(layout).toContain('label: "Member insights"');
    expect(layout).toContain("adminOnly: true");
  });

  it("keeps targeted parish notes inside My Parish and preference-matched", () => {
    const member = source("client/src/pages/MemberDashboard.tsx");
    const insights = source("client/src/pages/MemberInsights.tsx");
    expect(member).toContain("Matched for you");
    expect(member).toContain("memberHub.updates.useQuery");
    expect(insights).toContain("It does not send email, SMS, or WhatsApp messages.");
    expect(insights).toContain("Publish in My Parish");
  });

  it("respects parish-update opt-out and redirects non-members from Family Hub through an effect", () => {
    const database = source("server/db.ts");
    const family = source("client/src/pages/FamilyHub.tsx");
    expect(database).toContain("if (profile && !profile.wantsParishUpdates) return []");
    expect(family).toContain('useEffect(() => { if (user && user.role !== "member") setLocation("/admin"); }');
    expect(family).not.toContain('if (user.role !== "member") { setLocation("/admin")');
  });
});
