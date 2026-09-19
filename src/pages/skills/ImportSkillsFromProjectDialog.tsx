import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, FolderSearch, Loader2 } from "lucide-react";
import { companySkillsApi, type ProjectSkillCandidate } from "../../api/companySkills";
import { queryKeys } from "../../lib/queryKeys";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export function ImportSkillsFromProjectDialog({ companyId, open, onOpenChange }: { companyId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [candidates, setCandidates] = useState<ProjectSkillCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const browse = useMutation({
    mutationFn: () => companySkillsApi.browseProject(companyId),
    onSuccess: (result) => {
      setCandidates(result.candidates.filter((candidate) => candidate.status === "new" || candidate.status === "conflict"));
      setSelected(new Set(result.candidates.filter((candidate) => candidate.status === "new").map((candidate) => `${candidate.workspaceId}:${candidate.relativePath}`)));
    },
  });
  const importSelection = useMutation({
    mutationFn: () => companySkillsApi.importProjectSelection(companyId, candidates.filter((candidate) => selected.has(`${candidate.workspaceId}:${candidate.relativePath}`)).map((candidate) => ({ workspaceId: candidate.workspaceId, path: candidate.relativePath, slug: candidate.slug }))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companySkills.list(companyId) });
      onOpenChange(false);
    },
  });
  useEffect(() => { if (open && !candidates.length && !browse.isPending) browse.mutate(); }, [open]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Import skills from project workspaces</DialogTitle><DialogDescription>Preview reads the configured workspace paths. Select candidates and import them atomically; existing skills are not silently duplicated.</DialogDescription></DialogHeader><div className="max-h-[55vh] space-y-2 overflow-y-auto">{browse.isPending ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Scanning workspaces…</div> : candidates.length ? candidates.map((candidate) => { const key = `${candidate.workspaceId}:${candidate.relativePath}`; const checked = selected.has(key); return <label key={key} className="flex cursor-pointer items-start gap-3 rounded border p-3 hover:bg-muted/40"><input type="checkbox" checked={checked} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; })} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-medium">{candidate.name}<span className="text-xs font-normal text-muted-foreground">{candidate.status}</span></span><span className="mt-1 block truncate text-xs text-muted-foreground">{candidate.projectName} / {candidate.workspaceName} · {candidate.relativePath}</span>{candidate.reason ? <span className="mt-1 block text-xs text-amber-600">{candidate.reason}</span> : null}</span>{checked ? <Check className="h-4 w-4 text-primary" /> : null}</label>; }) : <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground"><FolderSearch className="h-7 w-7" />No project skill candidates found.</div>}</div><DialogFooter><Button variant="outline" onClick={() => browse.mutate()} disabled={browse.isPending}>Rescan</Button><Button onClick={() => importSelection.mutate()} disabled={!selected.size || importSelection.isPending}>{importSelection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Import {selected.size || ""}</Button></DialogFooter></DialogContent></Dialog>;
}
