"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { SHAKE_X, TRANSITION } from "@/shared/components/game/game-motion";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { guessWelcomer } from "../actions/guess-welcomer";
import { FOUND_POP, FOUND_POP_TRANSITION, FOUND_STAMP_AT_MS } from "../lib/album-motion";
import type { CollectTarget } from "../queries/get-collect-target";
import { foundStats } from "./found-lead";

/** The guess under a collected card, and the "Is it X?" moment it opens. */
export function StickerGuess({
  target,
  onFound,
}: {
  target: CollectTarget;
  /** The guess was right: keep this mounted, the refresh that follows ends the game. */
  onFound: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [found, setFound] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [pending, startTransition] = useTransition();
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { firstName } = target;

  useEffect(() => {
    if (!found) return;
    const timer = setTimeout(
      () => {
        setStamped(true);
        if (stageRef.current) {
          void celebrate(originFromElement(stageRef.current), { kind: "found" });
        }
      },
      reduceMotion ? 0 : FOUND_STAMP_AT_MS,
    );
    return () => clearTimeout(timer);
  }, [found, reduceMotion]);

  // A wrong guess rules the card out while its "Not X." moment is still on screen; the button goes
  // only once that closes.
  if ((target.ruled || found) && !open) return null;

  const guess = () => {
    startTransition(async () => {
      const result = await guessWelcomer({ personId: target.id });
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      if (result.data.correct) {
        setFound(true);
        onFound();
        return;
      }
      setWrong(true);
    });
  };

  const stats = foundStats(target.foundOnDay, target.cluesUsed);

  return (
    <>
      <GameButton
        size="lg"
        onClick={() => {
          setWrong(false);
          setOpen(true);
        }}
      >
        Guess {firstName}
      </GameButton>

      <GameModal
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        stage={
          <motion.div
            ref={stageRef}
            animate={
              wrong ? { x: SHAKE_X } : found && !reduceMotion ? FOUND_POP : { x: 0, scale: 1 }
            }
            transition={found ? FOUND_POP_TRANSITION : TRANSITION.shake}
          >
            <Sticker
              person={target.person}
              mode={stamped ? "found" : wrong ? "ruled" : "collected"}
              size="lg"
              celebrateChanges={false}
            />
          </motion.div>
        }
        title={
          stamped ? `You found ${firstName}.` : wrong ? `Not ${firstName}.` : `Is it ${firstName}?`
        }
        description={
          stamped ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={stats ? "stats" : "pending"}
                className="inline-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={TRANSITION.fade}
              >
                {stats ? <>In {stats}.</> : "Mission complete."}
              </motion.span>
            </AnimatePresence>
          ) : wrong ? (
            "One less suspect. The next clue will narrow it down."
          ) : (
            `If not, ${firstName} is out. You can keep guessing.`
          )
        }
      >
        {stamped ? (
          <>
            <GameButton asChild>
              <Link href={ROUTES.playMission}>See your mission</Link>
            </GameButton>
            <GameButton variant="link" onClick={() => setOpen(false)}>
              Back to album
            </GameButton>
          </>
        ) : found ? null : wrong ? (
          <GameButton variant="link" onClick={() => setOpen(false)}>
            Back to album
          </GameButton>
        ) : (
          <>
            <GameButton disabled={pending} onClick={guess}>
              Yes, it’s {firstName}
            </GameButton>
            <GameButton variant="link" disabled={pending} onClick={() => setOpen(false)}>
              Not sure yet
            </GameButton>
          </>
        )}
      </GameModal>
    </>
  );
}
