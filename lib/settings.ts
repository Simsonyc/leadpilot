import { prisma } from "@/lib/prisma";

export type SettingKey =
  | "ghl_auto_sync"
  | "ai_provider"
  | "ai_fallback_provider";

const DEFAULTS: Record<SettingKey, string> = {
  ghl_auto_sync: "false",
  ai_provider: "claude",
  ai_fallback_provider: "openai",
};

export async function getSetting(key: SettingKey): Promise<string> {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting?.value ?? DEFAULTS[key];
}

export async function getSettings(
  keys: SettingKey[],
): Promise<Record<SettingKey, string>> {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: keys } },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  return Object.fromEntries(
    keys.map((key) => [key, map.get(key) ?? DEFAULTS[key]]),
  ) as Record<SettingKey, string>;
}

export async function setSetting(
  key: SettingKey,
  value: string,
): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function isGhlAutoSyncEnabled(): Promise<boolean> {
  const value = await getSetting("ghl_auto_sync");
  return value === "true";
}
