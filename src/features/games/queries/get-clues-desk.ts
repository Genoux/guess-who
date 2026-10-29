import "server-only";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { buildDeskClues, type DeskClue } from "../lib/desk-clues";
import { firstName } from "../lib/first-name";
import { hasStarted } from "../lib/new-hire-progress";
import { findActiveWelcomerGame } from "../server/find-active-welcomer-game";
import { findPersonById, listTeams, listWelcomerClues } from "../server/game-records";

export type CluesDesk = {
  /** They are the secret welcomer of a game that has not ended. */
  welcoming: boolean;
  /** The new hire's first name; a stand-in until they sign in. */
  playerFirstName: string;
  /** False until the new hire signs in, when the first name is a stand-in. */
  playerNamed: boolean;
  clues: DeskClue[];
};

/** The viewer's own clues, and the game they are welcoming, if any. */
export async function getCluesDesk(): Promise<CluesDesk> {
  const { person } = await getViewerPerson();
  const now = new Date();
  const [saved, game, teams] = await Promise.all([
    listWelcomerClues(person.id),
    findActiveWelcomerGame(person.id, now),
    listTeams(),
  ]);
  const player = game?.playerPersonId ? await findPersonById(game.playerPersonId) : undefined;
  const team = teams.find((candidate) => candidate.id === person.teamId);

  return {
    welcoming: game !== null,
    playerFirstName: player ? firstName(player.name) : "your new hire",
    playerNamed: player !== undefined,
    clues: buildDeskClues({
      saved,
      teamName: team?.name ?? null,
      started: game !== null && hasStarted(game.startDate, now),
    }),
  };
}
