import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";
import type { DeelClient } from "@/integrations/deel/deel-client";
import type { DeelSubject } from "@/integrations/deel/deel-webhook-event";
import { toRosterChange } from "@/integrations/deel/to-roster-change";
import { db } from "@/shared/lib/db";
import { removeLeaverRecord } from "./remove-leaver-record";
import { startAutoMissionRecord } from "./start-auto-mission-record";
import { upsertRosterPersonRecord } from "./upsert-roster-person-record";

type SyncInput = {
  deel: Pick<DeelClient, "getPerson" | "findPersonByContractId">;
  subject: DeelSubject;
  now: Date;
};

/**
 * Re-reads the person a webhook is about and applies it: leavers are removed, everyone else is
 * upserted and, for someone who just became active, their mission starts.
 */
export async function syncDeelPersonRecord({ deel, subject, now }: SyncInput): Promise<string> {
  const person =
    subject.kind === "person"
      ? await deel.getPerson(subject.id)
      : await deel.findPersonByContractId(subject.id);
  if (subject.kind === "contract" && !person) return "unknown contract";

  const change = toRosterChange(person?.id ?? subject.id, person, now);
  if (change.kind === "ignore") return `ignored: ${change.reason}`;
  if (change.kind === "remove") return removeLeaverRecord({ deelId: change.deelId, now });
  let outcome: string;
  try {
    outcome = await db.transaction((tx) => upsertRosterPersonRecord(tx, change.person));
  } catch (error) {
    // Deel sends several events per person at once; the loser of the race retries and the
    // pre-check then finds the committed row.
    if (isUniqueViolation(error)) {
      throw new AppError("db_transient", "concurrent upsert of the same person", {
        cause: error,
        isRetryable: true,
      });
    }
    throw error;
  }
  if (outcome === "conflict") return outcome;
  return `${outcome}; ${await startAutoMissionRecord({ deelId: change.person.deelId, now })}`;
}
