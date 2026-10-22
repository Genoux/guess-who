import type { Mock } from "vitest";

/**
 * Drizzle over a fake Neon client, so record tests read the SQL each function sends:
 *
 *   const client = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] as unknown[][] })) }));
 *   vi.mock("@/shared/lib/db", async () => (await import("@/test/fake-db")).fakeDbModule(client));
 */
export type FakeClient = { query: Mock };

export async function fakeDbModule(client: FakeClient) {
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const schema = await import("@/db/schema");
  return { db: drizzle({ client: client as never, schema }) };
}

/** Every statement sent so far, quotes stripped, with its parameters. */
export function sentStatements(client: FakeClient): { sql: string; params: unknown[] }[] {
  return client.query.mock.calls.map(([config, params]) => ({
    sql: String((config as { text: string }).text).replaceAll('"', ""),
    params: params as unknown[],
  }));
}
