export function formatCurrency(amount: number, currency: string = "RON") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateReportSlug(titleOrNiche: string, city: string, id: number | string): string {
  const base = titleOrNiche ? `${titleOrNiche}-${city}` : `raport-${city}`;
  const slug = slugify(base);
  return `${slug}-${id}`;
}

export function generateArticleSlug(title: string, id: number | string): string {
  const slug = slugify(title || "articol");
  return `${slug || "articol"}-${id}`;
}

export function generateCompanySlug(name: string | null | undefined, city: string | null | undefined, id: number | string): string {
  const base = [name, city].filter(Boolean).join("-");
  const slug = slugify(base || "firma");
  return `${slug || "firma"}-${id}`;
}

export type CompanyLeadSourceContext = {
  sourceType: string;
  sourceEntityType?: string | null;
  sourceEntityId?: string | number | null;
  sourceLabel?: string | null;
  sourcePath?: string | null;
  sourceIndustry?: string | null;
  sourceLocality?: string | null;
  signalStatus?: string | null;
  intentType?: string | null;
  matchScore?: number | null;
  matchReasons?: string[] | null;
};

export function buildCompanyProfileHref(
  name: string | null | undefined,
  city: string | null | undefined,
  id: number | string,
  source?: CompanyLeadSourceContext | null,
): string {
  const basePath = `/firma/${generateCompanySlug(name, city, id)}`;
  if (!source) return basePath;

  const params = new URLSearchParams();
  params.set("source", source.sourceType);
  if (source.sourceEntityType) params.set("sourceEntityType", source.sourceEntityType);
  if (source.sourceEntityId != null) params.set("sourceEntityId", String(source.sourceEntityId));
  if (source.sourceLabel) params.set("sourceLabel", source.sourceLabel);
  if (source.sourcePath) params.set("sourcePath", source.sourcePath);
  if (source.sourceIndustry) params.set("sourceIndustry", source.sourceIndustry);
  if (source.sourceLocality) params.set("sourceLocality", source.sourceLocality);
  if (source.signalStatus) params.set("signalStatus", source.signalStatus);
  if (source.intentType) params.set("intentType", source.intentType);
  if (Number.isFinite(Number(source.matchScore))) params.set("matchScore", String(Math.round(Number(source.matchScore))));
  if (Array.isArray(source.matchReasons)) {
    for (const reason of source.matchReasons.slice(0, 6)) {
      if (reason) params.append("matchReason", reason);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function extractTrailingId(value: string | undefined | null): number {
  if (!value) return NaN;
  const match = value.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : parseInt(value, 10);
}
