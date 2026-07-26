import type { ReportSeedOpportunitySummary } from "@/lib/reports-api-contract";

export function getOpportunityStageLabel(stage: ReportSeedOpportunitySummary["stage"]): string {
  switch (stage) {
    case "idea":
      return "Idee";
    case "validation":
      return "Validare";
    case "plan":
      return "Plan";
    case "pitch":
      return "Pitch";
    default:
      return stage;
  }
}
