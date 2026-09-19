import { api } from "./client";

export type FolderKind = "routine" | "skill";
export interface Folder {
  id: string;
  companyId: string;
  kind: FolderKind;
  parentId?: string | null;
  name: string;
  slug: string;
  path?: string;
  color?: string | null;
  position?: number;
  itemCount?: number;
  [key: string]: unknown;
}
export interface FolderListResult {
  folders: Folder[];
  [key: string]: unknown;
}

export const foldersApi = {
  list: (companyId: string, kind: FolderKind) =>
    api.get<FolderListResult>(`/companies/${encodeURIComponent(companyId)}/folders?kind=${kind}`),
  create: (companyId: string, payload: Record<string, unknown>) =>
    api.post<Folder>(`/companies/${encodeURIComponent(companyId)}/folders`, payload),
  ensureMy: (companyId: string, payload: Record<string, unknown> = {}) =>
    api.post<Folder>(`/companies/${encodeURIComponent(companyId)}/folders/ensure-my`, payload),
  update: (companyId: string, folderId: string, payload: Record<string, unknown>) =>
    api.patch<Folder>(
      `/companies/${encodeURIComponent(companyId)}/folders/${encodeURIComponent(folderId)}`,
      payload,
    ),
  moveFolder: (companyId: string, folderId: string, payload: Record<string, unknown>) =>
    api.post<Folder>(
      `/companies/${encodeURIComponent(companyId)}/folders/${encodeURIComponent(folderId)}/move`,
      payload,
    ),
  moveItem: (companyId: string, payload: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`/companies/${encodeURIComponent(companyId)}/folders/items/move`, payload),
  delete: (companyId: string, folderId: string) =>
    api.delete<Record<string, unknown>>(
      `/companies/${encodeURIComponent(companyId)}/folders/${encodeURIComponent(folderId)}`,
    ),
};
