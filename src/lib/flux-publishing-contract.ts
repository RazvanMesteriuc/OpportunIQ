export type PublishingLocale = "ro" | "en";

export type FluxPublishingZone = "request" | "change" | null;

export type CompanyArticlePublishingType =
  | "colaborare"
  | "anunt"
  | "oferta"
  | "stire"
  | "studiu-caz";

export type LocalPostPublishingType =
  | "opportunity"
  | "question"
  | "supplier_request"
  | "collaboration";

type PublishingSurface = "company_article" | "local_post";

export type PublishingRule<TType extends string> = {
  type: TType;
  surface: PublishingSurface;
  label: { ro: string; en: string };
  shortLabel: { ro: string; en: string };
  helper: { ro: string; en: string };
  destination: { ro: string; en: string };
  nextAction: { ro: string; en: string };
  fluxZone: FluxPublishingZone;
  qualificationEligible: boolean;
};

export const COMPANY_ARTICLE_PUBLISHING_RULES: Record<CompanyArticlePublishingType, PublishingRule<CompanyArticlePublishingType>> = {
  colaborare: {
    type: "colaborare",
    surface: "company_article",
    label: { ro: "Cerere comerciala a firmei", en: "Company commercial request" },
    shortLabel: { ro: "Cerere firma", en: "Company request" },
    helper: {
      ro: "Cerere comerciala explicita publicata de o firma.",
      en: "Explicit commercial request published by a company.",
    },
    destination: {
      ro: "Apare in Flux la Cerere activa si in piata de articole.",
      en: "Appears in Flux under Active Request and in the article marketplace.",
    },
    nextAction: {
      ro: "Raspunsul corect este unul comercial direct: contactezi, livrezi sau propui executia.",
      en: "The correct next step is a direct commercial response: contact, deliver, or propose execution.",
    },
    fluxZone: "request",
    qualificationEligible: false,
  },
  anunt: {
    type: "anunt",
    surface: "company_article",
    label: { ro: "Anunt de firma", en: "Company announcement" },
    shortLabel: { ro: "Anunt", en: "Announcement" },
    helper: {
      ro: "Actualizare comerciala sau operationala a firmei.",
      en: "Commercial or operational update from the company.",
    },
    destination: {
      ro: "Ramane in piata de articole si in profilul firmei; nu devine automat semnal de piata.",
      en: "Stays in the article marketplace and company profile; it does not become a market signal automatically.",
    },
    nextAction: {
      ro: "Il folosesti ca context de piata sau dovada despre firma, nu ca semnal de calificat.",
      en: "Use it as market context or company proof, not as a signal to qualify.",
    },
    fluxZone: null,
    qualificationEligible: false,
  },
  oferta: {
    type: "oferta",
    surface: "company_article",
    label: { ro: "Oferta comerciala", en: "Commercial offer" },
    shortLabel: { ro: "Oferta", en: "Offer" },
    helper: {
      ro: "Oferta sau pachet comercial prezentat public de firma.",
      en: "Commercial offer or package presented publicly by the company.",
    },
    destination: {
      ro: "Ramane context comercial in piata de articole; nu intra automat in Schimbare sau calificare.",
      en: "Stays as commercial context in the article marketplace; it does not automatically enter Change or qualification.",
    },
    nextAction: {
      ro: "Il folosesti pentru context comercial sau comparatie de oferta, nu pentru calificarea unui semnal.",
      en: "Use it for commercial context or offer comparison, not for signal qualification.",
    },
    fluxZone: null,
    qualificationEligible: false,
  },
  stire: {
    type: "stire",
    surface: "company_article",
    label: { ro: "Stire de firma", en: "Company news" },
    shortLabel: { ro: "Stire", en: "News" },
    helper: {
      ro: "Noutate despre companie, echipa, lansare sau miscare publica.",
      en: "News about the company, team, launch, or public move.",
    },
    destination: {
      ro: "Ramane articol de context; nu este tratata implicit ca semnal de piata.",
      en: "Stays as contextual content; it is not treated as a market signal by default.",
    },
    nextAction: {
      ro: "O urmaresti ca miscare de companie sau context public, nu ca shortlist comercial.",
      en: "Track it as company movement or public context, not as a commercial shortlist item.",
    },
    fluxZone: null,
    qualificationEligible: false,
  },
  "studiu-caz": {
    type: "studiu-caz",
    surface: "company_article",
    label: { ro: "Studiu de caz", en: "Case study" },
    shortLabel: { ro: "Studiu caz", en: "Case study" },
    helper: {
      ro: "Dovada de executie sau rezultat comercial al firmei.",
      en: "Execution proof or commercial outcome from the company.",
    },
    destination: {
      ro: "Ramane in piata de articole si in profilul firmei ca dovada, nu ca semnal nou.",
      en: "Stays in the article marketplace and company profile as proof, not as a new signal.",
    },
    nextAction: {
      ro: "Il folosesti ca dovada de executie si incredere, nu ca radar de piata nou.",
      en: "Use it as execution proof and trust signal, not as a new market radar item.",
    },
    fluxZone: null,
    qualificationEligible: false,
  },
};

