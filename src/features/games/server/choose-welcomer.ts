import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Person } from "@/db/schema";
import { cluesReady } from "../lib/welcomer-readiness";
import { isInAlbum } from "./is-in-album";

export const NO_WELCOMER_FREE = "No welcomer is free right now. Try again tomorrow.";

export type WelcomerCandidate = Pick<Person, "id" | "email" | "hidden" | "teamId" | "ask"> & {
  /** Numbers of the clues (2 to 4) with text. */
  writtenClues: readonly number[];
};

type EligibleInput<T extends WelcomerCandidate> = {
  people: readonly T[];
  busyWelcomerIds: readonly string[];
  /** Null for an invite who has no person row yet. */
  playerPersonId: string | null;
  /** Who the player welcomes right now, so two people never welcome each other. */
  welcomedPersonId: string | null;
};

/**
 * Teammates with a finished card and all three clues written, who are not welcoming a mission,
 * nor are the player, nor the person the player welcomes.
 */
export function eligibleWelcomers<T extends WelcomerCandidate>({
  people,
  busyWelcomerIds,
  playerPersonId,
  welcomedPersonId,
}: EligibleInput<T>): T[] {
  return people.filter(
    (person) =>
      isInAlbum(person, playerPersonId) &&
      cluesReady(person.writtenClues) &&
      !busyWelcomerIds.includes(person.id) &&
      person.id !== welcomedPersonId,
  );
}

/** A random one of the eligible teammates. */
export function chooseWelcomer<T extends WelcomerCandidate>({
  random = Math.random,
  ...input
}: EligibleInput<T> & { random?: () => number }): T {
  const free = eligibleWelcomers(input);
  const welcomer = free[Math.floor(random() * free.length)];
  if (!welcomer)
    throw new AppError("conflict", "no free welcomer", { safeMessage: NO_WELCOMER_FREE });
  return welcomer;
}
