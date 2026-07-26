import {
  computeSignalTruthScore,
  type SignalMarketSaturation,
  type SignalGenerationInput,
  type SignalGenerationPattern,
  type SignalReviewIntelligence,
  type SignalSourceFreshnessProfile,
  type SignalTruthSnapshot,
} from "@/lib/signal-algorithm-contract";
import {
  buildSignalScores,
  resolveSignalSourceProfileKey,
  type SignalScoreInput,
  type SignalScores,
} from "@/lib/signal-scoring";
import {
  buildPhase1SignalSourceAdapters,
  resolvePhase1SignalSourceRuntime,
  type Phase1GenerationSourceOverrides,
} from "@/lib/signal-source-adapters";
import type { SignalSourceAdapterResult } from "@/lib/signal-source-contract";

export type ReportSignalGenerationSource = {
  id: string | number;
  title: string;
  description?: string | null;
  locality?: string | null;
  city?: string | null;
  county?: string | null;
  niche?: string | null;
  googlePlacesQuery?: string | null;
  reviewText?: string | null;
  reviewSourceLabel?: string | null;
  reportType?: string | null;
  profitabilityScore?: number | null;
  interestCount?: number | null;
  trustVoteCount?: number | null;
  trustPercentage?: number | null;
  updatedAt?: string | null;
  aiPriorityScore?: number | null;
  aiEvidenceScore?: number | null;
  signalPulseScore?: number | null;
  evidenceConfidence?: number | null;
  whitespaceScore?: number | null;
  sourceReliabilityScore?: number | null;
  geoGranularityScore?: number | null;
  categoryFitScore?: number | null;
  methodStabilityScore?: number | null;
  structuralFreshnessHours?: number | null;
  demandFreshnessHours?: number | null;
  problemFreshnessHours?: number | null;
  supplyFreshnessHours?: number | null;
  internalFreshnessHours?: number | null;
  reviewCount?: number | null;
  complaintCount?: number | null;
  competitorCount?: number | null;
  avgRating?: number | null;
  reviewProblemFrequencyScore?: number | null;
  reviewProblemSeverityScore?: number | null;
  reviewProblemRecencyScore?: number | null;
  reviewCategoryRelevanceScore?: number | null;
  reviewUnmetNeedScore?: number | null;
  reviewQualityScore?: number | null;
  reviewManipulationRisk?: number | null;
  supplyQualityScore?: number | null;
  effectiveSupplyCoverageScore?: number | null;
  marketSaturationIndex?: number | null;
  whitespaceCredibilityScore?: number | null;
  executionFeasibilityScore?: number | null;
  staleCoreSources?: boolean | null;
};

export type GeneratedSignalCandidate = {
  signalId: string;
  generationInput: SignalGenerationInput;
  signalScores: SignalScores;
  truthSnapshot: SignalTruthSnapshot;
  sourceAdapters: SignalSourceAdapterResult[];
  usedLocalRuntimeFallback?: boolean;
  runtimeFallbackReason?: string | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: number | null | undefined, fallback = 0): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function hoursSince(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 3_600_000);
}

function computeFreshnessScore(freshnessHours: number | null): number {
  if (freshnessHours == null) return 24;
  if (freshnessHours <= 12) return 100;
  if (freshnessHours <= 36) return 84;
  if (freshnessHours <= 72) return 66;
  if (freshnessHours <= 168) return 48;
  if (freshnessHours <= 336) return 28;
  return 12;
}

function combineFreshnessScores(values: number[]): number {
  if (!values.length) return 24;
  return clamp(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), 0, 100);
}

function computeCompletenessScore(input: ReportSignalGenerationSource): number {
  let presentFields = 0;
  const fields = [
    input.title,
    input.description,
    input.locality ?? input.city,
    input.county,
    input.niche,
    input.reportType,
    input.profitabilityScore,
    input.interestCount,
    input.trustPercentage,
    input.evidenceConfidence,
    input.whitespaceScore,
    input.aiPriorityScore,
  ];

  for (const field of fields) {
    if (field == null) continue;
    if (typeof field === "string" && field.trim().length === 0) continue;
    presentFields += 1;
  }

  return clamp(Math.round((presentFields / fields.length) * 100), 0, 100);
}

