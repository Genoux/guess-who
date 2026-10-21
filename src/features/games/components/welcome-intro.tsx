"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { AccountButton } from "@/shared/components/account-button";
import { ClueCard } from "@/shared/components/game/clue-card";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameAvatar } from "@/shared/components/game/game-avatar";
import { GameButton } from "@/shared/components/game/game-button";
import { gameCn } from "@/shared/components/game/game-cn";
import { GAME_EASE } from "@/shared/components/game/game-motion";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Stepper } from "@/shared/components/game/stepper";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { ROUTES } from "@/shared/config/routes";
import { markIntroSeen } from "../actions/mark-intro-seen";
import { TUTORIAL_ALBUM, TUTORIAL_WELCOMER } from "../lib/tutorial-cast";

type WelcomeIntroProps = {
  firstName: string;
  /** Dev preview: finishing replays the intro instead of saving and leaving. */
  preview?: boolean;
};

const SLOT = "w-40 px-0";

/** One card dealt into its slot: rises and fades in after `order` beats. */
function Dealt({ children, order = 0 }: { children: ReactNode; order?: number }) {
  return (
    <motion.div
      className="flex-none"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 + order * 0.12, ease: GAME_EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Plays a demo sticker's change once, so the step shows the real mechanic. */
function useDemoMode(from: StickerMode, to: StickerMode, afterMs: number) {
  const [mode, setMode] = useState<StickerMode>(from);
  useEffect(() => {
    const timer = setTimeout(() => setMode(to), afterMs);
    return () => clearTimeout(timer);
  }, [to, afterMs]);
  return mode;
}

/** Three full-size cards side by side, scaled to fit a phone. */
function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex origin-center scale-[0.52] items-center justify-center gap-5 sm:scale-100">
      {children}
    </div>
  );
}

/** One card on its own, a little smaller on a phone. */
function Single({ children }: { children: ReactNode }) {
  return <div className="origin-center scale-[0.82] sm:scale-100">{children}</div>;
}

function AlbumArt() {
  const angles = [-3, 1, 3];
  return (
    <Row>
      {TUTORIAL_ALBUM.map((person, index) => (
        <Dealt key={`${person.name}-${person.number}`} order={index}>
          <Sticker
            person={person}
            mode="collected"
            rot={angles[index]}
            tilt={false}
            celebrateChanges={false}
          />
        </Dealt>
      ))}
    </Row>
  );
}

function CollectArt({ person }: { person: StickerPerson }) {
  const mode = useDemoMode("locked", "collected", 1200);
  return (
    <Single>
      <div className="flex flex-col items-center gap-4">
        <Dealt>
          <Sticker person={person} mode={mode} tilt={false} />
        </Dealt>
        <motion.div
          initial={false}
          animate={mode === "collected" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.35, delay: mode === "collected" ? 0.55 : 0, ease: GAME_EASE }}
        >
          <CountChip variant="yellow" size="sm">
            +1 sticker
          </CountChip>
        </motion.div>
      </div>
    </Single>
  );
}

function CluesArt() {
  return (
    <Row>
      <Dealt order={0}>
        <ClueCard state="open" label="Clue 1" text="Always their team." />
      </Dealt>
      <Dealt order={1}>
        <ClueCard state="new" label="Clue 2" text="Then a hint, from them." />
      </Dealt>
      <Dealt order={2}>
        <ClueCard state="down" label="Clue 3" footer="In 3 days" />
      </Dealt>
    </Row>
  );
}

function WinArt() {
  const mode = useDemoMode("collected", "found", 1100);
  return (
    <Single>
      <Dealt>
        <Sticker person={TUTORIAL_WELCOMER} mode={mode} tilt={false} />
      </Dealt>
    </Single>
  );
}

/** Four short steps on the player's first visit, each playing the real game pieces. */
export function WelcomeIntro({ firstName, preview = false }: WelcomeIntroProps) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const finish = () => {
    if (preview) {
      setStep(0);
      return;
    }
    startTransition(async () => {
      const result = await markIntroSeen({});
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      router.push(ROUTES.play);
    });
  };

  const steps: { art: ReactNode; title: string; lead: string }[] = [
    {
      art: <AlbumArt />,
      title: `Welcome, ${firstName}.`,
      lead: "Your first two weeks come with a small game.",
    },
    {
      art: <CollectArt person={TUTORIAL_ALBUM[2] ?? TUTORIAL_WELCOMER} />,
      title: "Collect the team.",
      lead: "Chat with someone, note one thing you learned, and their card goes into your album.",
    },
    {
      art: <CluesArt />,
      title: "Someone is secretly welcoming you.",
      lead: "A clue lands on days 3, 6, 9 and 12. Guess whenever you like.",
    },
    {
      art: <WinArt />,
      title: "Find your welcomer.",
      lead: "Guess before day 14, or we’ll tell you on the day. Then your own card joins the album.",
    },
  ];
  const current = steps[step] ?? steps[0];
  const last = step === steps.length - 1;

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
        <span className="font-game-serif text-logo">The Album</span>
        {preview ? <GameAvatar name={firstName} color="#FF97AB" /> : <AccountButton />}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-12 text-center">
        <div
          className="flex h-60 w-full items-center justify-center overflow-x-clip sm:h-75"
          aria-hidden
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="flex items-center justify-center"
              exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: GAME_EASE } }}
            >
              {current?.art}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fixed height for the tallest copy, so the buttons and dots never move between steps. */}
        <div className="mt-10 flex h-48 w-full max-w-220 flex-col items-center sm:h-28">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.45, delay: 0.3, ease: GAME_EASE }}
            >
              <h1 className="text-balance font-game-serif text-hero-md">{current?.title}</h1>
              <p className="text-balance text-game-muted text-lead">{current?.lead}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6">
          {/* Two fixed slots: Back stays in place (hidden on the first step) and labels never resize. */}
          <div className="grid grid-cols-2 gap-3">
            <GameButton
              variant="light"
              className={gameCn(SLOT, step === 0 && "invisible")}
              aria-hidden={step === 0}
              tabIndex={step === 0 ? -1 : undefined}
              onClick={() => setStep(Math.max(0, step - 1))}
            >
              Back
            </GameButton>
            {last ? (
              <GameButton className={SLOT} onClick={finish} disabled={pending}>
                {preview ? "Replay" : "Open my album"}
              </GameButton>
            ) : (
              <GameButton className={SLOT} onClick={() => setStep(step + 1)}>
                {step === 0 ? "How it works" : "Next"}
              </GameButton>
            )}
          </div>
          <Stepper count={steps.length} current={step + 1} />
        </div>
      </main>
    </div>
  );
}
