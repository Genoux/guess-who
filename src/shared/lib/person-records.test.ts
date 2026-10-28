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
  refreshPersonIdentity,
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
  it("only claims a row that has no Clerk user yet, writing no null over its photo or Slack id", async () => {
    await expect(
      claimPerson("person_1", "user_1", "session_1", { imageUrl: null, slackUserId: null }),
    ).resolves.toBeUndefined();
    expect(sent().sql).toMatch(
      /update people set clerk_user_id = \$1, synced_session_id = \$2, updated_at = \$3 where \(people\.id = \$4 and people\.clerk_user_id is null\) returning/,
    );
    expect(sent().params).toEqual(["user_1", "session_1", expect.any(String), "person_1"]);
  });
});

describe("claimPerson identity", () => {
  it("stores the image and Slack user id", async () => {
    await claimPerson("person_1", "user_1", "session_1", {
      imageUrl: "https://img/maya",
      slackUserId: "U123",
    });
    expect(sent().sql).toMatch(/update people set .*slack_user_id = \$\d/);
    expect(sent().params).toEqual(expect.arrayContaining(["user_1", "https://img/maya", "U123"]));
  });
});

describe("refreshPersonIdentity", () => {
  it("sets the Slack user id and the photo", async () => {
    await refreshPersonIdentity("person_1", "session_2", {
      imageUrl: "https://img/maya",
      slackUserId: "U123",
    });
    expect(sent().sql).toMatch(
      /update people set image_url = \$1, slack_user_id = \$2, synced_session_id = \$3, updated_at = \$4 where people\.id = \$5 returning/,
    );
    expect(sent().params).toEqual([
      "https://img/maya",
      "U123",
      "session_2",
      expect.any(String),
      "person_1",
    ]);
  });

  it("never writes null over a stored photo or Slack id", async () => {
    await refreshPersonIdentity("person_1", "session_2", { imageUrl: null, slackUserId: null });
    expect(sent().sql).toMatch(/set synced_session_id = \$1, updated_at = \$2 where/);
  });

  it("keeps the stored photo when the identity has none", async () => {
    await refreshPersonIdentity("person_1", "session_2", { imageUrl: null, slackUserId: "U123" });
    expect(sent().sql).toMatch(
      /set slack_user_id = \$1, synced_session_id = \$2, updated_at = \$3 where/,
    );
  });
});

describe("insertPerson", () => {
  it("stores the Slack user id", async () => {
    await insertPerson({
      clerkUserId: "user_1",
      email: "maya@inbeat.agency",
      name: "Maya",
      slackUserId: "U123",
      syncedSessionId: "session_1",
    });
    expect(sent().sql).toMatch(/insert into people .*slack_user_id.*synced_session_id/);
    expect(sent().params).toEqual(expect.arrayContaining(["U123", "session_1"]));
  });

  it("skips only an email conflict, so other unique violations throw", async () => {
    await expect(
      insertPerson({ clerkUserId: "user_1", email: "maya@inbeat.agency", name: "Maya" }),
    ).resolves.toBeUndefined();
    expect(sent().sql).toMatch(/insert into people .* on conflict \(email\) do nothing returning/);
  });

  it("treats a clerk_user_id race as a lost insert", async () => {
    client.query.mockRejectedValueOnce(
      Object.assign(new Error("duplicate key"), {
        code: "23505",
        constraint: "people_clerk_user_id_unique",
      }),
    );
    await expect(
      insertPerson({ clerkUserId: "user_1", email: "maya@inbeat.agency", name: "Maya" }),
    ).resolves.toBeUndefined();
  });

  it("lets other unique violations through", async () => {
    client.query.mockRejectedValueOnce(
      Object.assign(new Error("duplicate key"), {
        code: "23505",
        constraint: "people_sticker_number_unique",
      }),
    );
    await expect(
      insertPerson({ clerkUserId: "user_1", email: "maya@inbeat.agency", name: "Maya" }),
    ).rejects.toThrow();
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
