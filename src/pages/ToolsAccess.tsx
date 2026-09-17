import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Check, ExternalLink, KeyRound, Loader2, Network, Play, PlugZap, RefreshCw, ShieldCheck, Terminal, X } from "lucide-react";
import { useLocation, useNavigate } from "@/lib/router";
import { toolsApi, type ToolConnection, type ToolGatewayClientSnippet, type ToolGalleryItem, type ToolPolicy, type ToolProfile } from "../api/tools";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";

type ToolTab = "overview" | "connect" | "review" | "gateways" | "profiles" | "policies" | "runtime" | "activity";

function activeTab(pathname: string): ToolTab {
  if (pathname.includes("/apps/connect")) return "connect";
  if (pathname.includes("/apps/review")) return "review";
  if (pathname.includes("/gateways")) return "gateways";
  if (pathname.includes("/profiles")) return "profiles";
  if (pathname.includes("/policies")) return "policies";
  if (pathname.includes("/runtime")) return "runtime";
  if (pathname.includes("/audit")) return "activity";
  return "overview";
}

function Metric({ icon: Icon, label, value }: { icon: typeof PlugZap; label: string; value: number }) {
  return <Card><CardContent className="flex items-center gap-3 py-4"><Icon className="h-5 w-5 text-muted-foreground" /><div><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></CardContent></Card>;
}

