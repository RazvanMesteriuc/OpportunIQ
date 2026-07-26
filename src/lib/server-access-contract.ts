import type {
  CanonicalActorRole,
  CanonicalPartnerKind,
} from "@/lib/canonical-role-contract";
import type { SignalContactRequestStatus } from "@/lib/signal-action-kernel-contract";

export type ResourceVisibility = "private" | "counterpart_only" | "aggregate_only" | "public_summary";
export type AccessDecision = "allow" | "deny" | "require_introduction" | "require_profile_completion";
export type ThreadAccessState = "blocked" | "pending_intro" | "active" | "closed";

export type AccessActor = {
  userId: string | number;
  companyId?: string | number | null;
  ownerKey: string;
  actorRole: CanonicalActorRole;
  partnerKinds: CanonicalPartnerKind[];
  profileCompleted: boolean;
};

export type OwnershipBoundary = {
  ownerUserId?: string | number | null;
  ownerCompanyId?: string | number | null;
  ownerKey: string;
};

export type IntroductionAccessRecord = {
  requestId: string;
  signalId: string;
  requester: OwnershipBoundary & {
    actorRole: CanonicalActorRole;
  };
  counterpart: OwnershipBoundary & {
    actorRole: CanonicalActorRole;
    partnerKinds: CanonicalPartnerKind[];
  };
  status: SignalContactRequestStatus;
  createdAt: string;
  lastStatusChangedAt?: string | null;
  acceptedAt?: string | null;
  statusReason?: string | null;
};

export type ThreadAccessGrant = {
  threadId: string;
  introductionRequestId: string;
  signalId: string;
  state: ThreadAccessState;
  requesterOwnerKey: string;
  counterpartOwnerKey: string;
  grantedAt?: string | null;
  revokedAt?: string | null;
  visibility: Extract<ResourceVisibility, "private" | "counterpart_only">;
};

export type ControlledMessageAccessPolicy = {
  actor: AccessActor;
  thread: ThreadAccessGrant;
  canRead: AccessDecision;
  canWrite: AccessDecision;
  canArchive: AccessDecision;
};

export const SERVER_ACCESS_RULES = {
  introductionCreation: {
    requesterRole: "antreprenor",
    counterpartRole: "partener",
    requiresCompletedProfile: true,
  },
  threadActivation: {
    requiresIntroductionStatus: "accepted",
    visibility: "counterpart_only",
  },
  messagePersistence: {
    allowedStates: ["active"] as ThreadAccessState[],
    ownerScopedOnly: true,
    publicReadForbidden: true,
  },
} as const;
