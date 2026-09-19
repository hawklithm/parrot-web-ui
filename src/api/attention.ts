import { api } from "./client";

export interface AttentionFeedQuery {
  includeDismissed?: boolean;
  archived?: boolean;
  all?: boolean;
  activitySince?: string;
  activityUntil?: string;
  queue?: string;
  sort?: "activity" | "decide";
  cursor?: string;
  limit?: number;
}

export interface AttentionFeed {
  items: Array<Record<string, unknown>>;
  nextCursor?: string | null;
  [key: string]: unknown;
}

export const attentionApi = {
  list: (companyId: string, options: AttentionFeedQuery = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
    const query = params.toString();
    return api.get<AttentionFeed>(`/companies/${companyId}/attention${query ? `?${query}` : ""}`);
  },
};
