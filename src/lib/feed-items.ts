import {
  getArticleOrganicScore,
  getArticlePrimaryStatus,
  getCompanyOrganicScore,
  getCompanyPrimaryStatus,
  getLiveTopicPrimaryStatus,
  getReportOrganicScore,
  getReportPrimaryStatus,
  type PrimaryStatus,
} from "@/workspace/status";
import {
  getGeoFitInsight,
  getInterestIntentBoost,
  getPersonalizationScore,
  type InterestIntentProfile,
  type NegativeFeedbackProfile,
} from "@/lib/personalization";
import { classifyCompanyArticleForFlux } from "@/lib/flux-content-contract";
import { buildReportSignalActionKernel } from "@/lib/signal-action-kernel-adapter";
import {
  computeDistributionScore,
  type SignalGenerationPattern,
  type QualifiedEngagementAggregate,
  type SignalPublicationStage,
} from "@/lib/signal-algorithm-contract";
import {
  buildSignalCandidateFromReport,
  buildSignalCandidateFromReportWithExternalRuntime,
  type GeneratedSignalCandidate,
  type ReportSignalGenerationSource,
} from "@/lib/signal-generation-pipeline";
import { buildSourceAuditEntriesFromAdapters } from "@/lib/signal-source-audit";
import type { SignalActionKernel } from "@/lib/signal-action-kernel-contract";
import type { SignalScores } from "@/lib/signal-scoring";
import type { SignalAiInsight, SignalTrustProfile } from "@/lib/signal-surface-contract";
import type { UserProfile } from "@/lib/use-profile";
import { countyByCode } from "@/lib/romania-counties";

export type UnifiedFeedKind = "change" | "request" | "opportunity" | "tender" | "public";
export type UnifiedFeedSource = "report" | "article" | "company" | "live_topic" | "tender";
export type UnifiedFeedTrend = "new" | "up" | "steady";
export type UnifiedFeedStage =
  | "incipient"
  | "calificat"
  | "in_crestere"
  | "in_degradare"
  | "oportunitate_validata";
export type UnifiedFeedLifecycleStatus =
  | "new"
  | "active"
  | "trending"
  | "cooling"
  | "stale"
  | "archived_candidate";
export type UnifiedFeedCta =
  | "Contacteaza"
  | "Vezi firme"
  | "Deschide semnalul"
  | "Participa la calificare"
  | "Vezi cererea"
  | "Vezi cereri"
  | "Raspunde"
  | "Posteaza oferta"
  | "Urmareste";

export type UnifiedFeedIndicator = {
  label: string;
  tone: "neutral" | "positive" | "strong";
};

export type UnifiedFeedItem = {
  key: string;
  kind: UnifiedFeedKind;
  source: UnifiedFeedSource;
  title: string;
  summary: string;
  href?: string | null;
  onOpen?: (() => void) | null;
  cta: UnifiedFeedCta;
  industry?: string | null;
  county?: string | null;
  locality?: string | null;
  trend: UnifiedFeedTrend;
  activityLevel: number;
  urgency: number;
  relevanceScore: number;
  organicScore: number;
  personalizationScore: number;
  freshnessScore: number;
  serendipityScore: number;
  trustScore: number;
  actionabilityScore: number;
  finalScore: number;
  freshnessHours: number | null;
  timestamp: number;
  stage: UnifiedFeedStage;
  lifecycleStatus: UnifiedFeedLifecycleStatus;
  feedType: "SCHIMBARE" | "CERERE" | "OPORTUNITATE" | "LICITATIE" | "PUBLIC";
  
  // Feed Action Contract
  entityType: "report" | "article" | "company" | "live_topic" | "tender";
  entityId: string | number;
  primaryIntent: "open_analysis" | "respond" | "qualify" | "join" | "open_context";
  secondaryIntent: "open_map_origin" | "open_collection" | "watch";
  analysisHref?: string | null;
  mapIntent?: {
    countyCode?: string | null;
    city?: string | null;
    locality?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  collectionHref?: string | null;
  watchKey?: string | null;
  relevanceReason?: string;
  decisionReason?: string[];
  indicators?: UnifiedFeedIndicator[];
  signalActionKernel?: SignalActionKernel | null;
  signalScores?: SignalScores | null;

  // Real business metrics
  metrics?: {
    interestCount?: number;
    companiesCount?: number;
    trendPercentage?: number;
    amount?: string;
    gapScore?: number;
    confidenceScore?: number;
    viewCount?: number;
    commentsCount?: number;
    votesUp?: number;
    votesDown?: number;
    paidTier?: string | null;
    qualityScore?: number;
    verified?: boolean;
    promotionType?: "organic" | "paid" | "promoted";
    geoFitScore?: number;
    interestIntentScore?: number;
    truthScore?: number;
    distributionScore?: number;
    publicationStage?: SignalPublicationStage;
    candidateProfile?: string | null;
    detectedPatterns?: SignalGenerationPattern[];
  };
};

export type FeedReportInput = {
  id: number;
  title: string;
  description: string;
  city: string;
  locality?: string | null;
  countyCode?: string | null;
  niche?: string | null;
  reportType?: string | null;
  profitabilityScore?: number | null;
  investmentMin?: number | null;
  profitMonthly?: number | null;
  updatedAt?: string | null;
  interestCount?: number | null;
  trustVoteCount?: number | null;
  trustPercentage?: number | null;
  aiPriority?: {
    score?: number | null;
    evidenceScore?: number | null;
    opportunityScore?: number | null;
    reasons?: string[] | null;
  } | null;
  evidence?: {
    confidenceScore?: number | null;
    whitespaceScore?: number | null;
  } | null;
  aiInsight?: Partial<Pick<SignalAiInsight, "verdict" | "whyThisReport" | "signalPulse">> | null;
  trustProfile?: Pick<SignalTrustProfile, "confidenceScore" | "signalClass" | "recommendedUse"> | null;
  freshness?: {
    core?: {
      state?: "fresh" | "aging" | "stale" | "missing";
      ageHours?: number | null;
    } | null;
  } | null;
  commercialStage?: {
    bucket?: "radar" | "qualified" | "validated" | null;
    feedKind?: "change" | "opportunity" | null;
    feedStage?: UnifiedFeedStage | null;
    reasonCodes?: string[] | null;
  } | null;
  href: string;
};

export type FeedArticleInput = {
  id: number;
  title: string;
  content: string;
  articleType?: string | null;
  authorName?: string | null;
  companyName?: string | null;
  companyCity?: string | null;
  companyJudet?: string | null;
  companyIndustry?: string | null;
  weightedScore?: number | null;
  votesUp?: number | null;
  votesDown?: number | null;
  viewCount?: number | null;
  commentsCount?: number | null;
  paidTier?: string | null;
  createdAt?: string | null;
  href: string;
};

export type FeedCompanyInput = {
  id: number;
  name: string;
  city: string;
  judet?: string | null;
  countyCode?: string | null;
  industry?: string | null;
  description?: string | null;
  qualityScore?: number | null;
  isPromoted?: boolean;
  paidTier?: string | null;
  verified?: boolean;
  primaryStatus?: "new" | "trending" | "active";
  href: string;
};

export type FeedLiveTopicInput = {
  id: number;
  title: string;
  summary?: string | null;
  description?: string | null;
  category?: "cerere" | "investitie" | "colaborare" | "piata" | string | null;
  countyCode?: string | null;
  locality?: string | null;
  industry?: string | null;
  activeUsers?: number | null;
  spectators?: number | null;
  commentsCount?: number | null;
  trendScore?: number | null;
  createdAt?: string | null;
  onOpen?: (() => void) | null;
};

export type FeedTenderInput = {
  id: string;
  category?: "finantari" | "licitatii" | string | null;
  title: string;
  summary: string;
  url: string;
  officialSource?: string | null;
  publishedAt?: string | null;
  deadlineAt?: string | null;
  estimatedValue?: string | null;
  region?: string | null;
  tag?: string | null;
  domain?: string | null;
  trendIndicator?: number | null;
  authority?: string | null;
};

export type BuildUnifiedFeedItemsInput = {
  reports?: FeedReportInput[];
  articles?: FeedArticleInput[];
  companies?: FeedCompanyInput[];
  topics?: FeedLiveTopicInput[];
  tenders?: FeedTenderInput[];
  profile: UserProfile;
  negativeFeedbackProfile?: NegativeFeedbackProfile | null;
  interestIntentProfile?: InterestIntentProfile | null;
  maxItems?: number;
};

export type BuildUnifiedFeedItemsWithExternalRuntimeResult = {
  items: UnifiedFeedItem[];
  usedLocalRuntimeFallback: boolean;
  runtimeFallbackReason: string | null;
};

function hoursSince(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 3_600_000);
}

