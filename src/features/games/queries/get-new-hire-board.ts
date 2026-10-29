import "server-only";
import { authorizeAdmin } from "@/shared/lib/auth";
import type { NewHireBoard } from "../lib/new-hire-view";
import { listActiveWelcomerIds } from "../server/game-records";
import {
  listGameActivity,
  listNewHireGames,
  listWelcomerCandidates,
} from "../server/new-hire-records";
import { toNewHireBoard } from "../server/to-new-hire-board";

/** Every game, grouped for the admin's New hires page. */
export async function getNewHireBoard(): Promise<NewHireBoard> {
  await authorizeAdmin();
  const [games, activity, candidates, busyWelcomerIds] = await Promise.all([
    listNewHireGames(),
    listGameActivity(),
    listWelcomerCandidates(),
    listActiveWelcomerIds(),
  ]);
  return toNewHireBoard({
    games,
    activity,
    candidates,
    busyWelcomerIds,
    now: new Date(),
  });
}
