import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CluesFlow } from "@/features/games/components/clues-flow";
import type { DeskClue } from "@/features/games/lib/desk-clues";
import type { CluesDesk } from "@/features/games/queries/get-clues-desk";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "@/shared/lib/catalogue-access";

export const metadata: Metadata = {
  title: "Your secret clues (dev)",
  robots: { index: false, follow: false },
};

const SAVED = [
  "Has never owned a car.",
  "Learning an instrument most people quit.",
  "Plays it badly in every call.",
];

// The team clue, then how many of the three own clues are saved, and whether a game is playing.
function clues(saved: number, playing: boolean): DeskClue[] {
  return [
    { number: 1, text: "Works in Strategy.", editable: false, locked: false },
    ...([2, 3, 4] as const).map((number, index) => {
      const text = index < saved ? (SAVED[index] ?? null) : null;
      const locked = playing && text !== null;
      return { number, text, editable: !locked, locked };
    }),
  ];
}

const teammate = { welcoming: false, playerFirstName: "your new hire", playerNamed: false };
const welcomer = { welcoming: true, playerFirstName: "Léa", playerNamed: true };

const STATES: Record<string, CluesDesk> = {
  "teammate-empty": { ...teammate, clues: clues(0, false) },
  "teammate-set": { ...teammate, clues: clues(3, false) },
  "welcomer-upcoming": { ...welcomer, clues: clues(3, false) },
  "welcomer-playing": { ...welcomer, clues: clues(2, true) },
};

/**
 * My clues for local dev and previews only, one state per `?state=`: teammate-empty,
 * teammate-set, welcomer-upcoming (three saved, not locked yet) and welcomer-playing (two saved
 * and locked, one open). Nothing is saved.
 */
export default async function CluesPreviewPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }
  const { state } = await props.searchParams;
  const desk = (typeof state === "string" ? STATES[state] : undefined) ?? STATES["teammate-empty"];

  return desk ? <CluesFlow desk={desk} preview /> : null;
}
