import { getAuthHeaders } from "@/lib/request-auth";
import {
  OPPORTUNITY_API_PATHS,
  type CreateIntroductionRequestPayload,
  type IntroductionRequestDto,
  type IntroductionRequestListDto,
  type IntroductionRequestRecord,
  type OpportunityDraftDto,
  type OpportunityDraftPatch,
  type OpportunityDraftRecord,
  type OpportunitySurfaceDto,
  type OpportunityWorkspaceSnapshotDto,
  type OpportunityWorkspaceSnapshotResponseDto,
  type OpportunityWorkspaceDefaults,
  type UpdateIntroductionRequestStatusPayload,
  type UpsertOpportunityDraftPayload,
} from "@/lib/opportunity-api-contract";
import { getOpportunityRepository } from "@/lib/opportunity-repository";
import type { OpportunitySurfaceSnapshotDto } from "@/lib/opportunity-surface-contract";
import type { SignalContactRequestStatus } from "@/lib/signal-action-kernel-contract";

export interface RemoteOpportunityRepository {
  getDraft(signalId: string): Promise<OpportunityDraftRecord | null>;
  getSurface(signalId: string): Promise<OpportunitySurfaceSnapshotDto | null>;
  getWorkspaceSnapshot(signalId: string): Promise<OpportunityWorkspaceSnapshotDto | null>;
  upsertDraft(
    signalId: string,
    defaults: OpportunityWorkspaceDefaults,
    updates?: OpportunityDraftPatch,
  ): Promise<OpportunityDraftRecord>;
  getIntroductionRequest(signalId: string): Promise<IntroductionRequestRecord | null>;
  listIntroductionRequests(): Promise<IntroductionRequestRecord[]>;
  createIntroductionRequest(payload: CreateIntroductionRequestPayload): Promise<IntroductionRequestRecord>;
  updateIntroductionRequestStatus(
    requestId: string,
    status: SignalContactRequestStatus,
    reason?: string | null,
    actorRole?: "requester" | "counterpart" | "system",
  ): Promise<IntroductionRequestRecord | null>;
}

type RemoteRepositoryOptions = {
  fetchImpl?: typeof fetch;
  onFallback?: (reason: string) => void;
};

function normalizeDraftPayload(
  signalId: string,
  defaults: OpportunityWorkspaceDefaults,
  updates?: OpportunityDraftPatch,
): UpsertOpportunityDraftPayload {
  return {
    signalId,
    stage: updates?.stage ?? defaults.stage,
    pitchCompletionPct: updates?.pitchCompletionPct ?? defaults.pitchCompletionPct,
    currentNeedLabel: updates?.currentNeedLabel ?? defaults.currentNeedLabel,
    currentNeedDescription: updates?.currentNeedDescription ?? defaults.currentNeedDescription,
    ask: updates?.ask ?? defaults.ask,
  };
}

class RemoteOpportunityRepositoryImpl implements RemoteOpportunityRepository {
  private readonly fetchImpl: typeof fetch;
  private readonly localRepository = getOpportunityRepository();
  private readonly onFallback?: (reason: string) => void;

  constructor(options?: RemoteRepositoryOptions) {
    this.fetchImpl = options?.fetchImpl ?? fetch;
    this.onFallback = options?.onFallback;
  }

  private async runJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = typeof payload?.error === "string" ? payload.error : `Request failed for ${path}`;
      throw new Error(message);
    }
    return payload as T;
  }

  private fallback<T>(reason: string, resolver: () => T): T {
    this.onFallback?.(reason);
    return resolver();
  }

  async getDraft(signalId: string): Promise<OpportunityDraftRecord | null> {
    try {
      const payload = await this.runJson<OpportunityDraftDto>(OPPORTUNITY_API_PATHS.draft(signalId), {
        method: "GET",
      });
      return payload?.draft ?? null;
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_draft_unavailable",
        () => this.localRepository.getDraft(signalId),
      );
    }
  }

  async getSurface(signalId: string): Promise<OpportunitySurfaceSnapshotDto | null> {
    try {
      const payload = await this.runJson<OpportunitySurfaceDto>(OPPORTUNITY_API_PATHS.surface(signalId), {
        method: "GET",
      });
      return payload?.surface ?? null;
    } catch {
      return null;
    }
  }

  async getWorkspaceSnapshot(signalId: string): Promise<OpportunityWorkspaceSnapshotDto | null> {
    try {
      const payload = await this.runJson<OpportunityWorkspaceSnapshotResponseDto>(
        OPPORTUNITY_API_PATHS.workspace(signalId),
        {
          method: "GET",
        },
      );
      return payload?.workspace ?? null;
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_workspace_unavailable",
        () => null,
      );
    }
  }

  async upsertDraft(
    signalId: string,
    defaults: OpportunityWorkspaceDefaults,
    updates?: OpportunityDraftPatch,
  ): Promise<OpportunityDraftRecord> {
    try {
      const payload = await this.runJson<OpportunityDraftDto>(OPPORTUNITY_API_PATHS.draft(signalId), {
        method: "PUT",
        body: JSON.stringify(normalizeDraftPayload(signalId, defaults, updates)),
      });
      if (!payload?.draft) {
        throw new Error("Draft payload missing from remote response.");
      }
      return payload.draft;
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_upsert_unavailable",
        () => this.localRepository.upsertDraft(signalId, defaults, updates),
      );
    }
  }

  async getIntroductionRequest(signalId: string): Promise<IntroductionRequestRecord | null> {
    try {
      const payload = await this.runJson<IntroductionRequestDto>(OPPORTUNITY_API_PATHS.introductionBySignal(signalId), {
        method: "GET",
      });
      return payload?.request ?? null;
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_intro_unavailable",
        () => this.localRepository.getIntroductionRequest(signalId),
      );
    }
  }

  async listIntroductionRequests(): Promise<IntroductionRequestRecord[]> {
    try {
      const payload = await this.runJson<IntroductionRequestListDto>(OPPORTUNITY_API_PATHS.introductions, {
        method: "GET",
      });
      return Array.isArray(payload?.requests) ? payload.requests : [];
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_intro_list_unavailable",
        () => this.localRepository.listIntroductionRequests(),
      );
    }
  }

  async createIntroductionRequest(payload: CreateIntroductionRequestPayload): Promise<IntroductionRequestRecord> {
    try {
      const result = await this.runJson<IntroductionRequestDto>(OPPORTUNITY_API_PATHS.introductions, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!result?.request) {
        throw new Error("Introduction request missing from remote response.");
      }
      return result.request;
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_intro_create_unavailable",
        () => this.localRepository.createIntroductionRequest(payload),
      );
    }
  }

  async updateIntroductionRequestStatus(
    requestId: string,
    status: SignalContactRequestStatus,
    reason?: string | null,
    actorRole: "requester" | "counterpart" | "system" = "system",
  ): Promise<IntroductionRequestRecord | null> {
    try {
      const result = await this.runJson<IntroductionRequestDto>(OPPORTUNITY_API_PATHS.introductionStatus(requestId), {
        method: "PATCH",
        body: JSON.stringify({ status, reason, actorRole } satisfies UpdateIntroductionRequestStatusPayload),
      });
      return result?.request ?? null;
    } catch (error) {
      return this.fallback(
        error instanceof Error ? error.message : "remote_intro_status_unavailable",
        () => this.localRepository.updateIntroductionRequestStatus(requestId, status, reason, actorRole),
      );
    }
  }
}

export function createRemoteOpportunityRepository(options?: RemoteRepositoryOptions): RemoteOpportunityRepository {
  return new RemoteOpportunityRepositoryImpl(options);
}
