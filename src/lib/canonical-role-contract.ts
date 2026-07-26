import type { UserRole } from "@/lib/use-profile";

export type CanonicalActorRole = "antreprenor" | "partener";

export type CanonicalPartnerKind =
  | "investitor"
  | "furnizor"
  | "colaborator"
  | "operator"
  | "generalist";

export type AccessPrincipal = {
  userId?: string | number | null;
  companyId?: string | number | null;
  ownerKey?: string | null;
  actorRole: CanonicalActorRole;
  partnerKinds: CanonicalPartnerKind[];
};

export function normalizeLegacyUserRole(role?: UserRole | string | null): UserRole | "" {
  switch (String(role ?? "").trim().toLowerCase()) {
    case "antreprenor":
    case "aspirant":
      return "antreprenor";
    case "partener":
    case "investitor":
    case "furnizor":
    case "prestator":
      return "partener";
    default:
      return "";
  }
}

export function getCanonicalActorRole(role?: UserRole | string | null): CanonicalActorRole | null {
  const normalized = normalizeLegacyUserRole(role);
  if (!normalized) return null;
  return normalized;
}

export function getCanonicalPartnerKinds(role?: UserRole | string | null): CanonicalPartnerKind[] {
  const normalized = normalizeLegacyUserRole(role);
  return normalized === "partener" ? ["generalist"] : [];
}

export function isEntrepreneurActor(role?: UserRole | string | null): boolean {
  return getCanonicalActorRole(role) === "antreprenor";
}

export function isPartnerActor(role?: UserRole | string | null): boolean {
  return getCanonicalActorRole(role) === "partener";
}

export function hasPartnerKind(
  role: UserRole | string | null | undefined,
  partnerKind: CanonicalPartnerKind,
): boolean {
  return getCanonicalPartnerKinds(role).includes(partnerKind);
}
