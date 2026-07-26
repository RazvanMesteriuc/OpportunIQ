import {
  Boxes,
  Dumbbell,
  Leaf,
  PawPrint,
  Sprout,
} from "lucide-react";

type SignalArtworkVariant =
  | "pet-care"
  | "sustainable-packaging"
  | "outdoor-fitness"
  | "bio-retail"
  | "agri-expansion";

export function SignalArtwork({
  variant,
  className = "",
}: {
  variant: SignalArtworkVariant;
  className?: string;
}) {
  const config = getArtworkConfig(variant);

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br ${config.shell} ${className} shadow-[0_14px_34px_rgba(15,23,42,0.10)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.35),_transparent_32%)]" />
      <div className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur">
        Signal
      </div>
      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
      <div className="relative flex h-full w-full items-center justify-center p-3">
        <div className={`flex h-full w-full items-center justify-center rounded-[24px] border ${config.panelBorder} bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur`}>
          <div className="relative flex h-[72%] w-[72%] items-center justify-center">
            <div className={`absolute inset-0 rounded-[26px] bg-gradient-to-br ${config.coreGradient} shadow-[0_16px_30px_rgba(15,23,42,0.14)]`} />
            <div className="absolute inset-[9px] rounded-[20px] border border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]" />
            <config.Icon className="relative z-10 h-[44%] w-[44%] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]" strokeWidth={2.2} />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { SignalArtworkVariant };

function getArtworkConfig(variant: SignalArtworkVariant) {
  if (variant === "pet-care") {
    return {
      Icon: PawPrint,
      shell: "from-cyan-100 via-sky-50 to-teal-100",
      coreGradient: "from-[#1ea7c5] to-[#0b5c66]",
      panelBorder: "border-cyan-100/80",
    };
  }

  if (variant === "sustainable-packaging") {
    return {
      Icon: Boxes,
      shell: "from-violet-100 via-fuchsia-50 to-purple-100",
      coreGradient: "from-[#8b5cf6] to-[#6d28d9]",
      panelBorder: "border-violet-100/80",
    };
  }

  if (variant === "outdoor-fitness") {
    return {
      Icon: Dumbbell,
      shell: "from-amber-100 via-orange-50 to-rose-100",
      coreGradient: "from-[#f59e0b] to-[#ea580c]",
      panelBorder: "border-amber-100/80",
    };
  }

  if (variant === "bio-retail") {
    return {
      Icon: Leaf,
      shell: "from-emerald-100 via-lime-50 to-teal-100",
      coreGradient: "from-[#22c55e] to-[#0f766e]",
      panelBorder: "border-emerald-100/80",
    };
  }

  return {
    Icon: Sprout,
    shell: "from-emerald-100 via-sky-50 to-amber-100",
    coreGradient: "from-[#22c55e] to-[#0ea5e9]",
    panelBorder: "border-sky-100/80",
  };
}
