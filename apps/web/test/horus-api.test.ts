import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, fetchWorkspaceData } from "../src/services/horus-api";
import { defaultWorkspaceData } from "../src/lib/workspace-data";

test("fetchWorkspaceData returns demo workspace only when fallback is explicitly allowed", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;

  try {
    const data = await fetchWorkspaceData({
      token: "demo-token",
      allowDemoFallback: true,
    });

    assert.deepEqual(data, defaultWorkspaceData);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchWorkspaceData throws ApiError when real workspace loading fails", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        fetchWorkspaceData({
          token: "real-token",
          allowDemoFallback: false,
        }),
      (error) =>
        error instanceof ApiError &&
        error.message.includes("NETWORK_ERROR"),
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchWorkspaceData returns backend payload when request succeeds", async () => {
  const originalFetch = global.fetch;
  const expected = {
    ...defaultWorkspaceData,
    quickActions: ["Criar plano real"],
  };

  global.fetch = (async () =>
    ({
      ok: true,
      json: async () => expected,
    }) as Response) as typeof fetch;

  try {
    const data = await fetchWorkspaceData({
      token: "real-token",
    });

    assert.equal(data.quickActions[0], "Criar plano real");
  } finally {
    global.fetch = originalFetch;
  }
});
