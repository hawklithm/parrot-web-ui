import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Search, X } from "lucide-react";
import type {
  CompanySkillProjectScanCandidate,
  CompanySkillProjectScanResult,
} from "../../lib/paperclip-tools-shared";
import { companySkillsApi } from "../../api/companySkills";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

interface Props {
  companyId: string;
  open: boolean;
  onClose: () => void;
}

function candidateKey(candidate: Pick<CompanySkillProjectScanCandidate, "workspaceId" | "relativePath">) {
  return `${candidate.workspaceId}:${candidate.relativePath}`;
}

function candidateLabel(candidate: CompanySkillProjectScanCandidate) {
  return `${candidate.projectName} / ${candidate.workspaceName} / ${candidate.relativePath}`;
}

export function ImportSkillsFromProjectDialog({ companyId, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [scanResult, setScanResult] = useState<CompanySkillProjectScanResult | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setScanResult(null);
      setSelectedKeys(new Set());
    }
  }, [open]);

  const scanMutation = useMutation({
    mutationFn: () => companySkillsApi.scanProjects(companyId, { mode: "preview" }),
    onSuccess: (result) => {
      setScanResult(result);
      setSelectedKeys(new Set(
        result.candidates
          .filter((candidate) => candidate.status === "new")
          .map(candidateKey),
      ));
    },
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!scanResult) throw new Error("Scan project workspaces before importing skills.");
      const selection = scanResult.candidates
        .filter((candidate) => selectedKeys.has(candidateKey(candidate)))
        .map(({ workspaceId, relativePath, slug }) => ({
          workspaceId,
          path: relativePath,
          slug,
        }));
      return companySkillsApi.scanProjects(companyId, { mode: "import", selection });
    },
    onSuccess: async (result) => {
      setScanResult(result);
      setSelectedKeys(new Set());
      await queryClient.invalidateQueries({ queryKey: ["company-skills", companyId] });
    },
  });

  const selectableCandidates = useMemo(
    () => scanResult?.candidates.filter((candidate) => candidate.status === "new") ?? [],
    [scanResult],
  );
  const selectedCount = selectableCandidates.filter((candidate) => selectedKeys.has(candidateKey(candidate))).length;
  const isPending = scanMutation.isPending || importMutation.isPending;

  function toggleCandidate(candidate: CompanySkillProjectScanCandidate) {
    const key = candidateKey(candidate);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelectedKeys(new Set(selectableCandidates.map(candidateKey)));
  }

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  const error = scanMutation.error ?? importMutation.error;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-h-[min(720px,90vh)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import skills from project workspaces</DialogTitle>
          <DialogDescription>
            Scan local project workspaces, review discovered skill files, then import only the selected entries.
          </DialogDescription>
        </DialogHeader>

        {!scanResult && !scanMutation.isPending && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <Search className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="max-w-md text-sm text-muted-foreground">
              Project skills are previewed first so existing skills and conflicts stay visible before any files are imported.
            </p>
            <Button onClick={() => scanMutation.mutate()}>
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              Scan workspaces
            </Button>
          </div>
        )}

        {scanMutation.isPending && (
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Scanning project workspaces...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/40 p-4 text-sm" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-destructive">Project skill scan failed</p>
              <p className="mt-1 break-words text-muted-foreground">
                {error instanceof Error ? error.message : "Unable to scan project workspaces."}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => scanMutation.mutate()} title="Retry scan" aria-label="Retry scan">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {scanResult && !scanMutation.isPending && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
              <Summary label="Projects" value={scanResult.scannedProjects} />
              <Summary label="Workspaces" value={scanResult.scannedWorkspaces} />
              <Summary label="Found" value={scanResult.discovered} />
              <Summary label="Selected" value={selectedCount} />
              <Summary label="Imported" value={scanResult.imported.length + scanResult.updated.length} />
            </div>

            {selectableCandidates.length > 0 ? (
              <section aria-labelledby="project-skill-candidates-heading" className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="project-skill-candidates-heading" className="text-sm font-medium">
                    New skill files ({selectableCandidates.length})
                  </h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
                  </div>
                </div>
                <div className="divide-y rounded-md border">
                  {selectableCandidates.map((candidate) => {
                    const key = candidateKey(candidate);
                    const checked = selectedKeys.has(key);
                    return (
                      <label key={key} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/40">
                        <Checkbox checked={checked} onCheckedChange={() => toggleCandidate(candidate)} aria-label={`Select ${candidate.name}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{candidate.name}</span>
                          <span className="mt-0.5 block break-words text-xs text-muted-foreground">{candidateLabel(candidate)}</span>
                          {candidate.description ? <span className="mt-1 block text-xs text-muted-foreground">{candidate.description}</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {scanResult.conflicts.length > 0 ? (
              <ResultSection title={`Conflicts (${scanResult.conflicts.length})`} tone="warning">
                {scanResult.conflicts.map((conflict) => (
                  <div key={`${conflict.workspaceId}:${conflict.path}:${conflict.slug}`} className="text-xs">
                    <span className="font-medium">{conflict.slug}</span>
                    <span className="text-muted-foreground">: {conflict.reason}</span>
                  </div>
                ))}
              </ResultSection>
            ) : null}

            {scanResult.skipped.length > 0 ? (
              <ResultSection title={`Skipped (${scanResult.skipped.length})`}>
                {scanResult.skipped.map((skipped, index) => (
                  <div key={`${skipped.workspaceId ?? "workspace"}:${skipped.path ?? index}`} className="text-xs text-muted-foreground">
                    {skipped.projectName ?? "Unknown project"}: {skipped.reason}
                  </div>
                ))}
              </ResultSection>
            ) : null}

            {(scanResult.imported.length > 0 || scanResult.updated.length > 0) ? (
              <ResultSection title="Imported" tone="success">
                {[...scanResult.imported, ...scanResult.updated].map((skill) => (
                  <div key={skill.id} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{skill.name}</span>
                  </div>
                ))}
              </ResultSection>
            ) : null}

            {scanResult.warnings.length > 0 ? (
              <ResultSection title={`Warnings (${scanResult.warnings.length})`} tone="warning">
                {scanResult.warnings.map((warning) => <div key={warning} className="text-xs">{warning}</div>)}
              </ResultSection>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {scanResult ? (
            <Button variant="outline" onClick={() => scanMutation.mutate()} disabled={isPending}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Re-scan
            </Button>
          ) : null}
          <Button onClick={() => importMutation.mutate()} disabled={!scanResult || selectedCount === 0 || isPending}>
            {importMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Import selected ({selectedCount})
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-2 py-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ResultSection({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "success" | "warning";
  children: ReactNode;
}) {
  const toneClass = tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
    : tone === "warning"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
      : "border-border";
  return (
    <section className={`space-y-2 rounded-md border p-3 ${toneClass}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
