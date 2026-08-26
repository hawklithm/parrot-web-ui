import { api } from "./client";

export type AttentionItem = {
  id: string;
  sourceKind: string;
  subject?: {
    id?: string;
    title?: string;
    href?: string | null;
    status?: string;
    metadata?: Record<string, unknown>;
  } | null;
  title?: string;
  summary?: string;
  verbs?: Array<{ key: string; label: string }>;
  href?: string | null;
  activityAt?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
  snoozedUntil?: string | null;
  [key: string]: unknown;
};

export type AttentionFeed = {
  companyId: string;
  generatedAt: string;
  totalCount: number;
  deskBadgeCount: number;
  nextCursor: string | null;
  countsBySourceKind: Record<string, number>;
  items: AttentionItem[];
};

export type AttentionFeedOptions = {
  includeDismissed?: boolean;
  archived?: boolean;
  all?: boolean;
  activitySince?: string;
  activityUntil?: string;
  queue?: string;
  sort?: "activity" | "decide";
  cursor?: string;
  limit?: number;
};

export const attentionApi = {
  list: (companyId: string, options: AttentionFeedOptions = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== false) params.set(key, String(value));
    }
    const query = params.toString();
    return api.get<AttentionFeed>(`/companies/${companyId}/attention${query ? `?${query}` : ""}`);
  },
};
