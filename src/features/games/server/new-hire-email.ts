import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";
import { findPersonByEmail } from "@/shared/lib/person-records";
import { findActiveWelcomerGame } from "./find-active-welcomer-game";

/** The player's row when they already signed in; otherwise it is linked on their first sign-in. */
export async function findSignedInPersonId(email: string): Promise<string | null> {
  const person = await findPersonByEmail(email);
  return person?.clerkUserId ? person.id : null;
}

/** Someone who is welcoming a new hire right now cannot be one themselves. */
export async function assertNotWelcoming(email: string, now: Date) {
  const person = await findPersonByEmail(email);
  if (person && (await findActiveWelcomerGame(person.id, now))) {
    throw new AppError("conflict", "email belongs to a current welcomer", {
      safeMessage: "They're welcoming someone right now.",
    });
  }
}

/** The unique index allows one active game per email; a second one surfaces as this conflict. */
export function toNewHireWriteError(err: unknown): unknown {
  return isUniqueViolation(err)
    ? new AppError("conflict", "email already has an active game", {
        safeMessage: "This email already has a game.",
        cause: err,
      })
    : err;
}
