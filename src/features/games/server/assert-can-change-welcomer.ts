import "server-only";
import { AppError } from "@inbeat/core/errors";
import { hasStarted } from "../lib/new-hire-progress";
import type { Game } from "../types";
import { eligibleWelcomers } from "./choose-welcomer";
import { listActiveWelcomerIds } from "./game-records";
import { listWelcomerCandidates } from "./new-hire-records";

type ChangeWelcomerInput = {
  game: Pick<Game, "startDate" | "welcomerPersonId">;
  /** The new hire's email after this save. */
  email: string;
  welcomerPersonId: string;
  now: Date;
};

/** Before the game starts, to a teammate who is eligible; the current welcomer's slot is free. */
export async function assertCanChangeWelcomer({
  game,
  email,
  welcomerPersonId,
  now,
}: ChangeWelcomerInput) {
  if (hasStarted(game.startDate, now)) {
    throw new AppError("forbidden", "game has started", {
      safeMessage: "The welcomer is locked once the game has started.",
    });
  }
  const [people, busyWelcomerIds] = await Promise.all([
    listWelcomerCandidates(),
    listActiveWelcomerIds(),
  ]);
  const eligible = eligibleWelcomers({
    people,
    busyWelcomerIds: busyWelcomerIds.filter((id) => id !== game.welcomerPersonId),
    playerEmail: email,
  });
  if (!eligible.some(({ id }) => id === welcomerPersonId)) {
    throw new AppError("forbidden", "welcomer is not eligible", {
      safeMessage: "That teammate can't welcome this game.",
    });
  }
}
