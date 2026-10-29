import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { Person } from "@/db/schema";
import { cluesReady } from "../lib/welcomer-readiness";
import { isInAlbum } from "./is-in-album";

type Candidate = Pick<Person, "id" | "email" | "hidden" | "teamId" | "ask"> & {
  /** Numbers of the clues (2 to 4) with text. */
  writtenClues: readonly number[];
};

type EligibleInput<T extends Candidate> = {
  people: readonly T[];
  busyWelcomerIds: readonly string[];
  playerEmail: string;
};

/**
 * Teammates with a finished card and all three clues written, who are not welcoming anyone else,
 * nor are the new hire.
 */
export function eligibleWelcomers<T extends Candidate>({
  people,
  busyWelcomerIds,
  playerEmail,
}: EligibleInput<T>): T[] {
  const playerId = people.find(({ email }) => email === playerEmail)?.id ?? "";
  return people.filter(
    (person) =>
      isInAlbum(person, playerId) &&
      cluesReady(person.writtenClues) &&
      !busyWelcomerIds.includes(person.id),
  );
}

/** A random one of the eligible teammates. */
export function chooseWelcomer<T extends Candidate>({
  random = Math.random,
  ...input
}: EligibleInput<T> & { random?: () => number }): T {
  const free = eligibleWelcomers(input);
  const welcomer = free[Math.floor(random() * free.length)];
  if (!welcomer) {
    throw new AppError("not_found", "no free welcomer", {
      safeMessage: "No teammate is free to welcome them yet.",
    });
  }
  return welcomer;
}
