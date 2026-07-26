import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import {
  buildOpportunityPath,
  getOpportunitySpaceBySignalId,
} from "@/lib/mock-opportunity-space";
import { useOpportunityWorkspace } from "@/lib/opportunity-workspace";
import {
  INDUSTRY_FILTER_OPTIONS,
  matchesLocationSelection,
  useLocationFilterOptions,
} from "@/lib/ro-taxonomies";
import { useProfile } from "@/lib/use-profile";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Building2,
  Globe,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const groups = [
  {
    label: "Investitori compatibili",
    description: "Profiluri potrivite pentru oportunități care pot intra în discuții.",
    items: [
      {
        entityId: "investor-anon-a",
        entityType: "company" as const,
        name: "Investitor anonimizat A",
        role: "Partener",
        location: "Cluj-Napoca",
        compatibility: 92,
        offers: "Capital, mentorat și acces la o rețea regională de business.",
        seeks: "Oportunități testabile, cu cerere clară și primii pași deja definiți.",
        whyFit: "Are interes confirmat pentru servicii locale scalabile și intră devreme în discuții.",
        badge: "Interes confirmat",
      },
      {
        entityId: "angel-network-local",
        entityType: "company" as const,
        name: "Angel Network local",
        role: "Partener",
        location: "Timișoara",
        compatibility: 88,
        offers: "Experiență în servicii consumer și conexiuni cu operatori locali.",
        seeks: "Oportunități pregătite pentru un prim pilot și validare rapidă.",
        whyFit: "Înțelege bine piața locală și preferă oportunități care pot testa repede cererea.",
        badge: "Verificat",
      },
    ],
  },
  {
    label: "Furnizori relevanți",
    description: "Actori care pot susține validarea și execuția mai rapidă.",
    items: [
      {
        entityId: "eco-logistics-hub",
        entityType: "company" as const,
        name: "EcoLogistics Hub",
        role: "Partener",
        location: "Arad",
        compatibility: 81,
        offers: "Flotă, rute și suport operațional pentru livrări locale.",
        seeks: "Parteneriate noi pe verticala pet care și servicii recurente.",
        whyFit: "Poate susține pilotul fără costuri mari de pornire și acoperă județele apropiate.",
        badge: "Activ recent",
      },
      {
        entityId: "companie-anonimizata-a",
        entityType: "company" as const,
        name: "Companie anonimizată A",
        role: "Partener",
        location: "Timișoara",
        compatibility: 77,
        offers: "Ambalare, aprovizionare și suport de teren pentru echipe mici.",
        seeks: "Clienți recurenți și colaborări pe termen mediu.",
        whyFit: "Este local și poate reduce timpul până la primul pilot operațional.",
        badge: "Răspuns rapid",
      },
    ],
  },
  {
    label: "Parteneri operaționali",
    description: "Profiluri care pot accelera lansarea, distribuția sau execuția din teren.",
    items: [
      {
        entityId: "greenchain-srl",
        entityType: "company" as const,
        name: "GreenChain SRL",
        role: "Partener",
        location: "Timișoara",
        compatibility: 88,
        offers: "Rețea locală de clienți și know-how operațional.",
        seeks: "Semnale validate pentru extindere și pilot local.",
        whyFit: "Poate deschide rapid primele colaborări și ajută la operaționalizarea serviciului.",
        badge: "Verificat",
      },
      {
        entityId: "operator-anonim-b",
        entityType: "company" as const,
        name: "Operator anonim B",
        role: "Partener",
        location: "Oradea",
        compatibility: 79,
        offers: "Experiență în procese recurente și coordonare echipe de teren.",
        seeks: "Inițiative clare, cu nevoie de pilot și creștere regională.",
        whyFit: "Are experiență apropiată de modelul de execuție și poate susține extinderea graduală.",
        badge: "Disponibil",
      },
    ],
  },
];

function readSelectedSignalId() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const signalId = params.get("signalId");
  return signalId?.trim() ? signalId : null;
}