function computeSourceBreakdown(input: ReportSignalGenerationSource) {
  const evidenceConfidence = toNumber(input.evidenceConfidence);
  const whitespaceScore = toNumber(input.whitespaceScore);
  const interestCount = toNumber(input.interestCount);
  const trustVoteCount = toNumber(input.trustVoteCount);
  const trustPercentage = toNumber(input.trustPercentage);
  const signalPulseScore = toNumber(input.signalPulseScore);
  const hasLocation = Boolean((input.locality ?? input.city)?.trim() || input.county?.trim());

  const primary = (evidenceConfidence >= 55 ? 1 : 0) + (toNumber(input.aiEvidenceScore) >= 55 ? 1 : 0);
  const secondary = (whitespaceScore >= 45 ? 1 : 0) + (toNumber(input.profitabilityScore) >= 55 ? 1 : 0);
  const social = (trustVoteCount > 0 ? 1 : 0) + (trustPercentage >= 55 ? 1 : 0);
  const behavioral = (interestCount >= 2 ? 1 : 0) + (interestCount >= 6 ? 1 : 0);
  const contextual = (hasLocation ? 1 : 0) + (signalPulseScore >= 50 ? 1 : 0);

  return {
    primary,
    secondary,
    social,
    behavioral,
    contextual,
  } as const;
}

function buildSourceFreshnessProfile(
  input: ReportSignalGenerationSource,
  fallbackFreshnessHours: number | null,
): SignalSourceFreshnessProfile {
  const structuralScore = computeFreshnessScore(
    input.structuralFreshnessHours ?? fallbackFreshnessHours,
  );
  const demandScore = computeFreshnessScore(
    input.demandFreshnessHours ?? fallbackFreshnessHours,
  );
  const problemScore = computeFreshnessScore(
    input.problemFreshnessHours ?? fallbackFreshnessHours,
  );
  const supplyScore = computeFreshnessScore(
    input.supplyFreshnessHours ?? fallbackFreshnessHours,
  );
  const internalScore = computeFreshnessScore(
    input.internalFreshnessHours ?? fallbackFreshnessHours,
  );

  return {
    structuralScore,
    demandScore,
    problemScore,
    supplyScore,
    internalScore,
    coreSourcesStale: Boolean(
      input.staleCoreSources
      ?? [structuralScore, demandScore, problemScore, supplyScore].filter((score) => score < 32).length >= 2,
    ),
  };
}

