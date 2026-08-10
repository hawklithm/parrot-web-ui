import type { UIAdapterModule } from "../types";
import { createGrokStdoutParser, parseGrokStdoutLine } from "../../lib/adapters-ui/grok-local";
import { buildGrokLocalConfig } from "../../lib/adapters-ui/grok-local";
import { GrokLocalConfigFields } from "./config-fields";

export const grokLocalUIAdapter: UIAdapterModule = {
  type: "grok_local",
  label: "Grok Build",
  parseStdoutLine: parseGrokStdoutLine,
  createStdoutParser: createGrokStdoutParser,
  ConfigFields: GrokLocalConfigFields,
  buildAdapterConfig: buildGrokLocalConfig,
};
