import "server-only";
import { and, inArray, isNull } from "drizzle-orm";
import { TransactionRollbackError } from "drizzle-orm/errors";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { PRODUCTION_ENDPOINT } from "@/db/assert-not-production";
import type * as schema from "@/db/schema";
import { people } from "@/db/schema";
import { seedTeams } from "@/db/seed-teams";
import type { DeelPerson } from "@/integrations/deel/deel-person";
import { toRosterChange } from "@/integrations/deel/to-roster-change";
import { upsertRosterPersonRecord } from "./upsert-roster-person-record";

const PRODUCTION_DEEL_HOST = "api.letsdeel.com";

type BackfillTarget = {
  databaseUrl: string | undefined;
  deelApiUrl: string;
  apply: boolean;
  confirmProduction: boolean;
};

/**
 * The backfill targets production on purpose, so the database and Deel must agree: real people
 * only into the production database, sandbox people only into a dev one. Writing to production
 * also needs `--confirm-production`.
 */
export function assertBackfillTarget({
  databaseUrl,
  deelApiUrl,
  apply,
  confirmProduction,
}: BackfillTarget): void {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const productionDatabase = new URL(databaseUrl).hostname.startsWith(PRODUCTION_ENDPOINT);
  const productionDeel = new URL(deelApiUrl).hostname === PRODUCTION_DEEL_HOST;
  if (productionDatabase !== productionDeel) {
    throw new Error(
      "Refusing to run: DATABASE_URL and DEEL_API_URL mismatch (production with production, sandbox with dev)",
    );
  }
  if (productionDatabase && apply && !confirmProduction) {
    throw new Error("Refusing to write to production without --confirm-production");
  }
}

export type BackfillCounts = {
  created: number;
  updated: number;
  conflict: number;
  skipped: Record<string, number>;
};

type BackfillInput = {
  database: NeonDatabase<typeof schema>;
  people: readonly DeelPerson[];
  apply: boolean;
  now: Date;
};

/**
 * Creates or updates a person for every active worker in scope, in one transaction that a dry
 * run rolls back, so both paths run the same statements. Everyone written is marked as already
 * past the auto-mission, so only people who become active afterwards can auto-start.
 */
export async function backfillRosterRecord({
  database,
  people: roster,
  apply,
  now,
}: BackfillInput): Promise<BackfillCounts> {
  const counts: BackfillCounts = { created: 0, updated: 0, conflict: 0, skipped: {} };
  const skip = (reason: string) => {
    counts.skipped[reason] = (counts.skipped[reason] ?? 0) + 1;
  };

  try {
    await database.transaction(async (tx) => {
      await seedTeams(tx as unknown as NeonDatabase<typeof schema>);
      const written: string[] = [];
      for (const deelPerson of roster) {
        const change = toRosterChange(deelPerson.id, deelPerson);
        if (change.kind !== "upsert") {
          skip(change.kind === "ignore" ? change.reason : "not active or leaver");
          continue;
        }
        const outcome = await upsertRosterPersonRecord(tx, change.person);
        counts[outcome] += 1;
        if (outcome !== "conflict") written.push(change.person.deelId);
      }
      if (written.length > 0) {
        await tx
          .update(people)
          .set({ autoMissionDoneAt: now })
          .where(and(inArray(people.deelId, written), isNull(people.autoMissionDoneAt)));
      }
      if (!apply) tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) throw error;
  }
  return counts;
}
