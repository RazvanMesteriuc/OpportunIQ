import { useState, useEffect, useCallback } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";
import { normalizeLegacyUserRole } from "@/lib/canonical-role-contract";
import { reportDebugEvent } from "@/lib/debug-event-client";

export type UserRole = "antreprenor" | "partener" | "";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  judet?: string;
  industry: string;
  role: UserRole;
  counties: string[];
  setup: boolean;
  avatarUrl?: string;
}

export interface AdvisorMeta {
  unlocked: boolean;
  label: string;
  reputationScore: number;
  interactions: number;
  voteSignals: number;
  commentSignals: number;
  articleSignals: number;
  unlockThreshold: {
    reputationScore: number;
    interactions: number;
    voteSignals: number;
    commentSignals: number;
  };
  progressPct: number;
}

export interface ProfileMeta {
  roleLocked: boolean;
  advisor: AdvisorMeta;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  phone: "",
  city: "",
  judet: "",
  industry: "",
  role: "",
  counties: [],
  setup: false,
};

export const PROFILE_STORAGE_KEY = "oiq_user_profile";
const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");
const PROFILE_SYNC_DEDUP_MS = 3000;

function buildDefaultProfileMeta(): ProfileMeta {
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

type ProfileStoreState = {
  profile: UserProfile;
  meta: ProfileMeta;
  hydrated: boolean;
};

let profileStoreState: ProfileStoreState = {
  profile: readLocalProfile(),
  meta: buildDefaultProfileMeta(),
  hydrated: false,
};

const profileStoreListeners = new Set<() => void>();
let profileSyncPromise: Promise<void> | null = null;
let lastProfileSyncAt = 0;
let lastProfileSyncToken: string | null = null;
let profileStoreInitialized = false;

function emitProfileStore() {
  //#region debug-point profile-store-emit
  reportDebugEvent({
    sessionId: "frontend-stack-overflow",
    area: "useProfile",
    point: "emitProfileStore",
    listenerCount: profileStoreListeners.size,
    hydrated: profileStoreState.hydrated,
    profileSetup: profileStoreState.profile.setup,
    profileRole: profileStoreState.profile.role,
    timestamp: Date.now(),
  });
  //#endregion debug-point profile-store-emit
  profileStoreListeners.forEach((listener) => listener());
}

function setProfileStoreState(nextState: Partial<ProfileStoreState>) {
  profileStoreState = {
    ...profileStoreState,
    ...nextState,
  };
  emitProfileStore();
}

function subscribeProfileStore(listener: () => void) {
  profileStoreListeners.add(listener);
  return () => {
    profileStoreListeners.delete(listener);
  };
}

function ensureProfileStoreInitialized() {
  if (profileStoreInitialized || typeof window === "undefined") {
    return;
  }

  profileStoreInitialized = true;
  void syncProfileFromServer();

  const handleProfileStorageSync = (event: StorageEvent) => {
    if (event.key && event.key !== AUTH_TOKEN_KEY && event.key !== PROFILE_STORAGE_KEY) {
      return;
    }
    void syncProfileFromServer({ force: true });
  };

  const handleAuthChange = () => {
    void syncProfileFromServer({ force: true });
  };

  window.addEventListener("storage", handleProfileStorageSync);
  window.addEventListener("opp-auth-changed", handleAuthChange as EventListener);
}

export function readLocalProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserProfile> & { role?: string };
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        role: normalizeLegacyUserRole(parsed.role),
      };
    }
  } catch {}
  return DEFAULT_PROFILE;
}

