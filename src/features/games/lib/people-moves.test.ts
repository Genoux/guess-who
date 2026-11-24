import { describe, expect, it } from "vitest";
import { applyPeopleMove } from "./people-moves";
import type { PeopleBoard } from "./people-view";

const can = { kind: "canWelcome" } as const;
const base = {
  team: null,
  name: null,
  imageUrl: null,
  newHire: false,
  signedIn: true,
};

const board = (): PeopleBoard => ({
  playing: [
    {
      ...base,
      key: "p1",
      name: "Pia",
      email: "pia@x.com",
      gameId: "g-play",
      asWelcomer: can,
      welcomer: "Ana",
      welcomerPhotoUrl: null,
      day: 3,
      progress: { label: "1", activity: "just now" },
    },
    {
      ...base,
      key: "k1",
      email: "kim@gmail.com",
      gameId: "g-inv",
      asWelcomer: can,
      signedIn: false,
      welcomer: "Ben",
      welcomerPhotoUrl: null,
      day: 1,
      progress: { label: "0", activity: "Not yet" },
    },
  ],
  noMission: [
    { ...base, key: "n1", name: "Nia", email: "nia@x.com", asWelcomer: can, welcomerLeft: false },
    { ...base, key: "n2", name: "Ned", email: "ned@x.com", asWelcomer: can, welcomerLeft: false },
  ],
  done: [
    {
      ...base,
      key: "d1",
      name: "Dee",
      email: "dee@x.com",
      asWelcomer: can,
      gameId: "g-done",
      welcomer: "Cam",
      welcomerPhotoUrl: null,
      outcome: { label: "Found", found: true },
      endedOn: "Oct 22",
    },
  ],
});

const keys = (view: readonly { key: string }[]) => view.map(({ key }) => key);
const everyone = (b: PeopleBoard) =>
  [...b.playing, ...b.noMission, ...b.done].map(({ key }) => key).toSorted();

describe("applyPeopleMove", () => {
  it("turns on: No mission to Playing on day 1, first in line", () => {
    const next = applyPeopleMove(board(), { type: "turnOn", keys: ["n2"] });
    expect(keys(next.noMission)).toEqual(["n1"]);
    expect(keys(next.playing)).toEqual(["n2", "p1", "k1"]);
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
    expect(keys(next.playing)).toEqual(["k1"]);
    expect(next.noMission.find(({ key }) => key === "p1")).toMatchObject({
      name: "Pia",
      asWelcomer: can,
    });
  });

  it("ends an invite's mission: back to No mission, still not signed in", () => {
    const next = applyPeopleMove(board(), { type: "end", gameId: "g-inv" });
    expect(keys(next.playing)).toEqual(["p1"]);
    expect(next.noMission.find(({ key }) => key === "k1")).toMatchObject({
      email: "kim@gmail.com",
      signedIn: false,
    });
  });

  it("starting someone drops the welcomer-left note; ending a mission never adds it", () => {
    const left = {
      ...board(),
      noMission: board().noMission.map((row) => ({ ...row, welcomerLeft: true })),
    };
    const started = applyPeopleMove(left, { type: "turnOn", keys: ["n1"] });
    expect(started.playing[0]).not.toHaveProperty("welcomerLeft");
    const ended = applyPeopleMove(board(), { type: "end", gameId: "g-play" });
    expect(ended.noMission.find(({ key }) => key === "p1")?.welcomerLeft).toBe(false);
  });

  it("resets a finished mission: Done back to No mission, with how they stand", () => {
    const next = applyPeopleMove(board(), { type: "reset", gameId: "g-done" });
    expect(next.done).toEqual([]);
    expect(next.noMission.find(({ key }) => key === "d1")).toMatchObject({
      name: "Dee",
      newHire: false,
      asWelcomer: can,
      welcomerLeft: false,
    });
    expect(next.noMission.find(({ key }) => key === "d1")).not.toHaveProperty("outcome");
  });

  it("resets nothing the board does not list as done", () => {
    expect(applyPeopleMove(board(), { type: "reset", gameId: "zed" })).toEqual(board());
  });

  it("turning on a flagged new hire keeps them a new hire in Playing", () => {
    const flagged = {
      ...board(),
      noMission: board().noMission.map((row) => ({ ...row, newHire: true })),
    };
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
      { type: "reset", gameId: "g-done" },
      { type: "end", gameId: "g-inv" },
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
