import { describe, expect, it } from "vitest";
import { withLocalSessionAuthorization } from "./localSession";

describe("withLocalSessionAuthorization", () => {
  it("forwards the signed per-tab session as a bearer header while preserving existing request headers", () => {
    const headers = withLocalSessionAuthorization({ "Content-Type": "application/json" }, "signed-session-token");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer signed-session-token");
  });

  it("does not add an authorization header when no fallback session exists", () => {
    expect(withLocalSessionAuthorization().has("Authorization")).toBe(false);
  });
});
