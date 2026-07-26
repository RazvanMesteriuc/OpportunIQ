import { Link } from "wouter";
import { Flame, FileText, TrendingUp } from "lucide-react";
import { useNotifications } from "@/lib/use-notifications";
import { useLocale } from "@/lib/locale";

export function TrendingMarquee() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const { items } = useNotifications();
  const trending = items.filter((it) => it.kind === "trending_article").slice(0, 12);
  const reports = items.filter((it) => it.kind === "report").slice(0, 8);
  const merged = [...trending, ...reports];

  // Empty-state fallback: keep the strip visible but show a neutral placeholder line so the
  // layout doesn't shift between visits. Avoids a flicker when notifications haven't loaded yet.
  if (merged.length === 0) {
    return (
      <div className="w-full bg-card border-b border-border/40 py-2 overflow-hidden">
        <div className="container mx-auto max-w-7xl flex items-center gap-3 px-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">{isEn ? "Trending now" : "Trending acum"}</span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {isEn ? "Popular articles and market reports will appear here. Check back soon — we update every hour." : "Aici vor apărea articolele şi rapoartele de piață populare. Revino în curând — actualizăm la fiecare oră."}
          </span>
        </div>
      </div>
    );
  }

  // Duplicate items so the CSS keyframe `marquee` (translateX -50%) loops seamlessly.
  const loop = [...merged, ...merged];

  return (
    <div className="w-full bg-card border-b border-border/40 py-2 overflow-hidden relative group">
      <div className="container mx-auto max-w-7xl flex items-center gap-3 px-4">
        <div className="flex items-center gap-1.5 shrink-0 z-10 bg-card pr-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{isEn ? "Trending now" : "Trending acum"}</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {/* fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10" />

          <div
            className="flex gap-6 whitespace-nowrap animate-marquee"
            style={{ animationDuration: `${Math.max(40, loop.length * 4)}s` }}
          >
            {loop.map((it, i) => (
              <Link
                key={`${it.id}-${i}`}
                href={it.href}
                className="inline-flex items-center gap-2 text-xs hover:text-primary transition-colors shrink-0"
              >
                {it.kind === "trending_article" ? (
                  <Flame className="h-3 w-3 text-primary" />
                ) : (
                  <FileText className="h-3 w-3 text-primary/70" />
                )}
                <span className="font-semibold text-foreground/90 truncate max-w-[280px]">{it.title}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{it.subtitle}</span>
                <span className="text-muted-foreground/40">|</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
