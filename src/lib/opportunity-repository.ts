import { AUTH_TOKEN_KEY } from "@/lib/auth-token";
import { getCanonicalActorRole } from "@/lib/canonical-role-contract";
import { getVisitorId } from "@/lib/visitor-tracking";
import type { OpportunityStage } from "@/lib/mock-opportunity-space";
import type {
  SignalContactRequestStatus,
  SignalMatchEntityType,
} from "@/lib/signal-action-kernel-contract";
import {
  clampOpportunityPitchPct,
  computeOpportunityDraftStatus,
  type IntroductionRequestRecord,
  type OpportunityDraftPatch,
  type OpportunityDraftRecord,
  type OpportunityWorkspaceDefaults,
} from "@/lib/opportunity-api-contract";
import { readLocalProfile } from "@/lib/use-profile";

const DRAFT_STORAGE_KEY = "opp_opportunity_drafts_v1";
const INTRO_STORAGE_KEY = "opp_introduction_requests_v1";
export const OPPORTUNITY_REPOSITORY_CHANGE_EVENT = "opp-opportunity-workspace-change";

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
    // Keep UX functional even if storage is unavailable.
  }
}

function emitRepositoryChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPPORTUNITY_REPOSITORY_CHANGE_EVENT));
}

function hashValue(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

export function getOpportunityOwnerKey(): string {
  if (typeof window === "undefined") return "server";
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return `auth:${hashValue(token)}`;
  } catch {
    // Fall through to visitor scope.
  }
  return `visitor:${hashValue(getVisitorId())}`;
}

function readDrafts(): OpportunityDraftRecord[] {
  return safeRead<OpportunityDraftRecord[]>(DRAFT_STORAGE_KEY, []);
}

function readIntroductionRequests(): IntroductionRequestRecord[] {
  return safeRead<IntroductionRequestRecord[]>(INTRO_STORAGE_KEY, []);
}

function writeDrafts(records: OpportunityDraftRecord[]) {
  safeWrite(DRAFT_STORAGE_KEY, records);
  emitRepositoryChange();
}

function writeIntroductionRequests(records: IntroductionRequestRecord[]) {
  safeWrite(INTRO_STORAGE_KEY, records);
  emitRepositoryChange();
}

function nextStage(current: OpportunityStage): OpportunityStage {
  if (current === "idea") return "validation";
  if (current === "validation") return "plan";
  if (current === "plan") return "pitch";
  return "pitch";
}

export type CreateIntroductionRequestInput = {
  signalId: string;
  targetEntityType: SignalMatchEntityType;
  targetEntityId: string | number;
  targetLabel: string;
  note?: string | null;
  ownerKey?: string;
};

export interface OpportunityRepository {
  subscribe(listener: () => void): () => void;
  getDraft(signalId: string, ownerKey?: string): OpportunityDraftRecord | null;
  upsertDraft(
    signalId: string,
    defaults: OpportunityWorkspaceDefaults,
    updates?: OpportunityDraftPatch,
    ownerKey?: string,
  ): OpportunityDraftRecord;
  advancePitch(
    signalId: string,
    defaults: OpportunityWorkspaceDefaults,
    step?: number,
    ownerKey?: string,
  ): OpportunityDraftRecord;
  getIntroductionRequest(signalId: string, ownerKey?: string): IntroductionRequestRecord | null;
  listIntroductionRequests(ownerKey?: string): IntroductionRequestRecord[];
  createIntroductionRequest(input: CreateIntroductionRequestInput): IntroductionRequestRecord;
  updateIntroductionRequestStatus(
    requestId: string,
    status: SignalContactRequestStatus,
    reason?: string | null,
    actorRole?: "requester" | "counterpart" | "system",
    ownerKey?: string,
  ): IntroductionRequestRecord | null;
  acceptIntroductionRequest(requestId: string, ownerKey?: string, reason?: string | null): IntroductionRequestRecord | null;
  rejectIntroductionRequest(requestId: string, ownerKey?: string, reason?: string | null): IntroductionRequestRecord | null;
  expireIntroductionRequest(requestId: string, ownerKey?: string, reason?: string | null): IntroductionRequestRecord | null;
}

