export interface County {
  code: string;
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number]; // [south, west, north, east]
  cities: string[];
}

export const COUNTIES: County[] = [
  { code: "AB", name: "Alba", lat: 46.07, lng: 23.58, bbox: [45.60, 22.87, 46.50, 24.37], cities: ["Alba Iulia", "Sebeș", "Aiud", "Blaj", "Câmpeni"] },
  { code: "AR", name: "Arad", lat: 46.17, lng: 21.31, bbox: [45.65, 20.79, 46.91, 22.27], cities: ["Arad", "Ineu", "Lipova", "Curtici", "Nădlac"] },
  { code: "AG", name: "Argeș", lat: 45.08, lng: 24.87, bbox: [44.59, 24.35, 45.70, 25.67], cities: ["Pitești", "Câmpulung", "Curtea de Argeș", "Mioveni"] },
  { code: "BC", name: "Bacău", lat: 46.57, lng: 26.91, bbox: [46.11, 26.19, 47.07, 27.58], cities: ["Bacău", "Onești", "Moinești", "Comănești"] },
  { code: "BH", name: "Bihor", lat: 47.07, lng: 22.00, bbox: [46.53, 21.44, 47.62, 22.79], cities: ["Oradea", "Salonta", "Marghita", "Beiuș", "Aleșd"] },
  { code: "BN", name: "Bistrița-Năsăud", lat: 47.13, lng: 24.50, bbox: [46.63, 23.71, 47.60, 25.36], cities: ["Bistrița", "Năsăud", "Beclean"] },
  { code: "BT", name: "Botoșani", lat: 47.75, lng: 26.67, bbox: [47.36, 26.14, 48.18, 27.35], cities: ["Botoșani", "Dorohoi", "Darabani"] },
  { code: "BV", name: "Brașov", lat: 45.64, lng: 25.59, bbox: [45.24, 24.87, 46.10, 26.36], cities: ["Brașov", "Făgăraș", "Săcele", "Codlea", "Zărnești"] },
  { code: "BR", name: "Brăila", lat: 45.27, lng: 27.97, bbox: [44.72, 27.39, 45.73, 28.37], cities: ["Brăila", "Ianca", "Însurăței"] },
  { code: "BZ", name: "Buzău", lat: 45.15, lng: 26.82, bbox: [44.68, 26.17, 45.69, 27.50], cities: ["Buzău", "Râmnicu Sărat", "Nehoiu", "Pogoanele"] },
  { code: "CS", name: "Caraș-Severin", lat: 45.10, lng: 22.12, bbox: [44.56, 21.49, 45.63, 22.76], cities: ["Reșița", "Caransebeș", "Bocșa", "Oțelu Roșu"] },
  { code: "CL", name: "Călărași", lat: 44.20, lng: 27.03, bbox: [43.73, 26.42, 44.72, 27.73], cities: ["Călărași", "Oltenița", "Budești", "Lehliu-Gară"] },
  { code: "CJ", name: "Cluj", lat: 46.77, lng: 23.62, bbox: [46.22, 22.88, 47.27, 24.42], cities: ["Cluj-Napoca", "Turda", "Dej", "Câmpia Turzii", "Gherla"] },
  { code: "CT", name: "Constanța", lat: 44.16, lng: 28.63, bbox: [43.74, 27.88, 44.63, 29.46], cities: ["Constanța", "Mangalia", "Medgidia", "Cernavodă", "Eforie"] },
  { code: "CV", name: "Covasna", lat: 45.86, lng: 25.79, bbox: [45.53, 25.31, 46.20, 26.29], cities: ["Sfântu Gheorghe", "Târgu Secuiesc", "Covasna", "Baraolt"] },
  { code: "DB", name: "Dâmbovița", lat: 44.92, lng: 25.45, bbox: [44.52, 25.03, 45.35, 25.88], cities: ["Târgoviște", "Moreni", "Pucioasa", "Titu"] },
  { code: "DJ", name: "Dolj", lat: 44.33, lng: 23.79, bbox: [43.68, 22.99, 44.74, 24.57], cities: ["Craiova", "Băilești", "Calafat", "Segarcea", "Filiași"] },
  { code: "GL", name: "Galați", lat: 45.44, lng: 28.05, bbox: [45.10, 27.62, 45.94, 28.38], cities: ["Galați", "Tecuci", "Târgu Bujor"] },
  { code: "GR", name: "Giurgiu", lat: 43.90, lng: 25.97, bbox: [43.57, 25.37, 44.27, 26.43], cities: ["Giurgiu", "Bolintin-Vale"] },
  { code: "GJ", name: "Gorj", lat: 44.91, lng: 23.28, bbox: [44.41, 22.72, 45.39, 23.87], cities: ["Târgu Jiu", "Rovinari", "Motru", "Novaci"] },
  { code: "HR", name: "Harghita", lat: 46.36, lng: 25.55, bbox: [45.87, 25.01, 46.92, 26.12], cities: ["Miercurea Ciuc", "Odorheiu Secuiesc", "Gheorgheni", "Toplița"] },
  { code: "HD", name: "Hunedoara", lat: 45.88, lng: 22.91, bbox: [45.25, 22.15, 46.37, 23.63], cities: ["Deva", "Hunedoara", "Petroșani", "Orăștie", "Brad"] },
  { code: "IL", name: "Ialomița", lat: 44.57, lng: 27.37, bbox: [44.17, 26.74, 44.99, 28.03], cities: ["Slobozia", "Fetești", "Urziceni", "Amara"] },
  { code: "IS", name: "Iași", lat: 47.16, lng: 27.60, bbox: [46.63, 26.98, 47.64, 28.08], cities: ["Iași", "Pașcani", "Hârlău", "Târgu Frumos"] },
  { code: "IF", name: "Ilfov", lat: 44.54, lng: 26.08, bbox: [44.27, 25.73, 44.72, 26.37], cities: ["Voluntari", "Buftea", "Popești-Leordeni", "Bragadiru", "Otopeni"] },
  { code: "MM", name: "Maramureș", lat: 47.66, lng: 23.57, bbox: [47.18, 22.87, 48.03, 24.55], cities: ["Baia Mare", "Sighetu Marmației", "Borșa", "Vișeu de Sus"] },
  { code: "MH", name: "Mehedinți", lat: 44.63, lng: 22.66, bbox: [44.27, 22.17, 45.04, 23.17], cities: ["Drobeta-Turnu Severin", "Orșova", "Strehaia"] },
  { code: "MS", name: "Mureș", lat: 46.54, lng: 24.56, bbox: [46.02, 23.86, 47.07, 25.29], cities: ["Târgu Mureș", "Reghin", "Sighișoara", "Târnăveni", "Luduș"] },
  { code: "NT", name: "Neamț", lat: 46.92, lng: 26.37, bbox: [46.40, 25.73, 47.43, 27.02], cities: ["Piatra Neamț", "Roman", "Târgu Neamț", "Bicaz"] },
  { code: "OT", name: "Olt", lat: 44.29, lng: 24.36, bbox: [43.72, 23.61, 44.62, 25.06], cities: ["Slatina", "Caracal", "Balș", "Corabia"] },
  { code: "PH", name: "Prahova", lat: 44.94, lng: 26.03, bbox: [44.52, 25.47, 45.44, 26.60], cities: ["Ploiești", "Câmpina", "Sinaia", "Vălenii de Munte", "Breaza"] },
  { code: "SM", name: "Satu Mare", lat: 47.79, lng: 22.88, bbox: [47.39, 22.26, 48.07, 23.46], cities: ["Satu Mare", "Carei", "Negrești-Oaș", "Tășnad"] },
  { code: "SJ", name: "Sălaj", lat: 47.19, lng: 23.06, bbox: [46.82, 22.46, 47.57, 23.65], cities: ["Zalău", "Șimleu Silvaniei", "Jibou"] },
  { code: "SB", name: "Sibiu", lat: 45.80, lng: 24.13, bbox: [45.36, 23.42, 46.28, 24.90], cities: ["Sibiu", "Mediaș", "Cisnădie", "Avrig", "Agnita"] },
  { code: "SV", name: "Suceava", lat: 47.66, lng: 26.27, bbox: [47.13, 25.29, 48.22, 26.93], cities: ["Suceava", "Fălticeni", "Rădăuți", "Câmpulung Moldovenesc", "Vatra Dornei"] },
  { code: "TR", name: "Teleorman", lat: 43.98, lng: 25.33, bbox: [43.54, 24.62, 44.44, 25.97], cities: ["Alexandria", "Roșiori de Vede", "Turnu Măgurele", "Zimnicea"] },
  { code: "TM", name: "Timiș", lat: 45.75, lng: 21.21, bbox: [45.13, 20.65, 46.33, 22.11], cities: ["Timișoara", "Lugoj", "Jimbolia", "Sânnicolau Mare"] },
  { code: "TL", name: "Tulcea", lat: 45.18, lng: 29.16, bbox: [44.77, 28.43, 45.71, 30.01], cities: ["Tulcea", "Babadag", "Măcin", "Sulina"] },
  { code: "VL", name: "Vâlcea", lat: 45.10, lng: 24.37, bbox: [44.62, 23.72, 45.55, 24.94], cities: ["Râmnicu Vâlcea", "Drăgășani", "Băile Olănești", "Călimănești"] },
  { code: "VS", name: "Vaslui", lat: 46.64, lng: 27.73, bbox: [46.16, 27.24, 47.13, 28.33], cities: ["Vaslui", "Bârlad", "Huși", "Negrești"] },
  { code: "VN", name: "Vrancea", lat: 45.70, lng: 27.19, bbox: [45.31, 26.58, 46.11, 27.71], cities: ["Focșani", "Adjud", "Mărășești", "Panciu"] },
  { code: "B", name: "București", lat: 44.43, lng: 26.10, bbox: [44.34, 25.95, 44.55, 26.29], cities: ["București", "Bucharest"] },
];

