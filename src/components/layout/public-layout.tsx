import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Home, LogOut, Mail, PencilLine, Radio, Settings2, UserCircle2, Users } from "lucide-react";
import { LogoMark } from "@/components/branding/logo-mark";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearAuthToken } from "@/lib/auth-token";
import { useProfile } from "@/lib/use-profile";

const NAV_ITEMS = [
  { id: "home", href: "/", label: "Acasă", icon: Home },
  { id: "signals", href: "/semnale", label: "Semnale", icon: Radio },
  { id: "matches", href: "/potriviri", label: "Potriviri", icon: Users },
  { id: "messages", href: "/mesaje", label: "Mesaje", icon: Mail },
];

const TOPBAR_OVERLAY_EVENT = "opp-topbar-overlay-open";

function getRoleLabel(role?: string | null): string {
  return role === "partener" ? "Partener" : role === "antreprenor" ? "Antreprenor" : "Înrolare";
}

function getAvatarUrl(name?: string | null, email?: string | null, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  const seed = String(email || name || "opportuniq").trim();
  return `https://i.pravatar.cc/160?u=${encodeURIComponent(seed)}`;
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { profile, clearProfile } = useProfile();
  const [profileMenuResetTick, setProfileMenuResetTick] = useState(0);
  const profileComplete = profile.setup && Boolean(profile.name.trim() && profile.email.trim());
  const displayName = profile.name.trim() || "Finalizează profilul";
  const displayRole = getRoleLabel(profile.role);
  const avatarUrl = getAvatarUrl(profile.name, profile.email, profile.avatarUrl);
  const locationSummary = [profile.city, profile.judet].filter(Boolean).join(", ");

  useEffect(() => {
    const handleOverlayOpen = (event: Event) => {
      const source = (event as CustomEvent<{ source?: string }>).detail?.source;
      if (source !== "profile") {
        setProfileMenuResetTick((value) => value + 1);
      }
    };
    window.addEventListener(TOPBAR_OVERLAY_EVENT, handleOverlayOpen as EventListener);
    return () => {
      window.removeEventListener(TOPBAR_OVERLAY_EVENT, handleOverlayOpen as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      {/* Topbar */}
      <header className="bg-[#0b5c66] text-white sticky top-0 z-50">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <LogoMark className="h-8 w-8 text-white" />
            <span className="text-xl font-bold tracking-tight">OpportunIQ</span>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden md:flex h-full items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`h-full flex items-center gap-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive 
                      ? "border-white text-white" 
                      : "border-transparent text-white/70 hover:text-white hover:border-white/30"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <DropdownMenu key={`${location}:${profileMenuResetTick}`}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent(TOPBAR_OVERLAY_EVENT, {
                      detail: { source: "profile" },
                    }));
                  }}
                  className="flex items-center gap-3 rounded-full p-1.5 pr-2 transition-colors hover:bg-white/5"
                >
                  <img 
                    src={avatarUrl}
                    alt={displayName}
                    className="h-8 w-8 rounded-full border border-white/20 object-cover"
                  />
                  <div className="hidden lg:flex flex-col items-start leading-none">
                    <span className="text-sm font-semibold">{displayName}</span>
                    <span className="mt-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                      {displayRole}
                    </span>
                  </div>
                  <ChevronDown size={16} className="hidden text-white/70 lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="z-[140] w-[320px] rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl"
              >
                <DropdownMenuLabel className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="truncate text-sm font-bold text-slate-900">{displayName}</div>
                      <div className="truncate text-xs text-slate-500">{profile.email || "Completează emailul în onboarding"}</div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-[#0b5c66]">
                          {displayRole}
                        </span>
                        {locationSummary ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {locationSummary}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => navigate(profileComplete ? "/profil" : "/onboarding")}
                  className="cursor-pointer rounded-xl px-3 py-2 text-slate-700 focus:bg-slate-100"
                >
                  <UserCircle2 size={16} />
                  {profileComplete ? "Vezi profilul complet" : "Finalizează înrolarea"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/onboarding")}
                  className="cursor-pointer rounded-xl px-3 py-2 text-slate-700 focus:bg-slate-100"
                >
                  <PencilLine size={16} />
                  Editează datele profilului
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/mesaje")}
                  className="cursor-pointer rounded-xl px-3 py-2 text-slate-700 focus:bg-slate-100"
                >
                  <Mail size={16} />
                  Vezi mesajele controlate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/potriviri")}
                  className="cursor-pointer rounded-xl px-3 py-2 text-slate-700 focus:bg-slate-100"
                >
                  <Users size={16} />
                  Vezi potrivirile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => navigate("/profil")}
                  className="cursor-pointer rounded-xl px-3 py-2 text-slate-700 focus:bg-slate-100"
                >
                  <Settings2 size={16} />
                  Deschide pagina de profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    clearAuthToken();
                    clearProfile();
                    navigate("/onboarding");
                  }}
                  className="cursor-pointer rounded-xl px-3 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut size={16} />
                  Ieși din sesiune
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-[1600px] px-4 md:px-8 py-2 md:py-4">
        {children}
      </main>
    </div>
  );
}
