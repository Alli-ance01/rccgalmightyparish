const SESSION_TOKEN_KEY = "tap-local-session-token";

export function getLocalSessionToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function storeLocalSessionToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearLocalSessionToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
}
