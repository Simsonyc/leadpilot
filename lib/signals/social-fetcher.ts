import * as cheerio from "cheerio";

export type SocialAnalysis = {
  platform: string;
  url: string;
  accessible: boolean;
  name: string | null;
  description: string | null;
  followersEstimate: string | null;
  lastActivity: string | null;
  rawText: string | null;
};

const FETCH_TIMEOUT_MS = 6000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

async function fetchSocialPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractFacebookInfo(html: string): Omit<SocialAnalysis, "platform" | "url" | "accessible"> {
  const $ = cheerio.load(html);

  // Facebook rend souvent du contenu dynamique — on extrait ce qu'on peut
  const title = $("title").text().trim() || null;
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;

  // Détection page de connexion
  const isLoginPage =
    html.includes("login") &&
    html.includes("password") &&
    !html.includes("likes");

  if (isLoginPage) {
    return { name: null, description: null, followersEstimate: null, lastActivity: null, rawText: null };
  }

  // Extraction likes/followers depuis le texte
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);
  const likesMatch = bodyText.match(/(\d[\d\s,.]+)\s*(personnes aiment|likes|abonnés|followers)/i);
  const followersEstimate = likesMatch ? likesMatch[1].trim() : null;

  return {
    name: ogTitle ?? title,
    description,
    followersEstimate,
    lastActivity: null,
    rawText: bodyText.slice(0, 1000),
  };
}

function extractLinkedInInfo(html: string): Omit<SocialAnalysis, "platform" | "url" | "accessible"> {
  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() || null;

  // LinkedIn bloque souvent — on récupère ce qu'on peut
  const isAuthWall = html.includes("authwall") || html.includes("Sign in") && html.includes("LinkedIn");

  if (isAuthWall) {
    return { name: ogTitle, description: ogDescription, followersEstimate: null, lastActivity: null, rawText: null };
  }

  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);
  const followersMatch = bodyText.match(/(\d[\d\s,.]+)\s*(abonnés|followers)/i);

  return {
    name: ogTitle,
    description: ogDescription,
    followersEstimate: followersMatch ? followersMatch[1].trim() : null,
    lastActivity: null,
    rawText: bodyText.slice(0, 1000),
  };
}

function extractGenericInfo(html: string): Omit<SocialAnalysis, "platform" | "url" | "accessible"> {
  const $ = cheerio.load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() || null;
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 1000);

  return {
    name: ogTitle,
    description: ogDescription,
    followersEstimate: null,
    lastActivity: null,
    rawText: bodyText || null,
  };
}

function getPlatformName(url: string): string {
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter/X";
  if (url.includes("youtube.com")) return "YouTube";
  if (url.includes("tiktok.com")) return "TikTok";
  return "Réseau social";
}

export async function analyzeSocialLinks(
  links: Record<string, string | null>,
): Promise<SocialAnalysis[]> {
  const results: SocialAnalysis[] = [];

  const validLinks = Object.entries(links).filter(
    ([, url]): url is string => Boolean(url),
  );

  await Promise.allSettled(
    validLinks.map(async ([, url]) => {
      const platform = getPlatformName(url);
      const html = await fetchSocialPage(url);

      if (!html) {
        results.push({
          platform,
          url,
          accessible: false,
          name: null,
          description: null,
          followersEstimate: null,
          lastActivity: null,
          rawText: null,
        });
        return;
      }

      let info: Omit<SocialAnalysis, "platform" | "url" | "accessible">;

      if (url.includes("facebook.com")) {
        info = extractFacebookInfo(html);
      } else if (url.includes("linkedin.com")) {
        info = extractLinkedInInfo(html);
      } else {
        info = extractGenericInfo(html);
      }

      results.push({
        platform,
        url,
        accessible: true,
        ...info,
      });
    }),
  );

  return results;
}
