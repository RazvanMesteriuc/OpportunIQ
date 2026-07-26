import type {
  SignalExplainability,
  SignalExplainabilityDriverKey,
  SignalExplainabilityRiskKey,
  SignalExplainabilitySummaryKey,
  SignalRiskLevel,
  SignalScores,
  SignalSourceProfileRationaleKey,
  SourceProfileKey,
  SourceTypeKey,
} from "./signal-score-contract";

export type {
  SignalBiasFlags,
  SignalConfidence,
  SignalExplainability,
  SignalExplainabilityDriverKey,
  SignalExplainabilityRiskKey,
  SignalExplainabilitySummaryKey,
  SignalInternalScores,
  SignalPublicScores,
  SignalRisk,
  SignalRiskLevel,
  SignalScores,
  SignalSourceBreakdown,
  SignalSourceProfile,
  SignalSourceProfileRationaleKey,
  SignalTriangulationState,
  SourceProfileKey,
  SourceTypeKey,
} from "./signal-score-contract";

export type SignalScoreInput = {
  profitabilityScore?: number | null;
  aiScore?: number | null;
  marketScore?: number | null;
  finalScore?: number | null;
  confidenceAdjustedScore?: number | null;
  userTrustScore?: number | null;
  trustPercentage?: number | null;
  interestCount?: number | null;
  evidenceConfidence?: number | null;
  aiInsightConfidence?: number | null;
  whitespaceScore?: number | null;
  sourceCoverageScore?: number | null;
  sourceDiversityScore?: number | null;
  sourceFreshnessScore?: number | null;
  sourcePrimaryCount?: number | null;
  sourceSecondaryCount?: number | null;
  sourceSocialCount?: number | null;
  sourceBehavioralCount?: number | null;
  sourceContextualCount?: number | null;
  riskScore?: number | null;
  evidenceRiskScore?: number | null;
  executionRiskScore?: number | null;
  marketRiskScore?: number | null;
  biasScore?: number | null;
  popularityBiasScore?: number | null;
  geographyBiasScore?: number | null;
  dataBiasScore?: number | null;
  niche?: string | null;
  reportType?: string | null;
  sourceInternalWeightPct?: number | null;
  sourceExternalWeightPct?: number | null;
};

export type SignalFieldHelpKey =
  | "confidenceScore"
  | "marketInterestScore"
  | "executionReadinessScore"
  | "actionabilityScore"
  | "opportunityScore"
  | "evidenceConfidence"
  | "investigationScore"
  | "evidenceStrength"
  | "marketReading"
  | "communitySignal"
  | "feedRankingScore"
  | "rankingScore"
  | "gapClarity"
  | "communityValidation"
  | "communityInterest"
  | "aiMarketScore"
  | "communityScore"
  | "blendedScore"
  | "whitespaceScore";

type SignalFieldHelp = Record<SignalFieldHelpKey, string>;

type SourceProfile = {
  key: SourceProfileKey;
  label: string;
  weights: Record<SourceTypeKey, number>;
  targetInternalWeightPct: number;
  targetExternalWeightPct: number;
  preferredTypes: SourceTypeKey[];
  rationaleKey: SignalSourceProfileRationaleKey;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: number | null | undefined, fallback = 0): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeFingerprint(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getRiskLevel(score: number): SignalRiskLevel {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

function getDominantSourceType(sourceBreakdown: {
  primary: number;
  secondary: number;
  social: number;
  behavioral: number;
  contextual: number;
}): SourceTypeKey {
  const ordered = Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]);
  return (ordered[0]?.[0] as SourceTypeKey) ?? "primary";
}

