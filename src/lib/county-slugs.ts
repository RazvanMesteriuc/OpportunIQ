import { ROMANIA_COUNTIES } from "./romania-counties";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ș|ş/g, "s")
    .replace(/ț|ţ/g, "t")
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const COUNTY_SLUGS: { code: string; name: string; slug: string }[] =
  ROMANIA_COUNTIES.map(c => ({ ...c, slug: slugify(c.name) }));

export function countyBySlug(slug: string) {
  return COUNTY_SLUGS.find(c => c.slug === slug);
}

export function countySlugByCode(code: string): string | null {
  return COUNTY_SLUGS.find(c => c.code === code)?.slug ?? null;
}
