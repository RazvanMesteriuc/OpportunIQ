import type { SignalSourceRegistryKey } from "@/lib/signal-action-kernel-contract";
import type { SignalSourceRuntimeRequirement } from "@/lib/signal-source-contract";
import {
  getSignalSourceRegistryEntry,
  listSignalSourceRegistryEntries,
} from "@/lib/signal-source-registry";

type PublicFeatureFlag = `VITE_SIGNAL_SOURCE_${string}_ENABLED`;

export type SignalSourcePublicRuntimeStatus =
  | "enabled"
  | "enabled_via_server_proxy"
  | "disabled_by_flag"
  | "provider_access_required";

export type SignalSourcePublicRuntimeSummary = {
  key: SignalSourceRegistryKey;
  label: string;
  runtimeRequirement: SignalSourceRuntimeRequirement;
  status: SignalSourcePublicRuntimeStatus;
  enabledByFlag: boolean;
  notes: string;
};

function readPublicFlag(flagName: PublicFeatureFlag, fallback: boolean): boolean {
  const envValue = import.meta.env[flagName];
  if (envValue == null) return fallback;
  return String(envValue).trim().toLowerCase() === "true";
}

function toFeatureFlagName(key: SignalSourceRegistryKey): PublicFeatureFlag {
  return `VITE_SIGNAL_SOURCE_${key.toUpperCase()}_ENABLED`;
}

export function getSignalSourcePublicRuntimeSummary(key: SignalSourceRegistryKey): SignalSourcePublicRuntimeSummary {
  const source = getSignalSourceRegistryEntry(key);
  const enabledByFlag = readPublicFlag(toFeatureFlagName(key), source.status !== "planned");

  if (!enabledByFlag) {
    return {
      key,
      label: source.label,
      runtimeRequirement: source.runtimeRequirement,
      status: "disabled_by_flag",
      enabledByFlag,
      notes: `${source.label} este dezactivata explicit prin flag public.`,
    };
  }

  if (source.runtimeRequirement === "server_required") {
    return {
      key,
      label: source.label,
      runtimeRequirement: source.runtimeRequirement,
      status:
        source.status === "blocked_by_provider_access"
          ? "provider_access_required"
          : "enabled_via_server_proxy",
      enabledByFlag,
      notes:
        source.status === "blocked_by_provider_access"
          ? `${source.label} ramane blocata pana exista acces aprobat stabil de la provider.`
          : `${source.label} este accesibila doar prin boundary server-side; frontend-ul nu trebuie sa tina chei.`,
    };
  }

  return {
    key,
    label: source.label,
    runtimeRequirement: source.runtimeRequirement,
    status: "enabled",
    enabledByFlag,
    notes: `${source.label} poate fi folosita in boundary-ul curent fara chei sensibile in client.`,
  };
}

export function listSignalSourcePublicRuntimeSummaries(): SignalSourcePublicRuntimeSummary[] {
  return listSignalSourceRegistryEntries().map((entry) => getSignalSourcePublicRuntimeSummary(entry.key));
}
