import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, MapPin, SlidersHorizontal } from "lucide-react";

type Hotspot = {
  id: string;
  label: string;
  city: string;
  count: number;
  risk: "Scăzut" | "Mediu" | "Ridicat";
  color: string;
  x: string;
  y: string;
  compactX?: string;
  compactY?: string;
};

const hotspots: Hotspot[] = [
  {
    id: "cj",
    label: "Cluj",
    city: "Cluj-Napoca",
    count: 15,
    risk: "Scăzut",
    color: "bg-violet-500",
    x: "30%",
    y: "30%",
    compactX: "33%",
    compactY: "33%",
  },
  {
    id: "tm",
    label: "Timiș",
    city: "Timișoara",
    count: 8,
    risk: "Scăzut",
    color: "bg-emerald-500",
    x: "14%",
    y: "58%",
    compactX: "20%",
    compactY: "58%",
  },
  {
    id: "is",
    label: "Iași",
    city: "Iași",
    count: 7,
    risk: "Mediu",
    color: "bg-violet-500",
    x: "77%",
    y: "27%",
    compactX: "72%",
    compactY: "32%",
  },
  {
    id: "bv",
    label: "Brașov",
    city: "Brașov",
    count: 12,
    risk: "Scăzut",
    color: "bg-sky-500",
    x: "53%",
    y: "55%",
    compactX: "50%",
    compactY: "54%",
  },
  {
    id: "ct",
    label: "Constanța",
    city: "Constanța",
    count: 6,
    risk: "Scăzut",
    color: "bg-emerald-500",
    x: "80%",
    y: "72%",
    compactX: "66%",
    compactY: "69%",
  },
  {
    id: "bc",
    label: "Bacău",
    city: "Bacău",
    count: 4,
    risk: "Mediu",
    color: "bg-amber-400",
    x: "66%",
    y: "40%",
    compactX: "58%",
    compactY: "43%",
  },
];

const signalsByRegion: Record<string, { title: string; category: string; confidence: number }[]> = {
  cj: [
    { title: "Ambalaje biodegradabile", category: "Producție", confidence: 82 },
    { title: "Platformă SaaS stocuri", category: "Tehnologie", confidence: 70 },
  ],
  tm: [
    { title: "Pet sitting premium", category: "Pet Care", confidence: 84 },
    { title: "Servicii mobile grooming", category: "Servicii", confidence: 76 },
  ],
  is: [
    { title: "Extindere capacitate producție", category: "Agricultură", confidence: 88 },
    { title: "Lanț scurt bio retail", category: "Retail", confidence: 74 },
  ],
  bv: [
    { title: "Turism pet-friendly", category: "Turism", confidence: 79 },
    { title: "Curierat eco local", category: "Logistică", confidence: 73 },
  ],
  ct: [
    { title: "Servicii nautice premium", category: "Turism", confidence: 71 },
    { title: "Food kiosk sezonier", category: "HoReCa", confidence: 68 },
  ],
  bc: [
    { title: "Reciclare ambalaje", category: "Sustenabilitate", confidence: 66 },
    { title: "Centru fitness cartier", category: "Wellness", confidence: 72 },
  ],
};

