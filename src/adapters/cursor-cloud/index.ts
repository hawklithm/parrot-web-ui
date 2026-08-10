import type { UIAdapterModule } from "../types";
import { SchemaConfigFields } from "../schema-config-fields";
import {
  buildCursorCloudConfig,
  parseCursorCloudStdoutLine,
} from "../../lib/adapters-ui/cursor-cloud";

export const cursorCloudUIAdapter: UIAdapterModule = {
  type: "cursor_cloud",
  label: "Cursor Cloud",
  parseStdoutLine: parseCursorCloudStdoutLine,
  ConfigFields: SchemaConfigFields,
  buildAdapterConfig: buildCursorCloudConfig,
};
