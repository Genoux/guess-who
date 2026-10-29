import "server-only";
import { AppError } from "@inbeat/core/errors";
import { hasStarted } from "../lib/new-hire-progress";
import { assertFirstDayNotPast } from "./assert-first-day-not-past";

export function assertCanMoveFirstDay(currentStartDate: string, nextStartDate: string, now: Date) {
  if (hasStarted(currentStartDate, now)) {
    throw new AppError("validation", "game has started", {
      safeMessage: "The first day is locked once the game has started.",
    });
  }
  assertFirstDayNotPast(nextStartDate, now);
}
