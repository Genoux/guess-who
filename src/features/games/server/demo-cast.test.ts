import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TEAM_DEFINITIONS } from "@/entities/teams";
import {
  avatarUrlOf,
  DEMO_CAST,
  DEMO_PERSONAS,
  DEMO_PORTRAIT_SOURCES,
  demoCastEmail,
  portraitSlug,
} from "./demo-cast";

describe("DEMO_CAST", () => {
  it("is about twenty-five complete, distinct teammates", () => {
    expect(DEMO_CAST.length).toBeGreaterThanOrEqual(24);
    expect(new Set(DEMO_CAST.map(({ name }) => name)).size).toBe(DEMO_CAST.length);
    for (const member of DEMO_CAST) {
      expect(member.location && member.fact && member.ask).toBeTruthy();
      expect(member.clues).toHaveLength(3);
    }
  });

  it("covers every team, each with at least two people", () => {
    for (const { name } of TEAM_DEFINITIONS) {
      expect(DEMO_CAST.filter((member) => member.team === name).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gets every cast email from the name, on a reserved domain", () => {
    expect(demoCastEmail("Ana Souza")).toBe("ana.souza@example.com");
    expect(demoCastEmail("Inès Moreau")).toBe("ines.moreau@example.com");
  });
});

describe("DEMO_PERSONAS", () => {
  it("signs in with Clerk test emails on the allowed domain, one persona per state", () => {
    expect(DEMO_PERSONAS.map(({ key }) => key)).toEqual([
      "newhire",
      "lockedhire",
      "player",
      "welcomer",
      "teammate",
      "done",
      "admin",
    ]);
    for (const persona of DEMO_PERSONAS) {
      expect(persona.email).toBe(`${persona.key}+clerk_test@inbeat.agency`);
    }
  });
});

describe("the new hire flag", () => {
  it("is set on the three new hires and nobody else, and the done persona has cleared it", () => {
    const flagged = DEMO_PERSONAS.filter(({ newHire }) => newHire).map(({ key }) => key);
    expect(flagged).toEqual(["newhire", "lockedhire", "player"]);
  });
});

describe("portraits", () => {
  const names = [...DEMO_CAST.map(({ name }) => name), ...DEMO_PERSONAS.map(({ name }) => name)];

  it("has one local image per person and one distinct Unsplash source for each", () => {
    expect(Object.keys(DEMO_PORTRAIT_SOURCES).toSorted()).toEqual(names.toSorted());
    const sources = Object.values(DEMO_PORTRAIT_SOURCES);
    expect(new Set(sources).size).toBe(sources.length);
    for (const source of sources) {
      expect(source).toMatch(/^https:\/\/images\.unsplash\.com\/photo-[\w-]+$/);
    }
  });

  it("points at a same-origin webp, with no external host", () => {
    expect(avatarUrlOf("Inès Moreau")).toBe("/demo/avatars/ines-moreau.webp");
    expect(avatarUrlOf("Ana Souza").startsWith("/")).toBe(true);
    expect(portraitSlug("Léa  O'Neil")).toBe("lea-o-neil");
  });

  it("has a committed file for every person", () => {
    for (const name of names) {
      expect(existsSync(`public${avatarUrlOf(name)}`)).toBe(true);
    }
  });
});
