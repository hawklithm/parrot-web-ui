// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SecretProposalView } from "../../lib/paperclip-shared/src";
import { SecretProposalsTab } from "./SecretProposalsTab";

const proposalApi = vi.hoisted(() => ({
  list: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
}));

vi.mock("../../api/secretProposals", () => ({ secretProposalsApi: proposalApi }));

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void> = undefined;
  flushSync(() => {
    result = callback();
  });
  await result;
}

async function waitForText(text: string, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (document.body.textContent?.includes(text)) return;
    await new Promise((resolve) => window.setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

function makeProposal(overrides: Partial<SecretProposalView> = {}): SecretProposalView {
  return {
    id: "proposal-1",
    companyId: "company-1",
    kind: "secret",
    status: "pending",
    justification: "The deploy worker needs this value.",
    proposedName: "Deploy token",
    proposedKey: "deploy-token",
    proposedDescription: "Deployment credential",
    valueFingerprintSha256: "fingerprint",
    valueLength: 12,
    secretId: null,
    secretName: null,
    secretProposalId: null,
    secretProposalName: null,
    targetType: null,
    target: null,
    configPath: null,
    proposedBy: { id: "agent-1", name: "Deploy agent", icon: null },
    originIssue: { id: "issue-1", key: "PAR-1", title: "Deploy" },
    originRunId: "run-1",
    expiresAt: "2026-09-12T00:00:00.000Z",
    createdAt: "2026-08-29T00:00:00.000Z",
    resolvedByUserId: null,
    resolvedAt: null,
    resolutionReason: null,
    createdSecretId: null,
    appliedBindingConfigPath: null,
    viewerCanApprove: true,
    approveBlockReason: null,
    ...overrides,
  };
}

describe("SecretProposalsTab", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (root) await act(() => root?.unmount());
    container.remove();
    document.body.innerHTML = "";
  });

  function renderTab() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}>
        <SecretProposalsTab companyId="company-1" />
      </QueryClientProvider>,
    );
  }

  it("lists proposals, filters every terminal status, and cascades dependent binding approval", async () => {
    const secret = makeProposal();
    const binding = makeProposal({
      id: "proposal-2",
      kind: "binding",
      proposedName: null,
      proposedKey: null,
      secretProposalId: "proposal-1",
      secretProposalName: "Deploy token",
      targetType: "agent",
      target: { id: "agent-2", name: "Runtime agent", icon: null },
      configPath: "env.DEPLOY_TOKEN",
    });
    proposalApi.list.mockImplementation(async (_companyId: string, params?: { status?: string }) =>
      params?.status === "expired" ? [makeProposal({ id: "expired-1", status: "expired" })] : [secret, binding]);
    proposalApi.approve.mockResolvedValue(binding);

    renderTab();
    await waitForText("Deploy token");
    expect(document.body.textContent).toContain("Runtime agent");

    const expiredButton = [...document.querySelectorAll("button")]
      .find((button) => button.textContent?.trim() === "Expired");
    await act(() => expiredButton?.click());
    await waitForText("Expired");
    expect(proposalApi.list).toHaveBeenLastCalledWith("company-1", { status: "expired" });

    const pendingButton = [...document.querySelectorAll("button")]
      .find((button) => button.textContent?.trim() === "Pending");
    await act(() => pendingButton?.click());
    await waitForText("Runtime agent");
    const approveButtons = [...document.querySelectorAll("button")]
      .filter((button) => button.textContent?.trim() === "Approve");
    await act(() => approveButtons[1]?.click());
    expect(proposalApi.approve).toHaveBeenCalledWith("company-1", "proposal-2", { cascade: true });
  });

  it("sends a rejection reason and renders action failures", async () => {
    const proposal = makeProposal();
    proposalApi.list.mockResolvedValue([proposal]);
    proposalApi.reject.mockRejectedValue(new Error("Proposal is no longer pending"));
    vi.stubGlobal("prompt", vi.fn(() => "Not approved by security"));

    renderTab();
    await waitForText("Deploy token");
    const rejectButton = [...document.querySelectorAll("button")]
      .find((button) => button.textContent?.trim() === "Reject");
    await act(() => rejectButton?.click());
    await waitForText("Proposal is no longer pending");
    expect(proposalApi.reject).toHaveBeenCalledWith("company-1", "proposal-1", {
      reason: "Not approved by security",
    });
  });

  it("renders a useful load error", async () => {
    proposalApi.list.mockRejectedValue(new Error("Board access denied"));
    renderTab();
    await waitForText("Board access denied");
    expect(document.querySelector("[role=alert]")?.textContent).toContain("Board access denied");
  });
});
