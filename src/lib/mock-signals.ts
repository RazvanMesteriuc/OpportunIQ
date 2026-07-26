import type { SignalArtworkVariant } from "@/components/signals/signal-artwork";

export type MockSignal = {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  score: number;
  interestedCount: number;
  artwork: SignalArtworkVariant;
  imageUrl: string;
  badgeClassName: string;
  badgeTextClassName: string;
  accentClassName: string;
  tags: string[];
};

export const mockSignals: MockSignal[] = [
  {
    id: "pet-care-home",
    title: "Servicii de îngrijire pentru animale la domiciliu",
    category: "Animale & Pet Care",
    location: "Timișoara",
    description: "Cerere în creștere pentru servicii de pet sitting și îngrijire personalizată în orașele mari.",
    score: 78,
    interestedCount: 12,
    artwork: "pet-care",
    imageUrl:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    badgeClassName: "bg-cyan-50 border-cyan-200",
    badgeTextClassName: "text-cyan-700",
    accentClassName: "from-cyan-500/10 via-sky-500/10 to-teal-500/10",
    tags: ["Cerere în creștere", "Competiție scăzută", "Interes local"],
  },
  {
    id: "sustainable-packaging",
    title: "Ambalaje sustenabile pentru livrări locale",
    category: "Sustenabilitate",
    location: "Cluj-Napoca",
    description: "Tot mai multe afaceri caută soluții de ambalare ecologice pentru livrările de oraș.",
    score: 71,
    interestedCount: 8,
    artwork: "sustainable-packaging",
    imageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
    badgeClassName: "bg-violet-50 border-violet-200",
    badgeTextClassName: "text-violet-700",
    accentClassName: "from-violet-500/10 via-fuchsia-500/10 to-purple-500/10",
    tags: ["Cerere în creștere", "Tendință pozitivă", "Interes local"],
  },
  {
    id: "outdoor-fitness",
    title: "Antrenamente de grup în aer liber",
    category: "Sănătate & Wellness",
    location: "București",
    description: "Interes crescut pentru antrenamente în aer liber și comunități active în parcuri.",
    score: 83,
    interestedCount: 16,
    artwork: "outdoor-fitness",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    badgeClassName: "bg-amber-50 border-amber-200",
    badgeTextClassName: "text-amber-700",
    accentClassName: "from-amber-500/10 via-orange-500/10 to-rose-500/10",
    tags: ["Cerere în creștere", "Competiție scăzută", "Tendință pozitivă"],
  },
  {
    id: "bio-retail",
    title: "Produse locale și bio în supermarketuri",
    category: "Retail local",
    location: "Iași",
    description: "Interes tot mai mare pentru aprovizionare locală și produse bio listate în retail modern.",
    score: 69,
    interestedCount: 7,
    artwork: "bio-retail",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    badgeClassName: "bg-emerald-50 border-emerald-200",
    badgeTextClassName: "text-emerald-700",
    accentClassName: "from-emerald-500/10 via-lime-500/10 to-teal-500/10",
    tags: ["Cerere stabilă", "Interes local", "Canal retail"],
  },
  {
    id: "agri-expansion",
    title: "Extindere capacitate de producție",
    category: "Agricultură sustenabilă",
    location: "Iași",
    description: "Inițiativă locală cu nevoie de capital, automatizare și distribuție pentru a scala producția.",
    score: 82,
    interestedCount: 24,
    artwork: "agri-expansion",
    imageUrl:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
    badgeClassName: "bg-emerald-50 border-emerald-200",
    badgeTextClassName: "text-emerald-700",
    accentClassName: "from-emerald-500/10 via-sky-500/10 to-amber-500/10",
    tags: ["Cerere în creștere", "Investiție testabilă", "Validare regională"],
  },
];

export const homeTopSignal = mockSignals[0];
export const homeTrendingSignals = [mockSignals[1], mockSignals[2], mockSignals[3]];
export const detailSignal = mockSignals[0];
export const messageSignal = mockSignals[4];

export function getMockSignalById(signalId?: string | null): MockSignal {
  const signal = mockSignals.find((item) => item.id === signalId);
  return signal ?? detailSignal;
}
