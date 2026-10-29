import "server-only";
import { AppError } from "@inbeat/core/errors";
import { gameDay } from "../lib/game-schedule";

/** Today, by the Montréal date, or later. */
export function assertFirstDayNotPast(startDate: string, now: Date) {
  if (gameDay(startDate, now) > 1) {
    throw new AppError("validation", "first day is in the past", {
      safeMessage: "Pick today or a later day.",
    });
  }
}
