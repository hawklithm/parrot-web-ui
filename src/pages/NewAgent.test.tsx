// @vitest-environment jsdom

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewAgent } from "./NewAgent";
import { TooltipProvider } from "@/components/ui/tooltip";

interface MockCompany {
  selectedCompanyId: string | null;
}

const mockCompany = vi.hoisted<MockCompany>(() => ({
  selectedCompanyId: "company-1",
}));
const mockRouter = vi.hoisted(() => ({ navigate: vi.fn(), useSearchParams: () => [new URLSearchParams()] }));
const mockSetBreadcrumbs = vi.hoisted(() => vi.fn());
const mockAgentsApi = vi.hoisted(() => ({
  list: vi.fn().mockResolvedValue([]),
  hire: vi.fn().mockResolvedValue({ agent: { id: "agent-1" } }),
}));
const mockCompanySkillsApi = vi.hoisted(() => ({
  list: vi.fn().mockResolvedValue([]),
}));
const mockProjectsApi = vi.hoisted(() => ({
  list: vi.fn().mockResolvedValue([]),
}));
const mockIssuesApi = vi.hoisted(() => ({
  list: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => mockRouter.navigate,
  useSearchParams: () => mockRouter.useSearchParams(),
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: mockCompany.selectedCompanyId }),
}));

vi.mock("../context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({ setBreadcrumbs: mockSetBreadcrumbs }),
}));

vi.mock("../api/agents", () => ({ agentsApi: mockAgentsApi }));
vi.mock("../api/companySkills", () => ({ companySkillsApi: mockCompanySkillsApi }));
vi.mock("../api/projects", () => ({ projectsApi: mockProjectsApi }));
vi.mock("../api/issues", () => ({ issuesApi: mockIssuesApi }));

vi.mock("../adapters/use-disabled-adapters", () => ({
  useDisabledAdaptersSync: () => new Set<string>(),
}));

vi.mock("../adapters/metadata", () => ({
  isValidAdapterType: (type: string) => ["claude_local", "codex_local", "gemini_local", "opencode_local"].includes(type),
}));

// Stub the AgentConfigForm so the dropdown doesn't require a populated adapter registry.
vi.mock("../components/AgentConfigForm", () => ({
  AgentConfigForm: () => <div data-testid="agent-config-form">Agent Config Form</div>,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function act(callback: () => void | Promise<void>) {
  await callback();
  await Promise.resolve();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function flushReact() {
  for (let i = 0; i < 3; i += 1) {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
}

function renderApp() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return { container, queryClient };
}

async function cleanup(container: HTMLDivElement) {
  document.body.removeChild(container);
}

describe("NewAgent", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCompany.selectedCompanyId = "company-1";
    mockAgentsApi.list.mockResolvedValue([]);
    mockCompanySkillsApi.list.mockResolvedValue([]);
    mockProjectsApi.list.mockResolvedValue([]);
    mockIssuesApi.list.mockResolvedValue([]);
    mockAgentsApi.hire.mockResolvedValue({ agent: { id: "agent-1" } });
  });

  afterEach(async () => {
    if (container) {
      await cleanup(container);
      container = null;
    }
  });

  it("renders the New Agent header and form fields", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    expect(c.textContent).toContain("New Agent");
    expect(c.textContent).toContain("Advanced agent configuration");
  });

  it("shows agent name and title input fields", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    const inputs = c.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    expect(inputs[0]?.placeholder).toBe("Agent name");
    expect(inputs[1]?.placeholder).toBe("Title (e.g. VP of Engineering)");
  });

  it("displays role button and reports-to section", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    expect(c.textContent).toContain("CEO");
  });

  it("renders the Trust Preset section", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    expect(c.textContent).toContain("Trust");
  });

  it("renders the Company Skills section heading", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    expect(c.textContent).toContain("Company skills");
  });

  it("shows cancel and create buttons in footer", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    expect(c.textContent).toContain("Cancel");
    expect(c.textContent).toContain("Create agent");
  });

  it("shows Test Agent button", async () => {
    const { container: c, queryClient } = renderApp();
    container = c;
    await act(async () => {
      createRoot(c).render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <NewAgent />
          </TooltipProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    expect(c.textContent).toContain("Test Agent");
  });
});
