import { clueDay } from "./game-clues";
import { CLUE_NUMBERS, GAME_DAYS } from "./game-schedule";

/** Dev-only: the whole app as one signed-in tester sees it, set from the dev panel. */
export type DevState = {
  role: "member" | "admin";
  /** New hire plays a game, welcomer welcomes one, teammate has neither. */
  view: "new-hire" | "welcomer" | "teammate";
  outcome: "active" | "found" | "revealed";
  day: number;
  /** Clues 2 to 4 the welcomer has written, in order. */
  cluesWritten: number;
  /** The highest clue the player has turned over. */
  cluesRead: number;
  album: "empty" | "started";
  introSeen: boolean;
  card: "empty" | "filled";
};

export const DEV_STATE_DEFAULT: DevState = {
  role: "member",
  view: "new-hire",
  outcome: "active",
  day: 7,
  cluesWritten: 3,
  cluesRead: 1,
  album: "started",
  introSeen: true,
  card: "filled",
};

const REVEALED_DAY = GAME_DAYS + 1;

export function releasedClueCount(day: number): number {
  return CLUE_NUMBERS.filter((number) => clueDay(number) <= day).length;
}

/** The game day to seed: a revealed game is past its last day. */
export function seedDay(state: DevState): number {
  return state.outcome === "revealed" ? REVEALED_DAY : state.day;
}

export function devFieldEnabled(state: DevState, field: keyof DevState): boolean {
  const newHire = state.view === "new-hire";
  const inGame = state.view !== "teammate";
  switch (field) {
    case "role":
    case "view":
      return true;
    case "outcome":
    case "cluesWritten":
      return inGame;
    case "day":
      return inGame && state.outcome !== "revealed";
    case "cluesRead":
    case "album":
      return newHire;
    case "introSeen":
      return newHire && state.outcome === "active";
    case "card":
      // A new hire makes their sticker once their game ends; until then /card sends them to play.
      return !(newHire && state.outcome === "active");
  }
}

export function devOptionDisabled<Field extends keyof DevState>(
  state: DevState,
  field: Field,
  value: DevState[Field],
): boolean {
  if (field === "cluesRead") return (value as number) > releasedClueCount(seedDay(state));
  if (field === "album") return state.outcome === "found" && value === "empty";
  return false;
}

/** Pulls every field back inside what the chosen view, outcome and day allow. */
export function normalizeDevState(state: DevState): DevState {
  const ended = state.outcome !== "active";
  return {
    ...state,
    cluesRead: Math.min(state.cluesRead, releasedClueCount(seedDay(state))),
    album: state.outcome === "found" ? "started" : state.album,
    introSeen: ended || state.introSeen,
  };
}
