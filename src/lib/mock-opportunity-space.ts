import type {
  SignalContactRequestSummary,
  SignalIntentDraft,
  SignalMatchSummary,
} from "@/lib/signal-action-kernel-contract";
import { mockSignals, type MockSignal } from "@/lib/mock-signals";

export type OpportunityStage = "idea" | "validation" | "plan" | "pitch";
export type OpportunityRequirementStatus = "done" | "next" | "missing";
export type OpportunityPitchStatus = "draft" | "in_progress" | "ready_for_discussion";
export type IntroductionGateStatus = "locked" | "eligible" | "pending";

export type OpportunityRequirement = {
  id: string;
  label: string;
  note: string;
  status: OpportunityRequirementStatus;
};

export type OpportunityPitchSummary = {
  status: OpportunityPitchStatus;
  completionPct: number;
  title: string;
  summary: string;
  ask: string;
  useOfFunds: string[];
};

export type OpportunityCurrentNeed = {
  label: string;
  description: string;
};

export type OpportunityValidationPoint = {
  label: string;
  note: string;
  strength: "strong" | "emerging" | "missing";
};

export type OpportunityPartnerView = {
  headline: string;
  suitableFor: string;
  builtAssets: string[];
  validationSignals: OpportunityValidationPoint[];
  openQuestions: string[];
  nextMilestone: string;
};

export type OpportunityPublicBoard = {
  investorHook: string;
  sellabilityLabel: string;
  publicSummary: string;
  visibleStrengths: string[];
  communityProof: string[];
  confidentialBoundaries: string[];
};

export type IntroductionGate = {
  status: IntroductionGateStatus;
  label: string;
  note: string;
  missingItems: string[];
  request: SignalContactRequestSummary | null;
};

export type OpportunitySpaceRecord = {
  signalId: string;
  signalTitle: string;
  title: string;
  category: string;
  location: string;
  county: string;
  imageUrl: string;
  signalScore: number;
  confidenceLabel: "ridicată" | "medie" | "scăzută";
  stage: OpportunityStage;
  heroSummary: string;
  whyNow: string;
  problem: string;
  solution: string;
  businessModel: string;
  evidencePillars: string[];
  requirements: OpportunityRequirement[];
  pitch: OpportunityPitchSummary;
  currentNeed: OpportunityCurrentNeed;
  partnerView: OpportunityPartnerView;
  publicBoard: OpportunityPublicBoard;
  readinessPct: number;
  followersCount: number;
  interestedCount: number;
  discussionReady: boolean;
  missingForDiscussion: string[];
  intentDraft: SignalIntentDraft;
  matchPreview: SignalMatchSummary[];
  introGate: IntroductionGate;
};

const countyByLocation: Record<string, string> = {
  Bucuresti: "Bucuresti",
  "Cluj-Napoca": "Cluj",
  Timisoara: "Timis",
  Iasi: "Iasi",
};

function inferCounty(location: string): string {
  return countyByLocation[location] ?? "Romania";
}

export type OpportunitySurfaceState =
  | "incipient_signal"
  | "signal_with_direction"
  | "built_opportunity"
  | "discussion_ready";

export function getOpportunitySurfaceState(input: {
  stage: OpportunityStage;
  readinessPct: number;
  discussionReady: boolean;
}): OpportunitySurfaceState {
  if (input.discussionReady || input.stage === "pitch" || input.readinessPct >= 82) {
    return "discussion_ready";
  }
  if (input.stage === "plan" || input.readinessPct >= 70) {
    return "built_opportunity";
  }
  if (input.stage === "validation") {
    return "signal_with_direction";
  }
  return "incipient_signal";
}

function createMatchSummary(
  entityId: string,
  anonymousLabel: string,
  county: string,
  locality: string,
  industry: string,
  score: number,
  reasonLabels: string[],
  verified = true,
): SignalMatchSummary {
  return {
    entityType: "company",
    entityId,
    score,
    geoScope: locality ? "locality" : "county",
    county,
    locality,
    industry,
    verified,
    reasonLabels,
    anonymousLabel,
  };
}

