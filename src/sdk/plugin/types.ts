/**
 * Core types for the Parrot plugin worker-side SDK.
 *
 * These types define the stable public API surface that plugin workers import
 * from `parrot-plugin-sdk`. The host provides a concrete implementation of
 * `PluginContext` to the plugin at initialisation time.
 *
 * @see PLUGIN_SPEC.md §14 — SDK Surface
 */

import type {
  PaperclipPluginManifestV1,
  PluginStateScopeKind,
  PluginEventType,
  PluginToolDeclaration,
  PluginLauncherDeclaration,
} from "@paperclipai/shared";
import type {
  PluginPerformActionContext,
  PluginSetupTokenInput,
  PluginSetupTokenResult,
  PluginLaunchersCreateInput,
  PluginLaunchersUpdateInput,
  PluginLaunchersRemoveInput,
} from "./protocol.js";

// ---------------------------------------------------------------------------
// Re-exports from @paperclipai/shared (plugin authors import from one place)
// ---------------------------------------------------------------------------

export type {
  PaperclipPluginManifestV1,
  PluginJobDeclaration,
  PluginWebhookDeclaration,
  PluginToolDeclaration,
  PluginEnvironmentDriverDeclaration,
  PluginEnvironmentTemplateConfigBinding,
  PluginManagedAgentDeclaration,
  PluginManagedAgentResolution,
  PluginManagedProjectDeclaration,
  PluginManagedProjectResolution,
  PluginManagedRoutineDeclaration,
  PluginManagedRoutineResolution,
  PluginManagedSkillDeclaration,
  PluginManagedSkillFileDeclaration,
  PluginManagedSkillResolution,
  PluginManagedResourceKind,
  PluginManagedResourceRef,
  PluginUiSlotDeclaration,
  PluginUiDeclaration,
  PluginLauncherActionDeclaration,
  PluginLauncherRenderDeclaration,
  PluginLauncherDeclaration,
  PluginMinimumHostVersion,
  PluginDatabaseDeclaration,
  PluginApiRouteDeclaration,
  PluginApiRouteCompanyResolution,
  PluginObjectReferenceRefreshPolicy,
  PluginObjectReferenceProviderDeclaration,
  PluginRecord,
  PluginDatabaseNamespaceRecord,
  PluginMigrationRecord,
  PluginConfig,
  JsonSchema,
  PluginStatus,
  PluginCategory,
  PluginCapability,
  PluginUiSlotType,
  PluginUiSlotEntityType,
  PluginLauncherPlacementZone,
  PluginLauncherAction,
  PluginLauncherBounds,
  PluginLauncherRenderEnvironment,
  PluginStateScopeKind,
  PluginJobStatus,
  PluginJobRunStatus,
  PluginJobRunTrigger,
  PluginWebhookDeliveryStatus,
  PluginDatabaseCoreReadTable,
  PluginDatabaseMigrationStatus,
  PluginDatabaseNamespaceMode,
  PluginDatabaseNamespaceStatus,
  PluginApiRouteAuthMode,
  PluginApiRouteCheckoutPolicy,
  PluginApiRouteMethod,
  PluginEventType,
  PluginBridgeErrorCode,
} from "@paperclipai/shared";

// ---------------------------------------------------------------------------
// Scope key
// ---------------------------------------------------------------------------