function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function feedTypeFor(kind: UnifiedFeedKind): UnifiedFeedItem["feedType"] {
  if (kind === "request") return "CERERE";
  if (kind === "opportunity") return "OPORTUNITATE";
  if (kind === "tender") return "LICITATIE";
  if (kind === "public") return "PUBLIC";
  return "SCHIMBARE";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeToHundred(value: number, max: number): number {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return clamp(Math.round((value / max) * 100), 0, 100);
}

function buildLocationLabel(locality?: string | null, county?: string | null): string | null {
  const city = String(locality ?? "").trim();
  const countyLabel = String(county ?? "").trim();
  if (city && countyLabel && city.toLowerCase() !== countyLabel.toLowerCase()) return `${city}, ${countyLabel}`;
  return city || countyLabel || null;
}

function normalizeSemanticText(value?: string | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function hasQualificationIntent(value?: string | null): boolean {
  const normalized = normalizeSemanticText(value);
  return normalized.includes("validat")
    || normalized.includes("shortlist")
    || normalized.includes("comercial")
    || normalized.includes("calific")
    || normalized.includes("teren");
}

function getSignalClassRank(value?: string | null): 0 | 1 | 2 | 3 {
  const normalized = normalizeSemanticText(value);
  if (normalized.includes("puternic")) return 3;
  if (normalized.includes("validat")) return 2;
  if (normalized.includes("preliminar")) return 1;
  return 0;
}

function getVerdictRank(value?: string | null): 0 | 1 | 2 | 3 {
  const normalized = normalizeSemanticText(value);
  if (normalized.includes("urmarit")) return 3;
  if (normalized.includes("validat")) return 2;
  if (normalized.includes("in curs")) return 1;
  return 0;
}

function appendIndicator(
  target: UnifiedFeedIndicator[],
  seen: Set<string>,
  label: string | null | undefined,
  tone: UnifiedFeedIndicator["tone"] = "neutral",
) {
  const normalized = String(label ?? "").trim();
  if (!normalized) return;
  const key = normalized.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  target.push({ label: normalized, tone });
}

function recencyBoost(hours: number | null): number {
  if (hours == null) return 0;
  if (hours <= 12) return 18;
  if (hours <= 36) return 10;
  if (hours <= 72) return 4;
  return 0;
}

function inferTrend(hours: number | null, activity: number): UnifiedFeedTrend {
  if (hours != null && hours <= 24) return "new";
  if (activity >= 58) return "up";
  return "steady";
}

function canonicalFreshnessScore(
  freshnessHours: number | null,
  explicitState?: "fresh" | "aging" | "stale" | "missing" | null,
): number {
  if (explicitState === "fresh") return 100;
  if (explicitState === "aging") return 68;
  if (explicitState === "stale") return 18;
  if (explicitState === "missing") return 0;
  if (freshnessHours == null) return 0;
  if (freshnessHours <= 12) return 100;
  if (freshnessHours <= 36) return 84;
  if (freshnessHours <= 72) return 64;
  if (freshnessHours <= 168) return 42;
  if (freshnessHours <= 336) return 20;
  return 6;
}

function canonicalPersonalizationScore(rawScore: number): number {
  return normalizeToHundred(rawScore, 220);
}

function blendedRelevanceScore(legacyScore: number, finalScore: number): number {
  // Phase 2 starts with a guarded migration: canonical scoring influences ranking
  // without abruptly discarding the legacy heuristics already live in Flux.
  return Math.round(legacyScore * 0.55 + finalScore * 0.45);
}

function computeFinalScore(input: {
  organicScore: number;
  personalizationScore: number;
  freshnessScore: number;
  serendipityScore?: number;
  trustScore: number;
  actionabilityScore: number;
}): number {
  return Math.round(
    input.organicScore * 0.4
    + input.personalizationScore * 0.25
    + input.freshnessScore * 0.2
    + Number(input.serendipityScore ?? 0) * 0.05
    + input.trustScore * 0.05
    + input.actionabilityScore * 0.05,
  );
}

function buildReportQualifiedEngagementAggregate(report: FeedReportInput): QualifiedEngagementAggregate {
  const follows = Math.max(0, Number(report.interestCount ?? 0));
  const expressedInterest = Math.max(0, Number(report.trustVoteCount ?? 0));
  const uniqueActorCount = Math.max(follows, expressedInterest, 1);

  return {
    views: 0,
    detailOpens: follows,
    follows,
    saves: 0,
    expressedInterest,
    opportunityBuilds: 0,
    introductionRequests: 0,
    introductionsAccepted: 0,
    usefulConversations: 0,
    offersTested: 0,
    collaborationsStarted: 0,
    projectsLaunched: 0,
    uniqueActorCount,
    repeatedActorRatio: uniqueActorCount <= 1 ? 1 : 0.2,
    lastInteractionAt: report.updatedAt ?? null,
  };
}

function lifecyclePriority(status: UnifiedFeedLifecycleStatus): number {
  if (status === "trending") return 5;
  if (status === "new") return 4;
  if (status === "active") return 3;
  if (status === "cooling") return 2;
  if (status === "stale") return 1;
  return 0;
}

function compareFeedItems(a: UnifiedFeedItem, b: UnifiedFeedItem): number {
  if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;

  const lifecycleDiff = lifecyclePriority(b.lifecycleStatus) - lifecyclePriority(a.lifecycleStatus);
  if (lifecycleDiff !== 0) return lifecycleDiff;

  if (b.urgency !== a.urgency) return b.urgency - a.urgency;
  if (b.organicScore !== a.organicScore) return b.organicScore - a.organicScore;
  if (b.personalizationScore !== a.personalizationScore) return b.personalizationScore - a.personalizationScore;
  if (b.freshnessScore !== a.freshnessScore) return b.freshnessScore - a.freshnessScore;
  if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
  if (b.activityLevel !== a.activityLevel) return b.activityLevel - a.activityLevel;
  return a.key.localeCompare(b.key);
}

function consecutiveCount<T extends UnifiedFeedItem["kind"] | UnifiedFeedItem["source"]>(
  items: UnifiedFeedItem[],
  selector: (item: UnifiedFeedItem) => T,
  value: T,
): number {
  let count = 0;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (selector(items[index]) !== value) break;
    count += 1;
  }
  return count;
}

function candidateDiversityPenalty(
  candidate: UnifiedFeedItem,
  current: UnifiedFeedItem[],
  index: number,
): number {
  let penalty = 0;
  const sameKindRun = consecutiveCount(current, (item) => item.kind, candidate.kind);
  const sameSourceRun = consecutiveCount(current, (item) => item.source, candidate.source);

  if (sameKindRun >= 2) penalty += 10_000;
  if (sameSourceRun >= 2) penalty += 10_000;

  const previous = current[current.length - 1];
  if (index < 8 && previous) {
    if (candidate.kind === previous.kind) penalty += 18;
    if (candidate.source === previous.source) penalty += 18;
  }

  if (index < 8) {
    if (candidate.lifecycleStatus === "archived_candidate") penalty += 26;
    else if (candidate.lifecycleStatus === "stale") penalty += 18;
    else if (candidate.lifecycleStatus === "cooling") penalty += 8;
  }

  return penalty;
}

function applyDiversityGuardrails(items: UnifiedFeedItem[]): UnifiedFeedItem[] {
  const remaining = [...items];
  const result: UnifiedFeedItem[] = [];

  while (remaining.length > 0) {
    const index = result.length;
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex += 1) {
      const candidate = remaining[candidateIndex];
      const penalty = candidateDiversityPenalty(candidate, result, index);
      const adjustedScore = candidate.finalScore - penalty;

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestIndex = candidateIndex;
        continue;
      }

      if (adjustedScore === bestScore && compareFeedItems(candidate, remaining[bestIndex]) < 0) {
        bestIndex = candidateIndex;
      }
    }

    result.push(remaining.splice(bestIndex, 1)[0]);
  }

  return result;
}

function inferLifecycleFromPrimaryStatus(
  primaryStatus: PrimaryStatus | null | undefined,
  freshnessHours: number | null,
  activityLevel: number,
  urgency: number,
): UnifiedFeedLifecycleStatus {
  if (primaryStatus === "new") return "new";
  if (primaryStatus === "trending") return "trending";

  if (freshnessHours == null) {
    if (activityLevel >= 72 || urgency >= 72) return "trending";
    if (activityLevel >= 34 || urgency >= 30) return "active";
    return "cooling";
  }

  if (freshnessHours <= 24) return "new";
  if (activityLevel >= 72 || urgency >= 72) return "trending";
  if (freshnessHours <= 96 || activityLevel >= 34 || urgency >= 30) return "active";
  if (freshnessHours <= 240) return "cooling";
  if (freshnessHours <= 720 || activityLevel >= 16 || urgency >= 18) return "stale";
  return "archived_candidate";
}

function inferStage(
  kind: UnifiedFeedKind,
  lifecycleStatus: UnifiedFeedLifecycleStatus,
  activityLevel: number,
  urgency: number,
): UnifiedFeedStage {
  if (
    lifecycleStatus === "cooling"
    || lifecycleStatus === "stale"
    || lifecycleStatus === "archived_candidate"
  ) {
    return "in_degradare";
  }

  if (kind === "opportunity" && (lifecycleStatus === "trending" || activityLevel >= 72) && urgency >= 44) {
    return "oportunitate_validata";
  }

  if (lifecycleStatus === "trending") return "in_crestere";

  if (kind === "request") {
    return activityLevel >= 28 || urgency >= 32 ? "in_crestere" : "incipient";
  }

  if (kind === "tender") {
    return urgency >= 56 || activityLevel >= 58 ? "in_crestere" : "incipient";
  }

  if (kind === "change" || kind === "public") {
    return lifecycleStatus === "new" && activityLevel < 42 ? "incipient" : "in_crestere";
  }

  return activityLevel >= 40 || urgency >= 36 ? "in_crestere" : "incipient";
}

