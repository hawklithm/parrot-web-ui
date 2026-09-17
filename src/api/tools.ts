import { api } from "./client";

export type ToolTargetType = "company" | "agent" | "project" | "routine" | "issue" | "gateway";

export interface ToolConnectionInstall {
  id?: string;
  connectionId?: string;
  targetType: ToolTargetType;
  targetId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToolConnection {
  id: string;
  companyId?: string;
  applicationId?: string | null;
  applicationName?: string | null;
  name: string;
  status?: string;
  healthStatus?: string | null;
  healthMessage?: string | null;
  transport?: string;
  authKind?: string;
  enabled?: boolean;
  config?: Record<string, unknown> | null;
  installs?: ToolConnectionInstall[];
  [key: string]: unknown;
}

export interface ToolApplication {
  id: string;
  companyId?: string;
  key?: string;
  name?: string;
  displayName?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ToolCatalogEntry {
  id: string;
  connectionId: string;
  applicationId?: string | null;
  toolName: string;
  name?: string;
  title?: string | null;
  description?: string | null;
  riskLevel?: string | null;
  status?: string;
  isReadOnly?: boolean;
  isWrite?: boolean;
  isDestructive?: boolean;
  [key: string]: unknown;
}

export interface ToolPolicy {
  id: string;
  name?: string;
  description?: string | null;
  policyType?: string;
  effect?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface ToolProfileEntry {
  id: string;
  selectorType?: string;
  effect?: string;
  applicationId?: string | null;
  connectionId?: string | null;
  catalogEntryId?: string | null;
  toolName?: string | null;
  riskLevel?: string | null;
  conditions?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ToolProfileBinding {
  id: string;
  profileId?: string;
  targetType: ToolTargetType;
  targetId: string;
  priority?: number;
  [key: string]: unknown;
}

export interface ToolProfile {
  id: string;
  profileKey?: string;
  name: string;
  description?: string | null;
  status?: string;
  defaultAction?: string;
  entries?: ToolProfileEntry[];
  bindings?: ToolProfileBinding[];
  [key: string]: unknown;
}

export interface ToolProfileEffectiveSummary {
  agentId?: string;
  profiles?: Array<{
    id: string;
    name: string;
    summary?: { isCompanyDefault?: boolean; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  entries?: ToolProfileEntry[];
  allowedTools?: ToolCatalogEntry[];
  [key: string]: unknown;
}

export interface ToolGateway {
  id: string;
  gatewayPublicId?: string;
  endpointPath?: string;
  name: string;
  slug?: string;
  status?: string;
  description?: string | null;
  profileId?: string | null;
  clientSnippets?: ToolGatewayClientSnippet[];
  tokens?: ToolGatewayToken[];
  [key: string]: unknown;
}

export interface ToolGatewayClientSnippet {
  client: string;
  label: string;
  config?: unknown;
  configToml?: string;
  notes?: string[];
}

export interface ToolGatewayToken {
  id: string;
  name?: string;
  tokenPrefix?: string;
  clientLabel?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  [key: string]: unknown;
}

export interface ToolGatewayActivityEvent {
  id: string;
  action?: string;
  actorType?: string | null;
  actorId?: string | null;
  agentId?: string | null;
  runId?: string | null;
  appDisplayName?: string | null;
  connectionDisplayName?: string | null;
  toolDisplayName?: string | null;
  normalizedOutcome?: string;
  details?: Record<string, unknown> | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ToolAuditResponse {
  events?: ToolGatewayActivityEvent[];
  nextCursor?: string | null;
  [key: string]: unknown;
}

export interface ToolCatalogResponse { catalog: ToolCatalogEntry[]; [key: string]: unknown }
export interface ToolProfilesResponse { profiles: ToolProfile[]; [key: string]: unknown }
export interface ToolConnectionsResponse { connections: ToolConnection[]; [key: string]: unknown }
export interface ToolApplicationsResponse { applications: ToolApplication[]; [key: string]: unknown }
export interface ToolPoliciesResponse { policies: ToolPolicy[]; [key: string]: unknown }

export interface ToolGalleryItem {
  key?: string;
  name?: string;
  displayName?: string;
  description?: string;
  transport?: string;
  authKind?: string;
  [key: string]: unknown;
}

export interface ToolGalleryResponse {
  apps?: ToolGalleryItem[];
  items?: ToolGalleryItem[];
  [key: string]: unknown;
}

export interface ListActivityParams {
  app?: string;
  agent?: string;
  outcome?: string;
  window?: "1h" | "24h" | "7d" | "30d";
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface ToolActionRequest {
  id: string;
  status?: string;
  toolName?: string;
  agentId?: string;
  [key: string]: unknown;
}

function encode(value: string) { return encodeURIComponent(value); }

export const toolsApi = {
  listGallery: (companyId: string) => api.get<ToolGalleryResponse>(`/companies/${encode(companyId)}/tools/gallery`),
  listAppsAttention: (companyId: string) => api.get<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/apps/attention`),
  connectApp: (companyId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/apps/connect`, input),
  startOAuth: (connectionId: string) => api.post<Record<string, unknown>>(`/tools/oauth/${encode(connectionId)}/start`, {}),
  finishApp: (companyId: string, connectionId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/apps/${encode(connectionId)}/finish`, input),
  importMcpJson: (companyId: string, mcpJson: unknown) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/mcp/import-json`, { mcpJson }),
  listApplications: (companyId: string) => api.get<ToolApplicationsResponse>(`/companies/${encode(companyId)}/tools/applications`),
  createApplication: (companyId: string, input: Record<string, unknown>) => api.post<ToolApplication>(`/companies/${encode(companyId)}/tools/applications`, input),
  updateApplication: (id: string, input: Record<string, unknown>) => api.patch<ToolApplication>(`/tool-applications/${encode(id)}`, input),
  deleteApplication: (id: string) => api.delete<ToolApplication>(`/tool-applications/${encode(id)}`),

  listConnections: (companyId: string) => api.get<ToolConnectionsResponse>(`/companies/${encode(companyId)}/tools/connections`),
  connection: (id: string) => api.get<ToolConnection>(`/tool-connections/${encode(id)}`),
  getConnection: (id: string) => api.get<ToolConnection>(`/tool-connections/${encode(id)}`),
  createConnection: (companyId: string, input: Record<string, unknown>) => api.post<ToolConnection>(`/companies/${encode(companyId)}/tools/connections`, input),
  updateConnection: (id: string, input: Record<string, unknown>) => api.patch<ToolConnection>(`/tool-connections/${encode(id)}`, input),
  archiveConnection: (id: string) => api.delete<ToolConnection>(`/tool-connections/${encode(id)}`),
  checkConnectionHealth: (id: string) => api.post<Record<string, unknown>>(`/tool-connections/${encode(id)}/health-check`, {}),
  reconnectConnection: (id: string, credentialValues: Record<string, string>) => api.post<Record<string, unknown>>(`/tool-connections/${encode(id)}/reconnect`, { credentialValues }),
  refreshCatalog: (id: string) => api.post<Record<string, unknown>>(`/tool-connections/${encode(id)}/catalog/refresh`, {}),
  listCatalog: (id: string) => api.get<ToolCatalogResponse>(`/tool-connections/${encode(id)}/catalog`),
  listConnectionActivity: (id: string, limit = 50) => api.get<Record<string, unknown>>(`/tool-connections/${encode(id)}/activity?limit=${limit}`),
  getConnectionInstalls: (id: string) => api.get<{ connectionId: string; installs: ToolConnectionInstall[] }>(`/tool-connections/${encode(id)}/installs`),
  putConnectionInstalls: (id: string, installs: Array<{ targetType: ToolTargetType; targetId: string }>) => api.put<Record<string, unknown>>(`/tool-connections/${encode(id)}/installs`, { installs }),
  listTestAgents: (id: string) => api.get<Record<string, unknown>>(`/tool-connections/${encode(id)}/test-agents`),
  runTestCall: (id: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/tool-connections/${encode(id)}/test-calls`, input),
  getTestCallStatus: (id: string, callId: string) => api.get<Record<string, unknown>>(`/tool-connections/${encode(id)}/test-calls/${encode(callId)}`),

  listProfiles: (companyId: string) => api.get<ToolProfilesResponse>(`/companies/${encode(companyId)}/tools/profiles`),
  getProfileNewTools: (profileId: string) => api.get<Record<string, unknown>>(`/tool-profiles/${encode(profileId)}/new-tools`),
  reviewProfileNewTools: (profileId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/tool-profiles/${encode(profileId)}/new-tools/review`, input),
  createProfile: (companyId: string, input: Record<string, unknown>) => api.post<ToolProfile>(`/companies/${encode(companyId)}/tools/profiles`, input),
  updateProfile: (profileId: string, input: Record<string, unknown>) => api.patch<ToolProfile>(`/tool-profiles/${encode(profileId)}`, input),
  duplicateProfile: (profileId: string, input: Record<string, unknown>) => api.post<ToolProfile>(`/tool-profiles/${encode(profileId)}/duplicate`, input),
  deleteProfile: (profileId: string) => api.delete<Record<string, unknown>>(`/tool-profiles/${encode(profileId)}`),
  addProfileEntry: (profileId: string, input: Record<string, unknown>) => api.post<ToolProfileEntry>(`/tool-profiles/${encode(profileId)}/entries`, input),
  updateProfileEntry: (entryId: string, input: Record<string, unknown>) => api.patch<ToolProfileEntry>(`/tool-profile-entries/${encode(entryId)}`, input),
  deleteProfileEntry: (entryId: string) => api.delete<Record<string, unknown>>(`/tool-profile-entries/${encode(entryId)}`),
  bindProfile: (companyId: string, profileId: string, input: Record<string, unknown>) => api.post<ToolProfileBinding>(`/companies/${encode(companyId)}/tools/profiles/${encode(profileId)}/bind`, input),
  unbindProfile: (companyId: string, profileId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/profiles/${encode(profileId)}/unbind`, input),
  getEffectiveProfilesForAgent: (companyId: string, agentId: string) => api.get<ToolProfileEffectiveSummary>(`/companies/${encode(companyId)}/tools/profiles/effective/agents/${encode(agentId)}`),

  listRuntimeHealth: (companyId: string) => api.get<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/runtime-health`),
  getRuntimeHealth: (companyId: string) => api.get<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/runtime-health`),
  listRuntimeSlots: (companyId: string) => api.get<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/runtime-slots`),
  stopRuntimeSlot: (companyId: string, slotId: string) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/runtime-slots/${encode(slotId)}/stop`, {}),
  restartRuntimeSlot: (companyId: string, slotId: string) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/runtime-slots/${encode(slotId)}/restart`, {}),
  listActionRequests: (companyId: string, status = "pending") => api.get<{ requests?: ToolActionRequest[]; items?: ToolActionRequest[] }>(`/companies/${encode(companyId)}/tools/action-requests?status=${encode(status)}`),
  approveActionRequest: (companyId: string, id: string) => api.post<ToolActionRequest>(`/tool-gateway/action-requests/${encode(id)}/approve`, { companyId }),
  declineActionRequest: (companyId: string, id: string) => api.post<ToolActionRequest>(`/tool-gateway/action-requests/${encode(id)}/decline`, { companyId }),
  createTrustRuleFromActionRequest: (companyId: string, id: string, input: Record<string, unknown> = {}) => api.post<ToolPolicy>(`/companies/${encode(companyId)}/tools/action-requests/${encode(id)}/trust-rule`, input),
  listTrustRules: (companyId: string) => api.get<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/trust-rules`),
  revokeTrustRule: (companyId: string, id: string, reason?: string) => api.post<ToolPolicy>(`/companies/${encode(companyId)}/tools/trust-rules/${encode(id)}/revoke`, { reason: reason ?? null }),
  listStdioTemplates: (companyId: string) => api.get<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/stdio-templates`),
  createStdioTemplate: (companyId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/stdio-templates`, input),
  disableStdioTemplate: (companyId: string, id: string, reason?: string) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/stdio-templates/${encode(id)}/disable`, { reason: reason ?? null }),

  listPolicies: (companyId: string) => api.get<ToolPoliciesResponse>(`/companies/${encode(companyId)}/tools/policies`),
  createPolicy: (companyId: string, input: Record<string, unknown>) => api.post<ToolPolicy>(`/companies/${encode(companyId)}/tools/policies`, input),
  updatePolicy: (companyId: string, id: string, input: Record<string, unknown>) => api.patch<ToolPolicy>(`/companies/${encode(companyId)}/tools/policies/${encode(id)}`, input),
  duplicatePolicy: (companyId: string, id: string, input: Record<string, unknown> = {}) => api.post<ToolPolicy>(`/companies/${encode(companyId)}/tools/policies/${encode(id)}/duplicate`, input),
  deletePolicy: (companyId: string, id: string) => api.delete<ToolPolicy>(`/companies/${encode(companyId)}/tools/policies/${encode(id)}`),
  reorderPolicies: (companyId: string, input: Record<string, unknown>) => api.post<ToolPoliciesResponse>(`/companies/${encode(companyId)}/tools/policies/reorder`, input),
  testPolicy: (companyId: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/companies/${encode(companyId)}/tools/policy/test`, input),
  listGateways: (companyId: string) => api.get<{ gateways?: ToolGateway[] }>(`/companies/${encode(companyId)}/tools/gateways`),
  createGateway: (companyId: string, input: Record<string, unknown>) => api.post<ToolGateway>(`/companies/${encode(companyId)}/tools/gateways`, input),
  updateGateway: (companyId: string, id: string, input: Record<string, unknown>) => api.patch<ToolGateway>(`/tool-gateway/gateways/${encode(id)}`, { ...input, companyId }),
  createGatewayToken: (companyId: string, id: string, input: Record<string, unknown>) => api.post<Record<string, unknown>>(`/tool-gateway/gateways/${encode(id)}/tokens`, { ...input, companyId }),
  revokeGatewayToken: (companyId: string, id: string) => api.post<Record<string, unknown>>(`/tool-gateway/gateway-tokens/${encode(id)}/revoke`, { companyId }),

  listActivity: (companyId: string, params: ListActivityParams = {}) => {
    const query = new URLSearchParams({ companyId: encode(companyId) });
    for (const [key, value] of Object.entries(params)) if (value != null) query.set(key, String(value));
    query.set("limit", String(params.limit ?? 50));
    return api.get<ToolAuditResponse>(`/tool-gateway/audit?${query.toString()}`);
  },
  audit: (companyId: string, filters: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams({ companyId: encode(companyId) });
    for (const [key, value] of Object.entries(filters)) if (value !== undefined) query.set(key, String(value));
    return api.get<ToolAuditResponse>(`/tool-gateway/audit?${query.toString()}`);
  },
};
