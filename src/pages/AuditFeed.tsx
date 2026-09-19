import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, History } from "lucide-react";
import { auditApi } from "@/api/audit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";

export function AuditFeed({ companyId, lockedAgentId, hideHeader = false }: { companyId?: string; lockedAgentId?: string; hideHeader?: boolean } = {}) {
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = companyId ?? selectedCompanyId;
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => setBreadcrumbs([{ label: "Audit feed" }]), [setBreadcrumbs]);
  const query = useQuery({ queryKey: queryKeys.audit(effectiveCompanyId ?? "none", { agentId: lockedAgentId ?? "" }), queryFn: () => auditApi.listAgentActions(effectiveCompanyId!, { actorScope: "all", agentId: lockedAgentId, limit: 100 }), enabled: !!effectiveCompanyId });
  if (!effectiveCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  const rows = query.data?.items ?? [];
  return <div className="max-w-5xl space-y-5">{!hideHeader ? <div className="flex items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">Audit feed</h1><p className="mt-1 text-sm text-muted-foreground">A company-scoped, cursor-ready record of agent actions.</p></div><a className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted" href={auditApi.exportAgentActionsCsv(effectiveCompanyId)} download><Download className="h-4 w-4" />Export CSV</a></div> : null}<Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" />{lockedAgentId ? "Agent actions" : "Recent actions"}</CardTitle></CardHeader><CardContent className="divide-y">{query.isLoading ? <p className="py-8 text-sm text-muted-foreground">Loading audit events…</p> : rows.length ? rows.map((row, index) => <div key={String(row.id ?? index)} className="flex items-center justify-between gap-3 py-3 text-sm"><div className="min-w-0"><div className="truncate font-medium">{String(row.action ?? row.entityType ?? "action")}</div><div className="truncate text-xs text-muted-foreground">{String(row.entityType ?? "")}{row.entityId ? ` · ${String(row.entityId)}` : ""}{row.occurredAt ? ` · ${String(row.occurredAt)}` : ""}</div></div><Badge variant="outline">{String(row.actorType ?? "agent")}</Badge></div>) : <p className="py-8 text-sm text-muted-foreground">No audit events found.</p>}</CardContent></Card></div>;
}
