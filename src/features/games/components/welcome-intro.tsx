"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { AnimatePresence, motion, useIsPresent, type Variants } from "motion/react";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useRef, useState, useTransition } from "react";
import { AccountButton } from "@/shared/components/account-button";
import { CountChip } from "@/shared/components/game/count-chip";
import { Flip } from "@/shared/components/game/flip";
import { GameAvatar } from "@/shared/components/game/game-avatar";
import { GameButton } from "@/shared/components/game/game-button";
import { gameCn } from "@/shared/components/game/game-cn";
import { beats, TRANSITION } from "@/shared/components/game/game-motion";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Stepper } from "@/shared/components/game/stepper";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode, StickerPerson } from "@/shared/components/game/sticker-view";
import { ROUTES } from "@/shared/config/routes";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { markIntroSeen } from "../actions/mark-intro-seen";
import { TUTORIAL_ALBUM, TUTORIAL_WELCOMER } from "../lib/tutorial-cast";
import { IncognitoCard } from "./incognito-card";
import { ClueReveal } from "./mission-clues";

type WelcomeIntroProps = {
  firstName: string;
  /** Dev preview: finishing replays the intro instead of saving and leaving. */
  preview?: boolean;
};

const ROUND = "size-13 px-0";

/** 1 when moving forward, -1 when going back: every slide mirrors on the way back. */
const Direction = createContext(1);

/** Arrivals wait for the leaving view, so the two never cross. */
const AFTER_LEAVE_S = TRANSITION.exit.duration;
const DEAL_AT = beats(2);
const COLLECT_FLIP_AT = beats(3);
/** After the ruled-out stamp has landed on the card beside it. */
const WIN_FLIP_AT = beats(2);
const TITLE_AT = beats(1);

const WELCOME_MOTION: Variants = {
  enter: (direction: number) => ({ opacity: 0, y: direction < 0 ? -32 : 24 }),
  center: (direction: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION.arrive, delay: direction < 0 ? AFTER_LEAVE_S : 0 },
  }),
  exit: { opacity: 0, y: -32, transition: TRANSITION.exit },
};

// Reads `custom` from its AnimatePresence: a leaving child no longer gets new props, only that.
const ART_MOTION: Variants = {
  exit: (direction: number) => ({
    opacity: 0,
    x: -64 * direction,
    transition: TRANSITION.exit,
  }),
};

type DealtProps = {
  children: ReactNode;
  order?: number;
  /** Runs once the card has landed in its slot. */
  onDealt?: () => void;
};

/** One card dealt onto the stage: slides in from the side we are moving towards, after `order` beats. */
function Dealt({ children, order = 0, onDealt }: DealtProps) {
  const direction = use(Direction);
  return (
    // Translate and opacity only: scaling a card mid-flight resamples its edges and shimmers.
    <motion.div
      className="flex-none"
      initial={{ opacity: 0, x: 96 * direction }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...TRANSITION.travel, delay: DEAL_AT + beats(order) }}
      onAnimationComplete={onDealt}
    >
      {children}
    </motion.div>
  );
}

/** Takes a leaving view out of focus and clicks while it fades, so a double click never fires twice. */
function InertWhenLeaving({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  return (
    <div className="contents" inert={!isPresent}>
      {children}
    </div>
  );
}

// Cards only ever scale down, never up: scaling a card up blurs its edges. The fit is per stage
// width, for two large stickers (624px) or three mission-size clues (648px).
function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex origin-center items-center justify-center gap-6 [zoom:0.4] sm:[zoom:0.75] md:[zoom:1] md:scale-[0.62] lg:scale-[0.85] xl:scale-100">
      {children}
    </div>
  );
}

function Single({ children }: { children: ReactNode }) {
  return (
    <div className="origin-center [zoom:0.66] md:[zoom:1] md:scale-[0.8] xl:scale-100">
      {children}
    </div>
  );
}

