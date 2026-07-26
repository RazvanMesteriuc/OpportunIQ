import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildAccessActorFromProfile,
  evaluateIntroductionCreationPolicy,
  evaluateOpportunityVisibilityPolicy,
  evaluatePitchVisibilityPolicy,
} from "@/lib/access-policy";
import type { SignalMatchEntityType } from "@/lib/signal-action-kernel-contract";
import {
  computeOpportunityDraftStatus,
  type IntroductionRequestRecord,
  type OpportunityDraftPatch,
  type OpportunityDraftRecord,
  type OpportunityWorkspaceDefaults,
} from "@/lib/opportunity-api-contract";
import {
  getOpportunityOwnerKey,
  getOpportunityRepository,
} from "@/lib/opportunity-repository";
import { createRemoteOpportunityRepository } from "@/lib/opportunity-remote-repository";
import { readLocalProfile } from "@/lib/use-profile";

export type IntroductionEligibility = {
  allowed: boolean;
  reasons: string[];
};
const repository = getOpportunityRepository();
const remoteRepository = createRemoteOpportunityRepository();

export function getOwnedOpportunityDraft(signalId: string, ownerKey = getOpportunityOwnerKey()): OpportunityDraftRecord | null {
  return repository.getDraft(signalId, ownerKey);
}

export function listOwnedIntroductionRequests(ownerKey = getOpportunityOwnerKey()): IntroductionRequestRecord[] {
  return repository.listIntroductionRequests(ownerKey);
}

export function getOwnedIntroductionRequest(signalId: string, ownerKey = getOpportunityOwnerKey()): IntroductionRequestRecord | null {
  return repository.getIntroductionRequest(signalId, ownerKey);
}

export function upsertOpportunityDraft(
  signalId: string,
  defaults: OpportunityWorkspaceDefaults,
  updates?: OpportunityDraftPatch,
  ownerKey = getOpportunityOwnerKey(),
): OpportunityDraftRecord {
  return repository.upsertDraft(signalId, defaults, updates, ownerKey);
}

export function advanceOpportunityPitch(
  signalId: string,
  defaults: OpportunityWorkspaceDefaults,
  step = 12,
  ownerKey = getOpportunityOwnerKey(),
): OpportunityDraftRecord {
  return repository.advancePitch(signalId, defaults, step, ownerKey);
}

export function evaluateIntroductionEligibility(input: {
  draft: OpportunityDraftRecord | null;
  defaults: OpportunityWorkspaceDefaults;
  profileReady: boolean;
  existingRequest: IntroductionRequestRecord | null;
  ownerKey?: string;
}): IntroductionEligibility {
  const ownerKey = input.ownerKey ?? getOpportunityOwnerKey();
  const localProfile = readLocalProfile();
  const actor = buildAccessActorFromProfile({
    profile: {
      ...localProfile,
      setup: input.profileReady,
    },
    ownerKey,
  });
  const policy = evaluateIntroductionCreationPolicy({
    actor,
    draft: input.draft,
    defaults: input.defaults,
    existingRequest: input.existingRequest,
    pendingRequests: listOwnedIntroductionRequests(ownerKey),
  });

  return {
    allowed: policy.decision === "allow",
    reasons: policy.reasons,
  };
}

export function createIntroductionRequest(input: {
  signalId: string;
  defaults: OpportunityWorkspaceDefaults;
  profileReady: boolean;
  targetEntityType: SignalMatchEntityType;
  targetEntityId: string | number;
  targetLabel: string;
  note?: string | null;
  ownerKey?: string;
}): { ok: true; request: IntroductionRequestRecord; draft: OpportunityDraftRecord } | { ok: false; eligibility: IntroductionEligibility } {
  const ownerKey = input.ownerKey ?? getOpportunityOwnerKey();
  const draft = upsertOpportunityDraft(input.signalId, input.defaults, undefined, ownerKey);
  const existingRequest = getOwnedIntroductionRequest(input.signalId, ownerKey);
  const eligibility = evaluateIntroductionEligibility({
    draft,
    defaults: input.defaults,
    profileReady: input.profileReady,
    existingRequest,
    ownerKey,
  });

  if (!eligibility.allowed) {
    return { ok: false, eligibility };
  }
  const request = repository.createIntroductionRequest({
    signalId: input.signalId,
    targetEntityType: input.targetEntityType,
    targetEntityId: input.targetEntityId,
    targetLabel: input.targetLabel,
    note: input.note,
    ownerKey,
  });
  return { ok: true, request, draft };
}

