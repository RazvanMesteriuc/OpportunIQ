import {
  CONTROLLED_MESSAGE_API_PATHS,
  type ControlledMessageItem,
  type ControlledMessageItemDto,
  type ControlledMessageListDto,
  type ControlledMessageThread,
  type ControlledMessageThreadDto,
  type ControlledMessageThreadListDto,
  type CreateControlledMessagePayload,
} from "@/lib/controlled-message-contract";
import type { IntroductionRequestRecord } from "@/lib/opportunity-api-contract";
import { getAuthHeaders } from "@/lib/request-auth";
import { getOpportunityRepository } from "@/lib/opportunity-repository";

const CONTROLLED_MESSAGE_STORAGE_KEY = "opp_controlled_messages_v1";
const CONTROLLED_MESSAGE_CHANGE_EVENT = "opp-controlled-messages-change";

type StoredMessagesState = Record<string, ControlledMessageItem[]>;

const opportunityRepository = getOpportunityRepository();

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONTROLLED_MESSAGE_CHANGE_EVENT));
}

function buildThreadId(requestId: string): string {
  return `thread-${requestId}`;
}

function readStoredMessages(): StoredMessagesState {
  return safeRead<StoredMessagesState>(CONTROLLED_MESSAGE_STORAGE_KEY, {});
}

function writeStoredMessages(value: StoredMessagesState) {
  safeWrite(CONTROLLED_MESSAGE_STORAGE_KEY, value);
  emitChange();
}

function buildParticipants(request: IntroductionRequestRecord) {
  return [
    {
      id: "me",
      displayName: request.requesterLabel || "Tu",
      role: "founder" as const,
      actorRole: request.requesterActorRole ?? "antreprenor",
      verified: true,
    },
    {
      id: `counterpart:${request.targetLabel}`,
      displayName: request.targetLabel,
      role: "company_representative" as const,
      actorRole: request.counterpartActorRole ?? "partener",
      partnerKinds: request.counterpartPartnerKinds ?? ["generalist"],
      verified: true,
    },
  ];
}

