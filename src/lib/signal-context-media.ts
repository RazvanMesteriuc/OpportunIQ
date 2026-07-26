export type SignalContextMediaInput = {
  key?: string | null;
  kind?: string | null;
  title?: string | null;
  industry?: string | null;
  feedType?: string | null;
  summary?: string | null;
  locality?: string | null;
  county?: string | null;
  relevanceReason?: string | null;
  decisionReason?: string[] | null;
  entityType?: string | null;
  source?: string | null;
};

const SIGNAL_CONTEXT_IMAGE_LIBRARY = {
  laser_tag: [
    "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
  ],
  horeca: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
  ],
  agriculture: [
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
  ],
  retail: [
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=900&q=80",
  ],
  fitness: [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
  ],
  medical: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1580281657527-47d8f67b4df2?auto=format&fit=crop&w=900&q=80",
  ],
  wellness: [
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
  ],
  construction: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80",
  ],
  logistics: [
    "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
  ],
  tech: [
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  ],
  industry: [
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80",
  ],
  tourism: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
  ],
} as const;

const TITLE_THEME_PATTERNS: Record<keyof typeof SIGNAL_CONTEXT_IMAGE_LIBRARY, RegExp[]> = {
  laser_tag: [
    /laser[\s-]?tag|arena laser|combat laser|team building laser/i,
  ],
  entertainment: [
    /arcade|gaming|divertisment|recreere|team building|escape room|bowling|biliard|petreceri|evenimente/i,
  ],
  horeca: [
    /horeca|restaurant|cafenea|cafea|bar|hotel|pensiune|catering|bistro|food/i,
  ],
  agriculture: [
    /agric|bio|eco|ferm|livad|sera|cultiv|lactate|miere|vin|crama|legum|fruct/i,
  ],
  retail: [
    /retail|magazin|shop|comer|ecommerce|vanzare/i,
  ],
  fitness: [
    /fitness|gym|sala fitness|sal[ăa] sport|pilates|yoga|crossfit|antrenament|personal trainer|studio reformer/i,
  ],
  medical: [
    /clinica|clinică|cabinet|medical|medicin|sanatate|sănătate|stomat|dent|ortodont|farmacie|imagistic|recuperare medicala/i,
  ],
  wellness: [
    /spa|beauty|wellness|masaj|terapie|salon|cosmetic|skincare|estetica|manichiura|pedichiura/i,
  ],
  construction: [
    /construct|imobil|renovar|amenaj|arhitect|instalat|hala|hala|birouri|teren/i,
  ],
  logistics: [
    /transport|logistic|depozit|curier|livrare|flota|microfulfillment|fulfillment/i,
  ],
  tech: [
    /tech|software|digital|ai\b|saas|aplica|platform|cloud|devops|automatizare/i,
  ],
  industry: [
    /produc|fabric|industrial|utilaj|manufactur|mobila|atelier/i,
  ],
  tourism: [
    /turism|travel|vacan|guesthouse|resort|outdoor|aventur|parapanta|delta/i,
  ],
};

const SECONDARY_THEME_PATTERNS: Partial<Record<keyof typeof SIGNAL_CONTEXT_IMAGE_LIBRARY, RegExp[]>> = {
  laser_tag: [/laser[\s-]?tag|arena laser/i],
  entertainment: [/arcade|gaming|escape room|bowling|petreceri|evenimente/i],
  agriculture: [/agricultura ecologica|ferma bio|legume bio|produse bio/i],
  tourism: [/hotel|pensiune turistica|resort/i],
  fitness: [/boutique fitness|studio pilates|sala fitness|antrenamente de grup|gym/i],
  medical: [/cabinet stomatologic|clinica dentara|clinica medicala|recuperare medicala|stomatologie/i],
  wellness: [/spa urban|salon beauty|wellness boutique|masaj terapeutic/i],
  logistics: [/depozit urban|hub logistic|microfulfillment/i],
  tech: [/software b2b|automatizare procese|platforma digitala|solutii saas/i],
};

function getStableHash(seed?: string | null) {
  const value = (seed || "opportuniq").toLowerCase();
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash) + value.charCodeAt(i);
  return Math.abs(hash);
}

function normalizeSemanticText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getThemeScore(haystack: string, patterns: RegExp[] | undefined, weight: number) {
  if (!haystack || !patterns || patterns.length === 0) return 0;
  return patterns.reduce((score, pattern) => score + (pattern.test(haystack) ? weight : 0), 0);
}

export function getSignalContextTheme(input: SignalContextMediaInput): keyof typeof SIGNAL_CONTEXT_IMAGE_LIBRARY | null {
  const titleHaystack = normalizeSemanticText(input.title);
  const industryHaystack = normalizeSemanticText(input.industry);
  const primaryHaystack = normalizeSemanticText(`${input.title ?? ""} ${input.industry ?? ""} ${input.feedType ?? ""}`);
  const secondaryHaystack = normalizeSemanticText(
    `${input.summary ?? ""} ${input.locality ?? ""} ${input.county ?? ""} ${input.relevanceReason ?? ""} ${(input.decisionReason ?? []).join(" ")} ${input.entityType ?? ""} ${input.source ?? ""}`,
  );
  let bestTheme: keyof typeof SIGNAL_CONTEXT_IMAGE_LIBRARY | null = null;
  let bestScore = 0;

  for (const theme of Object.keys(SIGNAL_CONTEXT_IMAGE_LIBRARY) as Array<keyof typeof SIGNAL_CONTEXT_IMAGE_LIBRARY>) {
    const score =
      getThemeScore(titleHaystack, TITLE_THEME_PATTERNS[theme], 6)
      + getThemeScore(industryHaystack, TITLE_THEME_PATTERNS[theme], 4)
      + getThemeScore(primaryHaystack, TITLE_THEME_PATTERNS[theme], 2)
      + getThemeScore(secondaryHaystack, SECONDARY_THEME_PATTERNS[theme], 1);

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  return bestScore > 0 ? bestTheme : null;
}

export function getSignalContextImage(input: SignalContextMediaInput) {
  const theme = getSignalContextTheme(input);
  if (!theme) return null;
  const pool = SIGNAL_CONTEXT_IMAGE_LIBRARY[theme];
  return pool[getStableHash(`${input.key ?? ""}-${input.kind ?? ""}-${theme}`) % pool.length];
}
