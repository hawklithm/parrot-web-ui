import type { UIAdapterModule } from "../types";
import { parsePiStdoutLine } from "../../lib/adapters-ui/pi-local";
import { PiLocalConfigFields } from "./config-fields";
import { buildPiLocalConfig } from "../../lib/adapters-ui/pi-local";

export const piLocalUIAdapter: UIAdapterModule = {
  type: "pi_local",
  label: "Pi",
  parseStdoutLine: parsePiStdoutLine,
  ConfigFields: PiLocalConfigFields,
  buildAdapterConfig: buildPiLocalConfig,
};
