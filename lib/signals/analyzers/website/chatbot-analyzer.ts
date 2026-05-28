import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeChatbot: SignalAnalyzer = {
  name: "chatbot-analyzer",
  enabled: true,

  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);
    const bodyText = $("body").text().toLowerCase();

    const hasChatbot =
      /intercom/i.test(html) ||
      /crisp\.chat/i.test(html) ||
      /tawk\.to/i.test(html) ||
      /drift/i.test(html) ||
      /hubspot.*chat/i.test(html) ||
      /livechat/i.test(html) ||
      bodyText.includes("chatbot") ||
      bodyText.includes("chat en direct") ||
      bodyText.includes("live chat");

    return [
      createSignal({
        code: "WEBSITE_NO_CHATBOT",
        category: "automation",
        label: "Aucun chatbot détecté",
        description: "Aucun module de chat ou chatbot évident n’a été détecté.",
        detected: Boolean(websiteSnapshot && !hasChatbot),
        confidence: 65,
        evidence: hasChatbot ? "Chat/chatbot détecté" : "Aucun chatbot détecté",
        value: String(hasChatbot),
        weight: 3,
      }),
    ];
  },
};