function resolveSourceProfile(input: Pick<SignalScoreInput, "niche" | "reportType">): SourceProfile {
  const fingerprint = normalizeFingerprint(`${input.niche ?? ""} ${input.reportType ?? ""}`);

  if (/\b(horeca|restaurant|cafenea|cafea|coffee|bistro|patiserie|brutarie|cofetarie|fast food|beauty|salon|barber|fitness|wellness|spa|retail|fashion|turism|hotel|travel|entertainment|petshop)\b/.test(fingerprint)) {
    return {
      key: "demand-led",
      label: "Demand-led",
      weights: {
        primary: 0.2,
        secondary: 0.14,
        social: 0.25,
        behavioral: 0.23,
        contextual: 0.18,
      },
      targetInternalWeightPct: 44,
      targetExternalWeightPct: 56,
      preferredTypes: ["social", "behavioral", "contextual"],
      rationaleKey: "demand_signal",
    };
  }

  if (/\b(real[_ -]?estate|imobil|construct|amenaj|logistic|depozit|mobilit|transport|auto service|service auto|vulcanizare|delivery|curier|local service|servicii locale|spalatorie|cleaning|storage)\b/.test(fingerprint)) {
    return {
      key: "location-led",
      label: "Location-led",
      weights: {
        primary: 0.24,
        secondary: 0.14,
        social: 0.08,
        behavioral: 0.14,
        contextual: 0.4,
      },
      targetInternalWeightPct: 52,
      targetExternalWeightPct: 48,
      preferredTypes: ["contextual", "primary", "secondary"],
      rationaleKey: "location_signal",
    };
  }

  if (/\b(manufact|industrial|fabrica|productie|b2b|software|saas|servicii profesionale|consult|legal|medical|clinic|dental|educa|education|training|accounting|financiar)\b/.test(fingerprint)) {
    return {
      key: "execution-led",
      label: "Execution-led",
      weights: {
        primary: 0.36,
        secondary: 0.26,
        social: 0.08,
        behavioral: 0.1,
        contextual: 0.2,
      },
      targetInternalWeightPct: 60,
      targetExternalWeightPct: 40,
      preferredTypes: ["primary", "secondary", "contextual"],
      rationaleKey: "execution_signal",
    };
  }

  return {
    key: "balanced",
    label: "Balanced",
    weights: {
      primary: 0.28,
      secondary: 0.22,
      social: 0.14,
      behavioral: 0.14,
      contextual: 0.22,
    },
    targetInternalWeightPct: 50,
    targetExternalWeightPct: 50,
    preferredTypes: ["primary", "secondary", "contextual"],
    rationaleKey: "balanced_signal",
  };
}

export function resolveSignalSourceProfileKey(input: Pick<SignalScoreInput, "niche" | "reportType">): SourceProfileKey {
  return resolveSourceProfile(input).key;
}

function getPresenceFactor(count: number): number {
  if (count >= 2) return 1;
  if (count === 1) return 0.65;
  return 0;
}

function getProfileCoverageScore(
  sourceBreakdown: Record<SourceTypeKey, number>,
  profile: SourceProfile,
): number {
  const weightedPresence = (
    profile.weights.primary * getPresenceFactor(sourceBreakdown.primary)
    + profile.weights.secondary * getPresenceFactor(sourceBreakdown.secondary)
    + profile.weights.social * getPresenceFactor(sourceBreakdown.social)
    + profile.weights.behavioral * getPresenceFactor(sourceBreakdown.behavioral)
    + profile.weights.contextual * getPresenceFactor(sourceBreakdown.contextual)
  ) * 100;

  return clamp(Math.round(weightedPresence), 0, 100);
}

function getPreferredCoverageScore(
  sourceBreakdown: Record<SourceTypeKey, number>,
  profile: SourceProfile,
): number {
  if (profile.preferredTypes.length === 0) return 0;
  const averagePresence =
    profile.preferredTypes.reduce((sum, type) => sum + getPresenceFactor(sourceBreakdown[type]), 0)
    / profile.preferredTypes.length;
  return clamp(Math.round(averagePresence * 100), 0, 100);
}

