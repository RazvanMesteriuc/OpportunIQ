import type { Locale } from "@/lib/locale";

const REPORT_TYPE_LABELS: Record<string, { ro: string; en: string }> = {
  business: { ro: "Afaceri", en: "Business" },
  real_estate: { ro: "Imobiliare", en: "Real Estate" },
  competition: { ro: "Competitie", en: "Competition" },
  prices: { ro: "Preturi", en: "Pricing" },
  trends: { ro: "Trenduri", en: "Trends" },
};

const SIGNAL_VERDICT_LABELS: Record<string, { ro: string; en: string }> = {
  "Merita urmarit": { ro: "Merita urmarit", en: "Worth watching" },
  "Merita validat": { ro: "Merita validat", en: "Needs validation" },
  "Semnal slab": { ro: "Semnal slab", en: "Weak signal" },
  "Semnal in curs": { ro: "Semnal in curs", en: "Signal in progress" },
  "Atentie sporita": { ro: "Atentie sporita", en: "Elevated caution" },
};

const SIGNAL_CLASS_LABELS: Record<string, { ro: string; en: string }> = {
  "Semnal preliminar": { ro: "Semnal preliminar", en: "Preliminary signal" },
  "Semnal validat": { ro: "Semnal validat", en: "Validated signal" },
  "Semnal puternic": { ro: "Semnal puternic", en: "Strong signal" },
};

const EVIDENCE_TIER_LABELS: Record<string, { ro: string; en: string }> = {
  slab: { ro: "slab", en: "low" },
  mediu: { ro: "mediu", en: "medium" },
  solid: { ro: "solid", en: "solid" },
};

const FINANCIAL_COMPLETENESS_LABELS: Record<string, { ro: string; en: string }> = {
  lipsa: { ro: "lipsa", en: "missing" },
  partiala: { ro: "partiala", en: "partial" },
  completa: { ro: "completa", en: "complete" },
};

const FRESHNESS_LABELS: Record<string, { ro: string; en: string }> = {
  proaspat: { ro: "proaspat", en: "fresh" },
  "in curs de invechire": { ro: "in curs de invechire", en: "aging" },
  invechit: { ro: "invechit", en: "stale" },
  lipsa: { ro: "lipsa", en: "missing" },
};

const OPPORTUNITY_STATE_LABELS: Record<string, { ro: string; en: string }> = {
  triggered: { ro: "Declanșat", en: "Triggered" },
  watch: { ro: "Urmărire", en: "Watch" },
  quiet: { ro: "Liniștit", en: "Quiet" },
};

const POSITIONING_LABELS: Record<string, { ro: string; en: string }> = {
  premium: { ro: "premium", en: "premium" },
  mid: { ro: "mediu", en: "mid-market" },
  low: { ro: "buget", en: "budget" },
  diferentiator: { ro: "diferențiator", en: "differentiator" },
};

const NON_TRANSLATABLE_KEY_PARTS = [
  "url",
  "href",
  "slug",
  "path",
  "email",
  "phone",
  "engine",
  "session",
  "visitor",
  "token",
  "canonical",
];

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/Ș/g, "S")
    .replace(/Ț/g, "T")
    .trim();
}

function localizeFromTable(
  table: Record<string, { ro: string; en: string }>,
  value: string | null | undefined,
  locale: Locale,
) {
  if (!value) return value ?? "";
  const normalized = normalizeKey(value);
  const directMatch = table[normalized];
  if (directMatch) return directMatch[locale];
  const fallbackEntry = Object.entries(table).find(([key]) => normalizeKey(key) === normalized);
  return fallbackEntry?.[1]?.[locale] ?? value;
}

