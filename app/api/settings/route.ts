import { NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, setSetting } from "@/lib/settings";
import { errorResponse, formatZodError } from "@/lib/utils";

const SETTING_KEYS = ["ghl_auto_sync", "ai_provider", "ai_fallback_provider"] as const;

const updateSettingsSchema = z.object({
  ghl_auto_sync: z.enum(["true", "false"]).optional(),
  ai_provider: z.enum(["claude", "openai"]).optional(),
  ai_fallback_provider: z.enum(["claude", "openai", "none"]).optional(),
});

export async function GET() {
  try {
    const settings = await getSettings([...SETTING_KEYS]);

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return errorResponse("Erreur lors de la récupération des paramètres.");
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const entries = Object.entries(parsed.data).filter(
      ([, value]) => value !== undefined,
    ) as [typeof SETTING_KEYS[number], string][];

    for (const [key, value] of entries) {
      await setSetting(key, value);
    }

    const updated = await getSettings([...SETTING_KEYS]);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[POST /api/settings]", error);
    return errorResponse("Erreur lors de la mise à jour des paramètres.");
  }
}
