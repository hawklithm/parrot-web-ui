/**
 * `parrot-plugin-sdk` — Parrot plugin worker-side SDK.
 *
 * This is the main entrypoint for plugin worker code.
 *
 * @example
 * ```ts
 * // Plugin worker entrypoint (dist/worker.ts)
 * import { definePlugin, runWorker } from "parrot-plugin-sdk";
 *
 * const plugin = definePlugin({
 *   async setup(ctx) {
 *     ctx.logger.info("Plugin starting up");
 *
 *     ctx.events.on("issue.created", async (event) => {
 *       ctx.logger.info("Issue created", { issueId: event.entityId });
 *     });
 *
 *     ctx.jobs.register("full-sync", async (job) => {
 *       ctx.logger.info("Starting full sync", { runId: job.runId });
 *     });
 *
 *     ctx.data.register("sync-health", async ({ companyId }) => {
 *       const state = await ctx.state.get({
 *         scopeKind: "company",
 *         scopeId: String(companyId),
 *         stateKey: "last-sync-at",
 *       });
 *       return { lastSync: state };
 *     });
 *   },
 *
 *   async onHealth() {
 *     return { status: "ok" };
 *   },
 * });
 *
 * export default plugin;
 * runWorker(plugin, import.meta.url);
 * ```
 */

// Main factory
export { definePlugin } from "./define-plugin.js";
export type { PaperclipPlugin, PluginDefinition, PluginHealthDiagnostics, PluginConfigValidationResult, PluginWebhookInput, PluginApiRequestInput, PluginApiResponse, PluginConfigChangeContext } from "./define-plugin.js";

// Protocol
export {
  JSONRPC_VERSION,
  PLUGIN_RPC_ERROR_CODES,
  JSONRPC_ERROR_CODES,
  HOST_TO_WORKER_REQUIRED_METHODS,
  HOST_TO_WORKER_OPTIONAL_METHODS,
  MESSAGE_DELIMITER,
  createRequest,
  createSuccessResponse,
  createErrorResponse,
  createNotification,
  isJsonRpcRequest,
  isJsonRpcNotification,
  isJsonRpcResponse,
  isJsonRpcSuccessResponse,
  isJsonRpcErrorResponse,
} from "./protocol.js";
export type {
  JsonRpcId,
  JsonRpcRequest,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcNotification,
  JsonRpcMessage,
  JsonRpcError,
  PluginInvocationScope,
  PluginPerformActionContext,
  PluginSetupTokenInput,
  PluginSetupTokenResult,
  PluginLaunchersCreateInput,
  PluginLaunchersUpdateInput,
  PluginLaunchersRemoveInput,
  // Environment driver protocol types
  PluginEnvironmentValidateConfigParams,
  PluginEnvironmentValidationResult,
  PluginEnvironmentProbeParams,
  PluginEnvironmentProbeResult,
  PluginEnvironmentAcquireLeaseParams,
  PluginEnvironmentLease,
  PluginEnvironmentResumeLeaseParams,
  PluginEnvironmentReleaseLeaseParams,
  PluginEnvironmentDestroyLeaseParams,
  PluginEnvironmentRealizeWorkspaceParams,
  PluginEnvironmentRealizeWorkspaceResult,
  PluginEnvironmentExecuteParams,
  PluginEnvironmentExecuteResult,
  PluginEnvironmentSyncInParams,
  PluginEnvironmentSyncOutParams,
  PluginEnvironmentSyncResult,
  PluginEnvironmentStartInteractiveSetupParams,
  PluginEnvironmentInteractiveSetupSession,
  PluginEnvironmentGetInteractiveSetupParams,
  PluginEnvironmentCaptureTemplateParams,
  PluginEnvironmentCaptureTemplateResult,
  PluginEnvironmentCancelInteractiveSetupParams,
  PluginEnvironmentCancelInteractiveSetupResult,
  PluginEnvironmentDeleteTemplateParams,
  PluginEnvironmentDeleteTemplateResult,
  // PTY protocol types
  PluginSetupTokenPtyOpenParams,
  PluginSetupTokenPtyOpenResult,
  PluginSetupTokenPtyInputParams,
  PluginSetupTokenPtyStopParams,
  PluginSetupTokenPtyCloseParams,
  PluginSetupTokenPtyCloseResult,
  // External objects protocol types
  DetectExternalObjectsParams,
  DetectExternalObjectsResult,
  ResolveExternalObjectParams,
  PluginExternalObjectResolveResult,
  RefreshExternalObjectsParams,
  RefreshExternalObjectsResult,
} from "./protocol.js";

// Types
export type {
  ScopeKey,
  EventFilter,
  PluginEvent,
  PluginJobContext,
  ToolRunContext,
  ToolResult,
  PluginEntityUpsert,
  PluginEntityRecord,
  PluginEntityQuery,
  PluginWorkspace,
  PluginExecutionWorkspaceMetadata,
  // Client interfaces
  PluginConfigClient,
  PluginLocalFolderProblem,
  PluginLocalFolderStatus,
  PluginLocalFolderConfigureInput,
  PluginLocalFolderListOptions,
  PluginLocalFolderEntry,
  PluginLocalFolderListing,
  PluginLocalFoldersClient,
  PluginEventsClient,
  PluginJobsClient,
  PluginLauncherRegistration,
  PluginLaunchersClient,
  PluginDatabaseClient,
  PluginHttpClient,
  PluginSecretsClient,
  PluginActivityClient,
  PluginStateClient,
  PluginEntitiesClient,
  PluginProjectsClient,
  PluginExecutionWorkspacesClient,
  PluginRoutinesClient,
  PluginSkillsClient,
  PluginCompaniesClient,
  PluginIssuesClient,
  PluginApprovalsClient,
  PluginAgentsClient,
  PluginGoalsClient,
  PluginAccessClient,
  PluginAccessMember,
  PluginAccessInvite,
  PluginAuthorizationClient,
  PluginDataClient,
  PluginActionsClient,
  PluginStreamsClient,
  PluginExecutionClient,
  PluginSetupTokenPtyClient,
  PluginToolsClient,
  PluginMetricsClient,
  PluginTelemetryClient,
  PluginLogger,
  PluginTracer,
  // Primary interface
  PluginContext,
} from "./types.js";

// Worker RPC host
export { startWorkerRpcHost, runWorker } from "./worker-rpc-host.js";
export type { WorkerRpcHost, WorkerRpcHostOptions, RunWorkerOptions } from "./worker-rpc-host.js";
