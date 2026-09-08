/**
 * `definePlugin` — the top-level helper for authoring a Parrot plugin.
 *
 * Plugin authors call `definePlugin()` and export the result as the default
 * export from their worker entrypoint. The host imports the worker module,
 * calls `setup()` with a `PluginContext`, and from that point the plugin
 * responds to events, jobs, webhooks, and UI requests through the context.
 *
 * @see PLUGIN_SPEC.md §14.1 — Example SDK Shape
 */

import type { PluginContext } from "./types.js";

// ---------------------------------------------------------------------------
// Health check result
// ---------------------------------------------------------------------------

export interface PluginHealthDiagnostics {
  status: "ok" | "degraded" | "error";
  message?: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Config validation result
// ---------------------------------------------------------------------------

export interface PluginConfigValidationResult {
  ok: boolean;
  warnings?: string[];
  errors?: string[];
}

// ---------------------------------------------------------------------------
// Webhook handler input
// ---------------------------------------------------------------------------

export interface PluginWebhookInput {
  endpointKey: string;
  headers: Record<string, string | string[]>;
  rawBody: string;
  parsedBody?: unknown;
  requestId: string;
}

export interface PluginApiRequestInput {
  routeKey: string;
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: unknown;
  actor: {
    actorType: "user" | "agent";
    actorId: string;
    agentId?: string | null;
    userId?: string | null;
    runId?: string | null;
  };
  companyId: string;
  headers: Record<string, string>;
}

export interface PluginApiResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

// ---------------------------------------------------------------------------
// Config change context
// ---------------------------------------------------------------------------

export interface PluginConfigChangeContext {
  companyId: string | null;
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export interface PluginDefinition {
  /**
   * Called once when the plugin worker starts up, after `initialize` completes.
   * This is where the plugin registers all its handlers: event subscriptions,
   * job handlers, data/action handlers, and tool registrations.
   */
  setup(ctx: PluginContext): Promise<void>;

  /**
   * Called when the host wants to know if the plugin is healthy.
   * If not implemented, the host infers health from worker process liveness.
   */
  onHealth?(): Promise<PluginHealthDiagnostics>;

  /**
   * When true, this plugin's worker correctly serves configuration from more
   * than one company inside a single worker process.
   */
  multiCompanyConfig?: boolean;

  /**
   * Called when the operator updates this plugin's company-scoped configuration
   * at runtime, without restarting the worker.
   */
  onConfigChanged?(
    newConfig: Record<string, unknown>,
    context?: PluginConfigChangeContext,
  ): Promise<void>;

  /**
   * Called when the host is about to shut down the plugin worker.
   */
  onShutdown?(): Promise<void>;

  /**
   * Called to validate the current plugin configuration.
   */
  onValidateConfig?(config: Record<string, unknown>): Promise<PluginConfigValidationResult>;

  /**
   * Called to handle an inbound webhook delivery.
   */
  onWebhook?(input: PluginWebhookInput): Promise<void>;

  /**
   * Called for manifest-declared scoped JSON API routes.
   */
  onApiRequest?(input: PluginApiRequestInput): Promise<PluginApiResponse>;
}

// ---------------------------------------------------------------------------
// PaperclipPlugin — the sealed object returned by definePlugin()
// ---------------------------------------------------------------------------

export interface PaperclipPlugin {
  readonly definition: PluginDefinition;
}

// ---------------------------------------------------------------------------
// definePlugin — top-level factory
// ---------------------------------------------------------------------------

/**
 * Define a Parrot plugin.
 *
 * Call this function in your worker entrypoint and export the result as the
 * default export. The host will import the module and call lifecycle methods
 * on the returned object.
 *
 * @param definition - Plugin lifecycle handlers
 * @returns A sealed `PaperclipPlugin` object for the host to consume
 *
 * @example
 * ```ts
 * import { definePlugin } from "parrot-plugin-sdk";
 *
 * export default definePlugin({
 *   async setup(ctx) {
 *     ctx.logger.info("Plugin started");
 *     ctx.events.on("issue.created", async (event) => {
 *       // handle event
 *     });
 *   },
 *
 *   async onHealth() {
 *     return { status: "ok" };
 *   },
 * });
 * ```
 */
export function definePlugin(definition: PluginDefinition): PaperclipPlugin {
  return Object.freeze({ definition });
}
