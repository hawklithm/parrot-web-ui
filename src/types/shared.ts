// Shared types from parrot-shared
// This file provides type definitions to replace the workspace dependency

export type AgentAdapterType = string;
export type PermissionKey = string;
export type RunLivenessState = "live" | "stopped" | "pending_first_run" | "already_reviewed" | "not_applicable";
export type ActivityEventType = string;

export interface JoinRequest {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  actorId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentPermissions {
  canCreateAgents?: boolean;
  canCreateSkills?: boolean;
  trustPreset?: string;
  authorizationPolicy?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  companyId: string;
  name: string;
  role: string;
  status: string;
  adapterType: string;
  adapterConfig: Record<string, unknown>;
  permissions: AgentPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assigneeAgentId?: string;
  assigneeUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Adapter types
export interface AdapterConfig {
  type: string;
  [key: string]: unknown;
}

export interface AdapterModel {
  id: string;
  name: string;
  provider: string;
}

// Re-export commonly used types
export type { RunLivenessState as default };
