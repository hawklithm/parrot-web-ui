/**
 * `parrot-plugin-sdk/ui` — UI primitives bridge for plugin workers.
 *
 * This module provides the UI surface that plugins can render inside the
 * Parrot web interface. It mirrors Paperclip's `@paperclipai/plugin-sdk/ui`
 * package, which exports React components for plugin-managed UI slots.
 *
 * Paperclip source: packages/plugins/sdk/src/ui/
 * Parrot alignment: L476 — Plugin SDK / Type declarations / UI Primitives
 *
 * NOTE: This is a stub bridge. The underlying UI rendering is handled by the
 * host (parrot-web-ui) via the PluginContext bridge. Plugin workers receive
 * UI slot declarations from their manifest and the host mounts them at runtime.
 *
 * @see PLUGIN_SPEC.md §14 — SDK Surface
 * @see PLUGIN_SPEC.md §21 — UI Slots
 */

// ---------------------------------------------------------------------------
// UI Slot Types — mirror Paperclip PluginUiSlotType
// ---------------------------------------------------------------------------

/**
 * The kind of UI slot a plugin can declare in its manifest.
 * Mirrors Paperclip `PluginUiSlotType`.
 */
export type PluginUiSlotType =
  | "issue_sidebar"
  | "issue_detail"
  | "issue_list_header"
  | "issue_list_row"
  | "dashboard_widget"
  | "project_sidebar"
  | "agent_detail"
  | "routine_detail"
  | "skill_detail"
  | "tool_detail"
  | "approval_detail"
  | "plan_review"
  | "run_ledger"
  | "settings_panel"
  | "custom";

/**
 * The entity type that a UI slot is bound to.
 * Mirrors Paperclip `PluginUiSlotEntityType`.
 */
export type PluginUiSlotEntityType =
  | "issue"
  | "project"
  | "agent"
  | "routine"
  | "skill"
  | "tool"
  | "approval"
  | "run"
  | "company"
  | "instance";

// ---------------------------------------------------------------------------
// UI Component Props
// ---------------------------------------------------------------------------

/**
 * Props passed to a plugin UI slot component by the host.
 * Mirrors Paperclip's plugin UI slot render context.
 */
export interface PluginUiSlotProps<TEntity extends Record<string, unknown> = Record<string, unknown>> {
  /** The entity the slot is bound to (e.g. an Issue, Project, etc.). */
  entity: TEntity;
  /** The company this entity belongs to. */
  companyId: string;
  /** Optional extra data passed by the host. */
  context?: Record<string, unknown>;
}

/**
 * A plugin UI slot is a React component mounted by the host into a predefined
 * location in the Parrot web UI. The plugin declares the slot in its manifest,
 * and the host resolves it at runtime via the PluginContext bridge.
 */
export type PluginUiSlot<TEntity extends Record<string, unknown> = Record<string, unknown>> = (
  props: PluginUiSlotProps<TEntity>
) => React.ReactNode;

// ---------------------------------------------------------------------------
// Host Bridge — communicates UI slot declarations between worker and host
// ---------------------------------------------------------------------------

/**
 * UI slot declaration as registered by a plugin manifest.
 * Mirrors Paperclip's PluginUiSlotDeclaration.
 */
export interface PluginUiSlotDeclaration {
  /** Unique identifier for this slot within the plugin. */
  slotId: string;
  /** The kind of slot (see PluginUiSlotType). */
  slotType: PluginUiSlotType;
  /** The entity type this slot binds to. */
  entityType: PluginUiSlotEntityType;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Optional icon name (lucide icon). */
  icon?: string;
  /** Whether this slot is visible by default. */
  defaultVisible?: boolean;
}

/**
 * Registry of all UI slot declarations for a plugin.
 * Populated by the plugin manifest and consumed by the host.
 */
export interface PluginUiRegistry {
  /** All declared UI slots. */
  slots: PluginUiSlotDeclaration[];
  /** Component map: slotId → React component. */
  components: Map<string, PluginUiSlot>;
}

// ---------------------------------------------------------------------------
// UI Bridge API — what the plugin worker imports from this module
// ---------------------------------------------------------------------------

/**
 * Register a UI slot component with the host.
 *
 * Called by the plugin during setup to inform the host about UI slots
 * it wants to render. The host will mount the component in the appropriate
 * location based on the slot declaration.
 *
 * @param declaration — slot declaration from plugin manifest
 * @param component — React component to render in the slot
 *
 * @example
 * ```ts
 * import { registerUiSlot } from "parrot-plugin-sdk/ui";
 *
 * registerUiSlot(
 *   { slotId: "my-sidebar", slotType: "issue_sidebar", entityType: "issue", label: "My Sidebar" },
 *   MySidebarComponent
 * );
 * ```
 */
export function registerUiSlot(
  declaration: PluginUiSlotDeclaration,
  component: PluginUiSlot,
): void {
  // Stub: UI slot registration is handled by the host bridge at runtime.
  // The worker-side stub records the declaration for host resolution.
  const registry = (globalThis as Record<string, unknown>)["__parrot_plugin_ui_registry"] as
    | PluginUiRegistry
    | undefined;
  if (registry) {
    registry.slots.push(declaration);
    registry.components.set(declaration.slotId, component);
  }
}

/**
 * Get the current UI registry. Used by the host to inspect registered slots.
 */
export function getUiRegistry(): PluginUiRegistry {
  return (
    (globalThis as Record<string, unknown>)["__parrot_plugin_ui_registry"] as PluginUiRegistry
  ) ?? { slots: [], components: new Map() };
}

/**
 * Initialize the UI registry for a plugin worker.
 * Called once per worker process.
 */
export function initUiRegistry(): PluginUiRegistry {
  const registry: PluginUiRegistry = { slots: [], components: new Map() };
  (globalThis as Record<string, unknown>)["__parrot_plugin_ui_registry"] = registry;
  return registry;
}

// ---------------------------------------------------------------------------
// Pre-built UI Primitives
// ---------------------------------------------------------------------------

/**
 * A simple card component for plugin UI slots.
 * Mirrors Paperclip's card primitive for plugin surfaces.
 */
export function PluginCard(props: {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}): React.ReactNode {
  // Stub: In production, this would render a real React component.
  // The host bridge handles actual rendering.
  const { title, children, className } = props;
  return (
    <div className={`plugin-card ${className ?? ""}`}>
      {title && <div className="plugin-card-title">{title}</div>}
      <div className="plugin-card-body">{children}</div>
    </div>
  );
}

/**
 * A simple button component for plugin UI slots.
 */
export function PluginButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
}): React.ReactNode {
  const { children, onClick, variant = "primary", disabled, className } = props;
  const variantClass = {
    primary: "plugin-btn-primary",
    secondary: "plugin-btn-secondary",
    danger: "plugin-btn-danger",
  }[variant];
  return (
    <button
      className={`plugin-btn ${variantClass} ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled ?? false}
    >
      {children}
    </button>
  );
}

/**
 * A simple input component for plugin UI slots.
 */
export function PluginInput(props: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}): React.ReactNode {
  const { value, onChange, placeholder, type = "text", className } = props;
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      className={`plugin-input ${className ?? ""}`}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type { PluginUiSlotType, PluginUiSlotEntityType, PluginUiSlotProps, PluginUiSlot, PluginUiSlotDeclaration, PluginUiRegistry };
