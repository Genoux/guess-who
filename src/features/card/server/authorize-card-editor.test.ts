import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }, _params: unknown[]) => ({
    rows: [] as unknown[][],
  })),
}));
const { getViewerPerson } = vi.hoisted(() => ({ getViewerPerson: vi.fn() }));

vi.mock("@/shared/lib/db", async () => {
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const schema = await import("@/db/schema");
  return { db: drizzle({ client: client as never, schema }) };
});
vi.mock("@/shared/lib/viewer-person", () => ({ getViewerPerson }));

import { authorizeCardEditor } from "./authorize-card-editor";

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
  getViewerPerson.mockReset();
  getViewerPerson.mockResolvedValue({ userId: "user_1", role: "member", person: { id: "p_1" } });
});

describe("authorizeCardEditor", () => {
  it("returns the session's own person, looked up by their games as player", async () => {
    await expect(authorizeCardEditor()).resolves.toEqual({
      personId: "p_1",
      audience: "teammate",
    });
    const [config, params] = client.query.mock.calls[0] ?? [];
    expect(config?.text.replaceAll('"', "")).toMatch(
      /select status from games where games\.player_person_id = \$1/,
    );
    expect(params).toEqual(["p_1"]);
  });

  it("marks a player whose game ended as a new hire", async () => {
    client.query.mockResolvedValueOnce({ rows: [["revealed"]] });
    await expect(authorizeCardEditor()).resolves.toMatchObject({ audience: "new-hire" });
  });

  it("forbids a player mid-game", async () => {
    client.query.mockResolvedValueOnce({ rows: [["active"]] });
    await expect(authorizeCardEditor()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });

  it("denies a visitor without a session", async () => {
    getViewerPerson.mockRejectedValueOnce(new AppError("auth", "no session"));
    await expect(authorizeCardEditor()).rejects.toSatisfy((err) => isAppError(err, "auth"));
    expect(client.query).not.toHaveBeenCalled();
  });
});
