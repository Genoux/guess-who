import { TEAM_DEFINITIONS, type TeamName } from "@/entities/teams";
import type { StickerPerson } from "./sticker-view";

const colorsOf = (name: TeamName) => {
  const team = TEAM_DEFINITIONS.find((definition) => definition.name === name);
  if (!team) throw new Error(`Unknown team: ${name}`);
  return { color: team.color, tint: team.tint };
};

// The teams the sample people belong to; colors come from the one team definition.
export const TEAMS = {
  Creative: colorsOf("Creative"),
  Strategy: colorsOf("Strategy"),
  Talent: colorsOf("Talent"),
};

// A plain silhouette standing in for an uploaded photo, so the photo path can be seen.
const SAMPLE_PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#FFC592"/><circle cx="150" cy="120" r="56" fill="#191910"/><path d="M50 300c0-70 45-110 100-110s100 40 100 110z" fill="#191910"/></svg>',
)}`;

export const noor: StickerPerson = {
  name: "Noor Haddad",
  number: 4,
  team: "Creative",
  ...TEAMS.Creative,
  city: "Toronto",
  fact: "Once won a pie-eating contest by accident.",
  ask: "The best bakery in any city",
};

export const jonah: StickerPerson = {
  name: "Jonah Park",
  number: 7,
  team: "Strategy",
  ...TEAMS.Strategy,
  city: "Montréal",
  fact: "Keeps a spreadsheet for his fantasy football league.",
  ask: "Fantasy football spreadsheets",
};

export const ana: StickerPerson = {
  name: "Ana Ferreira",
  number: 3,
  team: "Talent",
  ...TEAMS.Talent,
  city: "Lisbon",
  fact: "Bikes to every meeting, rain or not.",
  ask: "Learning the cello at 30",
  photoUrl: SAMPLE_PHOTO,
};

/** A welcomer-written clue, as it reads on a face-up card. */
export const welcomerClue = "Has never owned a car, and never plans to.";
