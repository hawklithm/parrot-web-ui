import { api } from "./client";

export type StatusCard = {
  id: string;
  companyId: string;
  title: string | null;
  interestPrompt: string;
  queries: unknown;
  refreshPolicy: unknown;
  state: string;
  pendingChangeCount: number;
  archivedAt: string | null;
  summaryMarkdown: string | null;
  summaryCompiledAt: string | null;
  updatedAt: string;
  [key: string]: unknown;
};

export type StatusCardInput = {
  title?: string;
  titlePinned?: boolean;
  interestPrompt?: string;
  queries?: unknown;
  refreshPolicy?: unknown;
};

export const statusCardsApi = {
  list: (companyId: string, archived = false) =>
    api.get<StatusCard[]>(`/companies/${companyId}/status-cards?archived=${archived}`),
  create: (companyId: string, body: StatusCardInput) =>
    api.post<StatusCard>(`/companies/${companyId}/status-cards`, body),
  update: (id: string, body: StatusCardInput & { archived?: boolean }) =>
    api.patch<StatusCard>(`/status-cards/${id}`, body),
  refresh: (id: string) => api.post<StatusCard>(`/status-cards/${id}/refresh`, {}),
  recompile: (id: string) => api.post<StatusCard>(`/status-cards/${id}/recompile`, {}),
  revisions: (id: string) => api.get<Array<{ id: string; markdown: string; createdAt: string }>>(`/status-cards/${id}/summary-revisions`),
};
