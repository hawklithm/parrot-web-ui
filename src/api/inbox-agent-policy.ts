import { api } from "./client";

export interface InboxAgentPolicy {
  companyId: string;
  enabled?: boolean;
  policy?: string;
  [key: string]: unknown;
}

export const inboxAgentPolicyApi = {
  get: (companyId: string) => api.get<InboxAgentPolicy>(`/companies/${companyId}/users/me/inbox-agent-policy`),
  update: (companyId: string, input: Record<string, unknown>) =>
    api.put<InboxAgentPolicy>(`/companies/${companyId}/users/me/inbox-agent-policy`, input),
};
