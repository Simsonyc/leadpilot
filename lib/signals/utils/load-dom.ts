import * as cheerio from "cheerio";

export function loadDom(html: string) {
  return cheerio.load(html);
}