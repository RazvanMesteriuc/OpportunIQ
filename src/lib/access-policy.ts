import {
  getCanonicalActorRole,
  getCanonicalPartnerKinds,
} from "@/lib/canonical-role-contract";
import type { ControlledMessageThread } from "@/lib/controlled-message-contract";
import type { OpportunitySurfaceTier } from "@/lib/opportunity-surface-contract";
import type {
  IntroductionRequestRecord,
  OpportunityDraftRecord,
  OpportunityWorkspaceDefaults,
} from "@/lib/opportunity-api-contract";
import { computeOpportunityDraftStatus } from "@/lib/opportunity-api-contract";
import {
  SERVER_ACCESS_RULES,
  type AccessActor,
  type AccessDecision,
  type ControlledMessageAccessPolicy,
  type IntroductionAccessRecord,
  type ThreadAccessGrant,
} from "@/lib/server-access-contract";
import type { UserProfile } from "@/lib/use-profile";

export type IntroductionCreationPolicy = {
  decision: AccessDecision;
  reasons: string[];
  pendingCount: number;
  effectiveStatus: string;
};

export type PitchVisibilityPolicy = {
  visibility: "private" | "aggregate_only" | "counterpart_only";
  decision: AccessDecision;
  reasons: string[];
};

export type OpportunityVisibilityTierState = {
  tier: OpportunitySurfaceTier;
  label: string;
  availability: "available" | "available_to_counterpart" | "owner_only" | "locked";
  note: string;
};

export type OpportunityVisibilityPolicy = {
  currentTier: OpportunitySurfaceTier;
  tiers: OpportunityVisibilityTierState[];
  reasons: string[];
};

export function buildAccessActorFromProfile(input: {
  profile: UserProfile;
  ownerKey: string;
  userId?: string | number | null;
  companyId?: string | number | null;
}): AccessActor {
  return {
    userId: input.userId ?? input.ownerKey,
    companyId: input.companyId ?? null,
    ownerKey: input.ownerKey,
    actorRole: getCanonicalActorRole(input.profile.role) ?? "antreprenor",
    partnerKinds: getCanonicalPartnerKinds(input.profile.role),
    profileCompleted: Boolean(input.profile.setup),
  };
}

export function evaluateIntroductionCreationPolicy(input: {
  actor: AccessActor;
  draft: OpportunityDraftRecord | null;
  defaults: OpportunityWorkspaceDefaults;
  existingRequest: IntroductionRequestRecord | null;
  pendingRequests: IntroductionRequestRecord[];
}): IntroductionCreationPolicy {
  const effectiveStatus =
    input.draft?.status
    ?? computeOpportunityDraftStatus({
      pitchCompletionPct: input.defaults.pitchCompletionPct,
      currentNeedLabel: input.defaults.currentNeedLabel,
      currentNeedDescription: input.defaults.currentNeedDescription,
      ask: input.defaults.ask,
    });

  const reasons: string[] = [];

  if (SERVER_ACCESS_RULES.introductionCreation.requesterRole !== input.actor.actorRole) {
    reasons.push("Introducerile pot fi cerute doar de actorul care construiește oportunitatea.");
  }

  if (SERVER_ACCESS_RULES.introductionCreation.requiresCompletedProfile && !input.actor.profileCompleted) {
    reasons.push("Completează profilul înainte de a cere o introducere.");
  }

  if (effectiveStatus !== "ready_for_discussion") {
    reasons.push("Pitch-ul și nevoia actuală trebuie clarificate înainte de introducere.");
  }

  if (input.existingRequest?.status === "pending") {
    reasons.push("Există deja o cerere de introducere în așteptare pentru acest semnal.");
  }

  const pendingCount = input.pendingRequests.filter((item) => item.status === "pending").length;
  if (pendingCount >= 3 && input.existingRequest?.status !== "pending") {
    reasons.push("Ai atins limita locală de 3 cereri de introducere în așteptare.");
  }

  const decision: AccessDecision = !input.actor.profileCompleted
    ? "require_profile_completion"
    : reasons.length
      ? "deny"
      : "allow";

  return {
    decision,
    reasons,
    pendingCount,
    effectiveStatus,
  };
}

export function buildIntroductionAccessRecord(request: IntroductionRequestRecord): IntroductionAccessRecord {
  return {
    requestId: request.id,
    signalId: request.signalId,
    requester: {
      ownerKey: request.ownerKey,
      actorRole: request.requesterActorRole ?? "antreprenor",
    },
    counterpart: {
      ownerKey: request.counterpartOwnerKey ?? `counterpart:${request.targetEntityType}:${request.targetEntityId}`,
      actorRole: request.counterpartActorRole ?? "partener",
      partnerKinds: request.counterpartPartnerKinds ?? ["generalist"],
    },
    status: request.status,
    createdAt: request.createdAt,
    lastStatusChangedAt: request.lastStatusChangedAt ?? null,
    acceptedAt: request.acceptedAt ?? null,
    statusReason: request.statusReason ?? null,
  };
}

