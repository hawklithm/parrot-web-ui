import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cable, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { toolsApi } from "../api/tools";
import { Button } from "../components/ui/button";

type Tab = "connections" | "profiles" | "policies" | "gateways";

export function ToolsCenter() {
  const { selectedCompanyId } = useCompany();
  const [tab, setTab] = useState<Tab>("connections");
  const queryClient = useQueryClient();
  const queryKey = ["tools-center", selectedCompanyId, tab];
  const data = useQuery<any>({
    queryKey,
    queryFn: () => tab === "connections" ? toolsApi.listConnections(selectedCompanyId!) : tab === "profiles" ? toolsApi.listProfiles(selectedCompanyId!) : tab === "policies" ? toolsApi.listPolicies(selectedCompanyId!) : toolsApi.listGateways(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const [name, setName] = useState("");
  const create = useMutation<unknown, Error, void>({
    mutationFn: () => tab === "profiles" ? toolsApi.createProfile(selectedCompanyId!, { profileKey: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, profileId: "" } as any) : tab === "policies" ? toolsApi.createPolicy(selectedCompanyId!, { name, priority: 0, enabled: true, policyType: "allow", selectors: {} }) : tab === "gateways" ? toolsApi.createGateway(selectedCompanyId!, { name } as any) : toolsApi.createConnection(selectedCompanyId!, { name, transport: "mcp_remote" } as any),
    onSuccess: () => { setName(""); queryClient.invalidateQueries({ queryKey }); },
  });
  const removePolicy = useMutation({
    mutationFn: (id: string) => toolsApi.deletePolicy(selectedCompanyId!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (!selectedCompanyId) return <div className="p-6 text-muted-foreground">Select a company to configure tools.</div>;
  const rows = tab === "connections" ? (data.data as { connections: any[] } | undefined)?.connections ?? [] : tab === "profiles" ? (data.data as { profiles: any[] } | undefined)?.profiles ?? [] : tab === "policies" ? (data.data as { policies: any[] } | undefined)?.policies ?? [] : (data.data as { gateways: any[] } | undefined)?.gateways ?? [];
  return <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
    <header><h1 className="text-2xl font-semibold">Apps &amp; Tools</h1><p className="mt-1 text-sm text-muted-foreground">Manage external tool connections, access policies, and MCP gateways.</p></header>
    <div className="flex flex-wrap gap-2 border-b border-border">{(["connections", "profiles", "policies", "gateways"] as Tab[]).map((value) => <Button key={value} variant={tab === value ? "secondary" : "ghost"} onClick={() => setTab(value)}>{value[0].toUpperCase() + value.slice(1)}</Button>)}</div>
    <div className="flex max-w-xl gap-2"><input className="flex-1 rounded border border-border bg-background px-3 py-2" placeholder={tab === "connections" ? "Tool type (e.g. github)" : `${tab.slice(0, -1)} name`} value={name} onChange={(event) => setName(event.target.value)} /><Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}><Plus className="mr-1 h-4 w-4" />Create</Button></div>
    {data.isLoading ? <div className="text-muted-foreground">Loading…</div> : data.isError ? <div className="text-destructive">Unable to load tool configuration.</div> : rows.length === 0 ? <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">No {tab} configured.</div> : <div className="grid gap-3 md:grid-cols-2">{rows.map((row) => <article key={row.id} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{row.name || row.title || row.id}</h2><p className="mt-1 text-sm text-muted-foreground">{row.status || row.policyType || row.connectionKind || "configured"}</p></div>{tab === "connections" ? <Cable className="h-5 w-5 text-muted-foreground" /> : tab === "policies" ? <Button size="sm" variant="ghost" onClick={() => removePolicy.mutate(row.id)}><Trash2 className="h-4 w-4" /></Button> : <ShieldCheck className="h-5 w-5 text-muted-foreground" />}</div>{row.description && <p className="mt-3 text-sm text-muted-foreground">{row.description}</p>}</article>)}</div>}
  </main>;
}
