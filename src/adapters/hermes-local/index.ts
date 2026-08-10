import type { UIAdapterModule } from "../types";
import { parseHermesStdoutLine, buildHermesConfig } from "../../lib/adapters-ui/hermes-local";
import { SchemaConfigFields } from "../schema-config-fields";

export const hermesLocalUIAdapter: UIAdapterModule = {
  type: "hermes_local",
  label: "Hermes",
  parseStdoutLine: parseHermesStdoutLine,
  ConfigFields: SchemaConfigFields,
  buildAdapterConfig: buildHermesConfig,
};
