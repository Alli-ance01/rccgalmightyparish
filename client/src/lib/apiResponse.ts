export const TAP_API_TIMEOUT_MS = 30_000;

export async function fetchTapApi(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetcher: typeof fetch = globalThis.fetch,
  timeoutMs = TAP_API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const abortWithCaller = () => controller.abort();
  init?.signal?.addEventListener("abort", abortWithCaller, { once: true });
  try {
    const response = await fetcher(input, { ...(init ?? {}), signal: controller.signal });
    return ensureTapApiJsonResponse(response);
  } catch (error) {
    if (timedOut) throw new Error("The RCCG TAP service took too long to respond. Please try again in a moment.");
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    init?.signal?.removeEventListener("abort", abortWithCaller);
  }
}

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
