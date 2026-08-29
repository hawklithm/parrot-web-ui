import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Eye, EyeOff, Loader2, Play, Plus, RefreshCw, Settings, X } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { statusCardsApi, type StatusCard } from "../api/statusCards";
import { Button } from "../components/ui/button";

type ActionKind = "refresh" | "recompile" | "archive" | "unarchive";

export function StatusCards() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedCard, setSelectedCard] = useState<StatusCard | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const queryKey = ["status-cards", selectedCompanyId, showArchived];

  const cards = useQuery({
    queryKey,
    queryFn: () => statusCardsApi.list(selectedCompanyId!, showArchived),
    enabled: Boolean(selectedCompanyId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: () =>
      statusCardsApi.create(selectedCompanyId!, {
        title: title || undefined,
        interestPrompt: prompt,
      }),
    onSuccess: () => {
      setTitle("");
      setPrompt("");
      setShowCreate(false);
      invalidate();
    },
  });

  const action = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: ActionKind }) => {
      if (kind === "refresh") return statusCardsApi.refresh(id);
      if (kind === "recompile") return statusCardsApi.recompile(id);
      return statusCardsApi.update(id, { archived: kind === "archive" });
    },
    onSuccess: () => {
      invalidate();
      setSelectedCard(null);
    },
  });

  const updateSettings = useMutation({
    mutationFn: ({ id, title: nextTitle, interestPrompt }: { id: string; title?: string; interestPrompt?: string }) =>
      statusCardsApi.update(id, { title: nextTitle, interestPrompt }),
    onSuccess: invalidate,
  });

  if (!selectedCompanyId) {
    return <div className="p-6 text-muted-foreground">Select a company to view status cards.</div>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Status cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Persistent summaries of the work your company cares about.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((value) => !value)}>
            {showArchived ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button onClick={() => setShowCreate((value) => !value)}>
            <Plus className="mr-1 h-4 w-4" />
            New card
          </Button>
        </div>
      </header>

      {showCreate && (
        <CreateCardForm
          title={title}
          setTitle={setTitle}
          prompt={prompt}
          setPrompt={setPrompt}
          create={create}
        />
      )}

      {cards.isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading status cards…</span>
        </div>
      ) : cards.isError ? (
        <div className="rounded-lg border border-destructive/50 p-8 text-center">
          <p className="text-destructive">Unable to load status cards.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => cards.refetch()}>
            Retry
          </Button>
        </div>
      ) : cards.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.data.map((card) => (
            <StatusCardTile
              key={card.id}
              card={card}
              pending={action.isPending}
              onAction={(kind) => action.mutate({ id: card.id, kind })}
              onSelect={() => setSelectedCard(card)}
              onUpdate={(nextTitle, interestPrompt) =>
                updateSettings.mutate({ id: card.id, title: nextTitle, interestPrompt })
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          {showArchived ? "No archived status cards." : "No status cards yet. Create one to get started."}
        </div>
      )}

      {selectedCard && (
        <StatusCardDetailDrawer
          card={selectedCard}
          pending={action.isPending}
          onAction={(kind) => action.mutate({ id: selectedCard.id, kind })}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </main>
  );
}
type CreateCardFormProps = {
  title: string;
  setTitle: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  create: { isPending: boolean; mutate: () => void };
};

function CreateCardForm({ title, setTitle, prompt, setPrompt, create }: CreateCardFormProps) {
  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <input
        className="w-full rounded border border-border bg-background px-3 py-2"
        placeholder="Card title (optional)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        className="min-h-24 w-full rounded border border-border bg-background px-3 py-2"
        placeholder="What should this card watch?"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <Button disabled={!prompt.trim() || create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? "Creating..." : "Create status card"}
      </Button>
    </section>
  );
}

