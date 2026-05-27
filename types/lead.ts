export enum LeadStatus {
  NEW = "NEW",
  TO_QUALIFY = "TO_QUALIFY",
  QUALIFIED = "QUALIFIED",
  CONTACTED = "CONTACTED",
  IN_PROGRESS = "IN_PROGRESS",
  WON = "WON",
  LOST = "LOST",
  ARCHIVED = "ARCHIVED",
}

export enum LeadTemperature {
  COLD = "COLD",
  WARM = "WARM",
  HOT = "HOT",
}

export enum LeadSourceChannel {
  WEBSITE = "website",
  GOOGLE_MAPS = "google_maps",
  PAGES_JAUNES = "pages_jaunes",
  LINKEDIN = "linkedin",
  FACEBOOK = "facebook",
  INSTAGRAM = "instagram",
  TWITTER_X = "twitter_x",
  TIKTOK = "tiktok",
  LEBONCOIN = "leboncoin",
  SLACK = "slack",
  DISCORD = "discord",
  CSV = "csv",
  MANUAL = "manual",
}

export type Lead = {
  id: string;
  name: string;
  source: string | null;
  sourceChannel: string | null;
  sector: string | null;
  city: string | null;
  department: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  temperature: LeadTemperature | null;
  notes: string | null;
  tags: string[];
  isArchived: boolean;
  confidenceScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateLeadPayload = {
  name: string;
  source?: string | null;
  sourceChannel?: string | null;
  sector?: string | null;
  city?: string | null;
  department?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: LeadStatus;
  temperature?: LeadTemperature | null;
  notes?: string | null;
  tags?: string[];
  confidenceScore?: number | null;
};

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  isArchived?: boolean;
  deletedAt?: Date | null;
};