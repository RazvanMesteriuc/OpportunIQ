import type { CanonicalActorRole, CanonicalPartnerKind } from "@/lib/canonical-role-contract";

export const CONTROLLED_MESSAGE_API_PATHS = {
  threads: "/api/me/message-threads",
  threadById: (threadId: string) => `/api/me/message-threads/${threadId}`,
  threadMessages: (threadId: string) => `/api/me/message-threads/${threadId}/messages`,
} as const;

export type ControlledMessageThreadStatus = "pending_intro" | "open" | "closed" | "archived";
export type ControlledMessageThreadOrigin = "introduction_accepted";
export type ControlledMessageAccessState = "intro_required" | "granted" | "archived";

export type ControlledMessageParticipantRole =
  | "founder"
  | "operator"
  | "investor"
  | "supplier"
  | "partner"
  | "company_representative";

export type ControlledMessageParticipant = {
  id: string;
  displayName: string;
  role: ControlledMessageParticipantRole;
  actorRole?: CanonicalActorRole | null;
  partnerKinds?: CanonicalPartnerKind[] | null;
  avatarUrl?: string | null;
  companyName?: string | null;
  verified?: boolean;
};

export type ControlledMessageItem = {
  id: string;
  threadId: string;
  authorParticipantId: string;
  body: string;
  createdAt: string;
  deliveryState?: "local_demo" | "persisted";
};

export type ControlledMessageThread = {
  id: string;
  signalId: string;
  introductionRequestId: string;
  title: string;
  preview: string;
  status: ControlledMessageThreadStatus;
  origin: ControlledMessageThreadOrigin;
  accessState: ControlledMessageAccessState;
  counterpartLabel: string;
  counterpartAvatarUrl?: string | null;
  participants: ControlledMessageParticipant[];
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type ControlledMessageThreadListDto = {
  threads: ControlledMessageThread[];
};

export type ControlledMessageThreadDto = {
  thread: ControlledMessageThread | null;
};

export type ControlledMessageListDto = {
  messages: ControlledMessageItem[];
};

export type CreateControlledMessagePayload = {
  body: string;
  clientMessageId?: string | null;
};

export type ControlledMessageItemDto = {
  message: ControlledMessageItem | null;
};
