import { api } from "./client";

export interface StatusCard {
  id: string;
  companyId: string;
  title?: string | null;
  interestPrompt?: string;
  queries?: unknown;
  state?: string;
  summaryMarkdown?: string | null;
  updatedAt?: string;
  [key: string]: unknown;
}
export const statusCardsApi = {
  list: (companyId: string, archived = false) =>
    api.get<StatusCard[]>(`/companies/${companyId}/status-cards?archived=${archived}`),
  get: (id: string) => api.get<StatusCard>(`/status-cards/${id}`),
  create: (companyId: string, input: Record<string, unknown>) =>
    api.post<StatusCard>(`/companies/${companyId}/status-cards`, input),
  patch: (id: string, input: Record<string, unknown>) =>
    api.patch<StatusCard>(`/status-cards/${id}`, input),
  remove: (id: string) => api.delete<void>(`/status-cards/${id}`),
  updates: (id: string) => api.get<Record<string, unknown>[]>(`/status-cards/${id}/updates`),
  summaryRevisions: (id: string) =>
    api.get<Record<string, unknown>[]>(`/status-cards/${id}/summary-revisions`),
  refresh: (id: string) => api.post<StatusCard>(`/status-cards/${id}/refresh`, {}),
  recompile: (id: string) => api.post<StatusCard>(`/status-cards/${id}/recompile`, {}),
  dryRun: (id: string) => api.get<Record<string, unknown>>(`/status-cards/${id}/dry-run`),
};
