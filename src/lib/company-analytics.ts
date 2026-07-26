type CompanySourceAnalyticsContext = {
  sourceType?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  sourceLabel?: string | null;
  sourcePath?: string | null;
  signalStatus?: string | null;
  intentType?: string | null;
  matchScore?: number | null;
  matchReasons?: string[] | null;
};

type CompanyAnalyticsInput = {
  company: {
    id: string | number;
    name?: string | null;
    city?: string | null;
    county?: string | null;
    industry?: string | null;
  };
  sourceContext?: CompanySourceAnalyticsContext | null;
  source: string;
  niche?: string | null;
  budgetBand?: string | null;
};

export function buildCompanyAnalyticsMetadata(input: CompanyAnalyticsInput): Record<string, unknown> {
  return {
    companyName: input.company.name ?? null,
    city: input.company.city ?? null,
    county: input.company.county ?? null,
    industry: input.company.industry ?? null,
    source: input.source,
    sourceType: input.sourceContext?.sourceType ?? null,
    sourceEntityType: input.sourceContext?.sourceEntityType ?? null,
    sourceEntityId: input.sourceContext?.sourceEntityId ?? null,
    sourceLabel: input.sourceContext?.sourceLabel ?? null,
    sourcePath: input.sourceContext?.sourcePath ?? null,
    signalStatus: input.sourceContext?.signalStatus ?? null,
    intentType: input.sourceContext?.intentType ?? null,
    matchScore: input.sourceContext?.matchScore ?? null,
    matchReasons: input.sourceContext?.matchReasons ?? null,
    niche: input.niche ?? null,
    budgetBand: input.budgetBand ?? null,
  };
}

export function buildCompanyOpenMetadata(
  input: Omit<CompanyAnalyticsInput, "source" | "niche" | "budgetBand">,
): Record<string, unknown> {
  return buildCompanyAnalyticsMetadata({
    ...input,
    source: input.sourceContext?.sourceType ?? "company_profile",
  });
}

export function buildCompanyContactStartMetadata(
  input: Omit<CompanyAnalyticsInput, "source">,
): Record<string, unknown> {
  return buildCompanyAnalyticsMetadata({
    ...input,
    source: input.sourceContext?.sourceType ?? "company_contact_form",
  });
}