function getSplitAlignmentScore(input: {
  internalWeightPct: number;
  externalWeightPct: number;
  profile: SourceProfile;
}): number {
  const internalGap = Math.abs(input.internalWeightPct - input.profile.targetInternalWeightPct);
  const externalGap = Math.abs(input.externalWeightPct - input.profile.targetExternalWeightPct);
  return clamp(Math.round(100 - ((internalGap + externalGap) / 2)), 0, 100);
}

function buildExplainabilitySummary(input: {
  confidence: number;
  risk: number;
  triangulationScore: number;
  opportunityScore: number;
  profileCoverage: number;
  preferredCoverage: number;
  profile: SourceProfile;
  missingPreferredTypes: SourceTypeKey[];
}): SignalExplainability {
  const topDrivers = [
    input.opportunityScore >= 70 ? "market_gap_clear" : null,
    input.confidence >= 65 ? "evidence_is_consistent" : null,
    input.triangulationScore >= 67 ? "multiple_source_types_align" : null,
    input.profileCoverage >= 65 ? "source_mix_matches_signal_type" : null,
    input.preferredCoverage >= 67
      ? input.profile.key === "demand-led"
        ? "demand_evidence_present"
        : input.profile.key === "location-led"
          ? "location_evidence_present"
          : input.profile.key === "execution-led"
            ? "execution_evidence_present"
            : "balanced_evidence_present"
      : null,
  ].filter((value): value is SignalExplainabilityDriverKey => Boolean(value));

  const topRisks = [
    input.risk >= 67 ? "execution_risk_high" : null,
    input.confidence < 50 ? "evidence_still_thin" : null,
    input.triangulationScore < 50 ? "source_diversity_low" : null,
    input.profileCoverage < 45 ? "source_mix_misses_signal_type" : null,
    input.missingPreferredTypes.length > 0 ? "niche_expected_sources_missing" : null,
  ].filter((value): value is SignalExplainabilityRiskKey => Boolean(value));

  const summary: SignalExplainabilitySummaryKey =
    input.confidence >= 65 && input.risk < 45
      ? "well_supported_but_still_needs_validation"
      : input.confidence < 50
        ? "promising_but_needs_more_evidence"
        : "mixed_signal_requires_careful_validation";

  return { topDrivers, topRisks, summary };
}

export function normalizeOpportunityScore(value: number | null | undefined): number {
  const raw = toNumber(value);
  const normalized = raw > 0 && raw <= 10 ? raw * 10 : raw;
  return clamp(normalized, 0, 100);
}

function normalizeInterestScore(interestCount: number): number {
  return clamp(Math.round((Math.min(interestCount, 24) / 24) * 100), 0, 100);
}

function buildExecutionReadinessScore(input: {
  opportunityScore: number;
  whitespaceScore: number | null;
  profileCoverage: number;
  preferredCoverage: number;
  contextualCount: number;
  executionRisk: number;
}): number {
  const localSignalScore = clamp(
    Math.round(
      ((input.whitespaceScore ?? input.opportunityScore) * 0.3)
      + (input.profileCoverage * 0.2)
      + (input.preferredCoverage * 0.15)
      + (Math.min(input.contextualCount, 3) * 18),
    ),
    0,
    100,
  );

  return clamp(
    Math.round((localSignalScore * 0.45) + ((100 - input.executionRisk) * 0.55)),
    0,
    100,
  );
}

function buildActionabilityScore(input: {
  opportunityScore: number;
  confidenceScore: number;
  executionReadinessScore: number;
  freshnessScore: number;
  riskScore: number;
}): number {
  return clamp(
    Math.round(
      (input.opportunityScore * 0.34)
      + (input.confidenceScore * 0.24)
      + (input.executionReadinessScore * 0.24)
      + (input.freshnessScore * 0.18)
      - (input.riskScore * 0.12),
    ),
    0,
    100,
  );
}

