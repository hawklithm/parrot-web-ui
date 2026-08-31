import type {
  SecretProposalView,
  ApproveSecretProposalInput,
  RejectSecretProposalInput,
} from "../lib/paperclip-shared/src";
import { api } from "./client";

export interface ListProposalsParams {
  status?: "pending" | "approved" | "rejected" | "expired" | "withdrawn";
  kind?: "secret" | "binding";
}

export const secretProposalsApi = {
  /** Board: list all proposals for a company */
  list: (companyId: string, params?: ListProposalsParams) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.kind) qs.set("kind", params.kind);
    const query = qs.toString();
    const path = `/api/companies/${companyId}/secret-proposals${query ? `?${query}` : ""}`;
    return api.get<SecretProposalView[]>(path);
  },

  /** Board: approve a proposal */
  approve: (companyId: string, proposalId: string, input: ApproveSecretProposalInput) =>
    api.post<SecretProposalView>(
      `/api/companies/${companyId}/secret-proposals/${proposalId}/approve`,
      input,
    ),

  /** Board: reject a proposal */
  reject: (companyId: string, proposalId: string, input: RejectSecretProposalInput) =>
    api.post<SecretProposalView>(
      `/api/companies/${companyId}/secret-proposals/${proposalId}/reject`,
      input,
    ),

  /** Board: get a single proposal */
  get: (companyId: string, proposalId: string) =>
    api.get<SecretProposalView>(
      `/api/companies/${companyId}/secret-proposals/${proposalId}`,
    ),
};
