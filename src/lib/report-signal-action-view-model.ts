import {
  buildReportSignalActionKernel,
  buildSignalIntentAggregateFromRuntime,
  enrichSignalActionKernelWithRuntime,
} from "./signal-action-kernel-adapter";
import type {
  SignalContactRequestSummary,
  SignalIntentAggregate,
  SignalIntentDraft,
  SignalIntentType,
  SignalMatchSummary,
  SignalOutcomeAggregate,
} from "./signal-action-kernel-contract";
import {
  buildSignalIntentDraftFromProfile,
  buildSignalMatchRequestFromIntent,
  buildSignalMatchSummariesFromCompanies,
} from "./signal-intent-match-adapter";
import type { SignalScores } from "./signal-score-contract";
import type { SignalTrustProfile } from "./signal-surface-contract";
import type { UserProfile } from "./use-profile";

type ReportCommercialStageInput = {
  feedKind?: "change" | "opportunity" | null;
  feedStage?: string | null;
  bucket?: "radar" | "qualified" | "validated" | null;
  reasonCodes?: string[] | null;
} | null;

type ReportSourceAuditEntryInput = {
  id: string;
  label: string;
  category: "internal" | "external";
  provider: string;
  evidenceCount: number;
  freshness: "live" | "cached" | "derived";
  reliabilityScore: number;
  notes: string;
};

type ReportSignalActionListingInput = {
  id: number;
  title: string;
  city: string;
  county?: string | null;
  locality?: string | null;
  niche?: string | null;
  reportType?: string | null;
  description?: string | null;
  shortSummary?: string | null;
  profitabilityScore?: number | null;
  trustPercentage?: number | null;
  interestCount?: number | null;
  commercialStage?: ReportCommercialStageInput;
  freshness?: {
    core?: {
      ageHours?: number | null;
    } | null;
  } | null;
  sourceAudit?: {
    entries?: ReportSourceAuditEntryInput[] | null;
  } | null;
  scoreSection?: {
    demand_score?: number | null;
  } | null;
  operationalSignals?: {
    whitespaceScore?: number | null;
  } | null;
  aiPriority?: {
    opportunityScore?: number | null;
    evidenceScore?: number | null;
  } | null;
  evidence?: {
    whitespaceScore?: number | null;
    confidenceScore?: number | null;
  } | null;
  aiInsight?: {
    verdict?: string | null;
    confidenceScore?: number | null;
    signalPulse?: {
      score?: number | null;
    } | null;
  } | null;
  trustProfile?: {
    confidenceScore?: number | null;
  } | null;
};

type MatchedCompanyInput = {
  id: number;
  name: string;
  city: string;
  judet?: string | null;
  industry: string;
  verified?: boolean;
  matchScore: number;
  reasons: string[];
};

type ReportSignalActionViewModelInput = {
  profile: UserProfile;
  rawListingData?: ReportSignalActionListingInput | null;
  rawTrustProfile?: SignalTrustProfile | null;
  selectedIntentType?: SignalIntentType | null;
  reportIntentAggregateTotals?: Partial<Record<SignalIntentType, number>> | null;
  reportContactSummary?: SignalContactRequestSummary | null;
  reportOutcomeAggregate?: SignalOutcomeAggregate | null;
  relevantCompanies: MatchedCompanyInput[];
  signalScores: SignalScores;
};

export type ReportSignalActionViewModel = {
  profileDerivedIntentDraft: SignalIntentDraft | null;
  activeIntentType: SignalIntentType | null;
  signalIntentDraft: SignalIntentDraft | null;
  signalMatchRequest: {
    city?: string | null;
    judet?: string | null;
    industry?: string | null;
    niche?: string | null;
    goals: string;
    limit: number;
  };
  signalMatchSummaries: SignalMatchSummary[];
  signalIntentAggregate: SignalIntentAggregate | null;
  localMatchCount: number;
  countyMatchCount: number;
  activeIntentAudienceCount: number;
  reportKernel: ReturnType<typeof buildReportSignalActionKernel> | null;
};

