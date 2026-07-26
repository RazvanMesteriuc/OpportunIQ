// Sursa locala minima pentru reports pana exista persistenta reala si ingestia
// de semnale pe server. Nu este sursa finala de adevar, dar muta payload-ul
// de feed din frontend intr-un boundary server-side controlat.
import { reportSeedData } from "./reports-seed.mjs";

export function listSeedReports(limit = 20) {
  const safeLimit = Math.min(50, Math.max(1, Math.round(Number(limit) || 20)));
  return reportSeedData
    .slice(0, safeLimit)
    .map(({ report }) => ({
      ...report,
      aiPriority: report.aiPriority ? { ...report.aiPriority, reasons: [...report.aiPriority.reasons] } : null,
      evidence: report.evidence ? { ...report.evidence } : null,
      aiInsight: report.aiInsight
        ? {
            ...report.aiInsight,
            signalPulse: report.aiInsight.signalPulse ? { ...report.aiInsight.signalPulse } : null,
          }
        : null,
      trustProfile: report.trustProfile ? { ...report.trustProfile } : null,
      freshness: report.freshness
        ? {
            ...report.freshness,
            core: report.freshness.core ? { ...report.freshness.core } : null,
          }
        : null,
      commercialStage: report.commercialStage
        ? {
            ...report.commercialStage,
            reasonCodes: [...(report.commercialStage.reasonCodes ?? [])],
          }
        : null,
    }));
}

function buildSignalIdFromHref(href) {
  return String(href ?? "")
    .split("/")
    .filter(Boolean)
    .at(-1) || `report-${Date.now()}`;
}

function buildSeedSignalView(report) {
  const signalId = buildSignalIdFromHref(report.href);
  const seedEntry = reportSeedData.find((entry) => entry.report.id === report.id);
  const signalView = seedEntry?.signalView ?? {
    imageUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    badgeClassName: "bg-slate-50 border-slate-200",
    badgeTextClassName: "text-slate-700",
    accentClassName: "from-slate-500/10 via-sky-500/10 to-cyan-500/10",
    tags: ["Semnal local", "Interes validabil", "Necesita claritate"],
  };

  return {
    id: signalId,
    title: report.title,
    category: report.niche ?? "Oportunitate",
    location: report.locality || report.city,
    description: report.description,
    score: Math.round(Number(report.profitabilityScore ?? 0)),
    interestedCount: Math.round(Number(report.interestCount ?? 0)),
    ...signalView,
  };
}

function buildSeedOpportunitySummary(report) {
  const seedEntry = reportSeedData.find((entry) => entry.report.id === report.id);
  return seedEntry?.opportunitySummary ?? {
    stage: "idea",
    discussionReady: false,
  };
}

export function listSeedReportRecords(limit = 20) {
  return listSeedReports(limit).map((report) => ({
    reportId: report.id,
    signal: buildSeedSignalView(report),
    opportunity: buildSeedOpportunitySummary(report),
    report,
  }));
}
