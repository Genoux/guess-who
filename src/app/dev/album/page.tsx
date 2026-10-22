import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumBoard } from "@/features/games/components/album-board";
import type { AlbumSticker } from "@/features/games/queries/get-player-album";
import { ana, jonah, noor } from "@/shared/components/game/fixtures";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import type { StickerPerson } from "@/shared/components/game/sticker-view";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "../_lib/catalogue-access";

export const metadata: Metadata = {
  title: "Album (dev)",
  robots: { index: false, follow: false },
};

const TEAM_IDS = { Creative: "creative", Strategy: "strategy", Talent: "talent" } as const;

const NAMES = [
  "Mira Okafor",
  "Theo Lindqvist",
  "Yuki Tanaka",
  "Sam Rivera",
  "Lou Martin",
  "Ines Costa",
];

// Locked stickers carry only public fields, as the server sends them.
const lockedPerson = ({ city: _city, fact: _fact, photoUrl: _photoUrl, ...rest }: StickerPerson) =>
  rest;

const people: StickerPerson[] = [
  noor,
  jonah,
  ana,
  ...NAMES.map((name, index) => {
    const base = [noor, jonah, ana][index % 3] as StickerPerson;
    return { ...base, name, number: 10 + index, photoUrl: null };
  }),
];

// One collected card of each state, so every badge and the photo can be checked in motion.
const SHORTLISTED_INDEX = 4;
const RULED_INDEX = 6;

const stickers: AlbumSticker[] = people.map((person, index) => {
  const collected = index % 2 === 0;
  const shortlisted = index === SHORTLISTED_INDEX;
  const ruled = index === RULED_INDEX;
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    teamId: TEAM_IDS[person.team as keyof typeof TEAM_IDS],
    firstName: person.name.split(" ")[0] ?? person.name,
    person: collected ? person : lockedPerson(person),
    mode: !collected ? "locked" : shortlisted ? "maybe" : ruled ? "ruled" : "collected",
    collected,
    shortlisted,
    ruled,
    note: collected ? "Knows every bakery in town." : null,
  };
});

const teams = Object.entries(TEAM_IDS).map(([name, id]) => ({
  id,
  name,
  count: stickers.filter((sticker) => sticker.teamId === id).length,
}));

/** The player's album with sample stickers, for local dev and previews only. */
export default function AlbumPreviewPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return (
    <GameShell>
      <GameStage className="max-w-280">
        <AlbumBoard
          teams={teams}
          stickers={stickers}
          active
          collectedCount={stickers.filter((sticker) => sticker.collected).length}
        />
      </GameStage>
    </GameShell>
  );
}
