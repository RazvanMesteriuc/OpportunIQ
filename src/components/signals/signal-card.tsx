import { MapPin, Users, Heart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useMarketWatchlist } from "@/lib/market-watchlist";

export interface SignalCardProps {
  id: string;
  category: string;
  categoryIcon: React.ReactNode;
  categoryColor: string;
  location: string;
  title: string;
  description: string;
  tags: { icon: React.ReactNode; label: string }[];
  score: number;
  interestedCount: number;
  isRecommended?: boolean;
  artwork?: React.ReactNode;
  imageUrl?: string;
  badgeClassName?: string;
  badgeTextClassName?: string;
  accentClassName?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  tertiaryActionLabel?: string;
  tertiaryActionHref?: string;
  interestedLabel?: string;
}

export function SignalCard({
  id,
  category,
  categoryIcon,
  categoryColor,
  location,
  title,
  description,
  tags,
  score,
  interestedCount,
  isRecommended = false,
  artwork,
  imageUrl,
  badgeClassName = "bg-slate-50 border-slate-200",
  badgeTextClassName = "text-slate-700",
  secondaryActionLabel = "Mă interesează",
  secondaryActionHref,
  primaryActionLabel = "Vezi detalii",
  primaryActionHref,
  tertiaryActionLabel,
  tertiaryActionHref,
  interestedLabel = "interes agregat",
}: SignalCardProps) {
  const resolvedPrimaryHref = primaryActionHref ?? `/semnale/${id}`;
  const { watchSet, toggleItem } = useMarketWatchlist();
  const watchlistKey = `signal:${id}`;
  const isWatchlisted = watchSet.has(watchlistKey);
  const resolvedSecondaryLabel =
    !secondaryActionHref && secondaryActionLabel === "Mă interesează"
      ? isWatchlisted
        ? "În urmărire"
        : "Mă interesează"
      : secondaryActionLabel;

  const handleToggleWatchlist = () => {
    toggleItem({
      key: watchlistKey,
      type: "report",
      label: title,
      href: resolvedPrimaryHref,
      city: location,
      niche: category,
      meta: {
        signalId: id,
        source: "signal_card",
      },
    });
  };

  return (
    <div className="relative rounded-[22px] border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
        <div className="shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-24 w-24 rounded-[22px] object-cover shadow-sm ring-1 ring-slate-200"
            />
          ) : artwork ? (
            artwork
          ) : (
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${categoryColor}`}>
              {categoryIcon}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isRecommended && (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                Recomandat
              </span>
            )}
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClassName} ${badgeTextClassName}`}>
              {category}
            </span>
            <div className="flex items-center text-sm text-slate-500">
              <MapPin size={14} className="mr-1" />
              {location}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              <ShieldCheck size={12} />
              Date validate
            </span>
          </div>

          <h3 className="mb-2 mt-1 text-xl font-bold text-slate-900">{title}</h3>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>

          <div className="mt-auto flex flex-wrap items-center gap-2">
            {tags.map((tag, idx) => (
              <div
                key={idx}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                <span className="mr-1.5 text-slate-400">{tag.icon}</span>
                {tag.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 lg:w-[270px]">
          <div className="mb-4 flex flex-row items-center justify-between lg:flex-col">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Scor semnal</span>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold leading-none text-[#0b5c66]">{score}</span>
                <span className="ml-1 text-sm font-medium text-slate-400">/100</span>
              </div>
              <div className="mt-2 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-4 rounded-full ${i < Math.round(score / 20) ? "bg-[#0b5c66]" : "bg-slate-200"}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center rounded-full bg-white px-3 py-2 text-sm text-slate-600 shadow-sm lg:mt-4">
              <Users size={16} className="mr-1.5 text-slate-400" />
              <span className="font-medium">{interestedCount}</span>
              <span className="ml-1 hidden lg:inline">{interestedLabel}</span>
              <span className="ml-1 lg:hidden">interes</span>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {tertiaryActionLabel && tertiaryActionHref ? (
              <Link href={tertiaryActionHref} className="text-center text-sm font-semibold text-[#0b5c66] hover:text-[#084b53]">
                {tertiaryActionLabel}
              </Link>
            ) : null}
            {secondaryActionHref ? (
              <Button asChild variant="outline" className="w-full justify-center border-[#0b5c66]/30 text-[#0b5c66] hover:bg-[#0b5c66]/5">
                <Link href={secondaryActionHref}>
                  <Heart size={16} className="mr-2" />
                  {resolvedSecondaryLabel}
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleToggleWatchlist}
                className={`w-full justify-center border-[#0b5c66]/30 text-[#0b5c66] hover:bg-[#0b5c66]/5 ${
                  isWatchlisted ? "bg-[#0b5c66]/5" : ""
                }`}
              >
                <Heart size={16} className="mr-2" />
                {resolvedSecondaryLabel}
              </Button>
            )}
            <Button asChild className="w-full justify-center bg-[#0b5c66] text-white hover:bg-[#084b53]">
              <Link href={resolvedPrimaryHref}>
                {primaryActionLabel} <span className="ml-2">›</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
