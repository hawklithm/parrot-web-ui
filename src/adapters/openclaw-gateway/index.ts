import type { UIAdapterModule } from "../types";
import { parseOpenClawGatewayStdoutLine } from "../../lib/adapters-ui/openclaw-gateway";
import { buildOpenClawGatewayConfig } from "../../lib/adapters-ui/openclaw-gateway";
import { OpenClawGatewayConfigFields } from "./config-fields";

export const openClawGatewayUIAdapter: UIAdapterModule = {
  type: "openclaw_gateway",
  label: "OpenClaw Gateway",
  parseStdoutLine: parseOpenClawGatewayStdoutLine,
  ConfigFields: OpenClawGatewayConfigFields,
  buildAdapterConfig: buildOpenClawGatewayConfig,
};
