import { api } from "./client";

export type DecisionStatus = "open" | "decided" | "dismissed" | "cancelled" | string;

export interface Decision {
  id: string;
  companyId?: string;
  title?: string;
  body?: string;
  status: DecisionStatus;
  ruleKey?: string | null;
  originAgentId?: string | null;
  originIssueId?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface DecisionInput {
  title: string;
  body?: string;
  ruleKey?: string;
  originAgentId?: string | null;
  originIssueId?: string | null;
  expiresAt?: string | null;
  [key: string]: unknown;
}

export interface DecisionListFilter {
  status?: DecisionStatus;
  ruleKey?: string;
  limit?: number;
  offset?: number;
}

function queryString(filter: DecisionListFilter) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const decisionsApi = {
  list: (companyId: string, filter: DecisionListFilter = {}) =>
    api.get<Decision[]>(`/companies/${companyId}/decisions${queryString(filter)}`),
  get: (id: string) => api.get<Decision>(`/decisions/${id}`),
  create: (companyId: string, input: DecisionInput) =>
    api.post<Decision>(`/companies/${companyId}/decisions`, input),
  decide: (id: string, input: Record<string, unknown>) =>
    api.post<Decision>(`/decisions/${id}/decide`, input),
  dismiss: (id: string, reason?: string) =>
    api.post<Decision>(`/decisions/${id}/dismiss`, reason ? { reason } : {}),
  cancel: (id: string) => api.post<Decision>(`/decisions/${id}/cancel`, {}),
  stats: (companyId: string) =>
    api.get<Record<string, unknown>>(`/companies/${companyId}/decisions/stats`),
};
