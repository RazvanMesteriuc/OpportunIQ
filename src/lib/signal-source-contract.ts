import type {
  SignalSourceCategory,
  SignalSourceRegistryKey,
} from "@/lib/signal-action-kernel-contract";

export type SignalSourceRole =
  | "structural"
  | "demand"
  | "problem"
  | "supply"
  | "internal";

export type SignalSourceAccessMode =
  | "official_api"
  | "official_dataset"
  | "official_query_interface"
  | "approved_third_party_provider"
  | "internal_event_stream";

export type SignalSourceAuthMode =
  | "none"
  | "api_key"
  | "oauth"
  | "account_based"
  | "paid_document_or_manual_flow";

export type SignalSourceTrustWeightClass = "high" | "medium" | "conditional";

export type SignalSourceGeoResolution =
  | "locality"
  | "county"
  | "regional"
  | "national"
  | "mixed";

export type SignalSourceEntityGranularity =
  | "aggregate_market"
  | "business_entity"
  | "review_sample"
  | "search_topic"
  | "product_event";

export type SignalSourceRuntimeRequirement =
  | "browser_safe"
  | "manual_batch"
  | "server_required";

export type SignalSourceStatus =
  | "ready"
  | "planned"
  | "blocked_by_credentials"
  | "blocked_by_provider_access";

export type SignalSourceLegalUsageClass =
  | "public_reusable"
  | "public_conditioned"
  | "provider_terms_limited"
  | "internal_only";

export type SignalSourceFreshnessProfile = {
  recommendedGoodHours: number;
  recommendedAcceptableHours: number;
  weakAfterHours: number;
};

export type SignalSourceRegistryEntry = {
  key: SignalSourceRegistryKey;
  label: string;
  role: SignalSourceRole;
  category: SignalSourceCategory;
  accessMode: SignalSourceAccessMode;
  authMode: SignalSourceAuthMode;
  runtimeRequirement: SignalSourceRuntimeRequirement;
  trustWeightClass: SignalSourceTrustWeightClass;
  geoResolution: SignalSourceGeoResolution;
  entityGranularity: SignalSourceEntityGranularity;
  legalUsageClass: SignalSourceLegalUsageClass;
  enabledForTruth: boolean;
  enabledForDistribution: boolean;
  enabledForReviewIntelligence: boolean;
  enabledForSupplySaturation: boolean;
  status: SignalSourceStatus;
  freshnessProfile: SignalSourceFreshnessProfile;
  industryCoverage: "broad" | "selective";
  notes: string;
  requiredSecrets?: string[];
};

export type NormalizedSourceObservation = {
  sourceKey: SignalSourceRegistryKey;
  sourceRole: SignalSourceRole;
  category: SignalSourceCategory;
  observedAt: string | null;
  freshnessHours: number | null;
  geographyLabel: string | null;
  geographyScope: SignalSourceGeoResolution;
  industryLabel: string | null;
  confidenceWeight: number;
  coverageCompleteness: number;
  evidenceRefs: string[];
  metrics: Record<string, number | string | boolean | null>;
  legalUsageClass: SignalSourceLegalUsageClass;
};

export type SignalSourceAdapterResult = {
  source: SignalSourceRegistryEntry;
  runnable: boolean;
  blockedReason?: string | null;
  observations: NormalizedSourceObservation[];
};
