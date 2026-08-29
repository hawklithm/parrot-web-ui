import { History } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { EmptyState } from "../components/EmptyState";
import { useSearchParams } from "@/lib/router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "./Activity";
import { AuditTab } from "./tools/AuditTab";

type ActivityMode = "all" | "agents";

/**
 * Keep the company activity and privileged agent-action feeds on one route.
 * The API remains the authorization boundary for the agent-action view.
 */
export function CompanyActivity() {
  const { selectedCompanyId } = useCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: ActivityMode = searchParams.get("mode") === "agents" ? "agents" : "all";

  const handleModeChange = (next: string) => {
    if (next !== "all" && next !== "agents") return;
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === "agents") params.set("mode", next);
        else params.delete("mode");
        return params;
      },
      { replace: true },
    );
  };

  if (!selectedCompanyId) {
    return <EmptyState icon={History} message="Select a company to view activity." />;
  }

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList variant="line" className="w-full justify-start gap-1">
          <TabsTrigger value="all">Activity</TabsTrigger>
          <TabsTrigger value="agents">Agent actions</TabsTrigger>
        </TabsList>
      </Tabs>
      {mode === "agents" ? <AuditTab companyId={selectedCompanyId} /> : <Activity />}
    </div>
  );
}
