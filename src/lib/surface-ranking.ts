import {
  getArticleOrganicScore,
  getCompanyOrganicScore,
  getReportOrganicScore,
} from "@/workspace/status";
import {
  getPersonalizationScore,
  type InterestIntentProfile,
  type NegativeFeedbackProfile,
} from "@/lib/personalization";
import type { UserProfile } from "@/lib/use-profile";

type RankingContext = {
  profile: UserProfile;
  negativeFeedbackProfile?: NegativeFeedbackProfile | null;
  interestIntentProfile?: InterestIntentProfile | null;
};

type ReportRankingInput = {
  city?: string | null;
  locality?: string | null;
  county?: string | null;
  countyCode?: string | null;
  niche?: string | null;
  reportType?: string | null;
  profitabilityScore?: number | null;
  aiPriorityScore?: number | null;
  confidenceScore?: number | null;
  updatedAt?: string | null;
};

type ArticleRankingInput = {
  entityId?: string | number | null;
  source?: string | null;
  city?: string | null;
  county?: string | null;
  industry?: string | null;
  articleType?: string | null;
  weightedScore?: number | null;
  votesUp?: number | null;
  votesDown?: number | null;
  commentsCount?: number | null;
  viewCount?: number | null;
  paidTier?: string | null;
  createdAt?: string | null;
};

type CompanyRankingInput = {
  entityId?: string | number | null;
  source?: string | null;
  city?: string | null;
  county?: string | null;
  countyCode?: string | null;
  industry?: string | null;
  businessType?: string | null;
  qualityScore?: number | null;
  isPromoted?: boolean | null;
  verified?: boolean | null;
  paidTier?: string | null;
  createdAt?: string | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeToHundred(value: number, maxReference: number): number {
  if (!Number.isFinite(value) || maxReference <= 0) return 0;
  return clamp(Math.round((value / maxReference) * 100), 0, 100);
}

function canonicalPersonalizationScore(rawScore: number): number {
  return normalizeToHundred(rawScore, 220);
}

function canonicalFreshnessScore(hours: number | null): number {
  if (hours === null) return 36;
  if (hours <= 6) return 100;
  if (hours <= 24) return 76;
  if (hours <= 72) return 56;
  if (hours <= 168) return 36;
  if (hours <= 336) return 20;
  return 6;
}

function hoursSince(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 3_600_000);
}

function computeSurfaceScore(input: {
  organicScore: number;
  personalizationScore: number;
  freshnessScore: number;
  trustScore: number;
  actionabilityScore: number;
}): number {
  return Math.round(
    input.organicScore * 0.4
    + input.personalizationScore * 0.25
    + input.freshnessScore * 0.2
    + input.trustScore * 0.05
    + input.actionabilityScore * 0.1,
  );
}

export function getReportSurfaceScore(context: RankingContext, input: ReportRankingInput): number {
  const personalizationRaw = getPersonalizationScore(
    context.profile,
    {
      kind: "report",
      entityType: "report",
      city: input.city,
      locality: input.locality,
      county: input.county ?? input.countyCode,
      countyCode: input.countyCode,
      industry: input.niche,
      niche: input.niche,
      reportType: input.reportType,
    },
    context.negativeFeedbackProfile,
    context.interestIntentProfile,
  );
  const organicScore = normalizeToHundred(getReportOrganicScore({
    createdAt: input.updatedAt,
    updatedAt: input.updatedAt,
    profitabilityScore: input.profitabilityScore,
    aiPriorityScore: input.aiPriorityScore,
    confidenceScore: input.confidenceScore,
  }), 110);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(hoursSince(input.updatedAt));
  const trustScore = normalizeToHundred(Math.max(Number(input.confidenceScore ?? 0), Number(input.aiPriorityScore ?? 0) * 0.85), 100);
  const actionabilityScore = clamp(
    34
    + Math.round(Number(input.profitabilityScore ?? 0) * 0.38)
    + Math.round(Number(input.aiPriorityScore ?? 0) * 0.22),
    0,
    100,
  );
  return computeSurfaceScore({ organicScore, personalizationScore, freshnessScore, trustScore, actionabilityScore });
}

export function getArticleSurfaceScore(context: RankingContext, input: ArticleRankingInput): number {
  const votesUp = Number(input.votesUp ?? 0);
  const votesDown = Number(input.votesDown ?? 0);
  const commentsCount = Number(input.commentsCount ?? 0);
  const personalizationRaw = getPersonalizationScore(
    context.profile,
    {
      kind: "article",
      entityType: "article",
      entityId: input.entityId,
      source: input.source,
      city: input.city,
      county: input.county,
      industry: input.industry,
      articleType: input.articleType,
    },
    context.negativeFeedbackProfile,
    context.interestIntentProfile,
  );
  const organicScore = normalizeToHundred(getArticleOrganicScore({
    createdAt: input.createdAt,
    votesUp,
    votesDown,
    commentsCount,
    weightedScore: input.weightedScore,
    viewCount: input.viewCount,
  }), 85);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(hoursSince(input.createdAt));
  const engagementScore = Math.max(0, votesUp - votesDown) * 3 + commentsCount * 2;
  const trustScore = clamp(
    (input.paidTier === "gold" || input.paidTier === "silver") && engagementScore < 12
      ? 26
      : normalizeToHundred(engagementScore, 60),
    0,
    100,
  );
  const actionabilityScore = clamp(
    32
    + Math.round(Math.max(0, votesUp - votesDown) * 2.2)
    + Math.round(commentsCount * 1.8)
    + (input.paidTier === "gold" ? 8 : input.paidTier === "silver" ? 4 : 0),
    0,
    100,
  );
  return computeSurfaceScore({ organicScore, personalizationScore, freshnessScore, trustScore, actionabilityScore });
}

export function getCompanySurfaceScore(context: RankingContext, input: CompanyRankingInput): number {
  const personalizationRaw = getPersonalizationScore(
    context.profile,
    {
      kind: "company",
      entityType: "company",
      entityId: input.entityId,
      source: input.source,
      city: input.city,
      county: input.county ?? input.countyCode,
      countyCode: input.countyCode,
      industry: input.industry,
      businessType: input.businessType,
    },
    context.negativeFeedbackProfile,
    context.interestIntentProfile,
  );
  const qualityScore = Number(input.qualityScore ?? 0);
  const organicScore = normalizeToHundred(getCompanyOrganicScore({
    createdAt: input.createdAt,
    isPromoted: input.isPromoted,
    verified: input.verified,
    qualityScore: input.qualityScore,
  }), 100);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(hoursSince(input.createdAt));
  const trustScore = normalizeToHundred((input.verified ? 24 : 0) + qualityScore * 0.76, 100);
  const actionabilityScore = clamp(
    34
    + Math.round(qualityScore * 0.34)
    + (input.isPromoted ? 10 : 0)
    + (input.paidTier === "gold" ? 10 : input.paidTier === "silver" ? 5 : 0),
    0,
    100,
  );
  return computeSurfaceScore({ organicScore, personalizationScore, freshnessScore, trustScore, actionabilityScore });
}
