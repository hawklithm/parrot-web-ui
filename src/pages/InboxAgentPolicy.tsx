import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { inboxAgentPolicyApi } from "@/api/inbox-agent-policy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";

export function InboxAgentPolicy() {
  const { selectedCompanyId } = useCompany(); const { setBreadcrumbs } = useBreadcrumbs(); const client = useQueryClient();
  useEffect(() => setBreadcrumbs([{ label: "Inbox agent policy" }]), [setBreadcrumbs]);
  const query = useQuery({ queryKey: ["inbox-agent-policy", selectedCompanyId], queryFn: () => inboxAgentPolicyApi.get(selectedCompanyId!), enabled: !!selectedCompanyId });
  const mutation = useMutation({ mutationFn: (mode: "open" | "allowlist") => inboxAgentPolicyApi.update(selectedCompanyId!, { mode }), onSuccess: () => client.invalidateQueries({ queryKey: ["inbox-agent-policy", selectedCompanyId] }) });
  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  return <div className="max-w-2xl space-y-5"><div><h1 className="text-xl font-semibold">Inbox agent policy</h1><p className="mt-1 text-sm text-muted-foreground">Control which agents may continue work from your inbox.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" />Current policy</CardTitle></CardHeader><CardContent className="flex items-center justify-between gap-3"><span className="text-sm">{String(query.data?.mode ?? "open")}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => mutation.mutate("open")}>Open</Button><Button size="sm" onClick={() => mutation.mutate("allowlist")}>Allowlist</Button></div></CardContent></Card></div>;
}
