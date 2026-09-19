import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Inbox, X } from "lucide-react";
import { attentionApi } from "@/api/attention";
import { decisionsApi, type Decision } from "@/api/decisions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";

function labelFor(item: Record<string, unknown>) {
  const subject = item.subject as Record<string, unknown> | undefined;
  return String(subject?.title ?? item.title ?? item.whyNow ?? item.sourceKind ?? "Needs attention");
}

export function WhatNeedsMe() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  useEffect(() => setBreadcrumbs([{ label: "What needs me" }]), [setBreadcrumbs]);

  const attention = useQuery({
    queryKey: queryKeys.attention(selectedCompanyId ?? "none"),
    queryFn: () => attentionApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const decisions = useQuery({
    queryKey: queryKeys.decisions.list(selectedCompanyId ?? "none", { status: "open" }),
    queryFn: () => decisionsApi.list(selectedCompanyId!, { status: "open" }),
    enabled: !!selectedCompanyId,
  });
  const dismiss = useMutation({
    mutationFn: (id: string) => decisionsApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attention(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: ["decisions", selectedCompanyId] });
    },
  });
  const decide = useMutation({
    mutationFn: ({ id, optionId }: { id: string; optionId: string }) =>
      decisionsApi.decide(id, { optionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attention(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: ["decisions", selectedCompanyId] });
    },
  });

  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  const items = attention.data?.items ?? [];
  const openDecisions = decisions.data ?? [];

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">What needs me</h1>
        <p className="mt-1 text-sm text-muted-foreground">One ranked queue for decisions, approvals, failures, and questions.</p>
      </div>
      {attention.isLoading || decisions.isLoading ? <p className="text-sm text-muted-foreground">Loading attention…</p> : null}
      {attention.error || decisions.error ? <p className="text-sm text-destructive">Unable to load attention right now.</p> : null}
      {items.length === 0 && openDecisions.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center"><Inbox className="h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">Nothing needs your attention.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={String(item.id ?? `${item.sourceKind}-${index}`)}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2"><Badge variant="outline">{String(item.sourceKind ?? "attention")}</Badge><span className="font-medium">{labelFor(item)}</span></div>
                  <p className="text-sm text-muted-foreground">{String(item.whyNow ?? item.detail ?? "Review this item")}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => item.id && dismiss.mutate(String(item.id))} aria-label="Dismiss"><X className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
          {openDecisions.map((decision: Decision) => {
            const options = Array.isArray(decision.options) ? decision.options as Array<Record<string, unknown>> : [];
            return <Card key={decision.id}>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="h-4 w-4 text-amber-500" />{decision.title ?? "Decision"}</CardTitle></CardHeader>
              <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{decision.body}</p><div className="flex flex-wrap gap-2">{options.map((option) => <Button key={String(option.id)} size="sm" onClick={() => decide.mutate({ id: decision.id, optionId: String(option.id) })}><Check className="h-3.5 w-3.5" />{String(option.label ?? option.title ?? option.id)}</Button>)}<Button size="sm" variant="ghost" onClick={() => dismiss.mutate(decision.id)}>Dismiss</Button></div></CardContent>
            </Card>;
          })}
        </div>
      )}
    </div>
  );
}

export function DecisionQueuePage() {
  return <WhatNeedsMe />;
}
