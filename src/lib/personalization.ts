import type { UserProfile } from "@/lib/use-profile";
import {
  getCanonicalActorRole,
} from "./canonical-role-contract";
import { getCountyProximityTier, resolveCountyCode, type CountyProximityTier } from "@/lib/romania-counties";

type PersonalizableKind = "article" | "company" | "report" | "live";

export type NegativeFeedbackProfile = {
  hiddenEntityKeys?: string[];
  entityPenalties?: Record<string, number>;
  countyPenalties?: Record<string, number>;
  industryPenalties?: Record<string, number>;
  sourcePenalties?: Record<string, number>;
};

export type InterestIntentProfile = {
  entityBoosts?: Record<string, number>;
  countyBoosts?: Record<string, number>;
  industryBoosts?: Record<string, number>;
  sourceBoosts?: Record<string, number>;
};

export type PersonalizableInput = {
  kind: PersonalizableKind;
  entityType?: string | null;
  entityId?: string | number | null;
  source?: string | null;
  city?: string | null;
  locality?: string | null;
  county?: string | null;
  countyCode?: string | null;
  industry?: string | null;
  niche?: string | null;
  category?: string | null;
  businessType?: string | null;
  articleType?: string | null;
  reportType?: string | null;
  keywords?: ReadonlyArray<string | null | undefined>;
};

export type GeoFitInsight = {
  score: number;
  tier: CountyProximityTier;
  label: string | null;
  matchedCountyCode?: string | null;
};

