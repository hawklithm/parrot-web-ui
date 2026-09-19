import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderTree } from "lucide-react";
import { foldersApi, type FolderKind } from "@/api/folders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";

export function Folders() {
  const { selectedCompanyId } = useCompany(); const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => setBreadcrumbs([{ label: "Folders" }]), [setBreadcrumbs]);
  const kind: FolderKind = "skill";
  const query = useQuery({ queryKey: queryKeys.folders(selectedCompanyId ?? "none", kind), queryFn: () => foldersApi.list(selectedCompanyId!, kind), enabled: !!selectedCompanyId });
  if (!selectedCompanyId) return <p className="text-sm text-muted-foreground">Select a company first.</p>;
  return <div className="max-w-4xl space-y-5"><div><h1 className="text-xl font-semibold">Folders</h1><p className="mt-1 text-sm text-muted-foreground">Organize skills and routines using the Paperclip folder contract.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderTree className="h-4 w-4" />Skill folders</CardTitle></CardHeader><CardContent className="space-y-2">{(query.data?.folders ?? []).map((folder) => <div key={folder.id} className="flex justify-between rounded-md border px-3 py-2 text-sm"><span>{folder.path ?? folder.name}</span><span className="text-muted-foreground">{folder.itemCount ?? 0} items</span></div>)}{!query.isLoading && !(query.data?.folders ?? []).length ? <p className="text-sm text-muted-foreground">No folders yet.</p> : null}</CardContent></Card></div>;
}
