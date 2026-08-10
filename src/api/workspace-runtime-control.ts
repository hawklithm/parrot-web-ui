import type { WorkspaceRuntimeControlTarget } from "../lib/paperclip-shared/src";

export function sanitizeWorkspaceRuntimeControlTarget(
  target: WorkspaceRuntimeControlTarget = {},
): WorkspaceRuntimeControlTarget {
  return {
    workspaceCommandId: target.workspaceCommandId ?? null,
    runtimeServiceId: target.runtimeServiceId ?? null,
    serviceIndex: target.serviceIndex ?? null,
  };
}
