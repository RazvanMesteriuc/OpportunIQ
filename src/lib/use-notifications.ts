import { useCallback, useEffect, useMemo, useState } from "react";
import { readWatchlist } from "@/lib/market-watchlist";
import { buildOpportunityPath, buildSignalPath } from "@/lib/mock-opportunity-space";
import { mockSignals } from "@/lib/mock-signals";
import {
  OPPORTUNITY_REPOSITORY_CHANGE_EVENT,
  getOpportunityRepository,
} from "@/lib/opportunity-repository";
import { getControlledMessageRepository } from "@/lib/controlled-message-repository";

export type NotificationKind = "report" | "trending_article" | "watch_signal" | "company_activity";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  href: string;
  score: number | null;
  timestamp: string;
  meta?: Record<string, unknown>;
}

const NOTIFICATION_READ_AT_KEY = "opp_notifications_last_read_at";
const WATCHLIST_CHANGE_EVENT = "opp-market-watchlist-change";
const MESSAGE_CHANGE_EVENT = "opp-controlled-messages-change";

const opportunityRepository = getOpportunityRepository();
const controlledMessageRepository = getControlledMessageRepository();

function readLastReadAt(): string {
  try {
    return localStorage.getItem(NOTIFICATION_READ_AT_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeLastReadAt(value: string) {
  try {
    localStorage.setItem(NOTIFICATION_READ_AT_KEY, value);
  } catch {
    // noop
  }
}

function minutesAgo(value: number): string {
  return new Date(Date.now() - value * 60_000).toISOString();
}

function buildNotificationSnapshot(): NotificationItem[] {
  const reportItems = [...mockSignals]
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((signal, index) => ({
      id: `report:${signal.id}`,
      kind: "report" as const,
      title: signal.title,
      subtitle: `${signal.category} · ${signal.location}`,
      href: buildSignalPath(signal.id),
      score: signal.score,
      timestamp: minutesAgo((index + 1) * 18),
      meta: {
        signalId: signal.id,
      },
    }));

  const watchlistItems = readWatchlist()
    .slice(0, 5)
    .map((item, index) => ({
      id: `watch:${item.key}`,
      kind: "watch_signal" as const,
      title: item.label,
      subtitle: item.niche || item.city || "Element urmărit în watchlist",
      href: item.href || "/semnale",
      score: null,
      timestamp: item.addedAt || minutesAgo((index + 1) * 25),
      meta: item.meta,
    }));

  const introductionItems = opportunityRepository
    .listIntroductionRequests()
    .slice(0, 5)
    .map((request, index) => ({
      id: `intro:${request.id}`,
      kind: "company_activity" as const,
      title:
        request.status === "accepted"
          ? `Introducere acceptată: ${request.targetLabel}`
          : request.status === "rejected"
            ? `Introducere respinsă: ${request.targetLabel}`
            : `Cerere trimisă către ${request.targetLabel}`,
      subtitle:
        request.status === "accepted"
          ? "Poți continua conversația controlată."
          : request.status === "rejected"
            ? "Contextul rămâne în spațiul oportunității."
            : "Așteaptă validarea înainte de mesaj.",
      href:
        request.status === "accepted"
          ? "/mesaje"
          : buildOpportunityPath(request.signalId),
      score: null,
      timestamp: request.updatedAt || request.createdAt || minutesAgo((index + 1) * 35),
      meta: {
        requestId: request.id,
        signalId: request.signalId,
      },
    }));

  const threadItems = controlledMessageRepository
    .listThreads()
    .slice(0, 3)
    .map((thread, index) => ({
      id: `thread:${thread.id}`,
      kind: "company_activity" as const,
      title: thread.title,
      subtitle: thread.preview,
      href: "/mesaje",
      score: thread.messageCount,
      timestamp: thread.updatedAt || thread.createdAt || minutesAgo((index + 1) * 42),
      meta: {
        threadId: thread.id,
        signalId: thread.signalId,
      },
    }));

  return [...threadItems, ...introductionItems, ...watchlistItems, ...reportItems]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>(() => buildNotificationSnapshot());
  const [lastReadAt, setLastReadAt] = useState(() => readLastReadAt());

  const refresh = useCallback(() => {
    setItems(buildNotificationSnapshot());
  }, []);

  useEffect(() => {
    refresh();
    const sync = () => refresh();
    window.addEventListener("storage", sync);
    window.addEventListener(WATCHLIST_CHANGE_EVENT, sync);
    window.addEventListener(OPPORTUNITY_REPOSITORY_CHANGE_EVENT, sync);
    window.addEventListener(MESSAGE_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WATCHLIST_CHANGE_EVENT, sync);
      window.removeEventListener(OPPORTUNITY_REPOSITORY_CHANGE_EVENT, sync);
      window.removeEventListener(MESSAGE_CHANGE_EVENT, sync);
    };
  }, [refresh]);

  const unreadCount = useMemo(() => {
    const readAt = new Date(lastReadAt).getTime();
    if (!readAt) return items.length;
    return items.filter((item) => new Date(item.timestamp).getTime() > readAt).length;
  }, [items, lastReadAt]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    writeLastReadAt(now);
    setLastReadAt(now);
  }, []);

  const markAsRead = useCallback((id: string) => {
    const item = items.find((entry) => entry.id === id);
    const next = item?.timestamp || new Date().toISOString();
    writeLastReadAt(next);
    setLastReadAt(next);
  }, [items]);

  return {
    items,
    notifications: items,
    unreadCount,
    loading: false,
    markAsRead,
    markAllRead,
    markAllAsRead: markAllRead,
    refresh,
    detectNewSinceLast: (prev: NotificationItem[], next: NotificationItem[]): NotificationItem[] => {
      const previousIds = new Set(prev.map((item) => item.id));
      return next.filter((item) => !previousIds.has(item.id));
    },
  };
}