function getReportBusinessSignals(
  report: FeedReportInput,
  activityLevel: number,
  freshnessHours: number | null,
) {
  const profitabilityScore = clamp(Math.round(Number(report.profitabilityScore ?? 0)), 0, 100);
  const validationScore = clamp(
    Math.round(
      Math.max(
        Number(report.evidence?.confidenceScore ?? 0),
        Number(report.trustProfile?.confidenceScore ?? 0),
        Number(report.aiPriority?.evidenceScore ?? 0),
      ),
    ),
    0,
    100,
  );
  const gapScore = clamp(
    Math.round(
      Math.max(
        Number(report.evidence?.whitespaceScore ?? 0),
        Number(report.aiPriority?.opportunityScore ?? 0),
      ),
    ),
    0,
    100,
  );
  const signalPulseScore = clamp(Math.round(Number(report.aiInsight?.signalPulse?.score ?? 0)), 0, 100);
  const interestCount = Math.max(0, Number(report.interestCount ?? 0));
  const reportType = normalizeSemanticText(report.reportType);
  const verdict = String(report.aiInsight?.verdict ?? "").trim();
  const signalClass = String(report.trustProfile?.signalClass ?? "").trim();
  const recommendedUse = String(report.trustProfile?.recommendedUse ?? "").trim();
  const signalClassRank = getSignalClassRank(signalClass);
  const verdictRank = getVerdictRank(verdict);
  const structuralOpportunity = reportType === "business" || reportType === "real_estate";
  const hasGap = gapScore >= 60;
  const hasValidation = validationScore >= 68;
  const hasMomentum = signalPulseScore >= 50
    || interestCount >= 2
    || activityLevel >= 60
    || (freshnessHours != null && freshnessHours <= 72);
  const hasActionPath = profitabilityScore >= 66
    || hasQualificationIntent(verdict)
    || hasQualificationIntent(recommendedUse)
    || (report.investmentMin != null && report.investmentMin > 0)
    || (report.profitMonthly != null && report.profitMonthly > 0);
  const hasOpportunityGrade = signalClassRank >= 3
    || (
      signalClassRank >= 2
      && hasValidation
      && hasGap
      && profitabilityScore >= 64
      && hasActionPath
    );
  const isEmergingSignal = signalPulseScore >= 35
    || interestCount > 0
    || activityLevel >= 34
    || validationScore >= 36
    || gapScore >= 34
    || (freshnessHours != null && freshnessHours <= 168);

  return {
    profitabilityScore,
    validationScore,
    gapScore,
    signalPulseScore,
    verdict,
    signalClass,
    recommendedUse,
    signalClassRank,
    verdictRank,
    structuralOpportunity,
    hasGap,
    hasValidation,
    hasMomentum,
    hasActionPath,
    hasOpportunityGrade,
    isEmergingSignal,
  };
}

function inferReportKind(
  report: FeedReportInput,
  activityLevel: number,
  freshnessHours: number | null,
): UnifiedFeedKind {
  const signals = getReportBusinessSignals(report, activityLevel, freshnessHours);
  if (
    signals.hasOpportunityGrade
    && signals.hasActionPath
    && (signals.verdictRank >= 2 || signals.hasMomentum || signals.structuralOpportunity)
  ) {
    return "opportunity";
  }
  if (signals.isEmergingSignal) return "change";
  return "change";
}

function inferArticleKind(article: FeedArticleInput, activityLevel: number): UnifiedFeedKind {
  void activityLevel;
  const routing = classifyCompanyArticleForFlux(article.articleType);
  if (routing.entersFlux && routing.defaultZone === "request") return "request";
  return "public";
}

function isArticleEligibleForFlux(article: FeedArticleInput, kind: UnifiedFeedKind, activityLevel: number, trustScore: number): boolean {
  void activityLevel;
  void trustScore;
  const routing = classifyCompanyArticleForFlux(article.articleType);
  return routing.entersFlux && kind === routing.defaultZone;
}

function normalizeDisplayText(value?: string | null): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function toSentenceStart(value: string): string {
  const input = normalizeDisplayText(value);
  if (!input) return "";
  return input.charAt(0).toLowerCase() + input.slice(1);
}

function stripArticleLead(value: string): string {
  let output = normalizeDisplayText(value);
  const leadPatterns = [
    /^(am lansat formatul de|am lansat|lansam|lans[aă]m|am deschis|deschidem|am introdus|introducem|anuntam|anunt[aă]m|oferim|venim cu|pregatim|cautam|caut[aă]m|avem nevoie de|solicitam|dorim|intram in|intr[aă]m in|extindem|ne extindem|relocam|reloc[aă]m)\s+/i,
    /^(noi|compania|firma)\s+/i,
  ];

  for (const pattern of leadPatterns) {
    output = output.replace(pattern, "");
  }

  return output.replace(/^[\-\s:]+/, "").replace(/[.!?]+$/, "").trim();
}

function rewriteArticleNarrative(value: string, kind: UnifiedFeedKind, mode: "title" | "summary"): string {
  const input = normalizeDisplayText(value);
  if (!input) return "";

  const requestRules: Array<[RegExp, string]> = [
    [/^(cautam|caut[aă]m)\s+/i, mode === "title" ? "Cerere directa pentru " : "Se cauta "],
    [/^avem nevoie de\s+/i, mode === "title" ? "Cerere directa pentru " : "Este nevoie de "],
    [/^solicitam\s+/i, mode === "title" ? "Cerere directa pentru " : "Se solicita "],
    [/^dorim\s+/i, mode === "title" ? "Cerere directa pentru " : "Se doreste "],
  ];

  const marketRules: Array<[RegExp, string]> = [
    [/^am lansat formatul de\s+/i, "Apare formatul de "],
    [/^am lansat\s+/i, mode === "title" ? "Apare " : "A fost lansat "],
    [/^(lansam|lans[aă]m)\s+/i, "Se lanseaza "],
    [/^am deschis\s+/i, mode === "title" ? "Se deschide " : "S-a deschis "],
    [/^deschidem\s+/i, "Se deschid "],
    [/^am introdus\s+/i, mode === "title" ? "Apare " : "A fost introdus "],
    [/^(introducem|introducem)\s+/i, "Se introduce "],
    [/^(anuntam|anunt[aă]m)\s+/i, "Este anuntat "],
    [/^oferim\s+/i, mode === "title" ? "Este disponibila oferta pentru " : "Este disponibila oferta pentru "],
    [/^venim cu\s+/i, "Apare "],
    [/^pregatim\s+/i, "Se pregateste "],
  ];

  const rules = kind === "request" ? requestRules : marketRules;
  for (const [pattern, replacement] of rules) {
    if (pattern.test(input)) {
      return input.replace(pattern, replacement);
    }
  }

  return input;
}

function buildArticleSurfaceTitle(article: FeedArticleInput, kind: UnifiedFeedKind): string {
  const rawTitle = normalizeDisplayText(article.title || article.companyName || article.authorName || "Semnal de piata");
  if (!rawTitle) return "Semnal de piata";

  const semanticLead = rewriteArticleNarrative(rawTitle, kind, "title");
  const semanticSubject = stripArticleLead(rawTitle) || stripArticleLead(semanticLead) || normalizeDisplayText(article.companyIndustry || article.companyName || "semnal nou");
  const subject = toSentenceStart(semanticSubject);
  const location = buildLocationLabel(article.companyCity, article.companyJudet);
  const locationSuffix = location ? ` in ${location}` : "";
  const industry = normalizeDisplayText(article.companyIndustry);
  const articleType = String(article.articleType ?? "").toLowerCase();

  if (kind === "request") {
    return `Cerere activa pentru ${subject}${locationSuffix}`;
  }

  if (kind === "opportunity") {
    if (articleType === "oferta") return `Oferta validata pentru ${subject}${locationSuffix}`;
    if (articleType === "studiu-caz") return `Validare comerciala pentru ${subject}${locationSuffix}`;
    return `Oportunitate validata pentru ${subject}${locationSuffix}`;
  }

  if (kind === "change") {
    if (articleType === "stire" || articleType === "anunt") return `Semnal nou in piata pentru ${subject}${locationSuffix}`;
    if (industry) return `Miscare noua in ${industry}${locationSuffix}`;
    return `Semnal nou pentru ${subject}${locationSuffix}`;
  }

  return semanticLead;
}

function buildArticleSurfaceSummary(article: FeedArticleInput, kind: UnifiedFeedKind): string {
  const rawSummary = normalizeDisplayText(article.content || article.companyName || article.authorName || article.title);
  if (!rawSummary) return article.companyName ? `${article.companyName} activeaza in piata locala.` : "Semnal nou in piata.";
  const rewrittenSummary = rewriteArticleNarrative(rawSummary, kind, "summary");
  if (kind === "request") return `Piata exprima o nevoie explicita: ${toSentenceStart(rewrittenSummary)}`;
  if (kind === "opportunity") return `Semnalul are dovada comerciala suficienta: ${toSentenceStart(rewrittenSummary)}`;
  if (kind === "change") return `Semnal de piata aflat in observatie: ${toSentenceStart(rewrittenSummary)}`;
  return rewrittenSummary;
}

function inferTopicKind(category?: string | null): UnifiedFeedKind {
  const value = String(category ?? "").toLowerCase();
  if (value === "cerere" || value === "colaborare") return "request";
  if (value === "investitie") return "opportunity";
  if (value === "piata") return "change";
  return "change";
}

function inferCompanyKind(primaryStatus?: string | null): UnifiedFeedKind {
  if (primaryStatus === "new" || primaryStatus === "trending") return "change";
  return "opportunity";
}

function isLiveTopicEligibleForFlux(topic: FeedLiveTopicInput, kind: UnifiedFeedKind, activityLevel: number, trustScore: number): boolean {
  const category = normalizeSemanticText(topic.category);
  if (kind !== "request") return false;
  if (category !== "cerere" && category !== "colaborare") return false;
  return activityLevel >= 20 || trustScore >= 36;
}

function ctaFor(kind: UnifiedFeedKind, source: UnifiedFeedSource): UnifiedFeedCta {
  if (source === "tender") return "Posteaza oferta";
  if (source === "company") return "Contacteaza";
  if (source === "live_topic") return kind === "request" ? "Vezi cererea" : "Urmareste";
  if (kind === "request") return source === "article" || source === "report" ? "Vezi cererea" : "Raspunde";
  if (kind === "opportunity") return "Participa la calificare";
  if (kind === "tender") return "Posteaza oferta";
  if (kind === "change") return "Deschide semnalul";
  return "Urmareste";
}

