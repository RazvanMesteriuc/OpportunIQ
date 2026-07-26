import type {
  SignalExplainabilityDriverKey,
  SignalExplainabilityRiskKey,
  SignalExplainabilitySummaryKey,
  SignalSourceProfileRationaleKey,
  SourceProfileKey,
  SourceTypeKey,
} from "./signal-score-contract";

export function getSignalExplainabilityDriverLabel(
  key: SignalExplainabilityDriverKey,
  isEn: boolean,
) {
  switch (key) {
    case "market_gap_clear":
      return isEn ? "The market gap looks visible" : "Gap-ul din piata pare vizibil";
    case "evidence_is_consistent":
      return isEn ? "The evidence stays relatively consistent" : "Dovezile sunt relativ consistente";
    case "multiple_source_types_align":
      return isEn ? "Multiple source types point in the same direction" : "Mai multe tipuri de surse arata in aceeasi directie";
    case "demand_evidence_present":
      return isEn ? "Demand-facing sources support the signal" : "Sursele orientate spre cerere sustin semnalul";
    case "location_evidence_present":
      return isEn ? "Local context sources support the signal" : "Sursele de context local sustin semnalul";
    case "execution_evidence_present":
      return isEn ? "Operational and factual sources support the signal" : "Sursele operationale si factuale sustin semnalul";
    case "balanced_evidence_present":
      return isEn ? "The source mix stays balanced enough" : "Mixul de surse ramane suficient de echilibrat";
    case "source_mix_matches_signal_type":
      return isEn ? "The source mix fits this signal type" : "Mixul de surse se potriveste cu acest tip de semnal";
  }
}

export function getSignalExplainabilityRiskLabel(
  key: SignalExplainabilityRiskKey,
  isEn: boolean,
) {
  switch (key) {
    case "execution_risk_high":
      return isEn ? "Execution risk stays elevated" : "Riscul de executie ramane ridicat";
    case "evidence_still_thin":
      return isEn ? "The evidence is still thin" : "Dovezile sunt inca subtiri";
    case "source_diversity_low":
      return isEn ? "Too few source types confirm the signal" : "Prea putine tipuri de surse confirma semnalul";
    case "source_mix_misses_signal_type":
      return isEn ? "The source mix does not fit this signal well yet" : "Mixul de surse nu se potriveste inca bine cu acest semnal";
    case "niche_expected_sources_missing":
      return isEn ? "Some of the source types expected for this niche are still missing" : "Lipsesc inca unele tipuri de surse asteptate pentru aceasta nisa";
  }
}

export function getSignalSourceTypeLabel(type: SourceTypeKey, isEn: boolean) {
  switch (type) {
    case "primary":
      return isEn ? "primary" : "primare";
    case "secondary":
      return isEn ? "secondary" : "secundare";
    case "social":
      return isEn ? "social" : "sociale";
    case "behavioral":
      return isEn ? "behavioral" : "comportamentale";
    case "contextual":
      return isEn ? "contextual" : "contextuale";
  }
}

export function getSignalSourceProfileLabel(key: SourceProfileKey, isEn: boolean) {
  switch (key) {
    case "demand-led":
      return isEn ? "Demand-led" : "Orientat spre cerere";
    case "location-led":
      return isEn ? "Location-led" : "Orientat spre locatie";
    case "execution-led":
      return isEn ? "Execution-led" : "Orientat spre executie";
    case "balanced":
      return isEn ? "Balanced" : "Echilibrat";
  }
}

export function getSignalSourceProfileRationaleLabel(
  key: SignalSourceProfileRationaleKey,
  isEn: boolean,
) {
  switch (key) {
    case "demand_signal":
      return isEn
        ? "For this niche, reviews, demand traces and local behavior should weigh more than generic secondary context."
        : "Pentru aceasta nisa, recenziile, urmele de cerere si comportamentul local ar trebui sa cantareasca mai mult decat contextul secundar generic.";
    case "location_signal":
      return isEn
        ? "For this niche, location context, local density and direct market proof matter more than social noise."
        : "Pentru aceasta nisa, contextul de locatie, densitatea locala si dovada directa din piata conteaza mai mult decat zgomotul social.";
    case "execution_signal":
      return isEn
        ? "For this niche, primary and secondary factual evidence should dominate before community buzz can matter."
        : "Pentru aceasta nisa, dovezile factuale primare si secundare ar trebui sa domine inainte ca buzz-ul comunitar sa conteze.";
    case "balanced_signal":
      return isEn
        ? "This signal uses a more balanced source mix because no niche-specific pattern dominates clearly yet."
        : "Acest semnal foloseste un mix de surse mai echilibrat, pentru ca niciun tipar specific de nisa nu domina clar inca.";
  }
}

export function getSignalExplainabilitySummaryLabel(
  key: SignalExplainabilitySummaryKey,
  isEn: boolean,
) {
  switch (key) {
    case "well_supported_but_still_needs_validation":
      return isEn
        ? "The signal is well supported, but still needs local validation before a stronger move."
        : "Semnalul este bine sustinut, dar cere totusi validare locala inainte de un pas mai ferm.";
    case "promising_but_needs_more_evidence":
      return isEn
        ? "The signal looks promising, but the current proof is not strong enough yet."
        : "Semnalul pare promitator, dar dovada curenta nu este inca suficient de puternica.";
    case "mixed_signal_requires_careful_validation":
      return isEn
        ? "The signal is mixed and should be validated carefully before commitment."
        : "Semnalul este mixt si trebuie validat cu grija inainte de angajament.";
  }
}
