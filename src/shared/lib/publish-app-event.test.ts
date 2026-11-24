import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }) => ({ rows: [] as unknown[][] })),
}));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

const scheduled = vi.hoisted(() => ({ callbacks: [] as (() => Promise<void>)[] }));
vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => scheduled.callbacks.push(callback),
}));
const dispatchPendingAppEvents = vi.hoisted(() => vi.fn());
vi.mock("./dispatch-app-events", () => ({ dispatchPendingAppEvents }));

import { db } from "@/shared/lib/db";
import { publishAppEvent } from "./publish-app-event";

const tx = db as never;
const DATA = {
  gameId: "5d0c7e1a-2b3f-4a5c-8d9e-0f1a2b3c4d5e",
  startDate: "2026-11-24",
  player: {
    personId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
    name: "Ana Ferreira",
    email: "ana@inbeat.agency",
    slackUserId: null,
  },
};

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
  dispatchPendingAppEvents.mockReset();
  scheduled.callbacks = [];
});

describe("publishAppEvent", () => {
  it("records the event in the given transaction and sends it after the response", async () => {
    await publishAppEvent(tx, "mission.started", DATA);

    const insert = sentStatements(client).find(({ sql }) =>
      sql.startsWith("insert into notifications"),
    );
    expect(insert?.params).toEqual(
      expect.arrayContaining(["mission.started", JSON.stringify(DATA)]),
    );
    expect(dispatchPendingAppEvents).not.toHaveBeenCalled();

    await scheduled.callbacks[0]?.();
    expect(dispatchPendingAppEvents).toHaveBeenCalledTimes(1);
  });

  it("refuses data that does not match the event, before writing", async () => {
    const wrong = { ...DATA, gameId: "not-a-uuid" };
    await expect(publishAppEvent(tx, "mission.started", wrong)).rejects.toThrow();
    expect(client.query).not.toHaveBeenCalled();
    expect(scheduled.callbacks).toHaveLength(0);
  });

  it("keeps a failed dispatch inside the after callback", async () => {
    dispatchPendingAppEvents.mockRejectedValue(new Error("db down"));
    await publishAppEvent(tx, "mission.started", DATA);
    await expect(scheduled.callbacks[0]?.()).resolves.toBeUndefined();
  });
});
