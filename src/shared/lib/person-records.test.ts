import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));
vi.mock("./db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { claimPerson } from "./person-records";

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("claimPerson", () => {
  const identity = { name: "Jane Doe", imageUrl: null, slackUserId: null };

  it("links a pre-created row to the Clerk user and leaves the new hire flag alone", async () => {
    await claimPerson("person_1", "user_1", "session_1", identity);
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(/^update people set clerk_user_id = \$1/);
    expect(update?.sql.split(" where ")[0]).not.toMatch(/new_hire/);
    expect(update?.sql).toMatch(/where \(people\.id = \$\d+ and people\.clerk_user_id is null\)/);
  });

  it("swaps the placeholder name adding them gave the row for their name from Clerk", async () => {
    await claimPerson("person_1", "user_1", "session_1", identity);
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(
      /name = case when people\.name = split_part\(people\.email, '@', 1\) then \$\d+ else people\.name end/,
    );
    expect(update?.params).toContain("Jane Doe");
  });
});
