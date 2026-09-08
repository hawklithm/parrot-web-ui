/**
 * JSON-RPC 2.0 message types and protocol helpers for the host ↔ worker IPC
 * channel.
 *
 * Parrot's plugin runtime uses JSON-RPC 2.0 over stdio (and HTTP proxy
 * bridges) to communicate between the host process and each plugin worker
 * process. This module defines:
 *
 * - Core JSON-RPC 2.0 envelope types (request, response, notification, error)
 * - Standard and plugin-specific error codes
 * - Typed method maps for host→worker and worker→host calls
 * - Helper functions for creating well-formed messages
 *
 * @see PLUGIN_SPEC.md §12.1 — Process Model
 * @see PLUGIN_SPEC.md §13 — Host-Worker Protocol
 * @see https://www.jsonrpc.org/specification
 */

import type {
  PaperclipPluginManifestV1,
  PluginLauncherBounds,
  PluginLauncherRenderContextSnapshot,
  PluginLauncherRenderEnvironment,
  PluginStateScopeKind,
} from "@paperclipai/shared";
export type { PluginLauncherRenderContextSnapshot } from "@paperclipai/shared";

import type {
  PluginEvent,
  PluginJobContext,
  ToolRunContext,
  ToolResult,
} from "./types.js";
import type {
  PluginHealthDiagnostics,
  PluginApiRequestInput,
  PluginApiResponse,
  PluginConfigValidationResult,
  PluginWebhookInput,
} from "./define-plugin.js";

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 — Core Protocol Types
// ---------------------------------------------------------------------------

/** The JSON-RPC protocol version. Always `"2.0"`. */
export const JSONRPC_VERSION = "2.0" as const;

/** A unique request identifier. JSON-RPC 2.0 allows strings or numbers. */
export type JsonRpcId = string | number;

/** Host-owned scope attached to a host→worker invocation. */
export interface PluginInvocationScope {
  companyId?: string;
  agentRunId?: string;
  [key: string]: unknown;
}

/** Standard JSON-RPC 2.0 request envelope. */
export interface JsonRpcRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: Record<string, unknown>;
  id: JsonRpcId;
}

/** Standard JSON-RPC 2.0 success response envelope. */
export interface JsonRpcSuccessResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  result: unknown;
  id: JsonRpcId;
}

/** Standard JSON-RPC 2.0 error response envelope. */
export interface JsonRpcErrorResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  error: JsonRpcError;
  id: JsonRpcId;
}

/** JSON-RPC 2.0 notification envelope (no id, no response expected). */
export interface JsonRpcNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: Record<string, unknown>;
}

/** A JSON-RPC 2.0 message of any kind. */
export type JsonRpcMessage =
  | JsonRpcRequest
  | JsonRpcSuccessResponse
  | JsonRpcErrorResponse
  | JsonRpcNotification;

/** JSON-RPC 2.0 error object. */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Plugin-specific error codes (-32000 to -32099)
// ---------------------------------------------------------------------------

export const PLUGIN_RPC_ERROR_CODES = {
  CAPABILITY_DENIED: -32001,
  INVOCATION_SCOPE_DENIED: -32002,
  CROSS_TENANT_CONFIG: -32003,
  WORKER_UNAVAILABLE: -32004,
  TIMEOUT: -32005,
  WORKER_ERROR: -32006,
} as const;

export const JSONRPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// ---------------------------------------------------------------------------
// Method names — host→worker
// ---------------------------------------------------------------------------

export const HOST_TO_WORKER_REQUIRED_METHODS = [
  "initialize",
  "setup",
  "health",
  "validateConfig",
  "configChanged",
  "shutdown",
  "runJob",
  "handleWebhook",
  "executeTool",
  "getData",
  "performAction",
] as const;

export const HOST_TO_WORKER_OPTIONAL_METHODS = [
  "detectExternalObjects",
  "resolveExternalObject",
  "refreshExternalObjects",
  "environmentValidateConfig",
  "environmentProbe",
  "environmentAcquireLease",
  "environmentResumeLease",
  "environmentReleaseLease",
  "environmentDestroyLease",
  "environmentRealizeWorkspace",
  "environmentExecute",
  "environmentSyncIn",
  "environmentSyncOut",
  "environmentStartInteractiveSetup",
  "environmentGetInteractiveSetup",
  "environmentCaptureTemplate",
  "environmentCancelInteractiveSetup",
  "environmentDeleteTemplate",
  "setupTokenPtyOpen",
  "setupTokenPtyInput",
  "setupTokenPtyStop",
  "setupTokenPtyClose",
  "apiRequest",
] as const;

