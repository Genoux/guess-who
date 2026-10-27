"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type MouseEvent, useEffect, useState } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameFilterMenu } from "@/shared/components/game/game-filter-menu";
import { stagger, TRANSITION } from "@/shared/components/game/game-motion";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { useCardParam } from "../hooks/use-card-param";
import { FLIGHT } from "../lib/album-motion";
import { matchesStickerFilter, STICKER_FILTERS, type StickerFilter } from "../lib/sticker-filter";
import { restingRotation } from "../lib/sticker-rotation";
import type { AlbumSticker } from "../queries/get-player-album";
import { AlbumCardOverlay } from "./album-card-overlay";

const EVERYONE = "all";
// A fixed locale: the server and the browser must sort alike.
const byName = new Intl.Collator("en", { sensitivity: "base" });

type AlbumBoardProps = {
  teams: { id: string; name: string; count: number }[];
  stickers: AlbumSticker[];
  /** Locked stickers open while the game is on. */
  active: boolean;
  collectedCount: number;
  /** The status filter a link opened the album with. */
  initialStatus?: StickerFilter;
};

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/**
 * The album page: team pills and a status menu over one grid of stickers, each opening in place.
 * Each control counts what it would show combined with the other one.
 */
export function AlbumBoard({
  teams,
  stickers,
  active,
  collectedCount,
  initialStatus = "all",
}: AlbumBoardProps) {
  const [team, setTeam] = useState(EVERYONE);
  const [status, setStatus] = useState<StickerFilter>(initialStatus);
  const [filtered, setFiltered] = useState(false);
  const { cardId, open, close } = useCardParam();
  const inTeam = (sticker: AlbumSticker, teamId: string) =>
    teamId === EVERYONE || sticker.teamId === teamId;
  const countWhere = (teamId: string, filter: StickerFilter) =>
    stickers.filter((s) => inTeam(s, teamId) && matchesStickerFilter(s, filter)).length;
  const teamFilters = [{ id: EVERYONE, name: "Everyone" }, ...teams].map((filter) => ({
    ...filter,
    count: countWhere(filter.id, status),
  }));
  const statusOptions = STICKER_FILTERS.map((filter) => ({
    ...filter,
    count: countWhere(team, filter.value),
  }));
  const album = stickers.toSorted((a, b) => byName.compare(a.person.name, b.person.name));
  const shown = album.filter((s) => inTeam(s, team) && matchesStickerFilter(s, status));
  // Scoped to the grid: the cards of the grid being cleared and the one being dealt share sticker
  // ids, and a shared layoutId would fly each one across from its old slot.
  const grid = `${team}/${status}`;
  const flightIdOf = (stickerId: string) => `${grid}/${stickerId}`;

  // Rotations belong to the sticker, not to its place in the filtered list.
  const albumIndexById = new Map(stickers.map((sticker, index) => [sticker.id, index]));
  const rotationOf = (sticker: AlbumSticker) =>
    sticker.mode === "locked" ? 0 : restingRotation(albumIndexById.get(sticker.id) ?? 0);
  const openSticker = stickers.find((sticker) => sticker.id === cardId);

  // A card a refresh dropped from the album closes itself, so the URL does not keep a card Back
  // would step through.
  const deadCard = cardId !== null && openSticker === undefined;
  useEffect(() => {
    if (deadCard) close();
  }, [deadCard, close]);

  // The card that just closed flies home above the backdrop, so its slot must paint on top.
  const [lastOpenId, setLastOpenId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const openId = openSticker?.id ?? null;
  if (openId !== lastOpenId) {
    setLastOpenId(openId);
    setReturningId(openId === null ? lastOpenId : null);
  }

  return (
    // Positioned so it slides over the AlbumCover above it.
    <GameBook className="relative px-2 pt-6 pb-10 sm:px-6 sm:pt-8">
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full items-center justify-between gap-3 md:flex-wrap">
          {/* A phone has no room for a row of team pills: the team is a menu like the status. */}
          <GameFilterMenu
            label="Team"
            value={team}
            options={teamFilters.map(({ id, name, count }) => ({ value: id, label: name, count }))}
            onValueChange={(next) => {
              setTeam(next);
              setFiltered(true);
            }}
            className="md:hidden"
          />
          <div role="toolbar" aria-label="Teams" className="hidden flex-wrap gap-1.5 md:flex">
            {teamFilters.map((filter) => {
              const on = filter.id === team;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setTeam(filter.id);
                    setFiltered(true);
                  }}
                  className={gameCn(
                    "inline-flex h-10 flex-none cursor-pointer items-center gap-2 rounded-full px-4 text-button-sm outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
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
          <GameFilterMenu
            label="Show"
            value={status}
            options={statusOptions}
            onValueChange={(next) => {
              setStatus(next);
              setFiltered(true);
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          {shown.length === 0 ? (
            <motion.p
              key={`${grid}/empty`}
              className="py-16 text-center text-game-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: TRANSITION.clear }}
            >
              No stickers here yet.
            </motion.p>
          ) : (
            <motion.ul
              key={grid}
              // The columns fill the page edge to edge, never fewer than two, and each card zooms
              // whole to its column (zoom-fit), so the toolbar's ends line up with the grid's.
              className="relative grid w-full grid-cols-[repeat(auto-fill,minmax(min(160px,calc(50%-6px)),1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(176px,1fr))] md:gap-8"
              // A click on a fading card would open it under the next grid's flight ids, with no flight.
              exit={{
                opacity: 0,
                pointerEvents: "none",
                transition: TRANSITION.clear,
              }}
            >
              {shown.map((sticker, index) => {
                const rotation = rotationOf(sticker);
                const returning = sticker.id === returningId;
                const card = (
                  <div className="zoom-fit">
                    <Sticker person={sticker.person} mode={sticker.mode} celebrateChanges={false} />
                  </div>
                );
                return (
                  <motion.li
                    key={sticker.id}
                    initial={filtered ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={{ ...TRANSITION.deal, delay: stagger(index, shown.length) }}
                    className="@container relative"
                    style={returning ? { zIndex: 60 } : undefined}
                  >
                    {sticker.id === openId ? (
                      // Holds the slot open while the card is out, so the grid does not reflow. Opacity, not
                      // visibility: the flip sets visibility on its faces, which overrides a hidden parent.
                      <div aria-hidden className="pointer-events-none opacity-0">
                        {card}
                      </div>
                    ) : (
                      <Link
                        href={`${ROUTES.play}?card=${sticker.id}`}
                        prefetch={false}
                        data-card-id={sticker.id}
                        aria-label={
                          sticker.mode === "locked"
                            ? `Collect ${sticker.person.name}`
                            : sticker.person.name
                        }
                        aria-haspopup="dialog"
                        onClick={(event) => {
                          if (!isPlainClick(event)) return;
                          event.preventDefault();
                          open(sticker.id);
                        }}
                        className="block rounded-card no-underline outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-6"
                      >
                        <motion.div
                          layoutId={flightIdOf(sticker.id)}
                          layoutCrossfade={false}
                          transition={{
                            layout: FLIGHT,
                          }}
                        >
                          <motion.div
                            initial={returning ? { rotate: 0 } : false}
                            animate={{ rotate: rotation }}
                            transition={FLIGHT}
                          >
                            {card}
                          </motion.div>
                        </motion.div>
                      </Link>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <AlbumCardOverlay
        target={
          openSticker
            ? {
                ...openSticker,
                active,
                collectedCount,
                total: stickers.length,
              }
            : null
        }
        flightId={openSticker ? flightIdOf(openSticker.id) : ""}
        rotation={openSticker ? rotationOf(openSticker) : 0}
        onClose={close}
        // The returning card stays above the overlay until the backdrop is gone: dropping it on
        // landing put it under a still-opaque backdrop for a moment, which read as a flicker.
        onExited={() => setReturningId(null)}
      />
    </GameBook>
  );
}
