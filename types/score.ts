export type LeadScore = {
  id: string;
  leadId: string;
  businessPainScore: number | null;
  digitalWeaknessScore: number | null;
  growthPotentialScore: number | null;
  automationMaturityScore: number | null;
  urgencyScore: number | null;
  visibilityGapScore: number | null;
  fitVerticaleScore: number | null;
  globalScore: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadScorePayload = {
  leadId: string;
  businessPainScore?: number | null;
  digitalWeaknessScore?: number | null;
  growthPotentialScore?: number | null;
  automationMaturityScore?: number | null;
  urgencyScore?: number | null;
  visibilityGapScore?: number | null;
  fitVerticaleScore?: number | null;
  globalScore?: number | null;
};

export type UpdateLeadScorePayload = Partial<LeadScorePayload>;