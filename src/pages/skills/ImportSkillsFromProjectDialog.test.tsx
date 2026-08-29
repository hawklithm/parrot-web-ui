// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanySkill, CompanySkillProjectScanResult } from "../../lib/paperclip-shared/src";
import { ImportSkillsFromProjectDialog } from "./ImportSkillsFromProjectDialog";

const mockCompanySkillsApi = vi.hoisted(() => ({ scanProjects: vi.fn() }));

vi.mock("../../api/companySkills", () => ({ companySkillsApi: mockCompanySkillsApi }));

vi.mock("../../components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void> = undefined;
  flushSync(() => {
    result = callback();
  });
  await result;
}

async function waitForText(container: HTMLElement, text: string, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (container.textContent?.includes(text)) return;
    await new Promise((resolve) => window.setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

const candidate = {
  slug: "review",
  name: "Review",
  description: "Review changes carefully.",
  workspaceId: "11111111-1111-4111-8111-111111111111",
  workspaceName: "Primary",
  projectId: "22222222-2222-4222-8222-222222222222",
  projectName: "Parrot",
  directoryRoot: ".codex/skills",
  relativePath: ".codex/skills/review",
  status: "new" as const,
};

const baseResult: CompanySkillProjectScanResult = {
  scannedProjects: 1,
  scannedWorkspaces: 1,
  discovered: 2,
  imported: [],
  updated: [],
  skipped: [],
  conflicts: [{
    slug: "deploy",
    key: "local/deploy",
    projectId: candidate.projectId,
    projectName: candidate.projectName,
    workspaceId: candidate.workspaceId,
    workspaceName: candidate.workspaceName,
    path: ".codex/skills/deploy",
    existingSkillId: "33333333-3333-4333-8333-333333333333",
    existingSkillKey: "company/deploy",
    existingSourceLocator: null,
    reason: "Slug deploy is already in use.",
  }],
  candidates: [candidate],
  warnings: [],
};

describe("ImportSkillsFromProjectDialog", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
    }
    container.remove();
    document.body.innerHTML = "";
  });

  function renderDialog() {
    root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}>
        <ImportSkillsFromProjectDialog companyId="company-1" open onClose={() => undefined} />
      </QueryClientProvider>,
    );
    return container;
  }

  it("previews candidates, exposes conflicts, and imports the selected paths", async () => {
    const importedSkill = { id: "44444444-4444-4444-8444-444444444444", name: "Review" } as CompanySkill;
    mockCompanySkillsApi.scanProjects
      .mockResolvedValueOnce(baseResult)
      .mockResolvedValueOnce({ ...baseResult, candidates: [], conflicts: [], imported: [importedSkill] });

    renderDialog();
    await waitForText(document.body, "Scan workspaces");
    const scanButton = [...document.body.querySelectorAll("button")].find((button) => button.textContent?.includes("Scan workspaces"));
    expect(scanButton).toBeDefined();
    await act(async () => scanButton!.click());
    await waitForText(document.body, "New skill files (1)");
    expect(document.body.textContent).toContain("Slug deploy is already in use.");

    const importButton = [...document.body.querySelectorAll("button")].find((button) => button.textContent?.includes("Import selected (1)"));
    expect(importButton).toBeDefined();
    await act(async () => importButton?.click());
    await waitForText(document.body, "Imported");

    expect(mockCompanySkillsApi.scanProjects).toHaveBeenNthCalledWith(1, "company-1", { mode: "preview" });
    expect(mockCompanySkillsApi.scanProjects).toHaveBeenNthCalledWith(2, "company-1", {
      mode: "import",
      selection: [{
        workspaceId: candidate.workspaceId,
        path: candidate.relativePath,
        slug: candidate.slug,
      }],
    });
    expect(document.body.textContent).toContain("Review");
  });

  it("does not allow importing until at least one new candidate is selected", async () => {
    mockCompanySkillsApi.scanProjects.mockResolvedValueOnce(baseResult);
    renderDialog();
    await waitForText(document.body, "Scan workspaces");
    const scanButton = [...document.body.querySelectorAll("button")].find((button) => button.textContent?.includes("Scan workspaces"));
    expect(scanButton).toBeDefined();
    await act(async () => scanButton!.click());
    await waitForText(document.body, "New skill files (1)");

    const checkbox = document.body.querySelector<HTMLElement>("[role=checkbox]");
    expect(checkbox).toBeDefined();
    await act(async () => checkbox!.click());
    const importButton = [...document.body.querySelectorAll("button")].find((button) => button.textContent?.includes("Import selected (0)"));
    expect(importButton).toBeDefined();
    expect(importButton?.disabled).toBe(true);
    expect(mockCompanySkillsApi.scanProjects).toHaveBeenCalledTimes(1);
  });
});
