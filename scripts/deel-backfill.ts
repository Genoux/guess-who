// One-off roster backfill from Deel. Read-only on Deel; targets production on purpose.
//
//   bun run deel:backfill                       dry run: the same writes, rolled back
//   bun run deel:backfill -- --apply            write (a non-production database)
//   bun run deel:backfill -- --apply --confirm-production
//
// Run after migration 0014. Prints counts only, never names or emails.
import { parseArgs } from "node:util";
import { Pool } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/db/schema";
import {
  assertBackfillTarget,
  backfillRosterRecord,
} from "../src/features/games/server/backfill-roster-record";
import { createDeelClient } from "../src/integrations/deel/deel-client";

loadEnvConfig(process.cwd(), true);

const { values } = parseArgs({
  options: {
    apply: { type: "boolean", default: false },
    "confirm-production": { type: "boolean", default: false },
  },
});

const databaseUrl = process.env.DATABASE_URL;
const deelApiUrl = process.env.DEEL_API_URL || "https://api.letsdeel.com/rest/v2";
const token = process.env.DEEL_API_TOKEN;
if (!token) throw new Error("DEEL_API_TOKEN is not set");

assertBackfillTarget({
  databaseUrl,
  deelApiUrl,
  apply: values.apply,
  confirmProduction: values["confirm-production"],
});

const deel = createDeelClient({ baseUrl: deelApiUrl, token });
const pool = new Pool({ connectionString: databaseUrl });

try {
  const roster = await Array.fromAsync(deel.listPeople());
  const counts = await backfillRosterRecord({
    database: drizzle(pool, { schema }),
    people: roster,
    apply: values.apply,
    now: new Date(),
  });
  console.info(values.apply ? "Applied:" : "Dry run (rolled back):", {
    fetched: roster.length,
    ...counts,
  });
} finally {
  await pool.end();
}
