import "server-only";
import { missionPhase } from "@/entities/mission-phase";
import { isLockedNewHire } from "@/entities/new-hire";
import { hasUnreadClue } from "../lib/game-clues";
import type { TopNavData } from "../lib/top-nav";
import { countAlbum } from "../server/game-records";
import { loadPlayerGame } from "../server/load-player-board";
import { getIsWelcomer } from "./get-is-welcomer";

/**
 * What the top bar needs for the viewer, without loading the whole board: their mission, the
 * count, and the roles they hold. `loadPlayerGame` still ends a mission that ran past day 14.
 */
export async function getTopNav(): Promise<TopNavData> {
  const { game, viewer, person } = await loadPlayerGame();
  const mission = missionPhase(game);
  const runningWelcomerId = mission === "playing" ? (game?.welcomerPersonId ?? null) : null;
  const [{ collected, total }, welcomer] = await Promise.all([
    countAlbum(viewer.personId, runningWelcomerId),
    getIsWelcomer(),
  ]);
  return {
    hasMission: game !== null,
    hasNewClue: hasUnreadClue(game, new Date()),
    collectedCount: collected,
    total,
    admin: viewer.role === "admin",
    welcomer,
    locked: isLockedNewHire(person),
  };
}
