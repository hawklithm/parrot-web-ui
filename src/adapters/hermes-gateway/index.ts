import type { UIAdapterModule } from "../types";
import { parseStdoutLine as parseHermesGatewayStdoutLine } from "../../lib/adapters-ui/hermes-gateway";
import { buildSchemaAdapterConfig } from "../schema-config-fields";
import { HermesGatewayConfigFields } from "./config-fields";

export const hermesGatewayUIAdapter: UIAdapterModule = {
  type: "hermes_gateway",
  label: "Hermes Gateway",
  parseStdoutLine: parseHermesGatewayStdoutLine,
  ConfigFields: HermesGatewayConfigFields,
  buildAdapterConfig: buildSchemaAdapterConfig,
};
