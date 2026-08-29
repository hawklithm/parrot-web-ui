// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAdapterCapabilities } from "./use-adapter-capabilities";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockList = vi.hoisted(() => vi.fn());

vi.mock("@/api/adapters", () => ({
  adaptersApi: { list: mockList },
}));

function CapabilityProbe({ types }: { types: string[] }) {
  const getCapabilities = useAdapterCapabilities();

  return (
    <output>
      {types.map((type) => `${type}:${getCapabilities(type).supportsAcp ? "acp" : "no-acp"}`).join("|")}
    </output>
  );
}

function renderProbe(types: string[]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <CapabilityProbe types={types} />
      </QueryClientProvider>,
    );
  });

  return { container, root };
}

describe("useAdapterCapabilities", () => {
  let roots: Root[] = [];

  beforeEach(() => {
    mockList.mockReset();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => {
        root.unmount();
      });
    }
    roots = [];
    document.body.innerHTML = "";
  });

  it("uses known built-in capabilities while the server listing is loading", () => {
    mockList.mockReturnValue(new Promise(() => undefined));

    const rendered = renderProbe(["claude_local", "gemini_local", "unknown"]);
    roots.push(rendered.root);

    expect(rendered.container.textContent).toBe(
      "claude_local:acp|gemini_local:acp|unknown:no-acp",
    );
  });

  it("uses server capabilities after the adapter listing resolves", async () => {
    mockList.mockResolvedValue([
      {
        type: "claude_local",
        label: "Claude",
        source: "builtin",
        modelsCount: 1,
        loaded: true,
        disabled: false,
        capabilities: {
          supportsInstructionsBundle: true,
          supportsSkills: true,
          supportsLocalAgentJwt: true,
          requiresMaterializedRuntimeSkills: false,
          supportsModelProfiles: true,
          supportsAcp: false,
        },
      },
    ]);

    const rendered = renderProbe(["claude_local", "codex_local"]);
    roots.push(rendered.root);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(rendered.container.textContent).toBe("claude_local:no-acp|codex_local:acp");
  });
});
