import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeBooking: SignalAnalyzer = {
  name: "booking-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);
    const bodyText = $("body").text().toLowerCase();

    const hasBooking =
      /calendly/i.test(html) ||
      /cal\.com/i.test(html) ||
      bodyText.includes("reservation") ||
      bodyText.includes("réservation") ||
      bodyText.includes("prendre rendez-vous") ||
      bodyText.includes("booking") ||
      bodyText.includes("book now");

    return [
      createSignal({
        code: "WEBSITE_NO_BOOKING_SYSTEM",
        category: "conversion",
        label: "Aucun système de réservation détecté",
        description: "Aucun système de réservation ou prise de rendez-vous n’a été détecté.",
        detected: Boolean(websiteSnapshot && !hasBooking),
        confidence: 60,
        evidence: hasBooking ? "Réservation détectée" : "Aucun système de réservation détecté",
        value: String(hasBooking),
        weight: 4,
      }),
    ];
  },
};