import { describe, expect, it, vi } from "vitest";
import type { AppEventEnvelope } from "@/entities/app-events";
import { createN8nEventClient, EVENT_HEADER, SECRET_HEADER } from "./n8n-event-client";

const SECRET = "s".repeat(32);
const envelope: AppEventEnvelope = {
  id: "0b8f4a52-3c1e-4d2b-9a6f-7e5d4c3b2a10",
  type: "mission.started",
  occurredAt: "2026-11-24T15:00:00.000Z",
  data: {
    gameId: "5d0c7e1a-2b3f-4a5c-8d9e-0f1a2b3c4d5e",
    startDate: "2026-11-24",
    player: {
      personId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
      name: "Ana Ferreira",
      email: "ana@inbeat.agency",
      slackUserId: "U123",
    },
  },
};

const clientWith = (response: Response | Error) => {
  const fetchImpl = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  return {
    fetchImpl,
    client: createN8nEventClient({
      webhookUrl: "https://n8n.example/webhook/album",
      secret: SECRET,
      fetchImpl,
    }),
  };
};

describe("createN8nEventClient", () => {
  it("posts the envelope with its type and the shared secret", async () => {
    const { client, fetchImpl } = clientWith(new Response(null, { status: 200 }));
    await client.send(envelope);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("https://n8n.example/webhook/album");
    expect(JSON.parse(init.body as string)).toEqual(envelope);
    expect(headers[EVENT_HEADER]).toBe("mission.started");
    expect(headers[SECRET_HEADER]).toBe(SECRET);
  });

  it("fails retryably on a server error", async () => {
    const { client } = clientWith(new Response(null, { status: 502 }));
    await expect(client.send(envelope)).rejects.toMatchObject({
      kind: "external_service",
      isRetryable: true,
    });
  });

  it("fails for good on a client error", async () => {
    const { client } = clientWith(new Response(null, { status: 404 }));
    await expect(client.send(envelope)).rejects.toMatchObject({ isRetryable: false });
  });

  it("fails retryably when the request never lands", async () => {
    const { client } = clientWith(new TypeError("fetch failed"));
    await expect(client.send(envelope)).rejects.toMatchObject({ isRetryable: true });
  });
});
