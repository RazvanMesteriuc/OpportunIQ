export const SITE_NAME = "OpportunIQ";
export const SITE_HOST = "https://opportuniq.ro";
export const SITE_TAGLINE = "Radar comercial local pentru Romania";
export const SITE_DEFAULT_DESCRIPTION =
  "OpportunIQ te ajuta sa vezi rapid ce se misca in piata ta locala, ce cereri exista acum si unde merita sa actionezi comercial in Romania.";
export const SITE_DEFAULT_OG_IMAGE = `${SITE_HOST}/opengraph-home-20260508.jpg`;
export const SITE_DEFAULT_OG_IMAGE_TYPE = "image/jpeg";
export const SITE_DEFAULT_OG_IMAGE_WIDTH = "1200";
export const SITE_DEFAULT_OG_IMAGE_HEIGHT = "630";
export const SITE_DEFAULT_OG_IMAGE_ALT =
  "Preview OpportunIQ cu harta Romaniei si Flux contextual de piata.";

function normalizeValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildAbsoluteUrl(path = "/"): string {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : SITE_HOST;
    return new URL(path, origin).toString();
  } catch {
    return new URL(path, SITE_HOST).toString();
  }
}

export const SITE_CONTACT = {
  phone: normalizeValue(import.meta.env.VITE_PUBLIC_PHONE),
  whatsapp: normalizeValue(import.meta.env.VITE_PUBLIC_WHATSAPP),
  email: normalizeValue(import.meta.env.VITE_PUBLIC_EMAIL),
  streetAddress: normalizeValue(import.meta.env.VITE_PUBLIC_STREET_ADDRESS),
  locality: normalizeValue(import.meta.env.VITE_PUBLIC_LOCALITY),
  county: normalizeValue(import.meta.env.VITE_PUBLIC_COUNTY),
  postalCode: normalizeValue(import.meta.env.VITE_PUBLIC_POSTAL_CODE),
  mapsUrl: normalizeValue(import.meta.env.VITE_PUBLIC_MAPS_URL),
  wazeUrl: normalizeValue(import.meta.env.VITE_PUBLIC_WAZE_URL),
  openingHours: normalizeValue(import.meta.env.VITE_PUBLIC_OPENING_HOURS),
};

export function hasLocalBusinessContact() {
  return Boolean(
    SITE_CONTACT.phone &&
      SITE_CONTACT.streetAddress &&
      SITE_CONTACT.locality &&
      SITE_CONTACT.county,
  );
}
