import type { UIAdapterModule } from "../types";
import { parseGeminiStdoutLine } from "../../lib/adapters-ui/gemini-local";
import { GeminiLocalConfigFields } from "./config-fields";
import { buildGeminiLocalConfig } from "../../lib/adapters-ui/gemini-local";

export const geminiLocalUIAdapter: UIAdapterModule = {
  type: "gemini_local",
  label: "Gemini CLI",
  parseStdoutLine: parseGeminiStdoutLine,
  ConfigFields: GeminiLocalConfigFields,
  buildAdapterConfig: buildGeminiLocalConfig,
};
