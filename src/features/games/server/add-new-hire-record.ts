import "server-only";
import { AppError } from "@inbeat/core/errors";
import { people } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { hasGameForPlayerEmail } from "@/shared/lib/person-records";
import { ALREADY_HAS_MISSION } from "./begin-mission-record";

type AddNewHireInput = {
  /** Normalized. */
  email: string;
};

// Until the person signs in, the row carries the part of the email before the @, which the
// sign-in replaces with their name from Clerk.
const placeholderName = (email: string) => email.split("@")[0] ?? email;

/**
 * Adds a new hire by email: the person row is created if they have none and flagged as a new
 * hire, so the flag exists before they sign in. No mission starts; an admin turns it on later.
 */
export async function addNewHireRecord({ email }: AddNewHireInput) {
  if (await hasGameForPlayerEmail(email)) {
    throw new AppError("conflict", "email already has a mission", {
      safeMessage: ALREADY_HAS_MISSION,
    });
  }
  await db
    .insert(people)
    .values({ email, name: placeholderName(email), newHire: true })
    .onConflictDoUpdate({ target: people.email, set: { newHire: true } });
}