function buildDecisionContract(input: {
  kind: UnifiedFeedKind;
  source: UnifiedFeedSource;
  locality?: string | null;
  county?: string | null;
  industry?: string | null;
  freshnessHours: number | null;
  activityLevel: number;
  trustScore: number;
  actionabilityScore: number;
  stage: UnifiedFeedStage;
  lifecycleStatus: UnifiedFeedLifecycleStatus;
  interestCount?: number | null;
  trendPercentage?: number | null;
  verified?: boolean;
  amount?: string | null;
  validationScore?: number | null;
  gapScore?: number | null;
  signalPulseScore?: number | null;
  verdictLabel?: string | null;
  signalClass?: string | null;
  commentsCount?: number | null;
  votesUp?: number | null;
  votesDown?: number | null;
  viewCount?: number | null;
  promotionType?: "organic" | "paid" | "promoted";
  geoFitLabel?: string | null;
  geoFitScore?: number | null;
  interestIntentScore?: number | null;
  truthScore?: number | null;
  distributionScore?: number | null;
  publicationStage?: SignalPublicationStage | null;
}): Pick<UnifiedFeedItem, "relevanceReason" | "decisionReason" | "indicators"> {
  const locationLabel = buildLocationLabel(input.locality, input.county);
  const interestCount = Number(input.interestCount ?? 0);
  const trendPercentage = Number(input.trendPercentage ?? 0);
  const validationScore = clamp(Math.round(Number(input.validationScore ?? 0)), 0, 100);
  const gapScore = clamp(Math.round(Number(input.gapScore ?? 0)), 0, 100);
  const signalPulseScore = clamp(Math.round(Number(input.signalPulseScore ?? 0)), 0, 100);
  const verdictLabel = String(input.verdictLabel ?? "").trim();
  const signalClass = String(input.signalClass ?? "").trim();
  const commentsCount = Math.max(0, Number(input.commentsCount ?? 0));
  const votesUp = Math.max(0, Number(input.votesUp ?? 0));
  const votesDown = Math.max(0, Number(input.votesDown ?? 0));
  const viewCount = Math.max(0, Number(input.viewCount ?? 0));
  const netVotes = Math.max(0, votesUp - votesDown);
  const geoFitLabel = String(input.geoFitLabel ?? "").trim();
  const geoFitScore = Math.max(0, Number(input.geoFitScore ?? 0));
  const interestIntentScore = Math.max(0, Number(input.interestIntentScore ?? 0));
  const truthScore = clamp(Math.round(Number(input.truthScore ?? 0)), 0, 100);
  const distributionScore = clamp(Math.round(Number(input.distributionScore ?? 0)), 0, 100);
  const publicationStage = input.publicationStage ?? null;
  const reasons: string[] = [];
  const indicators: UnifiedFeedIndicator[] = [];
  const seenIndicators = new Set<string>();

  const hasFreshSignal = input.freshnessHours != null && input.freshnessHours <= 48;
  const hasGrowingInterest = trendPercentage >= 20 || input.stage === "in_crestere" || input.lifecycleStatus === "trending";
  const hasSustainedInterest = interestCount >= 3 || input.activityLevel >= 62;
  const hasStrongValidation = input.trustScore >= 58 || input.stage === "oportunitate_validata";
  const hasClearAction = input.actionabilityScore >= 60;
  const hasCommercialGap = gapScore >= 58;
  const hasGapToWatch = gapScore >= 36 && gapScore < 58;
  const hasSolidValidation = validationScore >= 70;
  const hasMediumValidation = validationScore >= 48 && validationScore < 70;
  const hasReportQualificationCue = hasQualificationIntent(verdictLabel) || hasQualificationIntent(signalClass);
  const isBuildableOpportunity = publicationStage === "buildable_opportunity";
  const isFeaturedSignal = publicationStage === "featured_signal";
  const isFeedVisibleSignal = publicationStage === "feed_visible";
  const isSuppressedSignal = publicationStage === "suppressed";

  if (input.kind === "request") {
    reasons.push("este o nevoie explicita din piata");
    if (input.source === "article") {
      if (commentsCount > 0) reasons.push("are deja raspunsuri active");
      else if (hasFreshSignal) reasons.push("este suficient de proaspata pentru raspuns rapid");
      if (netVotes > 0) reasons.push("primeste voturi utile");
      else if (viewCount > 0) reasons.push("atrage atentie reala in piata");

      appendIndicator(indicators, seenIndicators, commentsCount > 0 ? `${commentsCount} raspunsuri active` : null, "strong");
      appendIndicator(indicators, seenIndicators, netVotes > 0 ? `${netVotes} voturi utile` : null, "positive");
      appendIndicator(indicators, seenIndicators, viewCount > 0 ? `${viewCount} vizualizari` : null, "neutral");
      appendIndicator(
        indicators,
        seenIndicators,
        input.promotionType === "paid"
          ? "Promovare platita"
          : input.promotionType === "organic"
            ? "Distribuire organica"
            : null,
        input.promotionType === "paid" ? "strong" : "positive",
      );
      appendIndicator(indicators, seenIndicators, geoFitLabel || locationLabel, geoFitScore >= 58 ? "positive" : "neutral");
    } else {
      if (input.amount) reasons.push("are buget declarat");
      if (input.verified) reasons.push("vine de la o firma verificata");
      else if (hasFreshSignal) reasons.push("este suficient de proaspata pentru raspuns rapid");

      appendIndicator(indicators, seenIndicators, input.verified ? "Firma verificata" : null, "strong");
      appendIndicator(indicators, seenIndicators, hasFreshSignal ? "Postat recent" : null, "positive");
      appendIndicator(indicators, seenIndicators, input.amount ? `Buget ${input.amount}` : null, "strong");
      appendIndicator(indicators, seenIndicators, interestCount > 0 ? `${interestCount} firme interesate` : null, "positive");
      appendIndicator(indicators, seenIndicators, geoFitLabel || locationLabel, geoFitScore >= 58 ? "positive" : "neutral");
    }
  } else if (input.kind === "opportunity") {
    if (input.source === "report") {
      reasons.push(
        isBuildableOpportunity
          ? `a trecut pragul de oportunitate construibila (${truthScore}/100 truth)`
          : hasCommercialGap
            ? "are gap comercial recognoscibil"
            : "are unghi comercial suficient de clar",
      );
      reasons.push(
        isBuildableOpportunity || isFeaturedSignal
          ? `are distributie eligibila si dovada suficienta (${distributionScore}/100 distributie)`
          : hasSolidValidation
            ? `are dovada buna in date (${validationScore}/100)`
            : "are dovada suficienta pentru calificare",
      );
      if (signalClass) reasons.push(`este deja incadrat ca ${signalClass.toLowerCase()}`);
      reasons.push(
        hasReportQualificationCue || hasClearAction
          ? "are pas urmator clar pentru shortlist sau validare rapida"
          : "poate fi transformata in actiune comerciala",
      );

      appendIndicator(indicators, seenIndicators, isBuildableOpportunity ? "Buildable opportunity" : null, "strong");
      appendIndicator(indicators, seenIndicators, isFeaturedSignal ? "Featured signal" : null, "strong");
      appendIndicator(indicators, seenIndicators, hasCommercialGap ? "Gap comercial detectat" : null, "strong");
      appendIndicator(indicators, seenIndicators, truthScore > 0 ? `Truth ${truthScore}/100` : null, isBuildableOpportunity ? "strong" : "positive");
      appendIndicator(indicators, seenIndicators, distributionScore > 0 ? `Distribuție ${distributionScore}/100` : null, isFeaturedSignal || isBuildableOpportunity ? "strong" : "neutral");
      appendIndicator(indicators, seenIndicators, hasSolidValidation ? `Dovada ${validationScore}/100` : null, "strong");
      appendIndicator(indicators, seenIndicators, signalClass || verdictLabel || null, "positive");
      appendIndicator(indicators, seenIndicators, hasGrowingInterest || signalPulseScore >= 55 ? "Interes in crestere" : null, "positive");
      appendIndicator(indicators, seenIndicators, geoFitLabel || locationLabel, geoFitScore >= 58 ? "positive" : "neutral");
      appendIndicator(indicators, seenIndicators, interestCount > 0 ? `${interestCount} urmaritori activi` : null, "positive");
    } else {
      reasons.push("are dovada suficienta pentru calificare");
      reasons.push(hasClearAction ? "are pas urmator clar" : "poate fi transformata in actiune comerciala");
      if (hasSustainedInterest || hasGrowingInterest) reasons.push("interesul este deja sustinut");

      appendIndicator(indicators, seenIndicators, hasGrowingInterest ? "Interes in crestere" : null, "strong");
      appendIndicator(indicators, seenIndicators, hasStrongValidation ? "Dovada buna" : null, "strong");
      appendIndicator(indicators, seenIndicators, geoFitLabel || locationLabel, geoFitScore >= 58 ? "positive" : "neutral");
      appendIndicator(indicators, seenIndicators, interestCount > 0 ? `${interestCount} urmaritori activi` : null, "positive");
      appendIndicator(indicators, seenIndicators, input.verified ? "Firma verificata" : null, "positive");
    }
  } else if (input.kind === "change") {
    if (input.source === "report") {
      reasons.push(
        isFeedVisibleSignal
          ? "a trecut pragul minim de publicare, dar ramane semnal in observatie"
          : isSuppressedSignal
            ? "este tinut jos de pragurile de adevar sau incredere"
            : "arata o miscare reala de piata sau un interes nou",
      );
      reasons.push(
        isSuppressedSignal
          ? "distributia este plafonata pana apare dovada mai buna"
          : hasGapToWatch
            ? "sugereaza un posibil gap comercial, dar inca nu este suficient validat"
            : "merita urmarita pentru timing si directie",
      );
      reasons.push(
        isFeedVisibleSignal
          ? `are eligibilitate minima in feed (${distributionScore}/100 distributie), nu inca statut de oportunitate`
          : hasMediumValidation
            ? `dovada este in curs (${validationScore}/100), nu inca suficienta pentru calificare`
            : "dovezile comerciale sunt inca prea subtiri pentru calificare",
      );
      if (signalClass) reasons.push(`ramane ${signalClass.toLowerCase()} pentru moment`);

      appendIndicator(indicators, seenIndicators, isFeedVisibleSignal ? "Feed eligible" : null, "positive");
      appendIndicator(indicators, seenIndicators, isSuppressedSignal ? "Sub pragul de promovare" : null, "neutral");
      appendIndicator(indicators, seenIndicators, hasGrowingInterest || signalPulseScore >= 45 ? "Interes in crestere" : "Miscare de piata", "positive");
      appendIndicator(indicators, seenIndicators, truthScore > 0 ? `Truth ${truthScore}/100` : null, isFeedVisibleSignal ? "positive" : "neutral");
      appendIndicator(indicators, seenIndicators, distributionScore > 0 ? `Distribuție ${distributionScore}/100` : null, isFeedVisibleSignal ? "positive" : "neutral");
      appendIndicator(indicators, seenIndicators, hasFreshSignal ? "Semnal proaspat" : null, "positive");
      appendIndicator(indicators, seenIndicators, hasGapToWatch ? "Gap de urmarit" : null, "neutral");
      appendIndicator(indicators, seenIndicators, hasMediumValidation ? "Dovada in curs" : null, "neutral");
      appendIndicator(indicators, seenIndicators, signalClass || verdictLabel || null, "neutral");
      appendIndicator(indicators, seenIndicators, geoFitLabel || locationLabel, geoFitScore >= 58 ? "positive" : "neutral");
    } else {
      reasons.push("arata o miscare reala de piata derivata dintr-un articol de firma");
      reasons.push("merita urmarita pentru timing si directie");
      reasons.push(hasStrongValidation || hasClearAction ? "nu are inca suficienta claritate pentru calificare" : "dovada este inca insuficienta pentru calificare");

      appendIndicator(indicators, seenIndicators, input.promotionType === "paid" ? "Promovare platita" : "Distribuire organica", input.promotionType === "paid" ? "strong" : "positive");
      appendIndicator(indicators, seenIndicators, netVotes > 0 ? `${netVotes} voturi utile` : null, "positive");
      appendIndicator(indicators, seenIndicators, viewCount > 0 ? `${viewCount} vizualizari` : null, "neutral");
      appendIndicator(indicators, seenIndicators, hasFreshSignal ? "Semnal proaspat" : null, "positive");
      appendIndicator(indicators, seenIndicators, locationLabel, "neutral");
    }
  } else {
    appendIndicator(indicators, seenIndicators, geoFitLabel || locationLabel, geoFitScore >= 58 ? "positive" : "neutral");
  }

  if (input.kind !== "request" && input.industry) {
    appendIndicator(indicators, seenIndicators, input.industry, "neutral");
  }

  if (interestIntentScore >= 52) {
    appendIndicator(indicators, seenIndicators, "In interesul tau activ", "strong");
  } else if (interestIntentScore >= 24) {
    appendIndicator(indicators, seenIndicators, "Aproape de interesul tau", "positive");
  }

  const relevanceReason = input.kind === "request"
    ? `Este o cerere activa: exprima o nevoie explicita${locationLabel ? ` in ${locationLabel}` : ""} si merita raspuns rapid.`
    : input.kind === "opportunity"
      ? input.source === "report"
        ? isBuildableOpportunity
          ? `Este o oportunitate construibila: trece pragurile de adevar si distributie${locationLabel ? ` in ${locationLabel}` : ""}, deci merita dusa spre validare activa.`
          : `Este o oportunitate: are nu doar miscare de piata${locationLabel ? ` in ${locationLabel}` : ""}, ci si dovada comerciala suficienta pentru calificare.`
        : `Este o oportunitate: semnalul are dovada suficienta${locationLabel ? ` in ${locationLabel}` : ""} si merita calificat.`
      : input.source === "report"
        ? isFeedVisibleSignal
          ? `Este un semnal eligibil in feed: arata o directie reala${locationLabel ? ` in ${locationLabel}` : ""}, dar dovada comerciala nu justifica inca o oportunitate construita.`
          : isSuppressedSignal
            ? `Este un semnal in observatie: exista miscare${locationLabel ? ` in ${locationLabel}` : ""}, dar pragurile de adevar sau incredere inca nu permit promovare puternica.`
            : `Este o schimbare: semnalul arata o directie reala${locationLabel ? ` in ${locationLabel}` : ""}, dar dovada comerciala este inca in curs.`
        : `Este o schimbare: semnalul arata miscare de piata${locationLabel ? ` in ${locationLabel}` : ""}, dar inca nu are claritatea necesara pentru calificare.`;

  return {
    relevanceReason,
    decisionReason: reasons.slice(0, 3),
    indicators: indicators.slice(0, input.kind === "request" ? 4 : 3),
  };
}

