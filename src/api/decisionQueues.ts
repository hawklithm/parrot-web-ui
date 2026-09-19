import { api } from "./client";

export type AttentionSourceKind =
  | "approval"
  | "decision"
  | "issue_thread_interaction"
  | "join_request"
  | "recovery_action"
  | "productivity_review"
  | "blocker_attention"
  | "review"
  | "failed_run"
  | "budget_alert"
  | "agent_error_alert"
  | string;

export interface DecisionQueue {
  id: string;
  companyId: string;
  key: string;
  title: string;
  description?: string | null;
  itemCount?: number;
  retentionDays?: number | null;
  seedRules?: Array<Record<string, unknown>>;
  seedRulesEnabled?: boolean;
  [key: string]: unknown;
}

export interface DecisionQueueItem {
  id: string;
  sourceKind: AttentionSourceKind;
  sourceId: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface DecisionTriage {
  sourceKind: AttentionSourceKind;
  sourceId: string;
  decideBy?: string | null;
  snoozedUntil?: string | null;
  [key: string]: unknown;
}

export const decisionQueuesApi = {
  seedRules: (companyId: string) => api.get<Record<string, unknown>[]>(`/companies/${companyId}/decision-queue-seed-rules`),
  list: (companyId: string) => api.get<DecisionQueue[]>(`/companies/${companyId}/decision-queues`),
  create: (companyId: string, input: Record<string, unknown>) => api.post<DecisionQueue>(`/companies/${companyId}/decision-queues`, input),
  update: (companyId: string, key: string, input: Record<string, unknown>) => api.patch<DecisionQueue>(`/companies/${companyId}/decision-queues/${encodeURIComponent(key)}`, input),
  listItems: (companyId: string, key: string) => api.get<DecisionQueueItem[]>(`/companies/${companyId}/decision-queues/${encodeURIComponent(key)}/items`),
  addItem: (companyId: string, key: string, sourceKind: AttentionSourceKind, sourceId: string) => api.post<DecisionQueueItem>(`/companies/${companyId}/decision-queues/${encodeURIComponent(key)}/items`, { sourceKind, sourceId }),
  removeItem: (companyId: string, key: string, sourceKind: AttentionSourceKind, sourceId: string, reason?: string) => api.deleteWithBody<DecisionQueueItem>(`/companies/${companyId}/decision-queues/${encodeURIComponent(key)}/items/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}`, reason ? { reason } : {}),
  getTriage: (companyId: string, sourceKind: AttentionSourceKind, sourceId: string) => api.get<DecisionTriage | null>(`/companies/${companyId}/decision-triage/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}`),
  updateTriage: (companyId: string, sourceKind: AttentionSourceKind, sourceId: string, input: Record<string, unknown>) => api.put<DecisionTriage>(`/companies/${companyId}/decision-triage/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}`, input),
  setKeep: (companyId: string, sourceKind: AttentionSourceKind, sourceId: string, keep: boolean) => api.patch<Record<string, unknown>>(`/companies/${companyId}/decision-retention/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}`, { keep }),
  archive: (companyId: string, sourceKind: AttentionSourceKind, sourceId: string) => api.post<Record<string, unknown>>(`/companies/${companyId}/decision-retention/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}/archive`, {}),
  revive: (companyId: string, sourceKind: AttentionSourceKind, sourceId: string) => api.post<Record<string, unknown>>(`/companies/${companyId}/decision-retention/${encodeURIComponent(sourceKind)}/${encodeURIComponent(sourceId)}/revive`, {}),
  proposeArchive: (companyId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/companies/${companyId}/decision-archive-proposals`, input),
};
