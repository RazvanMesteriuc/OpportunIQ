import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { getMockSignalById } from "@/lib/mock-signals";
import {
  buildSignalPath,
  buildOpportunityPath,
  buildMatchesPath,
  getOpportunitySpaceBySignalId,
  getOpportunitySurfaceState,
} from "@/lib/mock-opportunity-space";
import { useOpportunityWorkspace } from "@/lib/opportunity-workspace";
import { useProfile } from "@/lib/use-profile";
import { useMarketWatchlist } from "@/lib/market-watchlist";
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  Eye,
  LockKeyhole,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, useRoute } from "wouter";

const whyItems = [
  {
    title: "Cerere în creștere",
    description: "Volumul căutărilor și interesul online au crescut constant în ultimele 6 luni.",
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "Ofertă limitată",
    description: "Număr redus de furnizori activi și liste de așteptare în zonă.",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Review-uri negative",
    description: "Multe recenzii locale indică probleme de disponibilitate și încredere.",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Tendință pozitivă",
    description: "Cheltuielile pe animale de companie și servicii premium sunt în urcare.",
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Potrivit pentru zonă",
    description: "Densitatea proprietarilor de animale și puterea locală de cumpărare susțin testarea.",
    tone: "bg-cyan-50 text-cyan-700",
  },
];

const evidence = [
  { title: "Interes online (căutări)", value: "+32%", note: "în ultimele 6 luni" },
  { title: "Număr furnizori activi", value: "12", note: "în Cluj-Napoca" },
  { title: "Review-uri negative", value: "28%", note: "dintre recenzii" },
  { title: "Cheltuieli pentru animale", value: "+18%", note: "în ultimul an" },
];

const sourceBadges = ["INS", "ONRC", "Google Reviews", "TripAdvisor", "Google Trends"];

