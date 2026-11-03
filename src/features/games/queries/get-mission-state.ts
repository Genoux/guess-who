import "server-only";
import { type MissionPhase, missionPhase } from "@/entities/mission-phase";
import { loadPlayerGame } from "../server/load-player-board";

/** Where the viewer's own mission stands; none until it starts. */
export async function getMissionState(): Promise<MissionPhase> {
  return missionPhase((await loadPlayerGame()).game);
}
