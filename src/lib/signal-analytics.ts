import type {
  SignalContactRequestSummary,
  SignalIntentType,
  SignalReadinessStatus,
} from "./signal-action-kernel-contract";

type SignalAnalyticsListingInput = {
  id: string | number;
  title?: string | null;
  city?: string | null;
  county?: string | null;
  locality?: string | null;
  niche?: string | null;
  score?: number | null;
  commercialStage?: unknown;
};

type SignalAnalyticsKernelInput = {
  status?: SignalReadinessStatus | null;
  nextAction?: string | null;
  contactSummary?: SignalContactRequestSummary | null;
  matchCount?: number | null;
};

type SignalAnalyticsCommonInput = {
  listing: SignalAnalyticsListingInput;
  kernel?: SignalAnalyticsKernelInput | null;
  intentType?: SignalIntentType | null;
  source: string;
};

export function buildSignalAnalyticsMetadata(input: SignalAnalyticsCommonInput): Record<string, unknown> {
  return {
    title: input.listing.title ?? null,
    city: input.listing.city ?? null,
    county: input.listing.county ?? input.listing.city ?? null,
    locality: input.listing.locality ?? input.listing.city ?? null,
    niche: input.listing.niche ?? null,
    industry: input.listing.niche ?? null,
    score: input.listing.score ?? null,
    commercialStage: input.listing.commercialStage ?? null,
    kernelStatus: input.kernel?.status ?? null,
    kernelNextAction: input.kernel?.nextAction ?? null,
    contactStatus: input.kernel?.contactSummary?.status ?? null,
    intentType: input.intentType ?? null,
    matchCount: input.kernel?.matchCount ?? null,
    source: input.source,
  };
}

export function buildSignalOpenMetadata(input: Omit<SignalAnalyticsCommonInput, "source">): Record<string, unknown> {
  return buildSignalAnalyticsMetadata({
    ...input,
    source: "signal_detail",
  });
}

export function buildSignalIntentSelectedMetadata(input: Omit<SignalAnalyticsCommonInput, "source">): Record<string, unknown> {
  return buildSignalAnalyticsMetadata({
    ...input,
    source: "signal_intent_selector",
  });
}
