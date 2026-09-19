import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, BarChart3, Eye, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { statusCardsApi, type StatusCard } from "../api/statusCards";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";

export function StatusCards() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<StatusCard | null>(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  useEffect(() => setBreadcrumbs([{ label: "Status cards" }]), [setBreadcrumbs]);
  const cards = useQuery({ queryKey: ["status-cards", selectedCompanyId ?? "none", archived], queryFn: () => statusCardsApi.list(selectedCompanyId!, archived), enabled: Boolean(selectedCompanyId) });
  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ["status-cards", selectedCompanyId] }); };
  const create = useMutation({ mutationFn: () => statusCardsApi.create(selectedCompanyId!, { title: title.trim() || "New status card", interestPrompt: prompt.trim() || "Show me what changed recently" }), onSuccess: () => { setTitle(""); setPrompt(""); invalidate(); } });
  const refresh = useMutation({ mutationFn: (id: string) => statusCardsApi.refresh(id), onSuccess: invalidate });
  const recompile = useMutation({ mutationFn: (id: string) => statusCardsApi.recompile(id), onSuccess: invalidate });
  const archive = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => statusCardsApi.patch(id, { archived: value }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => statusCardsApi.remove(id), onSuccess: () => { setSelected(null); invalidate(); } });
  const save = useMutation({ mutationFn: () => statusCardsApi.patch(selected!.id, { interestPrompt: draftPrompt }), onSuccess: (card) => { setSelected(card); invalidate(); } });
  const detail = useQuery({ queryKey: ["status-card-detail", selected?.id], queryFn: () => Promise.all([statusCardsApi.get(selected!.id), statusCardsApi.updates(selected!.id), statusCardsApi.summaryRevisions(selected!.id), statusCardsApi.dryRun(selected!.id)]), enabled: Boolean(selected?.id) });
  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  const rows = cards.data ?? [];
  return <div className="max-w-6xl space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">Status cards</h1><p className="mt-1 text-sm text-muted-foreground">Persistent query and summary cards with refresh, recompile, revision and archive controls.</p></div><Button variant={archived ? "secondary" : "outline"} size="sm" onClick={() => setArchived((value) => !value)}>{archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{archived ? "Archived" : "Active"}</Button></div><Card><CardContent className="grid gap-2 py-4 md:grid-cols-[1fr_2fr_auto]"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Card title" /><Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What should this card summarize?" onKeyDown={(event) => { if (event.key === "Enter") create.mutate(); }} /><Button onClick={() => create.mutate()} disabled={create.isPending}><Plus className="h-4 w-4" />Create</Button></CardContent></Card>{cards.isPending ? <p className="text-sm text-muted-foreground">Loading cards…</p> : null}<div className="grid gap-3 md:grid-cols-2">{rows.map((card) => <Card key={card.id} className={selected?.id === card.id ? "ring-1 ring-primary" : ""}><CardHeader><CardTitle className="flex items-start justify-between gap-3 text-base"><button className="flex items-center gap-2 text-left hover:underline" onClick={() => { setSelected(card); setDraftPrompt(card.interestPrompt ?? ""); }}><BarChart3 className="h-4 w-4" />{card.title || "Untitled card"}</button><div className="flex gap-1"><Button variant="ghost" size="icon-sm" onClick={() => refresh.mutate(card.id)} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => archive.mutate({ id: card.id, value: !archived })} aria-label="Archive"><Archive className="h-4 w-4" /></Button></div></CardTitle></CardHeader><CardContent><p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">{card.summaryMarkdown || card.interestPrompt || "No summary generated yet."}</p><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{card.state ?? "active"}</span><Button size="sm" variant="outline" onClick={() => { setSelected(card); setDraftPrompt(card.interestPrompt ?? ""); }}><Eye className="h-3.5 w-3.5" />Details</Button></div></CardContent></Card>)}</div>{selected ? <Card><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>{selected.title ?? "Status card detail"}</span><Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)} aria-label="Close">×</Button></CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 md:grid-cols-[1fr_auto]"><Textarea value={draftPrompt} onChange={(event) => setDraftPrompt(event.target.value)} placeholder="Interest prompt" /><div className="flex flex-col gap-2"><Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}><Save className="h-3.5 w-3.5" />Save & recompile</Button><Button size="sm" variant="outline" onClick={() => recompile.mutate(selected.id)}><RefreshCw className="h-3.5 w-3.5" />Recompile</Button><Button size="sm" variant="outline" onClick={() => remove.mutate(selected.id)}><Trash2 className="h-3.5 w-3.5" />Delete</Button></div></div>{detail.data ? <div className="grid gap-3 text-xs md:grid-cols-3"><DetailStat label="Updates" value={detail.data[1].length} /><DetailStat label="Summary revisions" value={detail.data[2].length} /><div><div className="text-muted-foreground">Dry run</div><pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2">{JSON.stringify(detail.data[3], null, 2)}</pre></div></div> : <p className="text-sm text-muted-foreground">Loading card history…</p>}</CardContent></Card> : null}</div>;
}

function DetailStat({ label, value }: { label: string; value: number }) { return <div className="rounded border p-3"><div className="text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>; }
