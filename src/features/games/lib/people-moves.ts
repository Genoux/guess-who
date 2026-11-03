import type { NoMissionRowView, PeopleBoard, PlayingRowView } from "./people-view";

/** What an admin action does to the board, before the server has answered. */
export type PeopleMove =
  | { type: "turnOn"; keys: readonly string[] }
  | { type: "setNewHire"; key: string }
  | { type: "end"; gameId: string }
  | { type: "remove"; key: string }
  | { type: "add"; email: string }
  | { type: "changeEmail"; gameId: string; email: string };

/** The welcomer is picked on the server; until it answers the row has no name for it. */
const PICKING_WELCOMER = "";

const toPlaying = (row: NoMissionRowView): PlayingRowView => ({
  ...row,
  gameId: `pending-${row.key}`,
  welcomer: PICKING_WELCOMER,
  day: 1,
  progress: { label: "0", activity: "Not yet" },
});

const invitedRow = (email: string): NoMissionRowView => ({
  key: `pending-${email}`,
  name: null,
  email,
  team: null,
  imageUrl: null,
  newHire: true,
  signedIn: false,
  hasWelcomed: false,
  asWelcomer: { kind: "cardNotDone" },
});

const toNoMission = ({
  gameId: _gameId,
  welcomer: _welcomer,
  day: _day,
  progress: _progress,
  ...row
}: PlayingRowView): NoMissionRowView => row;

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
        playing: [...chosen.map(toPlaying), ...board.playing],
      };
    }
    case "setNewHire":
      return {
        ...board,
        noMission: board.noMission.map((row) =>
          row.key === move.key ? { ...row, newHire: true } : row,
        ),
      };
    case "end": {
      const row = board.playing.find(({ gameId }) => gameId === move.gameId);
      return {
        ...board,
        playing: board.playing.filter(({ gameId }) => gameId !== move.gameId),
        noMission: row ? [...board.noMission, toNoMission(row)] : board.noMission,
      };
    }
    case "remove":
      return {
        playing: board.playing.filter(({ key }) => key !== move.key),
        noMission: board.noMission.filter(({ key }) => key !== move.key),
        done: board.done.filter(({ key }) => key !== move.key),
      };
    case "add": {
      const known = board.noMission.find(({ email }) => email === move.email);
      return {
        ...board,
        noMission: board.noMission.filter((row) => row !== known),
        playing: [
          toPlaying({ ...(known ?? invitedRow(move.email)), newHire: true }),
          ...board.playing,
        ],
      };
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
