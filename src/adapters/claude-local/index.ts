import type { UIAdapterModule } from "../types";
import { parseClaudeStdoutLine } from "../../lib/adapters-ui/claude-local";
import { ClaudeLocalConfigFields } from "./config-fields";
import { buildClaudeLocalConfig } from "../../lib/adapters-ui/claude-local";

export const claudeLocalUIAdapter: UIAdapterModule = {
  type: "claude_local",
  label: "Claude Code",
  parseStdoutLine: parseClaudeStdoutLine,
  ConfigFields: ClaudeLocalConfigFields,
  buildAdapterConfig: buildClaudeLocalConfig,
};
