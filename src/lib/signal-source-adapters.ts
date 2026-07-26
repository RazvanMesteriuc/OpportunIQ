import { AUTH_TOKEN_KEY } from "@/lib/auth-token";
import {
  buildGooglePlaceReviewCorpus,
  filterPlacesPayloadBySelection,
  deriveGooglePlacesSupplyMetrics,
  deriveReviewIntelligenceMetrics,
  fetchGooglePlaceDetails,
  fetchGooglePlacesTextSearch,
  fetchReviewIntelligence,
  selectRelevantGooglePlaces,
} from "@/lib/external-api-client";
import type {
  ExternalPlaceDetailsResponse,
  ExternalPlacesTextSearchResponse,
} from "@/lib/external-api-contract";
import type {
  SignalSourceAdapterResult,
  NormalizedSourceObservation,
} from "@/lib/signal-source-contract";
import { getSignalSourcePublicRuntimeSummary } from "@/lib/signal-source-runtime-config";
import {
  getSignalSourceRegistryEntry,
  listSignalSourceRegistryEntries,
} from "@/lib/signal-source-registry";

export type Phase1SignalSourceContext = {
  signalId: string;
  title?: string | null;
  niche?: string | null;
  county?: string | null;
  locality?: string | null;
  googlePlacesQuery?: string | null;
  reviewText?: string | null;
  reviewSourceLabel?: string | null;
  googlePlacesMaxResults?: number | null;
  trustPercentage?: number | null;
  interestCount?: number | null;
  updatedAt?: string | null;
  aiPriorityScore?: number | null;
  evidenceConfidence?: number | null;
  whitespaceScore?: number | null;
  competitorCount?: number | null;
  avgRating?: number | null;
  reviewCount?: number | null;
  complaintCount?: number | null;
  structuralFreshnessHours?: number | null;
  demandFreshnessHours?: number | null;
  problemFreshnessHours?: number | null;
  supplyFreshnessHours?: number | null;
  internalFreshnessHours?: number | null;
  insTempoRef?: string | null;
  onrcRef?: string | null;
  googlePlacesRef?: string | null;
  googleTrendsRef?: string | null;
};

export type Phase1GenerationSourceOverrides = Partial<{
  competitorCount: number;
  avgRating: number | null;
  reviewCount: number;
  complaintCount: number;
  supplyQualityScore: number;
  effectiveSupplyCoverageScore: number;
  marketSaturationIndex: number;
  reviewProblemFrequencyScore: number;
  reviewProblemSeverityScore: number;
  reviewProblemRecencyScore: number;
  reviewManipulationRisk: number;
  reviewQualityScore: number;
  reviewUnmetNeedScore: number;
  reviewCategoryRelevanceScore: number;
}>;

export type ResolvedPhase1SignalSourceRuntime = {
  sourceAdapters: SignalSourceAdapterResult[];
  generationSourceOverrides: Phase1GenerationSourceOverrides;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function isRuntimeReachable(status: ReturnType<typeof getSignalSourcePublicRuntimeSummary>["status"]): boolean {
  return status === "enabled" || status === "enabled_via_server_proxy";
}

function hoursSince(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.round((Date.now() - timestamp) / 3_600_000));
}

function hasLocalSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
  } catch {
    return false;
  }
}

function createObservation(
  input: Omit<NormalizedSourceObservation, "confidenceWeight" | "coverageCompleteness"> & {
    confidenceWeight?: number;
    coverageCompleteness?: number;
  },
): NormalizedSourceObservation {
  return {
    ...input,
    confidenceWeight: clamp(Math.round(input.confidenceWeight ?? 50), 0, 100),
    coverageCompleteness: clamp(Math.round(input.coverageCompleteness ?? 50), 0, 100),
  };
}

function buildGooglePlacesQuery(context: Phase1SignalSourceContext): string | null {
  if (context.googlePlacesQuery?.trim()) {
    return context.googlePlacesQuery.trim();
  }

  const niche = context.niche?.trim();
  const locality = context.locality?.trim();
  const county = context.county?.trim();
  if (!niche || (!locality && !county)) return null;

  return [niche, locality, county]
    .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index)
    .join(", ");
}

