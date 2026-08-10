import type { UIAdapterModule } from "../types";
import { parseCursorStdoutLine } from "../../lib/adapters-ui/cursor-local";
import { CursorLocalConfigFields } from "./config-fields";
import { buildCursorLocalConfig } from "../../lib/adapters-ui/cursor-local";

export const cursorLocalUIAdapter: UIAdapterModule = {
  type: "cursor",
  label: "Cursor",
  parseStdoutLine: parseCursorStdoutLine,
  ConfigFields: CursorLocalConfigFields,
  buildAdapterConfig: buildCursorLocalConfig,
};
