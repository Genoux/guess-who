"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type MouseEvent, useEffect, useState } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { useCardParam } from "../hooks/use-card-param";
import { CLEAR_S, DEAL, DEAL_BUDGET_S, DEAL_STAGGER_S, FLIGHT } from "../lib/album-motion";
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
};

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/** The album page: team filter pills over one grid of stickers, each opening in place. */
export function AlbumBoard({ teams, stickers, active, collectedCount }: AlbumBoardProps) {
  const [team, setTeam] = useState(EVERYONE);
  const [filtered, setFiltered] = useState(false);
  const { cardId, open, close } = useCardParam();
  const filters = [{ id: EVERYONE, name: "Everyone", count: stickers.length }, ...teams];
  const album = stickers.toSorted((a, b) => byName.compare(a.person.name, b.person.name));
  const shown = team === EVERYONE ? album : album.filter((s) => s.teamId === team);
  const dealStepS = Math.min(DEAL_STAGGER_S, DEAL_BUDGET_S / shown.length);
  // Scoped to the grid: the cards of the grid being cleared and the one being dealt share sticker
  // ids, and a shared layoutId would fly each one across from its old slot.
  const flightIdOf = (stickerId: string) => `${team}/${stickerId}`;

  // Rotations belong to the sticker, not to its place in the filtered list.
  const albumIndexById = new Map(stickers.map((sticker, index) => [sticker.id, index]));
  const rotationOf = (sticker: AlbumSticker) =>
    sticker.mode === "locked" ? 0 : restingRotation(albumIndexById.get(sticker.id) ?? 0);
  const canOpen = (sticker: AlbumSticker) => active || sticker.mode !== "locked";

  const openSticker = stickers.find((sticker) => sticker.id === cardId && canOpen(sticker));

  // A link to a card that cannot open (unknown, or locked after the game) clears itself, so the
  // URL does not keep a card Back would step through.
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
    <GameBook className="gap-8 px-6 pt-8 pb-10">
      <div role="toolbar" aria-label="Teams" className="flex flex-wrap justify-center gap-1.5">
        {filters.map((filter) => {
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

      <AnimatePresence mode="wait">
        <motion.ul
          key={team}
          className="relative grid w-full grid-cols-[repeat(auto-fill,176px)] justify-center gap-8"
          // A click on a fading card would open it under the next grid's flight ids, with no flight.
          exit={{ opacity: 0, pointerEvents: "none", transition: { duration: CLEAR_S } }}
        >
          {shown.map((sticker, index) => {
            const rotation = rotationOf(sticker);
            const returning = sticker.id === returningId;
            const card = (
              <Sticker person={sticker.person} mode={sticker.mode} celebrateChanges={false} />
            );
            return (
              <motion.li
                key={sticker.id}
                initial={filtered ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ ...DEAL, delay: index * dealStepS }}
                className="relative"
                style={returning ? { zIndex: 60 } : undefined}
              >
                {sticker.id === openId ? (
                  // Holds the slot open while the card is out, so the grid does not reflow. Opacity, not
                  // visibility: the flip sets visibility on its faces, which overrides a hidden parent.
                  <div aria-hidden className="pointer-events-none opacity-0">
                    {card}
                  </div>
                ) : canOpen(sticker) ? (
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
                ) : (
                  card
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      </AnimatePresence>

      <AlbumCardOverlay
        target={
          openSticker ? { ...openSticker, active, collectedCount, total: stickers.length } : null
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
