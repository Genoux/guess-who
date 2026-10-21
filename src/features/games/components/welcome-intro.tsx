"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameButton } from "@/shared/components/game/game-button";
import { GAME_EASE } from "@/shared/components/game/game-motion";
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
  /** Dev preview: finishing replays the intro instead of saving and leaving. */
  preview?: boolean;
};

const FALLBACK_COLOR = "#FF97AB";

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

/** Keeps a row of full-size cards inside a phone screen. */
function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex origin-center scale-[0.56] items-center justify-center gap-5 sm:scale-100">
      {children}
    </div>
  );
}

function AlbumArt({ fan }: { fan: StickerPerson[] }) {
  const angles = [-3, 1, 3];
  return (
    <Row>
      {fan.slice(0, 3).map((person, index) => (
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
  );
}

function CluesArt() {
  return (
    <Row>
      <Dealt order={0}>
        <ClueCard state="open" label="Day 3" text="Always their team." />
      </Dealt>
      <Dealt order={1}>
        <ClueCard state="new" label="Day 6" text="Then a hint, from them." />
      </Dealt>
      <Dealt order={2}>
        <ClueCard state="down" label="Day 9" />
      </Dealt>
    </Row>
  );
}

function WinArt({ color }: { color: string }) {
  const mode = useDemoMode("collected", "found", 1100);
  const welcomer: StickerPerson = {
    name: "Your welcomer",
    number: "?",
    team: "Somewhere close",
    color,
    tint: color,
    ask: "Coffee is on me.",
  };
  return (
    <Dealt>
      <Sticker person={welcomer} mode={mode} tilt={false} />
    </Dealt>
  );
}

/** Four short steps on the player's first visit, each playing the real game pieces. */
export function WelcomeIntro({ firstName, fan, colors, preview = false }: WelcomeIntroProps) {
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

  const collectPerson = fan[1] ?? fan[0];
  const steps: { art: ReactNode; title: string; lead: string }[] = [
    {
      art: <AlbumArt fan={fan} />,
      title: `Welcome, ${firstName}.`,
      lead: "Your first two weeks come with a small game.",
    },
    {
      art: collectPerson ? <CollectArt person={collectPerson} /> : null,
      title: "Collect the team.",
      lead: "Chat with someone, write one thing you learned, and their sticker is yours.",
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
    <div className="flex min-h-dvh w-full flex-col">
      <header className="flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
        <span className="font-game-serif text-logo">The Album</span>
        {last ? null : (
          <GameButton variant="link" onClick={finish} disabled={pending}>
            Skip
          </GameButton>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-10 text-center">
        <div className="flex h-75 w-full items-center justify-center overflow-x-clip" aria-hidden>
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

        <div className="flex min-h-32 w-full max-w-130 flex-col items-center">
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
      </main>

      <footer className="flex flex-col items-center gap-6 px-6 pb-12 md:pb-16">
        <Stepper count={steps.length} current={step + 1} />
        <div className="flex items-center justify-center gap-3">
          {step > 0 ? (
            <GameButton variant="light" onClick={() => setStep(step - 1)}>
              Back
            </GameButton>
          ) : null}
          {last ? (
            <GameButton onClick={finish} disabled={pending}>
              {preview ? "Replay" : "Open my album"}
            </GameButton>
          ) : (
            <GameButton onClick={() => setStep(step + 1)}>
              {step === 0 ? "How it works" : "Next"}
            </GameButton>
          )}
        </div>
      </footer>
    </div>
  );
}
