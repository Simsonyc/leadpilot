import type { SignalAnalyzer } from "../../core/types";
import { analyzeGoogleBusiness } from "./google-business-analyzer";

export const analyzeReputation: SignalAnalyzer = {
  name: "reputation-analyzer",
  enabled: true,
  analyze: (context) => analyzeGoogleBusiness.analyze(context),
};