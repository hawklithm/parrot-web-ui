/**
 * Worker-side RPC host — JSON-RPC 2.0 over stdio for host↔worker IPC.
 *
 * Reads JSON-RPC messages from stdin, dispatches them to the plugin
 * definition, and writes responses back to stdout.
 *
 * @see PLUGIN_SPEC.md §12.1 — Process Model
 * @see PLUGIN_SPEC.md §13 — Host-Worker Protocol
 */

import type { PaperclipPlugin } from "./define-plugin.js";
import type { PluginContext } from "./types.js";
import type {
  JsonRpcMessage,
  JsonRpcRequest,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcNotification,
  JsonRpcId,
  PluginInvocationScope,
} from "./protocol.js";
import {
  JSONRPC_VERSION,
  PLUGIN_RPC_ERROR_CODES,
  createSuccessResponse,
  createErrorResponse,
  createNotification,
  isJsonRpcRequest,
  isJsonRpcNotification,
  isJsonRpcResponse,
} from "./protocol.js";

// ---------------------------------------------------------------------------
// Plugin invocation context (threaded via AsyncLocalStorage)
// ---------------------------------------------------------------------------

interface PluginInvocationContext {
  scope: PluginInvocationScope;
  requestId: JsonRpcId;
}

// ---------------------------------------------------------------------------
// Handler registrations (populated during setup())
// ---------------------------------------------------------------------------

interface EventRegistration {
  eventName: string;
  filter?: import("./types.js").EventFilter;
  handler: (event: import("./types.js").PluginEvent) => Promise<void>;
}

interface JobHandlerEntry {
  key: string;
  fn: (job: import("./types.js").PluginJobContext) => Promise<void>;
}

interface ToolHandlerEntry {
  declaration: Pick<import("@paperclipai/shared").PluginToolDeclaration, "name" | "displayName" | "description" | "parametersSchema">;
  fn: (params: unknown, runCtx: import("./types.js").ToolRunContext) => Promise<import("./types.js").ToolResult>;
}

// ---------------------------------------------------------------------------
// Default no-op PluginContext stub
// ---------------------------------------------------------------------------

function createDefaultContext(manifest: import("@paperclipai/shared").PaperclipPluginManifestV1): PluginContext {
  const noop = () => Promise.resolve();
  const noopVal = () => Promise.resolve(null as unknown);
  const noopArr = () => Promise.resolve([]);
  const noopStr = () => Promise.resolve("");

  return {
    manifest,
    config: { get: async () => ({} as Record<string, unknown>) },
    localFolders: {
      declarations: () => [],
      configure: async () => ({ folderKey: "", configured: false, path: null, realPath: null, access: "read", readable: false, writable: false, requiredDirectories: [], requiredFiles: [], missingDirectories: [], missingFiles: [], healthy: false, problems: [], checkedAt: new Date().toISOString() } as any),
      status: async () => ({ folderKey: "", configured: false, path: null, realPath: null, access: "read", readable: false, writable: false, requiredDirectories: [], requiredFiles: [], missingDirectories: [], missingFiles: [], healthy: false, problems: [], checkedAt: new Date().toISOString() } as any),
      list: async () => ({ folderKey: "", relativePath: null, entries: [], truncated: false }),
      readText: noopStr,
      writeTextAtomic: async () => ({ folderKey: "", configured: false, path: null, realPath: null, access: "read", readable: false, writable: false, requiredDirectories: [], requiredFiles: [], missingDirectories: [], missingFiles: [], healthy: false, problems: [], checkedAt: new Date().toISOString() } as any),
      deleteFile: async () => ({ folderKey: "", configured: false, path: null, realPath: null, access: "read", readable: false, writable: false, requiredDirectories: [], requiredFiles: [], missingDirectories: [], missingFiles: [], healthy: false, problems: [], checkedAt: new Date().toISOString() } as any),
    },
    events: {
      on: () => () => {},
      emit: noop,
    },
    jobs: { register: () => {} },
    launchers: { create: noop, update: noop, remove: noop },
    db: { sql: async () => [], migrate: async () => {}, namespace: () => "" },
    http: { fetch: async () => new Response(JSON.stringify({ error: "not implemented" })) },
    secrets: { resolve: noopStr },
    activity: { write: noop },
    state: { get: noopVal, set: noop, delete: noop, list: noopArr },
    entities: { upsert: async () => "", list: noopArr, get: async () => null, delete: noop },
    projects: { get: async () => null, list: noopArr },
    executionWorkspaces: { get: async () => null, list: noopArr },
    routines: { resolve: async () => null },
    skills: { resolve: async () => null },
    companies: { get: async () => null },
    issues: { get: async () => null, list: noopArr, update: async () => ({} as any), create: async () => ({} as any) },
    approvals: { list: noopArr, respond: noop },
    agents: { get: async () => null, list: noopArr, pause: noop, resume: noop, invoke: async () => null },
    goals: { get: async () => null, list: noopArr, create: async () => ({} as any), update: async () => ({} as any) },
    access: { listMembers: noopArr, listInvites: noopArr, createInvite: async () => ({} as any) },
    authorization: { getPolicySummary: async () => ({} as any), previewDecision: async () => ({} as any), listAuditEntries: noopArr },
    data: { register: () => {} },
    actions: { register: () => {} },
    streams: { push: noop },
    execution: { write: () => {} },
    setupTokenPty: { open: async () => ({ tokenUrl: "", sessionId: "", routeId: "" } as any), write: noop, stop: noop, close: noop },
    tools: { register: () => {} },
    metrics: { gauge: () => {}, counter: () => {}, histogram: () => {} },
    telemetry: { track: () => {} },
    logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
    tracer: { span: async () => {} },
  } as PluginContext;
}

