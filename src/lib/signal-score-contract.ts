export type SignalRiskLevel = "low" | "medium" | "high";

export type SourceTypeKey =
  | "primary"
  | "secondary"
  | "social"
  | "behavioral"
  | "contextual";

export type SourceProfileKey =
  | "balanced"
  | "demand-led"
  | "location-led"
  | "execution-led";

export type SignalSourceProfileRationaleKey =
  | "balanced_signal"
  | "demand_signal"
  | "location_signal"
  | "execution_signal";

export type SignalExplainabilityDriverKey =
  | "market_gap_clear"
  | "evidence_is_consistent"
  | "multiple_source_types_align"
  | "source_mix_matches_signal_type"
  | "demand_evidence_present"
  | "location_evidence_present"
  | "execution_evidence_present"
  | "balanced_evidence_present";

export type SignalExplainabilityRiskKey =
  | "execution_risk_high"
  | "evidence_still_thin"
  | "source_diversity_low"
  | "source_mix_misses_signal_type"
  | "niche_expected_sources_missing";

export type SignalExplainabilitySummaryKey =
  | "well_supported_but_still_needs_validation"
  | "promising_but_needs_more_evidence"
  | "mixed_signal_requires_careful_validation";

export type SignalPublicScores = {
  opportunityScore: number;
  confidenceScore: number;
  marketInterestScore: number;
  executionReadinessScore: number;
  actionabilityScore: number;
  investigationScore: number;
  evidenceStrength: number;
  gapClarity: number | null;
  communityValidation: number;
  communityInterest: number;
};

export type SignalInternalScores = {
  marketReading: number;
  communitySignal: number;
  feedRankingScore: number;
  rankingScore: number;
  gapClarity: number | null;
  sourceCoverageScore: number;
  triangulationScore: number;
  biasScore: number;
  riskScore: number;
};

export type SignalConfidence = {
  score: number;
  freshness: number;
  coverage: number;
  corroboration: number;
};

export type SignalRisk = {
  score: number;
  market: number;
  execution: number;
  evidence: number;
  level: SignalRiskLevel;
};

export type SignalBiasFlags = {
  score: number;
  popularity: number;
  geography: number;
  data: number;
  level: SignalRiskLevel;
};

export type SignalSourceBreakdown = {
  primary: number;
  secondary: number;
  social: number;
  behavioral: number;
  contextual: number;
  total: number;
  dominantType: SourceTypeKey;
};

export type SignalSourceProfile = {
  key: SourceProfileKey;
  label: string;
  targetInternalWeightPct: number;
  targetExternalWeightPct: number;
  profileCoverage: number;
  preferredCoverage: number;
  rationaleKey: SignalSourceProfileRationaleKey;
  preferredTypes: SourceTypeKey[];
  missingPreferredTypes: SourceTypeKey[];
};

export type SignalTriangulationState = {
  score: number;
  confirmedTypes: number;
  minimumTypesNeeded: number;
  isStrong: boolean;
};

export type SignalExplainability = {
  topDrivers: SignalExplainabilityDriverKey[];
  topRisks: SignalExplainabilityRiskKey[];
  summary: SignalExplainabilitySummaryKey;
};

export type SignalScores = {
  public: SignalPublicScores;
  internal: SignalInternalScores;
  opportunityScore: number;
  evidenceConfidence: number;
  communityValidation: number;
  communityInterest: number;
  aiMarketScore: number;
  communityScore: number;
  blendedScore: number;
  whitespaceScore: number | null;
  confidence: SignalConfidence;
  risk: SignalRisk;
  bias: SignalBiasFlags;
  sourceBreakdown: SignalSourceBreakdown;
  sourceProfile: SignalSourceProfile;
  triangulation: SignalTriangulationState;
  explainability: SignalExplainability;
};