function createOpportunityRecord(
  signal: MockSignal,
  overrides?: Partial<OpportunitySpaceRecord>,
): OpportunitySpaceRecord {
  const county = inferCounty(signal.location);
  const defaultRequirements: OpportunityRequirement[] = [
    {
      id: "problem-fit",
      label: "Problema si clientul tinta sunt clar definite",
      note: "Descrii cine are nevoie reala si de ce plateste.",
      status: "done",
    },
    {
      id: "evidence-pack",
      label: "Semnalul este sustinut de dovezi si context local",
      note: "Legi ideea de datele si tensiunile din piata.",
      status: "done",
    },
    {
      id: "offer-shape",
      label: "Oferta minima este formulata pentru un test real",
      note: "Ai nevoie de un pachet simplu care poate fi validat.",
      status: "next",
    },
    {
      id: "execution-needs",
      label: "Stii ce partener sau capital cauti acum",
      note: "Fara aceasta claritate, potrivirile raman prea generale.",
      status: "missing",
    },
  ];

  const defaultPitch: OpportunityPitchSummary = {
    status: "in_progress",
    completionPct: 62,
    title: `Pitch de lucru pentru ${signal.title}`,
    summary: "Opportunity brief cu problema, cerere observata, abordare initiala si obiectiv de validare.",
    ask: "Caut partener operational si 1-2 discutii de validare in piata locala.",
    useOfFunds: ["Test de cerere", "Operare pilot", "Activare clienti initiali"],
  };

  const defaultMatchPreview: SignalMatchSummary[] = [
    createMatchSummary(
      `${signal.id}-operator`,
      `Operator verificat din ${signal.location}`,
      county,
      signal.location,
      signal.category,
      91,
      ["Acelasi oras", "Poate executa rapid", "Interes pentru testare"],
    ),
    createMatchSummary(
      `${signal.id}-investor`,
      `Investitor anonim din ${county}`,
      county,
      "",
      "Capital & parteneriate",
      78,
      ["Interes pe semnale validate", "Experienta in servicii locale"],
      false,
    ),
  ];

  const defaultPartnerView: OpportunityPartnerView = {
    headline: "Oportunitate inca in structurare, utila mai ales pentru validare si executie initiala.",
    suitableFor: "Operatori locali, colaboratori de lansare si parteneri care pot valida rapid terenul.",
    builtAssets: [
      "Problema si contextul de piata sunt formulate",
      "Exista un unghi initial de oferta si un prim ask",
      "Potriviri relevante pot fi filtrate local",
    ],
    validationSignals: [
      {
        label: "Cerere observabila",
        note: "Exista semnal suficient ca sa merite testul, dar nu o garantie de conversie.",
        strength: "strong",
      },
      {
        label: "Oferta minima definita partial",
        note: "Directia exista, dar pachetul pilot mai are nevoie de claritate.",
        strength: "emerging",
      },
      {
        label: "Canal initial de achizitie",
        note: "Nu este inca suficient de clar pentru o discutie comerciala puternica.",
        strength: "missing",
      },
    ],
    openQuestions: [
      "Ce pachet minim poate fi vandut in primele 30 de zile?",
      "Ce tip de partener accelereaza validarea mai repede decat capitalul pur?",
      "Ce indicator ar valida ca merita extinderea dupa pilot?",
    ],
    nextMilestone: "Definirea ofertei pilot si pregatirea unei prime introduceri bine filtrate.",
  };

  const defaultPublicBoard: OpportunityPublicBoard = {
    investorHook: "Nevoia este reala, dar oportunitatea este inca intr-o faza in care conteaza mai mult validarea disciplinata decat expunerea larga.",
    sellabilityLabel: "vandabila pentru validare",
    publicSummary:
      "Tertii pot intelege tensiunea din piata, directia propusa si reactia comunitatii, fara sa vada mecanica sensibila a executiei.",
    visibleStrengths: [
      "Semnalul este sustinut de date si context local",
      "Exista o directie clara de oferta si un client tinta",
      "Interesul comunitatii confirma ca merita o discutie",
    ],
    communityProof: [
      "Urmaririle si interesul agregat valideaza ca problema este recognoscibila",
      "Potrivirile si reactiile comunitatii ajuta la testarea fezabilitatii",
      "Tertii vad momentum-ul, nu datele private ale fondatorului",
    ],
    confidentialBoundaries: [
      "Detaliile operationale fine raman private",
      "Structura exacta a executiei si cifrele sensibile nu sunt publice",
      "Pitch-ul complet se deschide doar dupa introducere acceptata",
    ],
  };

  const base: OpportunitySpaceRecord = {
    signalId: signal.id,
    signalTitle: signal.title,
    title: `Spațiu de oportunitate pentru ${signal.title}`,
    category: signal.category,
    location: signal.location,
    county,
    imageUrl: signal.imageUrl,
    signalScore: signal.score,
    confidenceLabel: signal.score >= 80 ? "ridicată" : signal.score >= 70 ? "medie" : "scăzută",
    stage: "validation",
    heroSummary:
      "Transformi semnalul intr-o oportunitate executabila, cu ipoteze clare, dovezi suport si un pitch care poate intra in discutii controlate.",
    whyNow:
      "Exista suficienta tensiune in piata pentru a testa rapid oferta, dar inca lipsesc claritatea executiei si partenerul potrivit.",
    problem:
      "Clientii vad o nevoie recurenta, dar oferta locala este fragmentata, inegala sau insuficient specializata.",
    solution:
      "O oferta mai clara, mai bine pozitionata si mai usor de testat decat optiunile actuale din piata.",
    businessModel:
      "Model orientat pe pachet pilot, validare rapida si extindere doar dupa dovezi de cerere si executie.",
    evidencePillars: signal.tags,
    requirements: defaultRequirements,
    pitch: defaultPitch,
    currentNeed: {
      label: "Caut validare si executie initiala",
      description: "Ai nevoie de 1-2 parteneri relevanti si de un pilot local, nu de expunere larga prematura.",
    },
    partnerView: defaultPartnerView,
    publicBoard: defaultPublicBoard,
    readinessPct: 68,
    followersCount: signal.interestedCount + 14,
    interestedCount: signal.interestedCount,
    discussionReady: false,
    missingForDiscussion: [
      "Oferta minima formulata",
      "Mesaj scurt pentru introducere",
      "Criteriu clar pentru partenerul cautat",
    ],
    intentDraft: {
      signalEntityType: "article",
      signalEntityId: signal.id,
      intentType: "test_idea",
      industry: signal.category,
      county,
      locality: signal.location,
      shortMessage: `Vreau sa testez oportunitatea pornind de la semnalul ${signal.title}.`,
      visibility: "aggregate_only",
      linkedCompanyId: null,
    },
    matchPreview: defaultMatchPreview,
    introGate: {
      status: "locked",
      label: "Introducerea este inca blocata",
      note: "Cererea de introducere se deschide dupa ce oportunitatea e suficient de clara pentru o discutie utila.",
      missingItems: [
        "Pitch minim completat",
        "Ce cauti acum formulat explicit",
        "Un mesaj scurt pentru contextul introducerii",
      ],
      request: null,
    },
  };

  return {
    ...base,
    ...overrides,
    currentNeed: {
      ...base.currentNeed,
      ...(overrides?.currentNeed ?? {}),
    },
    pitch: {
      ...base.pitch,
      ...(overrides?.pitch ?? {}),
    },
    partnerView: {
      ...base.partnerView,
      ...(overrides?.partnerView ?? {}),
      builtAssets: overrides?.partnerView?.builtAssets ?? base.partnerView.builtAssets,
      validationSignals: overrides?.partnerView?.validationSignals ?? base.partnerView.validationSignals,
      openQuestions: overrides?.partnerView?.openQuestions ?? base.partnerView.openQuestions,
    },
    publicBoard: {
      ...base.publicBoard,
      ...(overrides?.publicBoard ?? {}),
      visibleStrengths: overrides?.publicBoard?.visibleStrengths ?? base.publicBoard.visibleStrengths,
      communityProof: overrides?.publicBoard?.communityProof ?? base.publicBoard.communityProof,
      confidentialBoundaries: overrides?.publicBoard?.confidentialBoundaries ?? base.publicBoard.confidentialBoundaries,
    },
    introGate: {
      ...base.introGate,
      ...(overrides?.introGate ?? {}),
    },
    requirements: overrides?.requirements ?? base.requirements,
    matchPreview: overrides?.matchPreview ?? base.matchPreview,
    missingForDiscussion: overrides?.missingForDiscussion ?? base.missingForDiscussion,
    evidencePillars: overrides?.evidencePillars ?? base.evidencePillars,
  };
}

