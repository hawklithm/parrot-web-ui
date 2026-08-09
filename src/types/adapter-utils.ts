// Adapter utility types
// This file provides type definitions to replace @paperclipai/adapter-utils

export interface AdapterEnvironmentCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
}

export interface AdapterEnvironmentTestResult {
  adapterType: string;
  status: "pass" | "fail";
  testedAt: string;
  checks: AdapterEnvironmentCheck[];
}

export interface AdapterConfigField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "json";
  required?: boolean;
  description?: string;
  defaultValue?: unknown;
}

export interface AdapterConfigSchema {
  fields: AdapterConfigField[];
}

export interface AdapterModelProfile {
  key: string;
  label: string;
  description?: string;
  model: string;
  config?: Record<string, unknown>;
}

export interface TestEnvironmentContext {
  companyId: string;
  config: Record<string, unknown>;
}
