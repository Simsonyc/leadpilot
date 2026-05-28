import type { CommercialLeadContext } from "../types";

export function buildCommercialUserPrompt(context: CommercialLeadContext): string {
  return `
Génère une approche commerciale complète pour ce lead LeadPilot.

Contexte JSON :
${JSON.stringify(context, null, 2)}

Contraintes :
- Email : court, professionnel, contextualisé.
- SMS : très court, naturel, orienté prise de contact.
- LinkedIn DM : conversationnel, non intrusif.
- Call angle : première phrase d’appel + logique d’angle.
- Mini-audit : honnête, basé uniquement sur le contexte disponible.
- Objections : objections probables + réponses.
- CTA : un CTA principal et un CTA secondaire.

Retourne strictement l’objet structuré attendu.
`.trim();
}