export function ToolsAccess() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tab = activeTab(location.pathname);
  const [mcpJson, setMcpJson] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [gatewayName, setGatewayName] = useState("");
  const [gatewayTokens, setGatewayTokens] = useState<Record<string, string>>({});
  const [profileName, setProfileName] = useState("");
  const [policyName, setPolicyName] = useState("");

  useEffect(() => setBreadcrumbs([{ label: "Apps & tools" }]), [setBreadcrumbs]);
  const enabled = Boolean(selectedCompanyId);
  const connections = useQuery({ queryKey: queryKeys.tools.connections(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listConnections(selectedCompanyId!), enabled });
  const applications = useQuery({ queryKey: queryKeys.tools.applications(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listApplications(selectedCompanyId!), enabled });
  const gallery = useQuery({ queryKey: queryKeys.tools.gallery(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listGallery(selectedCompanyId!), enabled });
  const profiles = useQuery({ queryKey: queryKeys.tools.profiles(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listProfiles(selectedCompanyId!), enabled });
  const policies = useQuery({ queryKey: queryKeys.tools.policies(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listPolicies(selectedCompanyId!), enabled });
  const gateways = useQuery({ queryKey: queryKeys.tools.gateways(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listGateways(selectedCompanyId!), enabled });
  const runtime = useQuery({ queryKey: queryKeys.tools.runtime(selectedCompanyId ?? "none"), queryFn: () => Promise.all([toolsApi.getRuntimeHealth(selectedCompanyId!), toolsApi.listRuntimeSlots(selectedCompanyId!)]), enabled });
  const activity = useQuery({ queryKey: queryKeys.tools.audit(selectedCompanyId ?? "none"), queryFn: () => toolsApi.listActivity(selectedCompanyId!, { window: "30d", limit: 100 }), enabled });
  const review = useQuery({ queryKey: ["tools", "review", selectedCompanyId], queryFn: () => toolsApi.listActionRequests(selectedCompanyId!), enabled });

  const invalidate = () => {
    if (!selectedCompanyId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.tools.connections(selectedCompanyId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tools.applications(selectedCompanyId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tools.profiles(selectedCompanyId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tools.policies(selectedCompanyId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tools.gateways(selectedCompanyId) });
    void queryClient.invalidateQueries({ queryKey: ["tools", "review", selectedCompanyId] });
  };
  const connect = useMutation({ mutationFn: (input: Record<string, unknown>) => toolsApi.connectApp(selectedCompanyId!, input), onSuccess: invalidate });
  const importConfig = useMutation({ mutationFn: () => toolsApi.importMcpJson(selectedCompanyId!, mcpJson), onSuccess: () => setMcpJson("") });
  const refresh = useMutation({ mutationFn: (id: string) => toolsApi.refreshCatalog(id), onSuccess: invalidate });
  const approve = useMutation({ mutationFn: (id: string) => toolsApi.approveActionRequest(selectedCompanyId!, id), onSuccess: invalidate });
  const decline = useMutation({ mutationFn: (id: string) => toolsApi.declineActionRequest(selectedCompanyId!, id), onSuccess: invalidate });
  const createGateway = useMutation({ mutationFn: () => toolsApi.createGateway(selectedCompanyId!, { name: gatewayName.trim() }), onSuccess: () => { setGatewayName(""); invalidate(); } });
  const issueGatewayToken = useMutation({ mutationFn: (gatewayId: string) => toolsApi.createGatewayToken(selectedCompanyId!, gatewayId, { name: "Parrot MCP client", clientLabel: "Parrot MCP client", expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() }), onSuccess: (data, gatewayId) => { if (typeof data.token === "string") setGatewayTokens((current) => ({ ...current, [gatewayId]: data.token as string })); invalidate(); } });
  const createProfile = useMutation({ mutationFn: () => toolsApi.createProfile(selectedCompanyId!, { profileKey: profileName.trim().toLowerCase().replace(/\s+/g, "-"), name: profileName.trim(), status: "active", defaultAction: "block" }), onSuccess: () => { setProfileName(""); invalidate(); } });
  const createPolicy = useMutation({ mutationFn: () => toolsApi.createPolicy(selectedCompanyId!, { name: policyName.trim(), policyType: "allow", enabled: true }), onSuccess: () => { setPolicyName(""); invalidate(); } });

  const rows = connections.data?.connections ?? [];
  const apps = applications.data?.applications ?? [];
  const galleryItems = gallery.data?.apps ?? gallery.data?.items ?? [];
  const profileRows = profiles.data?.profiles ?? [];
  const policyRows = policies.data?.policies ?? [];
  const gatewayRows = gateways.data?.gateways ?? [];
  const requests = review.data?.requests ?? review.data?.items ?? [];
  const eventRows = activity.data?.events ?? [];

  const tabs: Array<[ToolTab, string, string]> = useMemo(() => [["overview", "Overview", "/apps"], ["connect", "Connect app", "/apps/connect"], ["review", "Review queue", "/apps/review"], ["gateways", "Gateways", "/apps/gateways"], ["profiles", "Profiles", "/apps/advanced/profiles"], ["policies", "Policies", "/apps/advanced/policies"], ["runtime", "Runtime", "/apps/advanced/runtime"], ["activity", "Activity", "/apps/advanced/audit"]], []);
  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;

  return <div className="max-w-6xl space-y-5">
    <div><h1 className="text-xl font-semibold">Apps & tools</h1><p className="mt-1 text-sm text-muted-foreground">Connections, catalog review, profiles, runtime slots, gateways and audit are now one governed surface.</p></div>
    <div className="flex flex-wrap gap-1 border-b pb-2">{tabs.map(([value, label, href]) => <Button key={value} size="sm" variant={tab === value ? "secondary" : "ghost"} onClick={() => navigate(href)}>{label}{value === "review" && requests.length ? <Badge className="ml-1" variant="destructive">{requests.length}</Badge> : null}</Button>)}</div>
    {tab === "overview" ? <>
      <div className="grid gap-3 md:grid-cols-4"><Metric icon={PlugZap} label="Connections" value={rows.length} /><Metric icon={KeyRound} label="Applications" value={apps.length} /><Metric icon={ShieldCheck} label="Profiles" value={profileRows.length} /><Metric icon={Activity} label="Recent events" value={eventRows.length} /></div>
      <Card><CardHeader><CardTitle className="text-base">Connected apps</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length ? rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"><div><span className="font-medium">{row.name}</span><span className="ml-2 text-xs text-muted-foreground">{row.transport ?? "mcp"}</span></div><div className="flex items-center gap-2"><Badge variant="outline">{row.healthStatus ?? row.status ?? "unknown"}</Badge><Button size="sm" variant="ghost" onClick={() => refresh.mutate(row.id)} disabled={refresh.isPending}><RefreshCw className="h-3.5 w-3.5" /></Button></div></div>) : <p className="text-sm text-muted-foreground">No connections yet. Use Connect app to create a reviewed connection.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Provider gallery</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{galleryItems.map((item) => <div key={String(item.key ?? item.name)} className="rounded-md border p-3"><div className="font-medium">{item.displayName ?? item.name ?? item.key}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description ?? "MCP provider"}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => { setMcpJson(""); navigate("/apps/connect"); }}>Open setup</Button></div>)}</CardContent></Card>
    </> : null}
    {tab === "connect" ? <ConnectPanel gallery={galleryItems} customUrl={customUrl} setCustomUrl={setCustomUrl} mcpJson={mcpJson} setMcpJson={setMcpJson} connect={connect} importConfig={importConfig} /> : null}
    {tab === "review" ? <ReviewPanel requests={requests} approve={approve} decline={decline} /> : null}
    {tab === "gateways" ? <GatewayPanel rows={gatewayRows} name={gatewayName} setName={setGatewayName} create={createGateway} issueToken={issueGatewayToken} tokens={gatewayTokens} /> : null}
    {tab === "profiles" ? <ProfilePanel rows={profileRows} name={profileName} setName={setProfileName} create={createProfile} /> : null}
    {tab === "policies" ? <PolicyPanel rows={policyRows} name={policyName} setName={setPolicyName} create={createPolicy} /> : null}
    {tab === "runtime" ? <RuntimePanel data={runtime.data} /> : null}
    {tab === "activity" ? <ActivityPanel rows={eventRows} /> : null}
  </div>;
}

function ConnectPanel({ gallery, customUrl, setCustomUrl, mcpJson, setMcpJson, connect, importConfig }: { gallery: ToolGalleryItem[]; customUrl: string; setCustomUrl: (value: string) => void; mcpJson: string; setMcpJson: (value: string) => void; connect: { mutate: (input: Record<string, unknown>) => void; isPending: boolean; data?: Record<string, unknown>; error: Error | null }; importConfig: { mutate: () => void; isPending: boolean; data?: Record<string, unknown>; error: Error | null } }) {
  return <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Connect from gallery</CardTitle></CardHeader><CardContent className="space-y-2">{gallery.map((item) => <div key={String(item.key ?? item.name)} className="flex items-center justify-between rounded-md border px-3 py-2"><span>{item.displayName ?? item.name ?? item.key}</span><Button size="sm" onClick={() => connect.mutate({ galleryKey: item.key })} disabled={connect.isPending}>{connect.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}Connect</Button></div>)}<div className="border-t pt-3"><label className="text-xs font-medium">Custom MCP HTTP link</label><div className="mt-1 flex gap-2"><Input value={customUrl} onChange={(event) => setCustomUrl(event.target.value)} placeholder="https://example.com/mcp" /><Button size="sm" onClick={() => connect.mutate({ link: customUrl })} disabled={!customUrl.trim() || connect.isPending}>Connect</Button></div></div>{connect.error ? <p className="text-xs text-destructive">{connect.error.message}</p> : connect.data ? <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(connect.data, null, 2)}</pre> : null}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Import MCP JSON</CardTitle></CardHeader><CardContent className="space-y-2"><Textarea value={mcpJson} onChange={(event) => setMcpJson(event.target.value)} className="min-h-48 font-mono text-xs" placeholder={'{"mcpServers": {"my-server": {"url": "https://..."}}}'} /><Button onClick={() => importConfig.mutate()} disabled={!mcpJson.trim() || importConfig.isPending}><Terminal className="h-3.5 w-3.5" />Preview import</Button>{importConfig.error ? <p className="text-xs text-destructive">{importConfig.error.message}</p> : importConfig.data ? <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(importConfig.data, null, 2)}</pre> : null}</CardContent></Card></div>;
}

function ReviewPanel({ requests, approve, decline }: { requests: Array<{ id: string; toolName?: string; agentId?: string; [key: string]: unknown }>; approve: { mutate: (id: string) => void; isPending: boolean }; decline: { mutate: (id: string) => void; isPending: boolean } }) {
  return <Card><CardHeader><CardTitle className="text-base">Ask-first review queue</CardTitle></CardHeader><CardContent className="space-y-2">{requests.length ? requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-3 text-sm"><div><div className="font-medium">{request.toolName ?? String(request.name ?? "Tool action")}</div><div className="text-xs text-muted-foreground">Agent {request.agentId ?? "unknown"}</div></div><div className="flex gap-2"><Button size="sm" onClick={() => approve.mutate(request.id)} disabled={approve.isPending}><Check className="h-3.5 w-3.5" />Approve</Button><Button size="sm" variant="outline" onClick={() => decline.mutate(request.id)} disabled={decline.isPending}><X className="h-3.5 w-3.5" />Decline</Button></div></div>) : <p className="text-sm text-muted-foreground">No pending tool actions.</p>}</CardContent></Card>;
}

function formatGatewaySnippet(snippet: ToolGatewayClientSnippet, token?: string): string {
  const config = snippet.configToml ?? JSON.stringify(snippet.config ?? {}, null, 2) ?? "{}";
  return token ? config.split("pcgw_...").join(token) : config;
}

function GatewayPanel({ rows, name, setName, create, issueToken, tokens }: { rows: Array<{ id: string; name: string; status?: string; slug?: string; endpointPath?: string; clientSnippets?: ToolGatewayClientSnippet[] }>; name: string; setName: (value: string) => void; create: { mutate: () => void; isPending: boolean }; issueToken: { mutate: (gatewayId: string) => void; isPending: boolean }; tokens: Record<string, string> }) {
  return <div className="space-y-3"><Card><CardContent className="flex gap-2 py-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Gateway name" /><Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}><Network className="h-3.5 w-3.5" />Create gateway</Button></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Named MCP gateways</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length ? rows.map((row) => <div key={row.id} className="rounded border px-3 py-2 text-sm"><div className="flex items-center justify-between gap-3"><span>{row.name}<span className="ml-2 text-xs text-muted-foreground">/{row.slug ?? row.id}</span></span><div className="flex items-center gap-2"><Badge variant="outline">{row.status ?? "active"}</Badge><Button size="sm" variant="outline" onClick={() => issueToken.mutate(row.id)} disabled={issueToken.isPending}><KeyRound className="h-3.5 w-3.5" />Issue token</Button></div></div>{row.endpointPath ? <div className="mt-2 break-all rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{row.endpointPath}</div> : null}{tokens[row.id] ? <div className="mt-2 break-all rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-mono text-xs">Token (copy now): {tokens[row.id]}</div> : null}{row.clientSnippets?.length ? <details className="mt-2 rounded bg-muted/40 p-2"><summary className="cursor-pointer text-xs font-medium">Client configuration ({row.clientSnippets.length})</summary><div className="mt-2 space-y-2">{row.clientSnippets.map((snippet) => <details key={snippet.client} className="rounded border bg-background p-2"><summary className="cursor-pointer text-xs font-medium">{snippet.label}</summary><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 font-mono text-xs">{formatGatewaySnippet(snippet, tokens[row.id])}</pre>{snippet.notes?.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{snippet.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}</details>)}</div></details> : null}</div>) : <p className="text-sm text-muted-foreground">No named gateways.</p>}</CardContent></Card></div>;
}

function ProfilePanel({ rows, name, setName, create }: { rows: ToolProfile[]; name: string; setName: (value: string) => void; create: { mutate: () => void; isPending: boolean } }) {
  return <div className="space-y-3"><Card><CardContent className="flex gap-2 py-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Profile name" /><Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}><KeyRound className="h-3.5 w-3.5" />Create profile</Button></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Access profiles</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length ? rows.map((row) => <div key={row.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm"><span>{row.name}<span className="ml-2 text-xs text-muted-foreground">{row.entries?.length ?? 0} rules · {row.bindings?.length ?? 0} bindings</span></span><Badge variant="outline">{row.status ?? "active"}</Badge></div>) : <p className="text-sm text-muted-foreground">No profiles configured.</p>}</CardContent></Card></div>;
}

function PolicyPanel({ rows, name, setName, create }: { rows: ToolPolicy[]; name: string; setName: (value: string) => void; create: { mutate: () => void; isPending: boolean } }) {
  return <div className="space-y-3"><Card><CardContent className="flex gap-2 py-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Policy name" /><Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}><ShieldCheck className="h-3.5 w-3.5" />Create policy</Button></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Policy order</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length ? rows.map((row, index) => <div key={row.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm"><span><span className="mr-2 text-xs text-muted-foreground">#{index + 1}</span>{row.name ?? row.id}</span><Badge variant={row.enabled === false ? "secondary" : "outline"}>{row.effect ?? row.policyType ?? (row.enabled === false ? "disabled" : "enabled")}</Badge></div>) : <p className="text-sm text-muted-foreground">No policies configured.</p>}</CardContent></Card></div>;
}

function RuntimePanel({ data }: { data?: [Record<string, unknown>, Record<string, unknown>] }) {
  const health = data?.[0] ?? {};
  const slotsValue = data?.[1] ?? {};
  const slots = Array.isArray(slotsValue.slots) ? slotsValue.slots as Array<Record<string, unknown>> : [];
  return <div className="space-y-3"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Play className="h-4 w-4" />Runtime health</CardTitle></CardHeader><CardContent><pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(health, null, 2)}</pre></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Runtime slots</CardTitle></CardHeader><CardContent className="space-y-2">{slots.length ? slots.map((slot) => <div key={String(slot.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm"><span>{String(slot.connectionId ?? slot.id)}</span><Badge variant="outline">{String(slot.status ?? "unknown")}</Badge></div>) : <p className="text-sm text-muted-foreground">No active runtime slots.</p>}</CardContent></Card></div>;
}

function ActivityPanel({ rows }: { rows: Array<{ id: string; action?: string; normalizedOutcome?: string; toolDisplayName?: string | null; createdAt?: string }> }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Tool gateway activity</CardTitle></CardHeader><CardContent className="divide-y">{rows.length ? rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><div className="font-medium">{row.toolDisplayName ?? row.action ?? "tool event"}</div><div className="text-xs text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</div></div><Badge variant="outline">{row.normalizedOutcome ?? "unknown"}</Badge></div>) : <p className="py-8 text-sm text-muted-foreground">No tool activity.</p>}</CardContent></Card>;
}
