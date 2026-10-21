import { beforeEach, describe, expect, it, vi } from "vitest";

// Drizzle runs against a fake client, so the tests read the SQL each function sends.
const client = vi.hoisted(() => ({
  query: vi.fn(async (_config: { text: string }, _params: unknown[]) => ({
    rows: [] as unknown[][],
  })),
}));

vi.mock("./db", async () => {
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const schema = await import("@/db/schema");
  return { db: drizzle({ client: client as never, schema }) };
});

import {
  claimPerson,
  findPersonByClerkUserId,
  findPersonByEmail,
  hasGameForPlayerEmail,
  insertPerson,
  linkPersonToGamesByEmail,
} from "./person-records";

const sent = () => {
  const [config, params] = client.query.mock.calls.at(-1) ?? [];
  return { sql: config?.text.replaceAll('"', "") ?? "", params };
};

beforeEach(() => {
  client.query.mockClear();
  client.query.mockResolvedValue({ rows: [] });
});

describe("person lookups", () => {
  it("finds a person by Clerk user id", async () => {
    await expect(findPersonByClerkUserId("user_1")).resolves.toBeUndefined();
    expect(sent().sql).toMatch(/from people where people\.clerk_user_id = \$1/);
    expect(sent().params).toEqual(["user_1"]);
  });

  it("finds a person by email", async () => {
    await findPersonByEmail("maya@inbeat.agency");
    expect(sent().sql).toMatch(/from people where people\.email = \$1/);
    expect(sent().params).toEqual(["maya@inbeat.agency"]);
  });

  it("reports whether a game exists for a player email", async () => {
    await expect(hasGameForPlayerEmail("new@gmail.com")).resolves.toBe(false);
    expect(sent().sql).toMatch(/from games where games\.player_email = \$1 limit \$2/);

    client.query.mockResolvedValueOnce({ rows: [["game_1"]] });
    await expect(hasGameForPlayerEmail("new@gmail.com")).resolves.toBe(true);
  });
});

describe("claimPerson", () => {
  it("only claims a row that has no Clerk user yet", async () => {
    await expect(claimPerson("person_1", "user_1")).resolves.toBeUndefined();
    expect(sent().sql).toMatch(
      /update people set clerk_user_id = \$1, updated_at = \$2 where \(people\.id = \$3 and people\.clerk_user_id is null\) returning/,
    );
    expect(sent().params).toEqual(["user_1", expect.any(String), "person_1"]);
  });
});

describe("insertPerson", () => {
  it("skips only an email conflict, so other unique violations throw", async () => {
    await expect(
      insertPerson({ clerkUserId: "user_1", email: "maya@inbeat.agency", name: "Maya" }),
    ).resolves.toBeUndefined();
    expect(sent().sql).toMatch(/insert into people .* on conflict \(email\) do nothing returning/);
  });

  it("lets a database error through", async () => {
    client.query.mockRejectedValueOnce(new Error("people_sticker_number_unique"));
    await expect(
      insertPerson({ clerkUserId: "user_1", email: "maya@inbeat.agency", name: "Maya" }),
    ).rejects.toHaveProperty("cause.message", "people_sticker_number_unique");
  });
});

describe("linkPersonToGamesByEmail", () => {
  it("links only unclaimed games for that email", async () => {
    await expect(linkPersonToGamesByEmail("person_1", "new@gmail.com")).resolves.toEqual([]);
    expect(sent().sql).toMatch(
      /update games set player_person_id = \$1, updated_at = \$2 where \(games\.player_email = \$3 and games\.player_person_id is null\) returning id$/,
    );
    expect(sent().params).toEqual(["person_1", expect.any(String), "new@gmail.com"]);
  });

  it("returns the linked game ids", async () => {
    client.query.mockResolvedValueOnce({ rows: [["game_1"], ["game_2"]] });
    await expect(linkPersonToGamesByEmail("person_1", "new@gmail.com")).resolves.toEqual([
      { id: "game_1" },
      { id: "game_2" },
    ]);
  });
});
