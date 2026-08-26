import { api } from "./client";

export type FolderKind = "skill" | "routine";
export type Folder = { id: string; companyId: string; kind: FolderKind; name: string; slug: string; parentId?: string | null; itemCount?: number };
export type FolderListResult = { folders: Folder[]; totalFolders: number; totalItems: number; unfiledCount: number };

export const foldersApi = {
  list: (companyId: string, kind: FolderKind) => api.get<FolderListResult>(`/companies/${companyId}/folders?kind=${kind}`),
  create: (companyId: string, body: { kind: FolderKind; name: string; parentId?: string | null; color?: string | null }) => api.post<Folder>(`/companies/${companyId}/folders`, body),
  ensureMy: (companyId: string) => api.post<Folder>(`/companies/${companyId}/folders/ensure-my`, {}),
  update: (companyId: string, folderId: string, body: Partial<Pick<Folder, "name" | "parentId">>) => api.patch<Folder>(`/companies/${companyId}/folders/${folderId}`, body),
  moveItem: (companyId: string, body: { kind: FolderKind; itemId: string; folderId?: string | null }) => api.post(`/companies/${companyId}/folders/items/move`, body),
  remove: (companyId: string, folderId: string) => api.delete(`/companies/${companyId}/folders/${folderId}`),
};
