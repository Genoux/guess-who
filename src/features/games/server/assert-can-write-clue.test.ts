import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanWriteClue } from "./assert-can-write-clue";

const beforeStart = new Date("2026-11-01T15:00:00Z");
const day3 = new Date("2026-11-04T15:00:00Z");
const allowed = {
  activeGame: { startDate: "2026-11-02" } as { startDate: string } | null,
  number: 2,
  savedText: null as string | null,
  now: beforeStart,
};

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanWriteClue", () => {
  it.each([2, 3, 4])("allows clue %i", (number) => {
    expect(() => assertCanWriteClue({ ...allowed, number })).not.toThrow();
  });

  it("forbids the generated team clue", () => {
    expect(() => assertCanWriteClue({ ...allowed, number: 1 })).toThrow(failsWith("forbidden"));
  });

  it("lets a teammate who welcomes no game write and change clues freely", () => {
    expect(() => assertCanWriteClue({ ...allowed, activeGame: null })).not.toThrow();
    expect(() =>
      assertCanWriteClue({ ...allowed, activeGame: null, savedText: "Old", now: day3 }),
    ).not.toThrow();
  });

  it("lets a saved clue change before their game starts", () => {
    expect(() => assertCanWriteClue({ ...allowed, savedText: "Old" })).not.toThrow();
  });

  it("locks a saved clue while their game is playing, from day 1", () => {
    const playing = { ...allowed, savedText: "Old", now: day3 };
    expect(() => assertCanWriteClue(playing)).toThrow(failsWith("forbidden"));
    expect(() => assertCanWriteClue({ ...playing, now: new Date("2026-11-02T15:00:00Z") })).toThrow(
      failsWith("forbidden"),
    );
  });

  it("lets a clue that was never written be written once while playing", () => {
    expect(() => assertCanWriteClue({ ...allowed, now: day3 })).not.toThrow();
  });

  it("tells why a saved clue is locked", () => {
    expect(() => assertCanWriteClue({ ...allowed, savedText: "Old", now: day3 })).toThrow(
      expect.objectContaining({ safeMessage: "Locked while the new hire is playing." }),
    );
  });
});
