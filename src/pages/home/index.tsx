import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MapPin, Search, Filter, Radio, Flame, Users, LayoutGrid, Sparkles, Compass, Handshake, X } from "lucide-react";
import { QuickExploreMap } from "@/components/maps/quick-explore-map";
import { SignalCard } from "@/components/signals/signal-card";
import { buildSignalCardTags } from "@/lib/feed-card-tags";
import { buildOpportunityPath, buildSignalPath } from "@/lib/mock-opportunity-space";
import {
  INDUSTRY_FILTER_OPTIONS,
  matchesLocationSelection,
  useLocationFilterOptions,
} from "@/lib/ro-taxonomies";
import { useDemoRuntimeFeed } from "@/lib/use-demo-runtime-feed";
import { useCallback, useEffect, useMemo, useState } from "react";

const HOME_TICKER_STORAGE_KEY = "opportuniq-home-ticker-visible";
const HOME_OVERVIEW_VISIBLE_KEY = "opportuniq-home-overview-visible";
const HOME_OVERVIEW_AUTOCOLLAPSED_KEY = "opportuniq-home-overview-autocollapsed";

export default function HomePage() {
  const { demoRecords, runtimeFeedItems, runtimeLoading, runtimeError } = useDemoRuntimeFeed({ limit: 4 });
  const [tickerVisible, setTickerVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const persistedValue = window.localStorage.getItem(HOME_TICKER_STORAGE_KEY);
    return persistedValue !== "hidden";
  });

  useEffect(() => {
    window.localStorage.setItem(
      HOME_TICKER_STORAGE_KEY,
      tickerVisible ? "visible" : "hidden",
    );
  }, [tickerVisible]);

  const [overviewVisible, setOverviewVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const hasAutoCollapsed = window.localStorage.getItem(HOME_OVERVIEW_AUTOCOLLAPSED_KEY) === "true";
    if (!hasAutoCollapsed) return true;
    return window.localStorage.getItem(HOME_OVERVIEW_VISIBLE_KEY) !== "hidden";
  });

  useEffect(() => {
    window.localStorage.setItem(
      HOME_OVERVIEW_VISIBLE_KEY,
      overviewVisible ? "visible" : "hidden",
    );
  }, [overviewVisible]);

  const hideOverview = useCallback(() => {
    setOverviewVisible(false);
    window.localStorage.setItem(HOME_OVERVIEW_VISIBLE_KEY, "hidden");
  }, []);

  const showOverview = useCallback(() => {
    setOverviewVisible(true);
    window.localStorage.setItem(HOME_OVERVIEW_VISIBLE_KEY, "visible");
    window.localStorage.setItem(HOME_OVERVIEW_AUTOCOLLAPSED_KEY, "true");
  }, []);

  const [draftLocation, setDraftLocation] = useState("Toate");
  const [draftIndustry, setDraftIndustry] = useState("Toate industriile");
  const [draftSearch, setDraftSearch] = useState("");
  const locationOptions = useLocationFilterOptions("Toate");
  const [appliedHomeFilters, setAppliedHomeFilters] = useState({
    location: "Toate",
    industry: "Toate industriile",
    search: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasAutoCollapsed = window.localStorage.getItem(HOME_OVERVIEW_AUTOCOLLAPSED_KEY) === "true";
    if (hasAutoCollapsed || !overviewVisible) return;

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(HOME_OVERVIEW_AUTOCOLLAPSED_KEY, "true");
      hideOverview();
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [overviewVisible, hideOverview]);

  useEffect(() => {
    if (typeof window === "undefined" || !overviewVisible) return;

    let inactivityTimeoutId = window.setTimeout(() => {
      hideOverview();
    }, 30000);

    const resetInactivityTimeout = () => {
      window.clearTimeout(inactivityTimeoutId);
      inactivityTimeoutId = window.setTimeout(() => {
        hideOverview();
      }, 30000);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimeout, { passive: true });
    });

    return () => {
      window.clearTimeout(inactivityTimeoutId);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimeout);
      });
    };
  }, [overviewVisible, hideOverview]);

  const runtimeEntries = useMemo(() => {
    return demoRecords
      .map((record) => ({
        signal: record.signal,
        opportunity: record.opportunity,
        feedItem: runtimeFeedItems[record.reportId] ?? null,
      }))
      .sort(
        (left, right) =>
          Math.round(right.feedItem?.metrics?.truthScore ?? right.feedItem?.finalScore ?? right.signal.score)
          - Math.round(left.feedItem?.metrics?.truthScore ?? left.feedItem?.finalScore ?? left.signal.score),
      );
  }, [demoRecords, runtimeFeedItems]);

  const filteredRuntimeEntries = useMemo(() => {
    return runtimeEntries.filter(({ signal, feedItem }) => {
      const matchesLocation =
        matchesLocationSelection(appliedHomeFilters.location, feedItem?.locality ?? signal.location);
      const matchesIndustry =
        appliedHomeFilters.industry === "Toate industriile" || (feedItem?.industry ?? signal.category) === appliedHomeFilters.industry;
      const searchNeedle = appliedHomeFilters.search.trim().toLowerCase();
      const searchHaystack = [
        feedItem?.title,
        feedItem?.summary,
        feedItem?.industry,
        feedItem?.locality,
        signal.title,
        signal.description,
        signal.category,
        signal.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !searchNeedle
        || searchHaystack.includes(searchNeedle);

      return matchesLocation && matchesIndustry && matchesSearch;
    });
  }, [appliedHomeFilters, runtimeEntries]);

  const topEntry = filteredRuntimeEntries[0] ?? null;
  const validationEntries = filteredRuntimeEntries
    .filter((entry) => entry.signal.id !== topEntry?.signal.id)
    .slice(0, 3);

  const handleApplyHomeFilters = () => {
    setAppliedHomeFilters({
      location: draftLocation,
      industry: draftIndustry,
      search: draftSearch,
    });
  };

  return (
    <PublicLayout>
      <div className="flex flex-col gap-4 w-full mx-auto">
        {tickerVisible ? <HomeInfoTicker onDismiss={() => setTickerVisible(false)} /> : null}
        {!tickerVisible ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setTickerVisible(true)}
              className="inline-flex items-center rounded-full border border-[#c89b2d]/25 bg-[#fff8e6] px-3 py-1 text-[11px] font-semibold text-[#8a6512] shadow-sm transition-colors hover:bg-[#fff3cf]"
            >
              Afișează ticker-ul
            </button>
          </div>
        ) : null}
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-3 mb-0">
          <div className="flex-1 max-w-3xl">
            <h1 className="text-[1.8rem] md:text-[1.95rem] font-bold text-slate-900 leading-tight lg:whitespace-nowrap mb-2">
              Oportunități de business validate de{" "}
              <span className="whitespace-nowrap text-[#0b5c66]">semnale reale</span>.
            </h1>
            <p className="text-sm text-slate-600">
              Descoperă semnale din piață, construiește idei de business și conectează-te cu investitori, furnizori sau parteneri potriviți.
            </p>
          </div>
          <div className="hidden lg:flex flex-1 max-w-[280px] justify-end">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
              alt="Peisaj urban si context economic pentru oportunitati de business"
              className="h-[116px] w-[236px] rounded-[22px] object-cover shadow-sm ring-1 ring-slate-200"
            />
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            overviewVisible ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Filters Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-col md:flex-row gap-2 items-center w-full">
              <div className="flex-1 flex items-center px-3 py-1.5 border-b md:border-b-0 md:border-r border-slate-100 w-full">
                <MapPin size={18} className="text-slate-400 mr-2" />
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold leading-none mb-1">Locație</span>
                  <select
                    value={draftLocation}
                    onChange={(event) => setDraftLocation(event.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer w-full leading-none"
                  >
                    {locationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 flex items-center px-3 py-1.5 border-b md:border-b-0 md:border-r border-slate-100 w-full">
                <LayoutGrid size={18} className="text-slate-400 mr-2" />
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold leading-none mb-1">Industrie</span>
                  <select
                    value={draftIndustry}
                    onChange={(event) => setDraftIndustry(event.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer w-full leading-none"
                  >
                    {INDUSTRY_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-[2] flex items-center px-3 py-1.5 w-full">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  type="text" 
                  placeholder="Caută semnale, oportunități sau cuvinte cheie..." 
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <Button onClick={handleApplyHomeFilters} className="w-full md:w-auto bg-[#0b5c66] hover:bg-[#084b53] text-white px-6 py-2 h-auto rounded-lg">
                <Filter size={16} className="mr-2" />
                Filtrează
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={<Radio size={20} />} title="Semnale active" value="78" trend="+18 față de ieri" color="text-teal-500" bg="bg-teal-50" />
              <StatCard icon={<Flame size={20} />} title="Oportunități în validare" value="23" trend="+6 față de ieri" color="text-green-500" bg="bg-green-50" />
              <StatCard icon={<Users size={20} />} title="Pregătite pentru discuție" value="14" trend="+4 față de ieri" color="text-blue-500" bg="bg-blue-50" />
              <StatCard icon={<Handshake size={20} />} title="Potriviri noi" value="11" trend="+3 potriviri relevante" color="text-amber-500" bg="bg-amber-50" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        {runtimeLoading ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Actualizăm semnalele cu context extern și relevanță de piață.
          </div>
        ) : null}
        {runtimeError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {runtimeError}
          </div>
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-1">
          
          {/* Left Column (Signals) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Top Signal */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Cel mai puternic semnal acum</h2>
                <button
                  type="button"
                  onClick={overviewVisible ? hideOverview : showOverview}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {overviewVisible ? "Ascunde filtrele și cardurile" : "Afișează filtrele și cardurile"}
                </button>
              </div>
              {topEntry ? (
                <SignalCard 
                  id={topEntry.signal.id}
                  isRecommended={true}
                  category={topEntry.feedItem?.industry ?? topEntry.signal.category}
                  categoryIcon={<Sparkles size={24} className="text-[#0b5c66]" />}
                  categoryColor="bg-[#0b5c66]/10 text-[#0b5c66]"
                  location={topEntry.feedItem?.locality ?? topEntry.signal.location}
                  title={topEntry.feedItem?.title ?? topEntry.signal.title}
                  description={topEntry.feedItem?.summary ?? topEntry.signal.description}
                  score={Math.round(topEntry.feedItem?.metrics?.truthScore ?? topEntry.feedItem?.finalScore ?? topEntry.signal.score)}
                  interestedCount={topEntry.feedItem?.metrics?.interestCount ?? topEntry.signal.interestedCount}
                  interestedLabel="interes agregat"
                  imageUrl={topEntry.signal.imageUrl}
                  badgeClassName={topEntry.signal.badgeClassName}
                  badgeTextClassName={topEntry.signal.badgeTextClassName}
                  accentClassName={topEntry.signal.accentClassName}
                  tags={buildSignalCardTags({ feedItem: topEntry.feedItem, fallbackLabels: topEntry.signal.tags })}
                  tertiaryActionLabel="Construiește oportunitatea"
                  tertiaryActionHref={buildOpportunityPath(topEntry.signal.id)}
                  primaryActionHref={topEntry.feedItem?.analysisHref ?? buildSignalPath(topEntry.signal.id)}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                  Nu există semnale care să corespundă filtrelor selectate acum.
                </div>
              )}
            </div>

            {/* Validation Signals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Oportunități în validare</h2>
                  <p className="text-sm text-slate-500">Doar ideile care au deja semnale și interes observat.</p>
                </div>
                <Button asChild variant="link" className="text-[#0b5c66] hover:text-[#084b53] p-0 h-auto">
                  <Link href="/semnale">Vezi toate</Link>
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {validationEntries.map(({ signal, feedItem }) => (
                  <div
                    key={signal.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={signal.imageUrl}
                        alt={feedItem?.title ?? signal.title}
                        className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${signal.badgeClassName} ${signal.badgeTextClassName}`}>
                            {feedItem?.industry ?? signal.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900">{feedItem?.title ?? signal.title}</h4>
                        <p className="mt-1 max-w-xl text-sm text-slate-600">{feedItem?.summary ?? signal.description}</p>
                        <div className="text-sm text-slate-500 flex items-center mt-1">
                          <MapPin size={12} className="mr-1" /> {feedItem?.locality ?? signal.location}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">Scor semnal</div>
                        <div className="font-bold text-lg text-[#0b5c66]">
                          {Math.round(feedItem?.metrics?.truthScore ?? feedItem?.finalScore ?? signal.score)}
                          <span className="text-xs text-slate-400 font-normal">/100</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <Users size={14} className="mr-1" /> {(feedItem?.metrics?.interestCount ?? signal.interestedCount)} interes agregat
                      </div>
                    </div>
                    <Button asChild variant="outline" className="text-[#0b5c66] border-[#0b5c66]/30">
                      <Link href={feedItem?.analysisHref ?? buildSignalPath(signal.id)}>Vezi detalii</Link>
                    </Button>
                  </div>
                  </div>
                ))}
                {!validationEntries.length && topEntry ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-500 shadow-sm">
                    Nu mai există alte oportunități în validare pentru filtrele selectate.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Column (Widgets) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Compass size={16} className="text-[#0b5c66]" />
                    Explorează harta
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Vezi rapid unde se adună semnale și urmărește contextul local când ai nevoie de detalii.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  Secundar
                </span>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <QuickExploreMap compact />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Context geografic util</div>
                  <div className="text-xs text-slate-500">Nu înlocuiește fluxul principal, dar adaugă context local valoros.</div>
                </div>
                <Button asChild variant="outline" className="border-[#0b5c66]/30 text-[#0b5c66]">
                  <Link href="/explorare-rapida">Deschide</Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}

function StatCard({
  icon,
  title,
  value,
  trend,
  color,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-semibold text-slate-500 mb-0.5 leading-none">{title}</div>
        <div className="text-xl font-bold text-slate-900 mb-0.5 leading-tight">{value}</div>
        <div className="text-[11px] font-medium text-green-600 leading-none">{trend}</div>
      </div>
    </div>
  );
}

function HomeInfoTicker({ onDismiss }: { onDismiss: () => void }) {
  const items = [
    { text: "Cum funcționează", isLabel: true },
    { text: "Descoperi semnale reale", isLabel: false },
    { text: "Construiești oportunități", isLabel: false },
    { text: "Te conectezi controlat", isLabel: false },
    { text: "Pentru cine", isLabel: true },
    { text: "Primul business", isLabel: false },
    { text: "Investitori", isLabel: false },
    { text: "Furnizori / parteneri", isLabel: false },
  ];
  const trailingItems = items.filter((item) => !item.isLabel);
  const loop = [...items, ...trailingItems];

  return (
    <section className="w-full overflow-hidden rounded-xl border border-[#c89b2d]/20 bg-gradient-to-r from-[#fff7df] via-[#f9edc2] to-[#fff8e8] shadow-sm">
      <div className="flex items-center">
        <div className="hidden shrink-0 items-center gap-1.5 border-r border-[#c89b2d]/15 bg-[#f6e6af]/70 px-3 py-1.5 md:flex">
          <span className="h-2 w-2 rounded-full bg-[#b7861e]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a6512]">
            OpportunIQ
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden px-3 py-1.5">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#fff6da] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#fff8e8] to-transparent z-10" />
          <div
            className="flex items-center gap-4 whitespace-nowrap animate-marquee"
            style={{ animationDuration: "26s" }}
          >
            {loop.map((item, index) => {
              return (
                <div key={`${item.text}-${index}`} className="inline-flex items-center gap-2 shrink-0">
                  <span
                    className={
                      item.isLabel
                        ? "text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a6512]"
                        : "text-[12px] font-medium text-slate-700"
                    }
                  >
                    {item.text}
                  </span>
                  <span className="text-[#b7861e]/40">•</span>
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          aria-label="Ascunde newsticker-ul"
          onClick={onDismiss}
          className="mr-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#8a6512]/70 transition-colors hover:bg-white/40 hover:text-[#8a6512]"
        >
          <X size={12} />
        </button>
      </div>
    </section>
  );
}
