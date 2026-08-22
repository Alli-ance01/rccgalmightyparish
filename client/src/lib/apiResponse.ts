export async function ensureTapApiJsonResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) return response;

  const body = await response.text().catch(() => "");
  const serviceIsWaking = response.status === 503 || body.includes("Application loading") || body.includes("Service waking up");
  if (serviceIsWaking) {
    throw new Error("The TAP service is waking up on Render. Please wait about a minute, then try again.");
  }
  throw new Error("The TAP API returned an unexpected response. Please refresh the page and try again.");
}
