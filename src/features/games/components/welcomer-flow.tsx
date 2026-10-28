"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useCallback, useRef, useState, useTransition } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { GameButton } from "@/shared/components/game/game-button";
import { stagger, TRANSITION } from "@/shared/components/game/game-motion";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Reveal } from "@/shared/components/game/reveal";
import { Stepper } from "@/shared/components/game/stepper";
import { celebrate } from "@/shared/lib/celebrate";
import { writeClue } from "../actions/write-clue";
import type { WelcomerClue, WelcomerDesk } from "../queries/get-welcomer-desk";
import { writeClueSchema } from "../schemas";
import { ClueWriterCard } from "./clue-writer-card";
import { InertWhenLeaving, SLIDE_MOTION, STEP_MOTION } from "./step-motion";
import { TeammateTopNav } from "./teammate-top-nav";

const HINTS: Record<
  WelcomerClue["number"],
  { heading: string; hint: string; placeholder: string }
> = {
  1: {
    heading: "Clue 1 is your team.",
    hint: "We add it for you. You write the next three.",
    placeholder: "Add your team to your sticker and it shows up here.",
  },
  2: {
    heading: "Start broad.",
    hint: "It should fit a few people in your team.",
    placeholder: "Coffee or tea? Morning or night?",
  },
  3: {
    heading: "Narrow it down.",
    hint: "Two or three people should still fit.",
    placeholder: "A hobby, a habit, a place",
  },
  4: {
    heading: "The giveaway.",
    hint: "Make it point at you.",
    placeholder: "Something only you would say",
  },
};
const DONE_ROTATIONS = [-4, 2, -1, 4];

const STEPS = ["intro", "write", "done"] as const;
type Step = (typeof STEPS)[number];

type WelcomerFlowProps = {
  desk: WelcomerDesk;
  /** Dev preview: clues are not saved. */
  preview?: boolean;
};

