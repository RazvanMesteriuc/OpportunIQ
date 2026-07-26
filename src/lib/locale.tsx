import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "ro" | "en";

const LOCALE_STORAGE_KEY = "opp_locale";

type MessageValue = string | ((params?: Record<string, string | number>) => string);

const messages: Record<Locale, Record<string, MessageValue>> = {
  ro: {
    "common.loading": "Se încarcă...",
    "lang.ro": "Română",
    "lang.en": "English",
    "layout.marketPulse.1": "Vezi rapid ce se misca in piata ta locala, fara sa scanezi manual zeci de surse.",
    "layout.marketPulse.2": "Fluxul uneste semnale, cereri, firme si context public intr-o vedere de decizie.",
    "layout.marketPulse.3": "Platforma prioritizeaza zonele, nisele si firmele cu relevanta comerciala reala pentru profilul tau.",
    "layout.marketPulse.4": "Digestul saptamanal livreaza oportunitati selective, cereri si miscari de piata care merita actiune.",
    "layout.aboutData": "Despre date",
    "layout.freeDigest": "Digest gratuit",
    "layout.howSignalsWork": "Cum alegem ce merita atentia ta",
    "layout.howSignalsWorkSub": "Date publice, activitate reala si context local.",
    "layout.aiSignals": "Date si semnale",
    "layout.aiSignalsBody": "Platforma aduna dovezi din piata si le comprima in miscari, cereri si oportunitati pe care le poti evalua mai repede.",
    "layout.communitySignals": "Activitate din piata",
    "layout.communitySignalsBody": "Interactiunile dintre firme, postarile si raspunsurile locale ne ajuta sa ridicam mai sus ceea ce conteaza in zona ta.",
    "layout.updateRhythm": "Ritm de actualizare",
    "layout.updateRhythmBody": "Fluxul comunitatii este aproape in timp real, iar contextul public si editorial se actualizeaza periodic.",
    "layout.investmentNotice": "Platforma e utila pentru discovery si prioritizare, dar deciziile finale de investitie trebuie validate si din surse oficiale.",
    "nav.home": "Acasă",
    "nav.signals": "Semnale",
    "nav.matches": "Potriviri",
    "nav.messages": "Mesaje",
    "layout.profile": "Profil",
    "layout.logout": "Ieșire",
    "layout.login": "Autentificare",
    "layout.weeklyDigest": "Digest saptamanal gratuit",
    "layout.signalsMap": "Flux, harta si rapoarte pentru decizie comerciala locala.",
    "layout.footerBody": "Platforma combina date publice, activitate din piata si filtre de relevanta pentru a scoate rapid la suprafata ce conteaza, unde merita sa actionezi si ce firme intra organic in radar.",
    "layout.aiReports": "Rapoarte de piata",
    "layout.validatedArticles": "Articole validate",
    "layout.navigation": "Navigare",
    "layout.quickActions": "Acțiuni rapide",
    "layout.activateDigest": "Activează digestul",
    "layout.viewMethodology": "Vezi metodologia",
    "layout.footerNote": "© 2026 OpportunIQ. Instrument de orientare si prioritizare pentru piata din Romania.",
    "layout.digestRomania": "Digest săptămânal România",
    "layout.digestRomaniaSub": "Oportunități, licitații și mișcări relevante de piață.",
    "layout.digestConfirmed": "Abonare confirmată",
    "layout.digestConfirmedBody": "Vei primi un rezumat clar, concentrat pe zonele și industriile selectate.",
    "common.close": "Închide",
    "layout.peopleDigest": "{count} persoane primesc deja digestul în fiecare săptămână.",
    "layout.email": "Email *",
    "layout.emailPlaceholder": "email@tau.ro",
    "layout.nameOptional": "Numele tău (opțional)",
    "layout.namePlaceholder": "Ion Popescu",
    "layout.countiesOfInterest": "Județe de interes",
    "layout.industriesOptional": "Industrii (opțional)",
    "layout.digestFinePrint": "Primești un singur email pe săptămână, orientat pe județele și industriile selectate. Fără spam, fără zgomot inutil.",
    "layout.processing": "Se procesează...",
    "layout.subscribeFree": "Abonează-mă gratuit",
    "layout.signal.market": "Semnale de piață",
    "layout.signal.business": "Semnale de firmă",
    "layout.mobileNav": "Navigare mobilă",
    "layout.mobileNavTitle": "Alege rapid unde vrei să mergi",
    "layout.mobileNavBody": "Pe mobil intri rapid in Feed, Harta, Cereri si publicare, fara meniuri grele si fara jargon intern.",
    "layout.mobile.activity": "Semnale",
    "layout.mobile.compose": "Posteaza",
    "layout.openMenu": "Deschide meniul",
    "layout.closeMenu": "Închide meniul",
    "layout.contact": "Contact",
    "layout.about": "Despre",
    "layout.terms": "Termeni și condiții",
    "layout.methodology": "Metodologie",
    "home.level.country": "Național",
    "home.level.county": "Județ",
    "home.level.locality": "Localitate",
    "home.live.activeDiscussion": "Discuție activă",
    "home.live.market": "Piața Live",
    "home.live.map": "Hartă",
    "home.live.openDashboard": "Deschide dashboard-ul Piața Live",
    "home.live.backToMap": "Revino la hartă",
    "home.live.dashboard": "Dashboard live",
    "home.live.countryHint": "Dashboard național cu topicuri live ordonate după activitate, relevanță și utilitate comercială.",
    "home.live.countyHint": "Dashboard live filtrat pentru județul {name}, cu cereri și conversații care pot mișca piața locală.",
    "home.live.localityHint": "Dashboard live filtrat pentru {name}, cu conversații utile pentru contextul local imediat.",
    "home.live.newTopic": "Topic nou",
    "home.live.topics": "Topicuri",
    "home.live.active": "Activi",
    "home.live.spectators": "Spectatori",
    "home.live.raisedHands": "Mâini ridicate",
    "home.live.loadingTopics": "Se încarcă topicurile live...",
    "home.live.relevance": "relevanță",
    "home.live.messages": "Mesaje",
    "home.live.participationSignals": "Semnale de participare",
    "home.live.activeSpeakers": "Vorbitori activi",
    "home.live.participants": "Participanți",
    "home.live.inList": "în listă",
    "home.live.rules": "Reguli live",
    "home.live.rule1": "Maxim 30 participanți activi; restul devin spectatori.",
    "home.live.rule2": "Comentariile intră instant printr-un filtru de siguranță și relevanță.",
    "home.live.rule3": "Moderatorul poate aproba ridicarea de mână pentru spectatorii relevanți.",
    "home.live.noTopics": "Nu există încă topicuri live pe acest filtru. Poți deschide primul topic și dashboard-ul se va popula automat.",
    "home.live.forum": "Forum Live",
    "home.live.refresh": "Refresh",
    "home.live.closeTopic": "Închide topicul",
    "home.live.moderationNote": "Moderarea automată este activă: mesajele licențioase, atacurile la persoană și off-topic primesc strike și sunt eliminate la recurență.",
    "home.live.speakers": "vorbitori",
    "home.live.started": "Convorbirea a pornit. Primul mesaj relevant apare aici imediat ce un participant activ intervine.",
    "home.live.joinFromCard": "Intră în discuție din cardul selectat pentru a participa.",
    "home.live.spectatorWait": "Ești spectator. Ridică mâna și așteaptă aprobarea moderatorului.",
    "home.live.writeRelevant": "Scrie un mesaj relevant pentru topic. Moderarea automată este activă.",
    "home.live.joinTopic": "Intră în topic",
    "home.live.raiseHand": "Ridică mâna",
    "home.live.handRaised": "Mâna este ridicată",
    "home.live.send": "Trimite",
    "home.live.sending": "Se trimite...",
    "home.live.host": "Host",
    "home.live.activeRole": "Activ",
    "home.live.spectatorRole": "Spectator",
    "home.live.raisedHandShort": "A ridicat mâna",
    "home.live.approve": "Aprobă",
    "home.live.selectCard": "Selectează un card din dashboard",
    "home.live.selectCardBody": "Fiecare card este o discuție live de tip forum. La click se deschide aici formularul mare de conversație, cu mesaje, participanți și moderare automată.",
    "home.live.step1": "1. Selectezi cardul",
    "home.live.step1Body": "Alegi topicul relevant",
    "home.live.step2": "2. Intri în forum",
    "home.live.step2Body": "Se deschide panoul mare de discuție",
    "home.live.step3": "3. Participi",
    "home.live.step3Body": "Scrii sau ridici mâna dacă ești spectator",
    "home.live.stage.new": "Nou",
    "home.live.stage.useful": "Discuție utilă",
    "home.live.stage.hot": "Discuție aprinsă",
    "home.live.stage.match": "Match bun pentru tine",
    "home.live.openTopicTitle": "Deschide un topic în Piața Live",
    "home.live.openTopicBody": "Topicul apare discret în județul sau localitatea curentă și intră automat în moderare.",
    "home.live.shortTitle": "Titlu scurt și clar",
    "home.live.topicPlaceholder": "Descrie foarte scurt subiectul, ce urmărești și de ce merită conversația.",
    "home.live.keywordsPlaceholder": "Cuvinte-cheie, separate prin virgulă",
    "home.live.category.market": "Piață",
    "home.live.category.demand": "Cerere",
    "home.live.category.investment": "Investiție",
    "home.live.category.collaboration": "Colaborare",
  },
  en: {
    "common.loading": "Loading...",
    "lang.ro": "Romanian",
    "lang.en": "English",
    "layout.marketPulse.1": "See what is moving in your local market without scanning dozens of sources manually.",
    "layout.marketPulse.2": "The main flow unifies signals, requests, companies and public context into one decision surface.",
    "layout.marketPulse.3": "The platform prioritizes areas, niches and companies with real commercial relevance for your profile.",
    "layout.marketPulse.4": "The weekly digest delivers selective opportunities, requests and market moves worth acting on.",
    "layout.aboutData": "About the data",
    "layout.freeDigest": "Free digest",
    "layout.howSignalsWork": "How we decide what deserves your attention",
    "layout.howSignalsWorkSub": "Public data, real activity and local context.",
    "layout.aiSignals": "Data and signals",
    "layout.aiSignalsBody": "The platform gathers market evidence and compresses it into changes, requests and opportunities you can evaluate faster.",
    "layout.communitySignals": "Market activity",
    "layout.communitySignalsBody": "Company interactions, posts and local responses help push up the things that matter in your area.",
    "layout.updateRhythm": "Update cadence",
    "layout.updateRhythmBody": "The community flow is close to real time, while public and editorial context refreshes periodically.",
    "layout.investmentNotice": "The platform is useful for discovery and prioritization, but final investment decisions should also be validated through official sources.",
    "nav.home": "Home",
    "nav.signals": "Signals",
    "nav.matches": "Matches",
    "nav.messages": "Messages",
    "layout.profile": "Profile",
    "layout.logout": "Log out",
    "layout.login": "Sign in",
    "layout.weeklyDigest": "Free weekly digest",
    "layout.signalsMap": "Feed, map and reports for local commercial decision-making.",
    "layout.footerBody": "The platform combines public data, market activity and relevance filters to surface what matters, where to act and which companies enter the market radar organically.",
    "layout.aiReports": "Market reports",
    "layout.validatedArticles": "Validated articles",
    "layout.navigation": "Navigation",
    "layout.quickActions": "Quick actions",
    "layout.activateDigest": "Activate digest",
    "layout.viewMethodology": "View methodology",
    "layout.footerNote": "© 2026 OpportunIQ. Guidance and prioritization tool for the Romanian market.",
    "layout.digestRomania": "Weekly Romania digest",
    "layout.digestRomaniaSub": "Opportunities, tenders and relevant market moves.",
    "layout.digestConfirmed": "Subscription confirmed",
    "layout.digestConfirmedBody": "You will receive a clear summary focused on the areas and industries you selected.",
    "common.close": "Close",
    "layout.peopleDigest": "{count} people already receive the digest every week.",
    "layout.email": "Email *",
    "layout.emailPlaceholder": "your@email.com",
    "layout.nameOptional": "Your name (optional)",
    "layout.namePlaceholder": "John Smith",
    "layout.countiesOfInterest": "Counties of interest",
    "layout.industriesOptional": "Industries (optional)",
    "layout.digestFinePrint": "You receive a single email per week focused on the selected counties and industries. No spam, no unnecessary noise.",
    "layout.processing": "Processing...",
    "layout.subscribeFree": "Subscribe for free",
    "layout.signal.market": "Market signals",
    "layout.signal.business": "Company signals",
    "layout.mobileNav": "Mobile navigation",
    "layout.mobileNavTitle": "Choose where you want to go",
    "layout.mobileNavBody": "On mobile you move quickly between Feed, Map, Requests and posting, without heavy menus or internal jargon.",
    "layout.mobile.activity": "Signals",
    "layout.mobile.compose": "Post",
    "layout.openMenu": "Open menu",
    "layout.closeMenu": "Close menu",
    "layout.contact": "Contact",
    "layout.about": "About",
    "layout.terms": "Terms and conditions",
    "layout.methodology": "Methodology",
    "home.level.country": "National",
    "home.level.county": "County",
    "home.level.locality": "Locality",
    "home.live.activeDiscussion": "Active discussion",
    "home.live.market": "Live Market",
    "home.live.map": "Map",
    "home.live.openDashboard": "Open Live Market dashboard",
    "home.live.backToMap": "Back to map",
    "home.live.dashboard": "Live dashboard",
    "home.live.countryHint": "National dashboard with live topics ordered by activity, relevance and commercial usefulness.",
    "home.live.countyHint": "Live dashboard filtered for {name} county, with requests and conversations that can move the local market.",
    "home.live.localityHint": "Live dashboard filtered for {name}, with conversations useful for the immediate local context.",
    "home.live.newTopic": "New topic",
    "home.live.topics": "Topics",
    "home.live.active": "Active",
    "home.live.spectators": "Spectators",
    "home.live.raisedHands": "Raised hands",
    "home.live.loadingTopics": "Loading live topics...",
    "home.live.relevance": "relevance",
    "home.live.messages": "Messages",
    "home.live.participationSignals": "Participation signals",
    "home.live.activeSpeakers": "Active speakers",
    "home.live.participants": "Participants",
    "home.live.inList": "in list",
    "home.live.rules": "Live rules",
    "home.live.rule1": "Maximum 30 active participants; the rest become spectators.",
    "home.live.rule2": "Comments pass instantly through a relevance and safety filter.",
    "home.live.rule3": "The moderator can approve raised hands for relevant spectators.",
    "home.live.noTopics": "There are no live topics yet for this filter. You can open the first one and the dashboard will populate automatically.",
    "home.live.forum": "Live Forum",
    "home.live.refresh": "Refresh",
    "home.live.closeTopic": "Close topic",
    "home.live.moderationNote": "Automated moderation is active: explicit content, personal attacks and off-topic messages receive strikes and are removed on recurrence.",
    "home.live.speakers": "speakers",
    "home.live.started": "The conversation has started. The first relevant message appears here as soon as an active participant joins in.",
    "home.live.joinFromCard": "Join from the selected card to participate.",
    "home.live.spectatorWait": "You are a spectator. Raise your hand and wait for moderator approval.",
    "home.live.writeRelevant": "Write a relevant message for the topic. Automated moderation is active.",
    "home.live.joinTopic": "Join topic",
    "home.live.raiseHand": "Raise hand",
    "home.live.handRaised": "Hand raised",
    "home.live.send": "Send",
    "home.live.sending": "Sending...",
    "home.live.host": "Host",
    "home.live.activeRole": "Active",
    "home.live.spectatorRole": "Spectator",
    "home.live.raisedHandShort": "Raised hand",
    "home.live.approve": "Approve",
    "home.live.selectCard": "Select a card from the dashboard",
    "home.live.selectCardBody": "Each card is a live forum discussion. Click one to open the full discussion panel here, with messages, participants and automated moderation.",
    "home.live.step1": "1. Pick the card",
    "home.live.step1Body": "Choose the relevant topic",
    "home.live.step2": "2. Enter the forum",
    "home.live.step2Body": "The full discussion panel opens",
    "home.live.step3": "3. Participate",
    "home.live.step3Body": "Write or raise your hand if you are a spectator",
    "home.live.stage.new": "New",
    "home.live.stage.useful": "Useful discussion",
    "home.live.stage.hot": "On fire",
    "home.live.stage.match": "Good match for you",
    "home.live.openTopicTitle": "Open a topic in Live Market",
    "home.live.openTopicBody": "The topic appears discreetly in the current county or locality and automatically enters moderation.",
    "home.live.shortTitle": "Short, clear title",
    "home.live.topicPlaceholder": "Briefly describe the subject, what you want and why the conversation matters.",
    "home.live.keywordsPlaceholder": "Keywords, separated by commas",
    "home.live.category.market": "Market",
    "home.live.category.demand": "Demand",
    "home.live.category.investment": "Investment",
    "home.live.category.collaboration": "Collaboration",
  },
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getLocaleTag(locale: Locale) {
  return locale === "en" ? "en-GB" : "ro-RO";
}

function toValidDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      return saved === "en" ? "en" : "ro";
    } catch {
      return "ro";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {}
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, params) => {
      const entry = messages[locale][key] ?? messages.ro[key] ?? key;
      const raw = typeof entry === "function" ? entry(params) : entry;
      if (!params) return raw;
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
      }, raw);
    },
    formatDate: (value, options) => {
      const date = toValidDate(value);
      if (!date) return "";
      return new Intl.DateTimeFormat(getLocaleTag(locale), options ?? {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    },
    formatDateTime: (value, options) => {
      const date = toValidDate(value);
      if (!date) return "";
      return new Intl.DateTimeFormat(getLocaleTag(locale), options ?? {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },
    formatNumber: (value, options) => new Intl.NumberFormat(getLocaleTag(locale), options).format(value),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
