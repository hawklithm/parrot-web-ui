import { api } from "./client";

export type Decision = {
  id: string;
  title: string;
  body: string;
  status: "open" | "decided" | "expired" | "cancelled";
  options?: Array<{ id: string; label?: string; title?: string; description?: string }>;
  originIssueId?: string;
  expiresAt?: string;
  [key: string]: unknown;
};

export const decisionsApi = {
  list: (companyId: string, status: Decision["status"] = "open") =>
    api.get<Decision[]>(`/companies/${companyId}/decisions?status=${status}`),
  get: (id: string) => api.get<Decision>(`/decisions/${id}`),
  decide: (id: string, optionId: string, inputValues?: Record<string, string>) =>
    api.post<Decision>(`/decisions/${id}/decide`, { optionId, inputValues }),
  dismiss: (id: string, reason?: string) =>
    api.post<Decision>(`/decisions/${id}/dismiss`, reason ? { reason } : {}),
  cancel: (id: string) => api.post<Decision>(`/decisions/${id}/cancel`, {}),
};
