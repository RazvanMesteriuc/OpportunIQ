import type {
  ExternalApiErrorResponse,
  ExternalPlaceDetailsResponse,
  ExternalPlacesTextSearchPlace,
  ExternalPlacesTextSearchRequest,
  ExternalPlacesTextSearchResponse,
  ExternalReviewIntelligenceRequest,
  ExternalReviewIntelligenceResponse,
} from "@/lib/external-api-contract";
import { slugify } from "@/lib/format";

type ExternalApiResultStatus =
  | "ok"
  | "skipped"
  | "not_configured"
  | "provider_access_required"
  | "rate_limited"
  | "network_error"
  | "invalid_response"
  | "request_error";

export type ExternalApiResult<T> = {
  status: ExternalApiResultStatus;
  data: T | null;
  errorCode?: string;
  message?: string;
};

export type GooglePlacesSupplyMetrics = {
  competitorCount: number;
  avgRating: number | null;
  totalReviewCount: number;
  supplyQualityScore: number;
  effectiveSupplyCoverageScore: number;
  marketSaturationIndex: number;
};

export type ReviewIntelligenceDerivedMetrics = {
  reviewProblemFrequencyScore: number;
  reviewProblemSeverityScore: number;
  reviewProblemRecencyScore: number;
  reviewManipulationRisk: number;
  reviewQualityScore: number;
  reviewUnmetNeedScore: number;
  reviewCategoryRelevanceScore: number;
  complaintCount: number;
};

export type GooglePlaceReviewCorpus = {
  placeId: string;
  placeName: string;
  reviewCount: number;
  reviewText: string;
};

export type GooglePlacesRelevanceContext = {
  query?: string | null;
  niche?: string | null;
  locality?: string | null;
  county?: string | null;
};

export type GooglePlacesRankedPlace = ExternalPlacesTextSearchPlace & {
  relevanceScore: number;
  relevanceReasons: string[];
};

export type GooglePlacesSelectionResult = {
  selectedPlaces: GooglePlacesRankedPlace[];
  discardedPlaces: GooglePlacesRankedPlace[];
};

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeForMatch(value: string | null | undefined): string {
  const normalized = slugify(String(value ?? "").trim());
  return normalized.replace(/-/g, " ").trim();
}

function toTokenSet(value: string | null | undefined): Set<string> {
  return new Set(
    normalizeForMatch(value)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2),
  );
}

function countOverlap(left: Set<string>, right: Set<string>): number {
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap;
}

function hasPhrase(haystack: string, needle: string | null | undefined): boolean {
  const normalizedNeedle = normalizeForMatch(needle);
  return normalizedNeedle.length > 0 && haystack.includes(normalizedNeedle);
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapErrorStatus(
  response: Response,
  payload: ExternalApiErrorResponse | null,
): ExternalApiResultStatus {
  if (response.status === 429 || payload?.error === "rate_limited") return "rate_limited";
  if (
    payload?.error === "google_places_not_configured"
    || payload?.error === "openai_not_configured"
  ) {
    return "not_configured";
  }
  if (payload?.error === "provider_access_required") return "provider_access_required";
  return "request_error";
}

async function requestExternalApi<T>(
  path: string,
  init: RequestInit,
): Promise<ExternalApiResult<T>> {
  try {
    const response = await fetch(`${BASE()}${path}`, init);
    const payload = await parseJsonResponse<T | ExternalApiErrorResponse>(response);

    if (!response.ok) {
      const errorPayload = (payload ?? null) as ExternalApiErrorResponse | null;
      return {
        status: mapErrorStatus(response, errorPayload),
        data: null,
        errorCode: errorPayload?.error ?? `http_${response.status}`,
        message: errorPayload?.message,
      };
    }

    if (!payload) {
      return {
        status: "invalid_response",
        data: null,
        errorCode: "empty_json_response",
      };
    }

    return {
      status: "ok",
      data: payload as T,
    };
  } catch (error) {
    return {
      status: "network_error",
      data: null,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : "unknown_network_error",
    };
  }
}

export async function fetchGooglePlacesTextSearch(
  input: ExternalPlacesTextSearchRequest,
): Promise<ExternalApiResult<ExternalPlacesTextSearchResponse>> {
  const query = input.query.trim();
  if (!query) {
    return {
      status: "skipped",
      data: null,
      errorCode: "missing_query_context",
    };
  }

  const params = new URLSearchParams({
    query,
    region: input.region?.trim() || "ro",
    language: input.language?.trim() || "ro",
  });

  if (Number.isFinite(Number(input.maxResults))) {
    params.set("maxResults", String(input.maxResults));
  }

  return requestExternalApi<ExternalPlacesTextSearchResponse>(
    `/api/external/places/text-search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );
}

export async function fetchGooglePlaceDetails(
  placeId: string,
): Promise<ExternalApiResult<ExternalPlaceDetailsResponse>> {
  const normalizedPlaceId = placeId.trim();
  if (!normalizedPlaceId) {
    return {
      status: "skipped",
      data: null,
      errorCode: "missing_place_id",
    };
  }

  const params = new URLSearchParams({ placeId: normalizedPlaceId });
  return requestExternalApi<ExternalPlaceDetailsResponse>(
    `/api/external/places/details?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );
}

export async function fetchReviewIntelligence(
  input: ExternalReviewIntelligenceRequest,
): Promise<ExternalApiResult<ExternalReviewIntelligenceResponse>> {
  const text = input.text.trim();
  if (!text) {
    return {
      status: "skipped",
      data: null,
      errorCode: "missing_review_corpus",
    };
  }

  return requestExternalApi<ExternalReviewIntelligenceResponse>(
    "/api/external/ai/review-intelligence",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...input,
        text,
      }),
    },
  );
}

