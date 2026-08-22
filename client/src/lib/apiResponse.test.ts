import { describe, expect, it } from "vitest";
import { ensureTapApiJsonResponse } from "./apiResponse";

describe("ensureTapApiJsonResponse", () => {
  it("preserves JSON API responses", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    await expect(ensureTapApiJsonResponse(response)).resolves.toBe(response);
  });

  it("turns a Render loading page into a clear retryable message", async () => {
    const response = new Response("Application loading", { status: 503, headers: { "content-type": "text/html" } });
    await expect(ensureTapApiJsonResponse(response)).rejects.toThrow("The TAP service is waking up on Render");
  });
});