function buildReviewIntelligence(input: ReportSignalGenerationSource): SignalReviewIntelligence {
  const reviewCount = Math.max(0, Math.round(toNumber(input.reviewCount)));
  const complaintCount = Math.max(0, Math.round(toNumber(input.complaintCount, toNumber(input.trustVoteCount))));
  const avgRating = clamp(toNumber(input.avgRating, complaintCount > 0 ? 3.8 : 4.2), 0, 5);
  const problemFrequencyScore = clamp(
    Math.round(toNumber(input.reviewProblemFrequencyScore, Math.min((complaintCount / Math.max(reviewCount, 1)) * 160, 100))),
    0,
    100,
  );
  const problemSeverityScore = clamp(
    Math.round(toNumber(input.reviewProblemSeverityScore, Math.max(0, (4.4 - avgRating) * 32))),
    0,
    100,
  );
  const problemRecencyScore = clamp(
    Math.round(toNumber(input.reviewProblemRecencyScore, reviewCount > 0 ? 62 : 18)),
    0,
    100,
  );
  const categoryRelevanceScore = clamp(
    Math.round(toNumber(input.reviewCategoryRelevanceScore, input.niche?.trim() ? 72 : 44)),
    0,
    100,
  );
  const unmetDemandScore = clamp(
    Math.round(
      toNumber(
        input.reviewUnmetNeedScore,
        problemFrequencyScore * 0.45 + problemSeverityScore * 0.35 + Math.min(complaintCount * 4, 20),
      ),
    ),
    0,
    100,
  );
  const reviewQualityScore = clamp(
    Math.round(toNumber(input.reviewQualityScore, reviewCount >= 12 ? 74 : reviewCount >= 4 ? 56 : 28)),
    0,
    100,
  );
  const manipulationRiskScore = clamp(
    Math.round(
      toNumber(
        input.reviewManipulationRisk,
        reviewCount <= 2 && complaintCount === 0 ? 58 : reviewQualityScore < 40 ? 52 : 22,
      ),
    ),
    0,
    100,
  );
  const patternStrengthScore = clamp(
    Math.round(
      problemFrequencyScore * 0.25
        + problemSeverityScore * 0.2
        + problemRecencyScore * 0.15
        + categoryRelevanceScore * 0.1
        + unmetDemandScore * 0.2
        + reviewQualityScore * 0.1
        - manipulationRiskScore * 0.12,
    ),
    0,
    100,
  );

  return {
    reviewCount,
    complaintCount,
    problemFrequencyScore,
    problemSeverityScore,
    problemRecencyScore,
    categoryRelevanceScore,
    unmetDemandScore,
    reviewQualityScore,
    manipulationRiskScore,
    patternStrengthScore,
  };
}

function buildMarketSaturation(input: {
  source: ReportSignalGenerationSource;
  signalScores: SignalScores;
  reviewIntelligence: SignalReviewIntelligence;
}): SignalMarketSaturation {
  const { source, signalScores, reviewIntelligence } = input;
  const competitorCount = Math.max(0, Math.round(toNumber(source.competitorCount)));
  const avgRating = clamp(toNumber(source.avgRating, competitorCount > 0 ? 4.1 : 0), 0, 5);
  const supplyDensityScore = clamp(
    Math.round(competitorCount * 9),
    0,
    100,
  );
  const supplyQualityScore = clamp(
    Math.round(
      toNumber(
        source.supplyQualityScore,
        competitorCount === 0 ? 12 : avgRating * 18 + Math.min(reviewIntelligence.reviewCount, 40) * 0.7,
      ),
    ),
    0,
    100,
  );
  const demandPressureScore = clamp(
    Math.round(
      signalScores.public.marketInterestScore * 0.45
        + reviewIntelligence.unmetDemandScore * 0.35
        + reviewIntelligence.problemFrequencyScore * 0.2,
    ),
    0,
    100,
  );
  const effectiveSupplyCoverageScore = clamp(
    Math.round(
      toNumber(
        source.effectiveSupplyCoverageScore,
        supplyDensityScore * 0.45 + supplyQualityScore * 0.55,
      ),
    ),
    0,
    100,
  );
  const marketSaturationIndex = clamp(
    Math.round(
      toNumber(
        source.marketSaturationIndex,
        effectiveSupplyCoverageScore * 0.6 + supplyDensityScore * 0.25 - reviewIntelligence.unmetDemandScore * 0.15,
      ),
    ),
    0,
    100,
  );
  const whitespaceCredibilityScore = clamp(
    Math.round(
      toNumber(
        source.whitespaceCredibilityScore,
        (source.whitespaceScore != null ? toNumber(source.whitespaceScore) * 0.4 : 18)
          + demandPressureScore * 0.25
          + reviewIntelligence.patternStrengthScore * 0.2
          - marketSaturationIndex * 0.18,
      ),
    ),
    0,
    100,
  );
  const saturationPenaltyScore = clamp(
    Math.round(Math.max(0, marketSaturationIndex - whitespaceCredibilityScore * 0.65)),
    0,
    100,
  );
  const executionFeasibilityAdjustment = clamp(
    Math.round(
      toNumber(
        source.executionFeasibilityScore,
        signalScores.public.executionReadinessScore * 0.6 + whitespaceCredibilityScore * 0.25 - saturationPenaltyScore * 0.15,
      ),
    ),
    0,
    100,
  );
  const realOpportunityGapScore = clamp(
    Math.round(
      demandPressureScore
        - effectiveSupplyCoverageScore * 0.55
        - saturationPenaltyScore * 0.45
        + executionFeasibilityAdjustment * 0.35,
    ),
    0,
    100,
  );

  return {
    supplyDensityScore,
    supplyQualityScore,
    demandPressureScore,
    marketSaturationIndex,
    whitespaceCredibilityScore,
    effectiveSupplyCoverageScore,
    saturationPenaltyScore,
    executionFeasibilityAdjustment,
    realOpportunityGapScore,
  };
}

