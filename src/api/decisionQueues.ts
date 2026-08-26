import { api } from "./client";

export type DecisionQueue = {
  key: string;
  title: string;
  description?: string | null;
  retentionDays?: number | null;
  seedRulesEnabled?: boolean;
  [key: string]: unknown;
};

export const decisionQueuesApi = {
  list: (companyId: string) => api.get<DecisionQueue[]>(`/companies/${companyId}/decision-queues`),
  create: (companyId: string, body: { key: string; title: string; description?: string; retentionDays?: number }) => api.post<DecisionQueue>(`/companies/${companyId}/decision-queues`, body),
  update: (companyId: string, key: string, body: Partial<Pick<DecisionQueue, "title" | "description" | "retentionDays" | "seedRulesEnabled">>) => api.patch<DecisionQueue>(`/companies/${companyId}/decision-queues/${encodeURIComponent(key)}`, body),
};
