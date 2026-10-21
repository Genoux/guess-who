import { describe, expect, it } from "vitest";
import { NO_TEAM, toStickerPerson } from "./to-sticker-person";

const team = { name: "Creative", color: "#46BDF0", tint: "#B5E5F9" };
const publicFields = {
  id: "teammate",
  name: "Noor Haddad",
  teamId: "team_1",
  stickerNumber: 4,
  ask: "The best bakery in any city",
};

describe("toStickerPerson", () => {
  it("keeps a locked sticker to its public fields", () => {
    const person = toStickerPerson({ ...publicFields, locked: true }, team);
    expect(person).toEqual({
      name: "Noor Haddad",
      number: 4,
      team: "Creative",
      color: "#46BDF0",
      tint: "#B5E5F9",
      ask: "The best bakery in any city",
    });
    expect(person).not.toHaveProperty("fact");
    expect(person).not.toHaveProperty("city");
  });

  it("adds the fact and city once collected", () => {
    const person = toStickerPerson(
      {
        ...publicFields,
        locked: false,
        fact: "Ranks croissants",
        location: "Lisbon",
        imageUrl: "https://img.clerk.com/noor",
        photoKey: "people/noor.jpg",
      },
      team,
    );
    expect(person).toMatchObject({
      fact: "Ranks croissants",
      city: "Lisbon",
      photoUrl: "https://img.clerk.com/noor",
    });
  });

  it("never passes the storage key through", () => {
    const person = toStickerPerson(
      {
        ...publicFields,
        locked: false,
        fact: null,
        location: null,
        imageUrl: null,
        photoKey: "people/noor.jpg",
      },
      team,
    );
    expect(JSON.stringify(person)).not.toContain("people/noor.jpg");
  });

  it("falls back to the new hire look without a team", () => {
    expect(toStickerPerson({ ...publicFields, ask: null, locked: true }, undefined)).toMatchObject({
      team: NO_TEAM.name,
      color: NO_TEAM.color,
      ask: "",
    });
  });
});
