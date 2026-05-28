import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeSolocal: SignalAnalyzer = {
  name: "solocal-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, lead }) => {
    const found = /solocal/i.test(`${websiteSnapshot?.html ?? ""} ${lead.sourceChannel ?? ""}`);

    return [
      createSignal({
        code: "SOLOCAL_PRESENT",
        category: "directories",
        label: "Présence Solocal détectée",
        description: "Une présence ou dépendance Solocal a été détectée.",
        detected: found,
        confidence: 70,
        evidence: found ? "Solocal détecté" : "Solocal non détecté",
        value: String(found),
        weight: 2,
      }),
      createSignal({
        code: "DIRECTORY_DEPENDENCY_SIGNAL",
        category: "directories",
        label: "Dépendance annuaire potentielle",
        description: "Le lead semble dépendre d’une source annuaire.",
        detected: found,
        confidence: 65,
        evidence: found ? "Source annuaire détectée" : "Non détecté",
        value: String(found),
        weight: 5,
      }),
    ];
  },
};