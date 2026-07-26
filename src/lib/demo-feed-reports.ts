import type { FeedReportInput } from "@/lib/feed-items";
import { mockSignals, type MockSignal } from "@/lib/mock-signals";
import {
  getOpportunitySpaceBySignalId,
  type OpportunitySpaceRecord,
} from "@/lib/mock-opportunity-space";
import { buildSignalPath } from "@/lib/mock-opportunity-space";
import { cityToCountyCode } from "@/lib/romania-counties";

export type DemoFeedReportRecord = {
  reportId: number;
  signal: MockSignal;
  opportunity: OpportunitySpaceRecord;
  report: FeedReportInput;
};

function mapOpportunityStageToFeedStage(
  opportunity: OpportunitySpaceRecord,
): NonNullable<FeedReportInput["commercialStage"]>["feedStage"] {
  if (opportunity.discussionReady || opportunity.stage === "pitch") {
    return "oportunitate_validata";
  }
  if (opportunity.stage === "plan") {
    return "in_crestere";
  }
  if (opportunity.stage === "validation") {
    return "calificat";
  }
  return "incipient";
}

function mapOpportunityStageToFeedKind(
  opportunity: OpportunitySpaceRecord,
): NonNullable<FeedReportInput["commercialStage"]>["feedKind"] {
  return opportunity.stage === "validation" ? "change" : "opportunity";
}

function buildTrustSignalClass(signal: MockSignal): string {
  if (signal.score >= 82) return "semnal_validat";
  if (signal.score >= 72) return "semnal_in_crestere";
  return "semnal_emerget";
}

function buildRecommendedUse(opportunity: OpportunitySpaceRecord): string {
  if (opportunity.discussionReady) return "Discutie controlata cu parteneri sau investitori";
  if (opportunity.stage === "plan") return "Structurare si validare comerciala";
  return "Validare locala si clarificare a ofertei";
}

function toFeedReportInput(
  signal: MockSignal,
  opportunity: OpportunitySpaceRecord,
  reportId: number,
): FeedReportInput {
  const countyCode = cityToCountyCode(signal.location);
  const confidenceScore = Math.max(
    42,
    Math.min(
      96,
      Math.round(signal.score * 0.62 + opportunity.readinessPct * 0.22 + opportunity.followersCount * 0.35),
    ),
  );
  const whitespaceScore = Math.max(
    24,
    Math.min(95, Math.round((100 - Math.min(signal.interestedCount * 3, 36)) + (signal.score >= 75 ? 8 : 0))),
  );
  const priorityScore = Math.max(40, Math.min(98, Math.round(signal.score * 0.92 + opportunity.readinessPct * 0.12)));
  const evidenceScore = Math.max(38, Math.min(95, Math.round(confidenceScore * 0.9)));
  const opportunityScore = Math.max(
    35,
    Math.min(96, Math.round((signal.score * 0.55) + (whitespaceScore * 0.45))),
  );
  const signalPulseScore = Math.max(
    28,
    Math.min(96, Math.round(signal.score * 0.5 + opportunity.interestedCount * 1.6)),
  );

  return {
    id: reportId,
    title: signal.title,
    description: signal.description,
    city: signal.location,
    locality: signal.location,
    countyCode,
    niche: signal.category,
    reportType: opportunity.stage === "validation" ? "semnal_local" : "oportunitate_construita",
    profitabilityScore: signal.score,
    updatedAt: new Date().toISOString(),
    interestCount: opportunity.interestedCount,
    trustVoteCount: Math.max(1, Math.round(signal.interestedCount / 2)),
    trustPercentage: Math.min(96, Math.max(48, Math.round(signal.score * 0.9))),
    aiPriority: {
      score: priorityScore,
      evidenceScore,
      opportunityScore,
      reasons: opportunity.evidencePillars.slice(0, 3),
    },
    evidence: {
      confidenceScore,
      whitespaceScore,
    },
    aiInsight: {
      verdict: opportunity.heroSummary,
      whyThisReport: opportunity.whyNow,
      signalPulse: {
        score: signalPulseScore,
      } as NonNullable<FeedReportInput["aiInsight"]>["signalPulse"],
    },
    trustProfile: {
      confidenceScore,
      signalClass: buildTrustSignalClass(signal),
      recommendedUse: buildRecommendedUse(opportunity),
    },
    freshness: {
      core: {
        state: "fresh",
        ageHours: 6,
      },
    },
    commercialStage: {
      bucket: opportunity.discussionReady ? "validated" : opportunity.stage === "plan" ? "qualified" : "radar",
      feedKind: mapOpportunityStageToFeedKind(opportunity),
      feedStage: mapOpportunityStageToFeedStage(opportunity),
      reasonCodes: opportunity.evidencePillars.slice(0, 3),
    },
    href: buildSignalPath(signal.id),
  };
}

export function buildDemoFeedReportRecords(limit = 4): DemoFeedReportRecord[] {
  return mockSignals.slice(0, limit).map((signal, index) => {
    const opportunity = getOpportunitySpaceBySignalId(signal.id);
    return {
      reportId: index + 1,
      signal,
      opportunity,
      report: toFeedReportInput(signal, opportunity, index + 1),
    };
  });
}
