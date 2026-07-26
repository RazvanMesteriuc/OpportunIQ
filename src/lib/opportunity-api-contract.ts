import type { CanonicalActorRole, CanonicalPartnerKind } from "@/lib/canonical-role-contract";
import type {
  OpportunityPartnerSummaryDto,
  OpportunityPrivatePitchDto,
  OpportunityPublicBoardDto,
  OpportunitySurfaceSnapshotDto,
} from "@/lib/opportunity-surface-contract";
import type { SignalContactRequestStatus, SignalMatchEntityType } from "@/lib/signal-action-kernel-contract";
import type { OpportunityStage } from "@/lib/mock-opportunity-space";

export const OPPORTUNITY_API_PATHS = {
  draft: (signalId: string) => `/api/me/opportunities/${signalId}`,
  workspace: (signalId: string) => `/api/me/opportunities/${signalId}/workspace`,
  surface: (signalId: string) => `/api/opportunities/${signalId}/surface`,
  partnerSummary: (signalId: string) => `/api/me/opportunities/${signalId}/partner-summary`,
  privatePitch: (signalId: string) => `/api/me/opportunities/${signalId}/private-pitch`,
  introductions: "/api/me/introduction-requests",
  introductionBySignal: (signalId: string) => `/api/me/introduction-requests/by-signal/${signalId}`,
  introductionStatus: (requestId: string) => `/api/me/introduction-requests/${requestId}/status`,
} as const;

export type OpportunityDraftStatus = "draft" | "ready_for_discussion";
export const OPPORTUNITY_STAGES = ["idea", "validation", "plan", "pitch"] as const;

export type OpportunityDraftRecord = {
  id: string;
  signalId: string;
  ownerKey: string;
  createdAt: string;
  updatedAt: string;
  stage: OpportunityStage;
  pitchCompletionPct: number;
  currentNeedLabel: string;
  currentNeedDescription: string;
  ask: string;
  status: OpportunityDraftStatus;
};

export type IntroductionRequestRecord = {
  id: string;
  signalId: string;
  ownerKey: string;
  createdAt: string;
  updatedAt: string;
  lastStatusChangedAt?: string | null;
  requesterActorRole?: CanonicalActorRole | null;
  counterpartActorRole?: CanonicalActorRole | null;
  counterpartPartnerKinds?: CanonicalPartnerKind[] | null;
  targetEntityType: SignalMatchEntityType;
  targetEntityId: string | number;
  targetLabel: string;
  requesterLabel?: string | null;
  counterpartOwnerKey?: string | null;
  note: string | null;
  status: SignalContactRequestStatus;
  acceptedAt: string | null;
  decisionByRole?: "requester" | "counterpart" | "system" | null;
  statusReason?: string | null;
};

export type OpportunityWorkspaceDefaults = {
  stage: OpportunityStage;
  pitchCompletionPct: number;
  currentNeedLabel: string;
  currentNeedDescription: string;
  ask: string;
};

export type OpportunityDraftPatch = Partial<
  Omit<OpportunityDraftRecord, "id" | "signalId" | "ownerKey" | "createdAt" | "updatedAt" | "status">
>;

export type OpportunityDraftStatusInput = {
  pitchCompletionPct: number;
  currentNeedLabel: string;
  currentNeedDescription: string;
  ask: string;
};

export type OpportunityDraftDto = {
  draft: OpportunityDraftRecord | null;
};

export type OpportunitySurfaceDto = {
  surface: OpportunitySurfaceSnapshotDto | null;
};

export type OpportunityPublicBoardOnlyDto = {
  publicBoard: OpportunityPublicBoardDto | null;
};

export type OpportunityPartnerSummaryOnlyDto = {
  partnerSummary: OpportunityPartnerSummaryDto | null;
};

export type OpportunityPrivatePitchOnlyDto = {
  privatePitch: OpportunityPrivatePitchDto | null;
};

export type OpportunityPitchVisibilityDto = {
  visibility: "private" | "aggregate_only" | "counterpart_only";
  decision: "allow" | "deny" | "require_profile_completion" | "require_introduction";
  reasons: string[];
};

export type OpportunityVisibilityTierStateDto = {
  tier: "public_board" | "partner_summary" | "private_pitch";
  label: string;
  availability: "available" | "available_to_counterpart" | "owner_only" | "locked";
  note: string;
};

export type OpportunityVisibilityDto = {
  currentTier: "public_board" | "partner_summary" | "private_pitch";
  tiers: OpportunityVisibilityTierStateDto[];
  reasons: string[];
};

export type OpportunityWorkspaceSnapshotDto = {
  signalId: string;
  draft: OpportunityDraftRecord | null;
  introductionRequest: IntroductionRequestRecord | null;
  surface: OpportunitySurfaceSnapshotDto | null;
  pitchVisibility: OpportunityPitchVisibilityDto;
  opportunityVisibility: OpportunityVisibilityDto;
};

export type OpportunityWorkspaceSnapshotResponseDto = {
  workspace: OpportunityWorkspaceSnapshotDto | null;
};

export type UpsertOpportunityDraftPayload = {
  signalId: string;
  stage?: OpportunityStage;
  pitchCompletionPct?: number;
  currentNeedLabel?: string;
  currentNeedDescription?: string;
  ask?: string;
};

export type IntroductionRequestDto = {
  request: IntroductionRequestRecord | null;
};

export type CreateIntroductionRequestPayload = {
  signalId: string;
  targetEntityType: SignalMatchEntityType;
  targetEntityId: string | number;
  targetLabel: string;
  note?: string | null;
};

export type IntroductionRequestListDto = {
  requests: IntroductionRequestRecord[];
};

export type UpdateIntroductionRequestStatusPayload = {
  status: SignalContactRequestStatus;
  reason?: string | null;
  actorRole?: "requester" | "counterpart" | "system";
};

export type CounterpartDecisionPayload = {
  status: Extract<SignalContactRequestStatus, "accepted" | "rejected" | "expired">;
  reason?: string | null;
  actorRole: "counterpart";
};

export function clampOpportunityPitchPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeOpportunityDraftStatus(input: OpportunityDraftStatusInput): OpportunityDraftStatus {
  const hasNeed = input.currentNeedLabel.trim().length >= 8 && input.currentNeedDescription.trim().length >= 16;
  const hasAsk = input.ask.trim().length >= 16;
  return input.pitchCompletionPct >= 80 && hasNeed && hasAsk ? "ready_for_discussion" : "draft";
}