export function buildSignalScores(input: SignalScoreInput): SignalScores {
  const baseOpportunityScore = normalizeOpportunityScore(input.profitabilityScore);
  const aiMarketScore = clamp(toNumber(input.marketScore ?? input.aiScore, baseOpportunityScore / 10), 0, 10);
  const communityScore = clamp(toNumber(input.userTrustScore), 0, 10);
  const blendedScore = clamp(
    toNumber(input.confidenceAdjustedScore ?? input.finalScore, aiMarketScore),
    0,
    10,
  );
  const evidenceConfidence = clamp(
    toNumber(input.evidenceConfidence ?? input.aiInsightConfidence),
    0,
    100,
  );
  const communityValidation = clamp(toNumber(input.trustPercentage, 50), 0, 100);
  const communityInterest = Math.max(0, Math.round(toNumber(input.interestCount)));
  const whitespaceRaw = Number(input.whitespaceScore);
  const whitespaceScore = Number.isFinite(whitespaceRaw)
    ? clamp(whitespaceRaw, 0, 100)
    : null;
  const opportunityScore = clamp(
    Math.round(
      (baseOpportunityScore * 0.5)
      + ((whitespaceScore ?? baseOpportunityScore) * 0.3)
      + ((aiMarketScore * 10) * 0.2),
    ),
    0,
    100,
  );
  const sourceProfile = resolveSourceProfile({
    niche: input.niche,
    reportType: input.reportType,
  });
  const sourceBreakdown = {
    primary: Math.max(0, Math.round(toNumber(input.sourcePrimaryCount, evidenceConfidence >= 70 ? 2 : 1))),
    secondary: Math.max(0, Math.round(toNumber(input.sourceSecondaryCount, evidenceConfidence >= 55 ? 2 : 1))),
    social: Math.max(0, Math.round(toNumber(input.sourceSocialCount, communityInterest > 0 ? 1 : 0))),
    behavioral: Math.max(0, Math.round(toNumber(input.sourceBehavioralCount, communityInterest >= 4 ? 1 : 0))),
    contextual: Math.max(0, Math.round(toNumber(input.sourceContextualCount, whitespaceScore != null ? 1 : 0))),
  };
  const sourceTotal =
    sourceBreakdown.primary
    + sourceBreakdown.secondary
    + sourceBreakdown.social
    + sourceBreakdown.behavioral
    + sourceBreakdown.contextual;
  const weightedProfileCoverage = getProfileCoverageScore(sourceBreakdown, sourceProfile);
  const preferredCoverage = getPreferredCoverageScore(sourceBreakdown, sourceProfile);
  const profileCoverage = clamp(
    Math.round((weightedProfileCoverage * 0.65) + (preferredCoverage * 0.35)),
    0,
    100,
  );
  const missingPreferredTypes = sourceProfile.preferredTypes.filter((type) => sourceBreakdown[type] <= 0);
  const fallbackCoverage = Math.round(((sourceTotal * 14) * 0.5) + (profileCoverage * 0.5));
  const sourceCoverage = clamp(toNumber(input.sourceCoverageScore, fallbackCoverage), 0, 100);
  const weightedDiversity = clamp(
    Math.round((([
      sourceBreakdown.primary,
      sourceBreakdown.secondary,
      sourceBreakdown.social,
      sourceBreakdown.behavioral,
      sourceBreakdown.contextual,
    ].filter((count) => count > 0).length / 5) * 60) + (profileCoverage * 0.4)),
    0,
    100,
  );
  const sourceDiversity = clamp(
    toNumber(
      input.sourceDiversityScore,
      weightedDiversity,
    ),
    0,
    100,
  );
  const sourceFreshness = clamp(
    toNumber(input.sourceFreshnessScore, evidenceConfidence * 0.85),
    0,
    100,
  );
  const internalWeightPct = clamp(
    toNumber(input.sourceInternalWeightPct, sourceProfile.targetInternalWeightPct),
    0,
    100,
  );
  const externalWeightPct = clamp(
    toNumber(input.sourceExternalWeightPct, sourceProfile.targetExternalWeightPct),
    0,
    100,
  );
  const splitAlignment = getSplitAlignmentScore({
    internalWeightPct,
    externalWeightPct,
    profile: sourceProfile,
  });
  const corroboration = clamp(
    Math.round(
      (evidenceConfidence * 0.4)
      + (sourceDiversity * 0.3)
      + (profileCoverage * 0.1)
      + (preferredCoverage * 0.1)
      + (splitAlignment * 0.15),
    ),
    0,
    100,
  );
  const nicheMismatchPenalty = missingPreferredTypes.length * 4;
  const confidenceScore = clamp(
    Math.round(
      (sourceCoverage * 0.22)
      + (sourceDiversity * 0.23)
      + (sourceFreshness * 0.2)
      + (corroboration * 0.25)
      + (profileCoverage * 0.1),
    ) - nicheMismatchPenalty,
    0,
    100,
  );
  const marketRisk = clamp(
    toNumber(input.marketRiskScore, 100 - (whitespaceScore ?? 50)),
    0,
    100,
  );
  const executionRisk = clamp(
    toNumber(input.executionRiskScore, 100 - opportunityScore),
    0,
    100,
  );
  const evidenceRisk = clamp(
    toNumber(input.evidenceRiskScore, 100 - confidenceScore),
    0,
    100,
  );
  const riskScore = clamp(
    Math.round(toNumber(input.riskScore, (marketRisk * 0.35) + (executionRisk * 0.35) + (evidenceRisk * 0.3))),
    0,
    100,
  );
  const popularityBias = clamp(
    toNumber(input.popularityBiasScore, Math.max(0, communityInterest - 8) * 6),
    0,
    100,
  );
  const geographyBias = clamp(
    toNumber(input.geographyBiasScore, sourceBreakdown.contextual === 0 ? 55 : 25),
    0,
    100,
  );
  const dataBias = clamp(
    toNumber(
      input.dataBiasScore,
      100 - Math.round((sourceDiversity * 0.45) + (profileCoverage * 0.3) + (preferredCoverage * 0.25)),
    ),
    0,
    100,
  );
  const biasScore = clamp(
    Math.round(toNumber(input.biasScore, (popularityBias * 0.3) + (geographyBias * 0.25) + (dataBias * 0.45))),
    0,
    100,
  );
  const marketInterestScore = clamp(
    Math.round(
      (normalizeInterestScore(communityInterest) * 0.5)
      + (communityValidation * 0.3)
      + ((communityScore * 10) * 0.2),
    ),
    0,
    100,
  );
  const confirmedTypes = [
    sourceBreakdown.primary,
    sourceBreakdown.secondary,
    sourceBreakdown.social,
    sourceBreakdown.behavioral,
    sourceBreakdown.contextual,
  ].filter((count) => count > 0).length;
  const triangulationScore = clamp(
    Math.round(((confirmedTypes / 5) * 75) + (profileCoverage * 0.25)),
    0,
    100,
  );
  const executionReadinessScore = buildExecutionReadinessScore({
    opportunityScore,
    whitespaceScore,
    profileCoverage,
    preferredCoverage,
    contextualCount: sourceBreakdown.contextual,
    executionRisk,
  });
  const actionabilityScore = buildActionabilityScore({
    opportunityScore,
    confidenceScore,
    executionReadinessScore,
    freshnessScore: sourceFreshness,
    riskScore,
  });
  const explainability = buildExplainabilitySummary({
    confidence: confidenceScore,
    risk: riskScore,
    triangulationScore,
    opportunityScore,
    profileCoverage,
    preferredCoverage,
    profile: sourceProfile,
    missingPreferredTypes,
  });

  return {
    public: {
      opportunityScore,
      confidenceScore,
      marketInterestScore,
      executionReadinessScore,
      actionabilityScore,
      investigationScore: actionabilityScore,
      evidenceStrength: confidenceScore,
      gapClarity: whitespaceScore,
      communityValidation,
      communityInterest,
    },
    internal: {
      marketReading: aiMarketScore,
      communitySignal: communityScore,
      feedRankingScore: blendedScore,
      rankingScore: blendedScore,
      gapClarity: whitespaceScore,
      sourceCoverageScore: sourceCoverage,
      triangulationScore,
      biasScore,
      riskScore,
    },
    opportunityScore,
    aiMarketScore,
    communityScore,
    blendedScore,
    evidenceConfidence,
    communityValidation,
    communityInterest,
    whitespaceScore,
    confidence: {
      score: confidenceScore,
      freshness: sourceFreshness,
      coverage: sourceCoverage,
      corroboration,
    },
    risk: {
      score: riskScore,
      market: marketRisk,
      execution: executionRisk,
      evidence: evidenceRisk,
      level: getRiskLevel(riskScore),
    },
    bias: {
      score: biasScore,
      popularity: popularityBias,
      geography: geographyBias,
      data: dataBias,
      level: getRiskLevel(biasScore),
    },
    sourceBreakdown: {
      ...sourceBreakdown,
      total: sourceTotal,
      dominantType: getDominantSourceType(sourceBreakdown),
    },
    sourceProfile: {
      key: sourceProfile.key,
      label: sourceProfile.label,
      targetInternalWeightPct: sourceProfile.targetInternalWeightPct,
      targetExternalWeightPct: sourceProfile.targetExternalWeightPct,
      profileCoverage,
      preferredCoverage,
      rationaleKey: sourceProfile.rationaleKey,
      preferredTypes: sourceProfile.preferredTypes,
      missingPreferredTypes,
    },
    triangulation: {
      score: triangulationScore,
      confirmedTypes,
      minimumTypesNeeded: 3,
      isStrong: confirmedTypes >= 3,
    },
    explainability,
  };
}

