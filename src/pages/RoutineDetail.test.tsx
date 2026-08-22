// @vitest-environment jsdom

import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoutineDetail } from "./RoutineDetail";
import type { RoutineDetail as RoutineDetailType } from "../lib/paperclip-shared/src";

let currentParams: Record<string, string> = { routineId: "routine-1", section: "overview" };

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

const navigateMock = vi.fn();
const routinesGetMock = vi.fn<(id: string) => Promise<RoutineDetailType>>();
const listRunsMock = vi.fn<(id: string) => Promise<unknown[]>>();
const activityMock = vi.fn<(companyId: string, id: string, ids: unknown) => Promise<unknown[]>>();
const runMock = vi.fn<(id: string, input: unknown) => Promise<unknown>>();
const updateMock = vi.fn();
const createTriggerMock = vi.fn<(id: string, input: unknown) => Promise<unknown>>();
const updateTriggerMock = vi.fn<(id: string, patch: unknown) => Promise<unknown>>();
const deleteTriggerMock = vi.fn<(id: string) => Promise<unknown>>();
const rotateTriggerMock = vi.fn<(id: string) => Promise<unknown>>();
const heartbeatsLiveRunsMock = vi.fn(async () => []);

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Navigate: () => null,
  useParams: () => currentParams,
  useNavigate: () => navigateMock,
  useLocation: () => ({ pathname: "/routines/routine-1", search: "", hash: "" }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: "company-1" }),
}));

vi.mock("../context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("../context/ToastContext", () => ({
  useToastActions: () => ({ pushToast: vi.fn() }),
}));

vi.mock("../api/routines", () => ({
  routinesApi: {
    get: (id: string) => routinesGetMock(id),
    listRuns: (id: string) => listRunsMock(id),
    activity: (companyId: string, id: string, ids: unknown) => activityMock(companyId, id, ids),
    run: (id: string, input: unknown) => runMock(id, input),
    update: (id: string, patch: unknown) => updateMock(id, patch),
    createTrigger: (id: string, input: unknown) => createTriggerMock(id, input),
    updateTrigger: (id: string, patch: unknown) => updateTriggerMock(id, patch),
    deleteTrigger: (id: string) => deleteTriggerMock(id),
    rotateTriggerSecret: (id: string) => rotateTriggerMock(id),
  },
}));

vi.mock("../api/heartbeats", () => ({
  heartbeatsApi: { liveRunsForIssue: () => heartbeatsLiveRunsMock() },
}));

vi.mock("../api/agents", () => ({
  agentsApi: { list: vi.fn(async () => []) },
}));

vi.mock("../api/projects", () => ({
  projectsApi: { list: vi.fn(async () => []) },
}));

vi.mock("../api/access", () => ({
  accessApi: { listUserDirectory: vi.fn(async () => []) },
}));

vi.mock("../api/secrets", () => ({
  secretsApi: { list: vi.fn(async () => []), create: vi.fn() },
}));

vi.mock("../components/AgentActionButtons", () => ({
  RunButton: (props: { onClick: () => void; disabled?: boolean }) => (
    <button data-testid="run-button" onClick={props.onClick} disabled={props.disabled}>
      Run now
    </button>
  ),
}));

vi.mock("../components/RoutineRunVariablesDialog", () => ({
  RoutineRunVariablesDialog: (props: {
    open: boolean;
    onSubmit: (data: Record<string, unknown>) => void;
    isPending?: boolean;
  }) =>
    props.open ? (
      <div data-testid="run-dialog">
        <button
          data-testid="run-dialog-submit"
          disabled={props.isPending}
          onClick={() => props.onSubmit({ variables: { target: "staging" } })}
        >
          Submit run
        </button>
      </div>
    ) : null,
}));

vi.mock("../components/MarkdownEditor", () => ({
  MarkdownEditor: () => <div data-testid="markdown-editor" />,
}));

vi.mock("../components/RoutineSaveBar", () => ({
  RoutineSaveBar: () => <div data-testid="save-bar" />,
}));

vi.mock("../components/ScheduleEditor", () => ({
  ScheduleEditor: () => <div data-testid="schedule-editor" />,
  getScheduleCronValidation: () => ({ valid: true, error: null }),
}));

vi.mock("../components/RoutineTriggerCard", () => ({
  RoutineTriggerCard: ({ trigger }: { trigger: { id: string; name?: string; kind?: string } }) => (
    <div data-testid="trigger-card">{trigger.name ?? trigger.kind ?? trigger.id}</div>
  ),
}));

vi.mock("../components/RoutineSubSidebar", () => ({
  RoutineSubSidebar: ({
    activeSection,
    onNavigate,
  }: {
    activeSection: string;
    onNavigate: (section: string) => void;
  }) => (
    <nav data-testid="section-nav" aria-label="Routine sections">
      {["overview", "triggers", "variables", "secrets", "delivery", "runs", "activity", "history"].map(
        (section) => (
          <button
            key={section}
            data-testid={`section-${section}`}
            onClick={() => onNavigate(section)}
            aria-current={activeSection === section ? "page" : undefined}
          >
            {section}
          </button>
        ),
      )}
    </nav>
  ),
  RoutineSectionPicker: () => null,
}));

