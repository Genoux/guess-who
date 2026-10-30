import "server-only";
import { missionPhase } from "@/entities/mission-phase";
import { firstName } from "../lib/first-name";
import { loadPlayerGame } from "../server/load-player-board";

export type PlayerWelcome = { firstName: string; seen: boolean };

/** The first name for the tour, while a mission is running; the tour itself uses a fictional cast. */
export async function getPlayerWelcome(): Promise<PlayerWelcome | null> {
  const { game, person } = await loadPlayerGame();
  if (missionPhase(game) !== "playing") return null;
  return { firstName: firstName(person.name), seen: game?.introSeenAt != null };
}
