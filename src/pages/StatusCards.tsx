import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Play, Plus, RefreshCw } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { statusCardsApi, type StatusCard } from "../api/statusCards";
import { Button } from "../components/ui/button";

export function StatusCards() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const queryKey = ["status-cards", selectedCompanyId];
  const cards = useQuery({
    queryKey,
    queryFn: () => statusCardsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const create = useMutation({
    mutationFn: () => statusCardsApi.create(selectedCompanyId!, { title: title || undefined, interestPrompt: prompt }),
    onSuccess: () => { setTitle(""); setPrompt(""); setShowCreate(false); invalidate(); },
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "refresh" | "recompile" | "archive" }) =>
      kind === "refresh" ? statusCardsApi.refresh(id) : kind === "recompile" ? statusCardsApi.recompile(id) : statusCardsApi.update(id, { archived: true }),
    onSuccess: invalidate,
  });

  if (!selectedCompanyId) return <div className="p-6 text-muted-foreground">Select a company to view status cards.</div>;
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Status cards</h1><p className="mt-1 text-sm text-muted-foreground">Persistent summaries of the work your company cares about.</p></div>
        <Button onClick={() => setShowCreate((value) => !value)}><Plus className="mr-1 h-4 w-4" />New card</Button>
      </header>
      {showCreate && <section className="space-y-3 rounded-lg border border-border p-4">
        <input className="w-full rounded border border-border bg-background px-3 py-2" placeholder="Card title (optional)" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className="min-h-24 w-full rounded border border-border bg-background px-3 py-2" placeholder="What should this card watch?" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        <Button disabled={!prompt.trim() || create.isPending} onClick={() => create.mutate()}>{create.isPending ? "Creating…" : "Create status card"}</Button>
      </section>}
      {cards.isLoading ? <div className="text-muted-foreground">Loading status cards…</div> : cards.isError ? <div className="text-destructive">Unable to load status cards.</div> : cards.data?.length ? <div className="grid gap-4 md:grid-cols-2">{cards.data.map((card) => <StatusCardTile key={card.id} card={card} pending={action.isPending} onAction={(kind) => action.mutate({ id: card.id, kind })} />)}</div> : <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">No status cards yet.</div>}
    </main>
  );
}

function StatusCardTile({ card, pending, onAction }: { card: StatusCard; pending: boolean; onAction: (kind: "refresh" | "recompile" | "archive") => void }) {
  return <article className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{card.title || "Untitled status card"}</h2><div className="mt-1 text-xs text-muted-foreground">{card.state} · updated {new Date(card.updatedAt).toLocaleString()}</div></div><span className="rounded bg-muted px-2 py-1 text-xs">{card.pendingChangeCount} changes</span></div>
    {card.summaryMarkdown ? <div className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">{card.summaryMarkdown}</div> : <p className="mt-4 text-sm text-muted-foreground">Summary is being generated.</p>}
    <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("refresh")}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("recompile")}><Play className="mr-1 h-4 w-4" />Recompile</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => onAction("archive")}><Archive className="mr-1 h-4 w-4" />Archive</Button></div>
  </article>;
}