export function getSignalFieldHelp(isEn: boolean): SignalFieldHelp {
  if (isEn) {
    return {
      confidenceScore:
        "Public confidence score from freshness, corroboration, source coverage and source diversity. It shows how credible the signal currently looks.",
      marketInterestScore:
        "Public market-interest score derived from follows, reactions and trust behavior. It shows traction, not proof of opportunity.",
      executionReadinessScore:
        "Public execution-readiness score. It estimates how feasible local execution looks with the current locality and evidence mix.",
      actionabilityScore:
        "Public actionability score. It combines opportunity, confidence, execution readiness and timing into a simple now-vs-later recommendation.",
      opportunityScore:
        "Main score for the signal. It summarizes demand, competition, investment effort and local potential on a 0 to 100 scale.",
      evidenceConfidence:
        "Shows how solid the current data is. More fresh sources, reviews and corroboration raise this confidence score.",
      investigationScore:
        "Public screening score. It only tells you whether the signal deserves investigation, not whether the business is guaranteed.",
      evidenceStrength:
        "Public evidence strength. It reflects how well the current signal is supported by fresh and corroborated sources.",
      marketReading:
        "Internal market reading on a 0 to 10 scale. It summarizes demand, competition, gap and local context for ranking logic.",
      communitySignal:
        "Internal community layer on a 0 to 10 scale. It reflects trust-vote sentiment without overriding the market reading.",
      feedRankingScore:
        "Internal feed-ranking score on a 0 to 10 scale. It is used only for ordering and discovery, not as the public business promise.",
      rankingScore:
        "Internal ordering score on a 0 to 10 scale. It is used for ranking and access logic, not as the main public promise.",
      gapClarity:
        "Internal estimate of how visible the unmet need is in the current evidence snapshot.",
      communityValidation:
        "Shows how many users consider the signal credible. This is public feedback, not the main market formula.",
      communityInterest:
        "Counts how many users explicitly marked the signal as interesting for follow-up or monitoring.",
      aiMarketScore:
        "The AI market layer on a 0 to 10 scale. It reads demand, supply pressure, gap and commercial context.",
      communityScore:
        "The community trust layer on a 0 to 10 scale. It is derived from trust votes and only adjusts the market score slightly.",
      blendedScore:
        "Final blended score on a 0 to 10 scale. It combines the AI market score with the community trust layer.",
      whitespaceScore:
        "Internal gap score. Higher values suggest a clearer unmet need, but this metric is only one ingredient in the full opportunity score.",
    };
  }

  return {
    confidenceScore:
      "Scor public de incredere construit din prospetime, corroborare, acoperirea surselor si diversitatea lor. Arata cat de credibil pare acum semnalul.",
    marketInterestScore:
      "Scor public de interes de piata derivat din follow, reactii si comportamente de incredere. Arata tractiune, nu dovada de oportunitate.",
    executionReadinessScore:
      "Scor public de pregatire pentru executie. Estimeaza cat de fezabila pare executia locala pe baza contextului si a mixului de dovezi.",
    actionabilityScore:
      "Scor public de actionabilitate. Combina oportunitatea, increderea, pregatirea pentru executie si timingul intr-o recomandare simpla de acum vs mai tarziu.",
    opportunityScore:
      "Scorul principal al semnalului. Rezuma cererea, competitia, efortul de investitie si potentialul local pe o scara de la 0 la 100.",
    evidenceConfidence:
      "Arata cat de solide sunt datele din snapshot-ul curent. Mai multe surse proaspete, recenzii si confirmari cresc aceasta valoare.",
    investigationScore:
      "Scor public de screening. Arata doar daca semnalul merita investigat mai atent, nu daca business-ul este garantat.",
    evidenceStrength:
      "Soliditatea dovezilor publice. Reflecta cat de bine este sustinut semnalul de surse proaspete si confirmari convergente.",
    marketReading:
      "Citire interna din piata pe scara 0-10. Rezuma cererea, competitia, gap-ul si contextul local pentru logica de ranking.",
    communitySignal:
      "Strat intern din comunitate pe scara 0-10. Reflecta voturile de incredere fara sa inlocuiasca evaluarea de piata.",
    feedRankingScore:
      "Scor intern de ranking pentru Flux pe scala 0-10. Este folosit doar pentru ordonare si discovery, nu ca promisiune publica de business.",
    rankingScore:
      "Scor intern de ordonare pe scara 0-10. Este folosit pentru ranking si praguri de acces, nu ca promisiune publica principala.",
    gapClarity:
      "Estimare interna pentru cat de vizibil pare golul din piata in snapshot-ul actual de dovezi.",
    communityValidation:
      "Arata cati utilizatori considera semnalul credibil. Este feedback public, nu formula principala a scorului de piata.",
    communityInterest:
      "Numarul de utilizatori care au marcat explicit semnalul ca merita urmarit sau validat mai departe.",
    aiMarketScore:
      "Componenta AI de piata pe scara 0-10. Citeste cererea, presiunea concurentiala, gap-ul si contextul comercial.",
    communityScore:
      "Componenta comunitara pe scara 0-10. Este derivata din voturile de incredere si ajusteaza doar usor scorul de piata.",
    blendedScore:
      "Scorul final combinat pe scara 0-10. Rezulta din scorul AI de piata plus ajustarea limitata din stratul comunitar.",
    whitespaceScore:
      "Scor intern pentru golul din piata. Valorile mari sugereaza o nevoie mai clara neacoperita, dar este doar un ingredient din scorul final.",
  };
}

export function formatOpportunityScore(value: number, digits = 0): string {
  return `${normalizeOpportunityScore(value).toFixed(digits)}/100`;
}

export function formatTenPointScore(value: number, digits = 1): string {
  return `${clamp(value, 0, 10).toFixed(digits)}/10`;
}