function reportActionabilityScore(input: {
  kind: UnifiedFeedKind;
  interestCount: number;
  freshnessHours: number | null;
  profitabilityScore: number;
  gapScore: number;
  validationScore: number;
  qualificationCue?: boolean;
}): number {
  const base = input.kind === "opportunity" ? 56 : 34;
  const interestLift = Math.min(12, Math.max(0, input.interestCount) * 2);
  const freshnessLift = input.freshnessHours != null && input.freshnessHours <= 72 ? 8 : 0;
  const profitabilityLift = input.profitabilityScore >= 62 ? 12 : input.profitabilityScore >= 48 ? 6 : 0;
  const gapLift = input.gapScore >= 58 ? 14 : input.gapScore >= 40 ? 7 : 0;
  const validationLift = input.validationScore >= 68 ? 12 : input.validationScore >= 50 ? 6 : 0;
  const qualificationLift = input.qualificationCue ? 8 : 0;
  return clamp(base + interestLift + freshnessLift + profitabilityLift + gapLift + validationLift + qualificationLift, 0, 100);
}

function resolveReportKindByPublicationStage(
  inferredKind: UnifiedFeedKind,
  publicationStage: SignalPublicationStage,
): UnifiedFeedKind {
  if (publicationStage === "buildable_opportunity") {
    return "opportunity";
  }
  if (publicationStage === "featured_signal" || publicationStage === "feed_visible") {
    return inferredKind === "opportunity" ? "change" : inferredKind;
  }
  return "change";
}

function articleActionabilityScore(kind: UnifiedFeedKind, activityLevel: number): number {
  if (kind === "request") return clamp(74 + Math.round(activityLevel * 0.18), 0, 100);
  if (kind === "opportunity") return clamp(64 + Math.round(activityLevel * 0.16), 0, 100);
  if (kind === "change") return clamp(44 + Math.round(activityLevel * 0.14), 0, 100);
  return clamp(34 + Math.round(activityLevel * 0.12), 0, 100);
}

function companyActionabilityScore(company: FeedCompanyInput, activityLevel: number): number {
  return clamp(
    54
      + (company.verified ? 16 : 0)
      + (company.isPromoted ? 4 : 0)
      + Math.round(activityLevel * 0.16),
    0,
    100,
  );
}

function liveTopicOrganicScore(topic: FeedLiveTopicInput): number {
  return Number(topic.trendScore ?? 0) * 0.7
    + (Number(topic.activeUsers ?? 0) + Number(topic.spectators ?? 0)) * 2.1
    + Number(topic.commentsCount ?? 0) * 2;
}

function liveTopicTrustScore(topic: FeedLiveTopicInput): number {
  const participantScore = Math.min(45, (Number(topic.activeUsers ?? 0) + Number(topic.spectators ?? 0)) * 3);
  const discussionScore = Math.min(25, Number(topic.commentsCount ?? 0) * 2);
  const trendScore = Math.min(30, Number(topic.trendScore ?? 0) * 0.3);
  return clamp(Math.round(participantScore + discussionScore + trendScore), 0, 100);
}

function tenderOrganicScore(tender: FeedTenderInput, urgency: number): number {
  const trendScore = Number(tender.trendIndicator ?? 0);
  const sourceTrust = tender.officialSource || tender.authority ? 18 : 0;
  return clamp(Math.round(trendScore * 0.7 + urgency * 0.3 + sourceTrust), 0, 100);
}

function buildReportGenerationSource(report: FeedReportInput): ReportSignalGenerationSource {
  const countyName = countyByCode(report.countyCode)?.name ?? report.countyCode ?? null;
  return {
    id: report.id,
    title: report.title,
    description: report.description,
    locality: report.locality,
    city: report.city,
    county: countyName,
    niche: report.niche,
    googlePlacesQuery: [report.niche, report.locality ?? report.city, countyName]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(", "),
    reportType: report.reportType,
    profitabilityScore: report.profitabilityScore,
    interestCount: report.interestCount,
    trustVoteCount: report.trustVoteCount,
    trustPercentage: report.trustPercentage,
    updatedAt: report.updatedAt,
    aiPriorityScore: report.aiPriority?.score,
    aiEvidenceScore: report.aiPriority?.evidenceScore,
    signalPulseScore: report.aiInsight?.signalPulse?.score,
    evidenceConfidence: report.evidence?.confidenceScore,
    whitespaceScore: report.evidence?.whitespaceScore,
  };
}

