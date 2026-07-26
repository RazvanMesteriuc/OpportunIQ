import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getMockSignalById, messageSignal } from "@/lib/mock-signals";
import {
  listControlledMessages,
  useControlledMessagingInbox,
} from "@/lib/controlled-message-bridge";
import {
  ArrowUpRight,
  Building2,
  Clock3,
  LockKeyhole,
  MapPin,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const {
    threads,
    pendingRequests,
    recentRequests,
    threadPolicies,
    simulateAcceptRequest,
    simulateRejectRequest,
    sendMessage,
  } = useControlledMessagingInbox();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threads[0]?.id ?? null);
  const [draftMessage, setDraftMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastAcceptedRequestId, setLastAcceptedRequestId] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const searchNeedle = searchQuery.trim().toLowerCase();

  const filteredThreads = useMemo(() => {
    if (!searchNeedle) return threads;
    return threads.filter((thread) => {
      const signal = getMockSignalById(thread.signalId);
      return (
        thread.counterpartLabel.toLowerCase().includes(searchNeedle)
        || thread.preview.toLowerCase().includes(searchNeedle)
        || signal.title.toLowerCase().includes(searchNeedle)
      );
    });
  }, [searchNeedle, threads]);

  const filteredPendingRequests = useMemo(() => {
    if (!searchNeedle) return pendingRequests;
    return pendingRequests.filter((request) => {
      const signal = getMockSignalById(request.signalId);
      return (
        request.targetLabel.toLowerCase().includes(searchNeedle)
        || request.status.toLowerCase().includes(searchNeedle)
        || signal.title.toLowerCase().includes(searchNeedle)
      );
    });
  }, [pendingRequests, searchNeedle]);

  const filteredRecentRequests = useMemo(() => {
    if (!searchNeedle) return recentRequests;
    return recentRequests.filter((request) => {
      const signal = getMockSignalById(request.signalId);
      return (
        request.targetLabel.toLowerCase().includes(searchNeedle)
        || request.status.toLowerCase().includes(searchNeedle)
        || signal.title.toLowerCase().includes(searchNeedle)
      );
    });
  }, [recentRequests, searchNeedle]);

  useEffect(() => {
    if (!filteredThreads.length) {
      setSelectedThreadId(null);
      return;
    }
    if (!selectedThreadId || !filteredThreads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(filteredThreads[0]?.id ?? null);
    }
  }, [filteredThreads, selectedThreadId]);

  const selectedThread = useMemo(
    () => filteredThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [filteredThreads, selectedThreadId],
  );
  const selectedMessages = useMemo(
    () => (selectedThread ? listControlledMessages(selectedThread.id) : []),
    [selectedThread],
  );
  const contextSignal = getMockSignalById(
    selectedThread?.signalId ?? filteredPendingRequests[0]?.signalId ?? pendingRequests[0]?.signalId ?? messageSignal.id,
  );
  const selectedThreadPolicy = selectedThread ? threadPolicies[selectedThread.id] : null;

  useEffect(() => {
    if (!lastAcceptedRequestId) return;
    const nextThreadId = `thread-${lastAcceptedRequestId}`;
    const acceptedThread = threads.find((thread) => thread.id === nextThreadId);
    if (!acceptedThread) return;

    setSelectedThreadId(acceptedThread.id);
    window.requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
    toast({
      title: "Introducere acceptată",
      description: `Thread-ul cu ${acceptedThread.counterpartLabel} este deschis și pregătit pentru mesaj.`,
    });
    setLastAcceptedRequestId(null);
  }, [lastAcceptedRequestId, threads, toast]);

  const handleSendMessage = () => {
    if (!selectedThread || !draftMessage.trim() || selectedThreadPolicy?.canWrite !== "allow") return;
    const created = sendMessage(selectedThread.id, draftMessage);
    if (created) {
      setDraftMessage("");
      window.requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  };

  const focusPendingRequests = () => {
    document.getElementById("pending-requests-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleOpenThreadContext = () => {
    navigate(`/semnale/${contextSignal.id}/oportunitate`);
  };

  const handleInsertContextMessage = () => {
    setDraftMessage((current) => {
      if (current.trim()) return current;
      return "Trimit rezumatul public și pașii următori, ca să putem decide dacă merită un call scurt.";
    });
    window.requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  };

  const handleAcceptRequest = (requestId: string) => {
    const accepted = simulateAcceptRequest(requestId);
    if (!accepted) {
      toast({
        title: "Acceptarea a eșuat",
        description: "Introducerea nu a putut fi mutată în thread-ul local.",
        variant: "destructive",
      });
      return;
    }
    setLastAcceptedRequestId(requestId);
  };

  return (
    <PublicLayout>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">Mesaje</h1>
          <Button
            variant="outline"
            onClick={focusPendingRequests}
            className="mb-4 w-full rounded-xl border-[#0b5c66]/20 text-[#0b5c66] hover:bg-teal-50"
          >
            <LockKeyhole size={16} className="mr-2" />
            Introduceri controlate
          </Button>

          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Caută conversații..."
            />
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Thread-uri active
              </div>
              <div className="space-y-2">
                {filteredThreads.length ? (
                  filteredThreads.map((thread) => {
                    const isActive = thread.id === selectedThreadId;
                    return (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        aria-pressed={isActive}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                          isActive
                            ? "border-[#0b5c66]/35 bg-[#0b5c66]/10 ring-1 ring-[#0b5c66]/15"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <Avatar initials={getInitials(thread.counterpartLabel)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold text-slate-900">{thread.counterpartLabel}</span>
                            <div className="flex items-center gap-2">
                              {isActive ? (
                                <span className="rounded-full bg-[#0b5c66]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0b5c66]">
                                  Activ
                                </span>
                              ) : null}
                              <span className="text-xs text-slate-400">{formatThreadTime(thread.lastMessageAt)}</span>
                            </div>
                          </div>
                          <p className="truncate pt-1 text-xs text-slate-500">{thread.preview}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <EmptySidebarState
                    title={searchNeedle ? "Niciun thread găsit" : "Niciun thread deschis"}
                    body={
                      searchNeedle
                        ? "Schimbă termenul căutat sau golește căutarea pentru a vedea toate conversațiile."
                        : "Conversațiile apar doar după ce o introducere este acceptată."
                    }
                  />
                )}
              </div>
            </div>

            <div id="pending-requests-section">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Cereri în așteptare
              </div>
              <div className="space-y-2">
                {filteredPendingRequests.length ? (
                  filteredPendingRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-200 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900">{request.targetLabel}</div>
                          <div className="mt-1 text-xs text-slate-500">Status: {request.status}</div>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          Pending
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Până avem counterpart multi-actor real, poți valida local traseul de acceptare sau respingere.
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="flex-1 rounded-xl border-[#0b5c66]/20 text-[#0b5c66] hover:bg-teal-50"
                        >
                          Acceptă local
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => simulateRejectRequest(request.id)}
                          className="flex-1 rounded-xl border-slate-200 text-slate-600"
                        >
                          Respinge local
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptySidebarState
                    title={searchNeedle ? "Nicio cerere găsită" : "Nicio cerere pending"}
                    body={
                      searchNeedle
                        ? "Caută după partener sau semnalul asociat pentru a restrânge lista."
                        : "Cere o introducere din spațiul de oportunitate și o vei vedea aici."
                    }
                  />
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Decizii recente
              </div>
              <div className="space-y-2">
                {filteredRecentRequests.length ? (
                  filteredRecentRequests.map((request) => {
                    const signal = getMockSignalById(request.signalId);
                    const statusTone = getIntroductionStatusTone(request.status);
                    return (
                      <div key={request.id} className="rounded-xl border border-slate-200 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900">{request.targetLabel}</div>
                            <div className="mt-1 truncate text-xs text-slate-500">{signal.title}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone}`}>
                            {getIntroductionStatusLabel(request.status)}
                          </span>
                        </div>
                        <div className="mt-3 text-xs leading-6 text-slate-500">
                          {getRecentDecisionCopy(request.status)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptySidebarState
                    title={searchNeedle ? "Nicio decizie găsită" : "Nicio decizie recentă"}
                    body={
                      searchNeedle
                        ? "Schimbă termenul căutat pentru a vedea alte introduceri rezolvate."
                        : "Acceptările, respingerile sau expirările recente apar aici, ca să nu dispară din context."
                    }
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
            Arhivă și thread-uri închise vor apărea aici
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {selectedThread ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-4">
                  <Avatar initials={getInitials(selectedThread.counterpartLabel)} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedThread.counterpartLabel}</h2>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-500">
                        {selectedThreadPolicy?.canRead === "allow" ? "Thread deschis" : "Acces restricționat"}
                      </span>
                    </div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Semnal asociat: {contextSignal.title}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenThreadContext}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="space-y-5 px-5 py-5">
                {selectedThreadPolicy?.canWrite !== "allow" ? (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {selectedThreadPolicy?.canWrite === "require_introduction"
                      ? "Poți scrie în thread doar după o introducere acceptată."
                      : "Acest thread nu permite trimiterea de mesaje în starea curentă."}
                  </div>
                ) : null}
                {selectedMessages.length ? (
                  selectedMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      side={message.authorParticipantId === "me" ? "right" : "left"}
                      name={message.authorParticipantId === "me" ? "Tu" : selectedThread.counterpartLabel}
                      time={formatThreadTime(message.createdAt)}
                      content={message.body}
                    />
                  ))
                ) : (
                  <MainEmptyState
                    title="Thread-ul este deschis"
                    body="Introducerea a fost acceptată, dar încă nu există mesaje. Poți continua aici conversația controlată în cadrul fluxului local actual."
                  />
                )}
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    aria-label="Inserează mesaj contextual"
                    title="Inserează mesaj contextual"
                    onClick={handleInsertContextMessage}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    ref={messageInputRef}
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={selectedThreadPolicy?.canWrite !== "allow"}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                    placeholder={
                      selectedThreadPolicy?.canWrite === "allow"
                        ? "Trimite un mesaj în thread-ul controlat..."
                        : "Mesajele se activează doar în thread-uri permise de policy."
                    }
                  />
                  <Button
                    size="icon"
                    disabled={selectedThreadPolicy?.canWrite !== "allow"}
                    onClick={handleSendMessage}
                    aria-label="Trimite mesajul"
                    title="Trimite mesajul"
                    className="rounded-xl bg-[#0b5c66] text-white hover:bg-[#084b53]"
                  >
                    <Send size={16} />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {selectedThreadPolicy?.canWrite === "allow"
                    ? "Poți trimite un rezumat, propune un call sau continua discuția pornind de la oportunitatea asociată."
                    : "Policy-ul curent blochează scrierea până când thread-ul este eligibil."}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center p-8">
              <MainEmptyState
                title="Încă nu ai conversații deschise"
                body="Mesajele apar doar după ce o introducere este acceptată. Până atunci, vezi cererile în așteptare din coloana din stânga."
              />
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <InfoPanel title="Despre oportunitate">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img
                src={contextSignal.imageUrl}
                alt={contextSignal.title}
                className="mb-3 h-28 w-full rounded-2xl object-cover"
              />
              <h3 className="text-base font-bold text-slate-900">{contextSignal.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{contextSignal.category}</p>
              <Button asChild variant="link" className="mt-3 h-auto p-0 text-[#0b5c66]">
                <Link href={`/semnale/${contextSignal.id}`}>
                  Vezi detalii semnal <ArrowUpRight size={15} className="ml-1" />
                </Link>
              </Button>
            </div>
          </InfoPanel>

          <InfoPanel title="Despre contact">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 size={15} />
                  <span>{selectedThread?.counterpartLabel ?? "Niciun thread selectat"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={15} />
                  <span>{contextSignal.location}, România</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 size={15} />
                  <span>
                    {selectedThread
                      ? `Ultima activitate: ${formatThreadTime(selectedThread.lastMessageAt)}`
                      : `${pendingRequests.length} cereri în așteptare`}
                  </span>
                </div>
              </div>
              <Button asChild variant="link" className="mt-4 h-auto p-0 text-[#0b5c66]">
                <Link href={`/semnale/${contextSignal.id}/oportunitate`}>
                  Vezi spațiul de oportunitate <ArrowUpRight size={15} className="ml-1" />
                </Link>
              </Button>
            </div>
          </InfoPanel>

          <InfoPanel title="Regulă de acces">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Mesajele se deschid numai după acceptarea unei introduceri.</span>
                </div>
                <div className="flex items-center gap-2">
                  <LockKeyhole size={15} className="text-[#0b5c66]" />
                  <span>Nu există chat public sau contact direct deschis implicit.</span>
                </div>
                {pendingRequests.length ? (
                  <div className="rounded-xl bg-amber-50 px-3 py-3 text-amber-800">
                    Acceptarea sau respingerea se validează local până când introducerile vor avea counterpart real și decizie server-side.
                  </div>
                ) : null}
              </div>
            </div>
          </InfoPanel>
        </aside>
      </div>
    </PublicLayout>
  );
}

function MessageBubble({
  side,
  name,
  time,
  content,
}: {
  side: "left" | "right";
  name: string;
  time: string;
  content: string;
}) {
  const isRight = side === "right";

  return (
    <div className={`flex gap-3 ${isRight ? "justify-end" : "justify-start"}`}>
      {!isRight && <Avatar initials="EI" />}
      <div className={`max-w-[78%] ${isRight ? "items-end" : "items-start"} flex flex-col`}>
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{name}</span>
          <span>{time}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isRight ? "bg-sky-50 text-slate-800" : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          {content}
        </div>
      </div>
      {isRight && <Avatar initials="AP" />}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  const src = initials === "EI" ? "https://i.pravatar.cc/72?img=47" : "https://i.pravatar.cc/72?img=12";

  return (
    <img src={src} alt={initials} className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-slate-700">{title}</h2>
      {children}
    </section>
  );
}

function EmptySidebarState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-4">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="mt-1 text-xs leading-6 text-slate-500">{body}</div>
    </div>
  );
}

function MainEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <div className="text-lg font-bold text-slate-900">{title}</div>
      <div className="mt-3 text-sm leading-7 text-slate-600">{body}</div>
    </div>
  );
}

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatThreadTime(value?: string | null): string {
  if (!value) return "Acum";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Acum";
  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIntroductionStatusLabel(status: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "Acceptată";
    case "rejected":
      return "Respinsă";
    case "expired":
      return "Expirată";
    default:
      return "Pending";
  }
}

function getIntroductionStatusTone(status: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    case "expired":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function getRecentDecisionCopy(status: "pending" | "accepted" | "rejected" | "expired"): string {
  switch (status) {
    case "accepted":
      return "Introducerea a fost acceptată și, dacă există context suficient, conversația rămâne disponibilă în thread-urile active.";
    case "rejected":
      return "Introducerea a fost respinsă, deci contactul rămâne închis și oportunitatea are nevoie de altă potrivire sau mai multă claritate.";
    case "expired":
      return "Cererea a expirat fără acceptare, iar contactul rămâne blocat până la o nouă cerere eligibilă.";
    default:
      return "Cererea este încă în lucru.";
  }
}
