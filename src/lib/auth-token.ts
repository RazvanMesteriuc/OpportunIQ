export const AUTH_TOKEN_KEY = "opp_auth_token";

function dispatchAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("opp-auth-changed"));
}

export function readAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    return;
  }
  dispatchAuthChanged();
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    return;
  }
  dispatchAuthChanged();
}

export function ensureLocalAuthSession(seed?: string | null): string {
  const existing = readAuthToken();
  if (existing) return existing;

  const normalizedSeed = String(seed ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const token = `local-${normalizedSeed || "user"}-${Date.now()}`;
  writeAuthToken(token);
  return token;
}