const EN_SIGNAL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/HoReCa în/gi, "HoReCa in"],
  [/ în /g, " in "],
  [/ și /g, " and "],
  [/Semnal de pia(?:ta|ță) pentru\s+([^\.]+)\./gi, "Market signal for $1."],
  [/Semnal de pia(?:ta|ță) pentru/gi, "Market signal for"],
  [/Semnal de piata pentru/gi, "Market signal for"],
  [/Semnal generat automat/gi, "Auto-generated market signal"],
  [/Vezi acest raport pentru ca/gi, "You see this report because"],
  [/Vezi acest raport pentru că/gi, "You see this report because"],
  [/solicită/gi, "request"],
  [/solicita/gi, "request"],
  [/diversificat/gi, "diverse"],
  [/meniu vegetarian/gi, "vegetarian menu"],
  [/clien(?:ții|tii) solicit[aă] un meniu vegetarian diversificat/gi, "customers ask for a more diverse vegetarian menu"],
  [/\((\d+)\s*recenzii,\s*(\d+)\s*competitori\)/gi, "($1 reviews, $2 competitors)"],
  [/Scor oportunitate/gi, "Opportunity score"],
  [/(\d+)\s*recenzii publice agregate din (\d+)\s*surse\./gi, "$1 public reviews aggregated from $2 sources."],
  [/(\d+)\s*semnale de cerere și (\d+)\s*semnale de fricțiune au fost detectate\./gi, "$1 demand signals and $2 friction signals were detected."],
  [/(\d+)\s*semnale de cerere si (\d+)\s*semnale de frictiune au fost detectate\./gi, "$1 demand signals and $2 friction signals were detected."],
  [/Whitespace\s*(\d+)\/100\s*pe ni(?:ș|s)a\s+([^\.]+)\./gi, "Whitespace $1/100 for the $2 niche."],
  [/Problema recurent[ăa]: servire lent[ăa] în perioade aglomerate\./gi, "Recurring issue: slow service during busy periods."],
  [/Încrederea este medie: semnalul există, dar are nevoie de confirmare suplimentară din teren sau din surse locale complementare\./gi, "Confidence is moderate: the signal exists, but it still needs additional confirmation from the field or complementary local sources."],
  [/Increderea este medie: semnalul exista, dar are nevoie de confirmare suplimentara din teren sau din surse locale complementare\./gi, "Confidence is moderate: the signal exists, but it still needs additional confirmation from the field or complementary local sources."],
  [/cu prioritate AI/gi, "with AI priority"],
  [/recenzii publice agregate din/gi, "public reviews aggregated from"],
  [/Semnalul se bazeaza mai mult pe context de piata decat pe volum public solid\./gi, "The signal relies more on market context than on solid public volume."],
  [/semnale de cerere si/gi, "demand signals and"],
  [/semnale de cerere și/gi, "demand signals and"],
  [/semnale de cerere/gi, "demand signals"],
  [/semnale de frictiune/gi, "friction signals"],
  [/semnale de fricțiune/gi, "friction signals"],
  [/semnale de frictiune au fost detectate\./gi, "friction signals were detected."],
  [/semnale de fricțiune au fost detectate\./gi, "friction signals were detected."],
  [/Problema recurenta:/gi, "Recurring issue:"],
  [/Unghi de diferentiere sugerat:/gi, "Suggested differentiator:"],
  [/Asteptam acumularea mai multor recenzii publice pentru NLP\./gi, "We are waiting for more public reviews to accumulate for NLP analysis."],
  [/Analiza asteapta diversificarea surselor\./gi, "The analysis is waiting for more source diversity."],
  [/Increderea surselor cere validare manuala\./gi, "Source confidence requires manual validation."],
  [/Golul de piata detectat este limitat\./gi, "The detected market gap is limited."],
  [/Plangerile domina cererea explicita; atentie la probleme structurale\./gi, "Complaints outweigh explicit demand; watch for structural issues."],
  [/Datele sunt invechite si trebuie reimprospatate inainte de decizie\./gi, "The data is stale and should be refreshed before making a decision."],
  [/Increderea este ridicata/gi, "Confidence is high"],
  [/Increderea este medie/gi, "Confidence is moderate"],
  [/Increderea este scazuta/gi, "Confidence is low"],
  [/Increderea este ridicată/gi, "Confidence is high"],
  [/Increderea este medie/gi, "Confidence is moderate"],
  [/Increderea este scăzută/gi, "Confidence is low"],
  [/semnalul exista, dar/gi, "the signal exists, but"],
  [/semnalul există, dar/gi, "the signal exists, but"],
  [/are nevoie de confirmare suplimentara din teren sau din surse locale complementare\./gi, "it still needs additional confirmation from the field or complementary local sources."],
  [/are nevoie de confirmare suplimentară din teren sau din surse locale complementare\./gi, "it still needs additional confirmation from the field or complementary local sources."],
  [/Date locale actualizate/gi, "Updated local data"],
  [/Pulse semnal/gi, "Signal pulse"],
  [/De ce conteaza acum/gi, "Why this matters now"],
  [/De ce contează acum/gi, "Why this matters now"],
  [/din cauza acoperirii limitate a surselor, a volumului redus sau a prospetimii insuficiente a datelor\./gi, "because source coverage is limited, volume is low or the data is not fresh enough."],
  [/deoarece semnalul combina/gi, "because the signal combines"],
  [/deoarece semnalul combină/gi, "because the signal combines"],
  [/surse si date/gi, "sources and"],
  [/surse și date/gi, "sources and data"],
  [/Bun pentru shortlist serios, apeluri comerciale si validare rapida in teren\./gi, "Good for serious shortlists, commercial outreach and fast field validation."],
  [/Bun pentru prioritizare si mini-teste de piata, dar nu pentru angajamente financiare ferme\./gi, "Good for prioritization and small market tests, but not for firm financial commitments."],
  [/Bun pentru prioritizare si mini-teste de pia(?:ta|ță), dar nu pentru angajamente financiare ferme\./gi, "Good for prioritization and small market tests, but not for firm financial commitments."],
  [/Bun ca radar de piata si ipoteza de explorare, nu ca recomandare puternica\./gi, "Useful as a market radar and exploration hypothesis, not as a strong recommendation."],
  [/Bun ca radar de pia(?:ta|ță) si ipoteză? de explorare, nu ca recomandare puternică?\./gi, "Useful as a market radar and exploration hypothesis, not as a strong recommendation."],
  [/actualizat complet/gi, "fully refreshed"],
  [/reimprospatat doar pe sentiment web/gi, "refreshed only on web sentiment"],
  [/reimprospatat pe sentiment/gi, "refreshed on sentiment"],
  [/reimprospatat pe sentiment/gi, "refreshed on sentiment"],
  [/reîmprospătat doar pe sentiment web/gi, "refreshed only on web sentiment"],
  [/reîmprospătat pe sentiment/gi, "refreshed on sentiment"],
  [/fara interactiune/gi, "without interaction"],
  [/fără interacțiune/gi, "without interaction"],
  [/\bîn\b/gi, "in"],
  [/\bși\b/gi, "and"],
  [/servicii IT/gi, "IT services"],
  [/servicii IT in/gi, "IT services in"],
  [/servicii IT în/gi, "IT services in"],
  [/clinica stomatologica/gi, "dental clinic"],
  [/clinică stomatologică/gi, "dental clinic"],
  [/clinica stomatologică/gi, "dental clinic"],
  [/clinica stomatologica in/gi, "dental clinic in"],
  [/clinică stomatologică în/gi, "dental clinic in"],
  [/clinica stomatologică în/gi, "dental clinic in"],
  [/mai multe optiuni de tratament pentru copii/gi, "more treatment options for children"],
  [/mai multe opțiuni de tratament pentru copii/gi, "more treatment options for children"],
  [/o optiune vegetariana/gi, "a vegetarian option"],
  [/o opțiune vegetariană/gi, "a vegetarian option"],
  [/servire lenta in perioade aglomerate/gi, "slow service during busy periods"],
  [/servire lentă în perioade aglomerate/gi, "slow service during busy periods"],
  [/lipsa de/gi, "lack of"],
  [/semnalul exista/gi, "the signal exists"],
  [/semnalul există/gi, "the signal exists"],
  [/competitori/gi, "competitors"],
  [/pe ni(?:ș|s)a/gi, "for the"],
  [/combină/gi, "combines"],
  [/combina/gi, "combines"],
  [/scor/gi, "score"],
  [/solicită/gi, "request"],
  [/analizate/gi, "analysed"],
  [/mediu/gi, "medium"],
  [/semnal proaspat/gi, "fresh signal"],
  [/semnal proaspăt/gi, "fresh signal"],
  [/semnal proaspat/gi, "fresh signal"],
  [/in curs de invechire/gi, "aging"],
  [/în curs de învechire/gi, "aging"],
  [/clien(?:tii|tii) cer/gi, "customers ask for"],
  [/clien(?:ții|tii) cer/gi, "customers ask for"],
  [/rezervare online/gi, "online booking"],
  [/mai multe optiuni vegetariene/gi, "more vegetarian options"],
  [/mai multe opțiuni vegetariene/gi, "more vegetarian options"],
  [/incredere in date/gi, "data confidence"],
  [/încredere în date/gi, "data confidence"],
  [/incredere este medie/gi, "trust is moderate"],
  [/încredere este medie/gi, "trust is moderate"],
  [/incredere/gi, "trust"],
  [/încredere/gi, "trust"],
  [/Vezi acest raport pentru că/gi, "You see this report because"],
  [/prioritate AI/gi, "AI priority"],
  [/apare in/gi, "appears in"],
  [/apare în/gi, "appears in"],
  [/\bConservator\b/gi, "Conservative"],
  [/\bBază\b/gi, "Base"],
  [/\bBaza\b/gi, "Base"],
  [/\bAgresiv\b/gi, "Aggressive"],
  [/\bCerere\b/gi, "Demand"],
  [/Cerere explicită/gi, "Explicit demand"],
  [/Cerere explicita/gi, "Explicit demand"],
  [/Cerere implicită/gi, "Implicit demand"],
  [/Cerere implicita/gi, "Implicit demand"],
  [/Insatisfacție clienți/gi, "Customer dissatisfaction"],
  [/Insatisfactie clienti/gi, "Customer dissatisfaction"],
  [/Probleme nerezolvate/gi, "Unresolved problems"],
  [/Volum recenzii/gi, "Review volume"],
  [/Competiție scăzută/gi, "Low competition"],
  [/Competitie scazuta/gi, "Low competition"],
  [/Trend favorabil/gi, "Favourable trend"],
  [/Potențial scalare/gi, "Scalability potential"],
  [/Potential scalare/gi, "Scalability potential"],
  [/\bCompetiție\b/gi, "Competition"],
  [/\bCompetitie\b/gi, "Competition"],
  [/\bInvestiție\b/gi, "Investment"],
  [/\bInvestitie\b/gi, "Investment"],
  [/\bRisc\b/gi, "Risk"],
  [/\bPotențial\b/gi, "Potential"],
  [/\bPotential\b/gi, "Potential"],
  [/Goluri in piata/gi, "Market gaps"],
  [/Goluri în piață/gi, "Market gaps"],
  [/Scoruri detaliate/gi, "Detailed scores"],
  [/Scenarii financiare/gi, "Financial scenarios"],
  [/Plan operațional/gi, "Operational plan"],
  [/Plan operational/gi, "Operational plan"],
  [/Plan de Afaceri AI/gi, "AI business plan"],
  [/Analiza AI Avansata/gi, "Advanced AI analysis"],
  [/Analiză AI Avansată/gi, "Advanced AI analysis"],
  [/Plan de actiune complet/gi, "Complete action plan"],
  [/Plan de acțiune complet/gi, "Complete action plan"],
  [/Plan de investitie detaliat/gi, "Detailed investment plan"],
  [/Plan de investiție detaliat/gi, "Detailed investment plan"],
  [/auditul surselor si citatele validate/gi, "source audit and validated quotes"],
  [/auditul surselor și citatele validate/gi, "source audit and validated quotes"],
  [/analiza completa a competitiei si a cererii/gi, "full competition and demand analysis"],
  [/analiza completă a competiției și a cererii/gi, "full competition and demand analysis"],
  [/planul operational si riscurile detaliate/gi, "operational plan and detailed risks"],
  [/planul operațional și riscurile detaliate/gi, "operational plan and detailed risks"],
  [/Sentiment Web Public/gi, "Public web sentiment"],
  [/Ce laudă clienții/gi, "What customers praise"],
  [/Ce lauda clientii/gi, "What customers praise"],
  [/Critici recurente/gi, "Recurring criticism"],
  [/Date sintetizate de AI:/gi, "AI-synthesised data:"],
  [/Sintetiz AI recenziile publice de pe Google Maps pentru/gi, "I summarise public reviews from Google Maps for"],
  [/Adaugă o observație reală din Google Reviews/gi, "Add a real observation from Google Reviews"],
  [/Adauga o observatie reala din Google Reviews/gi, "Add a real observation from Google Reviews"],
  [/Publică observație/gi, "Publish observation"],
  [/Publica observatie/gi, "Publish observation"],
  [/Acces Complet Gratuit/gi, "Full free access"],
  [/Rapoartele OpportunIQ sunt complet gratuite\. Platforma se susține din publicitate\./gi, "OpportunIQ reports are fully free. The platform is supported by advertising."],
  [/Rapoartele OpportunIQ sunt complet gratuite\. Platforma se sustine din publicitate\./gi, "OpportunIQ reports are fully free. The platform is supported by advertising."],
  [/Analiză extinsă generată automat/gi, "Extended analysis generated automatically"],
  [/Analiza extinsa generata automat/gi, "Extended analysis generated automatically"],
  [/Estimări orientative/gi, "Guidance estimates"],
  [/Estimari orientative/gi, "Guidance estimates"],
  [/Nu reprezintă un studiu de piață oficial/gi, "Does not represent an official market study"],
  [/Nu reprezinta un studiu de piata oficial/gi, "Does not represent an official market study"],
  [/Baza locală analizată include aproximativ ([\d\.,]+) locuitori\./gi, "The analysed local base includes about $1 inhabitants."],
  [/Baza locala analizata include aproximativ ([\d\.,]+) locuitori\./gi, "The analysed local base includes about $1 inhabitants."],
  [/Cererea orientativă este evaluată la ([\d\.,]+)\/10\./gi, "Guidance demand is estimated at $1/10."],
  [/Cererea orientativa este evaluata la ([\d\.,]+)\/10\./gi, "Guidance demand is estimated at $1/10."],
  [/Presiunea competițională este evaluată la ([\d\.,]+)\/10\./gi, "Competitive pressure is estimated at $1/10."],
  [/Presiunea competitionala este evaluata la ([\d\.,]+)\/10\./gi, "Competitive pressure is estimated at $1/10."],
  [/Evidență medie/gi, "Medium evidence"],
  [/Evidenta medie/gi, "Medium evidence"],
  [/Evidență ridicată/gi, "High evidence"],
  [/Evidenta ridicata/gi, "High evidence"],
  [/Evidență timpurie/gi, "Early evidence"],
  [/Evidenta timpurie/gi, "Early evidence"],
  [/Media semnalelor publicate în/gi, "Average of published signals in"],
  [/Media semnalelor publicate in/gi, "Average of published signals in"],
  [/Benchmark local pe (\d+) semnale publicate în același județ\./gi, "Local benchmark based on $1 signals published in the same county."],
  [/Benchmark local pe (\d+) semnale publicate in acelasi judet\./gi, "Local benchmark based on $1 signals published in the same county."],
  [/Media nișei în/gi, "Niche average in"],
  [/Media nisei in/gi, "Niche average in"],
  [/Comparație pe (\d+) semnale comparabile din aceeași nișă\./gi, "Comparison across $1 comparable signals in the same niche."],
  [/Comparatie pe (\d+) semnale comparabile din aceeasi nisa\./gi, "Comparison across $1 comparable signals in the same niche."],
  [/profil demografic comparabil: ([\d\.,]+) locuitori/gi, "comparable demographic profile: $1 inhabitants"],
  [/Cum se formează scorul/gi, "How the score is formed"],
  [/Cum se formeaza scorul/gi, "How the score is formed"],
  [/Strat AI de piață/gi, "AI market layer"],
  [/Strat AI de piata/gi, "AI market layer"],
  [/Citește cererea, competiția, gap-ul și contextul local\./gi, "Reads demand, competition, the gap and the local context."],
  [/Citeste cererea, competitia, gap-ul si contextul local\./gi, "Reads demand, competition, the gap and the local context."],
  [/Derivat din voturile de încredere, fără să înlocuiască modelul de piață\./gi, "Derived from trust votes without replacing the market model."],
  [/Derivat din voturile de incredere, fara sa inlocuiasca modelul de piata\./gi, "Derived from trust votes without replacing the market model."],
  [/Scorul operațional folosit intern pentru ranking și praguri de acces\./gi, "Operational score used internally for ranking and access thresholds."],
  [/Scorul operational folosit intern pentru ranking si praguri de acces\./gi, "Operational score used internally for ranking and access thresholds."],
  [/Voturi și interes/gi, "Votes and interest"],
  [/Voturi si interes/gi, "Votes and interest"],
  [/Context demografic/gi, "Demographic context"],
  [/Oferta/gi, "Supply"],
  [/Firme locale relevante: (\d+), dintre care (\d+) verificate\./gi, "Relevant local companies: $1, of which $2 are verified."],
  [/Supply delta pe ultimele 7-30 zile: ([^\.]+)\./gi, "Supply delta over the last 7-30 days: $1."],
  [/Demand delta pe ultimele 7-30 zile: ([^\.]+)\./gi, "Demand delta over the last 7-30 days: $1."],
  [/Aspecte deja apreciate în piață:/gi, "Aspects already appreciated in the market:"],
  [/Aspecte deja apreciate in piata:/gi, "Aspects already appreciated in the market:"],
  [/Gap principal:/gi, "Main gap:"],
  [/Fricțiuni recurente care susțin gap-ul:/gi, "Recurring frictions supporting the gap:"],
  [/Frictiuni recurente care sustin gap-ul:/gi, "Recurring frictions supporting the gap:"],
  [/Whitespace intern:/gi, "Internal whitespace:"],
  [/Risc orientativ:/gi, "Guidance risk:"],
  [/Why not now:/gi, "Why not now:"],
  [/Investiție și ROI/gi, "Investment and ROI"],
  [/Investitie si ROI/gi, "Investment and ROI"],
  [/Efort investițional:/gi, "Investment effort:"],
  [/Efort investitional:/gi, "Investment effort:"],
  [/Potențial orientativ:/gi, "Guidance potential:"],
  [/Potential orientativ:/gi, "Guidance potential:"],
  [/ROI estimat:/gi, "Estimated ROI:"],
  [/estimare ROI condiționată de validarea operațională locală/gi, "ROI estimate conditional on local operational validation"],
  [/estimare ROI conditionata de validarea operationala locala/gi, "ROI estimate conditional on local operational validation"],
  [/Why now:/gi, "Why now:"],
  [/Atenția comunitară accelerează cu ([^,]+), ceea ce indică interes proaspăt, nu doar volum istoric\./gi, "Community attention is accelerating by $1, which indicates fresh interest, not just historical volume."],
  [/Atentia comunitara accelereaza cu ([^,]+), ceea ce indica interes proaspat, nu doar volum istoric\./gi, "Community attention is accelerating by $1, which indicates fresh interest, not just historical volume."],
  [/Presiunea cererii este peste oferta nou intrată \(raport cerere\/ofertă ([^)]+)\)\./gi, "Demand pressure is above newly entered supply (demand/supply ratio $1)."],
  [/Presiunea cererii este peste oferta nou intrata \(raport cerere\/oferta ([^)]+)\)\./gi, "Demand pressure is above newly entered supply (demand/supply ratio $1)."],
  [/Scoruri detaliate/gi, "Detailed scores"],
  [/Recenzii publice extrase din Google Maps pentru/gi, "Public reviews extracted from Google Maps for"],
  [/clusterizate pe pattern-uri \(sentiment, teme recurente, cereri explicite\/implicite\)\./gi, "clustered by patterns (sentiment, recurring themes, explicit/implicit requests)."],
  [/Scor de oportunitate calculat algoritmic 0[–-]100\./gi, "Opportunity score calculated algorithmically on a 0-100 scale."],
  [/INDICATORI CANTITATIVI/gi, "QUANTITATIVE INDICATORS"],
  [/INDICATORI CALITATIVI \(NLP\)/gi, "QUALITATIVE INDICATORS (NLP)"],
  [/Probleme recurente/gi, "Recurring issues"],
  [/Aspecte apreciate \(formule replicabile\)/gi, "Praised aspects (replicable patterns)"],
  [/Cerere explicită \([^)]+\)/gi, "Explicit demand"],
  [/Cerere explicita \([^)]+\)/gi, "Explicit demand"],
  [/Cerere implicită \([^)]+\)/gi, "Implicit demand"],
  [/Cerere implicita \([^)]+\)/gi, "Implicit demand"],
  [/SCOR DE OPORTUNITATE \(calculat algoritmic\)/gi, "OPPORTUNITY SCORE (algorithmic calculation)"],
  [/OPORTUNITATE MEDIE/gi, "MEDIUM OPPORTUNITY"],
  [/Contribuitori principali:/gi, "Main contributors:"],
  [/Bazat pe ([\d]+) recenzii reale, ([\d]+) concurenți pe Google Maps\./gi, "Based on $1 real reviews and $2 competitors on Google Maps."],
  [/Bazat pe ([\d]+) recenzii reale, ([\d]+) competitori pe Google Maps\./gi, "Based on $1 real reviews and $2 competitors on Google Maps."],
  [/din (\d+) concurenți/gi, "from $1 competitors"],
  [/din (\d+) competitori/gi, "from $1 competitors"],
  [/scor agregat Google Maps/gi, "aggregated Google Maps score"],
  [/Distribuție pe stele/gi, "Star distribution"],
  [/Distributie pe stele/gi, "Star distribution"],
  [/Concurenți analizați:/gi, "Competitors analysed:"],
  [/Competitori analizați:/gi, "Competitors analysed:"],
  [/Concurenti analizati:/gi, "Competitors analysed:"],
  [/profesionalismul personalului/gi, "staff professionalism"],
  [/calitatea lucrărilor efectuate/gi, "quality of the work performed"],
  [/calitatea lucrarilor efectuate/gi, "quality of the work performed"],
  [/condiții igienice excelente/gi, "excellent hygiene standards"],
  [/conditii igienice excelente/gi, "excellent hygiene standards"],
  [/atitudinea nepoliticoasă a personalului/gi, "impolite staff attitude"],
  [/atitudinea nepoliticoasa a personalului/gi, "impolite staff attitude"],
  [/atitudine nepoliticoasă a medicilor/gi, "impolite attitude from doctors"],
  [/atitudine nepoliticoasa a medicilor/gi, "impolite attitude from doctors"],
  [/experiențe neplăcute cu detartrajul/gi, "unpleasant scaling experiences"],
  [/experiente neplacute cu detartrajul/gi, "unpleasant scaling experiences"],
  [/servicii necorespunzătoare în timpul detartrajului/gi, "poor service during scaling"],
  [/servicii necorespunzatoare in timpul detartrajului/gi, "poor service during scaling"],
  [/rezervarea online este apreciată și ar putea fi un factor de diferențiere — replicabil/gi, "online booking is appreciated and could be a replicable differentiator"],
  [/rezervarea online este apreciata si ar putea fi un factor de diferentiere — replicabil/gi, "online booking is appreciated and could be a replicable differentiator"],
  [/servicii dedicate copiilor/gi, "children-focused services"],
  [/campanii de promovare pe rețele sociale axate pe părinți/gi, "social media campaigns focused on parents"],
  [/campanii de promovare pe retele sociale axate pe parinti/gi, "social media campaigns focused on parents"],
  [/parteneriate cu școli pentru educația dentară/gi, "partnerships with schools for dental education"],
  [/parteneriate cu scoli pentru educatia dentara/gi, "partnerships with schools for dental education"],
  [/percepția de prețuri ridicate în comparație cu competiția/gi, "perceived high pricing compared with the competition"],
  [/perceptia de preturi ridicate in comparatie cu competitia/gi, "perceived high pricing compared with the competition"],
  [/fluctuații sezoniere în numărul pacienților/gi, "seasonal fluctuations in patient numbers"],
  [/fluctuatii sezoniere in numarul pacientilor/gi, "seasonal fluctuations in patient numbers"],
  [/OPORTUNITĂȚI CONCRETE PENTRU INVESTITOR/gi, "CONCRETE OPPORTUNITIES FOR INVESTORS"],
  [/OPORTUNITATI CONCRETE PENTRU INVESTITOR/gi, "CONCRETE OPPORTUNITIES FOR INVESTORS"],
  [/DIFERENȚIATORI RECOMANDAȚI/gi, "RECOMMENDED DIFFERENTIATORS"],
  [/DIFERENTIATORI RECOMANDATI/gi, "RECOMMENDED DIFFERENTIATORS"],
  [/Poziționare sugerată:/gi, "Suggested positioning:"],
  [/Pozitionare sugerata:/gi, "Suggested positioning:"],
  [/STRATEGII DE MARKETING/gi, "MARKETING STRATEGIES"],
  [/RISCURI IDENTIFICATE/gi, "IDENTIFIED RISKS"],
  [/Audit sursă:/gi, "Source audit:"],
  [/Audit sursa:/gi, "Source audit:"],
  [/Metodologie:/gi, "Methodology:"],
  [/Top (\d+) concurenți pe Google Maps pentru nișă × oraș, ultimele (\d+) recenzii fiecare\./gi, "Top $1 competitors on Google Maps for the niche and city, latest $2 reviews each."],
  [/Top (\d+) competitori pe Google Maps pentru nișă × oraș, ultimele (\d+) recenzii fiecare\./gi, "Top $1 competitors on Google Maps for the niche and city, latest $2 reviews each."],
  [/Aplicăm clusterizare semantică \(NU citate verbatim\) pentru a extrage teme recurente cu frecvență\./gi, "We apply semantic clustering (not verbatim quotes) to extract recurring themes with frequency."],
  [/Aplicam clusterizare semantica \(NU citate verbatim\) pentru a extrage teme recurente cu frecventa\./gi, "We apply semantic clustering (not verbatim quotes) to extract recurring themes with frequency."],
  [/Recenziile brute sunt accesibile în secțiunea „Audit sursă"\./gi, "The raw reviews are available in the \"Source audit\" section."],
  [/Recenziile brute sunt accesibile in sectiunea „Audit sursa"\./gi, "The raw reviews are available in the \"Source audit\" section."],
  [/Ce conține acest raport/gi, "What this report includes"],
  [/Ce contine acest raport/gi, "What this report includes"],
  [/Dimensionarea pieței și potențialul de creștere/gi, "Market sizing and growth potential"],
  [/Dimensionarea pietei si potentialul de crestere/gi, "Market sizing and growth potential"],
  [/Analiza competiției și avantaje competitive/gi, "Competition analysis and competitive advantages"],
  [/Analiza competitiei si avantaje competitive/gi, "Competition analysis and competitive advantages"],
  [/Profil client țintă și demografice/gi, "Target customer profile and demographics"],
  [/Profil client tinta si demografice/gi, "Target customer profile and demographics"],
  [/Strategie de preț și poziționare/gi, "Pricing strategy and positioning"],
  [/Strategie de pret si pozitionare/gi, "Pricing strategy and positioning"],
  [/Plan de lansare pas cu pas/gi, "Step-by-step launch plan"],
  [/Proiecții financiare și estimări profit/gi, "Financial projections and profit estimates"],
  [/Proiectii financiare si estimari profit/gi, "Financial projections and profit estimates"],
  [/Semnalul gratuit include:/gi, "The free signal includes:"],
  [/Parteneri recomandați/gi, "Recommended partners"],
  [/Parteneri recomandati/gi, "Recommended partners"],
  [/Date locale actuale/gi, "Up-to-date local data"],
  [/Actualizat autonom de AI/gi, "Autonomously updated by AI"],
  [/Actualizat autonom din date/gi, "Autonomously updated from data"],
  [/Analiza completă deblochează cererea în profunzime, competiția, planul operațional și blocurile premium detaliate\./gi, "The full analysis unlocks in-depth demand, competition, the operational plan and detailed premium blocks."],
  [/Analiza completa deblocheaza cererea in profunzime, competitia, planul operational si blocurile premium detaliate\./gi, "The full analysis unlocks in-depth demand, competition, the operational plan and detailed premium blocks."],
  [/Semnalele peste pragul de 75\/100 rămân premium\./gi, "Signals above the 75/100 threshold remain premium."],
  [/Semnalele peste pragul de 75\/100 raman premium\./gi, "Signals above the 75/100 threshold remain premium."],
  [/Preview-ul de mai sus arată rezumatul executiv și primele secțiuni validate, iar pachetul complet păstrează auditul sursă, analiza competiției, cererea și planul operațional\./gi, "The preview above shows the executive summary and the first validated sections, while the full package keeps the source audit, competition analysis, demand and operational plan."],
  [/Preview-ul de mai sus arata rezumatul executiv si primele sectiuni validate, iar pachetul complet pastreaza auditul sursa, analiza competitiei, cererea si planul operational\./gi, "The preview above shows the executive summary and the first validated sections, while the full package keeps the source audit, competition analysis, demand and operational plan."],
  [/Riscuri si KPIs locali/gi, "Local risks and KPIs"],
  [/Riscuri și KPIs locali/gi, "Local risks and KPIs"],
  [/Continut premium blocat/gi, "Premium content locked"],
  [/Conținut premium blocat/gi, "Premium content locked"],
  [/Rezumat executiv/gi, "Executive summary"],
  [/Investitie initiala/gi, "Initial investment"],
  [/Investiție inițială/gi, "Initial investment"],
  [/Cost lunar/gi, "Monthly cost"],
  [/Profit lunar estimat/gi, "Estimated monthly profit"],
  [/Pasi de implementare/gi, "Implementation steps"],
  [/Pași de implementare/gi, "Implementation steps"],
  [/Prospe(?:ț|t)ime comercial(?:ă|a):/gi, "Commercial freshness:"],
  [/Util pentru decizie initiala si validare rapida, nu pentru aprobarea finala de investment\./gi, "Useful for initial decisions and fast validation, not for final investment approval."],
  [/Util pentru decizie ini(?:ț|t)ial(?:ă|a) si validare rapid(?:ă|a), nu pentru aprobarea final(?:ă|a) de investment\./gi, "Useful for initial decisions and fast validation, not for final investment approval."],
  [/Semnalul ramane nemodificat pana la cel putin (\d+) zile, ca sa nu consumi inutil OpenAI\./gi, "The signal stays unchanged for at least $1 days so you do not consume OpenAI unnecessarily."],
  [/Semnalul rămâne nemodificat până la cel puțin (\d+) zile, ca să nu consumi inutil OpenAI\./gi, "The signal stays unchanged for at least $1 days so you do not consume OpenAI unnecessarily."],
  [/servire lent[ăa] în perioade aglomerate/gi, "slow service during busy periods"],
  [/semnal in pierdere de semnal/gi, "signal losing momentum"],
  [/semnal în pierdere de semnal/gi, "signal losing momentum"],
  [/in curs de validare locala/gi, "pending local validation"],
  [/în curs de validare locală/gi, "pending local validation"],
  [/estimare orientativa indisponibila/gi, "guidance estimate unavailable"],
  [/estimare orientativă indisponibilă/gi, "guidance estimate unavailable"],
  [/licitatie publica/gi, "public tender"],
  [/licitație publică/gi, "public tender"],
  [/zile/gi, "days"],
  [/ziua/gi, "day"],
  [/Start:/gi, "Start:"],
  [/Diagrama GANTT/gi, "GANTT chart"],
  [/Bare proportionale cu durata fiecarui pas/gi, "Bars proportional to each step duration"],
  [/Bare proportionale cu durata fiecărui pas/gi, "Bars proportional to each step duration"],
  [/Costuri lunare/gi, "Monthly costs"],
  [/Riscuri si mitigari/gi, "Risks and mitigations"],
  [/Riscuri și mitigări/gi, "Risks and mitigations"],
  [/KPIs urmaribili/gi, "Trackable KPIs"],
  [/KPIs urmăritori/gi, "Trackable KPIs"],
  [/Cercetare & Validare/gi, "Research & Validation"],
  [/Juridic & Fiscal/gi, "Legal & Tax"],
  [/Setup Operational/gi, "Operational setup"],
  [/Marketing & Lansare/gi, "Marketing & Launch"],
  [/Crestere & Optimizare/gi, "Growth & Optimisation"],
  [/Creștere & Optimizare/gi, "Growth & Optimisation"],
  [/recenzii/gi, "reviews"],
];

