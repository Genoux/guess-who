import "server-only";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { firstName } from "../lib/first-name";
import { buildGameClues } from "../lib/game-clues";
import type { ClueNumber } from "../lib/game-schedule";
import { assertIsWelcomer } from "../server/assert-is-welcomer";
import { finalizeExpiredGameRecord } from "../server/finalize-expired-game-record";
import {
  findLatestWelcomerGame,
  findPersonById,
  listClueRows,
  listTeams,
} from "../server/game-records";
import { toClueView } from "../server/to-clue-view";
import { toGameView } from "../server/to-game-view";
import type { Game } from "../types";

export type WelcomerClue = {
  number: ClueNumber;
  /** Clue 1 is generated from the welcomer's team; 2 to 4 are their own drafts. */
  text: string | null;
  /** The welcomer's to write: clues 2 to 4, until they land. */
  editable: boolean;
};

export type WelcomerDesk = {
  playerFirstName: string;
  status: Game["status"];
  clues: WelcomerClue[];
};

/** The game the viewer secretly welcomes; null when they welcome none. */
export async function getWelcomerDesk(): Promise<WelcomerDesk | null> {
  const { person, role } = await getViewerPerson();
  const latest = await findLatestWelcomerGame(person.id);
  if (!latest) return null;
  assertIsWelcomer(latest, person.id);
  const now = new Date();
  const game = await finalizeExpiredGameRecord(latest, now);
  const viewer = { personId: person.id, role };

  const [clueRows, player, teams] = await Promise.all([
    listClueRows(game.id),
    game.playerPersonId ? findPersonById(game.playerPersonId) : undefined,
    listTeams(),
  ]);
  const team = teams.find((candidate) => candidate.id === person.teamId);

  return {
    playerFirstName: player ? firstName(player.name) : "your new hire",
    status: toGameView(game, viewer).status,
    clues: buildGameClues(game, clueRows, team?.name ?? null)
      .map((clue) => toClueView(clue, game, viewer, now))
      .map((clue) => ({
        number: clue.number as ClueNumber,
        text: clue.text,
        editable: clue.number !== 1 && !clue.released,
      })),
  };
}
