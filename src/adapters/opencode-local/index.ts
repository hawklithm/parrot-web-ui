import type { UIAdapterModule } from "../types";
import { parseOpenCodeStdoutLine } from "../../lib/adapters-ui/opencode-local";
import { OpenCodeLocalConfigFields } from "./config-fields";
import { buildOpenCodeLocalConfig } from "../../lib/adapters-ui/opencode-local";

export const openCodeLocalUIAdapter: UIAdapterModule = {
  type: "opencode_local",
  label: "OpenCode",
  parseStdoutLine: parseOpenCodeStdoutLine,
  ConfigFields: OpenCodeLocalConfigFields,
  buildAdapterConfig: buildOpenCodeLocalConfig,
};