export function buildReportSignalActionViewModel(
  input: ReportSignalActionViewModelInput,
): ReportSignalActionViewModel {
  const listing = input.rawListingData ?? null;
  const listingNiche = listing?.niche ?? "";
  const listingCity = listing?.city ?? "";

  const profileDerivedIntentDraft =
    listing?.id && input.profile.setup
      ? buildSignalIntentDraftFromProfile(input.profile, {
          signalEntityType: "report",
          signalEntityId: listing.id,
          signalTitle: listing.title,
          signalCounty: listing.county ?? listing.city,
          signalLocality: listing.locality ?? listing.city,
          signalIndustry: listing.niche,
        })
      : null;

  const activeIntentType = input.selectedIntentType ?? profileDerivedIntentDraft?.intentType ?? null;

  const signalIntentDraft =
    listing?.id && input.profile.setup && activeIntentType
      ? buildSignalIntentDraftFromProfile(
          input.profile,
          {
            signalEntityType: "report",
            signalEntityId: listing.id,
            signalTitle: listing.title,
            signalCounty: listing.county ?? listing.city,
            signalLocality: listing.locality ?? listing.city,
            signalIndustry: listing.niche,
          },
          activeIntentType,
        )
      : null;

  const signalMatchRequest = signalIntentDraft
    ? buildSignalMatchRequestFromIntent(signalIntentDraft, {
        signalIndustry: listing?.niche,
        signalLocality: listing?.locality ?? listing?.city,
        signalCounty: listing?.county ?? listing?.city,
        signalTitle: listing?.title,
        limit: 8,
      })
    : {
        city: listingCity,
        judet: listing?.county ?? null,
        industry: listing?.niche ?? null,
        niche: listingNiche,
        goals: `Caut firme relevante pentru raportul ${listingNiche} in ${listingCity}`,
        limit: 8,
      };

  const signalMatchSummaries = buildSignalMatchSummariesFromCompanies(input.relevantCompanies, {
    signalLocality: listing?.locality ?? listing?.city,
    signalCounty: listing?.county ?? listing?.city,
  });
  const signalIntentAggregate = buildSignalIntentAggregateFromRuntime({
    totals: input.reportIntentAggregateTotals ?? null,
    primaryCounty: listing?.county ?? listing?.city ?? null,
    primaryIndustry: listing?.niche ?? null,
  });
  const localMatchCount = signalMatchSummaries.filter((match) => match.geoScope === "locality").length;
  const countyMatchCount = signalMatchSummaries.filter((match) => match.geoScope === "county").length;
  const activeIntentAudienceCount = activeIntentType
    ? Number(signalIntentAggregate?.byType?.[activeIntentType] ?? 0)
    : 0;

  if (!listing?.id) {
    return {
      profileDerivedIntentDraft,
      activeIntentType,
      signalIntentDraft,
      signalMatchRequest,
      signalMatchSummaries,
      signalIntentAggregate,
      localMatchCount,
      countyMatchCount,
      activeIntentAudienceCount,
      reportKernel: null,
    };
  }

  const publicCategory =
    listing.commercialStage?.feedKind === "opportunity"
      ? "opportunity"
      : "change";

  const baseKernel = buildReportSignalActionKernel({
    signalEntityId: listing.id,
    publicCategory,
    title: listing.title,
    verdict: listing.aiInsight?.verdict ?? listing.shortSummary ?? listing.description,
    county: listing.county ?? listing.city,
    locality: listing.locality ?? listing.city,
    niche: listing.niche,
    reportType: listing.reportType,
    profitabilityScore: listing.profitabilityScore,
    demandScore: listing.scoreSection?.demand_score ?? listing.profitabilityScore,
    gapScore:
      Number((listing.operationalSignals as { whitespaceScore?: number | null } | null)?.whitespaceScore ?? Number.NaN)
      || listing.aiPriority?.opportunityScore
      || listing.evidence?.whitespaceScore
      || null,
    validationScore:
      listing.trustProfile?.confidenceScore
      ?? listing.aiPriority?.evidenceScore
      ?? listing.evidence?.confidenceScore
      ?? listing.aiInsight?.confidenceScore
      ?? null,
    signalPulseScore: listing.aiInsight?.signalPulse?.score ?? null,
    actionabilityScore: input.signalScores.public.investigationScore,
    trustPercentage: listing.trustPercentage,
    interestCount: listing.interestCount,
    freshnessHours: listing.freshness?.core?.ageHours ?? null,
    signalClass: input.rawTrustProfile?.signalClass,
    recommendedUse: input.rawTrustProfile?.recommendedUse,
    commercialStage: listing.commercialStage ?? null,
    sourceAuditEntries: listing.sourceAudit?.entries ?? null,
    signalScores: input.signalScores,
  });

  return {
    profileDerivedIntentDraft,
    activeIntentType,
    signalIntentDraft,
    signalMatchRequest,
    signalMatchSummaries,
    signalIntentAggregate,
    localMatchCount,
    countyMatchCount,
    activeIntentAudienceCount,
    reportKernel: enrichSignalActionKernelWithRuntime(baseKernel, {
      activeIntentType,
      intentAggregate: signalIntentAggregate,
      matchSummaries: signalMatchSummaries,
      contactSummary: input.reportContactSummary ?? null,
      outcomeAggregate: input.reportOutcomeAggregate ?? null,
    }),
  };
}
