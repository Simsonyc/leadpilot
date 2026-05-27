import type { NormalizedWeakSignal, WebsiteSnapshot } from "./types";

function hasMatch(html: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(html));
}

function extractTagContent(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match?.[1]?.trim() || null;
}

export function detectWebsiteSignals(snapshot: WebsiteSnapshot): NormalizedWeakSignal[] {
  const html = snapshot.html;
  const lowerHtml = html.toLowerCase();

  const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

  const metaDescription = extractTagContent(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
  );

  const hasCta = hasMatch(lowerHtml, [
    /contactez-nous/i,
    /demander un devis/i,
    /prendre rendez-vous/i,
    /réserver/i,
    /appeler/i,
    /nous contacter/i,
    /call now/i,
    /book now/i,
    /get started/i,
  ]);

  const hasForm = hasMatch(lowerHtml, [
    /<form[\s>]/i,
    /type=["']email["']/i,
    /name=["']email["']/i,
    /contact-form/i,
    /formulaire/i,
  ]);

  const hasTracking = hasMatch(lowerHtml, [
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /gtag\(/i,
    /fbq\(/i,
    /facebook\.net\/en_us\/fbevents\.js/i,
    /hotjar/i,
    /matomo/i,
    /plausible/i,
    /clarity\.ms/i,
  ]);

  const signals: NormalizedWeakSignal[] = [];

  if (!snapshot.isHttps) {
    signals.push({
      code: "WEBSITE_NO_HTTPS",
      label: "Site non sécurisé HTTPS",
      description: "Le site ne semble pas utiliser HTTPS, ce qui peut réduire la confiance et nuire à la conversion.",
      category: "website",
      defaultWeight: 8,
      confidence: 95,
      evidence: snapshot.finalUrl,
      value: "false",
      weightApplied: 8,
      severity: "high",
    });
  }

  if (!title || title.length < 10) {
    signals.push({
      code: "WEBSITE_MISSING_OR_WEAK_TITLE",
      label: "Titre de page absent ou faible",
      description: "La page analysée ne contient pas de titre exploitable ou un titre trop faible.",
      category: "seo",
      defaultWeight: 5,
      confidence: 85,
      evidence: title,
      value: title,
      weightApplied: 5,
      severity: "medium",
    });
  }

  if (!metaDescription || metaDescription.length < 50) {
    signals.push({
      code: "WEBSITE_MISSING_OR_WEAK_META_DESCRIPTION",
      label: "Meta description absente ou faible",
      description: "La page ne contient pas de meta description solide, ce qui peut limiter la visibilité SEO.",
      category: "seo",
      defaultWeight: 6,
      confidence: 90,
      evidence: metaDescription,
      value: metaDescription,
      weightApplied: 6,
      severity: "medium",
    });
  }

  if (!hasCta) {
    signals.push({
      code: "WEBSITE_NO_CLEAR_CTA",
      label: "Absence de CTA clair",
      description: "Aucun appel à l’action clair n’a été détecté sur la page.",
      category: "conversion",
      defaultWeight: 7,
      confidence: 75,
      evidence: "Aucun CTA évident détecté",
      value: "false",
      weightApplied: 7,
      severity: "high",
    });
  }

  if (!hasForm) {
    signals.push({
      code: "WEBSITE_NO_FORM_DETECTED",
      label: "Aucun formulaire détecté",
      description: "Aucun formulaire de contact ou de capture n’a été détecté sur la page.",
      category: "conversion",
      defaultWeight: 5,
      confidence: 70,
      evidence: "Aucune balise form ou champ email détecté",
      value: "false",
      weightApplied: 5,
      severity: "medium",
    });
  }

  if (!hasTracking) {
    signals.push({
      code: "WEBSITE_NO_TRACKING_DETECTED",
      label: "Aucun tracking détecté",
      description: "Aucun outil de tracking évident n’a été détecté.",
      category: "tracking",
      defaultWeight: 5,
      confidence: 70,
      evidence: "Aucun script Google Analytics, Tag Manager, Meta Pixel ou équivalent détecté",
      value: "false",
      weightApplied: 5,
      severity: "medium",
    });
  }

  return signals;
}