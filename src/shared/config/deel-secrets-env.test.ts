import { describe, expect, it } from "vitest";
import { z } from "zod";
import { deelSecretsEnv } from "./deel-secrets-env";

const parse = (vercelEnv: string | undefined, input: Record<string, string>) =>
  z.object(deelSecretsEnv(vercelEnv)).safeParse(input);

describe("deelSecretsEnv", () => {
  it("requires the API token and the webhook secret in production", () => {
    const result = parse("production", {});
    expect(result.error?.issues.map(({ path }) => path[0]).sort()).toEqual([
      "DEEL_API_TOKEN",
      "DEEL_WEBHOOK_SECRET",
    ]);
  });

  it("accepts both in production", () => {
    expect(parse("production", { DEEL_API_TOKEN: "t", DEEL_WEBHOOK_SECRET: "s" }).success).toBe(
      true,
    );
  });

  it.each(["preview", "development", undefined])("leaves them optional in %s", (vercelEnv) => {
    expect(parse(vercelEnv, {}).success).toBe(true);
  });
});
