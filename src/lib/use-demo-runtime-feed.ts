import { buildDemoFeedReportRecords } from "@/lib/demo-feed-reports";
import { reportDebugEvent } from "@/lib/debug-event-client";
import { buildUnifiedFeedItemsWithExternalRuntime, type UnifiedFeedItem } from "@/lib/feed-items";
import { fetchReports } from "@/lib/reports-api-client";
import type { ReportSeedRecord } from "@/lib/reports-api-contract";
import { useProfile } from "@/lib/use-profile";
import { useCallback, useEffect, useMemo, useState } from "react";

export type DemoRuntimeFeedState = {
  hydrated: boolean;
  demoRecords: ReportSeedRecord[];
  runtimeFeedItems: Record<number, UnifiedFeedItem>;
  runtimeLoading: boolean;
  runtimeError: string | null;
  refresh: () => Promise<void>;
};

function resolveExternalRuntimeFallbackMessage(reason?: string | null): string {
  const normalized = String(reason ?? "").trim().toLowerCase();
  if (normalized === "google_places_not_configured") {
    return "Datele de bază rămân locale și utilizabile, dar Google Places nu este configurat în acest mediu. Semnalele nu pot fi îmbogățite acum cu review-uri, competitori și context local extern.";
  }
  if (normalized === "openai_not_configured") {
    return "Datele de bază rămân locale și utilizabile, dar analiza AI a review-urilor nu este configurată în acest mediu. Semnalele folosesc doar datele locale și regulile deterministe disponibile acum.";
  }
  if (normalized === "provider_access_required") {
    return "Datele de bază rămân locale și utilizabile, dar accesul la furnizorii externi nu este disponibil în acest mediu. Semnalele folosesc doar datele locale disponibile acum.";
  }
  if (
    normalized === "rate_limited"
    || normalized === "network_error"
    || normalized === "request_error"
    || normalized === "http_501"
    || normalized === "runtime_error"
  ) {
    return "Datele de bază rămân locale și utilizabile, dar îmbogățirea externă a eșuat temporar. Afișăm varianta locală până când sursele externe răspund din nou.";
  }
  return "Datele de bază rămân locale și utilizabile, dar îmbogățirea externă nu a putut fi aplicată acum. Afișăm varianta locală disponibilă.";
}

function resolveReportsFallbackMessage(status: "network_error" | "request_error" | "invalid_response"): string {
  if (status === "network_error") {
    return "Feed-ul persistent de rapoarte locale nu a răspuns din rețea. Afișăm seed-ul demo local pentru continuitatea interfeței, nu pentru validare de produs.";
  }
  if (status === "invalid_response") {
    return "Feed-ul persistent de rapoarte locale a răspuns cu un payload invalid. Afișăm seed-ul demo local pentru continuitatea interfeței, nu pentru validare de produs.";
  }
  return "Feed-ul persistent de rapoarte locale a răspuns cu eroare. Afișăm seed-ul demo local pentru continuitatea interfeței, nu pentru validare de produs.";
}

function resolveRuntimeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();
  if (
    normalized.includes("google_places_not_configured")
    || normalized.includes("openai_not_configured")
    || normalized.includes("provider_access_required")
    || normalized.includes("http_501")
  ) {
    return resolveExternalRuntimeFallbackMessage(message);
  }
  return resolveExternalRuntimeFallbackMessage("runtime_error");
}

export function useDemoRuntimeFeed(input?: { limit?: number; maxItems?: number }): DemoRuntimeFeedState {
  const limit = input?.limit ?? 4;
  const maxItems = input?.maxItems ?? 50;
  const { profile, hydrated } = useProfile();
  const fallbackRecords = useMemo(() => buildDemoFeedReportRecords(limit), [limit]);
  const [demoRecords, setDemoRecords] = useState<ReportSeedRecord[]>(fallbackRecords);
  const [runtimeFeedItems, setRuntimeFeedItems] = useState<Record<number, UnifiedFeedItem>>({});
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    //#region debug-point runtime-feed-refresh-start
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "useDemoRuntimeFeed",
      point: "refresh:start",
      limit,
      maxItems,
      hydrated,
      profileSetup: profile.setup,
      timestamp: Date.now(),
    });
    //#endregion debug-point runtime-feed-refresh-start
    setRuntimeLoading(true);
    setRuntimeError(null);
    try {
      const reportsResult = await fetchReports({ limit });
      const reports =
        reportsResult.status === "ok" && reportsResult.data?.reports?.length
          ? reportsResult.data.reports
          : fallbackRecords.map((record) => record.report);

      const records =
        reportsResult.status === "ok" && reportsResult.data?.records?.length
          ? reportsResult.data.records
          : fallbackRecords;

      const runtimeResult = await buildUnifiedFeedItemsWithExternalRuntime({
        reports,
        profile,
        maxItems,
      });
      const nextMap = Object.fromEntries(
        runtimeResult.items
          .filter((item) => item.source === "report")
          .map((item) => [Number(item.entityId), item]),
      ) as Record<number, UnifiedFeedItem>;
      setDemoRecords(records);
      setRuntimeFeedItems(nextMap);
      if (reportsResult.status !== "ok") {
        setRuntimeError(resolveReportsFallbackMessage(reportsResult.status));
      } else if (runtimeResult.usedLocalRuntimeFallback) {
        setRuntimeError(resolveExternalRuntimeFallbackMessage(runtimeResult.runtimeFallbackReason));
      }
      //#region debug-point runtime-feed-refresh-success
      reportDebugEvent({
        sessionId: "frontend-stack-overflow",
        area: "useDemoRuntimeFeed",
        point: "refresh:success",
        reportsStatus: reportsResult.status,
        usedLocalRuntimeFallback: runtimeResult.usedLocalRuntimeFallback,
        itemsCount: runtimeResult.items.length,
        timestamp: Date.now(),
      });
      //#endregion debug-point runtime-feed-refresh-success
    } catch (error) {
      setRuntimeError(resolveRuntimeErrorMessage(error));
      setDemoRecords(fallbackRecords);
    } finally {
      setRuntimeLoading(false);
    }
  }, [fallbackRecords, maxItems, profile]);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  useEffect(() => {
    //#region debug-point runtime-feed-error-change
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "useDemoRuntimeFeed",
      point: "runtimeError:change",
      runtimeError,
      runtimeLoading,
      timestamp: Date.now(),
    });
    //#endregion debug-point runtime-feed-error-change
  }, [runtimeError, runtimeLoading]);

  return {
    hydrated,
    demoRecords,
    runtimeFeedItems,
    runtimeLoading,
    runtimeError,
    refresh,
  };
}