/** The card arrives locked, turns to collected after a beat, and the +1 lands with it. */
function CollectArt({ person }: { person: StickerPerson }) {
  const [mode, setMode] = useState<StickerMode>("locked");
  const [landed, setLanded] = useState(false);
  return (
    <Single>
      <div className="flex flex-col items-center gap-4">
        <Dealt onDealt={() => setMode("collected")}>
          <Sticker
            person={person}
            mode={mode}
            size="lg"
            tilt={false}
            flipDelay={COLLECT_FLIP_AT}
            onFlipped={() => setLanded(true)}
          />
        </Dealt>
        <motion.div
          initial={false}
          animate={landed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={TRANSITION.enter}
        >
          <CountChip variant="yellow" size="sm">
            +1 sticker
          </CountChip>
        </motion.div>
      </div>
    </Single>
  );
}

/** The mission page's clue cards: two read, the third face down with its Reveal button. */
function CluesArt() {
  return (
    <Row>
      <Dealt order={0}>
        <ClueReveal number={1} text="I sit with the Strategy team." open className="w-50" />
      </Dealt>
      <Dealt order={1}>
        <ClueReveal number={2} text="Ask me about my sourdough." open className="w-50" />
      </Dealt>
      <Dealt order={2}>
        <ClueReveal
          number={3}
          text="I’ve been here for three years."
          open={false}
          className="w-50"
        />
      </Dealt>
    </Row>
  );
}

/** A wrong guess rules a card out, then the face-down welcomer turns over, found. */
function WinArt() {
  const [wrong, setWrong] = useState<StickerMode>("collected");
  const [revealed, setRevealed] = useState(false);
  const [welcomer, setWelcomer] = useState<StickerMode>("collected");
  const welcomerRef = useRef<HTMLDivElement>(null);
  const wrongGuess = TUTORIAL_ALBUM[0] ?? TUTORIAL_WELCOMER;

  return (
    <Row>
      <Dealt order={0} onDealt={() => setWrong("ruled")}>
        <Sticker person={wrongGuess} mode={wrong} size="lg" tilt={false} />
      </Dealt>
      <Dealt order={1} onDealt={() => setRevealed(true)}>
        <div ref={welcomerRef}>
          <Flip
            className="h-106 w-75"
            flipped={revealed}
            delay={WIN_FLIP_AT}
            onFlipped={() => {
              setWelcomer("welcomer");
              if (welcomerRef.current) {
                void celebrate(originFromElement(welcomerRef.current), {
                  kind: "found",
                  palette: "dark",
                });
              }
            }}
            front={<IncognitoCard />}
            back={<Sticker person={TUTORIAL_WELCOMER} mode={welcomer} size="lg" tilt={false} />}
          />
        </div>
      </Dealt>
    </Row>
  );
}

/** The player's first visit: a welcome screen, then a three-step tour played with the real game pieces. */
export function WelcomeIntro({ firstName, preview = false }: WelcomeIntroProps) {
  // 0 is the welcome screen; 1 to tour.length are the tour steps.
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  // The clicked button leaves with its view, so focus moves to the new heading; never on first load.
  const [navigated, setNavigated] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setNavigated(true);
    setStep(next);
  };
  const focusHeading = navigated
    ? (heading: HTMLHeadingElement | null) => heading?.focus({ preventScroll: true })
    : undefined;

  const finish = () => {
    if (preview) {
      goTo(0);
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

  const tour: { art: ReactNode; stage: string; title: string; lead: string }[] = [
    {
      art: <CollectArt person={TUTORIAL_ALBUM[2] ?? TUTORIAL_WELCOMER} />,
      stage: "#46BDF0",
      title: "Collect the team.",
      lead: "Chat with someone, note one thing you learned, and their card goes into your album.",
    },
    {
      art: <CluesArt />,
      stage: "#FF97AB",
      title: "You have a secret welcomer.",
      lead: "Someone on the team is quietly looking out for you. They’ll leave you a few clues along the way.",
    },
    {
      art: <WinArt />,
      // --color-game-muted, not ink: the ruled-out stamp is ink and would vanish on it.
      stage: "#5C5C55",
      title: "Find your welcomer.",
      lead: "Guess when you think you know. A wrong guess rules that person out, and if time runs out, we’ll reveal them.",
    },
  ];
  const current = tour[step - 1] ?? tour[0];
  const last = step === tour.length;

  return (
    // On desktop the tour's stage spans all three rows of the right column, header row included.
    <div className="relative grid min-h-dvh w-full grid-rows-[auto_auto_1fr_auto] overflow-clip md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:grid-rows-[auto_1fr_auto]">
      {/* Full width on the welcome, the left column during the tour. */}
      <header
        className={gameCn(
          "relative z-10 col-start-1 row-start-1 flex items-center justify-between px-6 pt-6 md:px-12 md:pt-10",
          step === 0 && "md:col-span-full",
        )}
      >
        <span className="font-game-serif text-logo">The Album</span>
        {/* popLayout pins the leaving avatar where it was while the new one fades in at its new spot. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step > 0 ? "tour" : "welcome"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { ...TRANSITION.arrive, delay: AFTER_LEAVE_S } }}
            exit={{ opacity: 0, transition: TRANSITION.exit }}
          >
            {preview ? <GameAvatar name={firstName} color="#FF97AB" /> : <AccountButton />}
          </motion.div>
        </AnimatePresence>
      </header>

      {/* Both views hold fixed grid cells, so the leaving one fades out in place while the other
          comes in over it. popLayout would lift the tour out of the grid and its rows would jump. */}
      <AnimatePresence custom={direction}>
        {step === 0 ? (
          <motion.main
            key="welcome"
            className="col-span-full row-[2/-1] flex flex-col items-center justify-center px-6 text-center"
            custom={direction}
            variants={WELCOME_MOTION}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <InertWhenLeaving>
              <h1
                ref={focusHeading}
                tabIndex={-1}
                className="text-balance font-game-serif text-hero-md outline-none md:text-hero"
              >
                Welcome, {firstName}.
              </h1>
              <p className="mt-4 max-w-110 text-balance text-game-muted text-lead">
                Your first two weeks come with a small game.
              </p>
              <div className="mt-10 flex gap-3">
                <GameButton variant="light" onClick={finish} disabled={pending}>
                  Skip for now
                </GameButton>
                <GameButton onClick={() => goTo(1)}>How it works</GameButton>
              </div>
            </InertWhenLeaving>
          </motion.main>
        ) : (
          <motion.div
            key="tour"
            className="col-span-full row-span-3 row-start-2 grid grid-rows-subgrid md:row-span-3 md:row-start-1 md:grid-cols-subgrid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: TRANSITION.exit }}
            transition={{ ...TRANSITION.arrive, delay: AFTER_LEAVE_S }}
          >
            <InertWhenLeaving>
              <motion.div
                className="relative mx-3 mt-4 flex h-88 items-center justify-center overflow-hidden rounded-modal md:col-start-2 md:row-span-3 md:row-start-1 md:m-3 md:h-auto"
                initial={{ opacity: 0, x: 80, backgroundColor: current?.stage }}
                animate={{ opacity: 1, x: 0, backgroundColor: current?.stage }}
                exit={{ opacity: 0, x: 80, transition: TRANSITION.exit }}
                transition={{ ...TRANSITION.travel, delay: AFTER_LEAVE_S }}
                aria-hidden
              >
                <Direction value={direction}>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      className="flex items-center justify-center"
                      variants={ART_MOTION}
                      exit="exit"
                    >
                      {current?.art}
                    </motion.div>
                  </AnimatePresence>
                </Direction>
              </motion.div>

              <main className="flex flex-col justify-center px-6 py-10 md:col-start-1 md:row-start-2 md:px-12">
                <Stepper
                  count={tour.length}
                  current={step}
                  cumulative
                  className="mb-8 justify-start"
                />
                {/* Every step's copy shares one cell, so the block keeps the tallest step's height
                    and the centered dots never move. */}
                <div className="grid max-w-120">
                  {tour.map((item, index) => {
                    const shown = index === step - 1;
                    return (
                      <motion.div
                        key={item.title}
                        className="col-start-1 row-start-1 flex flex-col gap-4"
                        inert={!shown}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: shown ? 1 : 0 }}
                        transition={
                          shown
                            ? {
                                ...TRANSITION.arrive,
                                delay: TRANSITION.exitFast.duration + TITLE_AT,
                              }
                            : TRANSITION.exitFast
                        }
                      >
                        <h1
                          ref={shown ? focusHeading : undefined}
                          tabIndex={-1}
                          className="text-balance font-game-serif text-hero-md outline-none 2xl:text-hero"
                        >
                          {item.title}
                        </h1>
                        <p className="text-pretty text-game-muted text-lead">{item.lead}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </main>

              <footer className="flex items-center justify-between gap-4 px-6 pb-8 md:col-start-1 md:row-start-3 md:px-12 md:pb-10">
                <GameButton
                  variant="light"
                  className={ROUND}
                  aria-label="Back"
                  onClick={() => goTo(step - 1)}
                >
                  <ArrowLeftIcon className="size-5" />
                </GameButton>
                {last ? (
                  <GameButton onClick={finish} disabled={pending}>
                    {preview ? "Replay" : "Open my album"}
                  </GameButton>
                ) : (
                  <GameButton className={ROUND} aria-label="Next" onClick={() => goTo(step + 1)}>
                    <ArrowRightIcon className="size-5" />
                  </GameButton>
                )}
              </footer>
            </InertWhenLeaving>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
