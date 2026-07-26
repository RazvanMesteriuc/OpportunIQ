import {
  COUNTIES,
  ROMANIA_COUNTIES,
  getCountyByCity,
} from "@/lib/romania-counties";
import { useEffect, useState } from "react";

export type AppUserRole = "antreprenor" | "partener";

type RawLocality = {
  nume: string;
  judet: string;
  judetAuto: string;
  populatie?: number;
};

type LocalityEntry = {
  name: string;
  countyCode: string;
  countyName: string;
  label: string;
};

function normalize(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const countyNameByCode = new Map(COUNTIES.map((county) => [county.code, county.name]));
let localityEntriesCache: LocalityEntry[] | null = null;
let localityEntriesPromise: Promise<LocalityEntry[]> | null = null;

export const INDUSTRY_OPTIONS = [
  "Agricultură sustenabilă",
  "Alimentație & FMCG",
  "Animale & Pet Care",
  "Automotive & Mobility",
  "Construcții & Imobiliare",
  "Educație & EdTech",
  "Energie & Utilități",
  "Finanțe & FinTech",
  "HoReCa & Turism",
  "Industrie & Producție",
  "IT & Software",
  "Logistică & Supply Chain",
  "Manufacturing",
  "Marketing & Media",
  "Retail & E-commerce",
  "Retail local",
  "Sănătate & Wellness",
  "Servicii profesionale",
  "Sustenabilitate",
  "Telecom & Infrastructură",
  "Tehnologie verde",
  "Wellness & Beauty",
] as const;

export const INDUSTRY_FILTER_OPTIONS = ["Toate industriile", ...INDUSTRY_OPTIONS];

export const APP_ROLE_OPTIONS: Array<{ value: AppUserRole; label: string }> = [
  { value: "antreprenor", label: "Antreprenor" },
  { value: "partener", label: "Partener" },
];

export const COUNTY_OPTIONS = ROMANIA_COUNTIES.map((county) => county.name);

function buildLocalityEntries(rawEntries: Record<string, RawLocality[]>): LocalityEntry[] {
  return Object.entries(rawEntries)
    .flatMap(([countyCode, entries]) => {
      const countyName = countyNameByCode.get(countyCode) ?? entries[0]?.judet ?? countyCode;
      const uniqueNames = new Set<string>();

      return entries
        .map((entry) => entry.nume?.trim())
        .filter((name): name is string => Boolean(name))
        .sort((left, right) => left.localeCompare(right, "ro"))
        .filter((name) => {
          const key = normalize(name);
          if (!key || uniqueNames.has(key)) return false;
          uniqueNames.add(key);
          return true;
        })
        .map((name) => ({
          name,
          countyCode,
          countyName,
          label: `${name} (${countyName})`,
        }));
    })
    .sort((left, right) => left.label.localeCompare(right.label, "ro"));
}

export async function loadLocalityEntries(): Promise<LocalityEntry[]> {
  if (localityEntriesCache) return localityEntriesCache;
  if (localityEntriesPromise) return localityEntriesPromise;

  localityEntriesPromise = import("@/lib/data/romania-localities.json")
    .then((module) => buildLocalityEntries(module.default as Record<string, RawLocality[]>))
    .then((entries) => {
      localityEntriesCache = entries;
      return entries;
    })
    .finally(() => {
      localityEntriesPromise = null;
    });

  return localityEntriesPromise;
}

export function buildLocationFilterOptions(allLabel: string, localityOptions: string[] = []): string[] {
  return [allLabel, ...COUNTY_OPTIONS, ...localityOptions];
}

export async function getLocalityOptionsForCounty(countyName?: string | null): Promise<string[]> {
  const normalizedCounty = normalize(countyName);
  if (!normalizedCounty) return [];
  const localityEntries = await loadLocalityEntries();

  return localityEntries
    .filter((entry) => normalize(entry.countyName) === normalizedCounty)
    .map((entry) => entry.name);
}

export function useLocationFilterOptions(allLabel: string): string[] {
  const [options, setOptions] = useState<string[]>(() => buildLocationFilterOptions(allLabel));

  useEffect(() => {
    let cancelled = false;
    setOptions(buildLocationFilterOptions(allLabel));

    void loadLocalityEntries().then((entries) => {
      if (cancelled) return;
      setOptions(buildLocationFilterOptions(allLabel, entries.map((entry) => entry.label)));
    });

    return () => {
      cancelled = true;
    };
  }, [allLabel]);

  return options;
}

export function useLocalityOptionsForCounty(countyName?: string | null): string[] {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    void getLocalityOptionsForCounty(countyName).then((nextOptions) => {
      if (cancelled) return;
      setOptions(nextOptions);
    });

    return () => {
      cancelled = true;
    };
  }, [countyName]);

  return options;
}

export function isCountyOption(value?: string | null): boolean {
  const normalizedValue = normalize(value);
  return COUNTY_OPTIONS.some((county) => normalize(county) === normalizedValue);
}

export function matchesLocationSelection(
  selectedLocation: string,
  city?: string | null,
  county?: string | null,
): boolean {
  if (!selectedLocation || normalize(selectedLocation).startsWith("toate")) return true;

  const normalizedSelection = normalize(selectedLocation);
  const cityName = String(city ?? "").trim();
  const countyName = String(county ?? "").trim() || getCountyByCity(cityName)?.name || "";
  const localityLabel = cityName && countyName ? `${cityName} (${countyName})` : cityName;

  return [
    normalizedSelection === normalize(cityName),
    normalizedSelection === normalize(countyName),
    normalizedSelection === normalize(localityLabel),
  ].some(Boolean);
}
