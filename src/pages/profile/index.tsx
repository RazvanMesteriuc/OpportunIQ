import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/use-profile";
import { Link } from "wouter";
import {
  Award,
  ChevronRight,
  Compass,
  Gem,
  HandHeart,
  Mail,
  MapPin,
  Network,
  PencilLine,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const badges = [
  { label: "Explorator", active: true, icon: Compass, tone: "from-sky-500 to-cyan-500" },
  { label: "Observator", active: false, icon: Award, tone: "from-slate-400 to-slate-500" },
  { label: "Conector", active: false, icon: Network, tone: "from-violet-500 to-indigo-500" },
  { label: "Susținător", active: false, icon: HandHeart, tone: "from-emerald-500 to-teal-500" },
  { label: "Vizionar", active: false, icon: Gem, tone: "from-amber-500 to-orange-500" },
];

const recentActivity = [
  {
    title: "Ai marcat o idee ca interesantă",
    subtitle: "Servicii de îngrijire pentru vârstnici la domiciliu",
    time: "2h în urmă",
  },
  {
    title: "Te-ai conectat cu un fondator",
    subtitle: "Ioana M. · EcoPack",
    time: "1 zi în urmă",
  },
  {
    title: "Ai trimis un mesaj",
    subtitle: "Către Andrei P. · AgriSmart",
    time: "2 zile în urmă",
  },
];

export default function ProfilePage() {
  const [investorActive, setInvestorActive] = useState(true);
  const { profile } = useProfile();
  const profileName = profile.name || "Profil în curs";
  const profileRole = profile.role === "partener" ? "Partener" : "Antreprenor";
  const profileAvatar = profile.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(profile.email || profile.name || "opportuniq")}`;
  const selectedIndustries = profile.industry ? [profile.industry] : ["Alege industriile din onboarding"];
  const selectedZones = [profile.city, profile.judet, ...(profile.counties ?? [])]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <PublicLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profilul meu</h1>
          <p className="text-sm text-slate-600">
            Gestionează-ți informațiile și preferințele pentru o experiență personalizată.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_320px_320px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={profileAvatar}
                  alt={profileName}
                  className="h-24 w-24 rounded-3xl object-cover ring-4 ring-sky-50 shadow-sm"
                />
                <div className="space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{profileName}</h2>
                    <span className="mt-2 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-[#0b5c66]">
                      {profileRole}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      {profile.email || "Completează emailul în onboarding"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      {profile.phone || "Adaugă telefonul în onboarding"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {[profile.city, profile.judet].filter(Boolean).join(", ") || "Alege localitatea principală"}
                    </div>
                  </div>
                </div>
              </div>

              <Button asChild variant="outline" className="rounded-xl border-[#0b5c66]/20 text-[#0b5c66] hover:bg-teal-50">
                <Link href="/onboarding" className="inline-flex items-center">
                  <PencilLine size={16} className="mr-2" />
                  Editează profil
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5">
              <TagSection
                title="Industrii selectate"
                items={selectedIndustries}
              />
              <TagSection
                title="Zone de interes"
                items={selectedZones.length ? selectedZones : ["Adaugă județe sau localități în onboarding"]}
                tone="slate"
              />

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Disponibilitate pentru potriviri</div>
                  <p className="text-sm text-slate-500">
                    {investorActive ? "Activ pentru potriviri și colaborări relevante." : "Pus pe pauză momentan pentru potriviri noi."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInvestorActive((value) => !value)}
                  className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${
                    investorActive ? "bg-[#0b5c66]" : "bg-slate-200"
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${investorActive ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div id="iq-points-section" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Sparkles size={16} className="text-[#0b5c66]" />
                Puncte IQ
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold text-slate-900">1.250</div>
                  <div className="mt-1 text-sm font-medium text-emerald-600">+120 această săptămână</div>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-100 border-t-[#0b5c66] text-[#0b5c66]">
                  <Sparkles size={24} />
                </div>
              </div>
              <Button
                variant="link"
                onClick={() => scrollToSection("iq-explainer-section")}
                className="mt-6 h-auto w-full justify-between p-0 text-[#0b5c66]"
              >
                Vezi istoricul punctelor
                <ChevronRight size={16} />
              </Button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-sm font-bold text-slate-700">Ce urmărești acum</div>
              <div className="flex flex-wrap gap-2">
                {["Semnale locale", "Oportunități în validare", "Investitori compatibili"].map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
              <Button
                variant="link"
                onClick={() => scrollToSection("recent-activity-section")}
                className="mt-4 h-auto p-0 text-[#0b5c66]"
              >
                Vezi activitatea legată de urmăririle tale <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-sm font-bold text-slate-700">Progres către următorul badge</div>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-[#0b5c66]">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900">Explorator</div>
                  <div className="text-sm text-slate-500">Mai sunt 250 puncte până la următorul badge</div>
                </div>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 w-[65%] rounded-full bg-[#0b5c66]" />
              </div>
              <div className="mt-2 text-right text-sm font-semibold text-slate-500">65%</div>
            </div>
          </section>

          <section id="iq-explainer-section" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-bold text-slate-700">Colecția mea de badge-uri</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className={`rounded-2xl border p-3 text-center ${
                    badge.active
                      ? "border-sky-100 bg-sky-50/70 shadow-sm"
                      : "border-slate-200 bg-slate-50/70 text-slate-500"
                  }`}
                >
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-sm ring-1 ring-slate-200">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${badge.tone} text-white shadow-sm`}>
                      <badge.icon size={18} />
                    </div>
                  </div>
                  <div className="text-xs font-semibold leading-snug text-slate-700">{badge.label}</div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {badge.active ? "Activ" : "În progres"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <section id="recent-activity-section" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-[#0b5c66]">
              <Sparkles size={26} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Cum funcționează punctele IQ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Câștigi puncte prin activități care aduc valoare comunității și ecosistemului OpportunIQ.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-slate-600">
              <div className="rounded-xl bg-slate-50 px-3 py-3">Explorează semnale</div>
              <div className="rounded-xl bg-slate-50 px-3 py-3">Interesează-te de idei</div>
              <div className="rounded-xl bg-slate-50 px-3 py-3">Conectează-te</div>
            </div>
            <Button asChild variant="link" className="mt-4 h-auto p-0 text-[#0b5c66]">
              <Link href="/semnale">
                Află mai multe <ChevronRight size={16} className="ml-1" />
              </Link>
            </Button>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Activitate recentă</h2>
            <div className="mt-4 space-y-4">
              {recentActivity.map((item) => (
                <div key={item.title} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-800">{item.title}</div>
                    <div className="text-sm text-slate-500">{item.subtitle}</div>
                  </div>
                  <div className="text-xs text-slate-400">{item.time}</div>
                </div>
              ))}
            </div>
            <Button asChild variant="link" className="mt-4 h-auto p-0 text-[#0b5c66]">
              <Link href="/mesaje">
                Vezi toată activitatea <ChevronRight size={16} className="ml-1" />
              </Link>
            </Button>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Rocket size={26} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Promovează-ți ideea</h2>
            <p className="mt-2 text-sm text-slate-600">
              Ai o idee cu potențial? Trimite-o comunității și conectează-te cu investitori și parteneri potriviți.
            </p>
            <Button asChild className="mt-6 w-full rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]">
              <Link href="/semnale/pet-care-home/oportunitate">Construiește o oportunitate</Link>
            </Button>
            <Button asChild variant="link" className="mt-4 h-auto p-0 text-[#0b5c66]">
              <Link href="/onboarding">
                Cum funcționează? <ChevronRight size={16} className="ml-1" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

function TagSection({
  title,
  items,
  tone = "teal",
}: {
  title: string;
  items: string[];
  tone?: "teal" | "slate";
}) {
  const toneClass =
    tone === "teal" ? "bg-teal-50 text-[#0b5c66]" : "bg-slate-100 text-slate-700";

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
