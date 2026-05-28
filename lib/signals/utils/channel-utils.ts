import type { LeadChannelMap } from "../core/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractChannels(...sources: unknown[]): LeadChannelMap {
  const channels: LeadChannelMap = {};

  for (const source of sources) {
    if (!isRecord(source)) {
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "string") {
        channels[key.toLowerCase()] = value;
      }
    }

    const nestedChannels = source.channels;

    if (isRecord(nestedChannels)) {
      for (const [key, value] of Object.entries(nestedChannels)) {
        if (typeof value === "string") {
          channels[key.toLowerCase()] = value;
        }
      }
    }
  }

  return channels;
}

export function hasChannel(channels: LeadChannelMap, names: string[]): boolean {
  return names.some((name) => Boolean(channels[name]));
}