export interface ScopeKey {
  scopeKind: PluginStateScopeKind;
  scopeId?: string;
  namespace?: string;
  stateKey: string;
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export interface EventFilter {
  projectId?: string;
  companyId?: string;
  agentId?: string;
  [key: string]: unknown;
}

export interface PluginEvent<TPayload = unknown> {
  eventId: string;
  eventType: PluginEventType | `plugin.${string}`;
  occurredAt: string;
  actorId?: string;
  actorType?: "user" | "agent" | "system" | "plugin";
  entityId?: string;
  entityType?: string;
  companyId: string;
  payload: TPayload;
}

// ---------------------------------------------------------------------------
// Job context
// ---------------------------------------------------------------------------

export interface PluginJobContext {
  jobKey: string;
  runId: string;
  trigger: "schedule" | "manual" | "retry";
  scheduledAt: string;
}

// ---------------------------------------------------------------------------
// Tool run context
// ---------------------------------------------------------------------------

export interface ToolRunContext {
  agentId: string;
  runId: string;
  companyId: string;
  projectId: string;
}

export interface ToolResult {
  content?: string;
  data?: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// Plugin entity store
// ---------------------------------------------------------------------------

export interface PluginEntityUpsert {
  entityType: string;
  scopeKind: PluginStateScopeKind;
  scopeId?: string;
  externalId?: string;
  title?: string;
  status?: string;
  data: Record<string, unknown>;
}

export interface PluginEntityRecord {
  id: string;
  entityType: string;
  scopeKind: PluginStateScopeKind;
  scopeId: string | null;
  externalId: string | null;
  title: string | null;
  status: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PluginEntityQuery {
  entityType?: string;
  scopeKind?: PluginStateScopeKind;
  scopeId?: string;
  externalId?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Project workspace
// ---------------------------------------------------------------------------

export interface PluginWorkspace {
  id: string;
  projectId: string;
  name: string;
  path: string;
  repoUrl: string | null;
  repoRef: string | null;
  defaultRef: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PluginExecutionWorkspaceMetadata {
  id: string;
  companyId: string;
  projectId: string;
  projectWorkspaceId: string | null;
  path: string | null;
  cwd: string | null;
  repoUrl: string | null;
  baseRef: string | null;
  branchName: string | null;
  providerType: string | null;
  providerMetadata: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Plugin config client
// ---------------------------------------------------------------------------

export interface PluginConfigClient {
  get(companyId?: string): Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Local folders client
// ---------------------------------------------------------------------------

export interface PluginLocalFolderProblem {
  code:
    | "not_configured"
    | "not_absolute"
    | "missing"
    | "not_directory"
    | "not_readable"
    | "not_writable"
    | "missing_directory"
    | "missing_file"
    | "path_traversal"
    | "symlink_escape"
    | "atomic_write_failed";
  message: string;
  path?: string;
}

export interface PluginLocalFolderStatus {
  folderKey: string;
  configured: boolean;
  path: string | null;
  realPath: string | null;
  access: "read" | "readWrite";
  readable: boolean;
  writable: boolean;
  requiredDirectories: string[];
  requiredFiles: string[];
  missingDirectories: string[];
  missingFiles: string[];
  healthy: boolean;
  problems: PluginLocalFolderProblem[];
  checkedAt: string;
}

export interface PluginLocalFolderConfigureInput {
  companyId: string;
  folderKey: string;
  path: string;
  access?: "read" | "readWrite";
  requiredDirectories?: string[];
  requiredFiles?: string[];
}

export interface PluginLocalFolderListOptions {
  relativePath?: string | null;
  recursive?: boolean;
  maxEntries?: number;
}

export interface PluginLocalFolderEntry {
  path: string;
  name: string;
  kind: "file" | "directory";
  size: number | null;
  modifiedAt: string | null;
}

export interface PluginLocalFolderListing {
  folderKey: string;
  relativePath: string | null;
  entries: PluginLocalFolderEntry[];
  truncated: boolean;
}

export interface PluginLocalFoldersClient {
  declarations(): import("@paperclipai/shared").PluginLocalFolderDeclaration[];
  configure(input: PluginLocalFolderConfigureInput): Promise<PluginLocalFolderStatus>;
  status(companyId: string, folderKey: string): Promise<PluginLocalFolderStatus>;
  list(companyId: string, folderKey: string, options?: PluginLocalFolderListOptions): Promise<PluginLocalFolderListing>;
  readText(companyId: string, folderKey: string, relativePath: string): Promise<string>;
  writeTextAtomic(companyId: string, folderKey: string, relativePath: string, contents: string): Promise<PluginLocalFolderStatus>;
  deleteFile(companyId: string, folderKey: string, relativePath: string): Promise<PluginLocalFolderStatus>;
}

// ---------------------------------------------------------------------------
// Events client
// ---------------------------------------------------------------------------

export interface PluginEventsClient {
  on(name: PluginEventType | `plugin.${string}`, fn: (event: PluginEvent) => Promise<void>): () => void;
  on(name: PluginEventType | `plugin.${string}`, filter: EventFilter, fn: (event: PluginEvent) => Promise<void>): () => void;
  emit(name: string, companyId: string, payload: unknown): Promise<void>;
}

// ---------------------------------------------------------------------------
// Jobs client
// ---------------------------------------------------------------------------

export interface PluginJobsClient {
  register(key: string, fn: (job: PluginJobContext) => Promise<void>): void;
}

// ---------------------------------------------------------------------------
// Launchers client
// ---------------------------------------------------------------------------

export type PluginLauncherRegistration = PluginLauncherDeclaration;

export interface PluginLaunchersClient {
  create(input: PluginLaunchersCreateInput): Promise<void>;
  update(input: PluginLaunchersUpdateInput): Promise<void>;
  remove(input: PluginLaunchersRemoveInput): Promise<void>;
}

// ---------------------------------------------------------------------------
// Database client
// ---------------------------------------------------------------------------

export interface PluginDatabaseClient {
  sql<T = unknown>(query: string, params?: unknown[]): Promise<T[]>;
  migrate(up: (db: PluginDatabaseClient) => Promise<void>, down?: (db: PluginDatabaseClient) => Promise<void>): Promise<void>;
  namespace(): string;
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

export interface PluginHttpClient {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

// ---------------------------------------------------------------------------
// Secrets client
// ---------------------------------------------------------------------------

export interface PluginSecretsClient {
  resolve(ref: string, context?: { companyId?: string; configPath?: string }): Promise<string>;
}

// ---------------------------------------------------------------------------
// Activity client
// ---------------------------------------------------------------------------

export interface PluginActivityClient {
  write(entry: {
    companyId?: string;
    actorId?: string;
    entityId?: string;
    entityType?: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

// ---------------------------------------------------------------------------
// State client
// ---------------------------------------------------------------------------

export interface PluginStateClient {
  get(key: ScopeKey): Promise<string | null>;
  set(key: ScopeKey, value: string): Promise<void>;
  delete(key: ScopeKey): Promise<void>;
  list(scopeKind: PluginStateScopeKind, scopeId?: string): Promise<Array<{ key: ScopeKey; value: string }>>;
}

// ---------------------------------------------------------------------------
// Entities client
// ---------------------------------------------------------------------------

export interface PluginEntitiesClient {
  upsert(entity: PluginEntityUpsert): Promise<string>;
  list(query: PluginEntityQuery): Promise<PluginEntityRecord[]>;
  get(id: string): Promise<PluginEntityRecord | null>;
  delete(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Projects client
// ---------------------------------------------------------------------------

export interface PluginProjectsClient {
  get(id: string): Promise<PluginWorkspace | null>;
  list(companyId: string): Promise<PluginWorkspace[]>;
}

export interface PluginExecutionWorkspacesClient {
  get(id: string): Promise<PluginExecutionWorkspaceMetadata | null>;
  list(companyId: string): Promise<PluginExecutionWorkspaceMetadata[]>;
}

// ---------------------------------------------------------------------------
// Routines / Skills / Companies clients
// ---------------------------------------------------------------------------

export interface PluginRoutinesClient {
  resolve(companyId: string, routineKey: string): Promise<import("@paperclipai/shared").PluginManagedRoutineResolution | null>;
}

export interface PluginSkillsClient {
  resolve(companyId: string, skillKey: string): Promise<import("@paperclipai/shared").PluginManagedSkillResolution | null>;
}

export interface PluginCompaniesClient {
  get(id: string): Promise<import("@paperclipai/shared").Company | null>;
}

// ---------------------------------------------------------------------------
// Issues client
// ---------------------------------------------------------------------------

export interface PluginIssuesClient {
  get(id: string): Promise<import("@paperclipai/shared").Issue | null>;
  list(companyId: string, filter?: { projectId?: string; assigneeId?: string }): Promise<import("@paperclipai/shared").Issue[]>;
  update(id: string, updates: { title?: string; description?: string; status?: string; assigneeId?: string }): Promise<import("@paperclipai/shared").Issue>;
  create(companyId: string, input: { projectId: string; title: string; description?: string; assigneeId?: string }): Promise<import("@paperclipai/shared").Issue>;
}

// ---------------------------------------------------------------------------
// Approvals client
// ---------------------------------------------------------------------------

export interface PluginApprovalsClient {
  list(companyId: string): Promise<import("@paperclipai/shared").Approval[]>;
  respond(id: string, decision: "approved" | "rejected", reason?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Agents client
// ---------------------------------------------------------------------------

export interface PluginAgentsClient {
  get(id: string): Promise<import("@paperclipai/shared").Agent | null>;
  list(companyId: string): Promise<import("@paperclipai/shared").Agent[]>;
  pause(id: string): Promise<void>;
  resume(id: string): Promise<void>;
  invoke(id: string, prompt: string, options?: { companyId?: string; projectId?: string }): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Goals client
// ---------------------------------------------------------------------------

export interface PluginGoalsClient {
  get(id: string): Promise<import("@paperclipai/shared").Goal | null>;
  list(companyId: string): Promise<import("@paperclipai/shared").Goal[]>;
  create(input: { companyId: string; title: string; description?: string }): Promise<import("@paperclipai/shared").Goal>;
  update(id: string, updates: { title?: string; description?: string; status?: string }): Promise<import("@paperclipai/shared").Goal>;
}

// ---------------------------------------------------------------------------
// Access client
// ---------------------------------------------------------------------------

export interface PluginAccessClient {
  listMembers(companyId: string): Promise<import("./types.js").PluginAccessMember[]>;
  listInvites(companyId: string): Promise<import("./types.js").PluginAccessInvite[]>;
  createInvite(companyId: string, input: { email: string; role: string }): Promise<import("./types.js").PluginAccessInvite>;
}

export interface PluginAccessMember {
  id: string;
  companyId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface PluginAccessInvite {
  id: string;
  companyId: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
}

// ---------------------------------------------------------------------------
// Authorization client
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Authorization policy/audit types (self-contained — no external dependency)
// ---------------------------------------------------------------------------

export interface PluginAuthorizationPolicySummary {
  companyId: string;
  permissionsMode: "simple";
  memberCount: number;
  activeMemberCount: number;
  grantCount: number;
  advancedPolicyAvailable: false;
}

export interface PluginAssignmentPreviewInput {
  companyId: string;
  actor:
    | { type: "board"; userId?: string | null; companyIds?: string[]; isInstanceAdmin?: boolean }
    | { type: "agent"; agentId: string; companyId: string };
  target: {
    issueId?: string | null;
    projectId?: string | null;
    parentIssueId?: string | null;
    assigneeAgentId?: string | null;
    assigneeUserId?: string | null;
    status?: string | null;
  };
}

export interface PluginAuthorizationDecisionResult {
  allowed: boolean;
  action: string;
  explanation: string;
  reason: string;
  grant?: {
    principalType: string;
    principalId: string;
    permissionKey: string;
    scope: Record<string, unknown> | null;
  };
}

export interface PluginAuthorizationAuditEntry {
  id: string;
  companyId: string;
  actorType: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface PluginAuthorizationClient {
  getPolicySummary(companyId: string): Promise<PluginAuthorizationPolicySummary>;
  previewDecision(input: PluginAssignmentPreviewInput): Promise<PluginAuthorizationDecisionResult>;
  listAuditEntries(companyId: string, filter?: { actorId?: string; limit?: number }): Promise<PluginAuthorizationAuditEntry[]>;
}

// ---------------------------------------------------------------------------
// Data / Actions clients (UI)
// ---------------------------------------------------------------------------

export interface PluginDataClient {
  register(key: string, fn: (params: Record<string, unknown>) => Promise<unknown>): void;
}

export interface PluginActionsClient {
  register(key: string, fn: (params: Record<string, unknown>, context: PluginPerformActionContext) => Promise<unknown>): void;
}

// ---------------------------------------------------------------------------
// Streams client (SSE push to plugin UI)
// ---------------------------------------------------------------------------

export interface PluginStreamsClient {
  push(event: string, data: unknown, companyId?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Execution client (streaming command output)
// ---------------------------------------------------------------------------

export interface PluginExecutionClient {
  write(chunk: string): void;
}

// ---------------------------------------------------------------------------
// Setup token PTY client
// ---------------------------------------------------------------------------

export interface PluginSetupTokenPtyClient {
  open(params: PluginSetupTokenInput): Promise<PluginSetupTokenResult>;
  write(sessionId: string, data: string): Promise<void>;
  stop(sessionId: string): Promise<void>;
  close(routeId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Tools client
// ---------------------------------------------------------------------------

export interface PluginToolsClient {
  register(
    declaration: Pick<PluginToolDeclaration, "name" | "displayName" | "description" | "parametersSchema">,
    fn: (params: unknown, runCtx: ToolRunContext) => Promise<ToolResult>,
  ): void;
}

// ---------------------------------------------------------------------------
// Metrics / Telemetry clients
// ---------------------------------------------------------------------------

export interface PluginMetricsClient {
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  counter(name: string, delta?: number, labels?: Record<string, string>): void;
  histogram(name: string, value: number, labels?: Record<string, string>): void;
}

export interface PluginTelemetryClient {
  track(event: string, properties?: Record<string, unknown>): void;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  [key: string]: ((message: string, meta?: Record<string, unknown>) => void) | undefined;
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

export interface PluginTracer {
  span(operationName: string, fn: (span: { setAttribute: (k: string, v: unknown) => void }) => Promise<void>): Promise<void>;
}

// ---------------------------------------------------------------------------
// PluginContext — the primary interface plugins interact with
// ---------------------------------------------------------------------------

export interface PluginContext {
  manifest: PaperclipPluginManifestV1;
  config: PluginConfigClient;
  localFolders: PluginLocalFoldersClient;
  events: PluginEventsClient;
  jobs: PluginJobsClient;
  launchers: PluginLaunchersClient;
  db: PluginDatabaseClient;
  http: PluginHttpClient;
  secrets: PluginSecretsClient;
  activity: PluginActivityClient;
  state: PluginStateClient;
  entities: PluginEntitiesClient;
  projects: PluginProjectsClient;
  executionWorkspaces: PluginExecutionWorkspacesClient;
  routines: PluginRoutinesClient;
  skills: PluginSkillsClient;
  companies: PluginCompaniesClient;
  issues: PluginIssuesClient;
  approvals: PluginApprovalsClient;
  agents: PluginAgentsClient;
  goals: PluginGoalsClient;
  access: PluginAccessClient;
  authorization: PluginAuthorizationClient;
  data: PluginDataClient;
  actions: PluginActionsClient;
  streams: PluginStreamsClient;
  execution: PluginExecutionClient;
  setupTokenPty: PluginSetupTokenPtyClient;
  tools: PluginToolsClient;
  metrics: PluginMetricsClient;
  telemetry: PluginTelemetryClient;
  logger: PluginLogger;
  tracer: PluginTracer;
}