export const LOCAL_POST_PUBLISHING_RULES: Record<LocalPostPublishingType, PublishingRule<LocalPostPublishingType>> = {
  opportunity: {
    type: "opportunity",
    surface: "local_post",
    label: { ro: "Observatie de piata", en: "Market observation" },
    shortLabel: { ro: "Observatie", en: "Observation" },
    helper: {
      ro: "Observatie locala despre lipsa, gap sau miscare de piata.",
      en: "Local observation about a gap, shortage, or market movement.",
    },
    destination: {
      ro: "Apare in Flux la Schimbare si poate ajunge ulterior in calificare daca aduna dovada suficienta.",
      en: "Appears in Flux under Change and can later enter qualification if it gathers enough proof.",
    },
    nextAction: {
      ro: "O verifici, ii aduni context si validezi daca merita sa urce spre calificare.",
      en: "Review it, add context, and validate whether it deserves to move toward qualification.",
    },
    fluxZone: "change",
    qualificationEligible: true,
  },
  question: {
    type: "question",
    surface: "local_post",
    label: { ro: "Intrebare locala", en: "Local question" },
    shortLabel: { ro: "Intrebare", en: "Question" },
    helper: {
      ro: "Intrebare despre o zona, o nevoie sau o miscare de piata care cere clarificare.",
      en: "Question about an area, need, or market movement that needs clarification.",
    },
    destination: {
      ro: "Apare in Flux la Schimbare pana cand primeste context sau validare suficienta.",
      en: "Appears in Flux under Change until it gains enough context or validation.",
    },
    nextAction: {
      ro: "O folosesti pentru clarificare de piata si validare, nu pentru raspuns comercial imediat.",
      en: "Use it for market clarification and validation, not for an immediate commercial response.",
    },
    fluxZone: "change",
    qualificationEligible: true,
  },
  supplier_request: {
    type: "supplier_request",
    surface: "local_post",
    label: { ro: "Cerere de furnizor", en: "Supplier request" },
    shortLabel: { ro: "Cerere furnizor", en: "Supplier request" },
    helper: {
      ro: "Nevoie explicita pentru furnizori, prestatori sau executie.",
      en: "Explicit need for suppliers, service providers, or execution.",
    },
    destination: {
      ro: "Apare in Flux la Cerere activa si poate primi raspuns direct din piata.",
      en: "Appears in Flux under Active Request and can receive direct responses from the market.",
    },
    nextAction: {
      ro: "Raspunzi doar daca poti furniza, executa sau conecta rapid partenerul potrivit.",
      en: "Answer only if you can supply, execute, or quickly connect the right partner.",
    },
    fluxZone: "request",
    qualificationEligible: false,
  },
  collaboration: {
    type: "collaboration",
    surface: "local_post",
    label: { ro: "Caut partener local", en: "Looking for a local partner" },
    shortLabel: { ro: "Partener local", en: "Local partner" },
    helper: {
      ro: "Cerere locala pentru parteneriat, distributie sau executie comuna din piata.",
      en: "Local request for partnership, distribution, or shared execution from the market.",
    },
    destination: {
      ro: "Apare in Flux la Cerere activa si cere raspuns comercial direct.",
      en: "Appears in Flux under Active Request and calls for a direct commercial response.",
    },
    nextAction: {
      ro: "Raspunzi direct sau intri in discutie daca poti sustine colaborarea.",
      en: "Respond directly or join the conversation if you can support the collaboration.",
    },
    fluxZone: "request",
    qualificationEligible: false,
  },
};

export function getCompanyArticlePublishingRule(value?: string | null) {
  const key = String(value ?? "").trim().toLowerCase() as CompanyArticlePublishingType;
  return COMPANY_ARTICLE_PUBLISHING_RULES[key] ?? COMPANY_ARTICLE_PUBLISHING_RULES.anunt;
}

export function getLocalPostPublishingRule(value?: string | null) {
  const key = String(value ?? "").trim().toLowerCase() as LocalPostPublishingType;
  return LOCAL_POST_PUBLISHING_RULES[key] ?? LOCAL_POST_PUBLISHING_RULES.opportunity;
}

export function getFluxZoneLabel(zone: FluxPublishingZone, locale: PublishingLocale) {
  if (zone === "request") return locale === "en" ? "Active Request" : "Cerere activa";
  if (zone === "change") return locale === "en" ? "Change" : "Schimbare";
  return locale === "en" ? "Article Marketplace" : "Piata de articole";
}