function buildInsTempoAdapter(context: Phase1SignalSourceContext): SignalSourceAdapterResult {
  const source = getSignalSourceRegistryEntry("ins_tempo");
  if (!context.insTempoRef) {
    return {
      source,
      runnable: true,
      observations: [],
    };
  }
  return {
    source,
    runnable: true,
    observations: [
      createObservation({
        sourceKey: source.key,
        sourceRole: source.role,
        category: source.category,
        observedAt: context.updatedAt ?? null,
        freshnessHours: context.structuralFreshnessHours ?? hoursSince(context.updatedAt),
        geographyLabel: context.county ?? null,
        geographyScope: context.locality ? "county" : source.geoResolution,
        industryLabel: context.niche ?? null,
        confidenceWeight: 82,
        coverageCompleteness: context.county ? 72 : 38,
        evidenceRefs: [context.insTempoRef],
        metrics: {
          county_present: Boolean(context.county),
          locality_present: Boolean(context.locality),
          structural_context_ready: Boolean(context.county),
        },
        legalUsageClass: source.legalUsageClass,
      }),
    ],
  };
}

function buildOnrcAdapter(context: Phase1SignalSourceContext): SignalSourceAdapterResult {
  const source = getSignalSourceRegistryEntry("onrc");
  if (!context.onrcRef) {
    return {
      source,
      runnable: true,
      observations: [],
    };
  }
  const competitorCount = Math.max(0, Math.round(toNumber(context.competitorCount)));

  return {
    source,
    runnable: true,
    observations: [
      createObservation({
        sourceKey: source.key,
        sourceRole: source.role,
        category: source.category,
        observedAt: context.updatedAt ?? null,
        freshnessHours: context.supplyFreshnessHours ?? hoursSince(context.updatedAt),
        geographyLabel: context.locality ?? context.county ?? null,
        geographyScope: context.locality ? "locality" : context.county ? "county" : "mixed",
        industryLabel: context.niche ?? null,
        confidenceWeight: 86,
        coverageCompleteness: context.niche ? 76 : 48,
        evidenceRefs: [context.onrcRef],
        metrics: {
          competitor_count: competitorCount,
          whitespace_score: clamp(Math.round(toNumber(context.whitespaceScore)), 0, 100),
          supply_density_ready: Boolean(context.county || context.locality),
        },
        legalUsageClass: source.legalUsageClass,
      }),
    ],
  };
}

function buildOpportuniqInternalAdapter(context: Phase1SignalSourceContext): SignalSourceAdapterResult {
  const source = getSignalSourceRegistryEntry("opportuniq_internal");
  const freshnessHours = context.internalFreshnessHours ?? hoursSince(context.updatedAt);
  const interestCount = Math.max(0, Math.round(toNumber(context.interestCount)));
  const trustPercentage = clamp(Math.round(toNumber(context.trustPercentage)), 0, 100);

  return {
    source,
    runnable: true,
    observations: [
      createObservation({
        sourceKey: source.key,
        sourceRole: source.role,
        category: source.category,
        observedAt: context.updatedAt ?? new Date().toISOString(),
        freshnessHours,
        geographyLabel: context.locality ?? context.county ?? null,
        geographyScope: context.locality ? "locality" : context.county ? "county" : "mixed",
        industryLabel: context.niche ?? null,
        confidenceWeight: 58,
        coverageCompleteness: hasLocalSession() ? 64 : 42,
        evidenceRefs: [`signal:${context.signalId}`],
        metrics: {
          interest_count: interestCount,
          trust_percentage: trustPercentage,
          ai_priority_score: clamp(Math.round(toNumber(context.aiPriorityScore)), 0, 100),
          logged_in_context: hasLocalSession(),
        },
        legalUsageClass: source.legalUsageClass,
      }),
    ],
  };
}

function buildRuntimeBlockedAdapter(
  key: "google_places" | "google_trends",
  blockedReason: string,
): SignalSourceAdapterResult {
  const source = getSignalSourceRegistryEntry(key);
  return {
    source,
    runnable: false,
    blockedReason,
    observations: [],
  };
}

function buildDeferredExternalAdapter(key: "google_places" | "google_trends"): SignalSourceAdapterResult {
  const runtime = getSignalSourcePublicRuntimeSummary(key);
  return {
    source: getSignalSourceRegistryEntry(key),
    runnable: isRuntimeReachable(runtime.status),
    blockedReason: isRuntimeReachable(runtime.status) ? "external_runtime_not_resolved" : runtime.status,
    observations: [],
  };
}