function createRoutine(overrides: Partial<RoutineDetailType> = {}): RoutineDetailType {
  return {
    id: "routine-1",
    companyId: "company-1",
    title: "Release cut",
    description: "Cut the release.",
    projectId: null,
    assigneeAgentId: null,
    priority: "medium",
    concurrencyPolicy: "coalesce_if_active",
    catchUpPolicy: "skip_missed",
    variables: [],
    env: null,
    triggers: [
      {
        id: "trigger-1",
        kind: "schedule",
        cronExpression: "0 9 * * *",
        name: "Daily cut",
        enabled: true,
        replayWindowSec: null,
        signingMode: null,
        payload: null,
      },
    ],
    activeIssue: null,
    managedByPlugin: null,
    status: "active",
    lastRun: null,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    ...overrides,
  } as unknown as RoutineDetailType;
}

describe("RoutineDetail page", () => {
  let container: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    currentParams = { routineId: "routine-1", section: "overview" };
    navigateMock.mockReset();
    routinesGetMock.mockReset();
    listRunsMock.mockReset();
    activityMock.mockReset();
    runMock.mockReset();
    updateMock.mockReset();
    createTriggerMock.mockReset();
    updateTriggerMock.mockReset();
    deleteTriggerMock.mockReset();
    rotateTriggerMock.mockReset();
    routinesGetMock.mockResolvedValue(createRoutine());
    listRunsMock.mockResolvedValue([]);
    activityMock.mockResolvedValue([]);
    localStorage.clear();
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
  });

  async function renderPage() {
    const root = createRoot(container);
    await act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <RoutineDetail />
        </QueryClientProvider>,
      );
    });
    await flush();
  }

  it("loads the routine, shows the title, section navigation and run control", async () => {
    await renderPage();
    const title = container.querySelector<HTMLTextAreaElement>('[data-autosize-title]');
    expect(title?.value).toBe("Release cut");
    expect(container.querySelector('[data-testid="run-button"]')).not.toBeNull();
    const nav = container.querySelector('[data-testid="section-nav"]');
    expect(nav).not.toBeNull();
    expect(nav?.textContent).toContain("runs");
    expect(nav?.textContent).toContain("triggers");
  });

  it("renders the triggers section with the trigger count and an add-trigger drawer", async () => {
    currentParams = { routineId: "routine-1", section: "triggers" };
    await renderPage();
    const sectionHeading = container.querySelector("#routine-section-title");
    expect(sectionHeading?.textContent).toBe("Triggers");
    expect(container.textContent).toContain("1 trigger");
    // Open the add-trigger drawer.
    const newTrigger = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("New trigger"),
    );
    expect(newTrigger).toBeTruthy();
    await act(() => {
      newTrigger?.click();
    });
    await flush();
    expect(container.textContent).toContain("Add trigger");
  });

  it("lists recent runs in the runs section and shows an empty state without runs", async () => {
    currentParams = { routineId: "routine-1", section: "runs" };
    listRunsMock.mockResolvedValue([
      { id: "run-1", status: "running", createdAt: new Date("2026-04-02T00:00:00Z") },
      { id: "run-2", status: "failed", createdAt: new Date("2026-04-01T00:00:00Z") },
    ] as unknown as RoutineDetailType[]);
    await renderPage();
    expect(container.querySelector("#routine-section-title")?.textContent).toBe("Runs");
    expect(container.textContent).toContain("running");
    expect(container.textContent).toContain("failed");

    // Empty history renders the empty state.
    document.body.innerHTML = "";
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    listRunsMock.mockResolvedValue([]);
    await renderPage();
    expect(container.textContent).toContain("No runs yet");
  });

  it("opens the run dialog from the header button and submits a manual run", async () => {
    await renderPage();
    const runButton = container.querySelector<HTMLButtonElement>('[data-testid="run-button"]');
    expect(runButton).not.toBeNull();
    await act(() => {
      runButton?.click();
    });
    await flush();
    expect(container.querySelector('[data-testid="run-dialog"]')).not.toBeNull();
    const submit = container.querySelector<HTMLButtonElement>('[data-testid="run-dialog-submit"]');
    await act(() => {
      submit?.click();
    });
    await flush();
    expect(runMock).toHaveBeenCalledWith("routine-1", { variables: { target: "staging" } });
  });

  it("disables the run button while a run is pending (concurrency guard)", async () => {
    let resolveRun: (value: unknown) => void = () => undefined;
    runMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRun = resolve;
      }),
    );
    await renderPage();
    const runButton = container.querySelector<HTMLButtonElement>('[data-testid="run-button"]');
    await act(() => {
      runButton?.click();
    });
    await flush();
    const submit = container.querySelector<HTMLButtonElement>('[data-testid="run-dialog-submit"]');
    await act(() => {
      submit?.click();
    });
    await flush();
    expect(runButton?.disabled).toBe(true);
    resolveRun({ id: "run-1" });
    await flush();
  });
});
