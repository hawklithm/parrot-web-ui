import { api } from "./client";

const base = (companyId: string) => `/companies/${companyId}/smoke-lab`;
export const smokeLabApi = {
  listServices: (companyId: string) => api.get<Record<string, unknown>[]>(`${base(companyId)}/services`),
  startServices: (companyId: string) => api.post<Record<string, unknown>>(`${base(companyId)}/services/start`, {}),
  stopServices: (companyId: string) => api.post<Record<string, unknown>>(`${base(companyId)}/services/stop`, {}),
  installFixtures: (companyId: string) => api.post<Record<string, unknown>>(`${base(companyId)}/install-fixtures`, {}),
  reset: (companyId: string) => api.post<Record<string, unknown>>(`${base(companyId)}/reset`, {}),
  listRuns: (companyId: string) => api.get<Record<string, unknown>[]>(`${base(companyId)}/runs`),
  getRun: (companyId: string, runId: string) => api.get<Record<string, unknown>>(`${base(companyId)}/runs/${runId}`),
  createRun: (companyId: string, input: Record<string, unknown> = {}) =>
    api.post<Record<string, unknown>>(`${base(companyId)}/runs`, input),
  updateRun: (companyId: string, runId: string, input: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`${base(companyId)}/runs/${runId}`, input),
  recordStep: (companyId: string, runId: string, input: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`${base(companyId)}/runs/${runId}/steps`, input),
};
