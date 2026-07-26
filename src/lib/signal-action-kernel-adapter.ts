import type { SignalScores } from "./signal-score-contract";
import type {
  SignalActionKernel,
  SignalActionRecommendation,
  SignalContactRequestSummary,
  SignalCounterArgument,
  SignalDecisionLogEntry,
  SignalEvidenceItem,
  SignalIntentAggregate,
  SignalIntentType,
  SignalMatchSummary,
  SignalOutcomeAggregate,
  SignalOutcomeType,
  SignalPublicCategory,
  SignalReadinessStatus,
  SignalScoreSnapshot,
  SignalSourceCategory,
  SignalSourceRegistryKey,
} from "./signal-action-kernel-contract";

type ReportCommercialStageInput = {
  bucket?: "radar" | "qualified" | "validated" | null;
  feedKind?: "change" | "opportunity" | null;
  feedStage?: string | null;
  reasonCodes?: string[] | null;
};

export type ReportSourceAuditEntryInput = {
  id: string;
  label: string;
  category: "internal" | "external";
  provider: string;
  evidenceCount: number;
  freshness: "live" | "cached" | "derived";
  reliabilityScore: number;
  notes: string;
};

export type BuildReportSignalActionKernelInput = {
  signalEntityId: string | number;
  publicCategory: SignalPublicCategory;
  title?: string | null;
  verdict?: string | null;
  county?: string | null;
  locality?: string | null;
  niche?: string | null;
  reportType?: string | null;
  profitabilityScore?: number | null;
  demandScore?: number | null;
  frictionScore?: number | null;
  gapScore?: number | null;
  validationScore?: number | null;
  localFitScore?: number | null;
  momentumScore?: number | null;
  actionabilityScore?: number | null;
  trustPercentage?: number | null;
  interestCount?: number | null;
  freshnessHours?: number | null;
  signalPulseScore?: number | null;
  signalClass?: string | null;
  recommendedUse?: string | null;
  commercialStage?: ReportCommercialStageInput | null;
  sourceAuditEntries?: ReportSourceAuditEntryInput[] | null;
  signalScores?: SignalScores | null;
};

export type SignalActionKernelRuntimeInput = {
  activeIntentType?: SignalIntentType | null;
  intentAggregate?: SignalIntentAggregate | null;
  matchSummaries?: SignalMatchSummary[] | null;
  contactSummary?: SignalContactRequestSummary | null;
  outcomeAggregate?: SignalOutcomeAggregate | null;
};

