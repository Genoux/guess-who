import { describe, expect, it } from "vitest";
import type { GameActivity, PersonRecord } from "./to-people-board";
import { toPeopleBoard } from "./to-people-board";

const now = new Date("2026-10-28T15:00:00Z");

const person = (overrides: Partial<PersonRecord> = {}): PersonRecord => ({
  personId: "sam",
  signedIn: true,
  name: "Sam Taylor",
  email: "sam@inbeat.agency",
  team: { name: "Creative", color: "#46BDF0" },
  ask: "Night trains",
  imageUrl: "/demo/avatars/sam-taylor.webp",
  newHire: false,
  cluesWritten: 3,
  game: null,
  ...overrides,
});

const base = {
  id: "game",
  status: "active" as const,
  welcomerPersonId: "ana",
  welcomerName: "Ana Ferreira",
  startDate: "2026-10-26",
  foundAt: null,
  revealSeenAt: null,
};

const invite = (id: string, email: string): PersonRecord =>
  person({
    personId: null,
    signedIn: false,
    name: null,
    email,
    team: null,
    ask: null,
    imageUrl: null,
    newHire: true,
    cluesWritten: null,
    game: { ...base, id },
  });

const board = (
  people: PersonRecord[],
  activity: GameActivity[] = [],
  viewerPersonId: string | null = null,
) => toPeopleBoard({ people, activity, now, viewerPersonId });

describe("toPeopleBoard playing", () => {
  it("has one row per started mission, furthest day first", () => {
    const { playing } = board([
      person({ personId: "a", game: { ...base, id: "a", startDate: "2026-10-26" } }),
      person({ personId: "b", game: { ...base, id: "b", startDate: "2026-10-20" } }),
      person({ personId: "d" }),
    ]);
    expect(playing.map(({ gameId, day }) => [gameId, day])).toEqual([
      ["b", 9],
      ["a", 3],
    ]);
  });

  it("names the welcomer and the team, and shows stickers and activity", () => {
    const activity = [
      { gameId: "game", collected: 4, lastActiveAt: new Date("2026-10-28T14:00:00Z") },
    ];
    const [row] = board([person({ game: base })], activity).playing;
    expect(row).toMatchObject({
      key: "sam",
      name: "Sam Taylor",
      team: { name: "Creative" },
      welcomer: "Ana Ferreira",
      progress: { label: "4", activity: "1h ago" },
    });
  });

  it("hides the welcomer from the admin who is the player, like canSeeGameSecrets", () => {
    const people = [
      person({ personId: "me", name: "Me Admin", game: { ...base, id: "mine" } }),
      person({ personId: "other", game: { ...base, id: "theirs" } }),
    ];
    const { playing } = board(people, [], "me");
    expect(playing.map(({ gameId, welcomer }) => [gameId, welcomer])).toEqual([
      ["mine", null],
      ["theirs", "Ana Ferreira"],
    ]);
    expect(JSON.stringify(playing.find(({ gameId }) => gameId === "mine"))).not.toContain("Ana");
  });

  it("keeps a mission that ran past day 14 out of Playing", () => {
    expect(board([person({ game: { ...base, startDate: "2026-10-01" } })]).playing).toEqual([]);
  });
});

describe("toPeopleBoard invites", () => {
  it("lists an email nobody signed in with in Playing, by its email, keyed by its game", () => {
    const { playing } = board([invite("i", "kim@gmail.com")]);
    expect(playing[0]).toMatchObject({
      key: "i",
      name: null,
      email: "kim@gmail.com",
      team: null,
      signedIn: false,
      asWelcomer: null,
    });
  });

  it("marks a signed-in player as signed in", () => {
    expect(board([person({ game: base })]).playing[0]?.signedIn).toBe(true);
  });
});

describe("toPeopleBoard photos", () => {
  it("carries each person's picture into every view, and none for an invite", () => {
    const { playing, noMission, done } = board([
      person({ personId: "a", game: base }),
      person({ personId: "c" }),
      person({ personId: "d", game: { ...base, status: "revealed" } }),
      invite("i", "kim@gmail.com"),
    ]);
    const photos = [...playing, ...noMission, ...done].map(
      ({ key, imageUrl }) => [key, imageUrl] as const,
    );
    expect(photos.toSorted()).toEqual([
      ["a", "/demo/avatars/sam-taylor.webp"],
      ["c", "/demo/avatars/sam-taylor.webp"],
      ["d", "/demo/avatars/sam-taylor.webp"],
      ["i", null],
    ]);
  });
});

