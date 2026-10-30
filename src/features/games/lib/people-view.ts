import type { PlayerProgress } from "./mission-progress";
import type { AsWelcomer } from "./welcomer-readiness";

type PersonIdentity = {
  /** The person's id, or the game's for an email nobody has signed in with. */
  key: string;
  /** The name, or null for an email nobody has signed in with. */
  name: string | null;
  email: string;
  team: { name: string; color: string } | null;
  /** Their profile picture, if they have one. */
  imageUrl: string | null;
  /** A new hire: their mission is their rite of passage. */
  newHire: boolean;
};

export type PlayingRowView = PersonIdentity & {
  /** How they stand as a welcomer, for when their mission ends and they go back to No mission. Null for an email nobody has signed in with, who has no No mission row to go back to. */
  asWelcomer: AsWelcomer | null;
  /** False for an email an admin added that nobody has signed in with. */
  signedIn: boolean;
  gameId: string;
  /** Null on the viewing admin's own mission: a player never learns the welcomer. */
  welcomer: string | null;
  day: number;
  progress: PlayerProgress;
};

export type NoMissionRowView = PersonIdentity & {
  asWelcomer: AsWelcomer;
};

export type DoneRowView = PersonIdentity & {
  gameId: string;
  /** Null on the viewing admin's own mission until they have seen the reveal. */
  welcomer: string | null;
  outcome: { label: string; found: boolean };
  /** "Oct 22". */
  endedOn: string;
};

export type PeopleBoard = {
  playing: PlayingRowView[];
  /** Everyone who signed in and has no mission. */
  noMission: NoMissionRowView[];
  done: DoneRowView[];
};