function detectPatterns(input: ReportSignalGenerationSource, freshnessHours: number | null): SignalGenerationPattern[] {
  const interestCount = toNumber(input.interestCount);
  const trustVoteCount = toNumber(input.trustVoteCount);
  const signalPulseScore = toNumber(input.signalPulseScore);
  const whitespaceScore = toNumber(input.whitespaceScore);
  const evidenceConfidence = toNumber(input.evidenceConfidence);
  const aiPriorityScore = toNumber(input.aiPriorityScore);
  const patterns = new Set<SignalGenerationPattern>();

  if (interestCount >= 3 || signalPulseScore >= 55 || aiPriorityScore >= 62) {
    patterns.add("demand_growth");
  }
  if (whitespaceScore >= 45 || toNumber(input.profitabilityScore) >= 62) {
    patterns.add("supply_gap");
  }
  if (evidenceConfidence >= 55 || trustVoteCount >= 3) {
    patterns.add("problem_recurrence");
  }
  if ((freshnessHours != null && freshnessHours <= 72) || aiPriorityScore >= 58) {
    patterns.add("market_shift");
  }
  if (interestCount >= 5 || trustVoteCount >= 4 || signalPulseScore >= 62) {
    patterns.add("behavior_repetition");
  }

  if (patterns.size === 0) {
    patterns.add("market_shift");
  }

  return [...patterns];
}

function buildScoreInput(source: ReportSignalGenerationSource, sourceBreakdown: ReturnType<typeof computeSourceBreakdown>): SignalScoreInput {
  return {
    profitabilityScore: source.profitabilityScore,
    aiScore: source.aiPriorityScore,
    marketScore: source.aiPriorityScore,
    finalScore: source.aiPriorityScore,
    confidenceAdjustedScore: source.aiEvidenceScore,
    trustPercentage: source.trustPercentage,
    interestCount: source.interestCount,
    evidenceConfidence: source.evidenceConfidence,
    whitespaceScore: source.whitespaceScore,
    niche: source.niche,
    reportType: source.reportType,
    sourcePrimaryCount: sourceBreakdown.primary,
    sourceSecondaryCount: sourceBreakdown.secondary,
    sourceSocialCount: sourceBreakdown.social,
    sourceBehavioralCount: sourceBreakdown.behavioral,
    sourceContextualCount: sourceBreakdown.contextual,
  };
}

