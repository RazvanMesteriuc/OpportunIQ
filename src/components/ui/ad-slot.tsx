interface AdSlotProps {
  slot?: string;
  format?: "horizontal" | "rectangle" | "vertical" | "in-feed";
  className?: string;
  label?: string;
}

import { useLocale } from "@/lib/locale";

const PLACEHOLDER_CONTENT: Record<string, { w: number; h: number; label: string }> = {
  horizontal: { w: 728, h: 90, label: "728 × 90 — Leaderboard" },
  rectangle: { w: 300, h: 250, label: "300 × 250 — Medium Rectangle" },
  vertical: { w: 300, h: 400, label: "300 × 400 — Sidebar Ad" },
  "in-feed": { w: 580, h: 100, label: "In-Feed Ad" },
};

const DEMO_ADS = [
  {
    title: "Atlas Cloud Romania",
    subtitle: "Migrare infrastructură, backup și audit cloud pentru IMM-uri",
    cta: "Solicită ofertă",
    sponsor: "Publicitate plătită",
    theme: "from-sky-600 via-cyan-500 to-blue-500",
  },
  {
    title: "Delta Eco Tours",
    subtitle: "Pachete corporate și retreat-uri premium în Delta Dunării",
    cta: "Vezi pachetele",
    sponsor: "Campanie sponsorizată",
    theme: "from-emerald-600 via-teal-500 to-cyan-500",
  },
];

export function AdSlot({ format = "rectangle", className = "", label }: AdSlotProps) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const placeholder = PLACEHOLDER_CONTENT[format] ?? PLACEHOLDER_CONTENT.rectangle;
  const hashSeed = `${format}:${label ?? ""}`.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const creative = DEMO_ADS[hashSeed % DEMO_ADS.length];
  const localizedCreative = isEn
    ? {
        ...creative,
        subtitle: creative.title === "Atlas Cloud Romania"
          ? "Infrastructure migration, backup and cloud audit for SMEs"
          : "Corporate packages and premium retreats in the Danube Delta",
        cta: creative.title === "Atlas Cloud Romania" ? "Request quote" : "View packages",
        sponsor: creative.title === "Atlas Cloud Romania" ? "Paid advertisement" : "Sponsored campaign",
      }
    : creative;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border border-border/40 ${className}`}
      style={{ minHeight: `${placeholder.h}px` }}
      aria-label={isEn ? "Advertisement" : "Publicitate"}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${localizedCreative.theme}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_28%)]" />
      <div className={`relative flex flex-1 w-full ${format === "horizontal" || format === "in-feed" ? "flex-row flex-wrap sm:flex-nowrap items-center justify-between gap-4" : "flex-col gap-3"} p-5 text-white`}>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
            {localizedCreative.sponsor}
          </p>
          <p className="text-sm font-black leading-tight mb-1.5">{localizedCreative.title}</p>
          <p className="max-w-xl text-xs leading-relaxed text-white/85">
            {localizedCreative.subtitle}
          </p>
          <p className={`text-[10px] font-semibold text-white/50 ${format === "horizontal" || format === "in-feed" ? "mt-1" : "mt-4"}`}>
            {label ?? placeholder.label}
          </p>
        </div>
        <div className={`shrink-0 rounded-full border border-white/30 bg-white/12 px-4 py-2 text-[11px] font-bold backdrop-blur-sm text-center hover:bg-white/20 transition-colors cursor-pointer ${format === "horizontal" || format === "in-feed" ? "" : "w-full mt-auto"}`}>
          {localizedCreative.cta}
        </div>
      </div>
    </div>
  );
}
