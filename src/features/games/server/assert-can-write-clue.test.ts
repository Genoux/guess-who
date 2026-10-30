import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanWriteClue } from "./assert-can-write-clue";

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanWriteClue", () => {
  it.each([2, 3, 4])("allows clue %i while they welcome nobody", (number) => {
    expect(() => assertCanWriteClue({ number, welcoming: false })).not.toThrow();
  });

  it("forbids the generated team clue", () => {
    expect(() => assertCanWriteClue({ number: 1, welcoming: false })).toThrow(
      failsWith("forbidden"),
    );
  });

  it("locks every clue while they welcome a started mission", () => {
    expect(() => assertCanWriteClue({ number: 2, welcoming: true })).toThrow(
      expect.objectContaining({ safeMessage: "Locked while the new hire is playing." }),
    );
    expect(() => assertCanWriteClue({ number: 2, welcoming: true })).toThrow(
      failsWith("forbidden"),
    );
  });
});
