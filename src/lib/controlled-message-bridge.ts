import { useEffect, useState } from "react";
import {
  buildAccessActorFromProfile,
  evaluateControlledMessageAccessPolicy,
} from "@/lib/access-policy";
import type {
  ControlledMessageItem,
  ControlledMessageThread,
} from "@/lib/controlled-message-contract";
import { getOpportunityOwnerKey } from "@/lib/opportunity-repository";
import { getOpportunityRepository } from "@/lib/opportunity-repository";
import { getControlledMessageRepository } from "@/lib/controlled-message-repository";
import type { IntroductionRequestRecord } from "@/lib/opportunity-api-contract";
import { readLocalProfile } from "@/lib/use-profile";

const opportunityRepository = getOpportunityRepository();
const controlledMessageRepository = getControlledMessageRepository();

export function listControlledMessageThreads(): ControlledMessageThread[] {
  return controlledMessageRepository.listThreads();
}

export function listPendingIntroductionRequests(): IntroductionRequestRecord[] {
  return opportunityRepository
    .listIntroductionRequests()
    .filter((request) => request.status === "pending");
}

export function listRecentIntroductionRequests(): IntroductionRequestRecord[] {
  return opportunityRepository
    .listIntroductionRequests()
    .filter((request) => request.status !== "pending")
    .slice(0, 6);
}

export function getControlledMessageThread(threadId: string): ControlledMessageThread | null {
  return controlledMessageRepository.getThread(threadId);
}

export function listControlledMessages(threadId: string): ControlledMessageItem[] {
  return controlledMessageRepository.listMessages(threadId);
}

export function useControlledMessageThreads() {
  const [threads, setThreads] = useState<ControlledMessageThread[]>(() => listControlledMessageThreads());

  useEffect(() => {
    const sync = () => setThreads(listControlledMessageThreads());
    sync();
    return controlledMessageRepository.subscribe(sync);
  }, []);

  return {
    threads,
  };
}

export function useControlledMessagingInbox() {
  const [threads, setThreads] = useState<ControlledMessageThread[]>(() => listControlledMessageThreads());
  const [pendingRequests, setPendingRequests] = useState<IntroductionRequestRecord[]>(() => listPendingIntroductionRequests());
  const [recentRequests, setRecentRequests] = useState<IntroductionRequestRecord[]>(() => listRecentIntroductionRequests());

  useEffect(() => {
    const sync = () => {
      setThreads(listControlledMessageThreads());
      setPendingRequests(listPendingIntroductionRequests());
      setRecentRequests(listRecentIntroductionRequests());
    };
    sync();
    const unsubscribeMessages = controlledMessageRepository.subscribe(sync);
    const unsubscribeOpportunities = opportunityRepository.subscribe(sync);
    return () => {
      unsubscribeMessages();
      unsubscribeOpportunities();
    };
  }, []);

  const ownerKey = getOpportunityOwnerKey();
  const actor = buildAccessActorFromProfile({
    profile: readLocalProfile(),
    ownerKey,
  });

  const threadPolicies = Object.fromEntries(
    threads.map((thread) => {
      const introduction = opportunityRepository
        .listIntroductionRequests(ownerKey)
        .find((request) => request.id === thread.introductionRequestId) ?? null;
      return [
        thread.id,
        evaluateControlledMessageAccessPolicy({
          actor,
          thread,
          introduction,
        }),
      ];
    }),
  );

  return {
    threads,
    pendingRequests,
    recentRequests,
    threadPolicies,
    simulateAcceptRequest: (requestId: string) => opportunityRepository.acceptIntroductionRequest(requestId),
    simulateRejectRequest: (requestId: string) => opportunityRepository.rejectIntroductionRequest(requestId),
    simulateExpireRequest: (requestId: string) => opportunityRepository.expireIntroductionRequest(requestId),
    sendMessage: (threadId: string, body: string) => {
      const policy = threadPolicies[threadId];
      if (policy?.canWrite !== "allow") return null;
      return controlledMessageRepository.createMessage(threadId, { body });
    },
  };
}
