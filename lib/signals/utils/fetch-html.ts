import type { WebsiteSnapshot } from "../core/types";
import { normalizeUrl } from "./url-utils";

export async function fetchHtmlSnapshot(website: string): Promise<WebsiteSnapshot> {
  const requestedUrl = normalizeUrl(website);
  const startedAt = Date.now();

  try {
    const response = await fetch(requestedUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "LeadPilotBot/2.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await response.text();

    return {
      requestedUrl,
      finalUrl: response.url || requestedUrl,
      status: response.status,
      ok: response.ok,
      html,
      responseTimeMs: Date.now() - startedAt,
      isHttps: (response.url || requestedUrl).startsWith("https://"),
    };
  } catch {
    return {
      requestedUrl,
      finalUrl: requestedUrl,
      status: 0,
      ok: false,
      html: "",
      responseTimeMs: Date.now() - startedAt,
      isHttps: requestedUrl.startsWith("https://"),
    };
  }
}