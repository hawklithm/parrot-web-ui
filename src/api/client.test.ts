import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __inflightGetCount, api } from "./client";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("in-tab GET coalescing", () => {
  it("shares one underlying fetch for identical in-flight GETs", async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValue(d.promise);

    const p1 = api.get("/coalesce-a");
    const p2 = api.get("/coalesce-a");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(__inflightGetCount()).toBe(1);

    d.resolve(jsonResponse({ value: 1 }));
    expect(await p1).toEqual({ value: 1 });
    expect(await p2).toEqual({ value: 1 });
    // Entry cleared once settled.
    expect(__inflightGetCount()).toBe(0);
  });

  it("issues a fresh fetch after the previous one settles", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: "x" }));
    await api.get("/coalesce-b");
    await api.get("/coalesce-b");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not coalesce different paths", async () => {
    fetchMock.mockReturnValue(deferred<Response>().promise);
    const c1 = new AbortController();
    const c2 = new AbortController();
    const p1 = api.get("/path-1", { signal: c1.signal });
    const p2 = api.get("/path-2", { signal: c2.signal });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Clean up the never-settling shared entries so the module map does not leak.
    c1.abort();
    c2.abort();
    await expect(p1).rejects.toMatchObject({ name: "AbortError" });
    await expect(p2).rejects.toMatchObject({ name: "AbortError" });
  });

  it("never coalesces mutations", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await Promise.all([api.post("/mutate", { a: 1 }), api.post("/mutate", { a: 1 })]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("per-caller abort semantics", () => {
  it("aborting one caller rejects only that caller, not the shared fetch", async () => {
    const d = deferred<Response>();
    let sharedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      sharedSignal = init.signal ?? undefined;
      return d.promise;
    });

    const c1 = new AbortController();
    const c2 = new AbortController();
    const p1 = api.get("/abort-a", { signal: c1.signal });
    const p2 = api.get("/abort-a", { signal: c2.signal });

    c1.abort();
    await expect(p1).rejects.toMatchObject({ name: "AbortError" });
    // The shared fetch is still alive because caller 2 has not aborted.
    expect(sharedSignal?.aborted).toBe(false);

    d.resolve(jsonResponse({ value: 2 }));
    expect(await p2).toEqual({ value: 2 });
  });

  it("aborts the shared fetch once every caller has aborted", async () => {
    const d = deferred<Response>();
    let sharedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      sharedSignal = init.signal ?? undefined;
      return d.promise;
    });

    const c1 = new AbortController();
    const c2 = new AbortController();
    const p1 = api.get("/abort-b", { signal: c1.signal });
    const p2 = api.get("/abort-b", { signal: c2.signal });

    c1.abort();
    c2.abort();
    await expect(p1).rejects.toMatchObject({ name: "AbortError" });
    await expect(p2).rejects.toMatchObject({ name: "AbortError" });
    expect(sharedSignal?.aborted).toBe(true);
    expect(__inflightGetCount()).toBe(0);
  });

  it("rejects immediately if the caller signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(api.get("/already-aborted", { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("uploadWithProgress", () => {
  let xhrMock: {
    open: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    setRequestHeader: ReturnType<typeof vi.fn>;
    status: number;
    responseText: string;
    upload: { onprogress: ((e: { loaded: number; total: number; lengthComputable: boolean }) => void) | null };
    onload: (() => void) | null;
    onerror: (() => void) | null;
    onabort: (() => void) | null;
  };
  let currentXHR: typeof xhrMock;

  beforeEach(() => {
    xhrMock = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      status: 200,
      responseText: JSON.stringify({ id: "att-1" }),
      upload: { onprogress: null },
      onload: null,
      onerror: null,
      onabort: null,
    };
    currentXHR = xhrMock;
    vi.stubGlobal(
      "XMLHttpRequest",
      class {
        constructor() {
          return currentXHR;
        }
      },
    );
    vi.stubGlobal("window", { location: { pathname: "/issues/abc" } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports upload progress and resolves with the JSON body", async () => {
    const progress: number[] = [];
    const promise = api.uploadWithProgress(
      "/companies/c/issues/i/attachments",
      new FormData(),
      (p) => progress.push(p),
    );
    // Simulate upload progress events, then a successful load.
    xhrMock.upload.onprogress!({ loaded: 250, total: 1000, lengthComputable: true });
    xhrMock.upload.onprogress!({ loaded: 500, total: 1000, lengthComputable: true });
    xhrMock.onload!();
    const result = await promise;
    expect(result).toEqual({ id: "att-1" });
    expect(progress).toEqual([25, 50]);
    expect(xhrMock.open).toHaveBeenCalledWith("POST", expect.stringContaining("/companies/c/issues/i/attachments"));
    expect(xhrMock.send).toHaveBeenCalledTimes(1);
  });

  it("skips progress callbacks for non-length-computable uploads", async () => {
    const progress: number[] = [];
    const promise = api.uploadWithProgress(
      "/companies/c/issues/i/attachments",
      new FormData(),
      (p) => progress.push(p),
    );
    xhrMock.upload.onprogress!({ loaded: 100, total: 0, lengthComputable: false });
    xhrMock.onload!();
    await promise;
    expect(progress).toEqual([]);
  });

  it("rejects with ApiError on non-2xx with the server error message", async () => {
    xhrMock.status = 413;
    xhrMock.responseText = JSON.stringify({ error: "File too large" });
    const promise = api.uploadWithProgress("/companies/c/issues/i/attachments", new FormData());
    xhrMock.onload!();
    await expect(promise).rejects.toMatchObject({
      message: "File too large",
      status: 413,
    });
  });

  it("rejects on network error", async () => {
    const promise = api.uploadWithProgress("/companies/c/issues/i/attachments", new FormData());
    xhrMock.onerror!();
    await expect(promise).rejects.toMatchObject({ message: "Network error during upload" });
  });
});