// Map city name → county code
const CITY_COUNTY_MAP: Record<string, string> = {};
COUNTIES.forEach(c => {
  c.cities.forEach(city => {
    CITY_COUNTY_MAP[city.toLowerCase()] = c.code;
    // Also strip diacritics for loose matching
    CITY_COUNTY_MAP[city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = c.code;
  });
});

export function cityToCountyCode(city: string): string | null {
  if (!city) return null;
  const k = city.toLowerCase();
  return CITY_COUNTY_MAP[k] ?? CITY_COUNTY_MAP[k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")] ?? null;
}

export function getCountyByCity(city: string): County | null {
  const code = cityToCountyCode(city);
  return code ? COUNTIES.find(c => c.code === code) ?? null : null;
}

export function getCountyByCoordinates(lat: number, lng: number): County | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const inside = COUNTIES.find((county) => {
    const [south, west, north, east] = county.bbox;
    return lat >= south && lat <= north && lng >= west && lng <= east;
  });
  if (inside) return inside;

  let nearest: County | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const county of COUNTIES) {
    const dLat = county.lat - lat;
    const dLng = county.lng - lng;
    const distance = (dLat * dLat) + (dLng * dLng);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = county;
    }
  }
  return nearest;
}

export function getCountyByCode(code: string): County | null {
  return COUNTIES.find(c => c.code === code) ?? null;
}

