import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));
vi.mock("./db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { claimPerson, findPeopleByAnyEmail } from "./person-records";

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("claimPerson", () => {
  const identity = { imageUrl: null, slackUserId: null };

  it("links a pre-created row to the Clerk user and leaves the new hire flag alone", async () => {
    await claimPerson("person_1", "user_1", "session_1", identity);
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(/^update people set clerk_user_id = \$1/);
    expect(update?.sql.split(" where ")[0]).not.toMatch(/new_hire/);
    expect(update?.sql).toMatch(/where \(people\.id = \$\d+ and people\.clerk_user_id is null\)/);
  });

  it("leaves the Deel-owned name and email alone", async () => {
    await claimPerson("person_1", "user_1", "session_1", {
      imageUrl: "https://img/x",
      slackUserId: "U1",
    });
    const [update] = sentStatements(client);
    expect(update?.sql.split(" where ")[0]).not.toMatch(/name =|email =/);
    expect(update?.params).toEqual(expect.arrayContaining(["https://img/x", "U1"]));
  });
});

describe("findPeopleByAnyEmail", () => {
  it("matches the work or the personal email, two rows at most", async () => {
    await findPeopleByAnyEmail("jane@gmail.com");
    const [select] = sentStatements(client);
    expect(select?.sql).toMatch(
      /where \(people\.email = \$1 or people\.personal_email = \$2\) limit \$3/,
    );
    expect(select?.params).toEqual(["jane@gmail.com", "jane@gmail.com", 2]);
  });
});
