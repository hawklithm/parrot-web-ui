// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewAgentDialog } from "./NewAgentDialog";

const mockDialog = vi.hoisted(() => ({
  newAgentOpen: true,
  closeNewAgent: vi.fn(),
  openNewIssue: vi.fn(),
}));
const mockCompany = vi.hoisted<{ selectedCompanyId: string | null }>(() => ({ selectedCompanyId: "company-1" }));
const mockToast = vi.hoisted(() => ({ pushToast: vi.fn() }));
const mockRouter = vi.hoisted(() => ({ navigate: vi.fn() }));
const mockAdaptersApi = vi.hoisted(() => ({ list: vi.fn() }));
const mockAgentsApi = vi.hoisted(() => ({ list: vi.fn() }));
const mockAccessApi = vi.hoisted(() => ({
  createCompanyInvite: vi.fn(),
  getInviteOnboarding: vi.fn(),
}));

vi.mock("@/lib/router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockRouter.navigate,
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: mockCompany.selectedCompanyId }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => mockToast,
}));

vi.mock("../context/DialogContext", () => ({
  useDialog: () => mockDialog,
}));

vi.mock("../api/adapters", () => ({ adaptersApi: mockAdaptersApi }));
vi.mock("../api/agents", () => ({ agentsApi: mockAgentsApi }));
vi.mock("../api/access", () => ({ accessApi: mockAccessApi }));

vi.mock("../adapters/use-disabled-adapters", () => ({
  useDisabledAdaptersSync: () => new Set<string>(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void> = undefined;
  flushSync(() => {
    result = callback();
  });
  await result;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

async function waitForText(c: HTMLElement, substr: string, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    if (c.textContent?.includes(substr) || document.body.textContent?.includes(substr)) return;
  }
  throw new Error(`Timed out waiting for text: ${substr}; rendered: ${c.textContent}`);
}

describe("NewAgentDialog", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockDialog.newAgentOpen = true;
    mockDialog.closeNewAgent.mockClear();
    mockDialog.openNewIssue.mockClear();
    mockRouter.navigate.mockClear();
    mockToast.pushToast.mockClear();
    mockAdaptersApi.list.mockReset();
    mockAgentsApi.list.mockReset();
    mockAccessApi.createCompanyInvite.mockReset();
    mockAccessApi.getInviteOnboarding.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root!.unmount();
      });
    }
    container.remove();
    document.body.innerHTML = "";
  });

  function renderApp() {
    root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}><NewAgentDialog /></QueryClientProvider>,
    );
    return container;
  }

  it("shows the three creation choices when open", async () => {
    mockAdaptersApi.list.mockResolvedValue([]);
    mockAgentsApi.list.mockResolvedValue([]);
    const c = renderApp();
    await waitForText(c, "Ask the CEO to create a new agent");
    expect(document.body.textContent).toContain("Configure a runtime manually");
    expect(document.body.textContent).toContain("Invite an external agent");
  });

  it("asks the CEO: opens a new issue for the CEO agent with the description", async () => {
    mockAdaptersApi.list.mockResolvedValue([]);
    mockAgentsApi.list.mockResolvedValue([
      { id: "ceo-1", name: "CEO", role: "ceo" },
      { id: "worker-1", name: "Worker", role: "general" },
    ]);
    const c = renderApp();
    await waitForText(c, "Ask the CEO to create a new agent");
    const ceoButton = [...document.body.querySelectorAll("button")].find((b) => b.textContent?.includes("Ask the CEO"));
    await act(async () => ceoButton?.click());
    await flush();
    const textarea = document.body.querySelector("textarea");
    expect(textarea).not.toBeNull();
    const areaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set!;
    areaSetter.call(textarea, "Hire a senior reviewer");
    textarea!.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    const submit = [...document.body.querySelectorAll("button")].find((b) => b.textContent?.includes("Create task") || b.textContent?.includes("Send to CEO"));
    await act(async () => submit?.click());
    await flush();
    expect(mockDialog.openNewIssue).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeAgentId: "ceo-1", title: "Create a new agent" }),
    );
    const { assigneeAgentId, title, description } = mockDialog.openNewIssue.mock.calls[0][0];
    expect(description).toContain("Hire a senior reviewer");
  });

  it("invites an external agent: creates the invite and shows the onboarding prompt", async () => {
    mockAdaptersApi.list.mockResolvedValue([]);
    mockAgentsApi.list.mockResolvedValue([]);
    mockAccessApi.createCompanyInvite.mockResolvedValue({
      token: "tok-123",
      onboardingTextPath: "/api/invites/tok-123/onboarding.txt",
    });
    mockAccessApi.getInviteOnboarding.mockResolvedValue({
      onboarding: { connectivity: { connectionCandidates: [] }, testResolutionEndpoint: null },
    });
    const c = renderApp();
    await waitForText(c, "Invite an external agent");
    const inviteButton = [...document.body.querySelectorAll("button")].find((b) => b.textContent?.includes("Invite an external agent"));
    await act(async () => inviteButton?.click());
    await flush();
    const textarea = document.body.querySelector("textarea");
    expect(textarea).not.toBeNull();
    const areaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set!;
    areaSetter.call(textarea, "Join via the invite API");
    textarea!.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    const submit = [...document.body.querySelectorAll("button")].find((b) => b.textContent?.includes("Generate onboarding prompt"));
    await act(async () => submit?.click());
    await flush();
    expect(mockAccessApi.createCompanyInvite).toHaveBeenCalledWith("company-1", {
      allowedJoinTypes: "agent",
      humanRole: null,
      agentMessage: "Join via the invite API",
    });
    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Agent invite created" }),
    );
  });
});
