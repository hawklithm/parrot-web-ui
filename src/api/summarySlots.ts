import { api } from "./client";

export interface SummarySlotSelector {
  companyId: string;
  scopeKind: string;
  scopeId?: string | null;
  slotKey: string;
}
function path(selector: SummarySlotSelector, suffix = "") {
  const query = selector.scopeId ? `?scopeId=${encodeURIComponent(selector.scopeId)}` : "";
  return `/companies/${selector.companyId}/summary-slots/${selector.scopeKind}/${encodeURIComponent(selector.slotKey)}${suffix}${query}`;
}
export const summarySlotsApi = {
  get: (selector: SummarySlotSelector) => api.get<Record<string, unknown>>(path(selector)),
  revisions: (selector: SummarySlotSelector) =>
    api.get<Record<string, unknown>[]>(path(selector, "/revisions")),
  generate: (selector: SummarySlotSelector) =>
    api.post<Record<string, unknown>>(path(selector, "/generate"), { scopeId: selector.scopeId ?? null }),
};
