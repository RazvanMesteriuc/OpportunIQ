export type SignalPulse = {
  momentum: "up" | "steady" | "down";
  label: string;
  score: number;
  belowThreshold?: boolean;
  daysWithoutInteraction?: number;
  series?: number[];
};

export type SignalAiInsight = {
  verdict: string;
  confidenceScore: number;
  confidenceBand?: "ridicată" | "medie" | "scăzută";
  confidenceNote?: string;
  evidenceBullets?: string[];
  redFlags?: string[];
  whyThisReport?: string;
  premiumUnlock?: string[];
  signalPulse?: SignalPulse;
};

export type SignalTrustAutoRefresh = {
  eligible: boolean;
  urgency: "none" | "watch" | "scheduled" | "priority";
  minAgeDays: number;
  targetAgeDays: number;
  maxAgeDays: number;
  reason: string;
};

export type SignalTrustProfile = {
  confidenceScore?: number | null;
  confidenceBand?: "ridicată" | "medie" | "scăzută";
  signalClass?: string | null;
  evidenceTier?: "slab" | "mediu" | "solid";
  financialCompleteness?: "lipsă" | "parțială" | "completă";
  recommendedUse?: string | null;
  autoRefresh?: SignalTrustAutoRefresh;
};

export type SignalInternalWeighting = {
  phase: "cold_start" | "gradual_shift" | "target_state";
  internalWeightPct: number;
  externalWeightPct: number;
  interactionVolume: number;
  progressPct: number;
  rationale: string;
};

export type SignalInternalSignals = {
  companyCount: number;
  verifiedCompanyCount: number;
  promotedCompanyCount: number;
  articleCount: number;
  reportCount: number;
  reportViewCount: number;
  postCount: number;
  liveDiscussionCount: number;
  commentCount: number;
  demandIntensity: number;
  communityHeat: number;
  supplyPressure: number;
  whitespaceScore: number;
  internalOpportunityScore: number;
};

export type SignalExternalSignals = {
  reviewCount: number;
  complaintCount: number;
  googleMapsCompetitorCount: number;
  avgRating: number | null;
  opportunityScore: number | null;
  sourceBreakdown: Record<string, number>;
};

export type SignalMarketVerdict = {
  direction: "bullish" | "watch" | "fragile";
  summary: string;
  whyNow: string;
  whyNotNow?: string;
  opportunityState?: "triggered" | "watch" | "quiet";
};

export type SignalIntelligenceClaim = {
  id: string;
  title: string;
  claim: string;
  whyItMatters: string;
  confidenceScore: number;
  sourceType: "internal" | "external" | "blended";
  evidenceRefs: string[];
};

export type SignalIntelligenceSummary = {
  internalWeighting: SignalInternalWeighting;
  internalSignals: SignalInternalSignals;
  externalSignals: SignalExternalSignals;
  marketVerdict: SignalMarketVerdict;
  claims: SignalIntelligenceClaim[];
};
