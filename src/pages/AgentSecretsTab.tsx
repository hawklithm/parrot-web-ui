import { useQuery } from "@tanstack/react-query";
import { KeyRound, ShieldCheck } from "lucide-react";
import { secretsApi } from "../api/secrets";
import type { AgentDetail as AgentDetailRecord } from "../lib/paperclip-shared/src";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { queryKeys } from "../lib/queryKeys";

export function AgentSecretsTab({ agent, companyId }: { agent: AgentDetailRecord; companyId: string }) {
  const secrets = useQuery({ queryKey: queryKeys.secrets.list(companyId), queryFn: () => secretsApi.list(companyId) });
  const rows = secrets.data ?? [];
  return <div className="max-w-4xl space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" />Secrets available to {agent.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Values stay redacted. This view exposes the company secret inventory and the governance entry point; actual resolution remains agent-scoped on the backend.</p></CardContent></Card><Card><CardContent className="space-y-2 pt-6">{rows.length ? rows.map((secret) => <div key={secret.id} className="flex items-center justify-between rounded-md border px-3 py-3 text-sm"><div><div className="font-medium">{secret.name}</div><code className="text-xs text-muted-foreground">{secret.key}</code></div><div className="flex items-center gap-2"><Badge variant="outline">{secret.status}</Badge><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div></div>) : <p className="text-sm text-muted-foreground">No company secrets configured.</p>}</CardContent></Card></div>;
}
