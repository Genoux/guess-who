"use client";

import Link from "next/link";
import { useState } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import type { AlbumSticker } from "../queries/get-player-album";

/** Hand-stuck angles, repeated across the grid. */
const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1];
const EVERYONE = "all";

type AlbumBoardProps = {
  teams: { id: string; name: string; count: number }[];
  stickers: AlbumSticker[];
  /** Locked stickers link to collect while the game is on. */
  active: boolean;
};

/** The album page: team filter pills over one grid of stickers. */
export function AlbumBoard({ teams, stickers, active }: AlbumBoardProps) {
  const [team, setTeam] = useState(EVERYONE);
  const filters = [{ id: EVERYONE, name: "Everyone", count: stickers.length }, ...teams];
  const shown = team === EVERYONE ? stickers : stickers.filter((s) => s.teamId === team);

  return (
    <GameBook className="gap-8 px-6 pt-8 pb-10">
      <div role="toolbar" aria-label="Teams" className="flex flex-wrap justify-center gap-1.5">
        {filters.map((filter) => {
          const on = filter.id === team;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={on}
              onClick={() => setTeam(filter.id)}
              className={gameCn(
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-button-sm outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
                on
                  ? "bg-game-ink text-white"
                  : "bg-game-surface text-game-ink shadow-edge hover:bg-game-sidebar",
              )}
            >
              {filter.name}
              <span className="text-small opacity-60">{filter.count}</span>
            </button>
          );
        })}
      </div>

      <ul className="grid w-full grid-cols-[repeat(auto-fill,176px)] justify-center gap-x-6 gap-y-8">
        {shown.map((sticker, index) => {
          const label =
            sticker.mode === "locked" ? `Collect ${sticker.person.name}` : sticker.person.name;
          const card = (
            <Sticker
              person={sticker.person}
              mode={sticker.mode}
              rot={sticker.mode === "locked" ? 0 : ROTATIONS[index % ROTATIONS.length]}
              celebrateChanges={false}
            />
          );
          return (
            <li key={sticker.id}>
              {active || sticker.mode !== "locked" ? (
                <Link
                  href={`${ROUTES.playCollect}/${sticker.id}`}
                  aria-label={label}
                  className="block rounded-sticker no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-6"
                >
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </GameBook>
  );
}
