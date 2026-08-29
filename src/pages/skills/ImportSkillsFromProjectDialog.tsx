import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { useState } from "react";
import { companySkillsApi } from "../../api/companySkills";
import type { CompanySkillProjectScanResult } from "../../lib/paperclip-shared/src";

interface Props {
  companyId: string;
  onClose: () => void;
}

export function ImportSkillsFromProjectDialog({ companyId, onClose }: Props) {
  const [scanResult, setScanResult] = useState<CompanySkillProjectScanResult | null>(null);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: () => companySkillsApi.scanProjects(companyId, {}),
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ["company-skills", companyId] });
    },
  });

  const importMutation = useMutation({
    mutationFn: () => companySkillsApi.scanProjects(companyId, {}),
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ["company-skills", companyId] });
    },
  });

  const handleScan = () => {
    scanMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-auto max-w-2xl rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Import Skills from Projects</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {!scanResult && !scanMutation.isPending && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Search className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Scan your project workspaces for skill files that can be imported.
            </p>
            <button
              onClick={handleScan}
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Scan projects
            </button>
          </div>
        )}

        {scanMutation.isPending && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Scanning project workspaces…</p>
          </div>
        )}

        {scanMutation.isError && (
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to scan projects: {scanMutation.error?.message}
            </p>
            <button
              onClick={handleScan}
              className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1 text-sm text-primary-foreground"
            >
              Retry
            </button>
          </div>
        )}

        {scanResult && (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{scanResult.scannedProjects}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{scanResult.scannedWorkspaces}</div>
                <div className="text-xs text-muted-foreground">Workspaces</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{scanResult.discovered}</div>
                <div className="text-xs text-muted-foreground">Discovered</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{scanResult.imported.length}</div>
                <div className="text-xs text-muted-foreground">Imported</div>
              </div>
            </div>

            {/* Conflicts */}
            {scanResult.conflicts.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-amber-600">
                  Conflicts ({scanResult.conflicts.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {scanResult.conflicts.map((c, i) => (
                    <div
                      key={i}
                      className="rounded border border-amber-200 bg-amber-50 p-2 text-xs"
                    >
                      <span className="font-medium">{c.slug}</span> — {c.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped */}
            {scanResult.skipped.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Skipped ({scanResult.skipped.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {scanResult.skipped.map((s, i) => (
                    <div key={i} className="rounded border p-2 text-xs text-muted-foreground">
                      <span className="font-medium">{s.projectName}</span> — {s.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Imported */}
            {scanResult.imported.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Imported ({scanResult.imported.length})
                </h3>
                <div className="flex flex-col gap-1">
                  {scanResult.imported.map((skill) => (
                    <div
                      key={skill.id}
                      className="rounded border p-2 text-sm"
                    >
                      {skill.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {scanResult.warnings.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-amber-600">
                  Warnings ({scanResult.warnings.length})
                </h3>
                <ul className="list-inside list-disc text-xs text-muted-foreground">
                  {scanResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t pt-4">
              <button
                onClick={handleScan}
                disabled={scanMutation.isPending}
                className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className="h-3 w-3" />
                Re-scan
              </button>
              <button
                onClick={onClose}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
