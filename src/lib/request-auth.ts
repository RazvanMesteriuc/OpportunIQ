import { AUTH_TOKEN_KEY } from "@/lib/auth-token";
import { getVisitorHeaders } from "@/lib/visitor-tracking";

export function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}`, ...getVisitorHeaders() } : getVisitorHeaders();
  } catch {
    return getVisitorHeaders();
  }
}
