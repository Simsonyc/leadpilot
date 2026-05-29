import * as cheerio from "cheerio";

export type ExtractedContent = {
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  bodyText: string;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  imagesTotal: number;
  imagesWithAlt: number;
  hasSchema: boolean;
  schemaTypes: string[];
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  responseTimeMs: number;
  isHttps: boolean;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

export async function checkSitemap(baseUrl: string): Promise<boolean> {
  try {
    const url = new URL(baseUrl);
    const sitemapUrl = `${url.protocol}//${url.hostname}/sitemap.xml`;
    const response = await fetch(sitemapUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const url = new URL(baseUrl);
    const robotsUrl = `${url.protocol}//${url.hostname}/robots.txt`;
    const response = await fetch(robotsUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export function extractContent(
  html: string,
  $: ReturnType<typeof cheerio.load>,
  baseUrl: string,
  responseTimeMs: number,
): ExtractedContent {
  // Titres
  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;

  const h1 = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const h2 = $("h2")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 10);

  const h3 = $("h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 10);

  // Texte propre — supprime scripts, styles, nav, footer
  $("script, style, nav, footer, header, noscript, iframe").remove();
  const rawText = $("body").text();
  const bodyText = rawText
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 8000);

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Liens
  const hostname = (() => {
    try {
      return new URL(baseUrl).hostname;
    } catch {
      return "";
    }
  })();

  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (href.startsWith("/") || href.includes(hostname)) {
      internalLinks++;
    } else if (href.startsWith("http")) {
      externalLinks++;
    }
  });

  // Images
  const allImages = $("img");
  const imagesTotal = allImages.length;
  const imagesWithAlt = allImages
    .filter((_, el) => Boolean($(el).attr("alt")?.trim()))
    .length;

  // Schema.org
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? "") as Record<string, unknown>;
      const type = json["@type"];
      if (typeof type === "string") schemaTypes.push(type);
      if (Array.isArray(type)) schemaTypes.push(...type.filter((t): t is string => typeof t === "string"));
    } catch {
      // ignore
    }
  });

  // OpenGraph
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || null;

  // Canonical
  const canonicalUrl = $('link[rel="canonical"]').attr("href")?.trim() || null;

  return {
    title,
    metaDescription,
    h1,
    h2,
    h3,
    bodyText,
    wordCount,
    internalLinks,
    externalLinks,
    imagesTotal,
    imagesWithAlt,
    hasSchema: schemaTypes.length > 0,
    schemaTypes,
    hasSitemap: false, // sera rempli async
    hasRobotsTxt: false, // sera rempli async
    responseTimeMs,
    isHttps: baseUrl.startsWith("https://"),
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
  };
}
