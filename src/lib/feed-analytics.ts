import type { UnifiedFeedItem } from "./feed-items";

type FeedAnalyticsInput = {
  item: UnifiedFeedItem;
  surface: "flux";
  destination?: string | null;
  extra?: Record<string, unknown>;
};

export function buildFeedItemAnalyticsMetadata(input: FeedAnalyticsInput): Record<string, unknown> {
  const { item, surface, destination, extra } = input;
  const kernel = item.signalActionKernel;

  return {
    surface,
    kind: item.kind,
    source: item.source,
    stage: item.stage,
    lifecycleStatus: item.lifecycleStatus,
    publicationStage: item.metrics?.publicationStage ?? null,
    primaryIntent: item.primaryIntent,
    secondaryIntent: item.secondaryIntent,
    destination: destination ?? item.analysisHref ?? item.href ?? null,
    county: item.county ?? null,
    locality: item.locality ?? null,
    industry: item.industry ?? null,
    paidState: item.metrics?.promotionType ?? "organic",
    geoFitScore: item.metrics?.geoFitScore ?? null,
    interestIntentScore: item.metrics?.interestIntentScore ?? null,
    interestCount: item.metrics?.interestCount ?? null,
    truthScore: item.metrics?.truthScore ?? null,
    distributionScore: item.metrics?.distributionScore ?? null,
    candidateProfile: item.metrics?.candidateProfile ?? null,
    detectedPatterns: item.metrics?.detectedPatterns ?? [],
    kernelStatus: kernel?.status ?? null,
    kernelNextAction: kernel?.nextAction.action ?? null,
    contactStatus: kernel?.contactSummary?.status ?? null,
    signalPublicCategory: kernel?.publicCategory ?? null,
    ...extra,
  };
}
