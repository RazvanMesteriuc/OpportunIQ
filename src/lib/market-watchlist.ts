import { useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";
import { trackClientEvent } from "@/lib/visitor-tracking";

export type WatchlistEntityType = "county" | "city" | "niche" | "company" | "report";

export interface WatchlistItem {
  key: string;
  type: WatchlistEntityType;
  label: string;
  href?: string;
  city?: string | null;
  countyCode?: string | null;
  niche?: string | null;
  reportId?: number | null;
  companyId?: number | null;
  meta?: Record<string, string | number | boolean | null>;
  addedAt: string;
}

export interface CompareReportItem {
  id: number;
  title: string;
  city: string;
  niche: string;
  profitabilityScore: number;
  confidenceScore: number;
  verdict: string;
  price: number;
  accessTier?: "hidden" | "free" | "premium";
  investmentMin?: number | null;
  profitMonthly?: number | null;
}

const WATCHLIST_KEY = "opp_market_watchlist";
const COMPARE_KEY = "opp_report_compare";
const CHANGE_EVENT = "opp-market-watchlist-change";
const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

function emitChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch { return null; }
}

function getCurrentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search || ""}`;
}

export function readWatchlist(): WatchlistItem[] {
  return safeRead<WatchlistItem[]>(WATCHLIST_KEY, []);
}

export function isWatchlisted(key: string): boolean {
  return readWatchlist().some((item) => item.key === key);
}

export function toggleWatchlist(item: Omit<WatchlistItem, "addedAt">): WatchlistItem[] {
  const current = readWatchlist();
  const exists = current.some((entry) => entry.key === item.key);
  const next = exists
    ? current.filter((entry) => entry.key !== item.key)
    : [{ ...item, addedAt: new Date().toISOString() }, ...current].slice(0, 80);
  safeWrite(WATCHLIST_KEY, next);
  const token = getAuthToken();
  if (token) {
    fetch(`${BASE()}/api/me/digest`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        counties: next.filter((entry) => entry.type === "county").map((entry) => entry.label).join(", "),
        industries: next.filter((entry) => entry.type === "niche").map((entry) => entry.label).join(", "),
      }),
    }).catch(() => {});
  }
  void trackClientEvent({
    actionType: exists ? "watch_remove" : "watch_add",
    entityType: item.type,
    entityId: item.reportId ?? item.companyId ?? item.key,
    path: getCurrentPath(),
    metadata: {
      key: item.key,
      label: item.label,
      watchType: item.type,
      city: item.city ?? null,
      countyCode: item.countyCode ?? null,
      niche: item.niche ?? null,
      href: item.href ?? null,
      ...(item.meta ?? {}),
    },
  });
  emitChange();
  return next;
}

export function readCompareReports(): CompareReportItem[] {
  return safeRead<CompareReportItem[]>(COMPARE_KEY, []);
}

export function isComparedReport(id: number): boolean {
  return readCompareReports().some((item) => item.id === id);
}

export function toggleCompareReport(item: CompareReportItem): { items: CompareReportItem[]; added: boolean } {
  const current = readCompareReports();
  const exists = current.some((entry) => entry.id === item.id);
  let next = exists
    ? current.filter((entry) => entry.id !== item.id)
    : [item, ...current].slice(0, 4);
  if (!exists && next.length > 4) next = next.slice(0, 4);
  safeWrite(COMPARE_KEY, next);
  void trackClientEvent({
    actionType: exists ? "compare_remove" : "compare_add",
    entityType: "report",
    entityId: item.id,
    path: getCurrentPath(),
    metadata: {
      title: item.title,
      city: item.city,
      niche: item.niche,
      profitabilityScore: item.profitabilityScore,
      confidenceScore: item.confidenceScore,
      verdict: item.verdict,
      accessTier: item.accessTier ?? null,
    },
  });
  emitChange();
  return { items: next, added: !exists };
}

export function clearCompareReports(): CompareReportItem[] {
  safeWrite(COMPARE_KEY, []);
  emitChange();
  return [];
}

export function useMarketWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(() => readWatchlist());
  const [compareItems, setCompareItems] = useState<CompareReportItem[]>(() => readCompareReports());

  useEffect(() => {
    const sync = () => {
      setItems(readWatchlist());
      setCompareItems(readCompareReports());
    };
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleItem = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    const next = toggleWatchlist(item);
    setItems(next);
    return next;
  }, []);

  const toggleCompare = useCallback((item: CompareReportItem) => {
    const next = toggleCompareReport(item);
    setCompareItems(next.items);
    return next;
  }, []);

  const clearCompare = useCallback(() => {
    const next = clearCompareReports();
    setCompareItems(next);
  }, []);

  const watchSet = useMemo(() => new Set(items.map((item) => item.key)), [items]);
  const compareSet = useMemo(() => new Set(compareItems.map((item) => item.id)), [compareItems]);

  return {
    items,
    compareItems,
    watchSet,
    compareSet,
    toggleItem,
    toggleCompare,
    clearCompare,
  };
}
