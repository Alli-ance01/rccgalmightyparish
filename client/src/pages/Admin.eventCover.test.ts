import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("staff event cover uploader", () => {
  it("uses the protected event-cover upload contract and preserves a preview before save", () => {
    const admin = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(admin).toContain("trpc.content.events.uploadCover.useMutation()");
    expect(admin).toContain("Uploading event cover…");
    expect(admin).toContain("Event cover uploaded. Save the event to publish this change.");
    expect(admin).toContain("Event cover preview");
    expect(admin).toContain("Remove cover");
  });
});
