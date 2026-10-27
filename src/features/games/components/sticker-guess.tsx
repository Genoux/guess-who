"use client";

import { useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { gameToast } from "@/shared/components/game/game-toaster";
import { wait } from "@/shared/lib/wait";
import { guessWelcomer } from "../actions/guess-welcomer";
import { SUSPENSE_S } from "../lib/album-motion";
import type { CollectTarget } from "../queries/get-collect-target";
import type { FoundStats } from "../server/to-game-outcome";

/** The guess under a collected card, and the "Is it X?" moment it opens. */
export function StickerGuess({
  target,
  onFound,
}: {
  target: CollectTarget;
  /** The guess was right: the numbers of the find. The refresh that follows ends the game. */
  onFound: (stats: FoundStats) => void;
}) {
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [pending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();
  const { firstName } = target;

  const guess = () => {
    startTransition(async () => {
      // The verdict waits for the suspense beat, so a quick server does not skip it.
      const [result] = await Promise.all([
        guessWelcomer({ personId: target.id }),
        wait(reduceMotion ? 0 : SUSPENSE_S),
      ]);
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      if (result.data.correct) {
        setOpen(false);
        onFound({ foundOnDay: result.data.foundOnDay, cluesUsed: result.data.cluesUsed });
        return;
      }
      setWrong(true);
    });
  };

  // A wrong guess rules the card out while its "Not X." moment is still on screen; the button goes
  // only once that closes.
  if (target.ruled && !open) return null;

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
