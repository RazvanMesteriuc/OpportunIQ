import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { SignalCard } from "@/components/signals/signal-card";
import { buildSignalCardTags } from "@/lib/feed-card-tags";
import { buildOpportunityPath, buildSignalPath } from "@/lib/mock-opportunity-space";
import { getOpportunityStageLabel } from "@/lib/opportunity-stage-label";
import {
  INDUSTRY_FILTER_OPTIONS,
  matchesLocationSelection,
  useLocationFilterOptions,
} from "@/lib/ro-taxonomies";
import { useDemoRuntimeFeed } from "@/lib/use-demo-runtime-feed";
import { Filter, LayoutGrid, MapPin, Radio, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export default function FeedPage() {
  const { hydrated, demoRecords, runtimeFeedItems, runtimeLoading, runtimeError, refresh } = useDemoRuntimeFeed({ limit: 4 });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [draftLocation, setDraftLocation] = useState("Toate");
  const [draftIndustry, setDraftIndustry] = useState("Toate industriile");
  const [draftStage, setDraftStage] = useState("Toate stadiile");
  const [draftSearch, setDraftSearch] = useState("");
  const locationOptions = useLocationFilterOptions("Toate");
  const locationFilterOptions = useMemo(
    () => locationOptions.map((option) => ({ value: option, label: option })),
    [locationOptions],
  );
  const industryFilterOptions = useMemo(
    () => INDUSTRY_FILTER_OPTIONS.map((option) => ({ value: option, label: option })),
    [],
  );
  const [appliedFilters, setAppliedFilters] = useState({
    location: "Toate",
    industry: "Toate industriile",
    stage: "Toate stadiile",
    search: "",
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState("Pentru tine");
  const stageFilterOptions = useMemo(
    () => [
      { value: "Toate stadiile", label: "Toate stadiile" },
      { value: "idea", label: getOpportunityStageLabel("idea") },
      { value: "validation", label: getOpportunityStageLabel("validation") },
      { value: "plan", label: getOpportunityStageLabel("plan") },
      { value: "pitch", label: getOpportunityStageLabel("pitch") },
    ],
    [],
  );

  const orderedSignals = useMemo(
    () =>
      [...demoRecords]
        .map((record) => ({
          signal: record.signal,
          opportunity: record.opportunity,
          feedItem: runtimeFeedItems[record.reportId] ?? null,
        }))
        .sort(
          (left, right) =>
            Math.round(right.feedItem?.metrics?.truthScore ?? right.feedItem?.finalScore ?? right.signal.score)
            - Math.round(left.feedItem?.metrics?.truthScore ?? left.feedItem?.finalScore ?? left.signal.score),
        ),
    [demoRecords, runtimeFeedItems],
  );
  const filteredSignals = useMemo(() => {
    return orderedSignals.filter(({ signal, opportunity, feedItem }) => {
      const matchesLocation =
        matchesLocationSelection(appliedFilters.location, feedItem?.locality ?? signal.location);
      const matchesIndustry =
        appliedFilters.industry === "Toate industriile" || (feedItem?.industry ?? signal.category) === appliedFilters.industry;
      const matchesStage =
        appliedFilters.stage === "Toate stadiile"
          || opportunity.stage === appliedFilters.stage;
      const searchNeedle = appliedFilters.search.trim().toLowerCase();
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
      const matchesQuickFilter =
        activeQuickFilter === "Pentru tine"
          ? true
          : activeQuickFilter === "În validare"
            ? opportunity.stage === "validation"
            : activeQuickFilter === "Pregătite pentru discuție"
              ? opportunity.discussionReady || opportunity.stage === "pitch"
              : signal.interestedCount >= 12;

      return matchesLocation && matchesIndustry && matchesStage && matchesSearch && matchesQuickFilter;
    });
  }, [activeQuickFilter, appliedFilters, orderedSignals]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      location: draftLocation,
      industry: draftIndustry,
      stage: draftStage,
      search: draftSearch,
    });
  };

  const handleRefresh = async () => {
    setLastUpdatedAt(new Date());
    if (hydrated) {
      await refresh();
    }
  };

  return (
    <PublicLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Semnale și oportunități</h1>
          <p className="mt-2 text-[15px] text-slate-600">
            Descoperă semnale relevante din piață și transformă-le în oportunități de business.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_1fr_1fr_1.5fr_auto]">
            <FilterBox
              icon={<MapPin size={16} />}
              label="Locație"
              value={draftLocation}
              options={locationFilterOptions}
              onChange={setDraftLocation}
            />
            <FilterBox
              icon={<LayoutGrid size={16} />}
              label="Industrie"
              value={draftIndustry}
              options={industryFilterOptions}
              onChange={setDraftIndustry}
            />
            <FilterBox
              icon={<Radio size={16} />}
              label="Stadiu"
              value={draftStage}
              options={stageFilterOptions}
              onChange={setDraftStage}
            />
            <div className="flex items-center gap-3 rounded-xl px-4 py-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Caută semnale, oportunități sau cuvinte cheie..."
              />
            </div>
            <Button type="button" onClick={handleApplyFilters} className="h-auto rounded-xl bg-[#0b5c66] px-6 py-3 text-white hover:bg-[#084b53]">
              <Filter size={16} className="mr-2" />
              Filtrează
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Pentru tine", "În validare", "Pregătite pentru discuție", "Foarte urmărite"].map((label) => (
            <QuickFilterPill
              key={label}
              label={label}
              active={activeQuickFilter === label}
              onClick={() => setActiveQuickFilter(label)}
            />
          ))}
        </div>

        {runtimeLoading ? (
          <div className="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Actualizăm semnalele cu context extern și relevanță de piață.
          </div>
        ) : null}
        {runtimeError ? (
          <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {runtimeError}
          </div>
        ) : null}

        <div className="space-y-4">
          {filteredSignals.length ? (
            filteredSignals.map(({ signal, feedItem }) => (
              <SignalCard
                key={signal.id}
                id={signal.id}
                category={feedItem?.industry ?? signal.category}
                categoryIcon={<Sparkles size={18} className="text-[#0b5c66]" />}
                categoryColor="bg-sky-50 text-sky-700"
                location={feedItem?.locality ?? signal.location}
                title={feedItem?.title ?? signal.title}
                description={feedItem?.summary ?? signal.description}
                score={Math.round(feedItem?.metrics?.truthScore ?? feedItem?.finalScore ?? signal.score)}
                interestedCount={feedItem?.metrics?.interestCount ?? signal.interestedCount}
                interestedLabel="interes agregat"
                imageUrl={signal.imageUrl}
                badgeClassName={signal.badgeClassName}
                badgeTextClassName={signal.badgeTextClassName}
                accentClassName={signal.accentClassName}
                tertiaryActionLabel="Construiește oportunitatea"
                tertiaryActionHref={buildOpportunityPath(signal.id)}
                primaryActionHref={feedItem?.analysisHref ?? buildSignalPath(signal.id)}
                tags={buildSignalCardTags({ feedItem, fallbackLabels: signal.tags })}
              />
            ))
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              Nu există semnale care să corespundă filtrelor selectate acum.
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 text-sm text-slate-500">
          <button type="button" onClick={() => void handleRefresh()} className="font-semibold text-[#0b5c66]">Actualizează</button>
          <span>•</span>
          <span>Ultima actualizare: {formatRelativeRefresh(lastUpdatedAt)}</span>
        </div>
      </div>
    </PublicLayout>
  );
}

function formatRelativeRefresh(value: Date): string {
  const diffMinutes = Math.max(0, Math.round((Date.now() - value.getTime()) / 60_000));
  if (diffMinutes <= 1) return "acum";
  return `acum ${diffMinutes} minute`;
}

function QuickFilterPill({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-[#0b5c66] bg-[#0b5c66] text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}

function FilterBox({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3">
      <div className="text-slate-400">{icon}</div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 bg-transparent text-sm font-semibold text-slate-900 outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
