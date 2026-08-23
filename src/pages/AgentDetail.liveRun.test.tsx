// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LatestRunCard } from "./AgentDetail";
import { ThemeProvider } from "../context/ThemeContext";

vi.mock("@/lib/router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => <a href={to} {...props}>{children}</a>,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRun(overrides: any = {}) {
  return {
    id: "run-1",
    status: "succeeded",
    invocationSource: "manual",
    createdAt: "2026-08-22T08:00:00Z",
    resultJson: { summary: "Finished the release." },
    error: null,
    ...overrides,
  };
}

describe("LatestRunCard (AgentDetail.liveRun)", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
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

  function renderApp(runs: unknown[]) {
    root = createRoot(container);
    root.render(<ThemeProvider><LatestRunCard runs={runs as never} agentId="agent-1" /></ThemeProvider>);
  }

  async function flush() {
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
  }

  async function waitForText(substr: string, timeoutMs = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 10));
      if (container.textContent?.includes(substr)) return;
    }
    throw new Error(`Timed out waiting for: ${substr}; rendered: ${container.textContent}`);
  }

  it("renders nothing when there are no runs", async () => {
    renderApp([]);
    await flush();
    expect(container.textContent?.trim() ?? "").toBe("");
  });

  it("labels a running run as Live Run and links to its details", async () => {
    renderApp([makeRun({ id: "run-live", status: "running", createdAt: "2026-08-22T09:00:00Z" })]);
    await waitForText("Live Run");
    expect(container.textContent).toContain("running");
    expect(container.querySelector('a[href="/agents/agent-1/runs/run-live"]')).not.toBeNull();
  });

  it("prefers the live run over an older completed run", async () => {
    renderApp([
      makeRun({ id: "run-old", status: "succeeded", createdAt: "2026-08-22T07:00:00Z" }),
      makeRun({ id: "run-new", status: "running", createdAt: "2026-08-22T09:00:00Z" }),
    ]);
    await waitForText("Live Run");
    expect(container.querySelector('a[href="/agents/agent-1/runs/run-new"]')).not.toBeNull();
  });

  it("labels the latest completed run as Latest Run and extracts the summary", async () => {
    renderApp([
      makeRun({ id: "run-done", status: "succeeded", resultJson: { summary: "Release shipped." } }),
    ]);
    await waitForText("Latest Run");
    await waitForText("Release shipped.");
  });

  it("falls back to the error text when the run failed", async () => {
    renderApp([
      makeRun({ id: "run-failed", status: "failed", resultJson: null, error: "Agent crashed on boot" }),
    ]);
    await waitForText("Latest Run");
    await waitForText("Agent crashed on boot");
  });
});
