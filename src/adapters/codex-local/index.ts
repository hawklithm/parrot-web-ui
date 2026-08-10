import type { UIAdapterModule } from "../types";
import { parseCodexStdoutLine } from "../../lib/adapters-ui/codex-local";
import { CodexLocalConfigFields } from "./config-fields";
import { buildCodexLocalConfig } from "../../lib/adapters-ui/codex-local";

export const codexLocalUIAdapter: UIAdapterModule = {
  type: "codex_local",
  label: "Codex",
  parseStdoutLine: parseCodexStdoutLine,
  ConfigFields: CodexLocalConfigFields,
  buildAdapterConfig: buildCodexLocalConfig,
};
