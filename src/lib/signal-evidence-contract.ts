export type SignalReviewBusinessLens =
  | "operational_failure"
  | "offer_gap"
  | "access_gap"
  | "price_value_gap"
  | "experience_preference"
  | "mixed";

export type SignalReviewOpportunityFit = "low" | "medium" | "high";

export type SignalReviewTheme = {
  theme: string;
  summary?: string;
  frequencyPct?: number;
  mentions?: number;
  cites: string[];
  businessLens?: SignalReviewBusinessLens;
  opportunityFit?: SignalReviewOpportunityFit;
  opportunityNote?: string;
};

export type SignalReviewDemand = {
  text: string;
  cites: string[];
};

export type SignalReviewQuantitative = {
  totalReviews: number;
  avgRating: number | null;
  distribution: number[];
  placesAnalyzed: string[];
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

export type SignalReviewScore = {
  total: number;
  breakdown: {
    explicitDemand: number;
    implicitDemand: number;
    dissatisfaction: number;
    unresolvedProblems: number;
    reviewVolume: number;
    competition: number;
    trends: number;
    scalability: number;
  };
  rationale: string;
};

export type SignalEvidence = {
  reviewCount: number;
  sourceDiversity?: number;
  serpResultCount?: number;
  avgRating: number | null;
  confidenceScore?: number;
  whitespaceScore?: number;
};

export type SignalReviewQualitative = {
  recurringComplaints: SignalReviewTheme[];
  praisedAspects: SignalReviewTheme[];
  explicitDemands: SignalReviewDemand[];
  implicitDemands: SignalReviewDemand[];
};

export type SignalLiveSentiment = {
  painPoints: Array<{ text: string; cite: string; link?: string }>;
  unmetNeeds: Array<{ text: string; cite: string; link?: string }>;
  localOpportunities: Array<{ text: string; basedOn: string }>;
  quantitative?: SignalReviewQuantitative;
  qualitative?: SignalReviewQualitative;
  opportunityScore?: SignalReviewScore;
  strategicRecommendations?: {
    positioning: "premium" | "mid" | "low" | "diferentiator";
    differentiators: string[];
    marketingStrategy: string[];
    risks: string[];
  };
  evidence: SignalEvidence;
  citations: Array<{
    text: string;
    author?: string;
    source?: string;
    rating?: number;
    date?: string;
    link?: string;
  }>;
  generatedAt: string;
  cachedAt?: string | null;
};
