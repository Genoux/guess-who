import { type AppErrorKind, isAppError } from "@inbeat/core/errors";
import { describe, expect, it } from "vitest";
import { assertCanCollect } from "./assert-can-collect";

const allowed = {
  viewerPersonId: "viewer",
  person: { id: "teammate", hidden: false, teamId: "team_1", ask: "Night trains" },
  alreadyCollected: false,
  activeWelcomerId: null,
};

const failsWith = (kind: AppErrorKind) => expect.toSatisfy((err) => isAppError(err, kind));

describe("assertCanCollect", () => {
  it("lets any teammate collect another", () => {
    expect(() => assertCanCollect(allowed)).not.toThrow();
  });

  it("refuses an unknown person", () => {
    expect(() => assertCanCollect({ ...allowed, person: undefined })).toThrow(
      failsWith("not_found"),
    );
  });

  it("refuses the viewer's own sticker and hidden people", () => {
    expect(() =>
      assertCanCollect({ ...allowed, person: { ...allowed.person, id: "viewer" } }),
    ).toThrow(failsWith("not_found"));
    expect(() =>
      assertCanCollect({ ...allowed, person: { ...allowed.person, hidden: true } }),
    ).toThrow(failsWith("not_found"));
  });

  it("lets the viewer collect their own welcomer even when that card slipped out of the album", () => {
    const slipped = { id: "welcomer", hidden: true, teamId: null, ask: null };
    expect(() => assertCanCollect({ ...allowed, person: slipped })).toThrow(failsWith("not_found"));
    expect(() =>
      assertCanCollect({ ...allowed, person: slipped, activeWelcomerId: "welcomer" }),
    ).not.toThrow();
  });

  it("refuses a sticker that is already collected", () => {
    expect(() => assertCanCollect({ ...allowed, alreadyCollected: true })).toThrow(
      failsWith("conflict"),
    );
  });
});
