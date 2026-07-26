import { AUTH_TOKEN_KEY } from "@/lib/auth-token";
import {
  buildAccessActorFromProfile,
  evaluatePitchVisibilityPolicy,
  evaluateOpportunityVisibilityPolicy,
} from "@/lib/access-policy";
import { getControlledMessageRepository } from "@/lib/controlled-message-repository";
import { getMyCompanies, addMyCompany, removeMyCompany } from "@/lib/my-companies";
import { getOpportunitySpaceBySignalId } from "@/lib/mock-opportunity-space";
import { buildOpportunitySurfaceSnapshot } from "@/lib/opportunity-surface-contract";
import {
  getOpportunityRepository,
  getOpportunityOwnerKey,
} from "@/lib/opportunity-repository";
import {
  OPPORTUNITY_STAGES,
  type CreateIntroductionRequestPayload,
  type OpportunityWorkspaceSnapshotDto,
  type UpsertOpportunityDraftPayload,
  type UpdateIntroductionRequestStatusPayload,
} from "@/lib/opportunity-api-contract";
import {
  DEFAULT_PROFILE,
  readLocalProfile,
  writeLocalProfile,
} from "@/lib/use-profile";
import type {
  SignalContactRequestStatus,
  SignalMatchEntityType,
} from "@/lib/signal-action-kernel-contract";

const SHIM_FLAG = "__oppLocalApiShimInstalled";
const POINTS_STORAGE_KEY = "opp_points_economy_v1";

type EconomySnapshot = {
  wallet: {
    reputation: number;
    availablePoints: number;
    tier: string;
  };
  config: {
    impulseBaseCost: number;
    impulseOwnMultiplier: number;
    articleImpulseScoreDelta: number;
    reportImpulseScoreDelta: number;
    analyticsPremiumCost: number;
    analyticsPremiumHours: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    activationCost: number;
    upgradeCost: number;
    icon?: string | null;
    tone?: string | null;
    owned: boolean;
    currentLevel: number;
    nextUpgradeCost: number | null;
  }>;
  recentTransactions: Array<{
    id: number;
    amount: number;
    balanceAfter: number;
    transactionType: string;
    source: string;
    refKind?: string | null;
    refId?: number | null;
    createdAt: string;
  }>;
  analyticsPremium: {
    active: boolean;
    startAt: string | null;
    endAt: string | null;
    pointsConsumed: number;
  };
};

const opportunityRepository = getOpportunityRepository();
const controlledMessageRepository = getControlledMessageRepository();
const INTRO_STATUSES: SignalContactRequestStatus[] = ["pending", "accepted", "rejected", "expired"];
const MATCH_ENTITY_TYPES: SignalMatchEntityType[] = ["company", "user", "aspirant_profile"];

function isPrivatePreviewHost(hostname: string): boolean {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname.startsWith("192.168.")
    || hostname.startsWith("10.")
    || hostname.startsWith("169.254.")
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
}

function hasAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return true;
  try {
    return Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
  } catch {
    return false;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "x-opp-local-api-shim": "1",
    },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, {
    status,
    headers: {
      "x-opp-local-api-shim": "1",
    },
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.clone().json() as T;
  } catch {
    return null;
  }
}

function defaultProfileMeta() {
  return {
    roleLocked: false,
    advisor: {
      unlocked: false,
      label: "Membru în creștere",
      reputationScore: 0,
      interactions: 0,
      voteSignals: 0,
      commentSignals: 0,
      articleSignals: 0,
      unlockThreshold: {
        reputationScore: 120,
        interactions: 18,
        voteSignals: 8,
        commentSignals: 4,
      },
      progressPct: 0,
    },
  };
}

