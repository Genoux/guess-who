import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";
import { eq } from "drizzle-orm";
import { people } from "@/db/schema";
import type { DeelClient } from "@/integrations/deel/deel-client";
import type { DeelSubject } from "@/integrations/deel/deel-webhook-event";
import { toRosterChange } from "@/integrations/deel/to-roster-change";
import { db } from "@/shared/lib/db";
import { removeLeaverRecord } from "./remove-leaver-record";
import { turnOnMissionsRecord } from "./turn-on-missions-record";
import { upsertRosterPersonRecord } from "./upsert-roster-person-record";

type SyncInput = {
  deel: Pick<DeelClient, "getPerson" | "findPersonByContractId">;
  subject: DeelSubject;
  now: Date;
};

/**
 * Re-reads the person a webhook is about and applies it: leavers are removed, everyone else is
 * upserted. A person this creates is a new hire whose mission starts now: Deel only reports
 * someone active around their start date, so this is close to their first day. Creation happens
 * once, so a mission an admin ended or reset never starts again from here.
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
    outcome = await db.transaction((tx) =>
      upsertRosterPersonRecord(tx, change.person, "newContract"),
    );
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
  if (outcome !== "created") return outcome;
  return `${outcome}; ${await startNewHireMission(change.person.deelId, now)}`;
}

async function startNewHireMission(deelId: string, now: Date) {
  const created = await db.select({ id: people.id }).from(people).where(eq(people.deelId, deelId));
  const { started } = await turnOnMissionsRecord({
    personIds: created.map(({ id }) => id),
    adminPersonId: null,
    now,
  });
  return started > 0 ? "mission started" : "no welcomer free";
}
