import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { Link, useParams } from "@/lib/router";
import { attentionApi, type AttentionItem } from "../api/attention";
import { decisionsApi } from "../api/decisions";
import { useCompany } from "../context/CompanyContext";
import { Button } from "../components/ui/button";

function itemTitle(item: AttentionItem) {
  return item.subject?.title || item.title || `${item.sourceKind.replaceAll("_", " ")} requires attention`;
}

export function WhatNeedsMe() {
  const { selectedCompanyId } = useCompany();
  const { key: queueKey } = useParams<{ key?: string }>();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const queryKey = ["attention", selectedCompanyId];
  const feed = useQuery({
    queryKey,
    queryFn: () => attentionApi.list(selectedCompanyId!, { all: true, sort: "decide", queue: queueKey }),
    enabled: Boolean(selectedCompanyId),
  });
  const dismiss = useMutation({
    mutationFn: (id: string) => decisionsApi.dismiss(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
  const items = useMemo(() => feed.data?.items ?? [], [feed.data]);

  if (!selectedCompanyId) return <div className="p-6 text-muted-foreground">Select a company to view decisions.</div>;
  if (feed.isLoading) return <div className="p-6 text-muted-foreground">Loading decisions…</div>;
  if (feed.isError) return <div className="p-6 text-destructive">Unable to load decisions.</div>;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">What needs me</h1>
        <p className="mt-1 text-sm text-muted-foreground">Requests, decisions, and agent work waiting for your input.</p>
      </header>
      {items.length === 0 ? (
        <section className="rounded-lg border border-border p-8 text-center text-muted-foreground">Nothing needs your attention.</section>
      ) : (
        <section className="space-y-3">
          {items.map((item) => {
            const href = typeof item.href === "string" ? item.href : item.subject?.href;
            const isDecision = item.sourceKind === "decision";
            return (
              <article key={item.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.sourceKind.replaceAll("_", " ")}</div>
                    <h2 className="mt-1 font-medium">{href ? <Link className="hover:underline" to={href}>{itemTitle(item)}</Link> : itemTitle(item)}</h2>
                    {item.summary && <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {href && <Button asChild size="sm" variant="outline"><Link to={href}><ExternalLink className="mr-1 h-4 w-4" />Open</Link></Button>}
                    {isDecision && <Button size="sm" variant="ghost" disabled={busyId === item.id} onClick={async () => { setBusyId(item.id); try { await dismiss.mutateAsync(item.id); } finally { setBusyId(null); } }}><X className="mr-1 h-4 w-4" />Dismiss</Button>}
                  </div>
                </div>
                {isDecision && Array.isArray(item.options) && item.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.options.map((option: any) => <DecisionButton key={option.id} decisionId={item.subject?.id ?? item.id} option={option} onDone={() => queryClient.invalidateQueries({ queryKey })} />)}
                  </div>
                )}
                {busyId === item.id && <Loader2 className="mt-3 h-4 w-4 animate-spin text-muted-foreground" />}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function DecisionButton({ decisionId, option, onDone }: { decisionId: string; option: any; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  return <Button size="sm" disabled={pending} onClick={async () => { setPending(true); try { await decisionsApi.decide(decisionId, option.id); onDone(); } finally { setPending(false); } }}><Check className="mr-1 h-4 w-4" />{option.label ?? option.title ?? option.id}</Button>;
}