function normalize(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesNeedle(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack.includes(needle) || needle.includes(haystack);
}

function getPenalty(map: Record<string, number> | undefined, key: string): number {
  if (!map || !key) return 0;
  const value = Number(map[key]);
  return Number.isFinite(value) ? value : 0;
}

function buildEntityPenaltyKey(entityType?: string | null, entityId?: string | number | null): string {
  const type = normalize(entityType);
  const id = String(entityId ?? "").trim();
  if (!type || !id) return "";
  return `${type}:${id}`;
}

function getNegativeFeedbackPenalty(item: PersonalizableInput, feedbackProfile?: NegativeFeedbackProfile | null): number {
  if (!feedbackProfile) return 0;

  const entityKey = buildEntityPenaltyKey(item.entityType ?? item.kind, item.entityId);
  const countyKey = normalize(item.countyCode || item.county);
  const industryKey = normalize(
    item.industry
    || item.niche
    || item.category
    || item.businessType
    || item.articleType
    || item.reportType,
  );
  const sourceKey = normalize(item.source);

  let penalty = 0;

  if (entityKey && Array.isArray(feedbackProfile.hiddenEntityKeys) && feedbackProfile.hiddenEntityKeys.includes(entityKey)) {
    penalty += 220;
  }

  penalty += getPenalty(feedbackProfile.entityPenalties, entityKey);
  penalty += getPenalty(feedbackProfile.countyPenalties, countyKey);
  penalty += getPenalty(feedbackProfile.industryPenalties, industryKey);
  penalty += Math.round(getPenalty(feedbackProfile.sourcePenalties, sourceKey) * 0.7);

  return penalty;
}

export function getInterestIntentBoost(item: PersonalizableInput, interestProfile?: InterestIntentProfile | null): number {
  if (!interestProfile) return 0;

  const entityKey = buildEntityPenaltyKey(item.entityType ?? item.kind, item.entityId);
  const countyKey = normalize(item.countyCode || item.county);
  const industryKey = normalize(
    item.industry
    || item.niche
    || item.category
    || item.businessType
    || item.articleType
    || item.reportType,
  );
  const sourceKey = normalize(item.source);

  const boost =
    getPenalty(interestProfile.entityBoosts, entityKey)
    + getPenalty(interestProfile.countyBoosts, countyKey)
    + getPenalty(interestProfile.industryBoosts, industryKey)
    + Math.round(getPenalty(interestProfile.sourceBoosts, sourceKey) * 0.75);

  return Math.min(180, Math.max(0, boost));
}

function getItemCountyCode(item: PersonalizableInput): string | null {
  return resolveCountyCode(item.countyCode || item.county || item.locality || item.city);
}

function getProfilePrimaryCountyCode(profile: UserProfile): string | null {
  return resolveCountyCode(profile.judet || profile.city);
}

function getProfileInterestCountyCodes(profile: UserProfile): string[] {
  const values = new Set<string>();
  const primary = getProfilePrimaryCountyCode(profile);
  if (primary) values.add(primary);
  for (const county of profile.counties ?? []) {
    const code = resolveCountyCode(county);
    if (code) values.add(code);
  }
  return [...values];
}

function labelForTier(tier: CountyProximityTier): string | null {
  switch (tier) {
    case "same":
      return "In judetul tau";
    case "metro":
      return "In zona ta metropolitana";
    case "near":
      return "Judet apropiat";
    case "regional":
      return "Relevant regional";
    default:
      return null;
  }
}

export function getGeoFitInsight(profile: UserProfile, item: PersonalizableInput): GeoFitInsight {
  if (!profile.setup) return { score: 0, tier: "unknown", label: null, matchedCountyCode: null };

  const profileCity = normalize(profile.city);
  const itemCity = normalize(item.locality || item.city);
  const itemCountyCode = getItemCountyCode(item);
  const candidateCounties = getProfileInterestCountyCodes(profile);

  if (profileCity && itemCity && itemCity === profileCity) {
    return {
      score: 120,
      tier: "same",
      label: "In localitatea ta",
      matchedCountyCode: itemCountyCode,
    };
  }

  if (!itemCountyCode || candidateCounties.length === 0) {
    return { score: 0, tier: "unknown", label: null, matchedCountyCode: itemCountyCode };
  }

  let best: GeoFitInsight = { score: 0, tier: "far", label: null, matchedCountyCode: itemCountyCode };

  for (const candidate of candidateCounties) {
    const tier = getCountyProximityTier(candidate, itemCountyCode);
    const isPrimary = candidate === getProfilePrimaryCountyCode(profile);
    const explicitInterest = (profile.counties ?? []).some((value) => resolveCountyCode(value) === candidate);

    let score = 0;
    switch (tier) {
      case "same":
        score = explicitInterest ? 76 : 70;
        break;
      case "metro":
        score = isPrimary ? 58 : 46;
        break;
      case "near":
        score = isPrimary ? 30 : 24;
        break;
      case "regional":
        score = isPrimary ? 14 : 10;
        break;
      default:
        score = 0;
    }

    if (score > best.score) {
      best = {
        score,
        tier,
        label: explicitInterest && tier === "same"
          ? "Judet urmarit de tine"
          : labelForTier(tier),
        matchedCountyCode: itemCountyCode,
      };
    }
  }

  return best;
}

function scoreRoleFit(profile: UserProfile, item: PersonalizableInput): number {
  const actorRole = getCanonicalActorRole(profile.role);
  if (!actorRole) return 0;

  if (actorRole === "partener") {
    if (item.kind === "report") return item.reportType === "business" || item.reportType === "real_estate" || item.reportType === "prices" || item.reportType === "trends" ? 22 : 12;
    if (item.kind === "article") return item.articleType === "studiu-caz" || item.articleType === "stire" ? 10 : 4;
    if (item.kind === "company") return item.businessType === "imm" || item.businessType === "startup" ? 10 : 5;
    return 6;
  }

  if (actorRole === "antreprenor") {
    if (item.kind === "company") return 18;
    if (item.kind === "article") return item.articleType === "colaborare" || item.articleType === "oferta" ? 16 : 8;
    if (item.kind === "report") return item.reportType === "business" || item.reportType === "competition" ? 14 : 6;
    return 10;
  }

  return 0;
}

export function getPersonalizationScore(
  profile: UserProfile,
  item: PersonalizableInput,
  feedbackProfile?: NegativeFeedbackProfile | null,
  interestProfile?: InterestIntentProfile | null,
): number {
  if (!profile.setup) return 0;

  const profileIndustry = normalize(profile.industry);
  const itemIndustry = normalize(
    item.industry
    || item.niche
    || item.category
    || item.businessType
    || item.articleType
    || item.reportType
  );
  const keywordPool = (item.keywords ?? []).map((value) => normalize(value)).filter(Boolean);

  let score = getGeoFitInsight(profile, item).score;

  if (profileIndustry) {
    if (includesNeedle(itemIndustry, profileIndustry)) score += 78;
    else if (keywordPool.some((keyword) => includesNeedle(keyword, profileIndustry))) score += 52;
  }

  score += scoreRoleFit(profile, item);
  score += getInterestIntentBoost(item, interestProfile);
  return Math.max(0, score - getNegativeFeedbackPenalty(item, feedbackProfile));
}
