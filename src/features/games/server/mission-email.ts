import "server-only";
import { AppError, isUniqueViolation } from "@inbeat/core/errors";

/** A person has one mission, ever: the unique indexes on email and player turn a second into this. */
export function toMissionWriteError(err: unknown): unknown {
  return isUniqueViolation(err)
    ? new AppError("conflict", "email already has a mission", {
        safeMessage: "This email already has a mission.",
        cause: err,
      })
    : err;
}
