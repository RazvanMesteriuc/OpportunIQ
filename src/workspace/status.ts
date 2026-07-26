export type PrimaryStatus = "new" | "trending" | "active" | "stale";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function freshnessBoost(updatedAt?: string | null, createdAt?: string | null): number {
  const reference = updatedAt ?? createdAt;
  if (!reference) return 10;
  const hours = Math.max(0, (Date.now() - new Date(reference).getTime()) / 36e5);
  if (!Number.isFinite(hours)) return 10;
  if (hours <= 24) return 32;
  if (hours <= 72) return 22;
  if (hours <= 168) return 12;
  return 4;
}

function derivePrimaryStatus(score: number, updatedAt?: string | null, createdAt?: string | null): PrimaryStatus {
  const freshness = freshnessBoost(updatedAt, createdAt);
  const combined = score + freshness;
  if (freshness >= 30 || combined >= 78) return "new";
  if (combined >= 62) return "trending";
  if (combined >= 36) return "active";
  return "stale";
}

export function getReportOrganicScore(input: {
  createdAt?: string | null;
  profitabilityScore?: number | null;
  aiPriorityScore?: number | null;
  confidenceScore?: number | null;
  updatedAt?: string | null;
}): number {
  return clamp(
    asNumber(input.profitabilityScore) * 0.38
      + asNumber(input.aiPriorityScore) * 0.34
      + asNumber(input.confidenceScore) * 0.2
      + freshnessBoost(input.updatedAt, input.createdAt) * 0.8,
    0,
    100,
  );
}

export function getReportPrimaryStatus(input: {
  createdAt?: string | null;
  profitabilityScore?: number | null;
  aiPriorityScore?: number | null;
  confidenceScore?: number | null;
  updatedAt?: string | null;
}): PrimaryStatus {
  return derivePrimaryStatus(getReportOrganicScore(input), input.updatedAt, input.createdAt);
}

export function getArticleOrganicScore(input: {
  weightedScore?: number | null;
  votesUp?: number | null;
  votesDown?: number | null;
  commentsCount?: number | null;
  viewCount?: number | null;
  createdAt?: string | null;
}): number {
  const engagement = asNumber(input.votesUp) * 2 - asNumber(input.votesDown) + asNumber(input.commentsCount) * 1.5;
  const views = Math.min(25, Math.round(asNumber(input.viewCount) / 80));
  return clamp(
    asNumber(input.weightedScore) * 0.45
      + engagement * 0.6
      + views
      + freshnessBoost(undefined, input.createdAt),
    0,
    100,
  );
}

export function getArticlePrimaryStatus(input: {
  weightedScore?: number | null;
  votesUp?: number | null;
  votesDown?: number | null;
  commentsCount?: number | null;
  viewCount?: number | null;
  createdAt?: string | null;
}): PrimaryStatus {
  return derivePrimaryStatus(getArticleOrganicScore(input), undefined, input.createdAt);
}

export function getCompanyOrganicScore(input: {
  qualityScore?: number | null;
  isPromoted?: boolean | null;
  verified?: boolean | null;
  createdAt?: string | null;
}): number {
  return clamp(
    asNumber(input.qualityScore) * 0.75
      + (input.verified ? 12 : 0)
      + (input.isPromoted ? 8 : 0)
      + freshnessBoost(undefined, input.createdAt),
    0,
    100,
  );
}

export function getCompanyPrimaryStatus(input: {
  qualityScore?: number | null;
  isPromoted?: boolean | null;
  verified?: boolean | null;
  createdAt?: string | null;
}): PrimaryStatus {
  return derivePrimaryStatus(getCompanyOrganicScore(input), undefined, input.createdAt);
}

export function getLiveTopicPrimaryStatus(input: {
  createdAt?: string | null;
  trendScore?: number | null;
  commentsCount?: number | null;
  activeUsers?: number | null;
  spectators?: number | null;
  updatedAt?: string | null;
}): PrimaryStatus {
  const score = clamp(
    asNumber(input.trendScore) * 0.9
      + asNumber(input.commentsCount) * 1.4
      + asNumber(input.activeUsers) * 1.2
      + asNumber(input.spectators) * 0.4
      + freshnessBoost(input.updatedAt, input.createdAt),
    0,
    100,
  );
  return derivePrimaryStatus(score, input.updatedAt, input.createdAt);
}
