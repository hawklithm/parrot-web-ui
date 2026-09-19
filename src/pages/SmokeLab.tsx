import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Play, Square } from "lucide-react";
import { smokeLabApi } from "@/api/smokeLab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";

export function SmokeLab() {
  const { selectedCompanyId } = useCompany(); const { setBreadcrumbs } = useBreadcrumbs(); const client = useQueryClient();
  useEffect(() => setBreadcrumbs([{ label: "Smoke lab" }]), [setBreadcrumbs]);
  const services = useQuery({ queryKey: queryKeys.smokeLab(selectedCompanyId ?? "none"), queryFn: () => smokeLabApi.listServices(selectedCompanyId!), enabled: !!selectedCompanyId });
  const action = useMutation({ mutationFn: (kind: "start" | "stop") => kind === "start" ? smokeLabApi.startServices(selectedCompanyId!) : smokeLabApi.stopServices(selectedCompanyId!), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.smokeLab(selectedCompanyId!) }) });
  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  const rows = Array.isArray(services.data) ? services.data : (services.data as { services?: Record<string, unknown>[] } | undefined)?.services ?? [];
  return <div className="max-w-4xl space-y-5"><div><h1 className="text-xl font-semibold">Smoke lab</h1><p className="mt-1 text-sm text-muted-foreground">Local integration fixtures and service health for governed tool flows.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FlaskConical className="h-4 w-4" />Mock services</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Button size="sm" onClick={() => action.mutate("start")} disabled={action.isPending}><Play className="h-3.5 w-3.5" />Start</Button><Button size="sm" variant="outline" onClick={() => action.mutate("stop")} disabled={action.isPending}><Square className="h-3.5 w-3.5" />Stop</Button><Button size="sm" variant="secondary" onClick={() => smokeLabApi.installFixtures(selectedCompanyId!)}>Install fixtures</Button></div>{rows.map((row, index) => <div key={String(row.name ?? index)} className="flex justify-between rounded-md border px-3 py-2 text-sm"><span>{String(row.name ?? "service")}</span><span className="text-muted-foreground">{String(row.status ?? "unknown")}</span></div>)}</CardContent></Card></div>;
}
