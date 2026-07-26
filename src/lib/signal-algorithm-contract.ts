import type { SourceProfileKey, SourceTypeKey } from "@/lib/signal-score-contract";

export type SignalGenerationPattern =
  | "demand_growth"
  | "supply_gap"
  | "problem_recurrence"
  | "market_shift"
  | "behavior_repetition";

export type SignalPublicationStage =
  | "internal_candidate"
  | "feed_visible"
  | "featured_signal"
  | "buildable_opportunity"
  | "suppressed";

export type SignalSuppressionReason =
  | "low_confidence"
  | "high_risk"
  | "high_bias"
  | "weak_triangulation"
  | "insufficient_truth_score"
  | "stale_core_sources"
  | "saturated_market_without_breakpoint"
  | "review_noise_without_pattern"
  | "high_manipulation_risk"
  | "weak_geo_precision"
  | "low_actionability";

export type SignalSourceFreshnessProfile = {
  structuralScore: number;
  demandScore: number;
  problemScore: number;
  supplyScore: number;
  internalScore: number;
  coreSourcesStale: boolean;
};

export type SignalReviewIntelligence = {
  reviewCount: number;
  complaintCount: number;
  problemFrequencyScore: number;
  problemSeverityScore: number;
  problemRecencyScore: number;
  categoryRelevanceScore: number;
  unmetDemandScore: number;
  reviewQualityScore: number;
  manipulationRiskScore: number;
  patternStrengthScore: number;
};

export type SignalMarketSaturation = {
  supplyDensityScore: number;
  supplyQualityScore: number;
  demandPressureScore: number;
  marketSaturationIndex: number;
  whitespaceCredibilityScore: number;
  effectiveSupplyCoverageScore: number;
  saturationPenaltyScore: number;
  executionFeasibilityAdjustment: number;
  realOpportunityGapScore: number;
};

export type QualifiedEngagementEventType =
  | "view"
  | "open_detail"
  | "follow"
  | "save"
  | "express_interest"
  | "build_opportunity"
  | "request_introduction"
  | "introduction_accepted"
  | "useful_conversation"
  | "offer_tested"
  | "collaboration_started"
  | "project_launched";

export type QualifiedEngagementAggregate = {
  views: number;
  detailOpens: number;
  follows: number;
  saves: number;
  expressedInterest: number;
  opportunityBuilds: number;
  introductionRequests: number;
  introductionsAccepted: number;
  usefulConversations: number;
  offersTested: number;
  collaborationsStarted: number;
  projectsLaunched: number;
  uniqueActorCount: number;
  repeatedActorRatio: number;
  lastInteractionAt: string | null;
};

export type SignalGenerationInput = {
  signalId: string;
  niche: string | null;
  locality: string | null;
  county: string | null;
  profileKey: SourceProfileKey;
  detectedPatterns: SignalGenerationPattern[];
  sourceBreakdown: Partial<Record<SourceTypeKey, number>>;
  demandLocal: number;
  supplyGap: number;
  problemIntensity: number;
  trendStrength: number;
  localFit: number;
  testability: number;
  communityValidation: number;
  freshnessScore: number;
  consistencyScore: number;
  completenessScore: number;
  qualityScore: number;
  sourceReliabilityScore: number;
  geoGranularityScore: number;
  categoryFitScore: number;
  methodStabilityScore: number;
  sourceFreshness: SignalSourceFreshnessProfile;
  reviewIntelligence: SignalReviewIntelligence;
  marketSaturation: SignalMarketSaturation;
  riskScore: number;
  biasScore: number;
};

export type SignalTruthSnapshot = {
  signalId: string;
  truthScore: number;
  confidenceScore: number;
  riskScore: number;
  biasScore: number;
  actionabilityScore: number;
  triangulationConfirmedTypes: number;
  sourceReliabilityScore: number;
  geoGranularityScore: number;
  realOpportunityGapScore: number;
  reviewPatternStrengthScore: number;
  marketSaturationIndex: number;
  whitespaceCredibilityScore: number;
  publicationStage: SignalPublicationStage;
  suppressionReasons: SignalSuppressionReason[];
};

export type SignalDistributionInput = {
  signalId: string;
  truth: SignalTruthSnapshot;
  engagement: QualifiedEngagementAggregate;
  freshnessScore: number;
  personalizationFitScore: number;
  promotionState: "organic" | "promoted" | "paid";
};