function buildReportItemWithCandidate(
  report: FeedReportInput,
  profile: UserProfile,
  generatedCandidate: GeneratedSignalCandidate,
  negativeFeedbackProfile?: NegativeFeedbackProfile | null,
  interestIntentProfile?: InterestIntentProfile | null,
): UnifiedFeedItem {
  const personalizationInput = {
    kind: "report",
    entityType: "report",
    entityId: report.id,
    source: "report",
    city: report.city,
    locality: report.locality,
    county: report.countyCode,
    countyCode: report.countyCode,
    industry: report.niche,
    niche: report.niche,
    reportType: report.reportType,
  } as const;
  const geoFit = getGeoFitInsight(profile, personalizationInput);
  const interestIntentScore = getInterestIntentBoost(personalizationInput, interestIntentProfile);
  const personalizationRaw = getPersonalizationScore(profile, personalizationInput, negativeFeedbackProfile, interestIntentProfile);
  const freshnessHours = report.freshness?.core?.ageHours ?? hoursSince(report.updatedAt);
  const freshnessState = report.freshness?.core?.state;
  const opportunityScore = Number(report.profitabilityScore ?? 0);
  const priorityScore = Number(report.aiPriority?.score ?? 0);
  const evidenceScore = Number(report.evidence?.confidenceScore ?? 0);
  const interestScore = Math.min(Number(report.interestCount ?? 0) * 2.5, 20);
  const whitespaceScore = Number(report.evidence?.whitespaceScore ?? 0);
  const signalPulseScore = Number(report.aiInsight?.signalPulse?.score ?? 0);
  const activityLevel = clamp(
    Math.round(
      opportunityScore * 0.55
      + priorityScore * 0.45
      + Math.min(whitespaceScore * 0.18, 14)
      + Math.min(signalPulseScore * 0.2, 14)
      + interestScore,
    ),
    0,
    100,
  );
  const legacyFreshnessScore = freshnessState === "fresh" ? 18 : freshnessState === "aging" ? 8 : freshnessState === "stale" ? -6 : recencyBoost(freshnessHours);
  const legacyRelevanceScore = personalizationRaw + opportunityScore * 1.45 + priorityScore * 1.2 + evidenceScore * 0.22 + interestScore + legacyFreshnessScore;
  const urgency = clamp(Math.round(priorityScore * 0.9 + interestScore * 0.7 + Math.max(legacyFreshnessScore, 0)), 0, 100);
  const reportSignals = getReportBusinessSignals(report, activityLevel, freshnessHours);
  const inferredKind = inferReportKind(report, activityLevel, freshnessHours);
  const primaryStatus = getReportPrimaryStatus({
    createdAt: report.updatedAt,
    updatedAt: report.updatedAt,
    profitabilityScore: report.profitabilityScore,
    aiPriorityScore: report.aiPriority?.score,
    confidenceScore: report.evidence?.confidenceScore,
  });
  const lifecycleStatus = inferLifecycleFromPrimaryStatus(primaryStatus, freshnessHours, activityLevel, urgency);
  const organicScore = normalizeToHundred(getReportOrganicScore({
    createdAt: report.updatedAt,
    updatedAt: report.updatedAt,
    profitabilityScore: report.profitabilityScore,
    aiPriorityScore: report.aiPriority?.score,
    confidenceScore: report.evidence?.confidenceScore,
  }), 110);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(freshnessHours, freshnessState ?? null);
  const trustScore = normalizeToHundred(Math.max(evidenceScore, Number(report.trustProfile?.confidenceScore ?? 0)), 100);
  const signalScores = generatedCandidate.signalScores;
  const truthSnapshot = generatedCandidate.truthSnapshot;
  const sourceAuditEntries = buildSourceAuditEntriesFromAdapters(generatedCandidate.sourceAdapters);
  const qualifiedEngagement = buildReportQualifiedEngagementAggregate(report);
  const distributionScore = computeDistributionScore({
    signalId: generatedCandidate.signalId,
    truth: truthSnapshot,
    engagement: qualifiedEngagement,
    freshnessScore,
    personalizationFitScore: personalizationScore,
    promotionState: "organic",
  });
  const kindFromPublication = resolveReportKindByPublicationStage(inferredKind, truthSnapshot.publicationStage);
  const kind = (report.commercialStage?.feedKind === "change" || report.commercialStage?.feedKind === "opportunity")
    ? report.commercialStage.feedKind
    : kindFromPublication;
  const inferredStage = inferStage(kind, lifecycleStatus, activityLevel, urgency);
  const stage = report.commercialStage?.feedStage ?? inferredStage;
  const actionabilityScore = reportActionabilityScore({
    kind,
    interestCount: Number(report.interestCount ?? 0),
    freshnessHours,
    profitabilityScore: reportSignals.profitabilityScore,
    gapScore: reportSignals.gapScore,
    validationScore: reportSignals.validationScore,
    qualificationCue: hasQualificationIntent(reportSignals.verdict) || hasQualificationIntent(reportSignals.signalClass),
  });
  const signalActionKernel = buildReportSignalActionKernel({
    signalEntityId: report.id,
    publicCategory: kind === "request" ? "request" : kind === "opportunity" ? "opportunity" : "change",
    title: report.title,
    verdict: reportSignals.verdict || report.description,
    county: report.countyCode,
    locality: report.locality ?? report.city,
    niche: report.niche,
    reportType: report.reportType,
    profitabilityScore: reportSignals.profitabilityScore,
    gapScore: reportSignals.gapScore,
    validationScore: reportSignals.validationScore,
    signalPulseScore: reportSignals.signalPulseScore,
    actionabilityScore,
    trustPercentage: report.trustPercentage,
    interestCount: report.interestCount,
    freshnessHours,
    signalClass: reportSignals.signalClass,
    recommendedUse: reportSignals.recommendedUse,
    commercialStage: report.commercialStage,
    sourceAuditEntries,
    signalScores,
  });
  const serendipityScore = 0;
  const legacyCanonicalScore = computeFinalScore({
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
  });
  const finalScore = distributionScore.eligible
    ? distributionScore.finalScore
    : Math.round(legacyCanonicalScore * 0.35);
  const relevanceScore = blendedRelevanceScore(legacyRelevanceScore, finalScore);
  const decisionContract = buildDecisionContract({
    kind,
    source: "report",
    locality: report.locality ?? report.city,
    county: report.countyCode,
    industry: report.niche,
    freshnessHours,
    activityLevel,
    trustScore,
    actionabilityScore,
    stage,
    lifecycleStatus,
    interestCount: report.interestCount ?? Math.floor(activityLevel / 10),
    validationScore: reportSignals.validationScore,
    gapScore: reportSignals.gapScore,
    signalPulseScore: reportSignals.signalPulseScore,
    verdictLabel: reportSignals.verdict,
    signalClass: reportSignals.signalClass,
    promotionType: "organic",
    geoFitLabel: geoFit.label,
    geoFitScore: geoFit.score,
    interestIntentScore,
    truthScore: truthSnapshot.truthScore,
    distributionScore: distributionScore.finalScore,
    publicationStage: truthSnapshot.publicationStage,
  });
  return {
    key: `report:${report.id}`,
    kind,
    source: "report",
    title: report.title,
    summary: report.description,
    href: report.href,
    onOpen: null,
    cta: ctaFor(kind, "report"),
    industry: report.niche,
    county: report.countyCode,
    locality: report.locality ?? report.city,
    trend: inferTrend(freshnessHours, activityLevel),
    activityLevel,
    urgency,
    relevanceScore,
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
    finalScore,
    freshnessHours,
    timestamp: toTimestamp(report.updatedAt),
    stage,
    lifecycleStatus,
    feedType: feedTypeFor(kind),

    entityType: "report",
    entityId: report.id,
    primaryIntent: "open_analysis",
    secondaryIntent: "open_map_origin",
    analysisHref: report.href,
    mapIntent: {
      countyCode: report.countyCode,
      city: report.city,
      locality: report.locality,
    },
    watchKey: `report:${report.id}`,
    ...decisionContract,
    signalActionKernel,
    signalScores,
    metrics: {
      interestCount: report.interestCount ?? Math.floor(activityLevel / 10),
      trendPercentage: report.trustPercentage ?? undefined,
      gapScore: reportSignals.gapScore,
      confidenceScore: reportSignals.validationScore,
      commentsCount: report.trustVoteCount ?? 0,
      geoFitScore: geoFit.score,
      interestIntentScore,
      truthScore: truthSnapshot.truthScore,
      distributionScore: distributionScore.finalScore,
      publicationStage: truthSnapshot.publicationStage,
      candidateProfile: generatedCandidate.generationInput.profileKey,
      detectedPatterns: generatedCandidate.generationInput.detectedPatterns,
    },
  };
}

function buildReportItem(
  report: FeedReportInput,
  profile: UserProfile,
  negativeFeedbackProfile?: NegativeFeedbackProfile | null,
  interestIntentProfile?: InterestIntentProfile | null,
): UnifiedFeedItem {
  return buildReportItemWithCandidate(
    report,
    profile,
    buildSignalCandidateFromReport(buildReportGenerationSource(report)),
    negativeFeedbackProfile,
    interestIntentProfile,
  );
}

async function buildReportItemWithExternalRuntime(
  report: FeedReportInput,
  profile: UserProfile,
  negativeFeedbackProfile?: NegativeFeedbackProfile | null,
  interestIntentProfile?: InterestIntentProfile | null,
): Promise<{ item: UnifiedFeedItem; usedLocalRuntimeFallback: boolean; runtimeFallbackReason: string | null }> {
  try {
    const generatedCandidate = await buildSignalCandidateFromReportWithExternalRuntime(
      buildReportGenerationSource(report),
    );
    return {
      item: buildReportItemWithCandidate(
        report,
        profile,
        generatedCandidate,
        negativeFeedbackProfile,
        interestIntentProfile,
      ),
      usedLocalRuntimeFallback: Boolean(generatedCandidate.usedLocalRuntimeFallback),
      runtimeFallbackReason: generatedCandidate.runtimeFallbackReason ?? null,
    };
  } catch {
    return {
      item: buildReportItem(
        report,
        profile,
        negativeFeedbackProfile,
        interestIntentProfile,
      ),
      usedLocalRuntimeFallback: true,
      runtimeFallbackReason: "runtime_error",
    };
  }
}