export default function SignalDetailPage() {
  const [matched, params] = useRoute("/semnale/:id");
  const signal = getMockSignalById(matched ? params.id : null);
  const opportunity = getOpportunitySpaceBySignalId(signal.id);
  const { profile } = useProfile();
  const workspace = useOpportunityWorkspace(
    signal.id,
    {
      stage: opportunity.stage,
      pitchCompletionPct: opportunity.pitch.completionPct,
      currentNeedLabel: opportunity.currentNeed.label,
      currentNeedDescription: opportunity.currentNeed.description,
      ask: opportunity.pitch.ask,
    },
    profile.setup,
  );
  const surfaceState = getOpportunitySurfaceState({
    stage: workspace.effectiveStage,
    readinessPct: recordReadiness(opportunity, workspace.effectivePitchCompletionPct),
    discussionReady: workspace.discussionReady,
  });
  const maturityCopy = getSignalMaturityCopy(surfaceState);
  const { watchSet, toggleItem } = useMarketWatchlist();
  const watchlistKey = `signal:${signal.id}`;
  const isWatchlisted = watchSet.has(watchlistKey);

  const handleToggleWatchlist = () => {
    toggleItem({
      key: watchlistKey,
      type: "report",
      label: signal.title,
      href: buildSignalPath(signal.id),
      city: signal.location,
      niche: signal.category,
      meta: {
        signalId: signal.id,
        source: "signal_detail",
      },
    });
  };

  return (
    <PublicLayout>
      <div className="space-y-5">
        <Link href="/semnale" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b5c66]">
          <ChevronLeft size={16} />
          Înapoi la semnale
        </Link>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={signal.imageUrl}
                    alt={signal.title}
                    className="hidden h-20 w-20 shrink-0 rounded-2xl object-cover lg:block"
                  />
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                        Semnal activ
                      </span>
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">
                        {signal.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin size={12} />
                        {signal.location}, {opportunity.county}
                      </span>
                    </div>

                    <h1 className="max-w-4xl text-[32px] font-bold leading-tight text-slate-900">
                      {signal.title}
                    </h1>

                    <p className="max-w-4xl text-sm leading-7 text-slate-600">
                      {signal.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {signal.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[230px] grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scor semnal</div>
                    <div className="mt-1 flex items-end gap-1">
                      <span className="text-4xl font-bold text-[#0b5c66]">{signal.score}</span>
                      <span className="pb-1 text-sm text-slate-400">/100</span>
                    </div>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {opportunity.confidenceLabel}
                    </span>
                  </div>
                  <QuickMetric label="Interes agregat" value={`${opportunity.followersCount}`} />
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">De ce contează</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{maturityCopy.title}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <NarrativeCard
                icon={<TrendingUp size={16} />}
                eyebrow="De ce contează acest semnal"
                title="Vedem o nevoie reală în piață"
                body={opportunity.whyNow}
                chips={whyItems.slice(0, 3).map((item) => item.title)}
              />
              <NarrativeCard
                icon={<Sparkles size={16} />}
                eyebrow="Ce business se poate construi"
                title={workspace.draft ? "Există deja o oportunitate în lucru" : "Semnalul poate deveni o oportunitate clară"}
                body={maturityCopy.body}
                chips={[opportunity.currentNeed.label, `Stadiu: ${workspace.effectiveStage}`, "Pas următor: dezvoltă oportunitatea"]}
              />
              <NarrativeCard
                icon={<Eye size={16} />}
                eyebrow="Pentru cine este relevant"
                title="Relevant pentru investitori, furnizori și parteneri"
                body={opportunity.publicBoard.publicSummary}
                chips={[opportunity.publicBoard.sellabilityLabel, "Rezumat public", "Fără informații private"]}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Dovezi și date</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Semnalul merită urmărit pentru că există date, reacție din piață și o oportunitate care poate fi testată.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {evidence.map((item) => (
                      <div key={item.title} className="rounded-2xl border border-slate-200 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.title}</div>
                        <div className="mt-2 text-3xl font-bold text-[#0b5c66]">{item.value}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.note}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {sourceBadges.map((source) => (
                      <span key={source} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rezumat public</div>
                  <div className="mt-3 space-y-3">
                    {opportunity.publicBoard.communityProof.slice(0, 3).map((item) => (
                      <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-800">Care este următorul pas</h2>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleToggleWatchlist}
                  className={`flex-1 rounded-xl border-[#0b5c66]/20 text-[#0b5c66] hover:bg-teal-50 ${
                    isWatchlisted ? "bg-[#0b5c66]/5" : ""
                  }`}
                >
                  <Bookmark size={15} className="mr-2" />
                  {isWatchlisted ? "În urmărire" : "Urmărește"}
                </Button>
                <Button asChild className="flex-1 rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]">
                  <Link href={buildOpportunityPath(signal.id)}>Construiește oportunitatea</Link>
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <ActionRow icon={<Users size={15} />} label="Vezi potriviri relevante" signalId={signal.id} />
                {workspace.discussionReady ? (
                  <ActionRow icon={<LockKeyhole size={15} />} label="Solicită introducere" signalId={signal.id} />
                ) : null}
              </div>
            </div>

            <SidePanel title="Următorul pas util">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Unde este acum</div>
                <div className="mt-2 text-base font-bold text-slate-900">{workspace.draft ? "Oportunitatea este deja în lucru" : "Încă ești în faza de analiză"}</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">{maturityCopy.body}</p>
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ce faci acum</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{workspace.draft ? effectiveNextStep(workspace.discussionReady) : "Deschide spațiul de oportunitate și definește ask-ul"}</div>
                <Button asChild variant="outline" className="mt-4 w-full justify-center rounded-xl border-slate-200 text-slate-700">
                  <Link href={buildOpportunityPath(signal.id)}>
                    Deschide oportunitatea
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </SidePanel>

            <SidePanel title="Introducere controlată">
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-amber-800">
                  <LockKeyhole size={15} />
                  {workspace.introductionRequest
                    ? getIntroductionSignalTitle(workspace.introductionRequest.status)
                    : "Acces controlat la contact"}
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {workspace.introductionRequest
                    ? getIntroductionSignalBody(workspace.introductionRequest.status)
                    : "Contactul rămâne blocat până când oportunitatea este suficient de clară și profilul este complet."}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {(workspace.introductionRequest
                  ? [`Țintă selectată: ${workspace.introductionRequest.targetLabel}`]
                  : workspace.eligibility.reasons.length
                    ? workspace.eligibility.reasons
                    : ["Poți cere introducerea din spațiul de oportunitate."]).map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </SidePanel>

            <SidePanel title="Informații private">
              <div className="space-y-2">
                {opportunity.publicBoard.confidentialBoundaries.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </SidePanel>

            <div className="text-center text-xs text-slate-400">
              Datele sunt agregate și anonime.
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function ActionRow({
  icon,
  label,
  signalId,
}: {
  icon: React.ReactNode;
  label: string;
  signalId: string;
}) {
  const href =
    label === "Vezi potriviri relevante"
      ? buildMatchesPath(signalId)
      : label === "Solicită introducere"
        ? buildOpportunityPath(signalId)
        : null;

  if (href) {
    return (
      <Link href={href} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
        <span className="text-[#0b5c66]">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
      <span className="text-[#0b5c66]">{icon}</span>
      {label}
    </button>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function NarrativeCard({
  icon,
  eyebrow,
  title,
  body,
  chips,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  chips: string[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-[#0b5c66]">{icon}</div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</div>
      <h2 className="mt-2 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function recordReadiness(opportunity: ReturnType<typeof getOpportunitySpaceBySignalId>, pitchPct: number): number {
  return Math.max(opportunity.readinessPct, Math.min(100, Math.round((opportunity.readinessPct + pitchPct) / 2)));
}

function getSignalMaturityCopy(
  state: ReturnType<typeof getOpportunitySurfaceState>,
): { title: string; body: string } {
  switch (state) {
    case "discussion_ready":
      return {
        title: "Ideea este pregătită pentru discuții.",
        body: "Un investitor sau partener poate înțelege rapid ce cauți acum și de ce merită o discuție, fără acces la informațiile private.",
      };
    case "built_opportunity":
      return {
        title: "Semnalul a devenit o oportunitate în lucru.",
        body: "Se văd clar problema, soluția și tipul de sprijin căutat, dar modul concret de execuție rămâne privat.",
      };
    case "signal_with_direction":
      return {
        title: "Există o direcție clară, dar încă este nevoie de validare.",
        body: "Terții pot vedea contextul și reacția pieței, dar oportunitatea nu este încă pregătită pentru o discuție completă.",
      };
    default:
      return {
        title: "Momentan vedem semnalul, nu o oportunitate clară.",
        body: "Datele spun că merită urmărit, dar încă nu există suficientă claritate pentru o discuție cu investitori sau parteneri.",
      };
  }
}

function effectiveNextStep(discussionReady: boolean): string {
  return discussionReady
    ? "Poți trimite spre potriviri sau cere o introducere controlată."
    : "Mai clarifică ask-ul și oferta minimă înainte de introduceri.";
}

function getIntroductionSignalTitle(status: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "Introducere acceptată";
    case "rejected":
      return "Introducere respinsă";
    case "expired":
      return "Introducere expirată";
    default:
      return "Cerere de introducere în așteptare";
  }
}

function getIntroductionSignalBody(status: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "Introducerea a fost acceptată, iar conversația controlată poate continua în zona de mesaje.";
    case "rejected":
      return "Introducerea a fost respinsă, deci contactul rămâne închis până când apare o potrivire mai bună sau mai multă claritate.";
    case "expired":
      return "Introducerea a expirat înainte de acceptare și trebuie refăcută doar dacă oportunitatea este din nou eligibilă.";
    default:
      return "Ai deja o cerere în așteptare. Conversația se deschide doar după acceptare.";
  }
}
