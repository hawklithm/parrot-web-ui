import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Loader2, X } from "lucide-react";
import { secretsApi, type SecretProposalView } from "../../api/secrets";
import { queryKeys } from "../../lib/queryKeys";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export function ProposalsTab({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const proposalsQuery = useQuery({
    queryKey: queryKeys.secrets.proposals(companyId),
    queryFn: () => secretsApi.listProposals(companyId),
  });
  const approve = useMutation({
    mutationFn: (proposal: SecretProposalView) => secretsApi.approveProposal(companyId, proposal.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["secret-proposals", companyId] }),
  });
  const reject = useMutation({
    mutationFn: (proposal: SecretProposalView) => secretsApi.rejectProposal(companyId, proposal.id, { reason: rejectReason[proposal.id]?.trim() || "Rejected by board" }),
    onSuccess: (_result, proposal) => {
      setRejectReason((current) => ({ ...current, [proposal.id]: "" }));
      queryClient.invalidateQueries({ queryKey: ["secret-proposals", companyId] });
    },
  });

  const proposals = proposalsQuery.data ?? [];
  return (
    <div className="space-y-3 overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold">Agent secret proposals</h2>
        <p className="mt-1 text-xs text-muted-foreground">Review agent-requested secrets and bindings before they become available.</p>
      </div>
      {proposalsQuery.isPending ? <p className="text-sm text-muted-foreground">Loading proposals…</p> : null}
      {proposalsQuery.error ? <p className="text-sm text-destructive">{(proposalsQuery.error as Error).message}</p> : null}
      {!proposalsQuery.isPending && proposals.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center"><KeyRound className="h-7 w-7 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No pending secret proposals.</p></CardContent></Card>
      ) : null}
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between gap-3 text-sm"><span>{proposal.proposedName ?? proposal.target?.name ?? proposal.kind}</span><span className="rounded border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">{proposal.kind}</span></CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>Requested by: <span className="text-foreground">{proposal.proposedBy?.name ?? proposal.proposedBy?.id ?? "agent"}</span></div>
              <div>Status: <span className="text-foreground">{proposal.status}</span></div>
              {proposal.originIssue ? <div>Origin: <span className="text-foreground">{proposal.originIssue.identifier ?? proposal.originIssue.title ?? proposal.originIssue.id}</span></div> : null}
              {proposal.rationale ? <div className="sm:col-span-2">Reason: <span className="text-foreground">{proposal.rationale}</span></div> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => approve.mutate(proposal)} disabled={approve.isPending || reject.isPending}><Check className="h-3.5 w-3.5" />Approve</Button>
              <Input className="h-8 min-w-48 flex-1 text-xs" placeholder="Rejection reason" value={rejectReason[proposal.id] ?? ""} onChange={(event) => setRejectReason((current) => ({ ...current, [proposal.id]: event.target.value }))} />
              <Button variant="outline" size="sm" onClick={() => reject.mutate(proposal)} disabled={approve.isPending || reject.isPending}>{reject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
