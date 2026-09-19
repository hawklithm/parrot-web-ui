import { api } from "./client";

export interface AuditActionFilters {
  actorScope?: "agents" | "all";
  agentId?: string;
  responsibleUserId?: string;
  runId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  from?: string;
  to?: string;
  actorType?: string;
  cursor?: string;
  limit?: number;
}

export interface AuditActionsResponse {
  items: Array<Record<string, unknown>>;
  nextCursor?: string | null;
  accessTier?: "basic" | "full" | string;
}

export const auditApi = {
  listAgentActions: (companyId: string, filters: AuditActionFilters = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
    const query = params.toString();
    return api.get<AuditActionsResponse>(
      `/companies/${companyId}/audit/agent-actions${query ? `?${query}` : ""}`,
    );
  },
  exportAgentActionsCsv: (companyId: string) =>
    `/api/companies/${encodeURIComponent(companyId)}/audit/agent-actions.csv`,
};