type RuntimeLeadStatus = "new" | "contacted" | "qualified" | "archived";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: number | null | undefined, fallback = 0): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeText(value?: string | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toSignalSourceKey(provider?: string | null): SignalSourceRegistryKey {
  const normalized = normalizeText(provider);
  if (normalized.includes("onrc") || normalized.includes("recom")) return "onrc";
  if (normalized.includes("finant") || normalized.includes("mfinante")) return "mfinante";
  if (normalized.includes("ins") || normalized.includes("tempo")) return "ins_tempo";
  if (normalized.includes("siruta") || normalized.includes("data.gov")) return "siruta";
  if (normalized.includes("trends")) return "google_trends";
  if (normalized.includes("google")) return "google_places";
  if (normalized.includes("seap") || normalized.includes("licitatie")) return "seap";
  return "opportuniq_internal";
}

function toSignalSourceCategory(input: {
  sourceKey: SignalSourceRegistryKey;
  entryCategory: "internal" | "external";
}): SignalSourceCategory {
  if (input.sourceKey === "onrc") return "registry";
  if (input.sourceKey === "mfinante") return "financial";
  if (input.sourceKey === "ins_tempo") return "demographic";
  if (input.sourceKey === "siruta") return "geo";
  if (input.sourceKey === "google_places") return "reviews";
  if (input.sourceKey === "google_trends") return "search_demand";
  if (input.sourceKey === "seap") return "public_procurement";
  return input.entryCategory === "external" ? "reviews" : "platform_activity";
}

function toEvidenceStrength(score: number): "low" | "medium" | "high" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function inferFreshnessHoursFromAudit(entryFreshness: "live" | "cached" | "derived"): number | null {
  if (entryFreshness === "live") return 12;
  if (entryFreshness === "cached") return 72;
  if (entryFreshness === "derived") return 168;
  return null;
}

function inferLocalFitScore(input: {
  locality?: string | null;
  county?: string | null;
  signalScores?: SignalScores | null;
  explicitLocalFitScore?: number | null;
}): number {
  const explicitScore = toNumber(input.explicitLocalFitScore, Number.NaN);
  if (Number.isFinite(explicitScore)) return clamp(Math.round(explicitScore), 0, 100);
  if (input.signalScores?.sourceBreakdown.contextual) {
    return clamp(
      Math.round(48 + (input.signalScores.sourceBreakdown.contextual * 14) + (input.locality ? 16 : 0) + (input.county ? 8 : 0)),
      0,
      100,
    );
  }
  if (input.locality && input.county) return 72;
  if (input.county) return 56;
  return 24;
}

function inferMomentumScore(input: {
  explicitMomentumScore?: number | null;
  signalPulseScore?: number | null;
  freshnessHours?: number | null;
  interestCount?: number | null;
}): number {
  const explicitScore = toNumber(input.explicitMomentumScore, Number.NaN);
  if (Number.isFinite(explicitScore)) return clamp(Math.round(explicitScore), 0, 100);

  const pulse = clamp(Math.round(toNumber(input.signalPulseScore)), 0, 100);
  const interest = Math.min(24, Math.max(0, Math.round(toNumber(input.interestCount) * 4)));
  const freshness =
    input.freshnessHours == null
      ? 8
      : input.freshnessHours <= 24
        ? 24
        : input.freshnessHours <= 72
          ? 16
          : input.freshnessHours <= 168
            ? 8
            : 0;
  return clamp(Math.round((pulse * 0.65) + interest + freshness), 0, 100);
}

function inferFrictionScore(input: {
  explicitFrictionScore?: number | null;
  gapScore?: number | null;
  demandScore?: number | null;
  interestCount?: number | null;
}): number {
  const explicitScore = toNumber(input.explicitFrictionScore, Number.NaN);
  if (Number.isFinite(explicitScore)) return clamp(Math.round(explicitScore), 0, 100);

  const gap = clamp(Math.round(toNumber(input.gapScore)), 0, 100);
  const demand = clamp(Math.round(toNumber(input.demandScore)), 0, 100);
  const interest = Math.min(18, Math.max(0, Math.round(toNumber(input.interestCount) * 3)));
  return clamp(Math.round((gap * 0.6) + (demand * 0.25) + interest), 0, 100);
}

function buildScoreSnapshot(input: BuildReportSignalActionKernelInput): SignalScoreSnapshot {
  const demandScore = clamp(
    Math.round(
      toNumber(
        input.demandScore,
        input.profitabilityScore ?? input.signalScores?.public.investigationScore ?? 0,
      ),
    ),
    0,
    100,
  );
  const supplyGapScore = clamp(Math.round(toNumber(input.gapScore)), 0, 100);
  const localFitScore = inferLocalFitScore({
    locality: input.locality,
    county: input.county,
    signalScores: input.signalScores,
    explicitLocalFitScore: input.localFitScore,
  });
  const momentumScore = inferMomentumScore({
    explicitMomentumScore: input.momentumScore,
    signalPulseScore: input.signalPulseScore,
    freshnessHours: input.freshnessHours,
    interestCount: input.interestCount,
  });
  const actionabilityScore = clamp(Math.round(toNumber(input.actionabilityScore)), 0, 100);
  const communityValidationScore = clamp(
    Math.round(
      Math.min(
        100,
        (toNumber(input.trustPercentage) * 0.72) + Math.min(28, Math.max(0, toNumber(input.interestCount) * 4)),
      ),
    ),
    0,
    100,
  );
  const confidenceScore = clamp(
    Math.round(
      toNumber(
        input.signalScores?.confidence.score,
        input.validationScore ?? input.signalScores?.public.evidenceStrength ?? 0,
      ),
    ),
    0,
    100,
  );
  const frictionScore = inferFrictionScore({
    explicitFrictionScore: input.frictionScore,
    gapScore: input.gapScore,
    demandScore,
    interestCount: input.interestCount,
  });
  const signalReadinessScore = clamp(
    Math.round(
      (demandScore * 0.18)
      + (frictionScore * 0.12)
      + (supplyGapScore * 0.16)
      + (localFitScore * 0.08)
      + (momentumScore * 0.1)
      + (actionabilityScore * 0.16)
      + (communityValidationScore * 0.08)
      + (confidenceScore * 0.12),
    ),
    0,
    100,
  );

  return {
    demandScore,
    frictionScore,
    supplyGapScore,
    localFitScore,
    momentumScore,
    actionabilityScore,
    communityValidationScore,
    confidenceScore,
    signalReadinessScore,
  };
}

function buildStatus(input: {
  scoreSnapshot: SignalScoreSnapshot;
  commercialStage?: ReportCommercialStageInput | null;
  sourceAuditEntries?: ReportSourceAuditEntryInput[] | null;
  freshnessHours?: number | null;
}): SignalReadinessStatus {
  const bucket = input.commercialStage?.bucket;
  const evidenceCount = Math.max(
    0,
    (input.sourceAuditEntries ?? []).reduce((sum, entry) => sum + Math.max(1, entry.evidenceCount), 0),
  );
  const distinctSources = new Set((input.sourceAuditEntries ?? []).map((entry) => toSignalSourceKey(entry.provider))).size;

  if (input.commercialStage?.feedStage === "in_degradare" || (input.freshnessHours ?? 0) > 720) {
    return "cooling";
  }
  if (bucket === "validated") return "community_validated";
  if (
    input.scoreSnapshot.signalReadinessScore >= 70
    && input.scoreSnapshot.confidenceScore >= 60
    && input.scoreSnapshot.actionabilityScore >= 65
  ) {
    return "activable";
  }
  if (
    bucket === "qualified"
    || (
      input.scoreSnapshot.signalReadinessScore >= 55
      && input.scoreSnapshot.confidenceScore >= 48
      && evidenceCount >= 3
      && distinctSources >= 2
    )
  ) {
    return "qualified";
  }
  if (evidenceCount >= 2 || input.scoreSnapshot.confidenceScore >= 35) return "incipient";
  return "generated";
}

function buildEvidence(input: {
  title?: string | null;
  county?: string | null;
  locality?: string | null;
  gapScore?: number | null;
  validationScore?: number | null;
  freshnessHours?: number | null;
  trustPercentage?: number | null;
  interestCount?: number | null;
  sourceAuditEntries?: ReportSourceAuditEntryInput[] | null;
}): SignalEvidenceItem[] {
  const geographyLabel = [input.locality, input.county].filter(Boolean).join(", ") || null;
  const evidence: SignalEvidenceItem[] = [];

  for (const entry of input.sourceAuditEntries ?? []) {
    const sourceKey = toSignalSourceKey(entry.provider);
    evidence.push({
      id: `source:${entry.id}`,
      label: entry.label,
      summary: entry.notes || `Sursa ${entry.provider} contribuie cu ${entry.evidenceCount} dovezi.`,
      category: "confidence",
      sourceKey,
      sourceCategory: toSignalSourceCategory({ sourceKey, entryCategory: entry.category }),
      confidenceWeight: clamp(Math.round(entry.reliabilityScore), 0, 100),
      freshnessHours: inferFreshnessHoursFromAudit(entry.freshness),
      sampleSize: Math.max(1, entry.evidenceCount),
      geographyLabel,
      strength: toEvidenceStrength(entry.reliabilityScore),
      publicVisible: true,
    });
  }

  const gapScore = clamp(Math.round(toNumber(input.gapScore)), 0, 100);
  if (gapScore > 0) {
    evidence.push({
      id: "gap-score",
      label: "Gap comercial detectat",
      summary: `Exista semne de gol comercial sau oferta insuficient reprezentata pentru acest semnal (${gapScore}/100).`,
      category: "supply_context",
      sourceKey: "opportuniq_internal",
      sourceCategory: "platform_activity",
      confidenceWeight: gapScore,
      freshnessHours: input.freshnessHours ?? null,
      geographyLabel,
      strength: toEvidenceStrength(gapScore),
      publicVisible: true,
    });
  }

  const validationScore = clamp(Math.round(toNumber(input.validationScore)), 0, 100);
  if (validationScore > 0) {
    evidence.push({
      id: "validation-score",
      label: "Dovezi convergente",
      summary: `Snapshot-ul curent ofera suficienta sustinere pentru investigare sau calificare (${validationScore}/100).`,
      category: "confidence",
      sourceKey: "opportuniq_internal",
      sourceCategory: "platform_activity",
      confidenceWeight: validationScore,
      freshnessHours: input.freshnessHours ?? null,
      geographyLabel,
      strength: toEvidenceStrength(validationScore),
      publicVisible: true,
    });
  }

  const communitySignal = clamp(
    Math.round((toNumber(input.trustPercentage) * 0.7) + Math.min(30, toNumber(input.interestCount) * 4)),
    0,
    100,
  );
  if (communitySignal > 0) {
    evidence.push({
      id: "community-signal",
      label: "Semnal din comunitate",
      summary: `Interactiunile si voturile din platforma arata interes sau validare initiala (${communitySignal}/100).`,
      category: "community_validation",
      sourceKey: "opportuniq_internal",
      sourceCategory: "platform_activity",
      confidenceWeight: communitySignal,
      freshnessHours: input.freshnessHours ?? null,
      sampleSize: Math.max(0, Math.round(toNumber(input.interestCount))),
      geographyLabel,
      strength: toEvidenceStrength(communitySignal),
      publicVisible: true,
    });
  }

  return evidence.slice(0, 6);
}

function buildCounterArguments(input: {
  scoreSnapshot: SignalScoreSnapshot;
  status: SignalReadinessStatus;
  sourceAuditEntries?: ReportSourceAuditEntryInput[] | null;
}): SignalCounterArgument[] {
  const counters: SignalCounterArgument[] = [];
  const distinctSources = new Set((input.sourceAuditEntries ?? []).map((entry) => toSignalSourceKey(entry.provider)));

  if (input.scoreSnapshot.confidenceScore < 50) {
    counters.push({
      id: "thin-confidence",
      label: "Incredere inca limitata",
      summary: "Datele actuale sunt utile pentru screening, dar nu pentru o concluzie comerciala tare.",
      severity: input.status === "generated" ? "high" : "medium",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if (distinctSources.size < 2) {
    counters.push({
      id: "low-source-diversity",
      label: "Surse insuficient diversificate",
      summary: "Semnalul se sprijina inca pe prea putine tipuri de surse independente.",
      severity: "medium",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if (input.scoreSnapshot.communityValidationScore < 35) {
    counters.push({
      id: "low-community-validation",
      label: "Validare comunitara subtire",
      summary: "Comunitatea nu a oferit inca suficiente actiuni utile pentru a ridica certitudinea comerciala.",
      severity: "medium",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  return counters.slice(0, 3);
}

function buildDecisionLog(input: {
  title?: string | null;
  scoreSnapshot: SignalScoreSnapshot;
  status: SignalReadinessStatus;
  commercialStage?: ReportCommercialStageInput | null;
  sourceAuditEntries?: ReportSourceAuditEntryInput[] | null;
  frictionWasInferred: boolean;
}): SignalDecisionLogEntry[] {
  const entries: SignalDecisionLogEntry[] = [];

  entries.push({
    code: "kernel_mapped_from_existing_runtime",
    level: "info",
    message: `Kernelul canonic a fost mapat din contractele runtime existente pentru ${input.title || "acest semnal"}.`,
    metric: "signal_readiness_score",
    sourceKeys: ["opportuniq_internal"],
  });

  if (input.commercialStage?.bucket) {
    entries.push({
      code: `existing_stage_bucket_${input.commercialStage.bucket}`,
      level: input.commercialStage.bucket === "validated" ? "positive" : "info",
      message: `Statusul comercial existent (${input.commercialStage.bucket}) a fost pastrat ca semnal de continuitate, nu rescris.`,
      metric: "signal_readiness_score",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if (input.frictionWasInferred) {
    entries.push({
      code: "friction_score_inferred_from_gap_and_interest",
      level: "warning",
      message: "Scorul de frictiune este deocamdata derivat conservator din gap, interes si context, pentru ca runtime-ul curent nu expune separat acest strat.",
      metric: "friction_score",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if ((input.sourceAuditEntries ?? []).length === 0) {
    entries.push({
      code: "source_audit_missing",
      level: "warning",
      message: "Nu exista inca un audit de surse atasat acestui runtime, deci increderea ramane partial estimata.",
      metric: "confidence_score",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  for (const reasonCode of input.commercialStage?.reasonCodes ?? []) {
    entries.push({
      code: `stage_reason_${reasonCode}`,
      level: "info",
      message: `Motiv existent preluat din commercial stage: ${reasonCode}.`,
      metric: "signal_readiness_score",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if (input.status === "activable" || input.status === "community_validated") {
    entries.push({
      code: `readiness_status_${input.status}`,
      level: "positive",
      message: "Semnalul depaseste pragurile minime pentru a cere actiune, nu doar observare.",
      metric: "signal_readiness_score",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  return entries.slice(0, 8);
}

function buildNextAction(input: {
  publicCategory: SignalPublicCategory;
  status: SignalReadinessStatus;
  actionabilityScore: number;
}): SignalActionRecommendation {
  if (input.status === "community_validated") {
    return {
      action: "view_matches",
      label: "Vezi sugestiile",
      summary: "Semnalul este suficient de matur pentru a vedea firmele sugerate automat in jurul lui, inainte de contactul controlat.",
      requiresAuth: true,
    };
  }

  if (input.status === "activable") {
    return {
      action: "set_intent",
      label: "Seteaza intentia",
      summary: "Urmatorul pas sanatos este sa declari ce vrei sa faci cu semnalul, nu doar sa-l citesti.",
      requiresAuth: true,
    };
  }

  if (input.publicCategory === "request") {
    return {
      action: "request_contact",
      label: "Cere contact",
      summary: "Semnalul exprima o nevoie clara, deci contactul controlat are mai mult sens decat observarea pasiva.",
      requiresAuth: true,
    };
  }

  if (input.actionabilityScore >= 50) {
    return {
      action: "validate_locally",
      label: "Valideaza local",
      summary: "Semnalul pare suficient de promiator pentru verificare rapida in teren sau cu parteneri locali.",
      requiresAuth: false,
    };
  }

  return {
    action: "watch_signal",
    label: "Urmareste semnalul",
    summary: "Semnalul merita observat, dar nu exista inca baza pentru un pas comercial tare.",
    requiresAuth: false,
  };
}

export function buildSignalIntentAggregateFromRuntime(input: {
  totals?: Partial<Record<SignalIntentType, number>> | null;
  primaryCounty?: string | null;
  primaryIndustry?: string | null;
}): SignalIntentAggregate | null {
  const byType = Object.fromEntries(
    Object.entries(input.totals ?? {})
      .map(([intentType, count]) => [intentType, Math.max(0, Math.round(Number(count) || 0))])
      .filter(([, count]) => Number(count) > 0),
  ) as Partial<Record<SignalIntentType, number>>;
  const total = Object.values(byType).reduce((sum, count) => sum + Number(count || 0), 0);

  if (total <= 0) return null;

  return {
    total,
    byType,
    primaryCounty: input.primaryCounty ?? null,
    primaryIndustry: input.primaryIndustry ?? null,
  };
}

export function buildSignalOutcomeAggregateFromRuntime(input: {
  totals?: Partial<Record<SignalOutcomeType, number>> | null;
}): SignalOutcomeAggregate | null {
  const byType = Object.fromEntries(
    Object.entries(input.totals ?? {})
      .map(([outcomeType, count]) => [outcomeType, Math.max(0, Math.round(Number(count) || 0))])
      .filter(([, count]) => Number(count) > 0),
  ) as Partial<Record<SignalOutcomeType, number>>;
  const total = Object.values(byType).reduce((sum, count) => sum + Number(count || 0), 0);

  if (total <= 0) return null;

  return {
    total,
    byType,
  };
}

function mapLeadStatusToContactStatus(status: RuntimeLeadStatus): "pending" | "accepted" | "expired" {
  if (status === "new") return "pending";
  if (status === "contacted" || status === "qualified") return "accepted";
  return "expired";
}

export function buildSignalContactSummaryFromRuntimeLead(input: {
  targetEntityId: string | number;
  signalEntityId: string | number;
  status: RuntimeLeadStatus;
  createdAt?: string | null;
  acceptedAt?: string | null;
}): SignalContactRequestSummary {
  return {
    targetEntityType: "company",
    targetEntityId: input.targetEntityId,
    signalEntityType: "report",
    signalEntityId: input.signalEntityId,
    status: mapLeadStatusToContactStatus(input.status),
    createdAt: input.createdAt ?? null,
    acceptedAt: input.acceptedAt ?? null,
  };
}

function buildRuntimeDecisionLog(input: SignalActionKernelRuntimeInput): SignalDecisionLogEntry[] {
  const entries: SignalDecisionLogEntry[] = [];

  if ((input.intentAggregate?.total ?? 0) > 0) {
    entries.push({
      code: "runtime_intent_aggregate_attached",
      level: "positive",
      message: `Agregatul de intentii explicite a fost atasat kernelului (${input.intentAggregate?.total ?? 0} semnale utile).`,
      metric: "community_validation",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if ((input.matchSummaries?.length ?? 0) > 0) {
    entries.push({
      code: "runtime_match_summaries_attached",
      level: "positive",
      message: `Kernelul include deja ${(input.matchSummaries ?? []).length} sugestii automate de firme derivate din intentia curenta.`,
      metric: "actionability",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if (input.activeIntentType) {
    entries.push({
      code: `runtime_active_intent_${input.activeIntentType}`,
      level: "info",
      message: `Intentia activa din runtime (${input.activeIntentType}) recalibreaza urmatorul pas recomandat.`,
      metric: "actionability",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if (input.contactSummary?.status) {
    entries.push({
      code: `runtime_contact_status_${input.contactSummary.status}`,
      level: input.contactSummary.status === "accepted" ? "positive" : "info",
      message: `Kernelul reflecta deja un contact existent cu status ${input.contactSummary.status}.`,
      metric: "actionability",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  if ((input.outcomeAggregate?.total ?? 0) > 0) {
    entries.push({
      code: "runtime_outcome_aggregate_attached",
      level: "positive",
      message: `Kernelul include deja rezultate raportate (${input.outcomeAggregate?.total ?? 0}).`,
      metric: "community_validation",
      sourceKeys: ["opportuniq_internal"],
    });
  }

  return entries;
}

function buildRuntimeNextAction(input: {
  kernel: SignalActionKernel;
  runtime: SignalActionKernelRuntimeInput;
}): SignalActionRecommendation {
  if (input.runtime.contactSummary?.status === "pending") {
    return {
      action: "request_contact",
      label: "Contact in curs",
      summary: "Exista deja o cerere de contact pornita din acest semnal; urmatorul pas este urmarirea raspunsului.",
      requiresAuth: true,
    };
  }

  if (input.runtime.contactSummary?.status === "accepted") {
    return {
      action: "request_contact",
      label: "Contact activ",
      summary: "Contactul a fost acceptat, deci focusul se muta din potrivire in conversatie si calificare.",
      requiresAuth: true,
    };
  }

  if (input.runtime.activeIntentType && (input.runtime.matchSummaries?.length ?? 0) > 0) {
    return {
      action: "view_matches",
      label: "Vezi sugestiile",
      summary: "Ai deja intentie explicita si sugestii automate de firme, deci urmatorul pas sanatos este sa verifici manual compatibilitatea inainte de contact.",
      requiresAuth: true,
    };
  }

  if ((input.runtime.matchSummaries?.length ?? 0) > 0) {
    return {
      action: "view_matches",
      label: "Vezi sugestiile",
      summary: "Kernelul include deja sugestii automate de firme, deci are sens sa intri in evaluarea lor inainte de alta actiune.",
      requiresAuth: true,
    };
  }

  if (input.runtime.activeIntentType || (input.runtime.intentAggregate?.total ?? 0) > 0) {
    return {
      action: "set_intent",
      label: "Seteaza intentia",
      summary: "Intentiile explicite exista deja in jurul semnalului, iar declararea intentiei ramane pasul comercial corect.",
      requiresAuth: true,
    };
  }

  return input.kernel.nextAction;
}

export function enrichSignalActionKernelWithRuntime(
  kernel: SignalActionKernel,
  runtime: SignalActionKernelRuntimeInput,
): SignalActionKernel {
  const runtimeDecisionLog = buildRuntimeDecisionLog(runtime);
  return {
    ...kernel,
    nextAction: buildRuntimeNextAction({ kernel, runtime }),
    intentAggregate: runtime.intentAggregate ?? kernel.intentAggregate ?? null,
    matchSummaries: runtime.matchSummaries ?? kernel.matchSummaries ?? null,
    contactSummary: runtime.contactSummary ?? kernel.contactSummary ?? null,
    outcomeAggregate: runtime.outcomeAggregate ?? kernel.outcomeAggregate ?? null,
    decisionLog: [...kernel.decisionLog, ...runtimeDecisionLog].slice(0, 12),
  };
}

export function buildReportSignalActionKernel(
  input: BuildReportSignalActionKernelInput,
): SignalActionKernel {
  const scoreSnapshot = buildScoreSnapshot(input);
  const frictionWasInferred = !Number.isFinite(Number(input.frictionScore));
  const status = buildStatus({
    scoreSnapshot,
    commercialStage: input.commercialStage,
    sourceAuditEntries: input.sourceAuditEntries,
    freshnessHours: input.freshnessHours,
  });
  const evidence = buildEvidence(input);
  const counterArguments = buildCounterArguments({
    scoreSnapshot,
    status,
    sourceAuditEntries: input.sourceAuditEntries,
  });
  const decisionLog = buildDecisionLog({
    title: input.title,
    scoreSnapshot,
    status,
    commercialStage: input.commercialStage,
    sourceAuditEntries: input.sourceAuditEntries,
    frictionWasInferred,
  });
  const nextAction = buildNextAction({
    publicCategory: input.publicCategory,
    status,
    actionabilityScore: scoreSnapshot.actionabilityScore,
  });
  const sourceCount = Math.max(
    1,
    new Set(evidence.map((item) => `${item.sourceKey}:${item.sourceCategory}`)).size,
  );
  const sampleSize = evidence.reduce((sum, item) => sum + Math.max(0, Number(item.sampleSize ?? 0)), 0) || null;

  return {
    signalEntityType: "report",
    signalEntityId: input.signalEntityId,
    publicCategory: input.publicCategory,
    status,
    verdict: String(input.verdict ?? input.recommendedUse ?? "Semnal in evaluare").trim() || "Semnal in evaluare",
    evidence,
    counterArguments,
    confidence: {
      score: scoreSnapshot.confidenceScore,
      band:
        scoreSnapshot.confidenceScore >= 70
          ? "high"
          : scoreSnapshot.confidenceScore >= 45
            ? "medium"
            : "low",
      sourceCount,
      sampleSize,
      sourceAgreementPct: clamp(Math.round(toNumber(input.signalScores?.confidence.corroboration, scoreSnapshot.confidenceScore)), 0, 100),
      geographySpecificity: input.locality ? "locality" : input.county ? "county" : "unknown",
      manipulationRiskPct: clamp(Math.round(toNumber(input.signalScores?.bias.score)), 0, 100),
      note:
        status === "community_validated"
          ? "Semnalul are deja baza suficienta pentru actiune si validare extinsa."
          : status === "activable"
            ? "Semnalul pare actionabil, dar inca cere validare si selectie atenta a urmatorului pas."
            : "Kernelul pastreaza o lectura conservatoare pana cand runtime-ul existent expune mai multe dovezi directe.",
    },
    scores: scoreSnapshot,
    decisionLog,
    nextAction,
    intentAggregate: null,
    matchSummaries: null,
    contactSummary: null,
    outcomeAggregate: null,
  };
}
