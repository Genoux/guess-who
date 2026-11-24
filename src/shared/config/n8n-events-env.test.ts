import { describe, expect, it } from "vitest";
import { z } from "zod";
import { n8nEventsEnv } from "./n8n-events-env";

const parse = (vercelEnv: string | undefined, input: Record<string, string>) =>
  z.object(n8nEventsEnv(vercelEnv)).safeParse(input);

const SECRET = "s".repeat(32);

describe("n8nEventsEnv", () => {
  it("requires the webhook URL and the secret in production", () => {
    const result = parse("production", {});
    expect(result.error?.issues.map(({ path }) => path[0]).sort()).toEqual([
      "N8N_EVENTS_SECRET",
      "N8N_EVENTS_WEBHOOK_URL",
    ]);
  });

  it("accepts both in production", () => {
    const input = {
      N8N_EVENTS_WEBHOOK_URL: "https://n8n.example/webhook/album",
      N8N_EVENTS_SECRET: SECRET,
    };
    expect(parse("production", input).success).toBe(true);
  });

  it("refuses a short secret", () => {
    const input = {
      N8N_EVENTS_WEBHOOK_URL: "https://n8n.example/webhook/album",
      N8N_EVENTS_SECRET: "short",
    };
    expect(parse("production", input).success).toBe(false);
  });

  it.each(["preview", "development", undefined])("leaves them optional in %s", (vercelEnv) => {
    expect(parse(vercelEnv, {}).success).toBe(true);
  });
});
