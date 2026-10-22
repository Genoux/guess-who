import "server-only";
import type { StickerPerson } from "@/shared/components/game/sticker-view";
import { getViewerPerson } from "@/shared/lib/viewer-person";
import { firstName } from "../lib/first-name";
import { buildGameClues, clueDay } from "../lib/game-clues";
import { GAME_DAYS, gameDay } from "../lib/game-schedule";
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
import { NO_TEAM, toStickerPerson } from "../server/to-sticker-person";
import { toStickerView } from "../server/to-sticker-view";
import type { Game } from "../types";

const NEW_HIRE_ASK = "Just joined. Say hi.";

export type WelcomerClue = {
  number: 2 | 3 | 4;
  day: number;
  /** The welcomer's own draft. */
  text: string | null;
  /** Landed with the player: read-only from now on. */
  released: boolean;
};

export type WelcomerDesk = {
  playerFirstName: string;
  /** The new hire's sticker as a teammate sees it before collecting: public fields only. */
  player: StickerPerson;
  status: Game["status"];
  day: number;
  totalDays: number;
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
  const team = player?.teamId
    ? teams.find((candidate) => candidate.id === player.teamId)
    : undefined;
  const playerSticker = player
    ? toStickerPerson(
        toStickerView(player, { personId: person.id, collectedPersonIds: new Set() }),
        team,
      )
    : {
        name: "Your new hire",
        number: "—",
        team: NO_TEAM.name,
        color: NO_TEAM.color,
        tint: NO_TEAM.tint,
        ask: "",
      };

  return {
    playerFirstName: player ? firstName(player.name) : "your new hire",
    player: { ...playerSticker, ask: playerSticker.ask || NEW_HIRE_ASK },
    status: toGameView(game, viewer).status,
    day: Math.min(GAME_DAYS, Math.max(1, gameDay(game.startDate, now))),
    totalDays: GAME_DAYS,
    clues: buildGameClues(game, clueRows, null)
      .filter((clue) => clue.number !== 1)
      .map((clue) => toClueView(clue, game, viewer, now))
      .map((clue) => ({
        number: clue.number as WelcomerClue["number"],
        day: clueDay(clue.number),
        text: clue.text,
        released: clue.released,
      })),
  };
}