function buildGenerationInput(input: {
  signalId: string;
  source: ReportSignalGenerationSource;
  signalScores: SignalScores;
  freshnessHours: number | null;
  sourceBreakdown: ReturnType<typeof computeSourceBreakdown>;
  detectedPatterns: SignalGenerationPattern[];
}): SignalGenerationInput {
  const { source, signalScores, freshnessHours, sourceBreakdown, detectedPatterns } = input;
  const interestCount = toNumber(source.interestCount);
  const trustVoteCount = toNumber(source.trustVoteCount);
  const trustPercentage = toNumber(source.trustPercentage);
  const profitabilityScore = toNumber(source.profitabilityScore);
  const whitespaceScore = toNumber(source.whitespaceScore);
  const signalPulseScore = toNumber(source.signalPulseScore);
  const evidenceConfidence = toNumber(source.evidenceConfidence);
  const hasPreciseLocation = Boolean((source.locality ?? source.city)?.trim());
  const hasCounty = Boolean(source.county?.trim());
  const sourceFreshness = buildSourceFreshnessProfile(source, freshnessHours);
  const freshnessScore = combineFreshnessScores([
    sourceFreshness.structuralScore,
    sourceFreshness.demandScore,
    sourceFreshness.problemScore,
    sourceFreshness.supplyScore,
    sourceFreshness.internalScore,
  ]);
  const completenessScore = computeCompletenessScore(source);
  const reviewIntelligence = buildReviewIntelligence(source);
  const localFit = clamp(
    Math.round(
      28
        + (hasPreciseLocation ? 28 : 0)
        + (hasCounty ? 18 : 0)
        + sourceBreakdown.contextual * 10,
    ),
    0,
    100,
  );
  const geoGranularityScore = clamp(
    Math.round(
      toNumber(source.geoGranularityScore, hasPreciseLocation ? 92 : hasCounty ? 64 : 26),
    ),
    0,
    100,
  );
  const communityValidation = clamp(
    Math.round(
      trustPercentage * 0.5
        + Math.min(interestCount * 4, 24)
        + Math.min(trustVoteCount * 5, 20),
    ),
    0,
    100,
  );
  const marketSaturation = buildMarketSaturation({
    source,
    signalScores,
    reviewIntelligence,
  });
  const sourceReliabilityScore = clamp(
    Math.round(
      toNumber(
        source.sourceReliabilityScore,
        signalScores.confidence.coverage * 0.45 + signalScores.confidence.corroboration * 0.35 + sourceFreshness.structuralScore * 0.2,
      ),
    ),
    0,
    100,
  );
  const categoryFitScore = clamp(
    Math.round(toNumber(source.categoryFitScore, source.niche?.trim() ? 76 : 48)),
    0,
    100,
  );
  const methodStabilityScore = clamp(
    Math.round(toNumber(source.methodStabilityScore, signalScores.confidence.corroboration * 0.7 + 18)),
    0,
    100,
  );

  return {
    signalId: input.signalId,
    niche: source.niche ?? null,
    locality: source.locality ?? source.city ?? null,
    county: source.county ?? null,
    profileKey: resolveSignalSourceProfileKey({
      niche: source.niche,
      reportType: source.reportType,
    }),
    detectedPatterns,
    sourceBreakdown,
    demandLocal: clamp(Math.round(signalScores.public.marketInterestScore * 0.6 + Math.min(interestCount * 5, 26)), 0, 100),
    supplyGap: clamp(Math.round(Math.max(whitespaceScore, signalScores.public.gapClarity ?? 0)), 0, 100),
    problemIntensity: clamp(Math.round(evidenceConfidence * 0.65 + Math.min(trustVoteCount * 6, 22)), 0, 100),
    trendStrength: clamp(Math.round(signalPulseScore * 0.45 + toNumber(source.aiPriorityScore) * 0.35 + freshnessScore * 0.2), 0, 100),
    localFit,
    testability: clamp(Math.round(signalScores.public.actionabilityScore * 0.7 + signalScores.public.investigationScore * 0.3), 0, 100),
    communityValidation,
    freshnessScore,
    consistencyScore: clamp(Math.round(signalScores.confidence.corroboration), 0, 100),
    completenessScore,
    qualityScore: clamp(Math.round(signalScores.public.evidenceStrength * 0.6 + profitabilityScore * 0.4), 0, 100),
    sourceReliabilityScore,
    geoGranularityScore,
    categoryFitScore,
    methodStabilityScore,
    sourceFreshness,
    reviewIntelligence,
    marketSaturation,
    riskScore: clamp(Math.round(signalScores.risk.score), 0, 100),
    biasScore: clamp(Math.round(signalScores.bias.score), 0, 100),
  };
}

