import { AppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));
vi.mock("@/shared/config/env", () => ({ env: {} }));

import { dispatchPendingAppEvents, MAX_DELIVERY_ATTEMPTS } from "./dispatch-app-events";

const DATA = {
  gameId: "5d0c7e1a-2b3f-4a5c-8d9e-0f1a2b3c4d5e",
  startDate: "2026-11-24",
  player: {
    personId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
    name: "Ana Ferreira",
    email: "ana@inbeat.agency",
    slackUserId: "U123",
  },
};

/** A notifications row, in the table's column order. */
const row = (id: string, { type = "mission.started", attempts = 0 } = {}) => [
  id,
  type,
  DATA,
  "pending",
  attempts,
  null,
  null,
  "2026-11-24T15:00:00.000Z",
];

const pendingRows = (rows: unknown[][]) =>
  client.query.mockImplementation(async (config) =>
    config.text.includes('from "notifications"') ? { rows } : { rows: [] },
  );

const updates = () =>
  sentStatements(client).filter(({ sql }) => sql.startsWith("update notifications"));

beforeEach(() => {
  client.query.mockReset();
  pendingRows([]);
});

describe("dispatchPendingAppEvents", () => {
  it("does nothing without a webhook configured", async () => {
    await expect(dispatchPendingAppEvents()).resolves.toEqual({ sent: 0, failed: 0 });
    expect(client.query).not.toHaveBeenCalled();
  });

  it("locks the oldest pending rows so a concurrent dispatch skips them", async () => {
    await dispatchPendingAppEvents(vi.fn());
    const select = sentStatements(client).find(({ sql }) => sql.includes("from notifications"));
    expect(select?.sql).toMatch(/where notifications\.status = \$1/);
    expect(select?.sql).toMatch(/order by notifications\.created_at asc/);
    expect(select?.sql).toMatch(/for update skip locked/);
  });

  it("sends each event as an envelope and marks it sent", async () => {
    pendingRows([row("event_1")]);
    const send = vi.fn();
    await expect(dispatchPendingAppEvents(send)).resolves.toEqual({ sent: 1, failed: 0 });
    expect(send).toHaveBeenCalledWith({
      id: "event_1",
      type: "mission.started",
      occurredAt: "2026-11-24T15:00:00.000Z",
      data: DATA,
    });
    expect(updates()[0]?.sql).toMatch(
      /set status = \$1, attempts = \$2, last_error = \$3, sent_at = now\(\)/,
    );
    expect(updates()[0]?.params).toEqual(["sent", 1, null, "event_1"]);
  });

  it("keeps a retryable failure pending and counts the attempt", async () => {
    pendingRows([row("event_1", { attempts: 1 })]);
    const send = vi
      .fn()
      .mockRejectedValue(
        new AppError("external_service", "n8n answered 502", { isRetryable: true }),
      );
    await expect(dispatchPendingAppEvents(send)).resolves.toEqual({ sent: 0, failed: 1 });
    expect(updates()[0]?.params).toEqual(["pending", 2, "n8n answered 502", "event_1"]);
  });

  it("gives up after the last attempt", async () => {
    pendingRows([row("event_1", { attempts: MAX_DELIVERY_ATTEMPTS - 1 })]);
    const send = vi.fn().mockRejectedValue(new Error("fetch failed"));
    await dispatchPendingAppEvents(send);
    expect(updates()[0]?.params).toEqual([
      "failed",
      MAX_DELIVERY_ATTEMPTS,
      "fetch failed",
      "event_1",
    ]);
  });

  it("gives up at once on a failure that will not change", async () => {
    pendingRows([row("event_1")]);
    const send = vi
      .fn()
      .mockRejectedValue(
        new AppError("external_service", "n8n answered 404", { isRetryable: false }),
      );
    await dispatchPendingAppEvents(send);
    expect(updates()[0]?.params[0]).toBe("failed");
  });

  it("fails an event whose type is no longer defined without sending it", async () => {
    pendingRows([row("event_1", { type: "mission.renamed" })]);
    const send = vi.fn();
    await dispatchPendingAppEvents(send);
    expect(send).not.toHaveBeenCalled();
    expect(updates()[0]?.params[0]).toBe("failed");
  });

  it("carries on with the next event after a failure", async () => {
    pendingRows([row("event_1"), row("event_2")]);
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue(undefined);
    await expect(dispatchPendingAppEvents(send)).resolves.toEqual({ sent: 1, failed: 1 });
  });
});
