import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Check, Clock3, Plus, Settings2 } from "lucide-react";
import { useNavigate, useParams } from "@/lib/router";
import { attentionApi } from "../api/attention";
import { decisionQueuesApi, type DecisionQueue } from "../api/decisionQueues";
import { decisionsApi } from "../api/decisions";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";

function itemText(item: Record<string, unknown>) {
  const subject = item.subject as Record<string, unknown> | undefined;
  return String(subject?.title ?? item.title ?? item.whyNow ?? item.sourceKind ?? "Attention item");
}

function itemId(item: Record<string, unknown>) {
  return typeof item.id === "string" ? item.id : null;
}

function source(item: Record<string, unknown>) {
  return {
    kind: String(item.sourceKind ?? "decision"),
    id: String(item.sourceId ?? item.id ?? ""),
  };
}

export function DecisionQueuePage() {
  const { selectedCompanyId } = useCompany();
  const { queueKey } = useParams<{ queueKey?: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [newQueueKey, setNewQueueKey] = useState("");
  const [newQueueTitle, setNewQueueTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [decideBy, setDecideBy] = useState<Record<string, string>>({});

  const queuesQuery = useQuery({
    queryKey: queryKeys.decisionQueues.list(selectedCompanyId ?? "none"),
    queryFn: () => decisionQueuesApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const queues = queuesQuery.data ?? [];
  const activeKey = queueKey ?? queues[0]?.key ?? "all";
  const activeQueue = queues.find((queue) => queue.key === activeKey);
  const feedQuery = useQuery({
    queryKey: ["attention", selectedCompanyId, "queue", activeKey],
    queryFn: () => attentionApi.list(selectedCompanyId!, { queue: activeKey === "all" ? undefined : activeKey, sort: "decide", limit: 100 }),
    enabled: Boolean(selectedCompanyId),
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Decisions", href: "/decisions" }, { label: activeQueue?.title ?? (activeKey === "all" ? "All queues" : activeKey) }]);
  }, [activeKey, activeQueue?.title, setBreadcrumbs]);

  const items = useMemo(() => (feedQuery.data?.items ?? []).filter((item) => !(item.dismissal as Record<string, unknown> | undefined)?.isActive), [feedQuery.data?.items]);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["attention", selectedCompanyId] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.decisionQueues.list(selectedCompanyId!) });
  };
  const dismiss = useMutation({
    mutationFn: (item: Record<string, unknown>) => decisionsApi.dismiss(itemId(item) ?? String(item.sourceId)),
    onSuccess: invalidate,
  });
  const retention = useMutation({
    mutationFn: ({ item, action }: { item: Record<string, unknown>; action: "archive" | "revive" }) => {
      const current = source(item);
      return action === "archive"
        ? decisionQueuesApi.archive(selectedCompanyId!, current.kind, current.id)
        : decisionQueuesApi.revive(selectedCompanyId!, current.kind, current.id);
    },
    onSuccess: invalidate,
  });
  const triage = useMutation({
    mutationFn: (item: Record<string, unknown>) => {
      const current = source(item);
      return decisionQueuesApi.updateTriage(selectedCompanyId!, current.kind, current.id, { decideBy: decideBy[`${current.kind}:${current.id}`] || null });
    },
    onSuccess: invalidate,
  });
  const create = useMutation({
    mutationFn: () => decisionQueuesApi.create(selectedCompanyId!, { key: newQueueKey.trim(), title: newQueueTitle.trim() || newQueueKey.trim() }),
    onSuccess: (queue: DecisionQueue) => {
      setNewQueueKey("");
      setNewQueueTitle("");
      setShowCreate(false);
      invalidate();
      navigate(`/decisions/queues/${queue.key}`);
    },
  });

  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Decision queue</h1><p className="mt-1 text-sm text-muted-foreground">Durable queues, triage dates, snoozing and retention are backed by the same attention feed as Paperclip.</p></div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate((current) => !current)}><Plus className="h-3.5 w-3.5" />New queue</Button>
      </div>
      {showCreate ? <Card><CardContent className="flex flex-wrap gap-2 py-3"><Input className="w-40" placeholder="key (e.g. research)" value={newQueueKey} onChange={(event) => setNewQueueKey(event.target.value)} /><Input className="min-w-48 flex-1" placeholder="Queue title" value={newQueueTitle} onChange={(event) => setNewQueueTitle(event.target.value)} /><Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newQueueKey.trim()}>Create</Button></CardContent></Card> : null}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit"><CardHeader className="pb-2"><CardTitle className="text-sm">Queues</CardTitle></CardHeader><CardContent className="space-y-1"><Button variant={activeKey === "all" ? "secondary" : "ghost"} className="w-full justify-between" size="sm" onClick={() => navigate("/decisions")}><span>All attention</span><Badge variant="outline">{activeKey === "all" ? items.length : ""}</Badge></Button>{queues.map((queue) => <Button key={queue.key} variant={activeKey === queue.key ? "secondary" : "ghost"} className="w-full justify-between" size="sm" onClick={() => navigate(`/decisions/queues/${queue.key}`)}><span className="truncate">{queue.title}</span><Badge variant="outline">{queue.itemCount ?? 0}</Badge></Button>)}</CardContent></Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold">{activeQueue?.title ?? (activeKey === "all" ? "All attention" : activeKey)}</h2>{activeQueue?.description ? <p className="text-xs text-muted-foreground">{activeQueue.description}</p> : null}</div>{activeQueue ? <Button variant="ghost" size="icon-sm" aria-label="Toggle queue seeding" onClick={() => decisionQueuesApi.update(selectedCompanyId, activeQueue.key, { seedRulesEnabled: !activeQueue.seedRulesEnabled }).then(invalidate)}><Settings2 className="h-4 w-4" /></Button> : null}</div>
          {feedQuery.isPending ? <p className="text-sm text-muted-foreground">Loading attention…</p> : null}
          {feedQuery.error ? <p className="text-sm text-destructive">{(feedQuery.error as Error).message}</p> : null}
          {!feedQuery.isPending && items.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No items in this queue.</CardContent></Card> : null}
          {items.map((item, index) => {
            const current = source(item);
            const key = `${current.kind}:${current.id}`;
            return <Card key={String(item.id ?? key ?? index)}><CardContent className="space-y-3 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{current.kind}</Badge><span className="font-medium">{itemText(item)}</span></div><p className="mt-1 text-sm text-muted-foreground">{String(item.whyNow ?? item.detail ?? "Review this attention item")}</p></div><span className="shrink-0 text-xs text-muted-foreground">{String(item.ageLabel ?? item.createdAt ?? "")}</span></div><div className="flex flex-wrap items-center gap-2 border-t pt-3"><Button variant="outline" size="sm" onClick={() => dismiss.mutate(item)} disabled={dismiss.isPending}><Check className="h-3.5 w-3.5" />Dismiss</Button><Button variant="ghost" size="sm" onClick={() => retention.mutate({ item, action: "archive" })} disabled={retention.isPending}><Archive className="h-3.5 w-3.5" />Archive</Button><div className="ml-auto flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" /><Input className="h-8 w-32 text-xs" type="date" value={decideBy[key] ?? ""} onChange={(event) => setDecideBy((currentValues) => ({ ...currentValues, [key]: event.target.value }))} /><Button size="sm" variant="secondary" onClick={() => triage.mutate(item)} disabled={triage.isPending}>Set due</Button></div></div></CardContent></Card>;
          })}
        </div>
      </div>
    </div>
  );
}
