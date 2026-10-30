import { describe, expect, it } from "vitest";
import { applyPeopleMove } from "./people-moves";
import type { PeopleBoard } from "./people-view";

const can = { kind: "canWelcome" } as const;
const base = { team: null, name: null, imageUrl: null, newHire: false };

const board = (): PeopleBoard => ({
  playing: [
    {
      ...base,
      key: "p1",
      name: "Pia",
      email: "pia@x.com",
      gameId: "g-play",
      asWelcomer: can,
      signedIn: true,
      welcomer: "Ana",
      day: 3,
      progress: { label: "1", activity: "just now" },
    },
    {
      ...base,
      key: "g-inv",
      email: "kim@gmail.com",
      gameId: "g-inv",
      asWelcomer: null,
      signedIn: false,
      welcomer: "Ben",
      day: 1,
      progress: { label: "0", activity: "Not yet" },
    },
  ],
  noMission: [
    { ...base, key: "n1", name: "Nia", email: "nia@x.com", asWelcomer: can },
    { ...base, key: "n2", name: "Ned", email: "ned@x.com", asWelcomer: can },
  ],
  done: [],
});

const keys = (view: readonly { key: string }[]) => view.map(({ key }) => key);
const everyone = (b: PeopleBoard) =>
  [...b.playing, ...b.noMission, ...b.done].map(({ key }) => key).toSorted();

describe("applyPeopleMove", () => {
  it("turns on: No mission to Playing on day 1, first in line", () => {
    const next = applyPeopleMove(board(), { type: "turnOn", keys: ["n2"] });
    expect(keys(next.noMission)).toEqual(["n1"]);
    expect(keys(next.playing)).toEqual(["n2", "p1", "g-inv"]);
    expect(next.playing[0]).toMatchObject({
      signedIn: true,
      day: 1,
      progress: { label: "0", activity: "Not yet" },
    });
  });

  it("turns on nobody the board does not list", () => {
    expect(applyPeopleMove(board(), { type: "turnOn", keys: ["zed"] })).toEqual(board());
  });

  it("ends a mission: Playing back to No mission, with how they stand", () => {
    const next = applyPeopleMove(board(), { type: "end", gameId: "g-play" });
    expect(keys(next.playing)).toEqual(["g-inv"]);
    expect(next.noMission.find(({ key }) => key === "p1")).toMatchObject({
      name: "Pia",
      asWelcomer: can,
    });
  });

  it("ends an invite's mission: it has no No mission row, so it leaves the board", () => {
    const next = applyPeopleMove(board(), { type: "end", gameId: "g-inv" });
    expect(everyone(next)).not.toContain("g-inv");
    expect(keys(next.noMission)).toEqual(["n1", "n2"]);
  });

  it("adds a new hire to Playing as an invite", () => {
    const next = applyPeopleMove(board(), { type: "add", email: "new@x.com" });
    expect(next.playing[0]).toMatchObject({
      email: "new@x.com",
      name: null,
      signedIn: false,
      newHire: true,
      day: 1,
    });
  });

  it("adds someone who already signed in by moving their No mission row to Playing", () => {
    const next = applyPeopleMove(board(), { type: "add", email: "nia@x.com" });
    expect(keys(next.noMission)).toEqual(["n2"]);
    expect(next.playing[0]).toMatchObject({ key: "n1", signedIn: true, newHire: true });
  });

  it("changes an invite's email in place", () => {
    const next = applyPeopleMove(board(), {
      type: "changeEmail",
      gameId: "g-inv",
      email: "kim@new.com",
    });
    expect(next.playing.find(({ gameId }) => gameId === "g-inv")?.email).toBe("kim@new.com");
  });

  it("sets someone as a new hire: No mission to Playing, flagged as a new hire", () => {
    const next = applyPeopleMove(board(), { type: "setNewHire", key: "n1" });
    expect(keys(next.noMission)).toEqual(["n2"]);
    expect(next.playing[0]).toMatchObject({ key: "n1", signedIn: true, newHire: true });
  });

  it("flags someone as a new hire without a mission: they stay in No mission with the tag", () => {
    const next = applyPeopleMove(board(), { type: "flagNewHire", key: "n1" });
    expect(keys(next.noMission)).toEqual(["n1", "n2"]);
    expect(next.noMission[0]?.newHire).toBe(true);
    expect(next.noMission[1]?.newHire).toBe(false);
    expect(next.playing).toEqual(board().playing);
  });

  it("turning on a flagged new hire keeps them a new hire in Playing", () => {
    const flagged = applyPeopleMove(board(), { type: "flagNewHire", key: "n1" });
    const next = applyPeopleMove(flagged, { type: "turnOn", keys: ["n1"] });
    expect(next.playing[0]).toMatchObject({ key: "n1", newHire: true });
  });

  it("turning someone on from No mission is not a new hire", () => {
    const next = applyPeopleMove(board(), { type: "turnOn", keys: ["n1"] });
    expect(next.playing[0]?.newHire).toBe(false);
  });

  it("keeps every person in exactly one view, whatever the move", () => {
    const start = board();
    const moves = [
      { type: "turnOn", keys: ["n1", "n2"] },
      { type: "end", gameId: "g-play" },
      { type: "add", email: "nia@x.com" },
      { type: "add", email: "fresh@x.com" },
      { type: "setNewHire", key: "n2" },
      { type: "flagNewHire", key: "n1" },
    ] as const;
    for (const move of moves) {
      const ids = everyone(applyPeopleMove(start, move));
      expect(new Set(ids).size).toBe(ids.length);
    }
    const chained = moves.reduce(applyPeopleMove, start);
    const ids = everyone(chained);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
