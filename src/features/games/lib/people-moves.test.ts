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
  welcoming: false,
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

  it.each(["p1", "n1"])("removes %s from the board entirely", (key) => {
    const next = applyPeopleMove(board(), { type: "remove", key });
    expect(everyone(next)).toEqual(everyone(board()).filter((other) => other !== key));
  });

  it("adds a new hire to No mission as an invite, not started", () => {
    const next = applyPeopleMove(board(), { type: "add", email: "new@x.com" });
    expect(next.playing).toEqual(board().playing);
    expect(next.noMission[0]).toMatchObject({
      email: "new@x.com",
      name: null,
      signedIn: false,
      newHire: true,
    });
  });

  it("adds someone who already signed in by flagging their No mission row", () => {
    const next = applyPeopleMove(board(), { type: "add", email: "nia@x.com" });
    expect(keys(next.noMission)).toEqual(["n1", "n2"]);
    expect(next.noMission[0]).toMatchObject({ signedIn: true, newHire: true });
    expect(next.playing).toEqual(board().playing);
  });

  it("changes an invite's email in place", () => {
    const next = applyPeopleMove(board(), {
      type: "changeEmail",
      gameId: "g-inv",
      email: "kim@new.com",
    });
    expect(next.playing.find(({ gameId }) => gameId === "g-inv")?.email).toBe("kim@new.com");
  });

  it("sets someone as a new hire without a mission: they stay in No mission with the tag", () => {
    const next = applyPeopleMove(board(), { type: "setNewHire", key: "n1" });
    expect(keys(next.noMission)).toEqual(["n1", "n2"]);
    expect(next.noMission[0]?.newHire).toBe(true);
    expect(next.noMission[1]?.newHire).toBe(false);
    expect(next.playing).toEqual(board().playing);
  });

  it("turning on a flagged new hire keeps them a new hire in Playing", () => {
    const flagged = applyPeopleMove(board(), { type: "setNewHire", key: "n1" });
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