function readEconomySnapshot(): EconomySnapshot {
  try {
    const raw = window.localStorage.getItem(POINTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EconomySnapshot;
  } catch {
    // fall through
  }

  return {
    wallet: {
      reputation: 1250,
      availablePoints: 1250,
      tier: "explorer",
    },
    config: {
      impulseBaseCost: 35,
      impulseOwnMultiplier: 1,
      articleImpulseScoreDelta: 4,
      reportImpulseScoreDelta: 6,
      analyticsPremiumCost: 400,
      analyticsPremiumHours: 72,
    },
    badges: [
      {
        id: "explorer",
        name: "Explorator",
        description: "Descoperi constant semnale și oportunități noi.",
        maxLevel: 3,
        activationCost: 0,
        upgradeCost: 180,
        tone: "sky",
        owned: true,
        currentLevel: 1,
        nextUpgradeCost: 180,
      },
      {
        id: "connector",
        name: "Conector",
        description: "Facilitezi introduceri și discuții relevante.",
        maxLevel: 3,
        activationCost: 220,
        upgradeCost: 260,
        tone: "violet",
        owned: false,
        currentLevel: 0,
        nextUpgradeCost: 220,
      },
    ],
    recentTransactions: [
      {
        id: 1,
        amount: 120,
        balanceAfter: 1250,
        transactionType: "reward",
        source: "signal_interest",
        refKind: "signal",
        refId: 1,
        createdAt: new Date().toISOString(),
      },
    ],
    analyticsPremium: {
      active: false,
      startAt: null,
      endAt: null,
      pointsConsumed: 0,
    },
  };
}

function writeEconomySnapshot(snapshot: EconomySnapshot) {
  try {
    window.localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // noop
  }
}

function createDemoCompany(companyId: number) {
  return {
    id: companyId,
    name: `Companie demo ${companyId}`,
    city: "Cluj-Napoca",
    industry: "Servicii & operațiuni",
    logoUrl: null,
    paidTier: "free",
    paidUntil: null,
  };
}

function parseUrl(request: Request): URL {
  return new URL(request.url, window.location.origin);
}

function isOpportunityStage(value: unknown): value is (typeof OPPORTUNITY_STAGES)[number] {
  return typeof value === "string" && OPPORTUNITY_STAGES.includes(value as (typeof OPPORTUNITY_STAGES)[number]);
}

function isSignalMatchEntityType(value: unknown): value is SignalMatchEntityType {
  return typeof value === "string" && MATCH_ENTITY_TYPES.includes(value as SignalMatchEntityType);
}

function isIntroductionStatus(value: unknown): value is SignalContactRequestStatus {
  return typeof value === "string" && INTRO_STATUSES.includes(value as SignalContactRequestStatus);
}

function requireAuth(request: Request): Response | null {
  return hasAuth(request) ? null : jsonResponse({ error: "Autentificare necesară." }, 401);
}

function buildSurfaceSnapshot(signalId: string) {
  const record = getOpportunitySpaceBySignalId(signalId);
  const ownerKey = getOpportunityOwnerKey();
  const draft = opportunityRepository.getDraft(signalId, ownerKey);
  const introductionRequest = opportunityRepository.getIntroductionRequest(signalId, ownerKey);
  const actor = buildAccessActorFromProfile({
    profile: readLocalProfile(),
    ownerKey,
  });
  const visibilityPolicy = evaluateOpportunityVisibilityPolicy({
    actor,
    draft,
    introductionRequest,
  });

  return buildOpportunitySurfaceSnapshot({
    signalId,
    currentTier: visibilityPolicy.currentTier,
    publicBoard: record.publicBoard,
    partnerView: record.partnerView,
    privatePitch: {
      title: record.pitch.title,
      summary: record.pitch.summary,
      ask: draft?.ask ?? record.pitch.ask,
      useOfFunds: record.pitch.useOfFunds,
      currentNeedLabel: draft?.currentNeedLabel ?? record.currentNeed.label,
      currentNeedDescription: draft?.currentNeedDescription ?? record.currentNeed.description,
      pitchCompletionPct: draft?.pitchCompletionPct ?? record.pitch.completionPct,
    },
  });
}

function buildWorkspaceSnapshot(signalId: string): OpportunityWorkspaceSnapshotDto {
  const ownerKey = getOpportunityOwnerKey();
  const draft = opportunityRepository.getDraft(signalId, ownerKey);
  const introductionRequest = opportunityRepository.getIntroductionRequest(signalId, ownerKey);
  const actor = buildAccessActorFromProfile({
    profile: readLocalProfile(),
    ownerKey,
  });
  const opportunityVisibility = evaluateOpportunityVisibilityPolicy({
    actor,
    draft,
    introductionRequest,
  });
  const pitchVisibility = evaluatePitchVisibilityPolicy({
    actor,
    draft,
    introductionRequest,
  });

  return {
    signalId,
    draft,
    introductionRequest,
    surface: buildSurfaceSnapshot(signalId),
    pitchVisibility: {
      visibility: pitchVisibility.visibility,
      decision: pitchVisibility.decision,
      reasons: [...pitchVisibility.reasons],
    },
    opportunityVisibility: {
      currentTier: opportunityVisibility.currentTier,
      tiers: opportunityVisibility.tiers.map((tier) => ({
        tier: tier.tier,
        label: tier.label,
        availability: tier.availability,
        note: tier.note,
      })),
      reasons: [...opportunityVisibility.reasons],
    },
  };
}

async function handleProfile(request: Request): Promise<Response> {
  if (!hasAuth(request)) {
    return jsonResponse({ error: "Autentificare necesară." }, 401);
  }

  if (request.method === "GET") {
    return jsonResponse({
      profile: {
        ...DEFAULT_PROFILE,
        ...readLocalProfile(),
      },
      meta: defaultProfileMeta(),
    });
  }

  if (request.method === "PUT") {
    const payload = await readJson<Partial<typeof DEFAULT_PROFILE>>(request);
    const next = {
      ...DEFAULT_PROFILE,
      ...readLocalProfile(),
      ...(payload ?? {}),
      setup: true,
    };
    writeLocalProfile(next);
    return jsonResponse({
      profile: next,
      meta: defaultProfileMeta(),
    });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
}

async function handleCompanies(request: Request, pathname: string): Promise<Response> {
  if (!hasAuth(request)) {
    return jsonResponse({ error: "Autentificare necesară." }, 401);
  }

  if (pathname === "/api/me/companies" && request.method === "GET") {
    return jsonResponse({ companies: getMyCompanies() });
  }

  if (pathname === "/api/me/companies" && request.method === "POST") {
    const payload = await readJson<{ companyId?: number | string | null }>(request);
    const companyId = Number(payload?.companyId);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      return jsonResponse({ error: "ID firmă invalid." }, 400);
    }
    const company = createDemoCompany(companyId);
    addMyCompany(company);
    return jsonResponse({ company });
  }

  const companyMatch = pathname.match(/^\/api\/me\/companies\/(\d+)$/);
  if (companyMatch && request.method === "DELETE") {
    removeMyCompany(Number(companyMatch[1]));
    return emptyResponse(204);
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
}

async function handleOpportunities(request: Request, pathname: string): Promise<Response> {
  const surfaceMatch = pathname.match(/^\/api\/opportunities\/([^/]+)\/surface$/);
  if (surfaceMatch && request.method === "GET") {
    const signalId = decodeURIComponent(surfaceMatch[1]);
    return jsonResponse({ surface: buildSurfaceSnapshot(signalId) });
  }

  const workspaceMatch = pathname.match(/^\/api\/me\/opportunities\/([^/]+)\/workspace$/);
  if (workspaceMatch && request.method === "GET") {
    const authError = requireAuth(request);
    if (authError) return authError;
    const signalId = decodeURIComponent(workspaceMatch[1]);
    return jsonResponse({ workspace: buildWorkspaceSnapshot(signalId) });
  }

  const partnerSummaryMatch = pathname.match(/^\/api\/me\/opportunities\/([^/]+)\/partner-summary$/);
  if (partnerSummaryMatch && request.method === "GET") {
    const authError = requireAuth(request);
    if (authError) return authError;
    const signalId = decodeURIComponent(partnerSummaryMatch[1]);
    const surface = buildSurfaceSnapshot(signalId);
    const allowed = surface.currentTier === "partner_summary" || surface.currentTier === "private_pitch";
    return jsonResponse({ partnerSummary: allowed ? surface.partnerSummary : null }, allowed ? 200 : 403);
  }

  const privatePitchMatch = pathname.match(/^\/api\/me\/opportunities\/([^/]+)\/private-pitch$/);
  if (privatePitchMatch && request.method === "GET") {
    const authError = requireAuth(request);
    if (authError) return authError;
    const signalId = decodeURIComponent(privatePitchMatch[1]);
    const surface = buildSurfaceSnapshot(signalId);
    const allowed = surface.currentTier === "private_pitch";
    return jsonResponse({ privatePitch: allowed ? surface.privatePitch : null }, allowed ? 200 : 403);
  }

  const draftMatch = pathname.match(/^\/api\/me\/opportunities\/([^/]+)$/);
  if (draftMatch) {
    const signalId = decodeURIComponent(draftMatch[1]);
    const authError = requireAuth(request);
    if (authError) return authError;
    if (request.method === "GET") {
      return jsonResponse({ draft: opportunityRepository.getDraft(signalId) });
    }
    if (request.method === "PUT") {
      const payload = await readJson<UpsertOpportunityDraftPayload>(request);
      if (!payload) return jsonResponse({ error: "Payload lipsă." }, 400);
      if (payload.signalId && payload.signalId !== signalId) {
        return jsonResponse({ error: "Signal ID inconsistent în payload." }, 400);
      }
      if (payload.stage != null && !isOpportunityStage(payload.stage)) {
        return jsonResponse({ error: "Stage invalid." }, 400);
      }
      if (payload.pitchCompletionPct != null && (!Number.isFinite(payload.pitchCompletionPct) || payload.pitchCompletionPct < 0 || payload.pitchCompletionPct > 100)) {
        return jsonResponse({ error: "Pitch completion invalid." }, 400);
      }
      const draft = opportunityRepository.upsertDraft(
        signalId,
        {
          stage: payload.stage ?? "idea",
          pitchCompletionPct: payload.pitchCompletionPct ?? 0,
          currentNeedLabel: payload.currentNeedLabel ?? "",
          currentNeedDescription: payload.currentNeedDescription ?? "",
          ask: payload.ask ?? "",
        },
        payload,
      );
      return jsonResponse({ draft });
    }
  }

  if (pathname === "/api/me/introduction-requests" && request.method === "GET") {
    const authError = requireAuth(request);
    if (authError) return authError;
    return jsonResponse({ requests: opportunityRepository.listIntroductionRequests() });
  }

  if (pathname === "/api/me/introduction-requests" && request.method === "POST") {
    const authError = requireAuth(request);
    if (authError) return authError;
    const payload = await readJson<CreateIntroductionRequestPayload>(request);
    if (!payload?.signalId || !payload.targetLabel?.trim() || payload.targetEntityId == null || !isSignalMatchEntityType(payload.targetEntityType)) {
      return jsonResponse({ error: "Payload invalid pentru introducere." }, 400);
    }
    const created = opportunityRepository.createIntroductionRequest({
      signalId: payload.signalId,
      targetEntityType: payload.targetEntityType,
      targetEntityId: payload.targetEntityId,
      targetLabel: payload.targetLabel,
      note: payload.note ?? null,
    });
    return jsonResponse({ request: created }, 201);
  }

  const bySignalMatch = pathname.match(/^\/api\/me\/introduction-requests\/by-signal\/([^/]+)$/);
  if (bySignalMatch && request.method === "GET") {
    const authError = requireAuth(request);
    if (authError) return authError;
    const signalId = decodeURIComponent(bySignalMatch[1]);
    return jsonResponse({ request: opportunityRepository.getIntroductionRequest(signalId) });
  }

  const statusMatch = pathname.match(/^\/api\/me\/introduction-requests\/([^/]+)\/status$/);
  if (statusMatch && request.method === "PATCH") {
    const authError = requireAuth(request);
    if (authError) return authError;
    const payload = await readJson<UpdateIntroductionRequestStatusPayload>(request);
    if (!payload?.status) return jsonResponse({ error: "Status lipsă." }, 400);
    if (!isIntroductionStatus(payload.status)) {
      return jsonResponse({ error: "Status invalid." }, 400);
    }
    const updated = opportunityRepository.updateIntroductionRequestStatus(
      decodeURIComponent(statusMatch[1]),
      payload.status,
      payload.reason ?? null,
      payload.actorRole ?? "system",
    );
    return updated
      ? jsonResponse({ request: updated })
      : jsonResponse({ error: "Cererea de introducere nu a fost găsită." }, 404);
  }

  return jsonResponse({ error: "Not found." }, 404);
}

async function handleMessages(request: Request, pathname: string): Promise<Response> {
  if (pathname === "/api/me/message-threads" && request.method === "GET") {
    return jsonResponse({ threads: controlledMessageRepository.listThreads() });
  }

  const threadMatch = pathname.match(/^\/api\/me\/message-threads\/([^/]+)$/);
  if (threadMatch && request.method === "GET") {
    return jsonResponse({ thread: controlledMessageRepository.getThread(decodeURIComponent(threadMatch[1])) });
  }

  const messagesMatch = pathname.match(/^\/api\/me\/message-threads\/([^/]+)\/messages$/);
  if (messagesMatch && request.method === "GET") {
    return jsonResponse({ messages: controlledMessageRepository.listMessages(decodeURIComponent(messagesMatch[1])) });
  }
  if (messagesMatch && request.method === "POST") {
    const payload = await readJson<{ body?: string; clientMessageId?: string | null }>(request);
    if (!payload?.body?.trim()) {
      return jsonResponse({ error: "Mesajul este gol." }, 400);
    }
    const message = controlledMessageRepository.createMessage(decodeURIComponent(messagesMatch[1]), {
      body: payload.body,
      clientMessageId: payload.clientMessageId ?? null,
    });
    return jsonResponse({ message }, message ? 201 : 400);
  }

  return jsonResponse({ error: "Not found." }, 404);
}

async function handlePointsEconomy(request: Request, pathname: string): Promise<Response> {
  if (!hasAuth(request)) {
    return jsonResponse({ error: "Autentificare necesară." }, 401);
  }

  const snapshot = readEconomySnapshot();

  if (pathname === "/api/me/points-economy" && request.method === "GET") {
    return jsonResponse(snapshot);
  }

  if (request.method === "POST") {
    const now = new Date().toISOString();
    if (pathname === "/api/me/analytics/premium-unlock") {
      if (!snapshot.analyticsPremium.active) {
        snapshot.analyticsPremium = {
          active: true,
          startAt: now,
          endAt: new Date(Date.now() + snapshot.config.analyticsPremiumHours * 36e5).toISOString(),
          pointsConsumed: snapshot.config.analyticsPremiumCost,
        };
        snapshot.wallet.availablePoints = Math.max(0, snapshot.wallet.availablePoints - snapshot.config.analyticsPremiumCost);
      }
    }

    const activateMatch = pathname.match(/^\/api\/me\/badges\/([^/]+)\/activate$/);
    if (activateMatch) {
      const badge = snapshot.badges.find((item) => item.id === decodeURIComponent(activateMatch[1]));
      if (badge && !badge.owned) {
        badge.owned = true;
        badge.currentLevel = 1;
        badge.nextUpgradeCost = badge.upgradeCost;
        snapshot.wallet.availablePoints = Math.max(0, snapshot.wallet.availablePoints - badge.activationCost);
      }
    }

    const upgradeMatch = pathname.match(/^\/api\/me\/badges\/([^/]+)\/upgrade$/);
    if (upgradeMatch) {
      const badge = snapshot.badges.find((item) => item.id === decodeURIComponent(upgradeMatch[1]));
      if (badge && badge.owned && badge.currentLevel < badge.maxLevel) {
        badge.currentLevel += 1;
        snapshot.wallet.availablePoints = Math.max(0, snapshot.wallet.availablePoints - (badge.nextUpgradeCost ?? 0));
        badge.nextUpgradeCost = badge.currentLevel >= badge.maxLevel ? null : badge.upgradeCost;
      }
    }

    writeEconomySnapshot(snapshot);
    return jsonResponse({ snapshot });
  }

  return jsonResponse({ error: "Not found." }, 404);
}

async function routeApiRequest(request: Request): Promise<Response | null> {
  const { pathname } = parseUrl(request);

  if (pathname === "/api/analytics/track") {
    return request.method === "POST" ? emptyResponse(204) : jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (pathname === "/api/me/profile") {
    return handleProfile(request);
  }

  if (pathname.startsWith("/api/me/companies")) {
    return handleCompanies(request, pathname);
  }

  if (pathname === "/api/me/digest" && request.method === "PUT") {
    return jsonResponse({ ok: true });
  }

  if (pathname.startsWith("/api/me/opportunities") || pathname.startsWith("/api/me/introduction-requests")) {
    return handleOpportunities(request, pathname);
  }

  if (pathname.startsWith("/api/me/message-threads")) {
    return handleMessages(request, pathname);
  }

  if (
    pathname === "/api/me/points-economy"
    || pathname === "/api/me/analytics/premium-unlock"
    || /^\/api\/me\/badges\/[^/]+\/(activate|upgrade)$/.test(pathname)
  ) {
    return handlePointsEconomy(request, pathname);
  }

  return null;
}

export function installLocalApiShim() {
  if (typeof window === "undefined") return;
  if ((window as Window & { [SHIM_FLAG]?: boolean })[SHIM_FLAG]) return;
  if (!isPrivatePreviewHost(window.location.hostname)) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = parseUrl(request);
    const sameOrigin = url.origin === window.location.origin;

    if (sameOrigin && url.pathname.startsWith("/api/")) {
      const response = await routeApiRequest(request);
      if (response) return response;
    }

    return originalFetch(input, init);
  };

  (window as Window & { [SHIM_FLAG]?: boolean })[SHIM_FLAG] = true;
}
