export type SignalSourceRegistryKey =
  | "onrc"
  | "mfinante"
  | "ins_tempo"
  | "siruta"
  | "google_places"
  | "google_trends"
  | "seap"
  | "opportuniq_internal";

export type SignalSourceCategory =
  | "registry"
  | "financial"
  | "demographic"
  | "geo"
  | "reviews"
  | "search_demand"
  | "public_procurement"
  | "platform_activity";

export type SignalReadinessStatus =
  | "generated"
  | "incipient"
  | "qualified"
  | "activable"
  | "community_validated"
  | "cooling"
  | "archived";

export type SignalPublicCategory = "change" | "request" | "opportunity";

export type SignalVariableCategory =
  | "demand_evidence"
  | "friction_evidence"
  | "supply_context"
  | "local_fit"
  | "momentum"
  | "actionability"
  | "community_validation"
  | "confidence";

export type SignalScoreKey =
  | "demand_score"
  | "friction_score"
  | "supply_gap_score"
  | "local_fit_score"
  | "momentum_score"
  | "actionability_score"
  | "community_validation_score"
  | "confidence_score"
  | "signal_readiness_score";

export type SignalDecisionLogLevel = "info" | "positive" | "warning" | "blocking";

export type SignalDecisionLogEntry = {
  code: string;
  level: SignalDecisionLogLevel;
  message: string;
  metric?: SignalScoreKey | SignalVariableCategory | null;
  sourceKeys?: SignalSourceRegistryKey[];
};

export type SignalEvidenceStrength = "low" | "medium" | "high";

export type SignalEvidenceItem = {
  id: string;
  label: string;
  summary: string;
  category: SignalVariableCategory;
  sourceKey: SignalSourceRegistryKey;
  sourceCategory: SignalSourceCategory;
  confidenceWeight?: number | null;
  freshnessHours?: number | null;
  sampleSize?: number | null;
  geographyLabel?: string | null;
  strength: SignalEvidenceStrength;
  publicVisible: boolean;
};

export type SignalCounterArgument = {
  id: string;
  label: string;
  summary: string;
  severity: "low" | "medium" | "high";
  sourceKeys?: SignalSourceRegistryKey[];
};

export type SignalNextAction =
  | "set_intent"
  | "view_matches"
  | "request_contact"
  | "watch_signal"
  | "open_analysis"
  | "validate_locally"
  | "test_offer";

export type SignalActionRecommendation = {
  action: SignalNextAction;
  label: string;
  summary: string;
  requiresAuth?: boolean;
};

export type SignalConfidenceBand = "low" | "medium" | "high";

export type SignalConfidenceSummary = {
  score: number;
  band: SignalConfidenceBand;
  sourceCount: number;
  sampleSize?: number | null;
  sourceAgreementPct?: number | null;
  geographySpecificity?: "locality" | "county" | "regional" | "national" | "unknown";
  manipulationRiskPct?: number | null;
  note: string;
};

export type SignalScoreSnapshot = {
  demandScore: number;
  frictionScore: number;
  supplyGapScore: number;
  localFitScore: number;
  momentumScore: number;
  actionabilityScore: number;
  communityValidationScore: number;
  confidenceScore: number;
  signalReadinessScore: number;
};

export const SIGNAL_INTENT_TYPES = [
  "find_supplier",
  "find_partner",
  "find_collaborator",
  "offer_products_services",
  "test_idea",
  "invest_in_signal",
  "follow_opportunity",
] as const;

export type SignalIntentType = (typeof SIGNAL_INTENT_TYPES)[number];

export type SignalIntentVisibility = "aggregate_only" | "private";

export type SignalIntentDraft = {
  signalEntityType: "report" | "article" | "post" | "company";
  signalEntityId: string | number;
  intentType: SignalIntentType;
  industry?: string | null;
  county?: string | null;
  locality?: string | null;
  shortMessage?: string | null;
  visibility: SignalIntentVisibility;
  linkedCompanyId?: number | null;
};

export type SignalIntentAggregate = {
  total: number;
  byType: Partial<Record<SignalIntentType, number>>;
  primaryCounty?: string | null;
  primaryIndustry?: string | null;
};

export const COMPATIBLE_SIGNAL_INTENT_MATRIX: Record<SignalIntentType, SignalIntentType[]> = {
  find_supplier: ["offer_products_services"],
  offer_products_services: ["find_supplier", "find_collaborator", "find_partner", "invest_in_signal", "test_idea"],
  find_partner: ["find_partner", "find_collaborator", "offer_products_services", "invest_in_signal", "test_idea"],
  find_collaborator: ["find_collaborator", "offer_products_services", "find_partner", "invest_in_signal"],
  test_idea: ["find_partner", "find_collaborator", "offer_products_services", "invest_in_signal"],
  invest_in_signal: ["find_partner", "find_collaborator", "offer_products_services", "test_idea"],
  follow_opportunity: [],
};

export type SignalMatchGeoScope = "locality" | "county" | "nearby_county" | "national";

export type SignalMatchEntityType = "company" | "user" | "aspirant_profile";

export type SignalMatchSummary = {
  entityType: SignalMatchEntityType;
  entityId: string | number;
  score: number;
  geoScope: SignalMatchGeoScope;
  county?: string | null;
  locality?: string | null;
  industry?: string | null;
  verified?: boolean;
  reasonLabels: string[];
  anonymousLabel: string;
};

export type SignalContactRequestStatus = "pending" | "accepted" | "rejected" | "expired";

export type SignalContactRequestSummary = {
  targetEntityType: SignalMatchEntityType;
  targetEntityId: string | number;
  signalEntityType: "report" | "article" | "post" | "company";
  signalEntityId: string | number;
  status: SignalContactRequestStatus;
  createdAt?: string | null;
  acceptedAt?: string | null;
};

export const SIGNAL_OUTCOME_TYPES = [
  "useful_conversation",
  "collaboration_started",
  "offer_tested",
  "project_launched",
  "business_opened",
] as const;

export type SignalOutcomeType = (typeof SIGNAL_OUTCOME_TYPES)[number];

export type SignalOutcomeAggregate = {
  total: number;
  byType: Partial<Record<SignalOutcomeType, number>>;
};

export type SignalActionKernel = {
  signalEntityType: "report" | "article" | "post" | "company";
  signalEntityId: string | number;
  publicCategory: SignalPublicCategory;
  status: SignalReadinessStatus;
  verdict: string;
  evidence: SignalEvidenceItem[];
  counterArguments: SignalCounterArgument[];
  confidence: SignalConfidenceSummary;
  scores: SignalScoreSnapshot;
  decisionLog: SignalDecisionLogEntry[];
  nextAction: SignalActionRecommendation;
  intentAggregate?: SignalIntentAggregate | null;
  matchSummaries?: SignalMatchSummary[] | null;
  contactSummary?: SignalContactRequestSummary | null;
  outcomeAggregate?: SignalOutcomeAggregate | null;
};

export function getCompatibleSignalIntentTypes(intentType: SignalIntentType): SignalIntentType[] {
  return COMPATIBLE_SIGNAL_INTENT_MATRIX[intentType] ?? [];
}

export function createEmptySignalIntentAggregate(): SignalIntentAggregate {
  return {
    total: 0,
    byType: {},
    primaryCounty: null,
    primaryIndustry: null,
  };
}

export function createEmptySignalOutcomeAggregate(): SignalOutcomeAggregate {
  return {
    total: 0,
    byType: {},
  };
}
