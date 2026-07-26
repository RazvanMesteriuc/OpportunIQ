function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function shortenAtWord(value: string, maxLength: number) {
  const text = normalizeWhitespace(value);
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength + 1);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace <= 12) return `${text.slice(0, maxLength).trim()}...`;
  return `${slice.slice(0, lastSpace).trim()}...`;
}

function stripTechnicalNoise(value?: string | null) {
  if (!value) return "";
  let text = normalizeWhitespace(String(value));
  text = text.replace(/^semnal de pia[țt]a pentru\s*/i, "");
  text = text.replace(/^market signal for\s*/i, "");
  text = text.replace(/^gap principal:\s*/i, "");
  text = text.replace(/^semnal de cerere:\s*/i, "");
  text = text.replace(/^context local:\s*/i, "");
  text = text.replace(/^oferta actuala:\s*/i, "");
  text = text.replace(/^ce poate bloca semnalul:\s*/i, "");
  text = text.replace(/\s*[(-]\s*\d+\s+recenzii?.*$/i, "");
  text = text.replace(/\s*[(-]\s*\d+\s+reviews?.*$/i, "");
  text = text.replace(/\s+[—-]\s+apare\s+in\s+.*$/i, "");
  text = text.replace(/\s+[—-]\s+appears\s+in\s+.*$/i, "");
  text = text.replace(/[.:\-–—\s]+$/, "");
  return normalizeWhitespace(text);
}

function toSentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowerFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function stripTrailingEllipsis(value: string) {
  return value.replace(/\s*(?:\.{3}|…)\s*$/, "").trim();
}

function cleanupLeadText(value?: string | null) {
  const text = stripTrailingEllipsis(stripTechnicalNoise(value));
  return normalizeWhitespace(text.replace(/^[\s:;,\-–—]+/, "").replace(/[.:\-–—\s]+$/, ""));
}

function removeLeadingPhrase(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match ? source.slice(match[0].length).trim() : "";
}

function looksLikeBareNeedPhrase(value: string) {
  const text = cleanupLeadText(value);
  if (!text) return false;
  if (/[.!?]/.test(text)) return false;
  const lowered = text.toLowerCase();
  if (/^(?:tema|tema dominanta|tema dominantă|problema|frictiune|fricțiune|context|oferta|pia[țt]a|schimbare|trend|semnal)\b/.test(lowered)) {
    return false;
  }
  if (/\b(?:este|sunt|exista|există|lipsesc|lipse[șs]te|cer|vrea|vor|poate|pot|pare|par|indica|indică|arat[ăa]|se|nu)\b/.test(lowered)) {
    return false;
  }
  const words = text.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 6;
}

function looksTruncated(value: string) {
  const text = normalizeWhitespace(value);
  return /(?:\.{3}|…)\s*$/.test(text) || /\/\s*(?:\.{3}|…)\s*$/.test(text);
}

function finalizeSentence(value: string) {
  const text = stripTrailingEllipsis(value).replace(/[.:\-–—\s]+$/, "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function rewriteRomanianLead(value: string) {
  const text = cleanupLeadText(value);
  if (!text) return "";
  const lowered = text.toLowerCase();

  if (lowered.startsWith("clientii cer ")) {
    return `Cerere pentru ${text.slice("clientii cer ".length)}`;
  }
  if (lowered.startsWith("clienții cer ")) {
    return `Cerere pentru ${text.slice("clienții cer ".length)}`;
  }
  if (lowered.startsWith("cerere pentru ")) {
    return `Cerere pentru ${removeLeadingPhrase(text, /^cerere pentru\s*/i)}`;
  }
  if (lowered.startsWith("cerere de ")) {
    return `Cerere pentru ${removeLeadingPhrase(text, /^cerere de\s*/i)}`;
  }
  if (lowered.startsWith("nevoie de ")) {
    return `Cerere pentru ${removeLeadingPhrase(text, /^nevoie de\s*/i)}`;
  }
  if (lowered.startsWith("se cauta ")) {
    return `Cerere pentru ${removeLeadingPhrase(text, /^se cauta\s*/i)}`;
  }
  if (lowered.startsWith("se caută ")) {
    return `Cerere pentru ${removeLeadingPhrase(text, /^se caută\s*/i)}`;
  }
  if (lowered.startsWith("lipsesc ")) {
    return `Lipsesc ${removeLeadingPhrase(text, /^lipsesc\s*/i)}`;
  }
  if (lowered.startsWith("lipsește ") || lowered.startsWith("lipseste ")) {
    return `Lipseste ${removeLeadingPhrase(text, /^lipse(?:ș|s)te\s*/i)}`;
  }
  if (lowered.startsWith("nu exista ") || lowered.startsWith("nu există ")) {
    return `Lipseste ${removeLeadingPhrase(text, /^nu exist(?:a|ă)\s*/i)}`;
  }
  if (lowered.startsWith("prea putine ")) {
    return `Prea putine ${removeLeadingPhrase(text, /^prea putine\s*/i)}`;
  }
  if (lowered.startsWith("servire ")) {
    return `Probleme de executie: ${text}`;
  }
  if (looksLikeBareNeedPhrase(text)) {
    return `Cerere pentru ${text}`;
  }
  return text;
}

function rewriteEnglishLead(value: string) {
  const text = cleanupLeadText(value);
  if (!text) return "";
  const lowered = text.toLowerCase();

  if (lowered.startsWith("clients ask for ")) {
    return `Demand for ${text.slice("clients ask for ".length)}`;
  }
  if (lowered.startsWith("customers ask for ")) {
    return `Demand for ${text.slice("customers ask for ".length)}`;
  }
  if (lowered.startsWith("demand for ")) {
    return `Demand for ${removeLeadingPhrase(text, /^demand for\s*/i)}`;
  }
  if (lowered.startsWith("need for ")) {
    return `Demand for ${removeLeadingPhrase(text, /^need for\s*/i)}`;
  }
  if (lowered.startsWith("looking for ")) {
    return `Demand for ${removeLeadingPhrase(text, /^looking for\s*/i)}`;
  }
  if (lowered.startsWith("lack of ")) {
    return `Lack of ${removeLeadingPhrase(text, /^lack of\s*/i)}`;
  }
  if (lowered.startsWith("slow service")) {
    return `Execution issues: ${text}`;
  }
  if (looksLikeBareNeedPhrase(text)) {
    return `Demand for ${lowerFirst(text)}`;
  }
  return text;
}

function rewriteRomanianDecisionTheme(value: string) {
  const text = stripTechnicalNoise(value);
  if (!text) return "";
  const lowered = text.toLowerCase();

  if (lowered.startsWith("clientii cer ")) {
    return `Cerere pentru ${text.slice("clientii cer ".length)}`;
  }
  if (lowered.startsWith("clienții cer ")) {
    return `Cerere pentru ${text.slice("clienții cer ".length)}`;
  }
  if (lowered.startsWith("rezervarea online")) {
    return lowered.includes("lips") ? toSentenceCase(text) : "Cerere pentru rezervare online";
  }
  if (lowered.startsWith("servire ")) {
    return "Servire slaba la actorii existenti";
  }
  if (lowered.startsWith("personal nepoliticos") || lowered.startsWith("personal arogant")) {
    return "Interactiune slaba cu clientii la actorii existenti";
  }
  if (lowered.startsWith("personal ")) {
    return "Probleme de personal la actorii existenti";
  }
  if (lowered.startsWith("lipsesc ") || lowered.startsWith("lipsește ")) {
    return toSentenceCase(text);
  }
  return toSentenceCase(text);
}

function rewriteEnglishDecisionTheme(value: string) {
  const text = stripTechnicalNoise(value);
  if (!text) return "";
  const lowered = text.toLowerCase();

  if (lowered.startsWith("clients ask for ")) {
    return `Demand for ${text.slice("clients ask for ".length)}`;
  }
  if (lowered.startsWith("customers ask for ")) {
    return `Demand for ${text.slice("customers ask for ".length)}`;
  }
  if (lowered.startsWith("online booking")) {
    return lowered.includes("lack") ? toSentenceCase(text) : "Demand for online booking";
  }
  if (lowered.startsWith("slow service")) {
    return "Weak execution at existing players";
  }
  if (lowered.startsWith("rude staff")) {
    return "Weak customer interaction at existing players";
  }
  if (lowered.startsWith("lack of ")) {
    return toSentenceCase(text);
  }
  return toSentenceCase(text);
}

function buildSignalLocationLabel(args: {
  locale: string;
  niche?: string | null;
  city?: string | null;
}) {
  const niche = stripTechnicalNoise(args.niche);
  const city = stripTechnicalNoise(args.city);
  if (niche && city) {
    return args.locale === "en" ? `in ${niche} in ${city}` : `in ${niche} din ${city}`;
  }
  if (niche) return args.locale === "en" ? `in ${niche}` : `in ${niche}`;
  if (city) return args.locale === "en" ? `in ${city}` : `in ${city}`;
  return "";
}

function normalizeComparableText(value?: string | null) {
  return normalizeWhitespace(String(value ?? ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function leadAlreadyContainsLocation(lead: string, niche?: string | null, city?: string | null) {
  const normalizedLead = normalizeComparableText(lead);
  const normalizedNiche = normalizeComparableText(niche);
  const normalizedCity = normalizeComparableText(city);
  if (!normalizedLead) return false;
  if (normalizedNiche && normalizedLead.includes(normalizedNiche)) return true;
  if (normalizedCity && normalizedLead.includes(normalizedCity)) return true;
  return false;
}

export function buildActionableSignalTheme(args: {
  locale: string;
  rawTheme?: string | null;
}) {
  const source = stripTechnicalNoise(args.rawTheme);
  if (!source) return "";
  return args.locale === "en"
    ? rewriteEnglishDecisionTheme(source)
    : rewriteRomanianDecisionTheme(source);
}

export function buildReadableSignalTitle(args: {
  locale: string;
  niche?: string | null;
  city?: string | null;
  preferredLead?: string | null;
  mainGap?: string | null;
  shortSummary?: string | null;
  fallbackTitle?: string | null;
}) {
  const isEn = args.locale === "en";
  const leadSource =
    cleanupLeadText(args.preferredLead) ||
    stripTechnicalNoise(args.mainGap) ||
    stripTechnicalNoise(args.shortSummary) ||
    stripTechnicalNoise(args.fallbackTitle);
  const lead = isEn ? rewriteEnglishLead(leadSource) : rewriteRomanianLead(leadSource);
  const location = buildSignalLocationLabel(args);
  if (lead) {
    return location && !leadAlreadyContainsLocation(lead, args.niche, args.city)
      ? `${toSentenceCase(shortenAtWord(lead, 52))} ${location}`
      : toSentenceCase(shortenAtWord(lead, 58));
  }
  if (location) return toSentenceCase(location);
  return shortenAtWord(stripTechnicalNoise(args.fallbackTitle), 58) || (isEn ? "Market signal" : "Semnal de piata");
}

export function buildReadableSignalFocus(args: {
  locale: string;
  niche?: string | null;
  city?: string | null;
  mainGap?: string | null;
  detailedGap?: string | null;
  shortSummary?: string | null;
  fallbackTitle?: string | null;
}) {
  const isEn = args.locale === "en";
  const niche = stripTechnicalNoise(args.niche);
  const city = stripTechnicalNoise(args.city);
  const candidates = [
    args.mainGap,
    args.detailedGap,
    args.shortSummary,
    args.fallbackTitle,
  ]
    .map((value) => stripTechnicalNoise(value))
    .filter(Boolean);
  const preferredSource =
    candidates.find((value) => !looksTruncated(value)) || candidates[0] || "";
  const fallbackSource =
    stripTrailingEllipsis(preferredSource).split(/(?:\.{3}|…)/)[0]?.trim() || "";
  const lead = finalizeSentence(toSentenceCase(fallbackSource));

  if (!lead) return "";
  if (niche && city) {
    if (isEn) {
      return `In ${niche} in ${city}, ${lowerFirst(lead)}`;
    }
    return `In ${niche} din ${city}, ${lowerFirst(lead)}`;
  }
  return lead;
}
