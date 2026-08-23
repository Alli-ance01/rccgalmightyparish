import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("member dashboard routing", () => {
  it("keeps member care private and redirects staff to the staff workspace", () => {
    const page = readFileSync(resolve(process.cwd(), "client/src/pages/MemberDashboard.tsx"), "utf8");
    const signIn = readFileSync(resolve(process.cwd(), "client/src/pages/SignIn.tsx"), "utf8");
    expect(signIn).toContain('user.user.role === "member" ? "/member" : "/admin"');
    expect(page).toContain('redirectPath: "/sign-in"');
    expect(page).toContain('if (user && user.role !== "member") setLocation("/admin")');
    expect(page).toContain("Retry dashboard");
    expect(page).toContain("We could not open your dashboard.");
    expect(page).toContain("Member dashboard");
  });
});
