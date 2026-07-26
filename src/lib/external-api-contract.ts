export type ExternalApiErrorCode =
  | "invalid_query"
  | "invalid_place_id"
  | "invalid_text"
  | "google_places_not_configured"
  | "openai_not_configured"
  | "google_places_error"
  | "openai_error"
  | "rate_limited"
  | "not_found"
  | "internal_error";

export type ExternalApiErrorResponse = {
  error: ExternalApiErrorCode | string;
  message?: string;
  details?: string;
};

export type ExternalPlacesTextSearchRequest = {
  query: string;
  region?: string;
  language?: string;
  maxResults?: number;
};

export type ExternalPlacesTextSearchPlace = {
  id: string;
  name: string;
  formattedAddress: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  userRatingCount: number;
  primaryType: string | null;
  types: string[];
};

export type ExternalPlacesTextSearchResponse = {
  provider: "google_places";
  fetchedAt: string;
  query: string;
  region: string;
  language: string;
  maxResults: number;
  places: ExternalPlacesTextSearchPlace[];
};

export type ExternalPlacesReview = {
  reviewId: string;
  authorLabel: string | null;
  rating: number | null;
  publishTime: string | null;
  relativePublishTime: string | null;
  text: string;
  originalText: string | null;
};

export type ExternalPlaceDetailsResponse = {
  provider: "google_places";
  fetchedAt: string;
  place: {
    id: string;
    name: string;
    formattedAddress: string | null;
    rating: number | null;
    userRatingCount: number;
    primaryType: string | null;
    nationalPhoneNumber: string | null;
    websiteUri: string | null;
    reviews: ExternalPlacesReview[];
  };
};

export type ExternalReviewIntelligenceSentiment =
  | "negative"
  | "mixed_negative"
  | "mixed"
  | "mixed_positive"
  | "positive";

export type ExternalReviewIntelligenceTopicFrequency =
  | "isolated"
  | "recurring"
  | "dominant";

export type ExternalReviewIntelligenceTopicSeverity = "low" | "medium" | "high";

export type ExternalReviewIntelligenceTopic = {
  label: string;
  frequency: ExternalReviewIntelligenceTopicFrequency;
  severity: ExternalReviewIntelligenceTopicSeverity;
  evidenceQuote: string | null;
};

export type ExternalReviewIntelligenceRequest = {
  text: string;
  reviewCount?: number | null;
  niche?: string | null;
  locality?: string | null;
  county?: string | null;
  sourceLabel?: string | null;
};

export type ExternalReviewIntelligenceResponse = {
  provider: "openai";
  fetchedAt: string;
  model: string;
  sentiment: ExternalReviewIntelligenceSentiment;
  issueFrequencyScore: number;
  issueSeverityScore: number;
  recencyScore: number;
  manipulationRiskScore: number;
  summary: string;
  topics: ExternalReviewIntelligenceTopic[];
};