class LocalOpportunityRepository implements OpportunityRepository {
  subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener(OPPORTUNITY_REPOSITORY_CHANGE_EVENT, listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener(OPPORTUNITY_REPOSITORY_CHANGE_EVENT, listener);
      window.removeEventListener("storage", listener);
    };
  }

  getDraft(signalId: string, ownerKey = getOpportunityOwnerKey()): OpportunityDraftRecord | null {
    return readDrafts().find((item) => item.ownerKey === ownerKey && item.signalId === signalId) ?? null;
  }

  upsertDraft(
    signalId: string,
    defaults: OpportunityWorkspaceDefaults,
    updates?: OpportunityDraftPatch,
    ownerKey = getOpportunityOwnerKey(),
  ): OpportunityDraftRecord {
    const records = readDrafts();
    const existing = records.find((item) => item.ownerKey === ownerKey && item.signalId === signalId) ?? null;
    const now = new Date().toISOString();
    const stage = updates?.stage ?? existing?.stage ?? defaults.stage;
    const pitchCompletionPct = clampOpportunityPitchPct(
      updates?.pitchCompletionPct ?? existing?.pitchCompletionPct ?? defaults.pitchCompletionPct,
    );
    const currentNeedLabel = updates?.currentNeedLabel ?? existing?.currentNeedLabel ?? defaults.currentNeedLabel;
    const currentNeedDescription =
      updates?.currentNeedDescription ?? existing?.currentNeedDescription ?? defaults.currentNeedDescription;
    const ask = updates?.ask ?? existing?.ask ?? defaults.ask;

    const next: OpportunityDraftRecord = {
      id: existing?.id ?? `opp-draft-${signalId}-${hashValue(`${ownerKey}-${now}`)}`,
      signalId,
      ownerKey,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      stage,
      pitchCompletionPct,
      currentNeedLabel,
      currentNeedDescription,
      ask,
      status: computeOpportunityDraftStatus({
        pitchCompletionPct,
        currentNeedLabel,
        currentNeedDescription,
        ask,
      }),
    };

    const filtered = records.filter((item) => !(item.ownerKey === ownerKey && item.signalId === signalId));
    writeDrafts([next, ...filtered]);
    return next;
  }

  advancePitch(
    signalId: string,
    defaults: OpportunityWorkspaceDefaults,
    step = 12,
    ownerKey = getOpportunityOwnerKey(),
  ): OpportunityDraftRecord {
    const existing = this.getDraft(signalId, ownerKey);
    const currentStage = existing?.stage ?? defaults.stage;
    const currentPitchPct = existing?.pitchCompletionPct ?? defaults.pitchCompletionPct;

    return this.upsertDraft(
      signalId,
      defaults,
      {
        stage: currentPitchPct + step >= 80 ? nextStage(currentStage) : currentStage,
        pitchCompletionPct: clampOpportunityPitchPct(currentPitchPct + step),
      },
      ownerKey,
    );
  }

  getIntroductionRequest(signalId: string, ownerKey = getOpportunityOwnerKey()): IntroductionRequestRecord | null {
    return this.listIntroductionRequests(ownerKey).find((item) => item.signalId === signalId) ?? null;
  }

  listIntroductionRequests(ownerKey = getOpportunityOwnerKey()): IntroductionRequestRecord[] {
    return readIntroductionRequests()
      .filter((item) => item.ownerKey === ownerKey)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }

  createIntroductionRequest(input: CreateIntroductionRequestInput): IntroductionRequestRecord {
    const ownerKey = input.ownerKey ?? getOpportunityOwnerKey();
    const records = readIntroductionRequests();
    const existing = this.getIntroductionRequest(input.signalId, ownerKey);
    const now = new Date().toISOString();
    const profile = readLocalProfile();
    const requesterActorRole = getCanonicalActorRole(profile.role) ?? "antreprenor";
    const inferredPartnerKinds = input.targetEntityType === "company" || input.targetEntityType === "user"
      ? ["generalist" as const]
      : [];
    const next: IntroductionRequestRecord = {
      id: existing?.id ?? `intro-${input.signalId}-${hashValue(`${ownerKey}-${now}`)}`,
      signalId: input.signalId,
      ownerKey,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      requesterActorRole,
      counterpartActorRole: "partener",
      counterpartPartnerKinds: existing?.counterpartPartnerKinds ?? inferredPartnerKinds,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      targetLabel: input.targetLabel,
      requesterLabel: existing?.requesterLabel ?? (profile.name?.trim() || "Tu"),
      counterpartOwnerKey: existing?.counterpartOwnerKey ?? null,
      note: input.note?.trim() || null,
      status: "pending",
      acceptedAt: null,
    };

    const filtered = records.filter((item) => !(item.ownerKey === ownerKey && item.signalId === input.signalId));
    writeIntroductionRequests([next, ...filtered]);
    return next;
  }

  updateIntroductionRequestStatus(
    requestId: string,
    status: SignalContactRequestStatus,
    reason?: string | null,
    actorRole: "requester" | "counterpart" | "system" = "system",
    ownerKey = getOpportunityOwnerKey(),
  ): IntroductionRequestRecord | null {
    const records = readIntroductionRequests();
    const existing = records.find((item) => item.ownerKey === ownerKey && item.id === requestId) ?? null;
    if (!existing) return null;

    const now = new Date().toISOString();
    const next: IntroductionRequestRecord = {
      ...existing,
      status,
      updatedAt: now,
      lastStatusChangedAt: now,
      acceptedAt: status === "accepted" ? existing.acceptedAt ?? now : null,
      decisionByRole: actorRole,
      statusReason: reason?.trim() || null,
    };

    const filtered = records.filter((item) => !(item.ownerKey === ownerKey && item.id === requestId));
    writeIntroductionRequests([next, ...filtered]);
    return next;
  }

  acceptIntroductionRequest(
    requestId: string,
    ownerKey = getOpportunityOwnerKey(),
    reason?: string | null,
  ): IntroductionRequestRecord | null {
    return this.updateIntroductionRequestStatus(requestId, "accepted", reason, "counterpart", ownerKey);
  }

  rejectIntroductionRequest(
    requestId: string,
    ownerKey = getOpportunityOwnerKey(),
    reason?: string | null,
  ): IntroductionRequestRecord | null {
    return this.updateIntroductionRequestStatus(requestId, "rejected", reason, "counterpart", ownerKey);
  }

  expireIntroductionRequest(
    requestId: string,
    ownerKey = getOpportunityOwnerKey(),
    reason?: string | null,
  ): IntroductionRequestRecord | null {
    return this.updateIntroductionRequestStatus(requestId, "expired", reason, "system", ownerKey);
  }
}

const localOpportunityRepository = new LocalOpportunityRepository();

export function getOpportunityRepository(): OpportunityRepository {
  return localOpportunityRepository;
}
