import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, PlugZap } from "lucide-react";
import { toolsApi, type ToolConnection, type ToolConnectionInstall } from "../api/tools";
import type { AgentDetail as AgentDetailRecord } from "../lib/paperclip-shared/src";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useQuery as useSingleQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

function installForAgent(installs: ToolConnectionInstall[], agentId: string) {
  return installs.some((install) => install.targetType === "company" || (install.targetType === "agent" && install.targetId === agentId));
}

function ConnectionInstallRow({ companyId, agentId, connection, onChanged }: { companyId: string; agentId: string; connection: ToolConnection; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const installs = useSingleQuery({ queryKey: queryKeys.tools.installs(connection.id), queryFn: () => toolsApi.getConnectionInstalls(connection.id) });
  const current = installs.data?.installs ?? connection.installs ?? [];
  const installed = installForAgent(current, agentId);
  const mutation = useMutation({
    mutationFn: () => {
      const next = current.filter((entry) => !(entry.targetType === "agent" && entry.targetId === agentId));
      if (!installed) next.push({ targetType: "agent", targetId: agentId });
      return toolsApi.putConnectionInstalls(connection.id, next.map(({ targetType, targetId }) => ({ targetType, targetId })));
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.tools.installs(connection.id) }); onChanged(); },
  });
  return <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-3 text-sm"><div className="min-w-0"><div className="flex items-center gap-2 font-medium"><PlugZap className="h-3.5 w-3.5 text-muted-foreground" />{connection.name}</div><div className="mt-1 text-xs text-muted-foreground">{connection.transport ?? "MCP"} · {connection.healthStatus ?? connection.status ?? "unknown"}</div></div><Button size="sm" variant={installed ? "secondary" : "outline"} onClick={() => mutation.mutate()} disabled={mutation.isPending}>{installed ? <><Check className="h-3.5 w-3.5" />Installed</> : "Install"}</Button></div>;
}

export function AgentToolsTab({ agent, companyId }: { agent: AgentDetailRecord; companyId: string }) {
  const connections = useSingleQuery({ queryKey: queryKeys.tools.connections(companyId), queryFn: () => toolsApi.listConnections(companyId) });
  const effective = useSingleQuery({ queryKey: queryKeys.tools.effectiveProfilesForAgent(companyId, agent.id), queryFn: () => toolsApi.getEffectiveProfilesForAgent(companyId, agent.id) });
  const policies = useSingleQuery({ queryKey: queryKeys.tools.policies(companyId), queryFn: () => toolsApi.listPolicies(companyId) });
  const rows = connections.data?.connections ?? [];
  const allowed = effective.data?.allowedTools ?? [];
  const profileNames = effective.data?.profiles ?? [];
  const enabledPolicies = useMemo(() => (policies.data?.policies ?? []).filter((policy) => policy.enabled !== false), [policies.data?.policies]);
  const reload = () => { void connections.refetch(); void effective.refetch(); };
  return <div className="max-w-5xl space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4" />Effective access for {agent.name}</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-3"><div><div className="text-2xl font-semibold">{allowed.length}</div><div className="text-xs text-muted-foreground">Allowed catalog tools</div></div><div><div className="text-2xl font-semibold">{profileNames.length}</div><div className="text-xs text-muted-foreground">Applied profiles</div></div><div><div className="text-2xl font-semibold">{enabledPolicies.length}</div><div className="text-xs text-muted-foreground">Active policies</div></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Installed connections</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length ? rows.map((connection) => <ConnectionInstallRow key={connection.id} companyId={companyId} agentId={agent.id} connection={connection} onChanged={reload} />) : <p className="text-sm text-muted-foreground">No tool connections are configured.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Allowed tools</CardTitle></CardHeader><CardContent>{allowed.length ? <div className="flex flex-wrap gap-2">{allowed.map((tool) => <Badge key={tool.id} variant="outline" className="font-mono">{tool.toolName}</Badge>)}</div> : <p className="text-sm text-muted-foreground">No profile currently grants a tool to this agent.</p>}</CardContent></Card></div>;
}