export function selectRelevantGooglePlaces(
  payload: ExternalPlacesTextSearchResponse,
  context: GooglePlacesRelevanceContext,
): GooglePlacesSelectionResult {
  const nicheTokens = toTokenSet(context.niche ?? context.query ?? "");
  const queryTokens = toTokenSet(context.query ?? "");
  const localityText = normalizeForMatch(context.locality);
  const countyText = normalizeForMatch(context.county);

  const rankedPlaces: GooglePlacesRankedPlace[] = payload.places.map((place) => {
    const searchableText = normalizeForMatch(
      [
        place.name,
        place.primaryType,
        place.types.join(" "),
        place.formattedAddress,
      ].join(" "),
    );
    const searchableTokens = toTokenSet(searchableText);
    const relevanceReasons: string[] = [];
    let relevanceScore = 0;

    const nicheOverlap = countOverlap(nicheTokens, searchableTokens);
    const queryOverlap = countOverlap(queryTokens, searchableTokens);

    if (nicheTokens.size > 0) {
      const nicheScore = Math.round((nicheOverlap / nicheTokens.size) * 42);
      relevanceScore += nicheScore;
      if (nicheOverlap > 0) {
        relevanceReasons.push(`aliniere_nisa:${nicheOverlap}/${nicheTokens.size}`);
      } else {
        relevanceScore -= 18;
        relevanceReasons.push("fara_aliniere_pe_nisa");
      }
    }

    if (queryTokens.size > 0) {
      const queryScore = Math.round((queryOverlap / queryTokens.size) * 18);
      relevanceScore += queryScore;
      if (queryOverlap > 0) {
        relevanceReasons.push(`aliniere_query:${queryOverlap}/${queryTokens.size}`);
      }
    }

    if (localityText) {
      if (hasPhrase(searchableText, localityText)) {
        relevanceScore += 24;
        relevanceReasons.push("localitate_prezenta");
      } else {
        relevanceScore -= 10;
        relevanceReasons.push("localitate_absenta");
      }
    }

    if (countyText) {
      if (hasPhrase(searchableText, countyText)) {
        relevanceScore += 12;
        relevanceReasons.push("judet_prezent");
      } else if (!localityText) {
        relevanceScore -= 8;
        relevanceReasons.push("judet_absent");
      }
    }

    if (Number.isFinite(place.userRatingCount) && place.userRatingCount > 0) {
      relevanceScore += Math.min(8, Math.round(Math.log10(place.userRatingCount + 1) * 4));
      relevanceReasons.push("are_reviews");
    }

    if (place.primaryType && nicheOverlap > 0) {
      relevanceScore += 6;
      relevanceReasons.push("tip_primar_compatibil");
    }

    return {
      ...place,
      relevanceScore: clamp(relevanceScore, 0, 100),
      relevanceReasons,
    };
  });

  rankedPlaces.sort((left, right) => {
    if (right.relevanceScore !== left.relevanceScore) {
      return right.relevanceScore - left.relevanceScore;
    }
    return right.userRatingCount - left.userRatingCount;
  });

  const selectedPlaces = rankedPlaces.filter((place, index) => {
    if (place.relevanceScore >= 55) return true;
    return index === 0 && place.relevanceScore >= 38;
  });
  const selectedIds = new Set(selectedPlaces.map((place) => place.id));

  return {
    selectedPlaces,
    discardedPlaces: rankedPlaces.filter((place) => !selectedIds.has(place.id)),
  };
}