function buildGooglePlacesObservation(
  context: Phase1SignalSourceContext,
  payload: ExternalPlacesTextSearchResponse,
  detailPayloads: ExternalPlaceDetailsResponse[] = [],
): SignalSourceAdapterResult {
  const source = getSignalSourceRegistryEntry("google_places");
  const metrics = deriveGooglePlacesSupplyMetrics(payload);
  const detailReviewCount = detailPayloads.reduce(
    (sum, detailPayload) => sum + detailPayload.place.reviews.length,
    0,
  );

  return {
    source,
    runnable: true,
    observations: [
      createObservation({
        sourceKey: source.key,
        sourceRole: source.role,
        category: source.category,
        observedAt: payload.fetchedAt,
        freshnessHours: 0,
        geographyLabel: context.locality ?? context.county ?? null,
        geographyScope: context.locality ? "locality" : context.county ? "county" : source.geoResolution,
        industryLabel: context.niche ?? null,
        confidenceWeight: clamp(
          Math.round(52 + Math.min(metrics.competitorCount, 8) * 4 + Math.min(metrics.totalReviewCount, 120) * 0.08),
          0,
          100,
        ),
        coverageCompleteness: clamp(
          Math.round(36 + (context.locality ? 18 : 0) + (context.niche ? 18 : 0) + Math.min(metrics.competitorCount, 6) * 5),
          0,
          100,
        ),
        evidenceRefs: payload.places
          .map((place) => place.id.trim())
          .filter(Boolean)
          .slice(0, 12)
          .map((placeId) => `google_place:${placeId}`),
        metrics: {
          competitor_count: metrics.competitorCount,
          average_rating: metrics.avgRating,
          total_review_count: metrics.totalReviewCount,
          sampled_places_with_details: detailPayloads.length,
          sampled_review_count: detailReviewCount,
          supply_quality_score: metrics.supplyQualityScore,
          effective_supply_coverage_score: metrics.effectiveSupplyCoverageScore,
          market_saturation_index: metrics.marketSaturationIndex,
          query: payload.query,
        },
        legalUsageClass: source.legalUsageClass,
      }),
    ],
  };
}

function buildGooglePlacesOverrides(
  payload: ExternalPlacesTextSearchResponse,
): Phase1GenerationSourceOverrides {
  const metrics = deriveGooglePlacesSupplyMetrics(payload);
  return {
    competitorCount: metrics.competitorCount,
    avgRating: metrics.avgRating,
    reviewCount: metrics.totalReviewCount,
    supplyQualityScore: metrics.supplyQualityScore,
    effectiveSupplyCoverageScore: metrics.effectiveSupplyCoverageScore,
    marketSaturationIndex: metrics.marketSaturationIndex,
  };
}

function mergeOverrides(
  current: Phase1GenerationSourceOverrides,
  next: Phase1GenerationSourceOverrides,
): Phase1GenerationSourceOverrides {
  return { ...current, ...next };
}

async function resolveReviewIntelligenceOverrides(
  context: Phase1SignalSourceContext,
  currentReviewCount: number,
  reviewTextOverride?: string | null,
  reviewSourceLabelOverride?: string | null,
): Promise<Phase1GenerationSourceOverrides> {
  const reviewText = reviewTextOverride?.trim() || context.reviewText?.trim() || "";
  if (!reviewText) {
    return {};
  }

  const reviewResult = await fetchReviewIntelligence({
    text: reviewText,
    reviewCount: currentReviewCount,
    niche: context.niche ?? null,
    locality: context.locality ?? null,
    county: context.county ?? null,
    sourceLabel: reviewSourceLabelOverride ?? context.reviewSourceLabel ?? "google_places_review_corpus",
  });

  if (reviewResult.status !== "ok" || !reviewResult.data) {
    return {};
  }

  return deriveReviewIntelligenceMetrics(reviewResult.data, {
    reviewCount: currentReviewCount,
    niche: context.niche ?? null,
  });
}

async function fetchGooglePlaceDetailPayloads(
  selectedPlaces: ExternalPlacesTextSearchResponse["places"],
  limit = 3,
): Promise<ExternalPlaceDetailsResponse[]> {
  const candidatePlaceIds = selectedPlaces
    .map((place) => place.id.trim())
    .filter(Boolean)
    .slice(0, Math.max(0, limit));

  const results = await Promise.all(candidatePlaceIds.map((placeId) => fetchGooglePlaceDetails(placeId)));
  return results
    .filter((result): result is { status: "ok"; data: ExternalPlaceDetailsResponse } => result.status === "ok" && Boolean(result.data))
    .map((result) => result.data);
}

