// @vitest-environment jsdom

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyActivity } from "./CompanyActivity";

const selectedCompanyId = vi.hoisted(() => ({ value: "company-1" as string | null }));
const searchValue = vi.hoisted(() => ({ value: "" }));
const setSearchParamsMock = vi.hoisted(() => vi.fn());

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: selectedCompanyId.value }),
}));

vi.mock("@/lib/router", () => ({
  useSearchParams: () => [new URLSearchParams(searchValue.value), setSearchParamsMock],
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    onValueChange,
  }: {
    children: ReactNode;
    onValueChange?: (value: string) => void;
  }) => (
    <div
      onClick={(event) => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tab-value]");
        if (target) onValueChange?.(target.dataset.tabValue ?? "");
      }}
    >
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ value, children }: { value: string; children: ReactNode }) => (
    <button type="button" data-tab-value={value}>
      {children}
    </button>
  ),
}));

vi.mock("./Activity", () => ({
  Activity: () => <div data-testid="company-activity-feed">Company activity feed</div>,
}));

vi.mock("./tools/AuditTab", () => ({
  AuditTab: ({ companyId }: { companyId: string }) => (
    <div data-testid="agent-audit-feed">Agent audit for {companyId}</div>
  ),
}));

vi.mock("../components/EmptyState", () => ({
  EmptyState: ({ message }: { message: string }) => <div>{message}</div>,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("CompanyActivity", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    selectedCompanyId.value = "company-1";
    searchValue.value = "";
    setSearchParamsMock.mockReset();
  });

  afterEach(() => {
    flushSync(() => root?.unmount());
    container.remove();
  });

  function render() {
    root = createRoot(container);
    flushSync(() => root.render(<CompanyActivity />));
  }

  it("renders the all-company activity feed by default", () => {
    render();

    expect(container.querySelector('[data-testid="company-activity-feed"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="agent-audit-feed"]')).toBeNull();
    expect(container.textContent).toContain("Agent actions");
  });

  it("uses the agents deep-link mode and keeps the company scope", () => {
    searchValue.value = "mode=agents";
    render();

    expect(container.querySelector('[data-testid="agent-audit-feed"]')?.textContent).toBe(
      "Agent audit for company-1",
    );
    expect(container.querySelector('[data-testid="company-activity-feed"]')).toBeNull();
  });

  it("writes a replace-mode deep link when switching scopes", () => {
    render();
    const agentTab = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Agent actions",
    );
    expect(agentTab).not.toBeNull();
    agentTab?.click();

    expect(setSearchParamsMock).toHaveBeenCalledWith(expect.any(Function), { replace: true });
    const update = setSearchParamsMock.mock.calls[0]?.[0] as (current: URLSearchParams) => URLSearchParams;
    expect(update(new URLSearchParams())).toEqual(new URLSearchParams("mode=agents"));
  });

  it("keeps the no-company empty state", () => {
    selectedCompanyId.value = null;
    render();

    expect(container.textContent).toContain("Select a company to view activity.");
  });
});