function StatusCardTile({
  card,
  pending,
  onAction,
  onSelect,
  onUpdate,
}: {
  card: StatusCard;
  pending: boolean;
  onAction: (kind: ActionKind) => void;
  onSelect: () => void;
  onUpdate: (title?: string, interestPrompt?: string) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title ?? "");
  const [editPrompt, setEditPrompt] = useState(card.interestPrompt);

  return (
    <article className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onSelect} className="flex-1 text-left">
          <h2 className="font-medium hover:text-primary">{card.title || "Untitled status card"}</h2>
          <div className="mt-1 text-xs text-muted-foreground">
            {card.state} · updated {new Date(card.updatedAt).toLocaleString()}
            {card.archivedAt && <span className="ml-2 text-amber-600">archived</span>}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <span className="rounded bg-muted px-2 py-1 text-xs">{card.pendingChangeCount} changes</span>
          <button
            aria-label="Edit status card settings"
            onClick={() => setShowSettings((value) => !value)}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {card.summaryMarkdown ? (
        <div className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">{card.summaryMarkdown}</div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Summary is being generated.</p>
      )}

      {showSettings && (
        <div className="mt-4 space-y-2 rounded border p-3">
          <input
            className="w-full rounded border px-2 py-1 text-sm"
            placeholder="Card title"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
          />
          <textarea
            className="min-h-16 w-full rounded border px-2 py-1 text-sm"
            placeholder="What should this card watch?"
            value={editPrompt}
            onChange={(event) => setEditPrompt(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onUpdate(editTitle || undefined, editPrompt || undefined);
                setShowSettings(false);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("refresh")}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("recompile")}>
          <Play className="mr-1 h-4 w-4" />
          Recompile
        </Button>
        {card.archivedAt ? (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => onAction("unarchive")}>
            <ArchiveRestore className="mr-1 h-4 w-4" />
            Restore
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => onAction("archive")}>
            <Archive className="mr-1 h-4 w-4" />
            Archive
          </Button>
        )}
      </div>
    </article>
  );
}

function StatusCardDetailDrawer({
  card,
  pending,
  onAction,
  onClose,
}: {
  card: StatusCard;
  pending: boolean;
  onAction: (kind: ActionKind) => void;
  onClose: () => void;
}) {
  const revisions = useQuery({
    queryKey: ["status-card-revisions", card.id],
    queryFn: () => statusCardsApi.revisions(card.id),
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title || "Status card"} details`}
        className="flex w-full max-w-lg flex-col gap-4 overflow-y-auto border-l bg-background p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{card.title || "Untitled"}</h2>
          <button aria-label="Close status card details" onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-1">{card.state}</span>
          <span className="rounded bg-muted px-2 py-1">{card.pendingChangeCount} pending changes</span>
          {card.summaryCompiledAt && (
            <span className="rounded bg-muted px-2 py-1">
              Last refreshed: {new Date(card.summaryCompiledAt).toLocaleString()}
            </span>
          )}
          {card.archivedAt && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Archived</span>}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-medium">Interest Prompt</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {card.interestPrompt || "No specific interest prompt."}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium">Summary</h3>
            {card.summaryMarkdown ? (
              <div className="whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">{card.summaryMarkdown}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Summary is being generated.</p>
            )}
          </div>
          {revisions.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading revision history...</div>
          ) : revisions.data?.length ? (
            <div>
              <h3 className="mb-1 text-sm font-medium">Revision History</h3>
              <div className="flex flex-col gap-1">
                {revisions.data.map((revision, index) => (
                  <div key={revision.id} className="rounded border p-2 text-xs">
                    <span className="font-medium">v{revisions.data!.length - index}</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(revision.createdAt).toLocaleString()}
                    </span>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{revision.markdown}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("refresh")}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("recompile")}>
            <Play className="mr-1 h-4 w-4" />
            Recompile
          </Button>
          {card.archivedAt ? (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => onAction("unarchive")}>
              <ArchiveRestore className="mr-1 h-4 w-4" />
              Restore
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => onAction("archive")}>
              <Archive className="mr-1 h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
