import type { ReportSourceAuditEntryInput } from "@/lib/signal-action-kernel-adapter";
import type { SignalSourceAdapterResult } from "@/lib/signal-source-contract";

function mapFreshnessTag(freshnessHours: number | null): ReportSourceAuditEntryInput["freshness"] {
  if (freshnessHours == null) return "derived";
  if (freshnessHours <= 72) return "live";
  if (freshnessHours <= 24 * 90) return "cached";
  return "derived";
}

function buildAuditNotes(input: {
  sourceLabel: string;
  observationCount: number;
  averageCoverage: number;
  averageConfidence: number;
}): string {
  return `${input.sourceLabel} contribuie cu ${input.observationCount} observatii normalizate, acoperire ${input.averageCoverage}/100 si incredere ${input.averageConfidence}/100.`;
}

export function buildSourceAuditEntriesFromAdapters(
  sourceAdapters: SignalSourceAdapterResult[],
): ReportSourceAuditEntryInput[] {
  return sourceAdapters
    .filter((adapter) => adapter.observations.length > 0)
    .map((adapter) => {
      const evidenceCount = adapter.observations.reduce(
        (sum, observation) => sum + Math.max(1, observation.evidenceRefs.length || 1),
        0,
      );
      const freshnessValues = adapter.observations
        .map((observation) => observation.freshnessHours)
        .filter((value): value is number => value != null);
      const coverageValues = adapter.observations.map((observation) => observation.coverageCompleteness);
      const confidenceValues = adapter.observations.map((observation) => observation.confidenceWeight);

      const averageCoverage = Math.round(
        coverageValues.reduce((sum, value) => sum + value, 0) / Math.max(1, coverageValues.length),
      );
      const averageConfidence = Math.round(
        confidenceValues.reduce((sum, value) => sum + value, 0) / Math.max(1, confidenceValues.length),
      );

      return {
        id: `adapter:${adapter.source.key}`,
        label: adapter.source.label,
        category: adapter.source.role === "internal" ? "internal" : "external",
        provider: adapter.source.key,
        evidenceCount,
        freshness: mapFreshnessTag(
          freshnessValues.length > 0 ? Math.min(...freshnessValues) : null,
        ),
        reliabilityScore: averageConfidence,
        notes: buildAuditNotes({
          sourceLabel: adapter.source.label,
          observationCount: adapter.observations.length,
          averageCoverage,
          averageConfidence,
        }),
      };
    });
}
