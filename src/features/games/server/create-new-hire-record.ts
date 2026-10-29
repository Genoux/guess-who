import "server-only";
import { AppError } from "@inbeat/core/errors";
import { games } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { assertFirstDayNotPast } from "./assert-first-day-not-past";
import { chooseWelcomer } from "./choose-welcomer";
import { listActiveWelcomerIds } from "./game-records";
import { assertNotWelcoming, findSignedInPersonId, toNewHireWriteError } from "./new-hire-email";
import { listWelcomerCandidates } from "./new-hire-records";

type CreateNewHireInput = {
  /** Normalized. */
  email: string;
  startDate: string;
  adminPersonId: string;
  now: Date;
};

/** Starts a game for a new hire with a random free welcomer. */
export async function createNewHireRecord({
  email,
  startDate,
  adminPersonId,
  now,
}: CreateNewHireInput) {
  assertFirstDayNotPast(startDate, now);
  await assertNotWelcoming(email, now);
  const [candidates, busyWelcomerIds, playerPersonId] = await Promise.all([
    listWelcomerCandidates(),
    listActiveWelcomerIds(),
    findSignedInPersonId(email),
  ]);
  // shortcut: two adds in the same instant can pick the same welcomer; a partial unique index on
  // games(welcomer_person_id) where status = 'active' closes it if admins ever add in parallel.
  const welcomer = chooseWelcomer({ people: candidates, busyWelcomerIds, playerEmail: email });

  try {
    const [game] = await db
      .insert(games)
      .values({
        playerEmail: email,
        playerPersonId,
        welcomerPersonId: welcomer.id,
        startDate,
        createdBy: adminPersonId,
      })
      .returning({ id: games.id });
    if (!game) throw new AppError("unknown", "game insert returned no row");
    return { gameId: game.id, welcomerName: welcomer.name };
  } catch (err) {
    throw toNewHireWriteError(err);
  }
}