// ---------------------------------------------------------------------------
// Method names — worker→host (notifications)
// ---------------------------------------------------------------------------

export const WORKER_TO_HOST_NOTIFICATIONS = [
  "event",
  "log",
  "metric",
  "telemetry",
  "consoleOutput",
  "streamData",
  "issueCheckoutOwnership",
  "issueWakeupResult",
  "issueWakeupBatchResult",
] as const;

// ---------------------------------------------------------------------------
// Message delimiters
// ---------------------------------------------------------------------------

export const MESSAGE_DELIMITER = "\n";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export function createRequest(
  method: string,
  params: Record<string, unknown>,
  id: JsonRpcId,
): JsonRpcRequest {
  return { jsonrpc: JSONRPC_VERSION, method, params, id };
}

export function createSuccessResponse(
  id: JsonRpcId,
  result: unknown,
): JsonRpcSuccessResponse {
  return { jsonrpc: JSONRPC_VERSION, result, id };
}

export function createErrorResponse(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcErrorResponse {
  return { jsonrpc: JSONRPC_VERSION, error: { code, message, data }, id };
}

export function createNotification(
  method: string,
  params?: Record<string, unknown>,
): JsonRpcNotification {
  return { jsonrpc: JSONRPC_VERSION, method, params };
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isJsonRpcRequest(msg: JsonRpcMessage): msg is JsonRpcRequest {
  return (
    "jsonrpc" in msg &&
    "method" in msg &&
    "id" in msg &&
    typeof (msg as { id?: unknown }).id !== "undefined"
  );
}

export function isJsonRpcNotification(msg: JsonRpcMessage): msg is JsonRpcNotification {
  return "jsonrpc" in msg && "method" in msg && !("id" in msg);
}

export function isJsonRpcResponse(msg: JsonRpcMessage): msg is JsonRpcSuccessResponse | JsonRpcErrorResponse {
  return "jsonrpc" in msg && "id" in msg;
}

export function isJsonRpcSuccessResponse(msg: JsonRpcMessage): msg is JsonRpcSuccessResponse {
  return isJsonRpcResponse(msg) && !("error" in msg);
}

export function isJsonRpcErrorResponse(msg: JsonRpcMessage): msg is JsonRpcErrorResponse {
  return isJsonRpcResponse(msg) && "error" in msg;
}

// ---------------------------------------------------------------------------
// Re-export from define-plugin for protocol-side convenience
// ---------------------------------------------------------------------------

export type { PluginHealthDiagnostics, PluginConfigValidationResult, PluginWebhookInput, PluginApiRequestInput, PluginApiResponse };

// ---------------------------------------------------------------------------
// Environment driver params (host→worker)
// ---------------------------------------------------------------------------

export interface PluginEnvironmentValidateConfigParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  config: Record<string, unknown>;
}

export interface PluginEnvironmentValidationResult {
  ok: boolean;
  warnings?: string[];
  errors?: string[];
}

export interface PluginEnvironmentProbeParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  config: Record<string, unknown>;
}

export interface PluginEnvironmentProbeResult {
  healthy: boolean;
  message?: string;
}

export interface PluginEnvironmentAcquireLeaseParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  config: Record<string, unknown>;
  runId: string;
}

export interface PluginEnvironmentLease {
  leaseId: string;
  workspacePath?: string;
  env?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface PluginEnvironmentResumeLeaseParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
}

export interface PluginEnvironmentReleaseLeaseParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
}

export interface PluginEnvironmentDestroyLeaseParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
}

export interface PluginEnvironmentRealizeWorkspaceParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
  workspacePath: string;
  repoUrl: string;
  repoRef?: string;
}

export interface PluginEnvironmentRealizeWorkspaceResult {
  realized: boolean;
  workspacePath: string;
}

export interface PluginEnvironmentExecuteParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface PluginEnvironmentExecuteResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface PluginEnvironmentSyncInParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
  files: Array<{ relativePath: string; contents: string }>;
  targetPath: string;
}

export interface PluginEnvironmentSyncOutParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  leaseId: string;
  sourcePath: string;
  relativePaths?: string[];
}

export interface PluginEnvironmentSyncResult {
  synced: boolean;
  fileCount: number;
}

export interface PluginEnvironmentStartInteractiveSetupParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  config: Record<string, unknown>;
}

export interface PluginEnvironmentInteractiveSetupSession {
  sessionId: string;
  url?: string;
  status: "pending" | "active" | "completed" | "failed";
  result?: Record<string, unknown>;
}

export interface PluginEnvironmentGetInteractiveSetupParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  sessionId: string;
  authorized: boolean;
}

export interface PluginEnvironmentCaptureTemplateParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  sessionId: string;
  templateKey: string;
}

export interface PluginEnvironmentCaptureTemplateResult {
  templateKey: string;
  captured: boolean;
}

export interface PluginEnvironmentCancelInteractiveSetupParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  sessionId: string;
}

export interface PluginEnvironmentCancelInteractiveSetupResult {
  cancelled: boolean;
}

export interface PluginEnvironmentDeleteTemplateParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  templateKey: string;
}

export interface PluginEnvironmentDeleteTemplateResult {
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Setup-token PTY (host→worker)
// ---------------------------------------------------------------------------

export interface PluginSetupTokenPtyOpenParams {
  pluginId: string;
  companyId: string;
  driverType: string;
  routeId: string;
}

export interface PluginSetupTokenPtyOpenResult {
  sessionId: string;
  routeId: string;
}

export interface PluginSetupTokenPtyInputParams {
  sessionId: string;
  data: string;
}

export interface PluginSetupTokenPtyStopParams {
  sessionId: string;
}

export interface PluginSetupTokenPtyCloseParams {
  routeId: string;
}

export interface PluginSetupTokenPtyCloseResult {
  routeId: string;
  closed: boolean;
}

// ---------------------------------------------------------------------------
// External objects
// ---------------------------------------------------------------------------

export interface DetectExternalObjectsParams {
  pluginId: string;
  companyId: string;
  text: string;
}

export interface DetectExternalObjectsResult {
  matches: Array<{ url: string; objectId: string; objectType: string }>;
}

export interface ResolveExternalObjectParams {
  pluginId: string;
  companyId: string;
  objectId: string;
  objectType: string;
}

export interface PluginExternalObjectResolveResult {
  status: string;
  url: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface RefreshExternalObjectsParams {
  pluginId: string;
  companyId: string;
  objectIds: string[];
}

export interface RefreshExternalObjectsResult {
  refreshed: number;
  errors?: Array<{ objectId: string; error: string }>;
}

// ---------------------------------------------------------------------------
// PerformAction context
// ---------------------------------------------------------------------------

export interface PluginPerformActionContext {
  companyId: string;
  actorId?: string;
  actorType?: "user" | "agent";
  agentRunId?: string;
  launchBounds?: PluginLauncherBounds;
  renderContext?: PluginLauncherRenderContextSnapshot;
  sourceEntityId?: string;
  sourceEntityType?: string;
}

// ---------------------------------------------------------------------------
// Plugin setup token (environment setup)
// ---------------------------------------------------------------------------

export interface PluginSetupTokenInput {
  name: string;
  driverType: string;
  config: Record<string, unknown>;
  companyIdOverride?: string;
}

export interface PluginSetupTokenResult {
  tokenUrl: string;
  setupPayload?: Record<string, unknown>;
}

export interface PluginLaunchersCreateInput {
  declaration: import("@paperclipai/shared").PluginLauncherDeclaration;
  renderEnvironment: PluginLauncherRenderEnvironment;
}

export interface PluginLaunchersUpdateInput {
  launcherKey: string;
  declaration?: Partial<import("@paperclipai/shared").PluginLauncherDeclaration>;
  renderEnvironment?: Partial<PluginLauncherRenderEnvironment>;
}

export interface PluginLaunchersRemoveInput {
  launcherKey: string;
}
