"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Sticker } from "@/shared/components/game/sticker";
import { ROUTES } from "@/shared/config/routes";
import { guessWelcomer } from "../actions/guess-welcomer";
import type { MissionSuspect } from "../queries/get-player-mission";

type MissionSuspectsProps = {
  maybes: MissionSuspect[];
  nextClue: { number: number; inDays: number } | null;
};

const ROTATIONS = [-2, 2, -1.5, 1.5];

function nextClueCopy(nextClue: MissionSuspectsProps["nextClue"]) {
  if (!nextClue) return "One less suspect. All the clues are out.";
  if (nextClue.inDays === 0) return `One less suspect. Clue ${nextClue.number} lands today.`;
  const days = nextClue.inDays === 1 ? "1 day" : `${nextClue.inDays} days`;
  return `One less suspect. Clue ${nextClue.number} lands in ${days}.`;
}

/** The maybe list with a guess button each, and the "Is it X?" moment. */
export function MissionSuspects({ maybes, nextClue }: MissionSuspectsProps) {
  const [suspect, setSuspect] = useState<MissionSuspect | null>(null);
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const nextSuspect = maybes.find((maybe) => maybe.id !== suspect?.id);

  const ask = (maybe: MissionSuspect) => {
    setWrong(false);
    setSuspect(maybe);
    setOpen(true);
  };

  const guess = (maybe: MissionSuspect) => {
    startTransition(async () => {
      const result = await guessWelcomer({ personId: maybe.id });
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

  if (maybes.length === 0 && !open) {
    return (
      <p className="max-w-105 text-game-muted">
        No maybes yet. Open a sticker you collected and tap “Could be my welcomer”.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-wrap items-start justify-center gap-10">
        {maybes.map((maybe, index) => (
          <li key={maybe.id} className="flex flex-col items-center gap-5">
            <Sticker
              person={maybe.person}
              mode="maybe"
              rot={ROTATIONS[index % ROTATIONS.length]}
              celebrateChanges={false}
            />
            <GameButton size="sm" onClick={() => ask(maybe)}>
              Guess {maybe.firstName}
            </GameButton>
          </li>
        ))}
      </ul>

      <GameModal
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        stage={
          suspect ? (
            <motion.div
              animate={wrong ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.38, delay: 0.08 }}
            >
              <Sticker
                person={suspect.person}
                mode={wrong ? "ruled" : "maybe"}
                size="lg"
                celebrateChanges={false}
              />
            </motion.div>
          ) : null
        }
        title={suspect ? (wrong ? `Not ${suspect.firstName}.` : `Is it ${suspect.firstName}?`) : ""}
        description={
          suspect
            ? wrong
              ? nextClueCopy(nextClue)
              : `If not, ${suspect.firstName} is out. You can keep guessing.`
            : undefined
        }
      >
        {suspect && !wrong ? (
          <>
            <GameButton disabled={pending} onClick={() => guess(suspect)}>
              Yes, it’s {suspect.firstName}
            </GameButton>
            <GameButton variant="link" disabled={pending} onClick={() => setOpen(false)}>
              Not sure yet
            </GameButton>
          </>
        ) : null}
        {suspect && wrong ? (
          <>
            {nextSuspect ? (
              <GameButton variant="yellow" onClick={() => ask(nextSuspect)}>
                Try {nextSuspect.firstName}
              </GameButton>
            ) : null}
            <GameButton variant="link" onClick={() => setOpen(false)}>
              Back to mission
            </GameButton>
          </>
        ) : null}
      </GameModal>
    </>
  );
}
