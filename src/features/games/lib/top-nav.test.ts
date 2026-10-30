import { describe, expect, it } from "vitest";
import { isAdminPath } from "@/shared/lib/route-access";
import { topNavTabs } from "./top-nav";

const state = {
  hasMission: false,
  hasNewClue: false,
  admin: false,
  welcomer: false,
  locked: false,
};

describe("topNavTabs", () => {
  it("gives everyone Album, My card and My clues", () => {
    expect(topNavTabs(state, "album").map(({ label }) => label)).toEqual([
      "Album",
      "My card",
      "My clues",
    ]);
  });

  it("adds Mission, after Album, when the viewer has a mission in any state", () => {
    expect(topNavTabs({ ...state, hasMission: true }, "album").map(({ label }) => label)).toEqual([
      "Album",
      "Mission",
      "My card",
      "My clues",
    ]);
  });

  it("adds Welcomer last, only while welcoming", () => {
    const labels = topNavTabs({ ...state, hasMission: true, welcomer: true }, "album").map(
      ({ label }) => label,
    );
    expect(labels).toEqual(["Album", "Mission", "My card", "My clues", "Welcomer"]);
  });

  it("never shows more than six tabs", () => {
    const all = { ...state, hasMission: true, hasNewClue: true, admin: true, welcomer: true };
    expect(topNavTabs(all, "album")).toHaveLength(6);
  });

  it("marks the open page", () => {
    const open = (current: Parameters<typeof topNavTabs>[1]) =>
      topNavTabs({ ...state, hasMission: true }, current).find((tab) => tab.current)?.label;
    expect(open("mission")).toBe("Mission");
    expect(open("clues")).toBe("My clues");
    expect(
      topNavTabs({ ...state, welcomer: true }, "welcomer").find((tab) => tab.current)?.label,
    ).toBe("Welcomer");
  });

  it("flags a new clue on the Mission tab only", () => {
    const tabs = topNavTabs({ ...state, hasMission: true, hasNewClue: true }, "album");
    expect(tabs.filter((tab) => tab.badge).map(({ label }) => label)).toEqual(["Mission"]);
  });

  it("points at routes everyone can open", () => {
    expect(topNavTabs({ ...state, hasMission: true }, "album").map(({ href }) => href)).toEqual([
      "/play",
      "/play/mission",
      "/card",
      "/clues",
    ]);
  });
});

describe("a new hire", () => {
  it("has no My card and no My clues while their mission is not done", () => {
    const labels = topNavTabs({ ...state, hasMission: true, locked: true }, "album").map(
      ({ label }) => label,
    );
    expect(labels).toEqual(["Album", "Mission"]);
  });

  it("has no tabs at all with no mission: there is nothing to open", () => {
    expect(topNavTabs({ ...state, locked: true }, "album")).toEqual([]);
  });

  it("keeps People for an admin who is also a new hire", () => {
    const labels = topNavTabs({ ...state, locked: true, admin: true }, "admin").map(
      ({ label }) => label,
    );
    expect(labels).toEqual(["People"]);
  });

  it("is not locked once the flag is off: everything is back", () => {
    const labels = topNavTabs({ ...state, hasMission: true }, "album").map(({ label }) => label);
    expect(labels).toEqual(["Album", "Mission", "My card", "My clues"]);
  });

  it("does not lock a teammate with no mission and no card: they get ready to welcome", () => {
    const labels = topNavTabs(state, "card").map(({ label }) => label);
    expect(labels).toEqual(["Album", "My card", "My clues"]);
  });
});

describe("People tab", () => {
  it("is the last tab, for admins only", () => {
    expect(topNavTabs(state, "album").map(({ label }) => label)).not.toContain("People");
    const labels = topNavTabs(
      { ...state, hasMission: true, welcomer: true, admin: true },
      "album",
    ).map(({ label }) => label);
    expect(labels).toEqual(["Album", "Mission", "My card", "My clues", "Welcomer", "People"]);
  });

  it("is marked when its page is open", () => {
    const open = topNavTabs({ ...state, admin: true }, "admin").find((tab) => tab.current);
    expect(open).toMatchObject({ label: "People", href: "/admin" });
  });
});

describe("route access", () => {
  it("keeps every tab but People out of the admin gate, so anyone shown them can open them", () => {
    const all = { ...state, hasMission: true, hasNewClue: false, admin: true, welcomer: true };
    const hrefs = topNavTabs(all, "album")
      .filter(({ label }) => label !== "People")
      .map(({ href }) => href);
    expect(hrefs.filter(isAdminPath)).toEqual([]);
  });

  it("gates the People tab, which only admins are shown", () => {
    const people = topNavTabs({ ...state, admin: true }, "album").find(
      ({ label }) => label === "People",
    );
    expect(people && isAdminPath(people.href)).toBe(true);
  });
});
