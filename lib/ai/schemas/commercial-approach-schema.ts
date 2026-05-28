import { z } from "zod";

export const commercialApproachSchema = z.object({
  email: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
  }),
  sms: z.string().min(1),
  linkedinDm: z.string().min(1),
  callAngle: z.string().min(1),
  miniAudit: z.object({
    summary: z.string().min(1),
    findings: z.array(z.string().min(1)).min(1),
    quickWins: z.array(z.string().min(1)).min(1),
    risks: z.array(z.string().min(1)).min(1),
  }),
  objections: z
    .array(
      z.object({
        objection: z.string().min(1),
        response: z.string().min(1),
      }),
    )
    .min(1),
  cta: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
  }),
  strategy: z.object({
    dominantPain: z.string().min(1),
    urgencyLevel: z.number().min(0).max(100),
    prioritySignals: z.array(z.string().min(1)),
    recommendedAngle: z.string().min(1),
    recommendedOfferType: z.string().min(1),
  }),
});

export type CommercialApproach = z.infer<typeof commercialApproachSchema>;

export const commercialApproachJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "email",
    "sms",
    "linkedinDm",
    "callAngle",
    "miniAudit",
    "objections",
    "cta",
    "strategy",
  ],
  properties: {
    email: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "body"],
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
      },
    },
    sms: { type: "string" },
    linkedinDm: { type: "string" },
    callAngle: { type: "string" },
    miniAudit: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "findings", "quickWins", "risks"],
      properties: {
        summary: { type: "string" },
        findings: {
          type: "array",
          items: { type: "string" },
        },
        quickWins: {
          type: "array",
          items: { type: "string" },
        },
        risks: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    objections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["objection", "response"],
        properties: {
          objection: { type: "string" },
          response: { type: "string" },
        },
      },
    },
    cta: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary"],
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
      },
    },
    strategy: {
      type: "object",
      additionalProperties: false,
      required: [
        "dominantPain",
        "urgencyLevel",
        "prioritySignals",
        "recommendedAngle",
        "recommendedOfferType",
      ],
      properties: {
        dominantPain: { type: "string" },
        urgencyLevel: { type: "number" },
        prioritySignals: {
          type: "array",
          items: { type: "string" },
        },
        recommendedAngle: { type: "string" },
        recommendedOfferType: { type: "string" },
      },
    },
  },
} as const;