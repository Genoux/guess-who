import type { NoMissionRowView, PeopleBoard, PlayingRowView } from "./people-view";

/** What an admin action does to the board, before the server has answered. */
export type PeopleMove =
  | { type: "turnOn"; keys: readonly string[] }
  | { type: "startAsNewHire"; key: string }
  | { type: "end"; gameId: string }
  | { type: "remove"; key: string };

/** The welcomer is picked on the server; until it answers the row has no name for it. */
const PICKING_WELCOMER = "";

const toPlaying = (row: NoMissionRowView): PlayingRowView => ({
  ...row,
  gameId: `pending-${row.key}`,
  welcomer: PICKING_WELCOMER,
  day: 1,
  progress: { label: "0", activity: "Not yet" },
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
 * (or drops them), so each person is in exactly one view at every moment. The same
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
    case "startAsNewHire": {
      const chosen = board.noMission.find(({ key }) => key === move.key);
      return chosen
        ? {
            ...board,
            noMission: board.noMission.filter((row) => row !== chosen),
            playing: [toPlaying({ ...chosen, newHire: true }), ...board.playing],
          }
        : board;
    }
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
  }
}