function buildArticleItem(
  article: FeedArticleInput,
  profile: UserProfile,
  negativeFeedbackProfile?: NegativeFeedbackProfile | null,
  interestIntentProfile?: InterestIntentProfile | null,
): UnifiedFeedItem | null {
  const personalizationInput = {
    kind: "article",
    entityType: "article",
    entityId: article.id,
    source: "article",
    city: article.companyCity,
    county: article.companyJudet,
    industry: article.companyIndustry,
    articleType: article.articleType,
  } as const;
  const geoFit = getGeoFitInsight(profile, personalizationInput);
  const interestIntentScore = getInterestIntentBoost(personalizationInput, interestIntentProfile);
  const personalizationRaw = getPersonalizationScore(profile, personalizationInput, negativeFeedbackProfile, interestIntentProfile);
  const freshnessHours = hoursSince(article.createdAt);
  const engagementScore = Math.max(0, Number(article.votesUp ?? 0) - Number(article.votesDown ?? 0)) * 4
    + Math.min(Number(article.viewCount ?? 0) / 20, 16)
    + Math.min(Number(article.commentsCount ?? 0) * 3, 15);
  const promotionScore = article.paidTier === "gold" ? 16 : article.paidTier === "silver" ? 8 : 0;
  const activityLevel = clamp(Math.round(engagementScore * 1.7), 0, 100);
  const legacyRelevanceScore = personalizationRaw + Number(article.weightedScore ?? 0) + engagementScore + promotionScore + recencyBoost(freshnessHours);
  const kind = inferArticleKind(article, activityLevel);
  const summary = buildArticleSurfaceSummary(article, kind);
  const title = buildArticleSurfaceTitle(article, kind);
  const urgency = clamp(Math.round(activityLevel * 0.7 + recencyBoost(freshnessHours)), 0, 100);
  const primaryStatus = getArticlePrimaryStatus({
    createdAt: article.createdAt,
    votesUp: Number(article.votesUp ?? 0),
    votesDown: Number(article.votesDown ?? 0),
    commentsCount: article.commentsCount,
    weightedScore: article.weightedScore,
    viewCount: article.viewCount,
  });
  const lifecycleStatus = inferLifecycleFromPrimaryStatus(primaryStatus, freshnessHours, activityLevel, urgency);
  const stage = inferStage(kind, lifecycleStatus, activityLevel, urgency);
  const organicScore = normalizeToHundred(getArticleOrganicScore({
    createdAt: article.createdAt,
    votesUp: Number(article.votesUp ?? 0),
    votesDown: Number(article.votesDown ?? 0),
    commentsCount: article.commentsCount,
    weightedScore: article.weightedScore,
    viewCount: article.viewCount,
  }), 85);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(freshnessHours);
  const trustScore = clamp(
    (article.paidTier === "gold" || article.paidTier === "silver") && engagementScore < 12
      ? 26
      : normalizeToHundred(
          Math.max(0, Number(article.commentsCount ?? 0)) * 2 + Math.max(0, Number(article.votesUp ?? 0) - Number(article.votesDown ?? 0)) * 3,
          60,
        ),
    0,
    100,
  );
  const actionabilityScore = articleActionabilityScore(kind, activityLevel);
  const serendipityScore = 0;
  const finalScore = computeFinalScore({
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
  });
  const relevanceScore = blendedRelevanceScore(legacyRelevanceScore, finalScore);
  if (!isArticleEligibleForFlux(article, kind, activityLevel, trustScore)) return null;
  let primaryIntent: UnifiedFeedItem["primaryIntent"] = "open_context";
  if (kind === "request") primaryIntent = "respond";
  else if (kind === "opportunity") primaryIntent = "open_analysis";
  const decisionContract = buildDecisionContract({
    kind,
    source: "article",
    locality: article.companyCity,
    county: article.companyJudet,
    industry: article.companyIndustry,
    freshnessHours,
    activityLevel,
    trustScore,
    actionabilityScore,
    stage,
    lifecycleStatus,
    interestCount: article.commentsCount ?? article.votesUp ?? 0,
    commentsCount: article.commentsCount,
    votesUp: article.votesUp,
    votesDown: article.votesDown,
    viewCount: article.viewCount,
    promotionType: article.paidTier === "gold" || article.paidTier === "silver" ? "paid" : "organic",
    geoFitLabel: geoFit.label,
    geoFitScore: geoFit.score,
    interestIntentScore,
  });

  return {
    key: `article:${article.id}`,
    kind,
    source: "article",
    title,
    summary,
    href: article.href,
    onOpen: null,
    cta: ctaFor(kind, "article"),
    industry: article.companyIndustry,
    county: article.companyJudet,
    locality: article.companyCity,
    trend: inferTrend(freshnessHours, activityLevel),
    activityLevel,
    urgency,
    relevanceScore,
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
    finalScore,
    freshnessHours,
    timestamp: toTimestamp(article.createdAt),
    stage,
    lifecycleStatus,
    feedType: feedTypeFor(kind),
    
    // Action Contract
    entityType: "article",
    entityId: article.id,
    primaryIntent,
    secondaryIntent: "open_map_origin",
    analysisHref: article.href,
    mapIntent: {
      countyCode: article.companyJudet,
      city: article.companyCity,
      locality: article.companyCity,
    },
    watchKey: `article:${article.id}`,
    ...decisionContract,
    metrics: {
      interestCount: article.commentsCount ?? article.votesUp ?? 0,
      companiesCount: Math.floor(engagementScore / 15),
      viewCount: Number(article.viewCount ?? 0),
      commentsCount: Number(article.commentsCount ?? 0),
      votesUp: Number(article.votesUp ?? 0),
      votesDown: Number(article.votesDown ?? 0),
      paidTier: article.paidTier ?? null,
      promotionType: article.paidTier === "gold" || article.paidTier === "silver" ? "paid" : "organic",
      geoFitScore: geoFit.score,
      interestIntentScore,
    },
  };
}

function buildCompanyItem(_company: FeedCompanyInput, _profile: UserProfile): UnifiedFeedItem | null {
  // Companies remain discoverable in Harta and search, but they no longer enter
  // Flux as raw standalone cards because they blur the contract of Radar/Oportunitate.
  return null;
}

export function buildLegacyCompanyItem(
  company: FeedCompanyInput,
  profile: UserProfile,
  negativeFeedbackProfile?: NegativeFeedbackProfile | null,
  interestIntentProfile?: InterestIntentProfile | null,
): UnifiedFeedItem {
  const personalizationInput = {
    kind: "company",
    entityType: "company",
    entityId: company.id,
    source: "company",
    city: company.city,
    county: company.judet,
    countyCode: company.countyCode,
    industry: company.industry,
  } as const;
  const geoFit = getGeoFitInsight(profile, personalizationInput);
  const interestIntentScore = getInterestIntentBoost(personalizationInput, interestIntentProfile);
  const personalizationRaw = getPersonalizationScore(profile, personalizationInput, negativeFeedbackProfile, interestIntentProfile);
  const promotionScore = company.paidTier === "gold" ? 16 : company.paidTier === "silver" ? 8 : company.isPromoted ? 5 : 0;
  const trustSeed = company.verified ? 10 : 0;
  const statusScore = company.primaryStatus === "trending" ? 12 : company.primaryStatus === "new" ? 9 : 4;
  const qualityScore = Number(company.qualityScore ?? 0);
  const activityLevel = clamp(Math.round(qualityScore * 2.1 + statusScore * 2.5), 0, 100);
  const kind = inferCompanyKind(company.primaryStatus);
  const urgency = clamp(Math.round(statusScore * 5 + trustSeed + promotionScore), 0, 100);
  const primaryStatus = company.primaryStatus ?? getCompanyPrimaryStatus({
    isPromoted: company.isPromoted,
    verified: company.verified,
    qualityScore: company.qualityScore,
  });
  const lifecycleStatus = inferLifecycleFromPrimaryStatus(primaryStatus, null, activityLevel, urgency);
  const stage = inferStage(kind, lifecycleStatus, activityLevel, urgency);
  const organicScore = normalizeToHundred(getCompanyOrganicScore({
    isPromoted: company.isPromoted,
    verified: company.verified,
    qualityScore: company.qualityScore,
  }), 100);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(null);
  const trustScore = normalizeToHundred((company.verified ? 24 : 0) + qualityScore * 0.76, 100);
  const actionabilityScore = companyActionabilityScore(company, activityLevel);
  const serendipityScore = 0;
  const finalScore = computeFinalScore({
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
  });
  const legacyRelevanceScore = personalizationRaw + qualityScore * 2.4 + promotionScore + trustSeed + statusScore;
  const relevanceScore = blendedRelevanceScore(legacyRelevanceScore, finalScore);
  const decisionContract = buildDecisionContract({
    kind,
    source: "company",
    locality: company.city,
    county: company.judet ?? company.countyCode,
    industry: company.industry,
    freshnessHours: null,
    activityLevel,
    trustScore,
    actionabilityScore,
    stage,
    lifecycleStatus,
    trendPercentage: company.primaryStatus === "trending" ? 24 : null,
    verified: company.verified,
    geoFitLabel: geoFit.label,
    geoFitScore: geoFit.score,
    interestIntentScore,
  });
  return {
    key: `company:${company.id}`,
    kind,
    source: "company",
    title: company.name,
    summary: company.description || `${company.industry ?? "Firma activa"} in ${company.city}`,
    href: company.href,
    onOpen: null,
    cta: ctaFor(kind, "company"),
    industry: company.industry,
    county: company.judet ?? company.countyCode,
    locality: company.city,
    trend: company.primaryStatus === "new" ? "new" : activityLevel >= 52 ? "up" : "steady",
    activityLevel,
    urgency,
    relevanceScore,
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
    finalScore,
    freshnessHours: null,
    timestamp: 0,
    stage,
    lifecycleStatus,
    feedType: feedTypeFor(kind),
    
    // Action Contract
    entityType: "company",
    entityId: company.id,
    primaryIntent: "qualify",
    secondaryIntent: "open_map_origin",
    analysisHref: company.href,
    mapIntent: {
      countyCode: company.countyCode ?? company.judet,
      city: company.city,
      locality: company.city,
    },
    watchKey: `company:${company.id}`,
    ...decisionContract,
    metrics: {
      trendPercentage: company.primaryStatus === "trending" ? 24 : undefined,
      qualityScore,
      verified: company.verified,
      paidTier: company.paidTier ?? null,
      promotionType: company.paidTier === "gold" || company.paidTier === "silver" ? "paid" : company.isPromoted ? "promoted" : "organic",
      geoFitScore: geoFit.score,
      interestIntentScore,
    },
  };
}

