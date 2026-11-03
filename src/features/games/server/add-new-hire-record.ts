import "server-only";
import { AppError, isAppError } from "@inbeat/core/errors";
import { people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { hasGameForPlayerEmail } from "@/shared/lib/person-records";
import { ALREADY_HAS_MISSION, beginMissionRecord } from "./begin-mission-record";
import { NO_WELCOMER_FREE } from "./choose-welcomer";

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
 * Adds a new hire by email and starts their mission today. The person row is created if they have
 * none and flagged as a new hire. With no welcomer free the person stays added without a mission,
 * for an admin to turn on later.
 */
export async function addNewHireRecord({ email, adminPersonId, now }: AddNewHireInput) {
  if (await hasGameForPlayerEmail(email)) {
    throw new AppError("conflict", "email already has a mission", {
      safeMessage: ALREADY_HAS_MISSION,
    });
  }
  const [person] = await db
    .insert(people)
    .values({ email, name: placeholderName(email), newHire: true })
    .onConflictDoUpdate({ target: people.email, set: { newHire: true } })
    .returning({ id: people.id });
  if (!person) throw new AppError("unknown", "person upsert returned no row");

  try {
    await beginMissionRecord({
      playerEmail: email,
      playerPersonId: person.id,
      createdBy: adminPersonId,
      now,
    });
    return { started: true };
  } catch (err) {
    if (isAppError(err, "conflict") && err.safeMessage === NO_WELCOMER_FREE) {
      return { started: false };
    }
    throw err;
  }
}
