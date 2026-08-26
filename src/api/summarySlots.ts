import { api } from "./client";

export type SummarySlotScopeKind = "company" | "project" | "issue" | "agent";
export type SummarySlotSelector = { companyId: string; scopeKind: SummarySlotScopeKind; slotKey: string; scopeId?: string | null };

function path(selector: SummarySlotSelector, suffix = "") {
  const params = selector.scopeId ? `?scopeId=${encodeURIComponent(selector.scopeId)}` : "";
  return `/companies/${selector.companyId}/summary-slots/${selector.scopeKind}/${encodeURIComponent(selector.slotKey)}${suffix}${params}`;
}

export const summarySlotsApi = {
  get: (selector: SummarySlotSelector) => api.get<Record<string, unknown>>(path(selector)),
  revisions: (selector: SummarySlotSelector) => api.get<unknown[]>(path(selector, "/revisions")),
  generate: (selector: SummarySlotSelector) => api.post<Record<string, unknown>>(path(selector, "/generate"), { scopeId: selector.scopeId ?? null }),
};
