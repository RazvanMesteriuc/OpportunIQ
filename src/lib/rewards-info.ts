// Mirror of artifacts/api-server/src/lib/rewards.ts — used for displaying
// reward info on the public /profil page without requiring authentication.
// Keep in sync with the backend module.

export type Tier = "membru" | "activ" | "contributor" | "expert" | "ambasador";
export type Role = "antreprenor" | "partener" | "";

export const TIER_THRESHOLDS: Record<Tier, number> = {
  membru:      0,
  activ:       50,
  contributor: 200,
  expert:      500,
  ambasador:   1500,
};

export const TIER_ORDER: Tier[] = ["membru", "activ", "contributor", "expert", "ambasador"];

export const TIER_LABELS: Record<Tier, string> = {
  membru:      "Membru",
  activ:       "Activ",
  contributor: "Contributor",
  expert:      "Expert",
  ambasador:   "Ambasador",
};

export const TIER_COLORS: Record<Tier, string> = {
  membru:      "text-slate-400 bg-slate-400/10 border-slate-400/30",
  activ:       "text-blue-400 bg-blue-400/10 border-blue-400/30",
  contributor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  expert:      "text-violet-400 bg-violet-400/10 border-violet-400/30",
  ambasador:   "text-amber-400 bg-amber-400/10 border-amber-400/30",
};

export const EVENT_CATALOG: { type: string; points: number; label: string }[] = [
  { type: "vote_cast",          points: 1,   label: "Votezi o postare / firmă / articol" },
  { type: "vote_received",      points: 2,   label: "Primești un vot pe conținutul tău" },
  { type: "comment_posted",     points: 3,   label: "Scrii un comentariu" },
  { type: "comment_received",   points: 1,   label: "Cineva îți comentează la postare" },
  { type: "post_published",     points: 5,   label: "Publici o postare pe hartă" },
  { type: "article_published",  points: 10,  label: "Publici un articol de business" },
  { type: "company_registered", points: 20,  label: "Înregistrezi o firmă" },
  { type: "milestone_100_votes",  points: 25, label: "🎯 Conținutul tău ajunge la 100 voturi" },
  { type: "milestone_500_votes",  points: 50, label: "🥇 Conținutul tău ajunge la 500 voturi" },
  { type: "milestone_1000_votes", points: 100,label: "🏆 Conținutul tău ajunge la 1.000 voturi" },
];

export interface Perks {
  weeklyDigest:        boolean;
  monthlyAiAnalyses:   number;
  monthlyPromotedSlots:number;
  monthlyDossiers:     number;
  premiumDirectory:    boolean;
  pinnedProfile:       boolean;
  earlyAccessFeatures: boolean;
  description:         string;
}

const BASE_PERKS: Perks = {
  weeklyDigest:false, monthlyAiAnalyses:0, monthlyPromotedSlots:0, monthlyDossiers:0,
  premiumDirectory:false, pinnedProfile:false, earlyAccessFeatures:false,
  description: "Acces gratuit la hartă, articole publice și directorul firmelor.",
};

const TIER_PERK_BOOST: Record<Tier, Partial<Perks>> = {
  membru:      {},
  activ:       { weeklyDigest:true, monthlyAiAnalyses:1, description:"1 analiză AI/lună + digest săptămânal pe nișa ta." },
  contributor: { weeklyDigest:true, monthlyAiAnalyses:3, premiumDirectory:true, description:"3 analize AI/lună + boost în directorul firmelor." },
  expert:      { weeklyDigest:true, monthlyAiAnalyses:5, monthlyPromotedSlots:1, premiumDirectory:true, description:"5 analize AI + 1 articol promovat (silver) gratuit/lună." },
  ambasador:   { weeklyDigest:true, monthlyAiAnalyses:10, monthlyPromotedSlots:2, pinnedProfile:true, premiumDirectory:true, earlyAccessFeatures:true, description:"10 analize AI + 2 articole gold/lună + profil pinned + acces early." },
};

const ROLE_PERK_BOOST: Record<Exclude<Role, "">, Partial<Perks>> = {
  antreprenor: { monthlyAiAnalyses: 2 },
  partener: { monthlyDossiers: 1, premiumDirectory: true },
};

export function computeTier(reputation: number): Tier {
  let tier: Tier = "membru";
  for (const t of TIER_ORDER) if (reputation >= TIER_THRESHOLDS[t]) tier = t;
  return tier;
}

export function nextTier(tier: Tier): { tier: Tier; threshold: number } | null {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === -1 || idx === TIER_ORDER.length - 1) return null;
  const next = TIER_ORDER[idx + 1];
  return { tier: next, threshold: TIER_THRESHOLDS[next] };
}

export function getPerksForRole(tier: Tier, role: Role): Perks {
  const base  = { ...BASE_PERKS };
  const tierP = TIER_PERK_BOOST[tier] ?? {};
  const roleP = role ? ROLE_PERK_BOOST[role] : {};
  return {
    weeklyDigest:        Boolean(base.weeklyDigest || tierP.weeklyDigest || roleP.weeklyDigest),
    monthlyAiAnalyses:   (base.monthlyAiAnalyses ?? 0) + (tierP.monthlyAiAnalyses ?? 0) + (roleP.monthlyAiAnalyses ?? 0),
    monthlyPromotedSlots:(base.monthlyPromotedSlots ?? 0) + (tierP.monthlyPromotedSlots ?? 0) + (roleP.monthlyPromotedSlots ?? 0),
    monthlyDossiers:     (base.monthlyDossiers ?? 0) + (tierP.monthlyDossiers ?? 0) + (roleP.monthlyDossiers ?? 0),
    premiumDirectory:    Boolean(base.premiumDirectory || tierP.premiumDirectory || roleP.premiumDirectory),
    pinnedProfile:       Boolean(base.pinnedProfile || tierP.pinnedProfile || roleP.pinnedProfile),
    earlyAccessFeatures: Boolean(base.earlyAccessFeatures || tierP.earlyAccessFeatures || roleP.earlyAccessFeatures),
    description:         tierP.description ?? base.description,
  };
}
