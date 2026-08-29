import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import type {
  SecretProposalView,
  ApproveSecretProposalInput,
  RejectSecretProposalInput,
} from "../../lib/paperclip-tools-shared";
import { secretProposalsApi } from "../../api/secretProposals";

interface Props {
  companyId: string;
}

type ProposalFilter = "pending" | "approved" | "rejected" | "expired" | "withdrawn" | "all";

const statusIcon: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  expired: XCircle,
  withdrawn: XCircle,
};

const statusLabel: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

export function SecretProposalsTab({ companyId }: Props) {
  const [filter, setFilter] = useState<ProposalFilter>("pending");
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading, isError, error } = useQuery({
    queryKey: ["secret-proposals", companyId, filter],
    queryFn: () =>
      secretProposalsApi.list(companyId, {
        status: filter === "all" ? undefined : filter,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      proposalId,
      input,
    }: {
      proposalId: string;
      input: ApproveSecretProposalInput;
    }) => secretProposalsApi.approve(companyId, proposalId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["secret-proposals", companyId] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      proposalId,
      input,
    }: {
      proposalId: string;
      input: RejectSecretProposalInput;
    }) => secretProposalsApi.reject(companyId, proposalId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["secret-proposals", companyId] }),
  });

  const mutationError = approveMutation.error ?? rejectMutation.error;
  const loadError = isError
    ? error instanceof Error ? error.message : "Unable to load proposals."
    : null;
  const actionError = mutationError
    ? mutationError instanceof Error ? mutationError.message : "Proposal action failed."
    : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Status filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(["pending", "approved", "rejected", "expired", "withdrawn", "all"] satisfies ProposalFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

        {loadError || actionError ? (
          <div className="flex items-start gap-2 border border-destructive/40 p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{loadError ?? actionError}</span>
          </div>
        ) : null}

        {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        ) : proposals.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {filter === "pending"
            ? "No pending proposals."
            : "No proposals found."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((proposal) => {
            const Icon = statusIcon[proposal.status] || Clock;
            return (
              <div
                key={proposal.id}
                className="rounded-lg border p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`mt-0.5 h-5 w-5 ${
                        proposal.status === "approved"
                          ? "text-green-500"
                          : proposal.status === "rejected"
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {proposal.proposedName ?? proposal.secretName ?? "Unnamed"}
                        </span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {proposal.kind}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {statusLabel[proposal.status] ?? proposal.status}
                        {proposal.justification && (
                          <span className="ml-2 text-xs">— {proposal.justification}</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Proposed by {proposal.proposedBy.name}</span>
                        {proposal.originIssue && (
                          <>
                            <span>for</span>
                            <a
                              href={`/company/issues/${proposal.originIssue.id}`}
                              className="inline-flex items-center gap-0.5 text-primary hover:underline"
                            >
                              {proposal.originIssue.key}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                      {proposal.target && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Target: {proposal.target.name}
                          {proposal.configPath && (
                            <span className="ml-1">→ {proposal.configPath}</span>
                          )}
                        </div>
                      )}
                      {proposal.status === "pending" && proposal.viewerCanApprove && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            disabled={approveMutation.isPending}
                            onClick={() =>
                              approveMutation.mutate({
                                proposalId: proposal.id,
                                input: proposal.kind === "binding" && proposal.secretProposalId
                                  ? { cascade: true }
                                  : {},
                              })
                            }
                            className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-xs text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-3 w-3" />
                            )}
                            Approve
                          </button>
                          <button
                            disabled={rejectMutation.isPending}
                            onClick={() => {
                              const reason = prompt("Reason for rejection:");
                              if (reason !== null) {
                                rejectMutation.mutate({
                                  proposalId: proposal.id,
                                  input: { reason: reason || "No reason given" },
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {rejectMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ThumbsDown className="h-3 w-3" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                      {proposal.status === "pending" && !proposal.viewerCanApprove && proposal.approveBlockReason && (
                        <div className="mt-2 text-xs text-amber-600">
                          {proposal.approveBlockReason}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
