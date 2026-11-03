import { beforeEach, describe, expect, it, vi } from "vitest";
import { sentStatements } from "@/test/fake-db";

const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));

import { clearNewHire } from "./clear-new-hire";

beforeEach(() => {
  client.query.mockReset();
  client.query.mockResolvedValue({ rows: [] });
});

describe("clearNewHire", () => {
  it("turns the flag off for the people whose mission ended, and only them", async () => {
    await clearNewHire(["a", "b"]);
    const [update] = sentStatements(client);
    expect(update?.sql).toMatch(
      /^update people set new_hire = \$1.* where people\.id in \(\$\d+, \$\d+\)/,
    );
    expect(update?.params).toEqual(expect.arrayContaining([false, "a", "b"]));
  });

  it("skips games with no linked player, and writes nothing for nobody", async () => {
    await clearNewHire([null]);
    await clearNewHire([]);
    expect(client.query).not.toHaveBeenCalled();
  });
});