export type SignalDistributionScore = {
  signalId: string;
  eligible: boolean;
  publicationStage: SignalPublicationStage;
  baseMeritScore: number;
  qualifiedEngagementScore: number;
  outcomeEvidenceScore: number;
  freshnessScore: number;
  personalizationFitScore: number;
  spamPenalty: number;
  popularityBiasPenalty: number;
  repetitionPenalty: number;
  promotedVisibilityBoost: number;
  finalScore: number;
  reasons: string[];
};

export const SIGNAL_PUBLICATION_THRESHOLDS = {
  feedVisibleTruthScore: 45,
  feedVisibleConfidence: 40,
  featuredTruthScore: 62,
  featuredConfidence: 58,
  buildableTruthScore: 72,
  buildableConfidence: 65,
  minActionabilityScore: 42,
  minGeoGranularityScore: 45,
  minWhitespaceCredibilityScore: 42,
  maxReviewManipulationRisk: 65,
  minReviewPatternStrength: 35,
  maxMarketSaturationIndexWithoutBreakpoint: 74,
  maxRiskForDistribution: 68,
  maxBiasForDistribution: 62,
  minimumTriangulationTypes: 2,
  strongTriangulationTypes: 3,
} as const;

export const QUALIFIED_ENGAGEMENT_WEIGHTS: Record<QualifiedEngagementEventType, number> = {
  view: 1,
  open_detail: 1,
  follow: 3,
  save: 4,
  express_interest: 5,
  build_opportunity: 8,
  request_introduction: 11,
  introduction_accepted: 16,
  useful_conversation: 20,
  offer_tested: 24,
  collaboration_started: 28,
  project_launched: 34,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toHundredScale(value: number): number {
  return clamp(Math.round(value), 0, 100);
}

function normalizedEventScore(weightedTotal: number, maxReference: number): number {
  if (maxReference <= 0) return 0;
  return clamp(Math.round((weightedTotal / maxReference) * 100), 0, 100);
}

export function computeSignalTruthScore(input: SignalGenerationInput): SignalTruthSnapshot {
  const effectiveSupplyGap = toHundredScale(
    input.supplyGap * 0.55
      + input.marketSaturation.whitespaceCredibilityScore * 0.25
      + input.marketSaturation.realOpportunityGapScore * 0.2,
  );
  const truthScore = toHundredScale(
    input.demandLocal * 0.25
      + effectiveSupplyGap * 0.2
      + input.problemIntensity * 0.15
      + input.trendStrength * 0.15
      + input.localFit * 0.1
      + input.testability * 0.1
      + input.communityValidation * 0.05,
  );

  const confidenceScore = toHundredScale(
    input.sourceReliabilityScore * 0.25
      + input.freshnessScore * 0.2
      + input.consistencyScore * 0.2
      + input.geoGranularityScore * 0.1
      + input.categoryFitScore * 0.1
      + input.completenessScore * 0.1
      + input.methodStabilityScore * 0.05,
  );

  const triangulationConfirmedTypes = Object.values(input.sourceBreakdown).filter((count) => Number(count ?? 0) > 0).length;
  const reviewPatternStrengthScore = toHundredScale(
    input.reviewIntelligence.problemFrequencyScore * 0.25
      + input.reviewIntelligence.problemSeverityScore * 0.2
      + input.reviewIntelligence.problemRecencyScore * 0.15
      + input.reviewIntelligence.categoryRelevanceScore * 0.1
      + input.reviewIntelligence.unmetDemandScore * 0.2
      + input.reviewIntelligence.reviewQualityScore * 0.1
      - input.reviewIntelligence.manipulationRiskScore * 0.12,
  );
  const actionabilityScore = toHundredScale(
    truthScore * 0.45
      + confidenceScore * 0.25
      + (100 - input.riskScore) * 0.2
      + input.testability * 0.05
      + input.marketSaturation.executionFeasibilityAdjustment * 0.05,
  );

  const suppressionReasons: SignalSuppressionReason[] = [];

  if (confidenceScore < SIGNAL_PUBLICATION_THRESHOLDS.feedVisibleConfidence) {
    suppressionReasons.push("low_confidence");
  }
  if (input.riskScore > SIGNAL_PUBLICATION_THRESHOLDS.maxRiskForDistribution) {
    suppressionReasons.push("high_risk");
  }
  if (input.biasScore > SIGNAL_PUBLICATION_THRESHOLDS.maxBiasForDistribution) {
    suppressionReasons.push("high_bias");
  }
  if (triangulationConfirmedTypes < SIGNAL_PUBLICATION_THRESHOLDS.minimumTriangulationTypes) {
    suppressionReasons.push("weak_triangulation");
  }
  if (truthScore < SIGNAL_PUBLICATION_THRESHOLDS.feedVisibleTruthScore) {
    suppressionReasons.push("insufficient_truth_score");
  }
  if (input.sourceFreshness.coreSourcesStale) {
    suppressionReasons.push("stale_core_sources");
  }
  if (
    input.marketSaturation.marketSaturationIndex >= SIGNAL_PUBLICATION_THRESHOLDS.maxMarketSaturationIndexWithoutBreakpoint
    && input.marketSaturation.whitespaceCredibilityScore < SIGNAL_PUBLICATION_THRESHOLDS.minWhitespaceCredibilityScore
    && input.marketSaturation.realOpportunityGapScore < SIGNAL_PUBLICATION_THRESHOLDS.feedVisibleTruthScore
  ) {
    suppressionReasons.push("saturated_market_without_breakpoint");
  }
  if (
    input.reviewIntelligence.reviewCount >= 8
    && reviewPatternStrengthScore < SIGNAL_PUBLICATION_THRESHOLDS.minReviewPatternStrength
  ) {
    suppressionReasons.push("review_noise_without_pattern");
  }
  if (input.reviewIntelligence.manipulationRiskScore > SIGNAL_PUBLICATION_THRESHOLDS.maxReviewManipulationRisk) {
    suppressionReasons.push("high_manipulation_risk");
  }
  if (input.geoGranularityScore < SIGNAL_PUBLICATION_THRESHOLDS.minGeoGranularityScore) {
    suppressionReasons.push("weak_geo_precision");
  }
  if (actionabilityScore < SIGNAL_PUBLICATION_THRESHOLDS.minActionabilityScore) {
    suppressionReasons.push("low_actionability");
  }

  let publicationStage: SignalPublicationStage = "internal_candidate";

  if (suppressionReasons.length > 0) {
    publicationStage = "suppressed";
  } else if (
    truthScore >= SIGNAL_PUBLICATION_THRESHOLDS.buildableTruthScore
    && confidenceScore >= SIGNAL_PUBLICATION_THRESHOLDS.buildableConfidence
    && triangulationConfirmedTypes >= SIGNAL_PUBLICATION_THRESHOLDS.strongTriangulationTypes
  ) {
    publicationStage = "buildable_opportunity";
  } else if (
    truthScore >= SIGNAL_PUBLICATION_THRESHOLDS.featuredTruthScore
    && confidenceScore >= SIGNAL_PUBLICATION_THRESHOLDS.featuredConfidence
  ) {
    publicationStage = "featured_signal";
  } else if (truthScore >= SIGNAL_PUBLICATION_THRESHOLDS.feedVisibleTruthScore) {
    publicationStage = "feed_visible";
  }

  return {
    signalId: input.signalId,
    truthScore,
    confidenceScore,
    riskScore: toHundredScale(input.riskScore),
    biasScore: toHundredScale(input.biasScore),
    actionabilityScore,
    triangulationConfirmedTypes,
    sourceReliabilityScore: toHundredScale(input.sourceReliabilityScore),
    geoGranularityScore: toHundredScale(input.geoGranularityScore),
    realOpportunityGapScore: toHundredScale(input.marketSaturation.realOpportunityGapScore),
    reviewPatternStrengthScore,
    marketSaturationIndex: toHundredScale(input.marketSaturation.marketSaturationIndex),
    whitespaceCredibilityScore: toHundredScale(input.marketSaturation.whitespaceCredibilityScore),
    publicationStage,
    suppressionReasons,
  };
}

export function computeQualifiedEngagementScore(aggregate: QualifiedEngagementAggregate): number {
  const weightedTotal =
    aggregate.views * QUALIFIED_ENGAGEMENT_WEIGHTS.view
    + aggregate.detailOpens * QUALIFIED_ENGAGEMENT_WEIGHTS.open_detail
    + aggregate.follows * QUALIFIED_ENGAGEMENT_WEIGHTS.follow
    + aggregate.saves * QUALIFIED_ENGAGEMENT_WEIGHTS.save
    + aggregate.expressedInterest * QUALIFIED_ENGAGEMENT_WEIGHTS.express_interest
    + aggregate.opportunityBuilds * QUALIFIED_ENGAGEMENT_WEIGHTS.build_opportunity
    + aggregate.introductionRequests * QUALIFIED_ENGAGEMENT_WEIGHTS.request_introduction
    + aggregate.introductionsAccepted * QUALIFIED_ENGAGEMENT_WEIGHTS.introduction_accepted;

  return normalizedEventScore(weightedTotal, 220);
}

export function computeOutcomeEvidenceScore(aggregate: QualifiedEngagementAggregate): number {
  const weightedTotal =
    aggregate.usefulConversations * QUALIFIED_ENGAGEMENT_WEIGHTS.useful_conversation
    + aggregate.offersTested * QUALIFIED_ENGAGEMENT_WEIGHTS.offer_tested
    + aggregate.collaborationsStarted * QUALIFIED_ENGAGEMENT_WEIGHTS.collaboration_started
    + aggregate.projectsLaunched * QUALIFIED_ENGAGEMENT_WEIGHTS.project_launched;

  return normalizedEventScore(weightedTotal, 180);
}

export function computeDistributionScore(input: SignalDistributionInput): SignalDistributionScore {
  const eligible = input.truth.publicationStage !== "suppressed";
  const reasons: string[] = [...input.truth.suppressionReasons];
  const baseMeritScore = toHundredScale(
    input.truth.truthScore * 0.45
      + input.truth.confidenceScore * 0.3
      + input.truth.actionabilityScore * 0.25,
  );
  const qualifiedEngagementScore = computeQualifiedEngagementScore(input.engagement);
  const outcomeEvidenceScore = computeOutcomeEvidenceScore(input.engagement);
  const spamPenalty = input.engagement.uniqueActorCount <= 1
    ? 18
    : input.engagement.uniqueActorCount <= 3
      ? 10
      : 0;
  const popularityBiasPenalty = input.truth.confidenceScore < 50 && qualifiedEngagementScore > 60 ? 16 : 0;
  const repetitionPenalty = input.engagement.repeatedActorRatio >= 0.75
    ? 18
    : input.engagement.repeatedActorRatio >= 0.5
      ? 10
      : 0;
  const promotedVisibilityBoost = input.promotionState === "paid"
    ? 8
    : input.promotionState === "promoted"
      ? 4
      : 0;

  if (!eligible) {
    reasons.push("distribution_blocked_by_truth_gate");
  }
  if (input.promotionState !== "organic") {
    reasons.push("promotion_can_modify_visibility_only");
  }
  if (spamPenalty > 0) {
    reasons.push("spam_penalty_applied");
  }
  if (popularityBiasPenalty > 0) {
    reasons.push("popularity_bias_penalty_applied");
  }
  if (repetitionPenalty > 0) {
    reasons.push("repetition_penalty_applied");
  }

  const finalScore = eligible
    ? toHundredScale(
        baseMeritScore * 0.45
          + qualifiedEngagementScore * 0.2
          + outcomeEvidenceScore * 0.15
          + clamp(input.freshnessScore, 0, 100) * 0.1
          + clamp(input.personalizationFitScore, 0, 100) * 0.1
          + promotedVisibilityBoost
          - spamPenalty
          - popularityBiasPenalty
          - repetitionPenalty,
      )
    : 0;

  return {
    signalId: input.signalId,
    eligible,
    publicationStage: input.truth.publicationStage,
    baseMeritScore,
    qualifiedEngagementScore,
    outcomeEvidenceScore,
    freshnessScore: clamp(input.freshnessScore, 0, 100),
    personalizationFitScore: clamp(input.personalizationFitScore, 0, 100),
    spamPenalty,
    popularityBiasPenalty,
    repetitionPenalty,
    promotedVisibilityBoost,
    finalScore,
    reasons,
  };
}
