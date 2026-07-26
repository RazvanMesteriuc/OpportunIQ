import type {
  OpportunityPartnerView,
  OpportunityPublicBoard,
  OpportunityValidationPoint,
} from "@/lib/mock-opportunity-space";

export type OpportunitySurfaceTier = "public_board" | "partner_summary" | "private_pitch";

export type OpportunityPublicBoardDto = OpportunityPublicBoard & {
  tier: "public_board";
};

export type OpportunityPartnerSummaryDto = {
  tier: "partner_summary";
  headline: string;
  suitableFor: string;
  builtAssets: string[];
  validationSignals: OpportunityValidationPoint[];
  openQuestions: string[];
  nextMilestone: string;
};

export type OpportunityPrivatePitchDto = {
  tier: "private_pitch";
  title: string;
  summary: string;
  ask: string;
  useOfFunds: string[];
  currentNeedLabel: string;
  currentNeedDescription: string;
  pitchCompletionPct: number;
};

export type OpportunitySurfaceSnapshotDto = {
  signalId: string;
  currentTier: OpportunitySurfaceTier;
  publicBoard: OpportunityPublicBoardDto;
  partnerSummary: OpportunityPartnerSummaryDto;
  privatePitch: OpportunityPrivatePitchDto;
  activeTierNote: string;
};

export function buildOpportunitySurfaceSnapshot(input: {
  signalId: string;
  currentTier: OpportunitySurfaceTier;
  publicBoard: OpportunityPublicBoard;
  partnerView: OpportunityPartnerView;
  privatePitch: {
    title: string;
    summary: string;
    ask: string;
    useOfFunds: string[];
    currentNeedLabel: string;
    currentNeedDescription: string;
    pitchCompletionPct: number;
  };
}): OpportunitySurfaceSnapshotDto {
  return {
    signalId: input.signalId,
    currentTier: input.currentTier,
    publicBoard: {
      tier: "public_board",
      ...input.publicBoard,
    },
    partnerSummary: {
      tier: "partner_summary",
      headline: input.partnerView.headline,
      suitableFor: input.partnerView.suitableFor,
      builtAssets: input.partnerView.builtAssets,
      validationSignals: input.partnerView.validationSignals,
      openQuestions: input.partnerView.openQuestions,
      nextMilestone: input.partnerView.nextMilestone,
    },
    privatePitch: {
      tier: "private_pitch",
      ...input.privatePitch,
    },
    activeTierNote: getOpportunitySurfaceTierNote(input.currentTier),
  };
}

export function getOpportunitySurfaceTierNote(tier: OpportunitySurfaceTier): string {
  switch (tier) {
    case "private_pitch":
      return "Fondatorul lucrează cu pitch-ul complet și decide ce lasă să iasă în exterior.";
    case "partner_summary":
      return "Counterpart-ul primește suficient context pentru o discuție utilă, fără acces automat la detaliile sensibile.";
    default:
      return "Publicul vede tabloul care explică de ce oportunitatea merită atenție, nu mecanica internă a fondatorului.";
  }
}