// ---------------------------------------------------------------------------
// WorkerRpcHost — returned by startWorkerRpcHost for inspection/stop
// ---------------------------------------------------------------------------

export interface WorkerRpcHost {
  /** Gracefully stop the RPC host and close stdio listeners. */
  stop(): void;
  /** Whether the host is still running. */
  readonly isRunning: boolean;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface WorkerRpcHostOptions {
  plugin: PaperclipPlugin;
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
  rpcTimeoutMs?: number;
}

export interface RunWorkerOptions {
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

const DEFAULT_RPC_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Utility: parse one line-delimited JSON-RPC message from a stream
// ---------------------------------------------------------------------------

// Stream reader implemented inline in startWorkerRpcHost\n
// ---------------------------------------------------------------------------
// startWorkerRpcHost
// ---------------------------------------------------------------------------

/**
 * Start the worker-side RPC host.
 *
 * Begins listening on stdin immediately. Does NOT call plugin.definition.setup()
 * yet — that happens when the host sends the `initialize` RPC.
 *
 * @returns A handle for inspecting or stopping the RPC host
 */
export function startWorkerRpcHost(options: WorkerRpcHostOptions): WorkerRpcHost {
  const { plugin } = options;
  const stdinStream = options.stdin ?? process.stdin;
  const stdoutStream = options.stdout ?? process.stdout;
  const rpcTimeoutMs = options.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;

  let running = true;
  let initialized = false;
  let manifest: import("@paperclipai/shared").PaperclipPluginManifestV1 | null = null;
  let context: PluginContext | null = null;

  // Handler registrations (populated during setup())
  const eventHandlers: EventRegistration[] = [];
  const jobHandlers = new Map<string, JobHandlerEntry>();
  const dataHandlers = new Map<string, (params: Record<string, unknown>) => Promise<unknown>>();
  const actionHandlers = new Map<string, (params: Record<string, unknown>, ctx: import("./protocol.js").PluginPerformActionContext) => Promise<unknown>>();
  const toolHandlers = new Map<string, ToolHandlerEntry>();

  // Pending RPC responses keyed by request id
  const pendingCalls = new Map<JsonRpcId, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();

  // Counter for generating unique request ids
  let nextId = 0;
  function nextRequestId(): JsonRpcId {
    return String(++nextId);
  }

  // -----------------------------------------------------------------------
  // Write helper — frame messages with newline delimiter
  // -----------------------------------------------------------------------

  function write(msg: JsonRpcMessage): void {
    if (!running) return;
    const line = JSON.stringify(msg) + "\n";
    stdoutStream.write(line);
  }

  function sendError(id: JsonRpcId, code: number, message: string): void {
    write(createErrorResponse(id, code, message));
  }

  function sendSuccess(id: JsonRpcId, result: unknown): void {
    write(createSuccessResponse(id, result));
  }

  function sendNotification(method: string, params?: Record<string, unknown>): void {
    write(createNotification(method, params));
  }

  // -----------------------------------------------------------------------
  // Plugin setup (called once after initialize)
  // -----------------------------------------------------------------------

  async function runSetup(): Promise<void> {
    if (initialized || !context) return;
    initialized = true;
    try {
      await plugin.definition.setup(context);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      context.logger.error(`Plugin setup failed: ${message}`);
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // Request dispatch table
  // -----------------------------------------------------------------------

  async function handleRequest(req: JsonRpcRequest): Promise<void> {
    const { method, params, id } = req;

    // Initialize on first call
    if (!initialized) {
      if (method === "initialize") {
        const initParams = (params ?? {}) as { manifest: import("@paperclipai/shared").PaperclipPluginManifestV1; config: Record<string, unknown> };
        manifest = initParams.manifest ?? null;
        context = manifest ? createDefaultContext(manifest) : createDefaultContext({
          id: "unknown", apiVersion: 1, version: "0.0.0", displayName: "Unknown",
          description: "", author: "", categories: [], capabilities: [], entrypoints: { worker: "" },
        } as any);
        sendSuccess(id, { status: "ok" });
        await runSetup();
        return;
      }
      sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_UNAVAILABLE, "Plugin not initialized. Send 'initialize' first.");
      return;
    }

    switch (method) {
      case "health": {
        if (plugin.definition.onHealth) {
          try {
            const result = await plugin.definition.onHealth();
            sendSuccess(id, result);
          } catch (err) {
            sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
          }
        } else {
          sendSuccess(id, { status: "ok" });
        }
        break;
      }

      case "validateConfig": {
        if (plugin.definition.onValidateConfig) {
          try {
            const config = (params ?? {}) as Record<string, unknown>;
            const result = await plugin.definition.onValidateConfig(config);
            sendSuccess(id, result);
          } catch (err) {
            sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
          }
        } else {
          sendSuccess(id, { ok: true });
        }
        break;
      }

      case "configChanged": {
        if (plugin.definition.onConfigChanged) {
          try {
            const config = (params ?? {}) as Record<string, unknown>;
            const changeContext = ((params ?? {}) as { context?: import("./define-plugin.js").PluginConfigChangeContext }).context;
            await plugin.definition.onConfigChanged(config, changeContext);
            sendSuccess(id, { status: "ok" });
          } catch (err) {
            sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
          }
        } else {
          sendSuccess(id, { status: "ok" });
        }
        break;
      }

      case "shutdown": {
        if (plugin.definition.onShutdown) {
          try {
            await plugin.definition.onShutdown();
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            context?.logger?.error(`Plugin shutdown failed: ${message}`);
          }
        }
        running = false;
        sendSuccess(id, { status: "ok" });
        break;
      }

      case "runJob": {
        const jobParams = (params ?? {}) as { jobKey: string; runId: string; trigger: "schedule" | "manual" | "retry"; scheduledAt: string };
        const entry = jobHandlers.get(jobParams.jobKey);
        if (!entry) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, `No handler registered for job key: ${jobParams.jobKey}`);
          break;
        }
        try {
          await entry.fn(jobParams);
          sendSuccess(id, { status: "ok" });
        } catch (err) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "handleWebhook": {
        if (!plugin.definition.onWebhook) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, "Webhook handler not implemented");
          break;
        }
        try {
          await plugin.definition.onWebhook(params as unknown as import("./define-plugin.js").PluginWebhookInput);
          sendSuccess(id, { status: "ok" });
        } catch (err) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "executeTool": {
        const toolParams = (params ?? {}) as { toolName: string; params: unknown; runContext: import("./types.js").ToolRunContext };
        const toolEntry = toolHandlers.get(toolParams.toolName);
        if (!toolEntry) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, `No tool registered: ${toolParams.toolName}`);
          break;
        }
        try {
          const result = await toolEntry.fn(toolParams.params, toolParams.runContext);
          sendSuccess(id, result);
        } catch (err) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "getData": {
        const dataParams = (params ?? {}) as { key: string; params: Record<string, unknown> };
        const dataFn = dataHandlers.get(dataParams.key);
        if (!dataFn) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, `No data handler registered: ${dataParams.key}`);
          break;
        }
        try {
          const result = await dataFn(dataParams.params);
          sendSuccess(id, result);
        } catch (err) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "performAction": {
        const actionParams = (params ?? {}) as { key: string; params: Record<string, unknown>; context: import("./protocol.js").PluginPerformActionContext };
        const actionFn = actionHandlers.get(actionParams.key);
        if (!actionFn) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, `No action handler registered: ${actionParams.key}`);
          break;
        }
        try {
          const result = await actionFn(actionParams.params, actionParams.context);
          sendSuccess(id, result);
        } catch (err) {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "apiRequest": {
        if (plugin.definition.onApiRequest) {
          try {
            const result = await plugin.definition.onApiRequest(params as unknown as import("./define-plugin.js").PluginApiRequestInput);
            sendSuccess(id, result);
          } catch (err) {
            sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, err instanceof Error ? err.message : String(err));
          }
        } else {
          sendError(id, PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, "API request handler not implemented");
        }
        break;
      }

