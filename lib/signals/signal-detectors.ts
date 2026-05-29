import type { FetchedWebsite } from "./website-fetcher";

export type DetectedSignal = {
  code: string;
  confidence: number;
  evidence: string;
  value: string | null;
};

type Detector = (site: FetchedWebsite) => DetectedSignal | null;

// ── Helpers ────────────────────────────────────────────────────

function hasText(text: string): boolean {
  return text.trim().length > 0;
}

function toAbsoluteUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

// ── SEO ───────────────────────────────────────────────────────

const detectNoH1: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const h1s = $("h1");
  if (h1s.length === 0) {
    return {
      code: "SEO_NO_H1",
      confidence: 95,
      evidence: "Aucune balise H1 trouvée sur la page.",
      value: null,
    };
  }
  return null;
};

const detectMultipleH1: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const h1s = $("h1");
  if (h1s.length > 1) {
    return {
      code: "SEO_MULTIPLE_H1",
      confidence: 90,
      evidence: `${h1s.length} balises H1 détectées — une seule est recommandée.`,
      value: String(h1s.length),
    };
  }
  return null;
};

const detectNoCanonical: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const canonical = $('link[rel="canonical"]').attr("href");
  if (!canonical || !hasText(canonical)) {
    return {
      code: "SEO_NO_CANONICAL",
      confidence: 85,
      evidence: "Aucune balise canonical détectée.",
      value: null,
    };
  }
  return null;
};

const detectNoindex: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const robotsMeta = $('meta[name="robots"]').attr("content") ?? "";
  if (robotsMeta.toLowerCase().includes("noindex")) {
    return {
      code: "SEO_NOINDEX_DETECTED",
      confidence: 99,
      evidence: `Balise robots avec noindex détectée : "${robotsMeta}".`,
      value: robotsMeta,
    };
  }
  return null;
};

const detectNoOpenGraph: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (!ogTitle && !ogImage) {
    return {
      code: "SEO_NO_OPENGRAPH",
      confidence: 90,
      evidence: "Aucune balise Open Graph (og:title, og:image) détectée.",
      value: null,
    };
  }
  return null;
};

const detectWeakTitle: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const title = $("title").text().trim();
  if (!title || title.length < 10) {
    return {
      code: "WEBSITE_MISSING_OR_WEAK_TITLE",
      confidence: 90,
      evidence: title
        ? `Title trop court (${title.length} caractères) : "${title}".`
        : "Aucune balise title détectée.",
      value: title || null,
    };
  }
  return null;
};

const detectWeakMetaDescription: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const meta = $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!meta || meta.length < 20) {
    return {
      code: "WEBSITE_MISSING_OR_WEAK_META_DESCRIPTION",
      confidence: 88,
      evidence: meta
        ? `Meta description trop courte (${meta.length} caractères).`
        : "Aucune meta description détectée.",
      value: meta || null,
    };
  }
  return null;
};

// ── WEBSITE ───────────────────────────────────────────────────

const detectNoHttps: Detector = ({ url, reachable }) => {
  if (!reachable) return null;
  if (url.startsWith("http://")) {
    return {
      code: "WEBSITE_NO_HTTPS",
      confidence: 99,
      evidence: "Le site n'utilise pas HTTPS.",
      value: url,
    };
  }
  return null;
};

const detectNoCta: Detector = ({ $, reachable }) => {
  if (!reachable) return null;

  const ctaKeywords = [
    "contact",
    "devis",
    "réserver",
    "prendre rendez-vous",
    "rdv",
    "appeler",
    "commencer",
    "s'inscrire",
    "inscription",
    "essai",
    "démonstration",
    "demo",
    "découvrir",
    "en savoir plus",
    "get started",
    "book",
    "call us",
    "free trial",
  ];

  const buttonsAndLinks = $("a, button")
    .map((_, el) => $(el).text().toLowerCase().trim())
    .get();

  const hasCta = buttonsAndLinks.some((text) =>
    ctaKeywords.some((kw) => text.includes(kw)),
  );

  if (!hasCta) {
    return {
      code: "WEBSITE_NO_CLEAR_CTA",
      confidence: 75,
      evidence: "Aucun CTA clair détecté (boutons ou liens de contact/devis/réservation).",
      value: null,
    };
  }
  return null;
};

const detectNoForm: Detector = ({ $, reachable }) => {
  if (!reachable) return null;
  const forms = $("form");
  const inputs = $('input[type="email"], input[type="tel"], input[type="text"]');
  if (forms.length === 0 && inputs.length === 0) {
    return {
      code: "WEBSITE_NO_FORM_DETECTED",
      confidence: 85,
      evidence: "Aucun formulaire ni champ de saisie détecté.",
      value: null,
    };
  }
  return null;
};

