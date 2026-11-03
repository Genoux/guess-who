import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { completeCardCondition } from "./complete-card-condition";

beforeEach(() => {
  client.query.mockClear();
  client.query.mockResolvedValue({ rows: [] });
});

describe("completeCardCondition", () => {
  it("needs a team and non-blank location, fact and ask", async () => {
    await db.select({ id: people.id }).from(people).where(completeCardCondition);
    expect(sentStatements(client).at(-1)?.sql).toMatch(
      /where \(people\.team_id is not null and btrim\(coalesce\(people\.location, ''\)\) <> '' and btrim\(coalesce\(people\.fact, ''\)\) <> '' and btrim\(coalesce\(people\.ask, ''\)\) <> ''\)/,
    );
  });
});
