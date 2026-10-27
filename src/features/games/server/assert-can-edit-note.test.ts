import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanEditNote } from "./assert-can-edit-note";

const allowed = { game: { playerPersonId: "player" }, viewerPersonId: "player", collected: true };

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanEditNote", () => {
  it("lets the player edit the note of a collected sticker", () => {
    expect(() => assertCanEditNote(allowed)).not.toThrow();
  });

  it("forbids anyone but the player", () => {
    expect(() => assertCanEditNote({ ...allowed, viewerPersonId: "teammate" })).toThrow(
      failsWith("forbidden"),
    );
  });

  it("forbids a sticker that is not collected", () => {
    expect(() => assertCanEditNote({ ...allowed, collected: false })).toThrow(
      failsWith("forbidden"),
    );
  });
});
