import type {
  SignalIntentDraft,
  SignalIntentType,
  SignalMatchGeoScope,
  SignalMatchSummary,
} from "./signal-action-kernel-contract";
import {
  getCanonicalActorRole,
} from "./canonical-role-contract";
import type { UserProfile } from "./use-profile";

type SignalIntentContext = {
  signalEntityType: "report" | "article" | "post" | "company";
  signalEntityId: string | number;
  signalTitle?: string | null;
  signalCounty?: string | null;
  signalLocality?: string | null;
  signalIndustry?: string | null;
};

type CompanyMatchInput = {
  id: string | number;
  name: string;
  city?: string | null;
  judet?: string | null;
  industry?: string | null;
  verified?: boolean;
  matchScore: number;
  reasons: string[];
};

type SignalMatchRequest = {
  city?: string | null;
  judet?: string | null;
  industry?: string | null;
  niche?: string | null;
  goals: string;
  limit: number;
};

function normalize(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveIntentType(profile: UserProfile): SignalIntentType {
  const actorRole = getCanonicalActorRole(profile.role);

  if (actorRole === "antreprenor") {
    return "find_supplier";
  }

  if (actorRole === "partener") {
    return "find_partner";
  }

  return "follow_opportunity";
}

function buildIntentMessage(input: {
  intentType: SignalIntentType;
  signalTitle?: string | null;
  industry?: string | null;
  locality?: string | null;
}): string {
  const subject = input.signalTitle || input.industry || "semnalul";
  const locality = input.locality ? ` din ${input.locality}` : "";

  switch (input.intentType) {
    case "offer_products_services":
      return `Pot raspunde relevant pe ${subject}${locality}.`;
    case "find_supplier":
      return `Caut furnizori potriviti pentru ${subject}${locality}.`;
    case "find_partner":
      return `Caut parteneri potriviti pentru ${subject}${locality}.`;
    case "find_collaborator":
      return `Caut colaboratori potriviti pentru ${subject}${locality}.`;
    case "test_idea":
      return `Vreau sa testez o idee pornind de la ${subject}${locality}.`;
    case "invest_in_signal":
      return `Caut un partener de executie pentru oportunitatea din ${subject}${locality}.`;
    case "follow_opportunity":
    default:
      return `Vreau sa urmaresc oportunitatea din jurul ${subject}${locality}.`;
  }
}

export function buildSignalIntentDraftFromProfile(
  profile: UserProfile,
  context: SignalIntentContext,
  overrideIntentType?: SignalIntentType | null,
): SignalIntentDraft {
  const intentType = overrideIntentType ?? resolveIntentType(profile);
  const locality = profile.city || context.signalLocality || null;
  const county = profile.judet || context.signalCounty || null;
  const industry = profile.industry || context.signalIndustry || null;

  return {
    signalEntityType: context.signalEntityType,
    signalEntityId: context.signalEntityId,
    intentType,
    industry,
    county,
    locality,
    shortMessage: buildIntentMessage({
      intentType,
      signalTitle: context.signalTitle,
      industry,
      locality,
    }),
    visibility: "aggregate_only",
    linkedCompanyId: null,
  };
}

export function buildSignalMatchRequestFromIntent(
  intent: SignalIntentDraft,
  input: {
    signalIndustry?: string | null;
    signalLocality?: string | null;
    signalCounty?: string | null;
    signalTitle?: string | null;
    limit?: number;
  },
): SignalMatchRequest {
  const goalsCore =
    intent.intentType === "offer_products_services"
      ? "Caut firme unde pot raspunde relevant cu oferta mea"
      : intent.intentType === "find_supplier"
        ? "Caut furnizori relevanti"
        : intent.intentType === "find_partner"
          ? "Caut parteneri relevanti"
          : intent.intentType === "find_collaborator"
            ? "Caut colaboratori relevanti"
            : intent.intentType === "test_idea"
              ? "Caut contexte bune pentru testarea unei idei"
            : intent.intentType === "invest_in_signal"
              ? "Caut un partener de executie care poate operationaliza sau co-dezvolta oportunitatea"
              : "Caut oportunitatea potrivita pentru urmarire";

  const location = intent.locality || input.signalLocality || null;
  const industry = intent.industry || input.signalIndustry || null;
  const subject = input.signalTitle || industry || "acest semnal";

  return {
    city: location,
    judet: intent.county || input.signalCounty || null,
    industry,
    niche: input.signalIndustry || intent.industry || null,
    goals: `${goalsCore} in jurul semnalului ${subject}${location ? ` din ${location}` : ""}.`,
    limit: Math.max(3, Math.min(Number(input.limit) || 8, 12)),
  };
}

function inferGeoScope(input: {
  matchCity?: string | null;
  matchCounty?: string | null;
  signalLocality?: string | null;
  signalCounty?: string | null;
}): SignalMatchGeoScope {
  const matchCity = normalize(input.matchCity);
  const matchCounty = normalize(input.matchCounty);
  const signalCity = normalize(input.signalLocality);
  const signalCounty = normalize(input.signalCounty);

  if (matchCity && signalCity && matchCity === signalCity) return "locality";
  if (matchCounty && signalCounty && matchCounty === signalCounty) return "county";
  return matchCounty ? "nearby_county" : "national";
}

export function buildSignalMatchSummariesFromCompanies(
  matches: CompanyMatchInput[],
  input: {
    signalLocality?: string | null;
    signalCounty?: string | null;
  },
): SignalMatchSummary[] {
  return matches.slice(0, 8).map((match) => ({
    entityType: "company",
    entityId: match.id,
    score: Math.max(0, Math.min(100, Math.round(Number(match.matchScore) || 0))),
    geoScope: inferGeoScope({
      matchCity: match.city,
      matchCounty: match.judet,
      signalLocality: input.signalLocality,
      signalCounty: input.signalCounty,
    }),
    county: match.judet ?? null,
    locality: match.city ?? null,
    industry: match.industry ?? null,
    verified: Boolean(match.verified),
    reasonLabels: Array.isArray(match.reasons) ? match.reasons.slice(0, 4) : [],
    anonymousLabel: match.verified
      ? `Firma verificata din ${match.city ?? match.judet ?? "Romania"}`
      : `Firma relevanta din ${match.city ?? match.judet ?? "Romania"}`,
  }));
}
