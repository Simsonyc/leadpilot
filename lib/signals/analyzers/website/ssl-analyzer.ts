import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeSsl: SignalAnalyzer = {
  name: "ssl-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => [
    createSignal({
      code: "WEBSITE_NOT_HTTPS",
      category: "website",
      label: "Site non sécurisé HTTPS",
      description: "Le site ne semble pas être servi en HTTPS.",
      detected: Boolean(websiteSnapshot && !websiteSnapshot.isHttps),
      confidence: 95,
      evidence: websiteSnapshot?.finalUrl ?? "Site non analysable",
      value: websiteSnapshot ? String(websiteSnapshot.isHttps) : "unknown",
      weight: 8,
    }),
  ],
};