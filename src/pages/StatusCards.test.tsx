// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusCards } from "./StatusCards";
import type { StatusCard } from "../api/statusCards";

const mockCompany = vi.hoisted<{ selectedCompanyId: string | null }>(() => ({ selectedCompanyId: "company-1" }));
const mockStatusCardsApi = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
  recompile: vi.fn(),
  revisions: vi.fn(),
}));

vi.mock("@/lib/router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: mockCompany.selectedCompanyId }),
}));

vi.mock("../api/statusCards", () => ({ statusCardsApi: mockStatusCardsApi }));

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
    if (c.textContent?.includes(substr)) return;
  }
  throw new Error(`Timed out waiting for text: ${substr}`);
}

const card: StatusCard = {
  id: "card-1",
  companyId: "company-1",
  title: "Release Status",
  interestPrompt: "Track the release train.",
  queries: [],
  refreshPolicy: { mode: "interval", minutes: 30 },
  state: "active",
  pendingChangeCount: 3,
  archivedAt: null,
  summaryMarkdown: "## Release\n\nAll green.",
  summaryCompiledAt: "2026-08-22T10:00:00Z",
  updatedAt: "2026-08-22T09:00:00Z",
};

describe("StatusCards", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockCompany.selectedCompanyId = "company-1";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
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
      <QueryClientProvider client={queryClient}><StatusCards /></QueryClientProvider>,
    );
    return container;
  }

  it("prompts for a company when none is selected and does not call the API", async () => {
    mockCompany.selectedCompanyId = null;
    const c = renderApp();
    await flush();
    expect(c.textContent).toContain("Select a company to view status cards.");
    expect(mockStatusCardsApi.list).not.toHaveBeenCalled();
  });

  it("shows loading, then the card tiles with the Paperclip shape", async () => {
    let resolveList: (value: StatusCard[]) => void = () => {};
    mockStatusCardsApi.list.mockReturnValue(new Promise<StatusCard[]>((resolve) => { resolveList = resolve; }));
    const c = renderApp();
    await flush();
    expect(c.textContent).toContain("Loading status cards…");
    await act(async () => resolveList([card]));
    await waitForText(c, "Release Status");
    expect(mockStatusCardsApi.list).toHaveBeenCalledWith("company-1", false);
    expect(c.textContent).toContain("active · updated");
    expect(c.textContent).toContain("3 changes");
    expect(c.textContent).toContain("All green.");
  });

  it("shows the empty state and an error state", async () => {
    mockStatusCardsApi.list.mockResolvedValue([]);
    const empty = renderApp();
    await waitForText(empty, "No status cards yet.");
    await act(async () => {
      root?.unmount();
      root = null;
    });

    mockStatusCardsApi.list.mockRejectedValue(new Error("boom"));
    const errored = renderApp();
    await waitForText(errored, "Unable to load status cards.");
  });

  it("creates a card from the new-card form", async () => {
    mockStatusCardsApi.list.mockResolvedValue([]);
    mockStatusCardsApi.create.mockResolvedValue({ ...card, id: "card-new" });
    const c = renderApp();
    await waitForText(c, "No status cards yet.");
    const button = [...c.querySelectorAll("button")].find((b) => b.textContent?.includes("New card"));
    await act(async () => button?.click());
    await flush();
    const inputs = c.querySelectorAll("input, textarea");
    const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const areaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set!;
    inputSetter.call(inputs[0], "Ship Tracker");
    inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    areaSetter.call(inputs[1], "Watch the ships.");
    inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    const createButton = [...c.querySelectorAll("button")].find((b) => b.textContent?.includes("Create status card"));
    await act(async () => createButton?.click());
    await flush();
    expect(mockStatusCardsApi.create).toHaveBeenCalledWith("company-1", {
      title: "Ship Tracker",
      interestPrompt: "Watch the ships.",
    });
  });

  it("refreshes and archives from the tile actions", async () => {
    mockStatusCardsApi.list.mockResolvedValue([card]);
    mockStatusCardsApi.refresh.mockResolvedValue(card);
    mockStatusCardsApi.update.mockResolvedValue({ ...card, archivedAt: "2026-08-22T11:00:00Z" });
    const c = renderApp();
    await waitForText(c, "Release Status");
    const buttons = [...c.querySelectorAll("button")];
    const refreshButton = buttons.find((b) => b.textContent?.includes("Refresh"));
    await act(async () => refreshButton?.click());
    await flush();
    expect(mockStatusCardsApi.refresh).toHaveBeenCalledWith("card-1");
    const archiveButton = [...c.querySelectorAll("button")].find((b) => b.textContent?.includes("Archive"));
    await act(async () => archiveButton?.click());
    await flush();
    expect(mockStatusCardsApi.update).toHaveBeenCalledWith("card-1", { archived: true });
  });

  it("opens detail revisions, saves settings, and switches to archived cards", async () => {
    mockStatusCardsApi.list.mockResolvedValue([card]);
    mockStatusCardsApi.revisions.mockResolvedValue([
      { id: "revision-1", markdown: "Release is green.", createdAt: "2026-08-22T10:00:00Z" },
    ]);
    mockStatusCardsApi.update.mockResolvedValue(card);
    const c = renderApp();
    await waitForText(c, "Release Status");

    const cardButton = [...c.querySelectorAll("button")].find((button) => button.textContent?.includes("Release Status"));
    await act(async () => cardButton?.click());
    await waitForText(c, "Revision History");
    expect(mockStatusCardsApi.revisions).toHaveBeenCalledWith("card-1");
    expect(c.querySelector('[role="dialog"]')?.getAttribute("aria-label")).toBe("Release Status details");

    const closeButton = c.querySelector<HTMLButtonElement>('button[aria-label="Close status card details"]');
    await act(async () => closeButton?.click());
    expect(c.querySelector('[role="dialog"]')).toBeNull();

    const settingsButton = c.querySelector<HTMLButtonElement>('button[aria-label="Edit status card settings"]');
    await act(async () => settingsButton?.click());
    const settingsInputs = c.querySelectorAll("article input, article textarea");
    const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const areaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set!;
    inputSetter.call(settingsInputs[0], "Updated title");
    settingsInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    areaSetter.call(settingsInputs[1], "Updated prompt");
    settingsInputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    const saveButton = [...c.querySelectorAll("button")].find((button) => button.textContent === "Save");
    await act(async () => saveButton?.click());
    await flush();
    expect(mockStatusCardsApi.update).toHaveBeenCalledWith("card-1", {
      title: "Updated title",
      interestPrompt: "Updated prompt",
    });

    const archivedToggle = [...c.querySelectorAll("button")].find((button) => button.textContent?.includes("Show archived"));
    mockStatusCardsApi.list.mockResolvedValue([]);
    await act(async () => archivedToggle?.click());
    await waitForText(c, "No archived status cards.");
    expect(mockStatusCardsApi.list).toHaveBeenLastCalledWith("company-1", true);
  });
});
