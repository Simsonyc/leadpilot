import type { SignalAnalyzer } from "../../core/types";
import { hasChannel } from "../../utils/channel-utils";
import { loadDom } from "../../utils/load-dom";
import { analyzeInstagram } from "./instagram-analyzer";
import { analyzeFacebook } from "./facebook-analyzer";
import { analyzeLinkedin } from "./linkedin-analyzer";
import { analyzeYoutube } from "./youtube-analyzer";
import { analyzeTiktok } from "./tiktok-analyzer";
import { analyzeTwitterX } from "./twitter-x-analyzer";
import { createSignal } from "../../core/normalizer";

export const analyzeSocial: SignalAnalyzer = {
  name: "social-analyzer",
  enabled: true,

  analyze: async (context) => {
    const html = context.websiteSnapshot?.html ?? "";
    const $ = loadDom(html);

    const hrefs = $("a[href]")
      .map((_, element) => $(element).attr("href") ?? "")
      .get();

    const hasSocialLink = hrefs.some((href) =>
      /instagram|facebook|linkedin|youtube|youtu\.be|tiktok|twitter|x\.com/i.test(href),
    );

    const hasSocialChannel = hasChannel(context.channels, [
      "instagram",
      "facebook",
      "linkedin",
      "youtube",
      "tiktok",
      "twitter_x",
      "x",
    ]);

    const hasAnySocial = hasSocialLink || hasSocialChannel;

    const instagramSignals = await analyzeInstagram.analyze(context);
    const facebookSignals = await analyzeFacebook.analyze(context);
    const linkedinSignals = await analyzeLinkedin.analyze(context);
    const youtubeSignals = await analyzeYoutube.analyze(context);
    const tiktokSignals = await analyzeTiktok.analyze(context);
    const twitterXSignals = await analyzeTwitterX.analyze(context);

    return [
      createSignal({
        code: "SOCIAL_NO_LINKS_FOUND",
        category: "social",
        label: "Aucun lien social détecté",
        description: "Aucun lien vers un réseau social n’a été détecté.",
        detected: Boolean(context.websiteSnapshot && !hasAnySocial),
        confidence: 75,
        evidence: hasAnySocial ? "Présence sociale détectée" : "Aucun lien social détecté",
        value: String(hasAnySocial),
        weight: 5,
      }),
      createSignal({
        code: "SOCIAL_LOW_PRESENCE",
        category: "social",
        label: "Présence sociale faible",
        description: "La présence sociale semble limitée selon les liens disponibles.",
        detected: Boolean(context.websiteSnapshot && !hasAnySocial),
        confidence: 65,
        evidence: "Analyse limitée aux liens publics et aux channels connus",
        value: String(hasAnySocial),
        weight: 3,
      }),
      createSignal({
        code: "SOCIAL_BRANDING_INCONSISTENT",
        category: "social",
        label: "Cohérence branding non vérifiable",
        description: "La cohérence branding nécessite une API ou une analyse manuelle.",
        detected: false,
        status: "unknown",
        confidence: 30,
        evidence: "Non vérifiable sans API officielle ou analyse humaine",
        weight: 4,
      }),
      ...instagramSignals,
      ...facebookSignals,
      ...linkedinSignals,
      ...youtubeSignals,
      ...tiktokSignals,
      ...twitterXSignals,
    ];
  },
};