function buildAcceptedThreads(): ControlledMessageThread[] {
  return opportunityRepository
    .listIntroductionRequests()
    .filter((request) => request.status === "accepted")
    .map((request) => {
      const threadId = buildThreadId(request.id);
      const storedMessages = readStoredMessages()[threadId] ?? [];
      const preview = storedMessages[storedMessages.length - 1]?.body
        ?? request.note?.trim()
        ?? "Introducerea a fost acceptată. Poți continua conversația în acest thread.";
      const lastMessageAt = storedMessages[storedMessages.length - 1]?.createdAt
        ?? request.acceptedAt
        ?? request.updatedAt
        ?? request.createdAt;

      return {
        id: threadId,
        signalId: request.signalId,
        introductionRequestId: request.id,
        title: `Discuție cu ${request.targetLabel}`,
        preview,
        status: "open",
        origin: "introduction_accepted",
        accessState: "granted",
        counterpartLabel: request.targetLabel,
        counterpartAvatarUrl: null,
        participants: buildParticipants(request),
        messageCount: storedMessages.length,
        lastMessageAt,
        createdAt: request.acceptedAt ?? request.createdAt,
        updatedAt: lastMessageAt,
      } satisfies ControlledMessageThread;
    })
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

function buildSystemSeedMessage(thread: ControlledMessageThread): ControlledMessageItem[] {
  if (!thread.preview.trim()) return [];
  return [
    {
      id: `${thread.id}-system-seed`,
      threadId: thread.id,
      authorParticipantId: "system",
      body: thread.preview,
      createdAt: thread.createdAt,
      deliveryState: "local_demo",
    },
  ];
}

export interface ControlledMessageRepository {
  subscribe(listener: () => void): () => void;
  listThreads(): ControlledMessageThread[];
  getThread(threadId: string): ControlledMessageThread | null;
  listMessages(threadId: string): ControlledMessageItem[];
  createMessage(threadId: string, payload: CreateControlledMessagePayload): ControlledMessageItem | null;
}

class LocalControlledMessageRepository implements ControlledMessageRepository {
  subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    const sync = () => listener();
    window.addEventListener(CONTROLLED_MESSAGE_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    const unsubscribeOpportunity = opportunityRepository.subscribe(listener);
    return () => {
      window.removeEventListener(CONTROLLED_MESSAGE_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
      unsubscribeOpportunity();
    };
  }

  listThreads(): ControlledMessageThread[] {
    return buildAcceptedThreads();
  }

  getThread(threadId: string): ControlledMessageThread | null {
    return this.listThreads().find((thread) => thread.id === threadId) ?? null;
  }

  listMessages(threadId: string): ControlledMessageItem[] {
    const thread = this.getThread(threadId);
    if (!thread) return [];
    const stored = readStoredMessages()[threadId] ?? [];
    return stored.length ? stored : buildSystemSeedMessage(thread);
  }

  createMessage(threadId: string, payload: CreateControlledMessagePayload): ControlledMessageItem | null {
    const thread = this.getThread(threadId);
    const body = payload.body.trim();
    if (!thread || !body) return null;

    const state = readStoredMessages();
    const current = state[threadId] ?? [];
    const next: ControlledMessageItem = {
      id: `${threadId}-message-${current.length + 1}`,
      threadId,
      authorParticipantId: "me",
      body,
      createdAt: new Date().toISOString(),
      deliveryState: "local_demo",
    };

    writeStoredMessages({
      ...state,
      [threadId]: [...current, next],
    });
    return next;
  }
}

class RemoteControlledMessageRepository implements ControlledMessageRepository {
  private readonly local = new LocalControlledMessageRepository();

  subscribe(listener: () => void): () => void {
    return this.local.subscribe(listener);
  }

  listThreads(): ControlledMessageThread[] {
    return this.local.listThreads();
  }

  getThread(threadId: string): ControlledMessageThread | null {
    return this.local.getThread(threadId);
  }

  listMessages(threadId: string): ControlledMessageItem[] {
    return this.local.listMessages(threadId);
  }

  createMessage(threadId: string, payload: CreateControlledMessagePayload): ControlledMessageItem | null {
    return this.local.createMessage(threadId, payload);
  }

  async fetchThreadsRemote(): Promise<ControlledMessageThread[]> {
    const response = await fetch(CONTROLLED_MESSAGE_API_PATHS.threads, {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? "Nu am putut încărca thread-urile.");
    return ((payload as ControlledMessageThreadListDto | null)?.threads ?? []);
  }

  async fetchThreadRemote(threadId: string): Promise<ControlledMessageThread | null> {
    const response = await fetch(CONTROLLED_MESSAGE_API_PATHS.threadById(threadId), {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? "Nu am putut încărca thread-ul.");
    return ((payload as ControlledMessageThreadDto | null)?.thread ?? null);
  }

  async fetchMessagesRemote(threadId: string): Promise<ControlledMessageItem[]> {
    const response = await fetch(CONTROLLED_MESSAGE_API_PATHS.threadMessages(threadId), {
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? "Nu am putut încărca mesajele.");
    return ((payload as ControlledMessageListDto | null)?.messages ?? []);
  }

  async createMessageRemote(threadId: string, payload: CreateControlledMessagePayload): Promise<ControlledMessageItem | null> {
    const response = await fetch(CONTROLLED_MESSAGE_API_PATHS.threadMessages(threadId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error ?? "Nu am putut trimite mesajul.");
    return ((body as ControlledMessageItemDto | null)?.message ?? null);
  }
}

const controlledMessageRepository = new RemoteControlledMessageRepository();

export function getControlledMessageRepository(): ControlledMessageRepository {
  return controlledMessageRepository;
}