const opportunityOverrides: Record<string, Partial<OpportunitySpaceRecord>> = {
  "pet-care-home": {
    readinessPct: 74,
    discussionReady: true,
    stage: "plan",
    whyNow:
      "Cererea este vizibila, oferta locala ramane inegala, iar serviciile premium pentru animale au loc pentru un operator mai profesionist.",
    problem:
      "Proprietarii de animale cauta incredere, disponibilitate si servicii predictibile, dar furnizorii actuali nu comunica clar si nu scaleaza uniform.",
    solution:
      "Un serviciu de pet sitting la domiciliu cu selectie de personal, pachete clare si suport digital pentru rezervari si incredere.",
    businessModel:
      "Abonamente usoare, pachete ocazionale si parteneriate locale cu cabinete veterinare sau pet shop-uri.",
    pitch: {
      status: "ready_for_discussion",
      completionPct: 86,
      title: "Pitch aproape pregătit pentru discuții controlate",
      summary:
        "Problema, oferta pilot și nevoia de partener operațional sunt suficient de clare pentru conversații inițiale bine filtrate.",
      ask: "Caut un partener operational local si 2 discutii de introducere cu potentiali distribuitori sau investitori angel.",
      useOfFunds: ["Pilot in 2 cartiere", "Selectie si training", "Promovare initiala"],
    },
    currentNeed: {
      label: "Caut partener operational si discutii de introducere",
      description: "Oportunitatea este aproape pregatita pentru conversatii controlate cu executanti si sustinatori locali.",
    },
    partnerView: {
      headline: "Oportunitate construita suficient cat sa poata fi discutata ca pilot operational, nu doar ca intuitie de piata.",
      suitableFor: "Investitori angel locali, operatori de servicii premium si parteneri de distributie care apreciaza validarea disciplinata.",
      builtAssets: [
        "Problema, clientul tinta si promisiunea serviciului sunt clarificate",
        "Exista un model pilot cu zone, pachete si utilizare initiala a resurselor",
        "Ask-ul actual este explicit: executie locala si introduceri relevante",
      ],
      validationSignals: [
        {
          label: "Cerere locala si disponibilitate insuficienta",
          note: "Semnalul de piata este puternic si bine ancorat in comportamentul local.",
          strength: "strong",
        },
        {
          label: "Oferta pilot formulata",
          note: "Nu este perfecta, dar este suficient de concreta pentru discutii serioase.",
          strength: "strong",
        },
        {
          label: "Canal initial de achizitie",
          note: "Exista o directie prin parteneri locali, dar mai trebuie validata economic.",
          strength: "emerging",
        },
      ],
      openQuestions: [
        "Ce combinatie de abonament si pachet ocazional maximizeaza retentia?",
        "Cat de repede poate fi replicat modelul dupa primele doua cartiere?",
        "Care este mixul optim intre partener operational si capital usor?",
      ],
      nextMilestone: "Pilot in doua cartiere si primele introduceri filtrate catre operatori sau sustinatori relevanti.",
    },
    publicBoard: {
      investorHook: "O problema clara, o oferta pilot inteligibila si un semnal comunitar suficient de puternic cat sa sustina o conversatie de tip Arena Leilor.",
      sellabilityLabel: "vandabila pentru discutii selective",
      publicSummary:
        "Oportunitatea poate fi inteleasa public prin problema, teza de diferentiere si reactia pietei, fara sa fie expuse mecanismele sensibile de executie.",
      visibleStrengths: [
        "Problema si clientul tinta sunt clar articulate",
        "Oferta pilot este suficient de concreta pentru parteneri selectivi",
        "Exista deja semnal de comunitate si interes agregat local",
      ],
      communityProof: [
        "Interesul agregat arata ca problema nu este doar intuitiva",
        "Urmaritorii si cei interesati creeaza validare sociala timpurie",
        "Feedback-ul comunitatii ajuta tertii sa estimeze fezabilitatea fara acces la date avansate",
      ],
      confidentialBoundaries: [
        "Unit economics detaliat ramane privat",
        "Playbook-ul operational si executia fina nu sunt publice",
        "Detaliile complete se deschid doar dupa introducere controlata",
      ],
    },
    missingForDiscussion: ["Canalul initial de achizitie definit"],
    introGate: {
      status: "eligible",
      label: "Poate solicita introducere controlata",
      note: "Profilul este suficient de clar pentru o discutie initiala cu potriviri compatibile.",
      missingItems: [],
      request: null,
    },
  },
  "sustainable-packaging": {
    readinessPct: 63,
    stage: "validation",
    currentNeed: {
      label: "Caut validare comerciala B2B",
      description: "Merita discutii cu retaileri si operatori de livrare, dar inca lipseste forma exacta a ofertei.",
    },
  },
  "outdoor-fitness": {
    readinessPct: 66,
    stage: "validation",
    currentNeed: {
      label: "Caut pilot si comunitate locala",
      description: "Oportunitatea are semnale bune de interes, dar trebuie testata structura de produs si frecventa participarii.",
    },
  },
  "bio-retail": {
    readinessPct: 58,
    stage: "validation",
    currentNeed: {
      label: "Caut acces la canal retail",
      description: "Inainte de discutii largi, trebuie clarificate sortimentul si avantajul competitiv pentru retail.",
    },
  },
  "agri-expansion": {
    readinessPct: 81,
    discussionReady: true,
    stage: "pitch",
    heroSummary:
      "Semnalul indica o oportunitate de extindere mai matura, unde pitch-ul si introducerile controlate pot accelera executia daca sunt bine justificate.",
    currentNeed: {
      label: "Caut capital, automatizare si distributie",
      description: "Exista nevoie clara de parteneri de executie si discutii selectate cu finantatori sau operatori comerciali.",
    },
    partnerView: {
      headline: "Oportunitate aflata deja in faza de pitch, potrivita pentru conversatii selective despre executie si capital.",
      suitableFor: "Parteneri comerciali mari, operatori de automatizare si finantatori care cer o logica de scalare clara.",
      builtAssets: [
        "Teza de crestere este deja articulata",
        "Nevoia de capital si executie este delimitata",
        "Introducerea controlata a fost deja ceruta",
      ],
      validationSignals: [
        {
          label: "Tractiune si context de extindere",
          note: "Semnalul depaseste faza de simpla observatie si sustine o discutie de scalare.",
          strength: "strong",
        },
        {
          label: "Plan de executie",
          note: "Exista suficienta claritate pentru parteneri de implementare.",
          strength: "strong",
        },
        {
          label: "Structura finala de finantare",
          note: "Mai necesita rafinare inainte de un proces complet de investitie.",
          strength: "emerging",
        },
      ],
      openQuestions: [
        "Cum se distribuie capitalul intre automatizare si canal comercial?",
        "Ce KPI-uri blocheaza etapa urmatoare de scalare?",
      ],
      nextMilestone: "Conversatii de pitch selective si structurarea pachetului de executie.",
    },
    publicBoard: {
      investorHook: "Oportunitate deja suficient de matura pentru discutii selective despre scalare, fara a expune public structura completa a executiei.",
      sellabilityLabel: "vandabila pentru pitch controlat",
      publicSummary:
        "Tabloul public arata clar de ce merita atentie: semnal, tractiune, directie si interes, in timp ce datele sensibile raman protejate.",
      visibleStrengths: [
        "Exista teza de crestere si nevoie concreta de executie",
        "Interesul este suficient de matur pentru conversatii filtrate",
        "Contextul sustine o discutie despre scalare, nu doar despre validare",
      ],
      communityProof: [
        "Interactiunea comunitatii valideaza relevanta oportunitatii in ecosistem",
        "Semnalele agregate reduc perceptia de idee izolata",
        "Tertii pot evalua momentum-ul fara acces la date sensibile",
      ],
      confidentialBoundaries: [
        "Datele operationale avansate raman private",
        "Structura exacta de finantare nu este publica",
        "Accesul aprofundat apare doar dupa filtrare si introducere acceptata",
      ],
    },
    introGate: {
      status: "pending",
      label: "Introducere deja solicitata",
      note: "O cerere de introducere este in asteptare si poate continua doar dupa acceptare.",
      missingItems: [],
      request: {
        targetEntityType: "company",
        targetEntityId: "agri-expansion-investor",
        signalEntityType: "article",
        signalEntityId: "agri-expansion",
        status: "pending",
        createdAt: "2026-06-10T09:30:00.000Z",
        acceptedAt: null,
      },
    },
  },
};

const opportunityRecords = mockSignals.map((signal) =>
  createOpportunityRecord(signal, opportunityOverrides[signal.id]),
);

export function getOpportunitySpaceBySignalId(signalId?: string | null): OpportunitySpaceRecord {
  const record = opportunityRecords.find((item) => item.signalId === signalId);
  return record ?? opportunityRecords[0];
}

export function buildOpportunityPath(signalId: string): string {
  return `/semnale/${signalId}/oportunitate`;
}

export function buildMatchesPath(signalId?: string | null): string {
  if (!signalId) return "/potriviri";
  return `/potriviri?signalId=${encodeURIComponent(signalId)}`;
}

export function buildSignalPath(signalId: string): string {
  return `/semnale/${signalId}`;
}

export const mockOpportunitySpaces = opportunityRecords;
