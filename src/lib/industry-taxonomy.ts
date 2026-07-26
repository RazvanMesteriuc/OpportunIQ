export const INDUSTRY_OPTIONS = [
  "HoReCa",
  "Retail & Comert",
  "IT & Tech",
  "Servicii IT",
  "Servicii Profesionale",
  "Constructii",
  "Transporturi & Logistica",
  "Industrie & Productie",
  "StartUp & Inovatie",
  "Wellness & Beauty",
  "Fitness",
  "Turism",
  "Agricultura",
  "Auto",
  "Imobiliare",
  "Clinica / Medicala",
  "E-commerce",
] as const;

function normalize(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildIndustryOptions(extraValue?: string | null) {
  const seen = new Set<string>();
  const items: string[] = [];

  const push = (value?: string | null) => {
    const label = String(value ?? "").trim();
    if (!label) return;
    const key = normalize(label);
    if (seen.has(key)) return;
    seen.add(key);
    items.push(label);
  };

  push(extraValue);
  INDUSTRY_OPTIONS.forEach(push);
  return items;
}