export function filterPlacesPayloadBySelection(
  payload: ExternalPlacesTextSearchResponse,
  selection: GooglePlacesSelectionResult,
): ExternalPlacesTextSearchResponse {
  return {
    ...payload,
    places: selection.selectedPlaces.map((place) => ({
      id: place.id,
      name: place.name,
      formattedAddress: place.formattedAddress,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      primaryType: place.primaryType,
      types: place.types,
    })),
  };
}

export function deriveGooglePlacesSupplyMetrics(
  payload: ExternalPlacesTextSearchResponse,
): GooglePlacesSupplyMetrics {
  const places = Array.isArray(payload.places) ? payload.places : [];
  const competitorCount = places.length;
  const ratedPlaces = places.filter((place) => Number.isFinite(place.rating));
  const avgRating =
    ratedPlaces.length > 0
      ? Number(
          (
            ratedPlaces.reduce((sum, place) => sum + Number(place.rating ?? 0), 0)
            / ratedPlaces.length
          ).toFixed(2),
        )
      : null;
  const totalReviewCount = places.reduce(
    (sum, place) => sum + Math.max(0, Math.round(Number(place.userRatingCount ?? 0))),
    0,
  );
  const supplyQualityScore = clamp(
    Math.round(
      (avgRating ?? 0) * 14
        + Math.min(totalReviewCount, 180) * 0.18
        + Math.min(competitorCount, 10) * 1.8,
    ),
    0,
    100,
  );
  const effectiveSupplyCoverageScore = clamp(
    Math.round(competitorCount * 8 + supplyQualityScore * 0.42),
    0,
    100,
  );
  const marketSaturationIndex = clamp(
    Math.round(effectiveSupplyCoverageScore * 0.72 + Math.min(competitorCount, 10) * 2.8),
    0,
    100,
  );

  return {
    competitorCount,
    avgRating,
    totalReviewCount,
    supplyQualityScore,
    effectiveSupplyCoverageScore,
    marketSaturationIndex,
  };
}

export function buildGooglePlaceReviewCorpus(
  payload: ExternalPlaceDetailsResponse,
): GooglePlaceReviewCorpus | null {
  const reviews = Array.isArray(payload.place.reviews) ? payload.place.reviews : [];
  const reviewText = reviews
    .map((review, index) => {
      const text = review.text.trim();
      if (!text) return "";
      const rating = Number.isFinite(review.rating) ? `rating=${review.rating}` : "rating=necunoscut";
      const published = review.relativePublishTime || review.publishTime || "data necunoscuta";
      return `Review ${index + 1} | ${rating} | ${published}\n${text}`;
    })
    .filter(Boolean)
    .join("\n\n");

  if (!reviewText.trim()) return null;

  return {
    placeId: payload.place.id,
    placeName: payload.place.name,
    reviewCount: reviews.length,
    reviewText,
  };
}

export function deriveReviewIntelligenceMetrics(
  payload: ExternalReviewIntelligenceResponse,
  input: Pick<ExternalReviewIntelligenceRequest, "reviewCount" | "niche">,
): ReviewIntelligenceDerivedMetrics {
  const reviewCount = Math.max(0, Math.round(Number(input.reviewCount ?? 0)));
  const complaintCount = clamp(
    Math.round(reviewCount * (payload.issueFrequencyScore / 100) * 0.7 + payload.topics.length * 1.5),
    0,
    Math.max(reviewCount, payload.topics.length * 3),
  );
  const reviewQualityScore = clamp(
    Math.round(52 + payload.topics.length * 6 - payload.manipulationRiskScore * 0.22),
    0,
    100,
  );
  const reviewUnmetNeedScore = clamp(
    Math.round(
      payload.issueFrequencyScore * 0.38
        + payload.issueSeverityScore * 0.28
        + payload.recencyScore * 0.18
        + reviewQualityScore * 0.08
        - payload.manipulationRiskScore * 0.12,
    ),
    0,
    100,
  );
  const reviewCategoryRelevanceScore = clamp(
    Math.round(input.niche?.trim() ? 74 : 58),
    0,
    100,
  );

  return {
    reviewProblemFrequencyScore: payload.issueFrequencyScore,
    reviewProblemSeverityScore: payload.issueSeverityScore,
    reviewProblemRecencyScore: payload.recencyScore,
    reviewManipulationRisk: payload.manipulationRiskScore,
    reviewQualityScore,
    reviewUnmetNeedScore,
    reviewCategoryRelevanceScore,
    complaintCount,
  };
}
