import * as cheerio from "cheerio";

export type FetchedWebsite = {
  url: string;
  html: string;
  $: ReturnType<typeof cheerio.load>;
  statusCode: number;
  reachable: boolean;
  redirectedTo: string | null;
};

const FETCH_TIMEOUT_MS = 10_000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
};

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function fetchWebsite(rawUrl: string): Promise<FetchedWebsite> {
  const url = normalizeUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    return {
      url,
      html,
      $,
      statusCode: response.status,
      reachable: response.ok,
      redirectedTo: response.url !== url ? response.url : null,
    };
  } catch {
    // Site inaccessible ou timeout
    return {
      url,
      html: "",
      $: cheerio.load(""),
      statusCode: 0,
      reachable: false,
      redirectedTo: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
