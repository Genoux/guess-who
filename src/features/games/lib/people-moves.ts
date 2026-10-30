import type { NoMissionRowView, PeopleBoard, PlayingRowView } from "./people-view";

/** What an admin action does to the board, before the server has answered. */
export type PeopleMove =
  | { type: "turnOn"; keys: readonly string[] }
  | { type: "setNewHire"; key: string }
  | { type: "flagNewHire"; key: string }
  | { type: "end"; gameId: string }
  | { type: "add"; email: string }
  | { type: "changeEmail"; gameId: string; email: string };

/** The welcomer is picked on the server; until it answers the row has no name for it. */
const PICKING_WELCOMER = "";

const toPlaying = (
  row: Pick<NoMissionRowView, "key" | "name" | "email" | "team" | "imageUrl" | "asWelcomer">,
  newHire: boolean,
): PlayingRowView => ({
  ...row,
  newHire,
  gameId: `pending-${row.key}`,
  signedIn: true,
  welcomer: PICKING_WELCOMER,
  day: 1,
  progress: { label: "0", activity: "Not yet" },
});

const toNoMission = (
  row: Pick<
    PlayingRowView,
    "key" | "name" | "email" | "team" | "imageUrl" | "newHire" | "asWelcomer"
  >,
): NoMissionRowView | null =>
  row.asWelcomer
    ? {
        key: row.key,
        name: row.name,
        email: row.email,
        team: row.team,
        imageUrl: row.imageUrl,
        newHire: row.newHire,
        asWelcomer: row.asWelcomer,
      }
    : null;

/**
 * The board after one move. Every move takes a person out of one view and puts them in another
 * (or adds or drops an invite), so each person is in exactly one view at every moment. The same
 * function shows the move at once, and reconciles to the server's board once it answers.
 */
export function applyPeopleMove(board: PeopleBoard, move: PeopleMove): PeopleBoard {
  switch (move.type) {
    case "turnOn": {
      const chosen = board.noMission.filter(({ key }) => move.keys.includes(key));
      return {
        ...board,
        noMission: board.noMission.filter(({ key }) => !move.keys.includes(key)),
        playing: [...chosen.map((row) => toPlaying(row, row.newHire)), ...board.playing],
      };
    }
    case "setNewHire": {
      const chosen = board.noMission.find(({ key }) => key === move.key);
      if (!chosen) return board;
      return {
        ...board,
        noMission: board.noMission.filter(({ key }) => key !== move.key),
        playing: [toPlaying(chosen, true), ...board.playing],
      };
    }
    case "flagNewHire":
      return {
        ...board,
        noMission: board.noMission.map((row) =>
          row.key === move.key ? { ...row, newHire: true } : row,
        ),
      };
    case "end": {
      const row = board.playing.find(({ gameId }) => gameId === move.gameId);
      const back = row ? toNoMission(row) : null;
      return {
        ...board,
        playing: board.playing.filter(({ gameId }) => gameId !== move.gameId),
        noMission: back ? [...board.noMission, back] : board.noMission,
      };
    }
    case "add": {
      const known = board.noMission.find(({ email }) => email === move.email);
      if (known) {
        return {
          ...board,
          noMission: board.noMission.filter(({ key }) => key !== known.key),
          playing: [toPlaying(known, true), ...board.playing],
        };
      }
      const invite: PlayingRowView = {
        key: `pending-${move.email}`,
        gameId: `pending-${move.email}`,
        name: null,
        email: move.email,
        team: null,
        imageUrl: null,
        newHire: true,
        asWelcomer: null,
        signedIn: false,
        welcomer: PICKING_WELCOMER,
        day: 1,
        progress: { label: "0", activity: "Not yet" },
      };
      return { ...board, playing: [invite, ...board.playing] };
    }
    case "changeEmail":
      return {
        ...board,
        playing: board.playing.map((row) =>
          row.gameId === move.gameId ? { ...row, email: move.email } : row,
        ),
      };
  }
}
