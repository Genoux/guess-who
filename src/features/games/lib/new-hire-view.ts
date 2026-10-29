import type { NewHireStatus, PlayerProgress } from "./new-hire-progress";

export type WelcomerOption = {
  id: string;
  name: string;
  team: string | null;
  color: string | null;
};

export type NewHireRowView = {
  id: string;
  /** The linked player's name; null until they sign in. */
  name: string | null;
  email: string;
  startDate: string;
  signInWarning: boolean;
  welcomer: { id: string; name: string; color: string | null };
  /** Who could welcome this game, the current welcomer first; empty unless it can be edited. */
  welcomerOptions: WelcomerOption[];
  /** How far the player got; null for a game that has not started. */
  progress: PlayerProgress | null;
  /** Days a signed-in player in play has done nothing, from three. */
  stalledDays: number | null;
  status: NewHireStatus;
  editable: boolean;
  /** The email can still be fixed: the new hire has not signed in. */
  emailEditable: boolean;
  started: boolean;
};

export type NewHireGroupKey = "playing" | "upcoming" | "done";

export type NewHireGroup = { key: NewHireGroupKey; label: string; rows: NewHireRowView[] };

export type NewHireBoard = {
  readiness: WelcomerReadiness;
  /** The Montréal date, for the first day's minimum. */
  today: string;
  groups: NewHireGroup[];
};

/** A teammate who cannot be picked as a welcomer yet, and what stops them. */
export type MissingTeammate = {
  id: string;
  name: string;
  email: string;
  color: string | null;
  label: string;
};

export type WelcomerReadiness = {
  ready: number;
  /** Everyone who could ever welcome: visible people who are not an active game's player. */
  total: number;
  missing: MissingTeammate[];
};
