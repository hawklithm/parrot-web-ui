// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../context/ToastContext";
import { WhatNeedsMe } from "./WhatNeedsMe";

const mockRouterState = vi.hoisted(() => ({ pathname: "/decisions", navigate: vi.fn() }));
const mockCompany = vi.hoisted<{ selectedCompanyId: string | null }>(() => ({ selectedCompanyId: "company-1" }));
const mockAttentionApi = vi.hoisted(() => ({ list: vi.fn() }));
const mockDecisionsApi = vi.hoisted(() => ({
  decide: vi.fn(),
  dismiss: vi.fn(),
  cancel: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@/lib/router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: mockRouterState.pathname, search: "", hash: "", state: null }),
  useNavigate: () => mockRouterState.navigate,
  useParams: () => ({}),
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: mockCompany.selectedCompanyId }),
}));

vi.mock("../api/attention", () => ({ attentionApi: mockAttentionApi }));
vi.mock("../api/decisions", () => ({ decisionsApi: mockDecisionsApi }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void> = undefined;
  flushSync(() => {
    result = callback();
  });
  await result;
}

async function flushReact() {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 10));
  });
}

async function waitForText(c: HTMLElement, substr: string, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (c.textContent?.includes(substr)) return;
    await flushReact();
  }
  throw new Error(`timeout waiting for "${substr}"; rendered: ${c.textContent}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDecisionItem(overrides: any = {}) {
  return {
    id: "att-1",
    companyId: "company-1",
    sourceKind: "decision",
    title: "Pick a database",
    summary: "Choose the persistence layer",
    href: null,
    subject: { id: "dec-1", title: "Pick a database", href: "/decisions/dec-1" },
    options: [
      { id: "opt-1", label: "Postgres" },
      { id: "opt-2", label: "MySQL" },
    ],
    ...overrides,
  };
}

describe("WhatNeedsMe (Decision page parity)", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockRouterState.pathname = "/decisions";
    mockRouterState.navigate.mockClear();
    mockCompany.selectedCompanyId = "company-1";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockAttentionApi.list.mockReset();
    mockDecisionsApi.decide.mockReset();
    mockDecisionsApi.dismiss.mockReset();
    mockDecisionsApi.cancel.mockReset();
    mockDecisionsApi.get.mockReset();
    mockDecisionsApi.list.mockReset();
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root!.unmount();
      });
    }
    container.remove();
  });

  function renderApp() {
    root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <WhatNeedsMe />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  it("shows the permission gate when no company is selected", async () => {
    mockCompany.selectedCompanyId = null;
    mockAttentionApi.list.mockResolvedValue({ items: [] });
    renderApp();
    await flushReact();
    await flushReact();
    expect(container.textContent).toContain("Select a company to view decisions.");
    expect(mockAttentionApi.list).not.toHaveBeenCalled();
  });

  it("shows a loading state while the feed is fetching", async () => {
    mockAttentionApi.list.mockReturnValue(new Promise(() => {}));
    renderApp();
    await flushReact();
    await flushReact();
    expect(container.textContent).toContain("Loading decisions…");
  });

  it("shows an error state when the feed fails to load", async () => {
    mockAttentionApi.list.mockRejectedValue(new Error("boom"));
    renderApp();
    await waitForText(container, "Unable to load decisions.");
  });

  it("shows an empty state when there are no items", async () => {
    mockAttentionApi.list.mockResolvedValue({ items: [] });
    renderApp();
    await waitForText(container, "Nothing needs your attention.");
  });

  it("lets a user decide on a decision option", async () => {
    mockAttentionApi.list.mockResolvedValue({ items: [makeDecisionItem()] });
    mockDecisionsApi.decide.mockResolvedValue({});
    renderApp();
    await waitForText(container, "Postgres");
    const decideBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Postgres"),
    );
    expect(decideBtn).toBeDefined();
    await act(async () => {
      decideBtn!.click();
      await flushReact();
    });
    expect(mockDecisionsApi.decide).toHaveBeenCalledWith("dec-1", "opt-1");
  });

  it("lets a user dismiss a decision", async () => {
    mockAttentionApi.list.mockResolvedValue({ items: [makeDecisionItem()] });
    mockDecisionsApi.dismiss.mockResolvedValue({});
    renderApp();
    await waitForText(container, "Dismiss");
    const dismissBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Dismiss"),
    );
    expect(dismissBtn).toBeDefined();
    await act(async () => {
      dismissBtn!.click();
      await flushReact();
    });
    expect(mockDecisionsApi.dismiss).toHaveBeenCalledWith("att-1");
  });
});