/** Picked, then one clue at a time, then the status of the game. Always opens on the pick. */
export function WelcomerFlow({ desk, preview = false }: WelcomerFlowProps) {
  const [step, setStep] = useState<Step>("intro");
  const [direction, setDirection] = useState(0);
  const navigated = useRef(false);
  const [clueDirection, setClueDirection] = useState(1);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState(() => desk.clues.map((clue) => clue.text ?? ""));
  const [pending, startTransition] = useTransition();
  const clue = desk.clues[index];
  const over = desk.status !== "active";
  const canEdit = !over && desk.clues.some((c) => c.editable);
  const cluesSet = !canEdit || desk.clues.every((c) => !c.editable || c.text);

  // Back from clue 1 returns where the writing started: the pick, or the clue view when editing.
  const [writeFrom, setWriteFrom] = useState<Step>("intro");

  const goToStep = (next: Step, back = STEPS.indexOf(next) < STEPS.indexOf(step)) => {
    if (next === "write") setWriteFrom(step);
    setDirection(back ? -1 : 1);
    navigated.current = true;
    setStep(next);
  };
  // The clicked button leaves with its view, so focus moves to the new heading; never on first load.
  // Stable, so typing a clue never pulls focus back to the heading.
  const focusHeading = useCallback((heading: HTMLHeadingElement | null) => {
    if (navigated.current) heading?.focus({ preventScroll: true });
  }, []);

  const goTo = (next: number) => {
    setClueDirection(next < index ? -1 : 1);
    setIndex(next);
  };

  const finish = () => {
    goToStep("done");
    void celebrate({ x: 0.5, y: 0.45 });
  };

  const next = () => {
    if (!clue) return;
    const last = index === desk.clues.length - 1;
    const advance = () => (last ? finish() : goTo(index + 1));
    if (!clue.editable) {
      advance();
      return;
    }
    const parsed = writeClueSchema.safeParse({ number: clue.number, text: drafts[index] ?? "" });
    if (!parsed.success) return;
    if (preview) {
      advance();
      return;
    }
    startTransition(async () => {
      const result = await writeClue(parsed.data);
      if (!result.ok) {
        gameToast(result.error);
        return;
      }
      advance();
    });
  };

  const shown: Step = step === "write" && !clue ? "done" : step;
  const views: Record<Step, () => ReactNode> = {
    intro: () => (
      <GameStage className="gap-8 pt-0">
        <div className="flex flex-col items-center gap-3">
          <span className="font-game-mono text-caption text-game-shortlist uppercase">
            Top secret
          </span>
          <h1
            ref={focusHeading}
            tabIndex={-1}
            className="max-w-180 font-game-serif text-3xl sm:text-hero outline-none"
          >
            {over ? "You were" : "You’re"} {desk.playerFirstName}’s secret welcomer.
          </h1>
          <p className="text-balance text-game-border-strong text-base sm:text-lead">
            {over
              ? "The game is over."
              : cluesSet
                ? "Your clues are set. Now wait to be found."
                : "Leave three clues. Then wait to be found."}
          </p>
        </div>
        {cluesSet ? (
          <GameButton variant="yellow" onClick={() => goToStep("done")}>
            See my clues
          </GameButton>
        ) : (
          <GameButton
            variant="yellow"
            onClick={() => {
              goTo(0);
              goToStep("write");
            }}
          >
            Write my clues
          </GameButton>
        )}
      </GameStage>
    ),
    write: () => {
      if (!clue) return null;
      const hint = HINTS[clue.number];
      const last = index === desk.clues.length - 1;
      const blank = clue.editable && !drafts[index]?.trim();
      return (
        <GameStage className="gap-8 pt-4">
          <Stepper
            count={desk.clues.length}
            current={index + 1}
            cumulative
            label={`Clue ${clue.number} of 4`}
          />
          <Reveal key={clue.number} className="flex flex-col items-center gap-2">
            <h1
              ref={focusHeading}
              tabIndex={-1}
              className="font-game-serif text-3xl sm:text-hero-md outline-none"
            >
              {hint.heading}
            </h1>
            <p className="max-w-130 text-balance text-game-muted text-base sm:text-lead">
              {hint.hint}
            </p>
          </Reveal>
          <AnimatePresence mode="wait" initial={false} custom={clueDirection}>
            <motion.div
              className="flex w-full justify-center"
              key={clue.number}
              custom={clueDirection}
              variants={SLIDE_MOTION}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION.travel}
            >
              <ClueWriterCard
                number={clue.number}
                value={drafts[index] ?? ""}
                placeholder={hint.placeholder}
                locked={!clue.editable}
                onChange={(value) =>
                  setDrafts((current) => current.map((draft, i) => (i === index ? value : draft)))
                }
              />
            </motion.div>
          </AnimatePresence>
          <div className="flex w-140 max-w-full items-center justify-between gap-4">
            <GameButton
              variant="light"
              size="round"
              aria-label="Back"
              disabled={pending}
              onClick={() => (index === 0 ? goToStep(writeFrom, true) : goTo(index - 1))}
            >
              <ArrowLeftIcon />
            </GameButton>
            {last ? (
              <GameButton disabled={pending || blank} onClick={next}>
                Done
              </GameButton>
            ) : (
              <GameButton
                size="round"
                aria-label="Next clue"
                disabled={pending || blank}
                onClick={next}
              >
                <ArrowRightIcon />
              </GameButton>
            )}
          </div>
        </GameStage>
      );
    },
    done: () => (
      <GameStage className="gap-9 pt-4">
        <div className="flex flex-col items-center gap-3">
          <h1
            ref={focusHeading}
            tabIndex={-1}
            className="font-game-serif text-3xl sm:text-hero outline-none"
          >
            {over ? "That’s a wrap." : "Your clues are set."}
          </h1>
          <p className="text-game-muted text-base sm:text-lead">
            {over
              ? `${desk.playerFirstName} knows it was you.`
              : `${desk.playerFirstName} gets one every three days.`}
          </p>
        </div>
        <ul aria-label="Your clues" className="flex flex-wrap justify-center gap-5">
          {desk.clues.map((written, i) => (
            <Reveal key={written.number} as="li" delay={stagger(i, desk.clues.length)}>
              <ClueCard
                state="up"
                label={`Clue ${written.number}`}
                text={drafts[i] || "…"}
                rot={DONE_ROTATIONS[i]}
              />
            </Reveal>
          ))}
        </ul>
        {canEdit ? (
          <GameButton
            variant="link"
            onClick={() => {
              goTo(0);
              goToStep("write");
            }}
          >
            Edit clues
          </GameButton>
        ) : null}
      </GameStage>
    ),
  };

  return (
    <GameShell
      tone={shown === "intro" ? "ink" : "default"}
      className="transition-colors duration-slow ease-game motion-reduce:transition-none"
    >
      <TeammateTopNav current="welcomer" welcomer tone={shown === "intro" ? "ink" : "light"} />
      {/* popLayout takes the leaving view out of the flow where it stands, so the arriving one's
          height never re-centers it mid-fade. The page returns to the top once nothing shows. */}
      <div className="relative flex flex-1">
        <AnimatePresence
          custom={direction}
          mode="popLayout"
          onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}
        >
          <motion.div
            key={shown}
            className="flex min-w-0 flex-1"
            custom={direction}
            variants={STEP_MOTION}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <InertWhenLeaving>{views[shown]()}</InertWhenLeaving>
          </motion.div>
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
