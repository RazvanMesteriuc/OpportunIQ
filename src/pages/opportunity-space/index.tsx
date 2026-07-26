import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import {
  buildSignalPath,
  buildMatchesPath,
  getOpportunitySurfaceState,
  getOpportunitySpaceBySignalId,
  type OpportunityRequirement,
} from "@/lib/mock-opportunity-space";
import { buildOpportunitySurfaceSnapshot } from "@/lib/opportunity-surface-contract";
import { useOpportunityWorkspace } from "@/lib/opportunity-workspace";
import { useProfile } from "@/lib/use-profile";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  CircleDot,
  Eye,
  FileText,
  LockKeyhole,
  MapPin,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Link, useRoute } from "wouter";

const stageOrder = ["idea", "validation", "plan", "pitch"] as const;

export default function OpportunitySpacePage() {
  const [matched, params] = useRoute("/semnale/:id/oportunitate");
  const record = getOpportunitySpaceBySignalId(matched ? params.id : null);
  const { profile } = useProfile();
  const workspace = useOpportunityWorkspace(
    record.signalId,
    {
      stage: record.stage,
      pitchCompletionPct: record.pitch.completionPct,
      currentNeedLabel: record.currentNeed.label,
      currentNeedDescription: record.currentNeed.description,
      ask: record.pitch.ask,
    },
    profile.setup,
  );
  const effectiveStage = workspace.effectiveStage;
  const currentStageIndex = stageOrder.indexOf(effectiveStage);
  const effectivePitchCompletionPct = workspace.effectivePitchCompletionPct;
  const effectiveNeedLabel = workspace.draft?.currentNeedLabel ?? record.currentNeed.label;
  const effectiveNeedDescription = workspace.draft?.currentNeedDescription ?? record.currentNeed.description;
  const effectiveAsk = workspace.draft?.ask ?? record.pitch.ask;
  const savedAt = workspace.draft?.updatedAt ?? null;
  const primaryMatch = record.matchPreview[0] ?? null;
  const readinessPct = Math.max(record.readinessPct, effectivePitchCompletionPct);
  const surfaceState = getOpportunitySurfaceState({
    stage: effectiveStage,
    readinessPct,
    discussionReady: workspace.discussionReady,
  });
  const surfaceSnapshot = buildOpportunitySurfaceSnapshot({
    signalId: record.signalId,
    currentTier: workspace.opportunityVisibilityPolicy.currentTier,
    publicBoard: record.publicBoard,
    partnerView: record.partnerView,
    privatePitch: {
      title: record.pitch.title,
      summary: record.pitch.summary,
      ask: effectiveAsk,
      useOfFunds: record.pitch.useOfFunds,
      currentNeedLabel: effectiveNeedLabel,
      currentNeedDescription: effectiveNeedDescription,
      pitchCompletionPct: effectivePitchCompletionPct,
    },
  });

  const handleSaveWorkspace = () => {
    workspace.saveDraft();
  };

  const handleProgressPitch = () => {
    workspace.progressPitch(14);
  };

  const handleRequestIntroduction = () => {
    if (!primaryMatch) return;
    workspace.requestIntroduction({
      targetEntityType: primaryMatch.entityType,
      targetEntityId: primaryMatch.entityId,
      targetLabel: primaryMatch.anonymousLabel,
      note: effectiveAsk,
    });
  };

  return (
    <PublicLayout>
      <div className="space-y-5">
        <Link href={buildSignalPath(record.signalId)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b5c66]">
          <ChevronLeft size={16} />
          Înapoi la semnal
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <img
                src={record.imageUrl}
                alt={record.signalTitle}
                className="hidden h-24 w-24 shrink-0 rounded-[24px] object-cover shadow-sm ring-1 ring-slate-200 md:block"
              />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    Spațiu de oportunitate
                  </span>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">
                    {record.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <MapPin size={12} />
                    {record.location}, {record.county}
                  </span>
                </div>

                <h1 className="max-w-4xl text-[32px] font-bold leading-tight text-slate-900">
                  Spațiu de oportunitate
                </h1>

                <div className="text-lg font-semibold text-slate-900">{record.title}</div>

                <p className="max-w-4xl text-sm leading-7 text-slate-600">
                  Construiește ideea pas cu pas, cu semnale, dovezi și potriviri relevante.
                </p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rezumat public</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{surfaceSnapshot.publicBoard.investorHook}</div>
                  <div className="mt-2 text-sm text-slate-600">{getOpportunityArenaCopy(surfaceState)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {record.evidencePillars.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid min-w-[240px] grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pregătire pentru discuție</div>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-4xl font-bold text-[#0b5c66]">{readinessPct}</span>
                  <span className="pb-1 text-sm text-slate-400">%</span>
                </div>
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {workspace.discussionReady ? "Pregătită pentru discuții" : "În lucru"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Stadiu" value={effectiveStage} />
                <Metric label="Pitch" value={`${effectivePitchCompletionPct}%`} />
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pe scurt</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{getOpportunityArenaTitle(surfaceState)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maturizare oportunitate</div>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{getOpportunityArenaTitle(surfaceState)}</h2>
            </div>
            <div className="text-sm text-slate-600">{surfaceSnapshot.activeTierNote}</div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { id: "idea", label: "Idee" },
              { id: "validation", label: "Validare" },
              { id: "plan", label: "Plan" },
              { id: "pitch", label: "Pitch" },
            ].map((step, index) => {
              const isComplete = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    isCurrent
                      ? "border-[#0b5c66]/20 bg-[#0b5c66]/5"
                      : isComplete
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                        isCurrent
                          ? "border-[#0b5c66] bg-[#0b5c66] text-white"
                          : isComplete
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{step.label}</div>
                      <div className="text-xs text-slate-500">
                        {isCurrent ? "Stadiul activ" : isComplete ? "Completat" : "Urmează"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Eye size={14} />
                    Ce pot vedea ceilalți despre oportunitate
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-900">Rezumat public</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{surfaceSnapshot.publicBoard.publicSummary}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {surfaceSnapshot.publicBoard.sellabilityLabel}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <PublicBoardColumn
                  title="Ce pot înțelege ceilalți"
                  items={surfaceSnapshot.publicBoard.visibleStrengths}
                  tone="sky"
                />
                <PublicBoardColumn
                  title="Dovezi vizibile"
                  items={surfaceSnapshot.publicBoard.communityProof}
                  tone="emerald"
                />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <InfoCard
                icon={<Target size={18} />}
                title="Problema"
                body={record.problem}
              />
              <InfoCard
                icon={<Sparkles size={18} />}
                title="Soluția"
                body={record.solution}
              />
              <InfoCard
                icon={<FileText size={18} />}
                title="Dovezile"
                body={record.whyNow}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ce cauți acum</div>
                  <h2 className="mt-3 text-xl font-bold text-slate-900">{surfaceSnapshot.privatePitch.currentNeedLabel}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{surfaceSnapshot.privatePitch.currentNeedDescription}</p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  Următorul pas
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ce cauți acum</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{surfaceSnapshot.privatePitch.ask}</p>
                  <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Cum ai folosi resursele</div>
                  <div className="mt-3 space-y-2">
                    {surfaceSnapshot.privatePitch.useOfFunds.map((item) => (
                      <div key={item} className="inline-flex w-full items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-medium text-slate-700">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Users size={14} />
                    Cine poate ajuta mai departe
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{surfaceSnapshot.partnerSummary.headline}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{surfaceSnapshot.partnerSummary.suitableFor}</p>
                  <div className="mt-4 space-y-2">
                    {surfaceSnapshot.partnerSummary.builtAssets.map((item) => (
                      <div key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-4 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Milestone următor:</span> {surfaceSnapshot.partnerSummary.nextMilestone}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pași următori</h2>
                  <p className="mt-2 text-sm text-slate-600">Închide clarificările importante înainte să cauți potriviri sau să ceri o introducere.</p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  Bazat pe semnal real
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3">
                  {record.requirements.map((item) => (
                    <RequirementCard key={item.id} item={item} />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {record.partnerView.validationSignals.map((item) => (
                    <ValidationSignalCard key={item.label} label={item.label} note={item.note} strength={item.strength} />
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-800">Acțiuni</h2>
              <div className="space-y-2">
                <Button onClick={handleSaveWorkspace} className="w-full justify-center rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]">
                  Salvează spațiul
                </Button>
                <Button onClick={handleProgressPitch} variant="outline" className="w-full justify-center rounded-xl border-[#0b5c66]/20 text-[#0b5c66] hover:bg-teal-50">
                  Completează pitch
                </Button>
                <Button asChild variant="outline" className="w-full justify-center rounded-xl border-slate-200 text-slate-700">
                  <Link href={buildMatchesPath(record.signalId)}>
                    Trimite spre potriviri
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-800">Pregătire pentru discuție</h2>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CircleDot size={16} className="text-[#0b5c66]" />
                  {workspace.discussionReady ? "Poate intra în discuții" : "Mai are nevoie de clarificare"}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {workspace.discussionReady
                    ? "Structura este suficient de clară pentru a cere potriviri sau introduceri controlate."
                    : "Este aproape gata, dar fără câteva clarificări riști o introducere slabă și timp irosit."}
                </div>
              </div>
              {savedAt ? (
                <div className="mt-3 text-xs text-slate-400">
                  Ultima salvare: {new Date(savedAt).toLocaleString("ro-RO")}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-800">Ce lipsește</h2>
              <div className="space-y-2">
                {record.missingForDiscussion.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-800">Potrivirea principală acum</h2>
              {primaryMatch ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{primaryMatch.anonymousLabel}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {primaryMatch.locality ? `${primaryMatch.locality}, ` : ""}
                        {primaryMatch.county}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-[#0b5c66]">
                      {primaryMatch.score}%
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {primaryMatch.reasonLabels.map((label) => (
                      <span key={label} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {label}
                      </span>
                    ))}
                  </div>
                  <Button asChild variant="outline" className="mt-4 w-full justify-center rounded-xl border-slate-200 text-slate-700">
                    <Link href={buildMatchesPath(record.signalId)}>
                      Vezi toate potrivirile
                      <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  Nu există încă o potrivire suficient de clară.
                </div>
              )}
            </section>

            <section id="introducere-controlata" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-800">Introducere controlată</h2>
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="inline-flex items-center gap-2 text-sm font-bold text-amber-800">
                  <LockKeyhole size={16} />
                  {getIntroductionPanelTitle(workspace.introductionRequest?.status)}
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {workspace.introductionRequest
                    ? getIntroductionPanelBody(workspace.introductionRequest.status, workspace.introductionRequest.targetLabel)
                    : "Contactul nu se deschide direct. Introducerea se cere doar când oportunitatea este suficient de clară pentru o discuție utilă."}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {workspace.introductionRequest?.status === "accepted"
                    ? "Din acest moment, conversația controlată poate continua fără a expune public detaliile sensibile."
                    : "Detaliile complete sunt partajate doar după acceptarea introducerii."}
                </p>
              </div>
              {workspace.introductionRequest ? (
                <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  Cererea este în starea: <span className="font-semibold text-slate-900">{getIntroductionStatusLabel(workspace.introductionRequest.status)}</span>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {(workspace.introductionPolicy.decision === "allow"
                    ? ["Poți cere introducerea controlată către cea mai relevantă potrivire."]
                    : workspace.introductionPolicy.reasons).map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {!workspace.introductionRequest ? (
                <Button
                  onClick={handleRequestIntroduction}
                  disabled={workspace.introductionPolicy.decision !== "allow" || !primaryMatch}
                  className="mt-4 w-full rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]"
                >
                  {workspace.introductionPolicy.decision === "require_profile_completion"
                    ? "Completează profilul pentru introducere"
                    : "Solicită introducere"}
                </Button>
              ) : null}
            </section>

            <div className="text-center text-xs text-slate-400">
              Datele rămân agregate și anonime până la o introducere acceptată.
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-[#0b5c66]">{icon}</div>
      <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
    </section>
  );
}

function RequirementCard({ item }: { item: OpportunityRequirement }) {
  const tone =
    item.status === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : item.status === "next"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const label =
    item.status === "done" ? "Clarificat" : item.status === "next" ? "Urmează" : "Lipsește";

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-bold text-slate-900">{item.label}</div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}>{label}</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600">{item.note}</p>
    </article>
  );
}

function PublicBoardColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "sky" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "sky"
      ? "bg-sky-50 text-sky-700"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-amber-50 text-amber-700";

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{title}</div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationSignalCard({
  label,
  note,
  strength,
}: {
  label: string;
  note: string;
  strength: "strong" | "emerging" | "missing";
}) {
  const tone =
    strength === "strong"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : strength === "emerging"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const labelText =
    strength === "strong" ? "Puternic" : strength === "emerging" ? "În consolidare" : "Încă lipsă";

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-bold text-slate-900">{label}</div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}>{labelText}</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600">{note}</p>
    </article>
  );
}

function getOpportunityArenaCopy(
  state: ReturnType<typeof getOpportunitySurfaceState>,
): string {
  switch (state) {
    case "discussion_ready":
      return "Oportunitatea este pregătită pentru discuții și arată clar ce cauți acum, fără să expună informațiile private.";
    case "built_opportunity":
      return "Oportunitatea este deja clară pentru investitori sau parteneri, dar detaliile importante rămân protejate.";
    case "signal_with_direction":
      return "Există o direcție clară, dar încă este nevoie de validare înainte de discuții mai serioase.";
    default:
      return "Momentan merită urmărită și clarificată, nu prezentată ca o oportunitate pregătită pentru discuții.";
  }
}

function getOpportunityArenaTitle(
  state: ReturnType<typeof getOpportunitySurfaceState>,
): string {
  switch (state) {
    case "discussion_ready":
      return "Oportunitatea este pregătită pentru discuții";
    case "built_opportunity":
      return "Oportunitatea este deja clară";
    case "signal_with_direction":
      return "Există direcție, dar încă este nevoie de validare";
    default:
      return "Încă vorbim mai mult despre semnal decât despre oportunitate";
  }
}

function getIntroductionStatusLabel(status: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "acceptată";
    case "rejected":
      return "respinsă";
    case "expired":
      return "expirată";
    default:
      return "în așteptare";
  }
}

function getIntroductionPanelTitle(status?: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "Introducere acceptată";
    case "rejected":
      return "Introducere respinsă";
    case "expired":
      return "Introducere expirată";
    case "pending":
      return "Cerere de introducere în așteptare";
    default:
      return "Introducere controlată";
  }
}

function getIntroductionPanelBody(
  status: "pending" | "accepted" | "rejected" | "expired",
  targetLabel: string,
): string {
  switch (status) {
    case "accepted":
      return `Cererea către ${targetLabel} a fost acceptată, iar discuția poate continua în zona de mesaje controlate.`;
    case "rejected":
      return `Cererea către ${targetLabel} a fost respinsă, deci contactul rămâne închis și ai nevoie de altă potrivire sau mai multă claritate.`;
    case "expired":
      return `Cererea către ${targetLabel} a expirat înainte de acceptare, iar contactul rămâne blocat până la o nouă cerere eligibilă.`;
    default:
      return `Cererea către ${targetLabel} a fost creată și rămâne blocată până la acceptare.`;
  }
}
