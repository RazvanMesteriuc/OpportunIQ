import { useEffect, useState } from "react";
import { getTrackingHeaders } from "./visitor-tracking";
import { buildSignalContactSummaryFromRuntimeLead } from "./signal-action-kernel-adapter";
import {
  SIGNAL_INTENT_TYPES,
  type SignalContactRequestSummary,
  type SignalIntentType,
  type SignalOutcomeAggregate,
  type SignalOutcomeType,
} from "./signal-action-kernel-contract";

export type ReportIntentAggregate = {
  currentSelection: SignalIntentType | null;
  totalSelections: number;
  totals: Partial<Record<SignalIntentType, number>>;
};

type ReportContactSummaryPayload = {
  contactSummary?: SignalContactRequestSummary | null;
};

type ReportOutcomeAggregatePayload = {
  total?: unknown;
  byType?: Record<string, unknown>;
};

function isSignalIntentType(value: unknown): value is SignalIntentType {
  return typeof value === "string" && SIGNAL_INTENT_TYPES.includes(value as SignalIntentType);
}

function isSignalOutcomeType(value: unknown): value is SignalOutcomeType {
  return value === "useful_conversation"
    || value === "collaboration_started"
    || value === "offer_tested"
    || value === "project_launched"
    || value === "business_opened";
}

async function fetchReportIntentAggregate(reportId: string | number): Promise<ReportIntentAggregate | null> {
  const response = await fetch(`/api/analytics/reports/${reportId}/intent-aggregate`, {
    headers: getTrackingHeaders(),
  });
  if (!response.ok) return null;
  const payload = await response.json() as {
    currentSelection?: unknown;
    totalSelections?: unknown;
    totals?: Record<string, unknown>;
  };

  const totals = Object.fromEntries(
    Object.entries(payload.totals ?? {})
      .filter(([key]) => isSignalIntentType(key))
      .map(([key, value]) => [key, Number(value ?? 0)]),
  ) as Partial<Record<SignalIntentType, number>>;

  return {
    currentSelection: isSignalIntentType(payload.currentSelection) ? payload.currentSelection : null,
    totalSelections: Number(payload.totalSelections ?? 0),
    totals,
  };
}

async function fetchReportContactSummary(reportId: string | number): Promise<SignalContactRequestSummary | null> {
  const response = await fetch(`/api/analytics/reports/${reportId}/contact-summary`, {
    headers: getTrackingHeaders(),
  });
  if (!response.ok) return null;
  const payload = await response.json() as ReportContactSummaryPayload;
  const summary = payload.contactSummary;
  if (!summary) return null;

  return buildSignalContactSummaryFromRuntimeLead({
    targetEntityId: summary.targetEntityId,
    signalEntityId: summary.signalEntityId,
    status:
      summary.status === "pending"
        ? "new"
        : summary.status === "accepted"
          ? "contacted"
          : "archived",
    createdAt: summary.createdAt ?? null,
    acceptedAt: summary.acceptedAt ?? null,
  });
}

async function fetchReportOutcomeAggregate(reportId: string | number): Promise<SignalOutcomeAggregate | null> {
  const response = await fetch(`/api/analytics/reports/${reportId}/outcome-aggregate`, {
    headers: getTrackingHeaders(),
  });
  if (!response.ok) return null;
  const payload = await response.json() as ReportOutcomeAggregatePayload;
  const byType = Object.fromEntries(
    Object.entries(payload.byType ?? {})
      .filter(([key]) => isSignalOutcomeType(key))
      .map(([key, value]) => [key, Number(value ?? 0)]),
  ) as Partial<Record<SignalOutcomeType, number>>;
  const total = Math.max(
    Number(payload.total ?? 0),
    Object.values(byType).reduce((sum, count) => sum + Number(count || 0), 0),
  );
  return total > 0 ? { total, byType } : null;
}

export function useReportSignalEngagement(reportId?: string | number | null) {
  const [selectedIntentType, setSelectedIntentType] = useState<SignalIntentType | null>(null);
  const [reportIntentAggregate, setReportIntentAggregate] = useState<ReportIntentAggregate | null>(null);
  const [reportContactSummary, setReportContactSummary] = useState<SignalContactRequestSummary | null>(null);
  const [reportOutcomeAggregate, setReportOutcomeAggregate] = useState<SignalOutcomeAggregate | null>(null);

  useEffect(() => {
    if (!reportId) {
      setReportIntentAggregate(null);
      return;
    }

    let cancelled = false;
    fetchReportIntentAggregate(reportId)
      .then((aggregate) => {
        if (cancelled) return;
        setReportIntentAggregate(aggregate);
        if (!selectedIntentType && aggregate?.currentSelection && isSignalIntentType(aggregate.currentSelection)) {
          setSelectedIntentType(aggregate.currentSelection);
        }
      })
      .catch(() => {
        if (!cancelled) setReportIntentAggregate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId, selectedIntentType]);

  useEffect(() => {
    if (!reportId) {
      setReportContactSummary(null);
      return;
    }

    let cancelled = false;
    fetchReportContactSummary(reportId)
      .then((summary) => {
        if (!cancelled) setReportContactSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setReportContactSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  useEffect(() => {
    if (!reportId) {
      setReportOutcomeAggregate(null);
      return;
    }

    let cancelled = false;
    fetchReportOutcomeAggregate(reportId)
      .then((aggregate) => {
        if (!cancelled) setReportOutcomeAggregate(aggregate);
      })
      .catch(() => {
        if (!cancelled) setReportOutcomeAggregate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  return {
    selectedIntentType,
    setSelectedIntentType,
    reportIntentAggregate,
    reportContactSummary,
    reportOutcomeAggregate,
  };
}
