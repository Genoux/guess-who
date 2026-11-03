import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanEditNote } from "./assert-can-edit-note";

describe("assertCanEditNote", () => {
  it("lets the collector edit the note of a collected sticker", () => {
    expect(() => assertCanEditNote({ collected: true })).not.toThrow();
  });

  it("forbids a sticker that is not collected", () => {
    expect(() => assertCanEditNote({ collected: false })).toThrow(
      expect.toSatisfy((err) => isAppError(err, "forbidden")),
    );
  });
});
