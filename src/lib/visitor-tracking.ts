import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

const VISITOR_ID_KEY = "opp_visitor_id";
const ANALYTICS_ENDPOINT = () => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/analytics/track`;

export type ClientAnalyticsActionType =
  | "page_view"
  | "feed_impression"
  | "feed_card_open"
  | "signal_open"
  | "signal_intent_selected"
  | "company_open"
  | "article_open"
  | "map_item_open"
  | "watch_add"
  | "watch_remove"
  | "compare_add"
  | "compare_remove"
  | "save_item"
  | "digest_subscribe"
  | "alert_subscribe"
  | "dismiss_item"
  | "mark_not_relevant"
  | "mark_too_far"
  | "mark_wrong_industry"
  | "mark_low_quality"
  | "mark_already_seen"
  | "request_answer_start"
  | "company_contact_start"
  | "promotion_quote_requested"
  | "promotion_checkout_started"
  | "lead_inbox_open"
  | "lead_created"
  | "lead_contacted"
  | "lead_qualified"
  | "lead_archived"
  | "promotion_paid";

export type ClientAnalyticsEvent = {
  actionType: ClientAnalyticsActionType;
  entityType?: string | null;
  entityId?: string | number | null;
  path?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
};

function buildFallbackId(): string {
  return `opp-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server-render";
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const created = typeof window.crypto?.randomUUID === "function"
      ? `opp-${window.crypto.randomUUID()}`
      : buildFallbackId();
    window.localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return buildFallbackId();
  }
}

export function getVisitorHeaders(): Record<string, string> {
  return { "x-visitor-id": getVisitorId() };
}

export function getTrackingHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getVisitorHeaders(),
  };

  if (typeof window === "undefined") return headers;
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Tracking must remain best-effort.
  }
  return headers;
}

function getCurrentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search || ""}`;
}

function normalizeClientEvent(input: ClientAnalyticsEvent): ClientAnalyticsEvent {
  return {
    ...input,
    path: input.path ?? getCurrentPath(),
    referrer: input.referrer ?? (typeof document === "undefined" ? null : document.referrer || null),
  };
}

export async function trackClientEvent(input: ClientAnalyticsEvent): Promise<void> {
  if (typeof window === "undefined") return;
  const payload = normalizeClientEvent(input);
  await fetch(ANALYTICS_ENDPOINT(), {
    method: "POST",
    keepalive: true,
    headers: getTrackingHeaders(),
    body: JSON.stringify(payload),
  }).catch(() => {
    // Tracking must never block the main UX path.
  });
}

export async function trackClientEvents(inputs: ClientAnalyticsEvent[]): Promise<void> {
  if (typeof window === "undefined" || inputs.length === 0) return;
  const events = inputs.map(normalizeClientEvent);
  await fetch(ANALYTICS_ENDPOINT(), {
    method: "POST",
    keepalive: true,
    headers: getTrackingHeaders(),
    body: JSON.stringify({ events }),
  }).catch(() => {
    // Tracking must never block the main UX path.
  });
}