/**
 * Lightweight {code, name} list for dropdowns. Replaces the older
 * Moldova-only list (`MOLDOVA_COUNTIES_LIST`) which was leaking into
 * national-scope filters. Sorted alphabetically by Romanian name.
 */
export interface CountyEntry {
  code: string;
  name: string;
}

export const ROMANIA_COUNTIES: CountyEntry[] = COUNTIES
  .map(({ code, name }) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "ro"));

export function countyByCode(code: string | null | undefined): CountyEntry | undefined {
  if (!code) return undefined;
  return ROMANIA_COUNTIES.find((c) => c.code === code.toUpperCase());
}

export function countyName(code: string | null | undefined, fallback = ""): string {
  return countyByCode(code)?.name ?? fallback;
}

function normalizeCountyInput(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveCountyCode(value?: string | null): string | null {
  const normalized = normalizeCountyInput(value);
  if (!normalized) return null;

  const byCode = COUNTIES.find((county) => normalizeCountyInput(county.code) === normalized);
  if (byCode) return byCode.code;

  const byName = COUNTIES.find((county) => normalizeCountyInput(county.name) === normalized);
  if (byName) return byName.code;

  return cityToCountyCode(String(value ?? ""));
}

function toRadians(value: number): number {
  return value * (Math.PI / 180);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function getCountyDistanceKm(
  fromCode?: string | null,
  toCode?: string | null,
): number | null {
  const fromCounty = getCountyByCode(resolveCountyCode(fromCode) ?? "");
  const toCounty = getCountyByCode(resolveCountyCode(toCode) ?? "");
  if (!fromCounty || !toCounty) return null;
  return haversineKm(fromCounty.lat, fromCounty.lng, toCounty.lat, toCounty.lng);
}

export type CountyProximityTier = "same" | "metro" | "near" | "regional" | "far" | "unknown";

export function getCountyProximityTier(
  fromCode?: string | null,
  toCode?: string | null,
): CountyProximityTier {
  const from = resolveCountyCode(fromCode);
  const to = resolveCountyCode(toCode);
  if (!from || !to) return "unknown";
  if (from === to) return "same";

  // Bucuresti si Ilfov functioneaza ca o singura piata naturala pentru multe cazuri comerciale.
  if ((from === "B" && to === "IF") || (from === "IF" && to === "B")) return "metro";

  const distanceKm = getCountyDistanceKm(from, to);
  if (distanceKm == null) return "unknown";
  if (distanceKm <= 95) return "near";
  if (distanceKm <= 180) return "regional";
  return "far";
}