export function useOpportunityWorkspace(signalId: string, defaults: OpportunityWorkspaceDefaults, profileReady: boolean) {
  const [draft, setDraft] = useState<OpportunityDraftRecord | null>(() => getOwnedOpportunityDraft(signalId));
  const [introductionRequest, setIntroductionRequest] = useState<IntroductionRequestRecord | null>(() => getOwnedIntroductionRequest(signalId));
  const ownerKey = getOpportunityOwnerKey();
  const localProfile = readLocalProfile();
  const actor = useMemo(
    () =>
      buildAccessActorFromProfile({
        profile: {
          ...localProfile,
          setup: profileReady,
        },
        ownerKey,
      }),
    [localProfile, ownerKey, profileReady],
  );

  const hydrateWorkspaceSnapshot = useCallback(async () => {
    const snapshot = await remoteRepository.getWorkspaceSnapshot(signalId);
    if (!snapshot) return;
    setDraft(snapshot.draft);
    setIntroductionRequest(snapshot.introductionRequest);
  }, [signalId]);

  useEffect(() => {
    const sync = () => {
      setDraft(getOwnedOpportunityDraft(signalId));
      setIntroductionRequest(getOwnedIntroductionRequest(signalId));
    };

    sync();
    void hydrateWorkspaceSnapshot();

    const unsubscribe = repository.subscribe(sync);
    return () => {
      unsubscribe();
    };
  }, [hydrateWorkspaceSnapshot, signalId]);

  const saveDraft = useCallback((updates?: OpportunityDraftPatch) => {
    const next = upsertOpportunityDraft(signalId, defaults, updates);
    setDraft(next);
    void hydrateWorkspaceSnapshot();
    return next;
  }, [defaults, hydrateWorkspaceSnapshot, signalId]);

  const progressPitch = useCallback((step = 12) => {
    const next = advanceOpportunityPitch(signalId, defaults, step);
    setDraft(next);
    void hydrateWorkspaceSnapshot();
    return next;
  }, [defaults, hydrateWorkspaceSnapshot, signalId]);

  const requestIntroduction = useCallback((input: {
    targetEntityType: SignalMatchEntityType;
    targetEntityId: string | number;
    targetLabel: string;
    note?: string | null;
  }) => {
    const result = createIntroductionRequest({
      signalId,
      defaults,
      profileReady,
      ...input,
    });
    if (result.ok) {
      setDraft(result.draft);
      setIntroductionRequest(result.request);
      void hydrateWorkspaceSnapshot();
    }
    return result;
  }, [defaults, hydrateWorkspaceSnapshot, profileReady, signalId]);

  const eligibility = useMemo(
    () => evaluateIntroductionEligibility({
      draft,
      defaults,
      profileReady,
      existingRequest: introductionRequest,
      ownerKey,
    }),
    [defaults, draft, introductionRequest, ownerKey, profileReady],
  );

  const introductionPolicy = useMemo(
    () =>
      evaluateIntroductionCreationPolicy({
        actor,
        draft,
        defaults,
        existingRequest: introductionRequest,
        pendingRequests: listOwnedIntroductionRequests(ownerKey),
      }),
    [actor, defaults, draft, introductionRequest, ownerKey],
  );

  const pitchVisibilityPolicy = useMemo(
    () =>
      evaluatePitchVisibilityPolicy({
        actor,
        draft,
        introductionRequest,
      }),
    [actor, draft, introductionRequest],
  );

  const opportunityVisibilityPolicy = useMemo(
    () =>
      evaluateOpportunityVisibilityPolicy({
        actor,
        draft,
        introductionRequest,
      }),
    [actor, draft, introductionRequest],
  );

  const effectiveStage = draft?.stage ?? defaults.stage;
  const effectivePitchCompletionPct = draft?.pitchCompletionPct ?? defaults.pitchCompletionPct;
  const discussionReady = (draft?.status ?? computeOpportunityDraftStatus(defaults)) === "ready_for_discussion";

  return {
    draft,
    introductionRequest,
    eligibility,
    introductionPolicy,
    pitchVisibilityPolicy,
    opportunityVisibilityPolicy,
    effectiveStage,
    effectivePitchCompletionPct,
    discussionReady,
    saveDraft,
    progressPitch,
    requestIntroduction,
  };
}
