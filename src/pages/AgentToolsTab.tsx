import { useQuery } from "@tanstack/react-query";
import { Cable, ShieldCheck } from "lucide-react";
import { toolsApi } from "../api/tools";
import type { Agent } from "../lib/paperclip-shared/src";

export function AgentToolsTab({ agent, companyId }: { agent: Agent; companyId?: string }) {
  const query = useQuery({
    queryKey: ["agent-tools", companyId, agent.id],
    queryFn: () => toolsApi.getEffectiveProfilesForAgent(companyId!, agent.id),
    enabled: Boolean(companyId),
  });
  if (!companyId) return <div className="text-sm text-muted-foreground">This agent is not assigned to a company.</div>;
  if (query.isLoading) return <div className="text-sm text-muted-foreground">Loading effective tools…</div>;
  if (query.isError) return <div className="text-sm text-destructive">Unable to load effective tools.</div>;
  const tools = query.data?.allowedToolNames ?? [];
  return <section className="max-w-4xl space-y-5"><header><h2 className="text-lg font-semibold">Agent tools</h2><p className="mt-1 text-sm text-muted-foreground">Effective access after profile bindings and tool policies are applied.</p></header><div className="grid gap-4 md:grid-cols-2"><div className="rounded-lg border border-border p-4"><div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Allowed tools</div>{tools.length ? <ul className="mt-3 space-y-2 text-sm">{tools.map((tool) => <li key={tool} className="rounded bg-muted px-2 py-1 font-mono">{tool}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No allowed tools are currently bound.</p>}</div><div className="rounded-lg border border-border p-4"><div className="flex items-center gap-2 font-medium"><Cable className="h-4 w-4" />Installed connections</div>{query.data?.installedConnections.length ? <ul className="mt-3 space-y-2 text-sm">{query.data.installedConnections.map((connection) => <li key={connection.id} className="flex justify-between rounded bg-muted px-2 py-1"><span>{connection.name}</span><span className="text-muted-foreground">{connection.status ?? "unknown"}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No installed connections.</p>}</div></div></section>;
}
