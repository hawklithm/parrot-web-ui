// 适配器常量定义
// 从 @paperclipai/adapter-* 包中提取，避免额外依赖

export const DEFAULT_CODEX_LOCAL_MODEL = "gpt-5.6-sol";
export const DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX = true;

export const DEFAULT_CURSOR_LOCAL_MODEL = "auto";

export const DEFAULT_GEMINI_LOCAL_MODEL = "auto";

export const DEFAULT_OPENCODE_LOCAL_MODEL = "openai/gpt-5.2-codex";
export const DEFAULT_OPENCODE_CHEAP_MODEL = "openai/gpt-5.1-codex-mini";

// OpenCode 模型验证
export function isValidOpenCodeModelId(model: string | null | undefined): boolean {
  if (!model || typeof model !== "string") return false;
  // OpenCode 接受 provider/model-name 格式
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(model.trim());
}

// Codex Local Fast Mode 支持的模型列表
export const CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS = [
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.5",
  "gpt-5.4",
] as const;

// Codex Local 已知模型列表（用于判断是否为手动配置的模型）
const CODEX_LOCAL_KNOWN_MODELS = [
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5",
  "o3",
  "o4-mini",
  "gpt-5-mini",
  "gpt-5-nano",
  "o3-mini",
  "codex-mini-latest",
];

function normalizeModelId(model: string | null | undefined): string {
  return typeof model === "string" ? model.trim() : "";
}

export function isCodexLocalKnownModel(model: string | null | undefined): boolean {
  const normalizedModel = normalizeModelId(model);
  if (!normalizedModel) return false;
  return CODEX_LOCAL_KNOWN_MODELS.includes(normalizedModel);
}

export function isCodexLocalManualModel(model: string | null | undefined): boolean {
  const normalizedModel = normalizeModelId(model);
  return Boolean(normalizedModel) && !isCodexLocalKnownModel(normalizedModel);
}

export function isCodexLocalFastModeSupported(model: string | null | undefined): boolean {
  // 手动配置的模型也认为支持 fast mode，让 CLI 自己判断
  if (isCodexLocalManualModel(model)) return true;
  const normalizedModel = typeof model === "string" ? model.trim() : "";
  // 空值意味着省略 --model，让 Codex CLI 选择默认值
  if (!normalizedModel) return true;
  return CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS.includes(
    normalizedModel as (typeof CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS)[number],
  );
}
