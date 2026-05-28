export function hasPattern(html: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(html));
}

export function extractTagContent(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match?.[1]?.trim() || null;
}

export function countMatches(html: string, regex: RegExp): number {
  return Array.from(html.matchAll(regex)).length;
}

export function extractLinks(html: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match = regex.exec(html);

  while (match) {
    links.push(match[1]);
    match = regex.exec(html);
  }

  return links;
}