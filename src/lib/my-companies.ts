import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

const KEY = "opp_my_companies";

export interface MyCompany {
  id: number;
  name: string;
  pin?: string | null;
  city?: string | null;
  industry?: string | null;
  logoUrl?: string | null;
  paidTier?: string | null;
  paidUntil?: string | null;
  registeredAt: string;
}

function safeRead(): MyCompany[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(c => c && typeof c.id === "number") : [];
  } catch { return []; }
}

function safeWrite(list: MyCompany[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new CustomEvent("opp-my-companies-changed")); } catch {}
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch { return null; }
}

export function getMyCompanies(): MyCompany[] {
  return safeRead().sort((a, b) => (b.registeredAt ?? "").localeCompare(a.registeredAt ?? ""));
}

export function addMyCompany(c: Omit<MyCompany, "registeredAt"> & { registeredAt?: string }): void {
  if (!c?.id) return;
  // Re-read storage immediately before writing to reduce lost updates
  // when multiple tabs mutate near-simultaneously (last-write-wins, but merged).
  const list = safeRead();
  const idx = list.findIndex(x => x.id === c.id);
  const entry: MyCompany = {
    id: c.id, name: c.name ?? "",
    pin: (c as any).pin ?? null,
    city: c.city ?? null, industry: c.industry ?? null, logoUrl: c.logoUrl ?? null,
    paidTier: (c as any).paidTier ?? null, paidUntil: (c as any).paidUntil ?? null,
    registeredAt: c.registeredAt ?? new Date().toISOString(),
  };
  if (idx >= 0) list[idx] = { ...list[idx], ...entry };
  else list.push(entry);
  safeWrite(list);
}

export function removeMyCompany(id: number): void {
  // Re-read fresh state to merge with any concurrent additions from other tabs.
  safeWrite(safeRead().filter(c => c.id !== id));
}

export interface VerifyResult {
  ok: boolean;
  company?: { id: number; name: string; city: string | null; industry: string | null; logoUrl: string | null; paidTier?: string | null; paidUntil?: string | null };
  error?: string;
}

export async function verifyAndLinkCompany(baseUrl: string, companyId: number, pin: string): Promise<VerifyResult> {
  const id = Number(companyId);
  void pin;
  // PIN verification is considered legacy. We just check if they are logged in 
  // or return ok: false if they aren't authorized to link this company.
  if (!id || isNaN(id)) return { ok: false, error: "ID firmă este obligatoriu." };
  try {
    const token = getAuthToken();
    if (!token) return { ok: false, error: "Trebuie să fii autentificat pentru a lega o firmă." };
    
    // Fallback/Legacy verify logic via API using the user's token directly.
    const resp = await fetch(`${baseUrl}/api/me/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ companyId: id }),
    });
    
    let data: any = {};
    try { data = await resp.json(); } catch {}
    
    if (!resp.ok) {
      return { ok: false, error: data?.error ?? "Verificare eșuată." };
    }
    
    addMyCompany({
      id: data.company.id, name: data.company.name,
      city: data.company.city, industry: data.company.industry, logoUrl: data.company.logoUrl,
      paidTier: data.company.paidTier ?? null, paidUntil: data.company.paidUntil ?? null,
    });
    return { ok: true, company: data.company };
  } catch {
    return { ok: false, error: "Eroare de rețea. Verifică conexiunea." };
  }
}

export async function fetchRemoteMyCompanies(baseUrl: string): Promise<MyCompany[]> {
  const token = getAuthToken();
  if (!token) return [];
  try {
    const resp = await fetch(`${baseUrl}/api/me/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const companies = Array.isArray(data?.companies) ? data.companies : [];
    return companies.map((company: any) => ({
      id: company.id,
      name: company.name ?? "",
      city: company.city ?? null,
      industry: company.industry ?? null,
      logoUrl: company.logoUrl ?? null,
      paidTier: company.paidTier ?? null,
      paidUntil: company.paidUntil ?? null,
      registeredAt: company.registeredAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function syncLocalCompaniesToRemote(baseUrl: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  const localCompanies = safeRead();
  for (const company of localCompanies) {
    try {
      await fetch(`${baseUrl}/api/me/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: company.id }),
      });
    } catch {}
  }
}

export async function unlinkRemoteMyCompany(baseUrl: string, companyId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch(`${baseUrl}/api/me/companies/${companyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}

export function findMyCompanyPin(id: number): string | null {
  void id;
  // Legacy function - we no longer use pins.
  return null;
}

export function hasMyCompanies(): boolean {
  return safeRead().length > 0;
}

export function maskPin(pin: string): string {
  // Legacy function
  if (!pin) return "";
  if (pin.length <= 2) return "•".repeat(pin.length);
  return pin[0] + "•".repeat(Math.max(2, pin.length - 2)) + pin[pin.length - 1];
}
