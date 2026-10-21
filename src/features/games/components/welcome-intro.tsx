"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameButton } from "@/shared/components/game/game-button";
import { GAME_EASE } from "@/shared/components/game/game-motion";
import { GameStage } from "@/shared/components/game/game-stage";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Stepper } from "@/shared/components/game/stepper";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { ROUTES } from "@/shared/config/routes";
import { markIntroSeen } from "../actions/mark-intro-seen";

type WelcomeIntroProps = {
  firstName: string;
  /** Up to three album stickers for the opening deal, public fields only. */
  fan: StickerPerson[];
  /** Two team colors for the demo stickers. */
  colors: [string | undefined, string | undefined];
};

const FALLBACK_COLOR = "#FF97AB";

/** A card dealt into place: rises, fades in and settles at its angle, after `delay` seconds. */
function Dealt({
  children,
  delay,
  rot = 0,
  x = 0,
}: {
  children: ReactNode;
  delay: number;
  rot?: number;
  x?: number;
}) {
  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, y: 40, x, rotate: rot - 6 }}
      animate={{ opacity: 1, y: 0, x, rotate: rot }}
      transition={{ duration: 0.5, delay, ease: GAME_EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Switches a demo sticker from one mode to another once, so the step shows the real mechanic. */
function useDemoMode(from: StickerMode, to: StickerMode, afterMs: number) {
  const [mode, setMode] = useState<StickerMode>(from);
  useEffect(() => {
    const timer = setTimeout(() => setMode(to), afterMs);
    return () => clearTimeout(timer);
  }, [to, afterMs]);
  return mode;
}

function DealArt({ fan }: { fan: StickerPerson[] }) {
  const placements = [
    { x: -150, rot: -8 },
    { x: 150, rot: 7 },
    { x: 0, rot: -1 },
  ];
  return (
    <>
      {fan.slice(0, 3).map((person, index) => (
        <Dealt
          key={`${person.name}-${person.number}`}
          delay={0.1 + index * 0.14}
          {...placements[index]}
        >
          <Sticker person={person} mode="collected" tilt={false} celebrateChanges={false} />
        </Dealt>
      ))}
    </>
  );
}

function CollectArt({ person }: { person: StickerPerson }) {
  const mode = useDemoMode("locked", "collected", 1100);
  return (
    <Dealt delay={0.1}>
      <div className="flex flex-col items-center gap-4">
        <Sticker person={person} mode={mode} tilt={false} />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={mode === "collected" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.5, ease: GAME_EASE }}
        >
          <CountChip variant="yellow" size="sm">
            +1 sticker
          </CountChip>
        </motion.div>
      </div>
    </Dealt>
  );
}

function CluesArt() {
  return (
    <>
      <Dealt delay={0.1} x={-120} rot={-8}>
        <ClueCard state="open" label="Day 3" text="Always their team." />
      </Dealt>
      <Dealt delay={0.24} x={0} rot={0}>
        <ClueCard state="new" label="Day 6" text="Then hints, from them." />
      </Dealt>
      <Dealt delay={0.38} x={120} rot={8}>
        <ClueCard state="down" label="Day 9" />
      </Dealt>
    </>
  );
}

function WinArt({ color }: { color: string }) {
  const mode = useDemoMode("collected", "found", 1000);
  const welcomer: StickerPerson = {
    name: "Your welcomer",
    number: "?",
    team: "Somewhere close",
    color,
    tint: color,
    ask: "Coffee is on me.",
  };
  return (
    <Dealt delay={0.1} rot={-2}>
      <Sticker person={welcomer} mode={mode} tilt={false} />
    </Dealt>
  );
}

/** Four short steps on the player's first visit, each showing the real game pieces. */
export function WelcomeIntro({ firstName, fan, colors }: WelcomeIntroProps) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const finish = () => {
    startTransition(async () => {
      const result = await markIntroSeen({});
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      router.push(ROUTES.play);
    });
  };

  const collectPerson = fan[0];
  const steps: { art: ReactNode; title: string; lead: string }[] = [
    {
      art: <DealArt fan={fan} />,
      title: `Welcome, ${firstName}.`,
      lead: "Your first two weeks come with a small game.",
    },
    {
      art: collectPerson ? <CollectArt person={collectPerson} /> : null,
      title: "Collect the team.",
      lead: "Chat with someone, write one thing you learned, get their sticker.",
    },
    {
      art: <CluesArt />,
      title: "Someone is secretly welcoming you.",
      lead: "A clue lands on days 3, 6, 9 and 12. Guess whenever you like.",
    },
    {
      art: <WinArt color={colors[1] ?? colors[0] ?? FALLBACK_COLOR} />,
      title: "Find them, win your card.",
      lead: "Then you grab a virtual coffee together, and you join the album.",
    },
  ];
  const current = steps[step] ?? steps[0];
  const last = step === steps.length - 1;

  return (
    <GameStage middle className="gap-8">
      <div className="flex w-full max-w-140 flex-col items-center gap-8">
        <div className="relative flex h-72 w-full items-center justify-center" aria-hidden>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="relative flex h-full w-full items-center justify-center"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              {current?.art}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex min-h-34 w-full flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
              transition={{ duration: 0.4, delay: 0.15, ease: GAME_EASE }}
            >
              <h1 className="max-w-120 text-balance font-game-serif text-hero-md">
                {current?.title}
              </h1>
              <p className="max-w-110 text-balance text-game-muted text-lead">{current?.lead}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <Stepper count={steps.length} current={step + 1} />

        <div className="flex min-h-13 flex-wrap items-center justify-center gap-3">
          {step > 0 ? (
            <GameButton variant="light" onClick={() => setStep(step - 1)}>
              Back
            </GameButton>
          ) : null}
          {last ? (
            <GameButton onClick={finish} disabled={pending}>
              Open my album
            </GameButton>
          ) : (
            <GameButton onClick={() => setStep(step + 1)}>
              {step === 0 ? "How it works" : "Next"}
            </GameButton>
          )}
        </div>

        {last ? null : (
          <GameButton variant="link" onClick={finish} disabled={pending}>
            Skip
          </GameButton>
        )}
      </div>
    </GameStage>
  );
}