export function QuickExploreMap({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [activeId, setActiveId] = useState("bv");
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const activeHotspot = hotspots.find((item) => item.id === activeId) ?? hotspots[0];
  const activeSignals = useMemo(() => signalsByRegion[activeHotspot.id] ?? [], [activeHotspot.id]);

  const handleSelectHotspot = (id: string) => {
    setActiveId(id);
    setDetailsVisible(true);
  };

  if (compact) {
    return (
      <div className="relative aspect-[1/1] min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <MapSurface compact activeId={activeId} onSelect={handleSelectHotspot} />
        <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
          <div className="font-semibold text-slate-800">{activeHotspot.city}</div>
          <div className="text-slate-500">{activeHotspot.count} oportunități relevante</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-5 ${detailsVisible ? "xl:grid-cols-[280px_minmax(0,1fr)_320px]" : "xl:grid-cols-[280px_minmax(0,1fr)]"}`}>
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Filtre hartă</h2>
          <button
            type="button"
            onClick={() => {
              setActiveId("bv");
              setDetailsVisible(true);
            }}
            className="text-xs font-semibold text-[#0b5c66]"
          >
            Resetează toate
          </button>
        </div>
        <div className="space-y-3">
          {["Județ", "Localitate", "Categorie", "Nivel investiție", "Risc", "Stadiu semnal"].map((label) => (
            <div key={label} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">Toate opțiunile</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 text-sm font-bold text-slate-800">Semnale selectate în zonă</div>
          <div className="space-y-2">
            {activeSignals.map((signal) => (
              <div key={signal.title} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                <div className="text-sm font-semibold text-slate-800">{signal.title}</div>
                <div className="text-xs text-slate-500">{signal.category}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Explorare rapidă pe hartă</h2>
            <p className="text-sm text-slate-500">Un tool secundar pentru a identifica rapid densitatea de oportunități.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSimplifiedMode((value) => !value)}
            className="rounded-xl border-slate-200 text-slate-700"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            {simplifiedMode ? "Mod detaliat" : "Mod simplificat"}
          </Button>
        </div>
        <MapSurface activeId={activeId} onSelect={handleSelectHotspot} simplifiedMode={simplifiedMode} />
        {!simplifiedMode ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <Legend color="bg-emerald-500" label="1-10 oportunități" />
            <Legend color="bg-sky-500" label="11-15 oportunități" />
            <Legend color="bg-violet-500" label="16+" />
            <Legend color="bg-amber-400" label="Risc mediu" />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Modul simplificat păstrează doar zonele principale și hotspotul activ.
          </div>
        )}
      </section>

      {detailsVisible ? (
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Oportunități în zona selectată</h2>
            <button
              type="button"
              onClick={() => setDetailsVisible(false)}
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label="Ascunde panoul cu oportunitățile din zonă"
            >
              ×
            </button>
          </div>
          <div className="mb-3 rounded-xl bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-700">
            {activeHotspot.count} oportunități în {activeHotspot.city}
          </div>
          <div className="space-y-3">
            {activeSignals.map((signal) => (
              <div key={signal.title} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">{signal.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{signal.category}</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {signal.confidence}% încredere
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <MiniMetric label="Cerere" value="Ridicată" />
                  <MiniMetric label="Interes" value="Activ" />
                  <MiniMetric label="Date" value={activeHotspot.risk === "Scăzut" ? "Bune" : "Medii"} />
                </div>
              </div>
            ))}
          </div>
          <Button asChild className="mt-4 w-full rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]">
            <Link href="/semnale">
              Vezi toate oportunitățile
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
        </aside>
      ) : null}
    </div>
  );
}

function MapSurface({
  activeId,
  onSelect,
  compact = false,
  simplifiedMode = false,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
  simplifiedMode?: boolean;
}) {
  const romaniaMapImage =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Romania_location_map.svg/960px-Romania_location_map.svg.png";
  const mapFrameClass = compact
    ? "absolute left-1/2 top-1/2 z-0 h-[96%] w-[92%] -translate-x-1/2 -translate-y-1/2"
    : "absolute left-1/2 top-1/2 z-0 h-[88%] w-[82%] -translate-x-1/2 -translate-y-1/2";

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#eef5f7] ${compact ? "h-full" : "h-[520px]"}`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),rgba(238,245,247,0.95))]" />
      <div className={mapFrameClass}>
        <img
          src={romaniaMapImage}
          alt="Hartă România"
          className="absolute inset-0 h-full w-full object-contain opacity-95"
        />
        <svg viewBox="0 0 900 620" className="absolute inset-0 h-full w-full">
          <path d="M0 0h900v620" fill="transparent" />
          <text x="455" y="335" textAnchor="middle" className="fill-slate-400 text-[18px] font-semibold tracking-[0.28em]">
            ROMÂNIA
          </text>
        </svg>

        {hotspots.map((hotspot) => {
          const active = hotspot.id === activeId;
          const shouldShowLabel = !compact && (!simplifiedMode || active);
          return (
            <button
              key={hotspot.id}
              onClick={() => onSelect(hotspot.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: compact ? (hotspot.compactX ?? hotspot.x) : hotspot.x,
                top: compact ? (hotspot.compactY ?? hotspot.y) : hotspot.y,
              }}
            >
              <span className={`absolute inset-0 rounded-full blur-md ${hotspot.color} ${active ? "opacity-40" : "opacity-25"}`} />
              <span
                className={`relative flex ${compact ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm"} items-center justify-center rounded-full font-bold text-white shadow-lg transition-transform ${
                  hotspot.color
                } ${active ? "scale-110 ring-4 ring-white" : "scale-100"}`}
              >
                {hotspot.count}
              </span>
              {shouldShowLabel && (
                <span className="mt-2 block text-xs font-semibold text-slate-700">
                  {hotspot.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div className="text-sm font-bold text-slate-800">{hotspots.find((item) => item.id === activeId)?.city}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={12} />
            Tool rapid de explorare, nu hartă operațională completă
          </div>
        </div>
      )}

      {compact && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
          România
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="font-medium text-slate-600">{label}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-700">{value}</div>
    </div>
  );
}
