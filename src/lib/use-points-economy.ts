import { useCallback, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

export interface EconomyConfig {
  impulseBaseCost: number;
  impulseOwnMultiplier: number;
  articleImpulseScoreDelta: number;
  reportImpulseScoreDelta: number;
  analyticsPremiumCost: number;
  analyticsPremiumHours: number;
}

export interface EconomyBadge {
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
}

export interface EconomyTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  source: string;
  refKind?: string | null;
  refId?: number | null;
  createdAt: string;
}

export interface EconomySnapshot {
  wallet: {
    reputation: number;
    availablePoints: number;
    tier: string;
  };
  config: EconomyConfig;
  badges: EconomyBadge[];
  recentTransactions: EconomyTransaction[];
  analyticsPremium: {
    active: boolean;
    startAt: string | null;
    endAt: string | null;
    pointsConsumed: number;
  };
}

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function usePointsEconomy() {
  const [snapshot, setSnapshot] = useState<EconomySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setSnapshot(null);
      setLoading(false);
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE()}/api/me/points-economy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Nu am putut încărca punctele.");
      }
      setSnapshot(payload as EconomySnapshot);
      return payload as EconomySnapshot;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Nu am putut încărca punctele.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleAuthChange = () => { void refresh(); };
    window.addEventListener("opp-auth-changed", handleAuthChange as EventListener);
    return () => window.removeEventListener("opp-auth-changed", handleAuthChange as EventListener);
  }, [refresh]);

  const runAction = useCallback(async (path: string, init?: RequestInit) => {
    const token = getAuthToken();
    if (!token) throw new Error("Autentificare necesară.");
    const response = await fetch(`${BASE()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? "Operațiunea a eșuat.");
    if (payload?.snapshot) setSnapshot(payload.snapshot as EconomySnapshot);
    return payload;
  }, []);

  return {
    snapshot,
    loading,
    error,
    refresh,
    activateBadge: (badgeId: string) => runAction(`/api/me/badges/${badgeId}/activate`, { method: "POST" }),
    upgradeBadge: (badgeId: string) => runAction(`/api/me/badges/${badgeId}/upgrade`, { method: "POST" }),
    unlockPremiumAnalytics: () => runAction("/api/me/analytics/premium-unlock", { method: "POST" }),
  };
}
