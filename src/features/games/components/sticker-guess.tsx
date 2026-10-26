"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { SHAKE_X, TRANSITION } from "@/shared/components/game/game-motion";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { guessWelcomer } from "../actions/guess-welcomer";
import type { CollectTarget } from "../queries/get-collect-target";

/** The guess under a collected card, and the "Is it X?" moment it opens. */
export function StickerGuess({ target }: { target: CollectTarget }) {
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { firstName } = target;

  // A wrong guess rules the card out while its "Not X." moment is still on screen; the button goes
  // only once that closes.
  if (target.ruled && !open) return null;

  const guess = () => {
    startTransition(async () => {
      const result = await guessWelcomer({ personId: target.id });
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      if (result.data.correct) {
        router.push(ROUTES.playFound);
        return;
      }
      setWrong(true);
    });
  };

  return (
    <>
      <GameButton
        size="sm"
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
          <motion.div animate={wrong ? { x: SHAKE_X } : { x: 0 }} transition={TRANSITION.shake}>
            <Sticker
              person={target.person}
              mode={wrong ? "ruled" : "collected"}
              size="lg"
              celebrateChanges={false}
            />
          </motion.div>
        }
        title={wrong ? `Not ${firstName}.` : `Is it ${firstName}?`}
        description={
          wrong
            ? "One less suspect. The next clue will narrow it down."
            : `If not, ${firstName} is out. You can keep guessing.`
        }
      >
        {wrong ? (
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
