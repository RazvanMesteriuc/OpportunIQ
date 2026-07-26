import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Eye, FileText, Flame, ShieldCheck, X } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/lib/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useLocale } from "@/lib/locale";

// Persist IDs already toasted across reloads so we never re-pop the same item.
const TOASTED_IDS_KEY = "opp_notifications_toasted_ids";
const TOASTED_IDS_MAX = 200;
const TOPBAR_OVERLAY_EVENT = "opp-topbar-overlay-open";

function readToastedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(TOASTED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.slice(-TOASTED_IDS_MAX) : []);
  } catch {
    return new Set();
  }
}

function writeToastedIds(ids: Set<string>) {
  try {
    const arr = Array.from(ids).slice(-TOASTED_IDS_MAX);
    localStorage.setItem(TOASTED_IDS_KEY, JSON.stringify(arr));
  } catch {}
}

function timeAgo(iso: string, locale: "ro" | "en"): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (locale === "en") {
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }
  if (m < 1) return "acum";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}z`;
}

function ItemIcon({ kind }: { kind: NotificationItem["kind"] }) {
  if (kind === "report") {
    return (
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-emerald-500" />
      </div>
    );
  }
  if (kind === "watch_signal") {
    return (
      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
        <Eye className="h-4 w-4 text-sky-500" />
      </div>
    );
  }
  if (kind === "company_activity") {
    return (
      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
        <ShieldCheck className="h-4 w-4 text-violet-500" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
      <Flame className="h-4 w-4 text-orange-500" />
    </div>
  );
}

export function NotificationBell() {
  const { items, unreadCount, markAllRead } = useNotifications();
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Persisted set of IDs we have already toasted — survives reloads
  const toastedIdsRef = useRef<Set<string>>(readToastedIds());
  // First mount baseline: anything currently in the list is treated as "already seen"
  // so opening a fresh tab doesn't pop a wall of toasts for old items.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      let changed = false;
      items.forEach((it) => {
        if (!toastedIdsRef.current.has(it.id)) {
          toastedIdsRef.current.add(it.id);
          changed = true;
        }
      });
      if (changed) writeToastedIds(toastedIdsRef.current);
      initializedRef.current = true;
      return;
    }
    // Only items we've never toasted before (across all tabs/sessions for this device)
    // AND that arrived in the last 10 minutes — anything older is "stale catch-up", skip.
    const cutoff = Date.now() - 10 * 60_000;
    const fresh = items.filter(
      (it) =>
        !toastedIdsRef.current.has(it.id) &&
        new Date(it.timestamp).getTime() > cutoff,
    );
    fresh.slice(0, 3).forEach((it) => {
      const isReport = it.kind === "report";
      toast({
        title: isReport
          ? (isEn ? "New market signal published" : "Semnal de piață nou publicat")
          : it.kind === "watch_signal"
            ? (isEn ? "Watchlist alert" : "Alertă watchlist")
            : it.kind === "company_activity"
              ? (isEn ? "Tracked company" : "Firmă urmărită")
              : (isEn ? "Trending article" : "Articol în trending"),
        description: `${it.title} · ${it.subtitle}`,
        duration: 8000,
        action: (
          <ToastAction
            altText={isEn ? "Open" : "Deschide"}
            onClick={() => navigate(it.href)}
            className="font-semibold"
          >
            {isEn ? "Open" : "Deschide"}
          </ToastAction>
        ),
      });
    });
    if (fresh.length > 0) {
      fresh.forEach((it) => toastedIdsRef.current.add(it.id));
      writeToastedIds(toastedIdsRef.current);
    }
  }, [items, toast, navigate]);

  // Click outside closes dropdown
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const handleOverlayOpen = (event: Event) => {
      const source = (event as CustomEvent<{ source?: string }>).detail?.source;
      if (source !== "notifications") {
        setOpen(false);
      }
    };
    window.addEventListener(TOPBAR_OVERLAY_EVENT, handleOverlayOpen as EventListener);
    return () => {
      window.removeEventListener(TOPBAR_OVERLAY_EVENT, handleOverlayOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  function handleToggle() {
    setOpen((o) => {
      const next = !o;
      if (next) {
        markAllRead();
        window.dispatchEvent(new CustomEvent(TOPBAR_OVERLAY_EVENT, {
          detail: { source: "notifications" },
        }));
      }
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-white transition-colors hover:bg-white/14"
        aria-label={isEn ? `Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ""}` : `Notificări${unreadCount > 0 ? ` (${unreadCount} noi)` : ""}`}
        title={isEn ? "Notifications" : "Notificări"}
        data-testid="btn-notifications"
      >
        <Bell className="h-4 w-4 text-white/90" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-[#0b5c66]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-[130] mt-2 max-h-[480px] w-[calc(100vw-1rem)] max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
          role="dialog"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-orange-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{isEn ? "Notifications" : "Notificări"}</p>
              <p className="text-[10px] text-slate-500">{isEn ? "New signals, watchlist and relevant activity" : "Semnale noi, watchlist și activitate relevantă"}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-slate-100"
              aria-label={isEn ? "Close" : "Închide"}
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-500">{isEn ? "Nothing new right now." : "Nimic nou momentan."}</p>
                <p className="mt-1 text-[10px] text-slate-400">{isEn ? "New signals, watchlist items and company activity appear here." : "Aici apar semnale noi, semnale din watchlist și activitate de firmă."}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((it) => (
                  <li key={it.id}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <ItemIcon kind={it.kind} />
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">{it.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{it.subtitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">
                            {it.kind === "report" ? (isEn ? "Market signal" : "Semnal de piata") : it.kind === "watch_signal" ? "Watchlist" : it.kind === "company_activity" ? (isEn ? "Tracked company" : "Firmă urmărită") : "Trending"}
                          </span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-slate-500">{timeAgo(it.timestamp, locale)}</span>
                          {typeof it.score === "number" && it.kind === "report" && (
                            <>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] font-bold text-emerald-500">{it.score}</span>
                            </>
                          )}
                          {it.kind === "trending_article" && typeof it.score === "number" && (
                            <>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] font-bold text-orange-500">+{it.score}</span>
                            </>
                          )}
                          {(it.kind === "watch_signal" || it.kind === "company_activity") && typeof it.score === "number" && (
                            <>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className={`text-[10px] font-bold ${it.kind === "watch_signal" ? "text-sky-500" : "text-violet-500"}`}>{it.score}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">
            <Link
              href="/semnale"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-emerald-500 hover:underline"
            >
              {isEn ? "View signals" : "Vezi semnalele"} →
            </Link>
            <Link
              href="/mesaje"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-orange-500 hover:underline"
            >
              {isEn ? "View messages" : "Vezi mesajele"} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