      default: {
        sendError(id, -32601, `Method not found: ${method}`);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Notification dispatch (worker→host events)
  // -----------------------------------------------------------------------

  function handleNotification(notification: JsonRpcNotification): void {
    const { method, params } = notification;
    switch (method) {
      case "event": {
        const event = params as unknown as import("./types.js").PluginEvent;
        for (const reg of eventHandlers) {
          if (reg.eventName === event.eventType) {
            reg.handler(event).catch((err) => {
              context?.logger.error(`Event handler error: ${err instanceof Error ? err.message : String(err)}`);
            });
          }
        }
        break;
      }
      case "log": {
        const logParams = params as { level: string; message: string; meta?: Record<string, unknown> };
        const level = logParams?.level ?? "info";
        const msg = logParams?.message ?? "";
        const meta = logParams?.meta;
        context?.logger[level]?.(msg, meta);
        break;
      }
      // Unknown notifications are ignored
    }
  }

  // -----------------------------------------------------------------------
  // Stream reader
  // -----------------------------------------------------------------------

  (stdinStream as any).on("data", (chunk: Buffer) => {
    if (!running) return;
    const text = chunk.toString();
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed) as JsonRpcMessage;
        if (isJsonRpcRequest(msg)) {
          // Enforce timeout
          const timeout = rpcTimeoutMs;
          const reqId = msg.id;
          const timedOut = setTimeout(() => {
            const pending = pendingCalls.get(reqId);
            if (pending) {
              pending.reject(new Error(`RPC timeout after ${timeout}ms`));
              pendingCalls.delete(reqId);
            }
          }, timeout) as any;
          pendingCalls.set(reqId, {
            resolve: () => {},
            reject: () => {},
            timer: timedOut,
          });
          handleRequest(msg).finally(() => {
            clearTimeout(timedOut);
            pendingCalls.delete(reqId);
          });
        } else if (isJsonRpcNotification(msg)) {
          handleNotification(msg);
        }
        // Responses from worker are ignored here (host manages them)
      } catch {
        // Drop malformed JSON
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    get isRunning() { return running; },
    stop() {
      running = false;
      (stdinStream as any).removeAllListeners("data");
      // Clear any pending calls
      for (const [id, pending] of pendingCalls) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Host stopped"));
        pendingCalls.delete(id);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// runWorker — thin bootstrap for process entrypoints
// ---------------------------------------------------------------------------

/**
 * Start the worker when this module is the process entrypoint.
 *
 * Call this at the bottom of your worker file so that when the host runs
 * `node dist/worker.js`, the RPC host starts and the process stays alive.
 * When the module is imported (e.g. for re-exports or tests), nothing runs.
 *
 * @example
 * ```ts
 * const plugin = definePlugin({ ... });
 * export default plugin;
 * runWorker(plugin, import.meta.url);
 * ```
 */
export function runWorker(
  plugin: PaperclipPlugin,
  moduleUrl: string,
  options?: RunWorkerOptions,
): WorkerRpcHost | void {
  if (options?.stdin != null && options?.stdout != null) {
    return startWorkerRpcHost({ plugin, stdin: options.stdin, stdout: options.stdout });
  }
  const entry = process.argv[1];
  if (typeof entry !== "string") return;
  // In Node, check if this file is the entrypoint
  if (entry === moduleUrl || entry === require.main?.filename) {
    return startWorkerRpcHost({ plugin });
  }
}