function buildAggregatedGoogleReviewCorpus(
  detailPayloads: ExternalPlaceDetailsResponse[],
): { reviewText: string; reviewCount: number; sourceLabel: string } | null {
  const corpora = detailPayloads
    .map((detailPayload) => buildGooglePlaceReviewCorpus(detailPayload))
    .filter((entry): entry is NonNullable<ReturnType<typeof buildGooglePlaceReviewCorpus>> => Boolean(entry));

  if (corpora.length === 0) return null;

  return {
    reviewText: corpora
      .map((entry) => `Locatie: ${entry.placeName} (${entry.placeId})\n${entry.reviewText}`)
      .join("\n\n----\n\n"),
    reviewCount: corpora.reduce((sum, entry) => sum + entry.reviewCount, 0),
    sourceLabel: corpora.length === 1 ? `google_places:${corpora[0].placeId}` : "google_places:multi_place_sample",
  };
}

export function buildPhase1SignalSourceAdapters(context: Phase1SignalSourceContext): SignalSourceAdapterResult[] {
  return [
    buildInsTempoAdapter(context),
    buildOnrcAdapter(context),
    buildDeferredExternalAdapter("google_places"),
    buildDeferredExternalAdapter("google_trends"),
    buildOpportuniqInternalAdapter(context),
  ];
}

export async function resolvePhase1SignalSourceRuntime(
  context: Phase1SignalSourceContext,
): Promise<ResolvedPhase1SignalSourceRuntime> {
  const sourceAdapters: SignalSourceAdapterResult[] = [
    buildInsTempoAdapter(context),
    buildOnrcAdapter(context),
  ];
  let generationSourceOverrides: Phase1GenerationSourceOverrides = {};

  const googlePlacesRuntime = getSignalSourcePublicRuntimeSummary("google_places");
  if (!isRuntimeReachable(googlePlacesRuntime.status)) {
    sourceAdapters.push(buildRuntimeBlockedAdapter("google_places", googlePlacesRuntime.status));
  } else {
    const query = buildGooglePlacesQuery(context);
    if (!query) {
      sourceAdapters.push(buildRuntimeBlockedAdapter("google_places", "missing_query_context"));
    } else {
      const placesResult = await fetchGooglePlacesTextSearch({
        query,
        maxResults: context.googlePlacesMaxResults ?? 8,
      });

      if (placesResult.status === "ok" && placesResult.data) {
        const placeSelection = selectRelevantGooglePlaces(placesResult.data, {
          query,
          niche: context.niche ?? null,
          locality: context.locality ?? null,
          county: context.county ?? null,
        });
        const selectedPlacesPayload = filterPlacesPayloadBySelection(placesResult.data, placeSelection);
        if (selectedPlacesPayload.places.length === 0) {
          sourceAdapters.push(buildRuntimeBlockedAdapter("google_places", "no_relevant_places_found"));
        } else {
          const detailPayloads = await fetchGooglePlaceDetailPayloads(selectedPlacesPayload.places, 3);
          sourceAdapters.push(buildGooglePlacesObservation(context, selectedPlacesPayload, detailPayloads));
          generationSourceOverrides = mergeOverrides(
            generationSourceOverrides,
            buildGooglePlacesOverrides(selectedPlacesPayload),
          );
          const googleReviewCorpus = buildAggregatedGoogleReviewCorpus(detailPayloads);
          generationSourceOverrides = mergeOverrides(
            generationSourceOverrides,
            await resolveReviewIntelligenceOverrides(
              context,
              googleReviewCorpus?.reviewCount
                ?? generationSourceOverrides.reviewCount
                ?? Math.max(0, Math.round(toNumber(context.reviewCount))),
              googleReviewCorpus?.reviewText ?? null,
              googleReviewCorpus?.sourceLabel ?? null,
            ),
          );
        }
      } else {
        sourceAdapters.push(
          buildRuntimeBlockedAdapter(
            "google_places",
            placesResult.errorCode ?? placesResult.status,
          ),
        );
      }
    }
  }

  const googleTrendsRuntime = getSignalSourcePublicRuntimeSummary("google_trends");
  sourceAdapters.push(
    buildRuntimeBlockedAdapter(
      "google_trends",
      isRuntimeReachable(googleTrendsRuntime.status)
        ? "provider_dataset_not_integrated"
        : googleTrendsRuntime.status,
    ),
  );
  sourceAdapters.push(buildOpportuniqInternalAdapter(context));

  return {
    sourceAdapters,
    generationSourceOverrides,
  };
}

export function listRunnablePhase1Sources(): SignalSourceAdapterResult[] {
  return listSignalSourceRegistryEntries().map((source) => ({
    source,
    runnable: isRuntimeReachable(getSignalSourcePublicRuntimeSummary(source.key).status),
    blockedReason: isRuntimeReachable(getSignalSourcePublicRuntimeSummary(source.key).status)
      ? null
      : getSignalSourcePublicRuntimeSummary(source.key).status,
    observations: [],
  }));
}