function applyGenerationSourceOverrides(
  source: ReportSignalGenerationSource,
  overrides: Phase1GenerationSourceOverrides,
): ReportSignalGenerationSource {
  return {
    ...source,
    ...overrides,
  };
}

function buildSignalCandidateFromResolvedSource(
  source: ReportSignalGenerationSource,
  sourceAdapters: SignalSourceAdapterResult[],
): GeneratedSignalCandidate {
  const signalId = `report:${source.id}`;
  const freshnessHours = hoursSince(source.updatedAt);
  const sourceBreakdown = computeSourceBreakdown(source);
  const detectedPatterns = detectPatterns(source, freshnessHours);
  const scoreInput = buildScoreInput(source, sourceBreakdown);
  const signalScores = buildSignalScores(scoreInput);
  const generationInput = buildGenerationInput({
    signalId,
    source,
    signalScores,
    freshnessHours,
    sourceBreakdown,
    detectedPatterns,
  });
  const truthSnapshot = computeSignalTruthScore(generationInput);
  const runtimeBlockedAdapter = sourceAdapters.find(
    (adapter) =>
      adapter.source.key === "google_places"
      && Boolean(adapter.blockedReason)
      && [
        "google_places_not_configured",
        "provider_access_required",
        "request_error",
        "network_error",
        "rate_limited",
        "http_501",
      ].includes(String(adapter.blockedReason)),
  );

  return {
    signalId,
    generationInput,
    signalScores,
    truthSnapshot,
    sourceAdapters,
    usedLocalRuntimeFallback: Boolean(runtimeBlockedAdapter),
    runtimeFallbackReason: runtimeBlockedAdapter?.blockedReason ?? null,
  };
}

function buildPhase1ContextFromReport(
  source: ReportSignalGenerationSource,
): Parameters<typeof buildPhase1SignalSourceAdapters>[0] {
  return {
    signalId: `report:${source.id}`,
    title: source.title,
    niche: source.niche,
    county: source.county ?? null,
    locality: source.locality ?? source.city ?? null,
    googlePlacesQuery: source.googlePlacesQuery ?? null,
    reviewText: source.reviewText ?? null,
    reviewSourceLabel: source.reviewSourceLabel ?? null,
    trustPercentage: source.trustPercentage,
    interestCount: source.interestCount,
    updatedAt: source.updatedAt,
    aiPriorityScore: source.aiPriorityScore,
    evidenceConfidence: source.evidenceConfidence,
    whitespaceScore: source.whitespaceScore,
    competitorCount: source.competitorCount,
    avgRating: source.avgRating,
    reviewCount: source.reviewCount,
    complaintCount: source.complaintCount,
    structuralFreshnessHours: source.structuralFreshnessHours,
    demandFreshnessHours: source.demandFreshnessHours,
    problemFreshnessHours: source.problemFreshnessHours,
    supplyFreshnessHours: source.supplyFreshnessHours,
    internalFreshnessHours: source.internalFreshnessHours,
  };
}

export function buildSignalCandidateFromReport(source: ReportSignalGenerationSource): GeneratedSignalCandidate {
  const sourceAdapters = buildPhase1SignalSourceAdapters(buildPhase1ContextFromReport(source));
  return buildSignalCandidateFromResolvedSource(source, sourceAdapters);
}

export async function buildSignalCandidateFromReportWithExternalRuntime(
  source: ReportSignalGenerationSource,
): Promise<GeneratedSignalCandidate> {
  const runtime = await resolvePhase1SignalSourceRuntime(buildPhase1ContextFromReport(source));
  const enrichedSource = applyGenerationSourceOverrides(source, runtime.generationSourceOverrides);
  return buildSignalCandidateFromResolvedSource(enrichedSource, runtime.sourceAdapters);
}