const detectNoTracking: Detector = ({ html, reachable }) => {
  if (!reachable) return null;

  const trackingPatterns = [
    { name: "Google Analytics", pattern: /gtag|google-analytics|UA-\d+|G-[A-Z0-9]+/i },
    { name: "Google Tag Manager", pattern: /googletagmanager\.com|GTM-[A-Z0-9]+/i },
    { name: "Meta Pixel", pattern: /connect\.facebook\.net|fbq\(|facebook pixel/i },
    { name: "Hotjar", pattern: /hotjar\.com|hjid/i },
    { name: "Matomo", pattern: /matomo\.js|piwik\.js/i },
    { name: "Plausible", pattern: /plausible\.io/i },
  ];

  const detected = trackingPatterns
    .filter(({ pattern }) => pattern.test(html))
    .map(({ name }) => name);

  if (detected.length === 0) {
    return {
      code: "WEBSITE_NO_TRACKING_DETECTED",
      confidence: 80,
      evidence: "Aucun outil de tracking détecté (GA4, GTM, Meta Pixel, Hotjar, etc.).",
      value: null,
    };
  }
  return null;
};

const detectNoSocialLinks: Detector = ({ $, url, reachable }) => {
  if (!reachable) return null;

  const socialDomains = [
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "tiktok.com",
    "pinterest.com",
  ];

  const allLinks = $("a[href]")
    .map((_, el) => $(el).attr("href") ?? "")
    .get()
    .map((href) => toAbsoluteUrl(href, url).toLowerCase());

  const found = socialDomains.filter((domain) =>
    allLinks.some((link) => link.includes(domain)),
  );

  if (found.length === 0) {
    return {
      code: "WEBSITE_NO_SOCIAL_LINKS",
      confidence: 85,
      evidence: "Aucun lien vers un réseau social détecté.",
      value: null,
    };
  }
  return null;
};

const detectNoChatbot: Detector = ({ html, reachable }) => {
  if (!reachable) return null;

  const chatbotPatterns = [
    /intercom/i,
    /drift\.com|drift\.js/i,
    /crisp\.chat|crisp\.io/i,
    /tawk\.to/i,
    /tidio/i,
    /hubspot.*chat/i,
    /zendesk.*chat/i,
    /freshchat/i,
    /livechat/i,
    /olark/i,
    /chatra/i,
  ];

  const hasChatbot = chatbotPatterns.some((pattern) => pattern.test(html));

  if (!hasChatbot) {
    return {
      code: "WEBSITE_NO_CHATBOT",
      confidence: 70,
      evidence: "Aucun système de chat en direct détecté (Intercom, Drift, Crisp, etc.).",
      value: null,
    };
  }
  return null;
};

const detectNoBookingSystem: Detector = ({ html, $, reachable }) => {
  if (!reachable) return null;

  const bookingPatterns = [
    /calendly\.com/i,
    /cal\.com/i,
    /acuityscheduling/i,
    /simplybook/i,
    /reservio/i,
    /planity/i,
    /doctolib/i,
    /booksy/i,
    /réserver|reservation|booking|rendez-vous en ligne|prendre rdv/i,
  ];

  const allText = html + $("a, button").text();
  const hasBooking = bookingPatterns.some((pattern) => pattern.test(allText));

  if (!hasBooking) {
    return {
      code: "WEBSITE_NO_BOOKING_SYSTEM",
      confidence: 65,
      evidence: "Aucun système de réservation en ligne détecté.",
      value: null,
    };
  }
  return null;
};

// ── SOCIAL — extraction des liens ─────────────────────────────

export type SocialLinks = {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export function extractSocialLinks($: FetchedWebsite["$"], baseUrl: string): SocialLinks {
  const links = $("a[href]")
    .map((_, el) => $( el).attr("href") ?? "")
    .get()
    .map((href) => toAbsoluteUrl(href, baseUrl));

  function find(domain: string): string | null {
    return links.find((l) => l.toLowerCase().includes(domain)) ?? null;
  }

  return {
    facebook: find("facebook.com"),
    instagram: find("instagram.com"),
    linkedin: find("linkedin.com"),
    twitter: find("twitter.com") ?? find("x.com"),
    youtube: find("youtube.com"),
    tiktok: find("tiktok.com"),
  };
}

// ── CONTACT — extraction emails et téléphones ─────────────────

export type ContactInfo = {
  emails: string[];
  phones: string[];
};

export function extractContactInfo(html: string, $: FetchedWebsite["$"]): ContactInfo {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+33|0033|0)[1-9](?:[\s.\-]?\d{2}){4}/g;

  const textContent = $("body").text() + " " + html;

  const emails = Array.from(
    new Set((textContent.match(emailRegex) ?? []).filter((e) => !e.includes("example") && !e.includes("your@"))),
  ).slice(0, 5);

  const phones = Array.from(
    new Set(textContent.match(phoneRegex) ?? []),
  ).slice(0, 3);

  return { emails, phones };
}

// ── Liste de tous les détecteurs ──────────────────────────────

export const ALL_DETECTORS: Detector[] = [
  // SEO
  detectNoH1,
  detectMultipleH1,
  detectNoCanonical,
  detectNoindex,
  detectNoOpenGraph,
  detectWeakTitle,
  detectWeakMetaDescription,
  // Website
  detectNoHttps,
  detectNoCta,
  detectNoForm,
  detectNoTracking,
  detectNoSocialLinks,
  detectNoChatbot,
  detectNoBookingSystem,
];

export function runAllDetectors(site: FetchedWebsite): DetectedSignal[] {
  return ALL_DETECTORS.map((detector) => {
    try {
      return detector(site);
    } catch {
      return null;
    }
  }).filter((s): s is DetectedSignal => s !== null);
}