function buildTopicItem(
  topic: FeedLiveTopicInput,
  profile: UserProfile,
  negativeFeedbackProfile?: NegativeFeedbackProfile | null,
  interestIntentProfile?: InterestIntentProfile | null,
): UnifiedFeedItem | null {
  const personalizationInput = {
    kind: "live",
    entityType: "live_topic",
    entityId: topic.id,
    source: "live_topic",
    city: topic.locality,
    locality: topic.locality,
    county: topic.countyCode,
    countyCode: topic.countyCode,
    industry: topic.industry,
    category: topic.category,
    keywords: [topic.title, topic.summary, topic.description],
  } as const;
  const geoFit = getGeoFitInsight(profile, personalizationInput);
  const interestIntentScore = getInterestIntentBoost(personalizationInput, interestIntentProfile);
  const personalizationRaw = getPersonalizationScore(profile, personalizationInput, negativeFeedbackProfile, interestIntentProfile);
  const freshnessHours = hoursSince(topic.createdAt);
  const activityLevel = clamp(
    Math.round(
      Number(topic.trendScore ?? 0) * 1.4
      + Number(topic.activeUsers ?? 0) * 4
      + Math.min(Number(topic.commentsCount ?? 0) * 1.8, 18),
    ),
    0,
    100,
  );
  const kind = inferTopicKind(topic.category);
  const urgency = clamp(Math.round(activityLevel * 0.75 + recencyBoost(freshnessHours)), 0, 100);
  const primaryStatus = getLiveTopicPrimaryStatus({
    createdAt: topic.createdAt,
    trendScore: topic.trendScore,
    commentsCount: topic.commentsCount,
    activeUsers: topic.activeUsers,
    spectators: topic.spectators,
  });
  const lifecycleStatus = inferLifecycleFromPrimaryStatus(primaryStatus, freshnessHours, activityLevel, urgency);
  const stage = inferStage(kind, lifecycleStatus, activityLevel, urgency);
  const organicScore = normalizeToHundred(liveTopicOrganicScore(topic), 100);
  const personalizationScore = canonicalPersonalizationScore(personalizationRaw);
  const freshnessScore = canonicalFreshnessScore(freshnessHours);
  const trustScore = liveTopicTrustScore(topic);
  const actionabilityScore = kind === "request"
    ? clamp(70 + Math.round(activityLevel * 0.16), 0, 100)
    : kind === "opportunity"
      ? clamp(62 + Math.round(activityLevel * 0.14), 0, 100)
      : clamp(42 + Math.round(activityLevel * 0.12), 0, 100);
  const serendipityScore = 0;
  const finalScore = computeFinalScore({
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
  });
  if (!isLiveTopicEligibleForFlux(topic, kind, activityLevel, trustScore)) return null;
  const legacyRelevanceScore =
    personalizationRaw
    + Number(topic.trendScore ?? 0) * 2.2
    + Number(topic.activeUsers ?? 0) * 3.6
    + Math.min(Number(topic.commentsCount ?? 0) * 1.6, 16)
    + recencyBoost(freshnessHours);
  const decisionContract = buildDecisionContract({
    kind,
    source: "live_topic",
    locality: topic.locality,
    county: topic.countyCode,
    industry: topic.industry,
    freshnessHours,
    activityLevel,
    trustScore,
    actionabilityScore,
    stage,
    lifecycleStatus,
    interestCount: topic.activeUsers ?? topic.spectators ?? 0,
    trendPercentage: topic.trendScore ?? null,
    geoFitLabel: geoFit.label,
    geoFitScore: geoFit.score,
    interestIntentScore,
  });
  return {
    key: `topic:${topic.id}`,
    kind,
    source: "live_topic",
    title: topic.title,
    summary: topic.summary || topic.description || topic.title,
    href: null,
    onOpen: topic.onOpen ?? null,
    cta: ctaFor(kind, "live_topic"),
    industry: topic.industry,
    county: topic.countyCode,
    locality: topic.locality,
    trend: inferTrend(freshnessHours, activityLevel),
    activityLevel,
    urgency,
    relevanceScore: blendedRelevanceScore(legacyRelevanceScore, finalScore),
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
    finalScore,
    freshnessHours,
    timestamp: toTimestamp(topic.createdAt),
    stage,
    lifecycleStatus,
    feedType: feedTypeFor(kind),
    
    // Action Contract
    entityType: "live_topic",
    entityId: topic.id,
    primaryIntent: "join",
    secondaryIntent: "open_map_origin",
    analysisHref: null, // Topic-ul nu are o pagina de analiza clasica, intra in conversatie
    mapIntent: {
      countyCode: topic.countyCode,
      city: topic.locality,
      locality: topic.locality,
    },
    watchKey: `topic:${topic.id}`,
    ...decisionContract,
    metrics: {
      interestCount: topic.activeUsers ?? topic.spectators ?? 0,
      trendPercentage: topic.trendScore ?? undefined,
      geoFitScore: geoFit.score,
      interestIntentScore,
    },
  };
}

function buildTenderItem(tender: FeedTenderInput): UnifiedFeedItem {
  const timestamp = toTimestamp(tender.publishedAt ?? tender.deadlineAt);
  const publishedHours = hoursSince(tender.publishedAt ?? tender.deadlineAt);
  const deadlineHours = hoursSince(tender.deadlineAt);
  const trendIndicator = Number(tender.trendIndicator ?? 0);
  const activityLevel = clamp(Math.round(Math.max(trendIndicator, 28)), 0, 100);
  const urgency = clamp(
    Math.round(
      Math.max(18, trendIndicator * 0.65)
      + (deadlineHours != null ? Math.max(0, 28 - Math.min(deadlineHours, 28)) : 0),
    ),
    0,
    100,
  );
  const kind: UnifiedFeedKind = "tender";
  const lifecycleStatus = inferLifecycleFromPrimaryStatus(null, publishedHours, activityLevel, urgency);
  const stage = inferStage(kind, lifecycleStatus, activityLevel, urgency);
  const organicScore = tenderOrganicScore(tender, urgency);
  const personalizationScore = 0;
  const freshnessScore = canonicalFreshnessScore(publishedHours);
  const trustScore = clamp(
    (tender.officialSource ? 34 : 0)
      + (tender.authority ? 24 : 0)
      + (tender.estimatedValue ? 12 : 0),
    0,
    100,
  );
  const actionabilityScore = clamp(72 + Math.round(urgency * 0.12), 0, 100);
  const serendipityScore = 0;
  const finalScore = computeFinalScore({
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
  });
  const legacyRelevanceScore = trendIndicator + urgency;
  return {
    key: `tender:${tender.id}`,
    kind,
    source: "tender",
    title: tender.title,
    summary: tender.summary,
    href: tender.url,
    onOpen: null,
    cta: ctaFor(kind, "tender"),
    industry: tender.domain ?? tender.tag,
    county: tender.region,
    locality: tender.region,
    trend: trendIndicator >= 60 ? "up" : "new",
    activityLevel,
    urgency,
    relevanceScore: blendedRelevanceScore(legacyRelevanceScore, finalScore),
    organicScore,
    personalizationScore,
    freshnessScore,
    serendipityScore,
    trustScore,
    actionabilityScore,
    finalScore,
    freshnessHours: deadlineHours,
    timestamp,
    stage,
    lifecycleStatus,
    feedType: feedTypeFor(kind),

    entityType: "tender",
    entityId: tender.id,
    primaryIntent: "open_context",
    secondaryIntent: "watch",
    analysisHref: tender.url,
    mapIntent: {
      countyCode: tender.region,
      city: tender.region,
      locality: tender.region,
    },
    watchKey: `tender:${tender.id}`,
    metrics: {
      trendPercentage: trendIndicator,
      amount: tender.estimatedValue ?? undefined,
    },
  };
}

export function buildUnifiedFeedItems(input: BuildUnifiedFeedItemsInput): UnifiedFeedItem[] {
  const reports = input.reports ?? [];
  const articles = input.articles ?? [];
  const companies = input.companies ?? [];
  const topics = input.topics ?? [];
  const tenders = input.tenders ?? [];
  const items = [
    ...reports.map((report) => buildReportItem(report, input.profile, input.negativeFeedbackProfile, input.interestIntentProfile)),
    ...articles.map((article) => buildArticleItem(article, input.profile, input.negativeFeedbackProfile, input.interestIntentProfile)),
    ...companies.map((company) => buildCompanyItem(company, input.profile)),
    ...topics.map((topic) => buildTopicItem(topic, input.profile, input.negativeFeedbackProfile, input.interestIntentProfile)),
    ...tenders.map((tender) => buildTenderItem(tender)),
  ].filter((item): item is UnifiedFeedItem => Boolean(item));

  const canonicallySorted = [...items].sort(compareFeedItems);
  const diversified = applyDiversityGuardrails(canonicallySorted);
  return diversified.slice(0, input.maxItems ?? 200);
}

export async function buildUnifiedFeedItemsWithExternalRuntime(
  input: BuildUnifiedFeedItemsInput,
): Promise<BuildUnifiedFeedItemsWithExternalRuntimeResult> {
  const reports = input.reports ?? [];
  const articles = input.articles ?? [];
  const companies = input.companies ?? [];
  const topics = input.topics ?? [];
  const tenders = input.tenders ?? [];

  const reportItems = await Promise.all(
    reports.map((report) => buildReportItemWithExternalRuntime(
      report,
      input.profile,
      input.negativeFeedbackProfile,
      input.interestIntentProfile,
    )),
  );

  const items = [
    ...reportItems.map((entry) => entry.item),
    ...articles.map((article) => buildArticleItem(article, input.profile, input.negativeFeedbackProfile, input.interestIntentProfile)),
    ...companies.map((company) => buildCompanyItem(company, input.profile)),
    ...topics.map((topic) => buildTopicItem(topic, input.profile, input.negativeFeedbackProfile, input.interestIntentProfile)),
    ...tenders.map((tender) => buildTenderItem(tender)),
  ].filter((item): item is UnifiedFeedItem => Boolean(item));

  const canonicallySorted = [...items].sort(compareFeedItems);
  const diversified = applyDiversityGuardrails(canonicallySorted);
  return {
    items: diversified.slice(0, input.maxItems ?? 200),
    usedLocalRuntimeFallback: reportItems.some((entry) => entry.usedLocalRuntimeFallback),
    runtimeFallbackReason:
      reportItems.find((entry) => entry.usedLocalRuntimeFallback)?.runtimeFallbackReason ?? null,
  };
}
