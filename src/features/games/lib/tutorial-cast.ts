import type { StickerPerson } from "@/shared/components/game/sticker-view";

// Fictional people for the welcome intro, so the tour never shows a real teammate's card before
// the player collects it. shortcut: stand-in portraits from pravatar.cc; host final art before launch.
const portrait = (id: number) => `https://i.pravatar.cc/600?img=${id}`;

export const TUTORIAL_ALBUM: StickerPerson[] = [
  {
    name: "Rosa Lind",
    number: 12,
    team: "Creative",
    color: "#46BDF0",
    tint: "#B5E5F9",
    ask: "Film cameras",
    photoUrl: portrait(29),
  },
  {
    name: "Malik Osei",
    number: 4,
    team: "Strategy",
    color: "#157428",
    tint: "#A1C8A9",
    ask: "Sourdough",
    photoUrl: portrait(51),
  },
  {
    name: "Iris Moreau",
    number: 27,
    team: "Talent",
    color: "#FF97AB",
    tint: "#FFD5DD",
    ask: "Cold-water swimming",
    photoUrl: portrait(35),
  },
];

export const TUTORIAL_WELCOMER: StickerPerson = {
  name: "Your welcomer",
  number: "?",
  team: "Somewhere close",
  color: "#FFC592",
  tint: "#FFE8D3",
  ask: "Coffee is on me.",
  photoUrl: portrait(58),
};