export function localizeReportType(value: string | null | undefined, locale: Locale) {
  return localizeFromTable(REPORT_TYPE_LABELS, value, locale);
}

export function localizeSignalVerdict(value: string | null | undefined, locale: Locale) {
  return localizeFromTable(SIGNAL_VERDICT_LABELS, value, locale);
}

export function localizeSignalClass(value: string | null | undefined, locale: Locale) {
  return localizeFromTable(SIGNAL_CLASS_LABELS, value, locale);
}

export function localizeEvidenceTier(value: string | null | undefined, locale: Locale) {
  return localizeFromTable(EVIDENCE_TIER_LABELS, value, locale);
}

export function localizeFinancialCompleteness(value: string | null | undefined, locale: Locale) {
  return localizeFromTable(FINANCIAL_COMPLETENESS_LABELS, value, locale);
}

export function localizeFreshnessLabel(value: string | null | undefined, locale: Locale) {
  return localizeFromTable(FRESHNESS_LABELS, value, locale);
}

export function translateSignalText(value: string | null | undefined, locale: Locale) {
  if (!value) return value ?? "";
  if (locale !== "en") return value;
  let translated = value;
  for (const [pattern, replacement] of EN_SIGNAL_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}

function shouldSkipTranslationForKey(key: string | null | undefined, value: string) {
  if (!key) return false;
  const normalizedKey = key.toLowerCase();
  if (NON_TRANSLATABLE_KEY_PARTS.some((part) => normalizedKey.includes(part))) {
    return true;
  }
  if (normalizedKey === "id") return true;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return true;
  return false;
}

function localizeSignalStringByKey(
  value: string,
  locale: Locale,
  key: string | null | undefined,
) {
  if (shouldSkipTranslationForKey(key, value)) return value;
  switch (key) {
    case "reportType":
      return localizeReportType(value, locale) || translateSignalText(value, locale);
    case "verdict":
      return localizeSignalVerdict(value, locale) || translateSignalText(value, locale);
    case "signalClass":
      return localizeSignalClass(value, locale) || translateSignalText(value, locale);
    case "evidenceTier":
      return localizeEvidenceTier(value, locale) || translateSignalText(value, locale);
    case "financialCompleteness":
      return localizeFinancialCompleteness(value, locale) || translateSignalText(value, locale);
    case "opportunityState":
      return localizeFromTable(OPPORTUNITY_STATE_LABELS, value, locale) || translateSignalText(value, locale);
    case "positioning":
      return localizeFromTable(POSITIONING_LABELS, value, locale) || translateSignalText(value, locale);
    case "label": {
      const freshness = localizeFreshnessLabel(value, locale);
      return freshness !== value ? freshness : translateSignalText(value, locale);
    }
    default:
      return translateSignalText(value, locale);
  }
}

function deepLocalizeSignalValue<T>(
  value: T,
  locale: Locale,
  currentKey?: string,
): T {
  if (locale !== "en") return value;
  if (value == null) return value;
  if (typeof value === "string") {
    return localizeSignalStringByKey(value, locale, currentKey) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepLocalizeSignalValue(item, locale, currentKey)) as T;
  }
  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(input)) {
      output[key] = deepLocalizeSignalValue(item, locale, key);
    }
    return output as T;
  }
  return value;
}

export function localizeSignalPayload<T>(value: T, locale: Locale): T {
  return deepLocalizeSignalValue(value, locale);
}
