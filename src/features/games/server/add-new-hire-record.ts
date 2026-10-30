import "server-only";
import { AppError } from "@inbeat/core/errors";
import { eq } from "drizzle-orm";
import { people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { beginMissionRecord } from "./begin-mission-record";

type AddNewHireInput = {
  /** Normalized. */
  email: string;
  adminPersonId: string;
  now: Date;
};

// Until the person signs in, the row carries the part of the email before the @, which the
// sign-in replaces with their name from Clerk.
const placeholderName = (email: string) => email.split("@")[0] ?? email;

/**
 * Adds a new hire by email and starts their mission: the person is flagged as a new hire and
 * their row created if they have none, so the flag exists before they sign in. The flag and the
 * game are one transaction, so a refused start leaves no flag behind.
 */
export async function addNewHireRecord({ email, adminPersonId, now }: AddNewHireInput) {
  const [existing] = await db.select({ id: people.id }).from(people).where(eq(people.email, email));
  return beginMissionRecord({
    playerEmail: email,
    playerPersonId: existing?.id ?? null,
    createdBy: adminPersonId,
    now,
    prepare: async (tx) => {
      const [person] = await tx
        .insert(people)
        .values({ email, name: placeholderName(email), newHire: true })
        .onConflictDoUpdate({ target: people.email, set: { newHire: true } })
        .returning({ id: people.id, clerkUserId: people.clerkUserId });
      if (!person) throw new AppError("unknown", "person upsert returned no row");
      // A person who signed in already is linked now; the rest are linked on their first sign-in.
      return person.clerkUserId ? person.id : null;
    },
  });
}