export default function MatchesPage() {
  const [location, navigate] = useLocation();
  const { profile } = useProfile();
  const selectedOpportunity = useMemo(() => {
    void location;
    return getOpportunitySpaceBySignalId(readSelectedSignalId());
  }, [location]);
  const workspace = useOpportunityWorkspace(
    selectedOpportunity.signalId,
    {
      stage: selectedOpportunity.stage,
      pitchCompletionPct: selectedOpportunity.pitch.completionPct,
      currentNeedLabel: selectedOpportunity.currentNeed.label,
      currentNeedDescription: selectedOpportunity.currentNeed.description,
      ask: selectedOpportunity.pitch.ask,
    },
    profile.setup,
  );
  const [draftPartnerType, setDraftPartnerType] = useState("Toate tipurile");
  const [draftLocation, setDraftLocation] = useState("Toate zonele");
  const [draftRole, setDraftRole] = useState("Toate rolurile");
  const [draftStage, setDraftStage] = useState("Toate stadiile");
  const [draftSearch, setDraftSearch] = useState("");
  const locationOptions = useLocationFilterOptions("Toate zonele");
  const [appliedFilters, setAppliedFilters] = useState({
    partnerType: "Toate tipurile",
    location: "Toate zonele",
    role: "Toate rolurile",
    stage: "Toate stadiile",
    search: "",
  });

  const filteredGroups = useMemo(() => {
    return groups
      .filter((group) => {
        if (appliedFilters.partnerType === "Toate tipurile") return true;
        return group.label === appliedFilters.partnerType;
      })
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const matchesLocation =
            matchesLocationSelection(appliedFilters.location, item.location);
          const matchesRole =
            appliedFilters.role === "Toate rolurile" || item.role === appliedFilters.role;
          const matchesStage =
            appliedFilters.stage === "Toate stadiile"
            || (appliedFilters.stage === "validare" && item.compatibility < 90)
            || (appliedFilters.stage === "pregătită pentru discuție" && item.compatibility >= 88);
          const searchNeedle = appliedFilters.search.trim().toLowerCase();
          const matchesSearch =
            !searchNeedle
            || item.name.toLowerCase().includes(searchNeedle)
            || item.offers.toLowerCase().includes(searchNeedle)
            || item.seeks.toLowerCase().includes(searchNeedle)
            || item.whyFit.toLowerCase().includes(searchNeedle);

          return matchesLocation && matchesRole && matchesStage && matchesSearch;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [appliedFilters]);

  const totalFilteredMatches = useMemo(
    () => filteredGroups.reduce((count, group) => count + group.items.length, 0),
    [filteredGroups],
  );
  const topCompatibility = useMemo(
    () => filteredGroups.flatMap((group) => group.items).reduce((max, item) => Math.max(max, item.compatibility), 0),
    [filteredGroups],
  );
  const introContextHref = `${buildOpportunityPath(selectedOpportunity.signalId)}#introducere-controlata`;
  const introStatusLabel =
    workspace.introductionRequest?.status === "pending"
      ? "În așteptare"
      : workspace.introductionPolicy.decision === "allow"
        ? "Eligibilă"
        : "În lucru";

  const handleApplyFilters = () => {
    setAppliedFilters({
      partnerType: draftPartnerType,
      location: draftLocation,
      role: draftRole,
      stage: draftStage,
      search: draftSearch,
    });
  };

  const handleRequestIntroduction = (item: (typeof groups)[number]["items"][number]) => {
    if (workspace.introductionRequest?.status === "pending") {
      navigate(introContextHref);
      return;
    }

    if (workspace.introductionPolicy.decision === "require_profile_completion") {
      navigate("/onboarding");
      return;
    }

    if (workspace.introductionPolicy.decision !== "allow") {
      navigate(introContextHref);
      return;
    }

    workspace.requestIntroduction({
      targetEntityType: item.entityType,
      targetEntityId: item.entityId,
      targetLabel: item.name,
      note: selectedOpportunity.pitch.ask,
    });
  };

  return (
    <PublicLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Potriviri relevante</h1>
            <p className="text-sm text-slate-600">
              Găsește investitori, furnizori și parteneri potriviți pentru oportunitatea selectată.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            {totalFilteredMatches} potriviri filtrate pentru oportunitatea selectată
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#0b5c66]">
                <Sparkles size={26} />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                    Oportunitate selectată
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    {selectedOpportunity.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <MapPin size={12} />
                    {selectedOpportunity.location}
                  </span>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">
                    Stadiu: {selectedOpportunity.stage}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedOpportunity.title}
                </h2>
                <p className="max-w-3xl text-sm text-slate-600">
                  {selectedOpportunity.heroSummary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Scor semnal" value={String(selectedOpportunity.signalScore)} accent="text-[#0b5c66]" />
              <Metric label="Potriviri" value={String(totalFilteredMatches)} accent="text-sky-600" />
              <Metric label="Introducere" value={introStatusLabel} accent="text-emerald-600" />
              <Metric label="Compatibilitate top" value={`${topCompatibility}%`} accent="text-amber-600" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1.4fr_auto]">
            <FilterBox
              icon={<Users size={17} />}
              label="Tip partener"
              value={draftPartnerType}
              options={["Toate tipurile", "Investitori compatibili", "Furnizori relevanți", "Parteneri operaționali"]}
              onChange={setDraftPartnerType}
            />
            <FilterBox
              icon={<Building2 size={17} />}
              label="Industrie"
              value={selectedOpportunity.category}
              options={INDUSTRY_FILTER_OPTIONS}
              onChange={() => {}}
              disabled
            />
            <FilterBox
              icon={<MapPin size={17} />}
              label="Locație"
              value={draftLocation}
              options={locationOptions}
              onChange={setDraftLocation}
            />
            <FilterBox
              icon={<Globe size={17} />}
              label="Rol"
              value={draftRole}
              options={["Toate rolurile", "Antreprenor", "Partener"]}
              onChange={setDraftRole}
            />
            <FilterBox
              icon={<Sparkles size={17} />}
              label="Stadiu"
              value={draftStage}
              options={["Toate stadiile", "validare", "pregătită pentru discuție"]}
              onChange={setDraftStage}
            />
            <div className="flex items-center gap-3 rounded-xl px-4 py-3">
              <Search size={17} className="text-slate-400" />
              <input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Caută profil, rol sau ce oferă..."
              />
            </div>
            <Button onClick={handleApplyFilters} className="h-auto rounded-xl bg-[#0b5c66] px-5 py-3 text-white hover:bg-[#084b53]">
              <SlidersHorizontal size={16} className="mr-2" />
              Filtrează
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cum calculăm potrivirea</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Potrivirea ține cont de industrie, stadiul oportunității, proximitate, rol și interesul confirmat. Nu promite finanțare sau parteneriat, ci doar profiluri compatibile pentru următorul pas.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Introducerea se cere direct de aici doar dacă oportunitatea este suficient de clară. Altfel, te întorci în spațiul de oportunitate pentru a închide ce lipsește.
          </p>
        </section>

        {filteredGroups.length ? filteredGroups.map((group) => (
          <section key={group.label} className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{group.label}</h2>
                <p className="text-sm text-slate-500">{group.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {group.items.map((item) => (
                <article
                  key={item.name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                            {item.role}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                            {item.badge}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={13} />
                            {item.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck size={13} />
                            Compatibilitate {item.compatibility}%
                          </span>
                        </div>
                      </div>

                      <div className="min-w-[86px] rounded-2xl bg-slate-50 px-3 py-2 text-center">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Match
                        </div>
                        <div className="text-2xl font-bold text-[#0b5c66]">{item.compatibility}</div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoBox
                        icon={<Building2 size={16} />}
                        label="Ce oferă"
                        value={item.offers}
                      />
                      <InfoBox
                        icon={<Globe size={16} />}
                        label="Ce caută"
                        value={item.seeks}
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">De ce este potrivit</div>
                      <p className="mt-2 text-sm text-slate-700">{item.whyFit}</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1 rounded-xl border-[#0b5c66]/20 text-[#0b5c66] hover:bg-teal-50"
                      >
                        <Link href={buildOpportunityPath(selectedOpportunity.signalId)}>Vezi contextul</Link>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRequestIntroduction(item)}
                        className="flex-1 rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]"
                      >
                        {workspace.introductionRequest?.status === "pending" && workspace.introductionRequest.targetEntityId === item.entityId
                          ? "Cerere în așteptare"
                          : workspace.introductionRequest?.status === "pending"
                            ? "Vezi cererea activă"
                            : workspace.introductionPolicy.decision === "require_profile_completion"
                              ? "Completează profilul"
                              : workspace.introductionPolicy.decision === "allow"
                                ? "Solicită introducere"
                                : "Clarifică oportunitatea"}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )) : (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            Nu există potriviri care să corespundă filtrelor selectate acum.
          </section>
        )}
      </div>
    </PublicLayout>
  );
}

function FilterBox({
  icon,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3">
      <div className="text-slate-400">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-900 outline-none disabled:cursor-default disabled:text-slate-500"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}
