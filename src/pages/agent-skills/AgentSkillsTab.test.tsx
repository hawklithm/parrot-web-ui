// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Agent } from "../../lib/paperclip-shared/src";
import { AgentSkillsTab } from "./AgentSkillsTab";

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void> = undefined;
  flushSync(() => {
    result = callback();
  });
  await result;
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

const skillsMock = vi.fn<(agentId: string, companyId?: string) => Promise<unknown>>();
const syncSkillsMock = vi.fn<(agentId: string, desired: string[], companyId?: string) => Promise<unknown>>();
const companySkillsListMock = vi.fn<(companyId: string) => Promise<unknown[]>>();

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/agents/agent-1", search: "", hash: "" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("../../api/agents", () => ({
  agentsApi: {
    skills: (agentId: string, companyId?: string) => skillsMock(agentId, companyId),
    syncSkills: (agentId: string, desired: string[], companyId?: string) =>
      syncSkillsMock(agentId, desired, companyId),
  },
}));

vi.mock("../../api/companySkills", () => ({
  companySkillsApi: {
    list: (companyId: string) => companySkillsListMock(companyId),
  },
}));

vi.mock("./AgentSkillRow", () => ({
  AgentSkillRow: (props: {
    data: { key: string };
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (next: boolean) => void;
  }) => (
    <label data-testid={`skill-row-${props.data.key}`}>
      <input
        type="checkbox"
        checked={Boolean(props.checked)}
        disabled={Boolean(props.disabled)}
        onChange={(event) => props.onCheckedChange?.(event.target.checked)}
      />
      {props.data.key}
    </label>
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const agentFixture = {
  id: "agent-1",
  urlKey: "agent-1",
  adapterType: "codex_local",
  name: "Worker",
  adapterConfig: {},
} as unknown as Agent;

function skillFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "skill-1",
    key: "docs.read",
    slug: "docs-read",
    name: "Docs",
    description: "Read docs",
    tagline: null,
    categories: ["docs"],
    authorName: null,
    sourceLabel: "catalog",
    ...overrides,
  };
}

describe("AgentSkillsTab", () => {
  let container: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    skillsMock.mockReset();
    syncSkillsMock.mockReset();
    companySkillsListMock.mockReset();
    skillsMock.mockResolvedValue({
      mode: "managed",
      desiredSkills: ["docs.read"],
      entries: [{ key: "docs.read", runtimeName: "docs.read" }],
    });
    syncSkillsMock.mockImplementation(async (_agentId, desired) => ({
      mode: "managed",
      desiredSkills: desired,
      entries: [],
    }));
    companySkillsListMock.mockResolvedValue([skillFixture()]);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  async function renderTab(companyId = "company-1") {
    const root = createRoot(container);
    await act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AgentSkillsTab agent={agentFixture} companyId={companyId} />
        </QueryClientProvider>,
      );
    });
    await flush();
  }

  it("renders enabled and available skills from the company library", async () => {
    companySkillsListMock.mockResolvedValue([
      skillFixture(),
      skillFixture({ key: "web.search", id: "skill-2", slug: "web-search", name: "Web search" }),
    ]);
    await renderTab();

    // docs.read is enabled (checked), web.search is available (unchecked).
    const enabledRow = container.querySelector<HTMLInputElement>('[data-testid="skill-row-docs.read"] input');
    expect(enabledRow).not.toBeNull();
    expect(enabledRow?.checked).toBe(true);
    const availableRow = container.querySelector<HTMLInputElement>('[data-testid="skill-row-web.search"] input');
    expect(availableRow).not.toBeNull();
    expect(availableRow?.checked).toBe(false);
    expect(container.textContent).toContain("Enabled on this agent");
    expect(container.textContent).toContain("Available from the library");
  });

  it("shows the empty-library call to action when the library has no skills", async () => {
    companySkillsListMock.mockResolvedValue([]);
    skillsMock.mockResolvedValue({
      mode: "managed",
      desiredSkills: [],
      entries: [],
    });
    await renderTab();
    expect(container.textContent).toContain("No skills in the company library");
  });

  it("shows the unsupported adapter banner", async () => {
    skillsMock.mockResolvedValue({ mode: "unsupported", desiredSkills: [], entries: [] });
    const unsupportedAgent = { ...agentFixture, adapterType: "custom_acp" } as unknown as Agent;
    const root = createRoot(container);
    await act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AgentSkillsTab agent={unsupportedAgent} companyId="company-1" />
        </QueryClientProvider>,
      );
    });
    await flush();
    expect(container.textContent).toContain("cannot manage skills");
    await act(() => root.unmount());
  });

  it("renders the search control and delegates filtering to filterAgentSkills", async () => {
    companySkillsListMock.mockResolvedValue([
      skillFixture(),
      skillFixture({ key: "web.search", id: "skill-2", slug: "web-search", name: "Web search" }),
    ]);
    await renderTab();
    const searchInput = container.querySelector<HTMLInputElement>('input[aria-label="Search skills"]');
    expect(searchInput).not.toBeNull();
    // The search input wires the page's search state; the filtering predicate
    // itself is unit-tested in agent-skill-filter.test.ts.
    expect(searchInput?.getAttribute("placeholder")).toBe("Search skills");
  });

  it("autosaves a toggled skill through syncSkills", async () => {
    companySkillsListMock.mockResolvedValue([
      skillFixture(),
      skillFixture({ key: "web.search", id: "skill-2", slug: "web-search", name: "Web search" }),
    ]);
    await renderTab();

    const availableRow = container.querySelector<HTMLInputElement>('[data-testid="skill-row-web.search"] input');
    await act(() => {
      availableRow?.click();
    });
    // Let the 250ms autosave debounce fire (real timers).
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    await flush();
    expect(syncSkillsMock).toHaveBeenCalledWith(
      "agent-1",
      ["docs.read", "web.search"],
      "company-1",
    );
  });
});
