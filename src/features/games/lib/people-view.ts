import type { PlayerProgress } from "./mission-progress";
import type { AsWelcomer } from "./welcomer-readiness";

export type PersonIdentity = {
  key: string;
  /** The name, or null for an email nobody has signed in with. */
  name: string | null;
  email: string;
  team: { name: string; color: string } | null;
  /** Their profile picture, if they have one. */
  imageUrl: string | null;
  /** A new hire: their mission is their rite of passage. */
  newHire: boolean;
  /** False for an email an admin added that nobody has signed in with. */
  signedIn: boolean;
};

export type PlayingRowView = PersonIdentity & {
  /** How they stand as a welcomer, for when their mission ends and they go back to No mission. */
  asWelcomer: AsWelcomer;
  gameId: string;
  /** Null on the viewing admin's own mission: a player never learns the welcomer. */
  welcomer: string | null;
  day: number;
  progress: PlayerProgress;
};

export type NoMissionRowView = PersonIdentity & {
  asWelcomer: AsWelcomer;
  /** Their welcomer left Deel mid-mission and the mission was reset: an admin starts them again. */
  welcomerLeft: boolean;
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
  /** Everyone with no mission, invited emails included. */
  noMission: NoMissionRowView[];
  done: DoneRowView[];
};
