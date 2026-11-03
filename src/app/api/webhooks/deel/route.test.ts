import { createHmac } from "node:crypto";
import { AppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "test-secret";
const env = vi.hoisted(
  () =>
    ({
      DEEL_WEBHOOK_SECRET: "test-secret",
      DEEL_API_TOKEN: "token",
      DEEL_API_URL: "https://deel.test/rest/v2",
      DEEL_ORGANIZATION_ID: undefined,
    }) as Record<string, string | undefined>,
);
vi.mock("@/shared/config/env", () => ({ env }));
vi.mock("@/shared/lib/rate-limit", () => ({ rateLimiter: { enforce: vi.fn() } }));
vi.mock("@/shared/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@inbeat/next/capture", () => ({
  captureAppError: (error: AppError) => ({
    kind: error.kind,
    safeMessage: error.safeMessage,
    isRetryable: error.isRetryable,
  }),
}));
const sync = vi.hoisted(() => ({ syncDeelPersonRecord: vi.fn() }));
vi.mock("@/features/games/server/sync-deel-person-record", () => sync);

import { rateLimiter } from "@/shared/lib/rate-limit";
import { POST } from "./route";

const body = (eventType: string, resource: object = { id: "p1" }, organizationId = "org-1") =>
  JSON.stringify({
    data: { meta: { event_type: eventType, organization_id: organizationId }, resource },
  });

const sign = (rawBody: string, secret = SECRET) =>
  createHmac("sha256", secret).update(`POST${rawBody}`).digest("hex");

const deliver = (rawBody: string, signature: string | null = sign(rawBody)) =>
  POST(
    new Request("http://localhost/api/webhooks/deel", {
      method: "POST",
      body: rawBody,
      headers: signature ? { "x-deel-signature": signature } : {},
    }),
    { params: Promise.resolve({}) },
  );

beforeEach(() => {
  vi.clearAllMocks();
  env.DEEL_WEBHOOK_SECRET = SECRET;
  env.DEEL_API_TOKEN = "token";
  env.DEEL_ORGANIZATION_ID = undefined;
  sync.syncDeelPersonRecord.mockResolvedValue("created");
});

describe("POST /api/webhooks/deel", () => {
  it("syncs the person of a signed worker event", async () => {
    const response = await deliver(body("worker.v2.updated"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, outcome: "created" });
    expect(sync.syncDeelPersonRecord).toHaveBeenCalledWith(
      expect.objectContaining({ subject: { kind: "person", id: "p1" } }),
    );
  });

  it("syncs by contract for a contract event", async () => {
    await deliver(body("contract.terminated", [{ id: "3072cm7" }]));
    expect(sync.syncDeelPersonRecord).toHaveBeenCalledWith(
      expect.objectContaining({ subject: { kind: "contract", id: "3072cm7" } }),
    );
  });

  it.each([
    ["a wrong signature", () => deliver(body("worker.v2.updated"), sign("other", "wrong"))],
    ["a missing signature", () => deliver(body("worker.v2.updated"), null)],
  ])("answers 401 for %s", async (_label, send) => {
    expect((await send()).status).toBe(401);
    expect(sync.syncDeelPersonRecord).not.toHaveBeenCalled();
  });

  it("answers 401 when the secret is not configured", async () => {
    env.DEEL_WEBHOOK_SECRET = undefined;
    expect((await deliver(body("worker.v2.updated"))).status).toBe(401);
  });

  it("answers 429 when the sender is rate limited", async () => {
    vi.mocked(rateLimiter.enforce).mockRejectedValueOnce(new AppError("rate_limited", "limit"));
    expect((await deliver(body("worker.v2.updated"))).status).toBe(429);
  });

  it("answers 200 and does nothing for an unhandled event", async () => {
    const response = await deliver(body("onboarding.status.updated"));
    expect(response.status).toBe(200);
    expect(sync.syncDeelPersonRecord).not.toHaveBeenCalled();
  });

  it("answers 200 for a body that is not an event", async () => {
    expect((await deliver("not json")).status).toBe(200);
    expect(sync.syncDeelPersonRecord).not.toHaveBeenCalled();
  });

  it("ignores another organization when one is configured", async () => {
    env.DEEL_ORGANIZATION_ID = "org-1";
    const response = await deliver(body("worker.v2.updated", { id: "p1" }, "org-2"));
    expect(response.status).toBe(200);
    expect(sync.syncDeelPersonRecord).not.toHaveBeenCalled();
  });

  it.each([
    ["a Deel timeout", new AppError("timeout", "deel timed out"), 504],
    ["a Deel 5xx", new AppError("external_service", "deel 502", { isRetryable: true }), 502],
    ["a transient database error", new AppError("db_transient", "db down"), 503],
  ])("lets Deel retry after %s", async (_label, error, status) => {
    sync.syncDeelPersonRecord.mockRejectedValue(error);
    expect((await deliver(body("worker.v2.updated"))).status).toBe(status);
  });

  it.each([
    ["a Deel response that fails validation", new AppError("external_service", "bad shape")],
    ["an unexpected error", new Error("boom")],
  ])("answers 200 after %s so Deel keeps the webhook on", async (_label, error) => {
    sync.syncDeelPersonRecord.mockRejectedValue(error);
    expect((await deliver(body("worker.v2.updated"))).status).toBe(200);
  });

  it("answers 200 when the Deel token is missing", async () => {
    env.DEEL_API_TOKEN = undefined;
    expect((await deliver(body("worker.v2.updated"))).status).toBe(200);
    expect(sync.syncDeelPersonRecord).not.toHaveBeenCalled();
  });
});