export function buildThreadAccessGrant(input: {
  thread: ControlledMessageThread;
  introduction: IntroductionRequestRecord;
}): ThreadAccessGrant {
  const intro = buildIntroductionAccessRecord(input.introduction);
  return {
    threadId: input.thread.id,
    introductionRequestId: input.thread.introductionRequestId,
    signalId: input.thread.signalId,
    state: input.introduction.status === "accepted"
      ? "active"
      : input.introduction.status === "pending"
        ? "pending_intro"
        : "closed",
    requesterOwnerKey: intro.requester.ownerKey,
    counterpartOwnerKey: intro.counterpart.ownerKey,
    grantedAt: input.introduction.acceptedAt ?? null,
    revokedAt: input.introduction.status === "rejected" || input.introduction.status === "expired"
      ? input.introduction.lastStatusChangedAt ?? input.introduction.updatedAt
      : null,
    visibility: "counterpart_only",
  };
}

export function evaluateControlledMessageAccessPolicy(input: {
  actor: AccessActor;
  thread: ControlledMessageThread;
  introduction: IntroductionRequestRecord | null;
}): ControlledMessageAccessPolicy {
  const threadGrant = input.introduction
    ? buildThreadAccessGrant({
        thread: input.thread,
        introduction: input.introduction,
      })
    : {
        threadId: input.thread.id,
        introductionRequestId: input.thread.introductionRequestId,
        signalId: input.thread.signalId,
        state: "blocked",
        requesterOwnerKey: "",
        counterpartOwnerKey: "",
        grantedAt: null,
        revokedAt: null,
        visibility: "counterpart_only",
      } satisfies ThreadAccessGrant;

  const ownsThread =
    input.actor.ownerKey === threadGrant.requesterOwnerKey
    || input.actor.ownerKey === threadGrant.counterpartOwnerKey;

  const canRead: AccessDecision =
    !ownsThread ? "deny"
    : threadGrant.state === "active" ? "allow"
    : threadGrant.state === "pending_intro" ? "require_introduction"
    : "deny";

  const canWrite: AccessDecision =
    canRead === "allow" && SERVER_ACCESS_RULES.messagePersistence.allowedStates.includes(threadGrant.state)
      ? "allow"
      : canRead;

  const canArchive: AccessDecision = canRead === "allow" ? "allow" : "deny";

  return {
    actor: input.actor,
    thread: threadGrant,
    canRead,
    canWrite,
    canArchive,
  };
}

export function evaluatePitchVisibilityPolicy(input: {
  actor: AccessActor;
  draft: OpportunityDraftRecord | null;
  introductionRequest: IntroductionRequestRecord | null;
}): PitchVisibilityPolicy {
  if (!input.draft) {
    return {
      visibility: "aggregate_only",
      decision: "deny",
      reasons: ["Pitch-ul nu este încă salvat în spațiul tău de oportunitate."],
    };
  }

  if (input.actor.ownerKey === input.draft.ownerKey) {
    return {
      visibility: "private",
      decision: "allow",
      reasons: [],
    };
  }

  if (input.introductionRequest?.status === "accepted") {
    return {
      visibility: "counterpart_only",
      decision: "allow",
      reasons: [],
    };
  }

  return {
    visibility: "aggregate_only",
    decision: "require_introduction",
    reasons: ["Pitch-ul complet devine vizibil doar după o introducere acceptată."],
  };
}

export function evaluateOpportunityVisibilityPolicy(input: {
  actor: AccessActor;
  draft: OpportunityDraftRecord | null;
  introductionRequest: IntroductionRequestRecord | null;
}): OpportunityVisibilityPolicy {
  const isOwner = Boolean(input.draft) && input.actor.ownerKey === input.draft?.ownerKey;
  const hasAcceptedIntroduction = input.introductionRequest?.status === "accepted";
  const hasDraft = Boolean(input.draft);

  const tiers: OpportunityVisibilityTierState[] = [
    {
      tier: "public_board",
      label: "Tablou public",
      availability: "available",
      note: "Arată public problema, dovezile, interesul comunității și de ce merită atenție, fără date sensibile.",
    },
    {
      tier: "partner_summary",
      label: "Rezumat pentru partener",
      availability: hasAcceptedIntroduction ? "available_to_counterpart" : "locked",
      note: hasAcceptedIntroduction
        ? "După o introducere acceptată, counterpart-ul vede rezumatul de lucru și contextul necesar unei discuții utile."
        : "Se deschide doar după o introducere acceptată, nu public.",
    },
    {
      tier: "private_pitch",
      label: "Pitch privat",
      availability: isOwner ? "owner_only" : "locked",
      note: isOwner
        ? "Rămâne în controlul fondatorului și poate conține ipoteze, structură internă și detalii sensibile."
        : "Nu se expune automat către terți; fondatorul decide dacă și când partajează detalii avansate.",
    },
  ];

  const currentTier: OpportunitySurfaceTier = isOwner
    ? "private_pitch"
    : hasAcceptedIntroduction
      ? "partner_summary"
      : "public_board";

  const reasons: string[] = [];
  if (!hasDraft) {
    reasons.push("Până nu există un draft salvat, oportunitatea poate fi prezentată doar la nivel de tablou public.");
  }
  if (!hasAcceptedIntroduction) {
    reasons.push("Rezumatul pentru partener rămâne blocat până la o introducere acceptată.");
  }
  if (!isOwner) {
    reasons.push("Pitch-ul complet și datele avansate rămân private pentru fondator.");
  }

  return {
    currentTier,
    tiers,
    reasons,
  };
}