export function writeLocalProfile(p: UserProfile) {
  try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function getAuthToken(): string | null {
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch { return null; }
}

async function syncProfileFromServer(options?: { force?: boolean }) {
  const token = getAuthToken();
  //#region debug-point profile-sync-start
  reportDebugEvent({
    sessionId: "frontend-stack-overflow",
    area: "useProfile",
    point: "syncProfileFromServer:start",
    hasToken: Boolean(token),
    force: Boolean(options?.force),
    hydrated: profileStoreState.hydrated,
    lastProfileSyncAt,
    lastProfileSyncTokenMatch: lastProfileSyncToken === token,
    timestamp: Date.now(),
  });
  //#endregion debug-point profile-sync-start
  if (!token) {
    lastProfileSyncToken = null;
    lastProfileSyncAt = Date.now();
    setProfileStoreState({
      profile: readLocalProfile(),
      hydrated: true,
    });
    return;
  }

  if (profileSyncPromise) {
    //#region debug-point profile-sync-inflight
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "useProfile",
      point: "syncProfileFromServer:reuse-inflight",
      timestamp: Date.now(),
    });
    //#endregion debug-point profile-sync-inflight
    return profileSyncPromise;
  }

  const now = Date.now();
  if (
    !options?.force
    && profileStoreState.hydrated
    && lastProfileSyncToken === token
    && now - lastProfileSyncAt < PROFILE_SYNC_DEDUP_MS
  ) {
    //#region debug-point profile-sync-dedup
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "useProfile",
      point: "syncProfileFromServer:dedup-skip",
      dedupWindowMs: PROFILE_SYNC_DEDUP_MS,
      timestamp: Date.now(),
    });
    //#endregion debug-point profile-sync-dedup
    return;
  }

  profileSyncPromise = (async () => {
    try {
      const res = await fetch(`${BASE()}/api/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const remote: UserProfile = { ...DEFAULT_PROFILE, ...data.profile };
      const nextMeta = data?.meta ? { ...profileStoreState.meta, ...data.meta } : profileStoreState.meta;

      const local = readLocalProfile();
      if (!remote.setup && local.setup) {
        const pushRes = await fetch(`${BASE()}/api/me/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(local),
        });

        if (pushRes.ok) {
          const pushedData = await pushRes.json().catch(() => null);
          const pushedProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            ...(pushedData?.profile ?? local),
            setup: true,
          };
          writeLocalProfile(pushedProfile);
          setProfileStoreState({
            profile: pushedProfile,
            meta: pushedData?.meta ? { ...nextMeta, ...pushedData.meta } : nextMeta,
          });
          return;
        }

        const merged = { ...local, setup: true };
        writeLocalProfile(merged);
        setProfileStoreState({
          profile: merged,
          meta: nextMeta,
        });
        return;
      }

      writeLocalProfile(remote);
      setProfileStoreState({
        profile: remote,
        meta: nextMeta,
      });
    } catch {
      // network errors fall back to local cache
    } finally {
      lastProfileSyncAt = Date.now();
      lastProfileSyncToken = token;
      profileSyncPromise = null;
      setProfileStoreState({ hydrated: true });
    }
  })();

  return profileSyncPromise;
}

/**
 * Profile hook with cross-device sync.
 *
 * - When the user is logged in (auth token present), the profile is fetched
 *   from /api/me/profile on mount and any save is PUT back to the server.
 *   localStorage is still used as an offline-friendly cache so the UI doesn't
 *   flash empty during the network round-trip.
 * - When NOT logged in, the profile is local-only — same behaviour as before.
 *   The first time the user logs in, any local data is pushed to the server
 *   so they don't lose what they typed as a guest.
 */
export function useProfile() {
  const [state, setState] = useState<ProfileStoreState>(() => profileStoreState);

  useEffect(() => {
    ensureProfileStoreInitialized();
    //#region debug-point profile-subscribe
    reportDebugEvent({
      sessionId: "frontend-stack-overflow",
      area: "useProfile",
      point: "subscribe",
      nextListenerCount: profileStoreListeners.size + 1,
      timestamp: Date.now(),
    });
    //#endregion debug-point profile-subscribe
    return subscribeProfileStore(() => {
      setState(profileStoreState);
    });
  }, []);

  const saveProfile = useCallback((updates: Partial<UserProfile>) => {
    const next = { ...profileStoreState.profile, ...updates, setup: true };
    writeLocalProfile(next);
    setProfileStoreState({
      profile: next,
      hydrated: true,
    });

    const token = getAuthToken();
    if (token) {
      // Fire-and-forget. Local cache already updated so UI is responsive.
      fetch(`${BASE()}/api/me/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json().catch(() => null);
          if (data?.profile) {
            const remote: UserProfile = { ...DEFAULT_PROFILE, ...data.profile };
            writeLocalProfile(remote);
            setProfileStoreState({ profile: remote });
          }
          if (data?.meta) {
            setProfileStoreState({ meta: { ...profileStoreState.meta, ...data.meta } });
          }
        })
        .catch(() => {/* keep local change even if sync fails */});
    }
  }, []);

  const clearProfile = useCallback(() => {
    try { localStorage.removeItem(PROFILE_STORAGE_KEY); } catch {}
    setProfileStoreState({
      profile: DEFAULT_PROFILE,
      hydrated: true,
    });
    // Note: we deliberately do NOT clear server-side on logout — when the user
    // signs in again on any device, their saved profile re-hydrates.
  }, []);

  return {
    profile: state.profile,
    meta: state.meta,
    saveProfile,
    clearProfile,
    hydrated: state.hydrated,
  };
}
