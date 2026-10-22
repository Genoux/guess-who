"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { useCardParam } from "../hooks/use-card-param";
import { DROP, DROP_FROM, DROP_STAGGER_S, FLIGHT, LEAVE_S, SLIDE } from "../lib/album-motion";
import { dropRotation, restingRotation } from "../lib/sticker-rotation";
import type { AlbumSticker } from "../queries/get-player-album";
import { AlbumCardOverlay } from "./album-card-overlay";

const EVERYONE = "all";

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
  const { cardId, open, close } = useCardParam();
  const filters = [{ id: EVERYONE, name: "Everyone", count: stickers.length }, ...teams];
  const shown = team === EVERYONE ? stickers : stickers.filter((s) => s.teamId === team);

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

  // Only cards that were not on the table before the filter changed get dropped in.
  const previousIds = useRef<ReadonlySet<string> | null>(null);
  const entering = previousIds.current
    ? shown.filter((sticker) => !previousIds.current?.has(sticker.id))
    : [];
  useEffect(() => {
    previousIds.current = new Set(shown.map((sticker) => sticker.id));
  });

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

      <ul className="relative grid w-full grid-cols-[repeat(auto-fill,176px)] justify-center gap-8">
        <AnimatePresence mode="popLayout">
          {shown.map((sticker) => {
            const enterIndex = entering.indexOf(sticker);
            const rotation = rotationOf(sticker);
            const returning = sticker.id === returningId;
            const card = (
              <Sticker person={sticker.person} mode={sticker.mode} celebrateChanges={false} />
            );
            return (
              <motion.li
                key={sticker.id}
                layout
                className="relative"
                style={returning ? { zIndex: 60 } : undefined}
                initial={
                  enterIndex < 0
                    ? false
                    : {
                        opacity: 0,
                        ...DROP_FROM,
                        rotate: dropRotation(albumIndexById.get(sticker.id) ?? 0),
                      }
                }
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: LEAVE_S } }}
                transition={{
                  layout: SLIDE,
                  default: { ...DROP, delay: Math.max(enterIndex, 0) * DROP_STAGGER_S },
                }}
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
                      layoutId={sticker.id}
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
        </AnimatePresence>
      </ul>

      <AlbumCardOverlay
        target={
          openSticker ? { ...openSticker, active, collectedCount, total: stickers.length } : null
        }
        rotation={openSticker ? rotationOf(openSticker) : 0}
        onClose={close}
        // The returning card stays above the overlay until the backdrop is gone: dropping it on
        // landing put it under a still-opaque backdrop for a moment, which read as a flicker.
        onExited={() => setReturningId(null)}
      />
    </GameBook>
  );
}