describe("toPeopleBoard new hires", () => {
  it("carries the new hire flag into every view, so the rows can say so", () => {
    const { playing, noMission } = board([
      person({ personId: "a", newHire: true, game: base }),
      person({ personId: "c", newHire: false }),
      invite("i", "kim@gmail.com"),
    ]);
    expect(playing.map(({ key, newHire }) => [key, newHire]).toSorted()).toEqual([
      ["a", true],
      ["i", true],
    ]);
    expect(noMission[0]?.newHire).toBe(false);
  });
});

describe("toPeopleBoard no mission", () => {
  it("lists the signed-in people with no game, by name, and no invites", () => {
    const { noMission } = board([
      person({ personId: "z", name: "Zed Park" }),
      invite("i", "kim@gmail.com"),
      person({ personId: "a", name: "Ana Lopez" }),
      person({ personId: "p", game: base }),
    ]);
    expect(noMission.map(({ name }) => name)).toEqual(["Ana Lopez", "Zed Park"]);
  });

  it("says how each stands as a welcomer", () => {
    const standing = (overrides: Partial<PersonRecord>) =>
      board([person(overrides)]).noMission[0]?.asWelcomer;
    expect(standing({})).toEqual({ kind: "canWelcome" });
    expect(standing({ cluesWritten: 1 })).toEqual({ kind: "cluesMissing", missing: 2 });
    expect(standing({ team: null })).toEqual({ kind: "cardNotDone" });
    expect(standing({ ask: " " })).toEqual({ kind: "cardNotDone" });
  });
});

describe("toPeopleBoard views", () => {
  it("puts every person in exactly one view", () => {
    const people = [
      person({ personId: "a" }),
      person({ personId: "c", game: base }),
      person({ personId: "d", game: { ...base, status: "revealed" } }),
      person({ personId: "e", game: { ...base, startDate: "2026-10-01" } }),
      invite("i", "kim@gmail.com"),
    ];
    const { playing, noMission, done } = board(people);
    const keys = [...playing, ...noMission, ...done].map(({ key }) => key);
    expect(keys.toSorted()).toEqual(["a", "c", "d", "e", "i"]);
    expect([playing, noMission, done].map((view) => view.length)).toEqual([2, 1, 2]);
  });
});

describe("toPeopleBoard done", () => {
  const found = {
    ...base,
    status: "found" as const,
    startDate: "2026-09-28",
    foundAt: new Date("2026-10-05T16:00:00Z"),
  };

  it("lists finished missions, most recently ended first, with the result and end date", () => {
    const { done } = board([
      person({ personId: "old", game: { ...found, id: "old" } }),
      person({
        personId: "new",
        game: { ...base, id: "new", status: "revealed", startDate: "2026-10-05" },
      }),
    ]);
    expect(done.map(({ gameId, outcome, endedOn }) => [gameId, outcome.label, endedOn])).toEqual([
      ["new", "Revealed on day 14", "Oct 18"],
      ["old", "Found on day 8", "Oct 5"],
    ]);
    expect(done[1]?.outcome.found).toBe(true);
  });

  it("hides the welcomer from the admin whose own mission is over until they have seen the reveal", () => {
    const mine = { ...found, id: "mine" };
    const people = [
      person({ personId: "me", game: mine }),
      person({ personId: "other", game: { ...found, id: "theirs" } }),
    ];
    const welcomers = (viewer: string | null, records = people) =>
      board(records, [], viewer).done.map(({ gameId, welcomer }) => [gameId, welcomer]);
    expect(welcomers("me")).toEqual([
      ["mine", null],
      ["theirs", "Ana Ferreira"],
    ]);
    const seen = [person({ personId: "me", game: { ...mine, revealSeenAt: now } })];
    expect(welcomers("me", seen)).toEqual([["mine", "Ana Ferreira"]]);
  });

  it("counts a mission that ran past day 14 as done", () => {
    const { done } = board([person({ game: { ...base, startDate: "2026-10-01" } })]);
    expect(done[0]?.outcome.label).toBe("Revealed on day 14");
  });
});
