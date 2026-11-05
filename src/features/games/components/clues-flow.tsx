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
import { GameTooltip } from "@/shared/components/game/game-tooltip";
import { Reveal } from "@/shared/components/game/reveal";
import { SaveAnywayDialog } from "@/shared/components/game/save-anyway-dialog";
import { Stepper } from "@/shared/components/game/stepper";
import { writeClue } from "../actions/write-clue";
import { canAdvanceFrom, clueNeedsTeam, teamMissing } from "../lib/clue-flow";
import { CLUE_HINTS } from "../lib/clue-hints";
import type { TopNavData } from "../lib/top-nav";
import type { CluesDesk } from "../queries/get-clues-desk";
import { writeClueSchema } from "../schemas";
import { AppTopNav } from "./app-top-nav";
import { ClueWriterCard } from "./clue-writer-card";
import { InertWhenLeaving, SLIDE_MOTION, STEP_MOTION } from "./step-motion";

const DONE_ROTATIONS = [-4, 2, -1, 4];

const INCOMPLETE_CLUES_COPY = "You can't be picked as a welcomer until all three are written.";

const STEPS = ["write", "done"] as const;
type Step = (typeof STEPS)[number];

type CluesFlowProps = {
  desk: CluesDesk;
  nav: TopNavData;
  /** Dev preview: clues are not saved. */
  preview?: boolean;
};

/**
 * A teammate's own clues, one card at a time, then the set view; it opens on the writer until all
 * three clues are written.
 */
export function CluesFlow({ desk, nav, preview = false }: CluesFlowProps) {
  const canEdit = desk.clues.some((c) => c.editable);
  // Clue 1 says where they work, so a person with no team has not set their clues yet.
  const cluesSet =
    !canEdit || (!teamMissing(desk.clues) && desk.clues.every((c) => !c.editable || c.text));
  const [step, setStep] = useState<Step>(cluesSet ? "done" : "write");
  const [direction, setDirection] = useState(0);
  const navigated = useRef(false);
  const [clueDirection, setClueDirection] = useState(1);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState(() => desk.clues.map((clue) => clue.text ?? ""));
  const [pending, startTransition] = useTransition();
  const clue = desk.clues[index];
  const who = desk.playerNamed ? desk.playerFirstName : "the new hire";
  const [confirmingIncomplete, setConfirmingIncomplete] = useState(false);
  // A cleared clue counts as a change: saving a blank text removes it.
  const unsaved = desk.clues.flatMap((c, i) => {
    const text = drafts[i]?.trim() ?? "";
    return c.editable && text !== (c.text ?? "") ? [{ number: c.number, text }] : [];
  });
  const cluesComplete = desk.clues.every((c, i) => !c.editable || drafts[i]?.trim());

  // Back from clue 1 returns to the clue view when editing; opened on the writer, there is nowhere to go.
  const [writeFrom, setWriteFrom] = useState<Step | null>(null);

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

  // Clues save together on the last step, so that is where an incomplete set is confirmed.
  const next = () => {
    if (!clue || !canAdvanceFrom(desk.clues, index)) return;
    if (index < desk.clues.length - 1) return goTo(index + 1);
    if (unsaved.length > 0 && !cluesComplete) return setConfirmingIncomplete(true);
    finish();
  };

  const finish = () => {
    if (unsaved.length === 0) return goToStep("done");
    save();
  };

  const save = () => {
    startTransition(async () => {
      for (const { number, text } of unsaved) {
        const parsed = writeClueSchema.safeParse({ number, text });
        if (!parsed.success) return;
        const result = preview ? { ok: true as const } : await writeClue(parsed.data);
        if (!result.ok) {
          gameToast(result.error);
          return;
        }
      }
      gameToast("Saved");
      goToStep("done");
    });
  };

  const shown: Step = step === "write" && !clue ? "done" : step;
  const views: Record<Step, () => ReactNode> = {
    write: () => {
      if (!clue) return null;
      const hint = CLUE_HINTS[clue.number];
      const last = index === desk.clues.length - 1;
      const needsTeam = clueNeedsTeam(clue);
      return (
        <GameStage className="gap-8 md:pt-4">
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
              disabled={pending || (index === 0 && !writeFrom)}
              onClick={() =>
                index > 0 ? goTo(index - 1) : writeFrom ? goToStep(writeFrom, true) : undefined
              }
            >
              <ArrowLeftIcon />
            </GameButton>
            {last ? (
              <GameButton disabled={pending || needsTeam} onClick={next}>
                Done
              </GameButton>
            ) : (
              <GameButton
                size="round"
                aria-label="Next clue"
                disabled={pending || needsTeam}
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
      <GameStage className="gap-9 md:pt-4">
        <div className="flex flex-col items-center gap-3">
          <h1
            ref={focusHeading}
            tabIndex={-1}
            className="font-game-serif text-3xl sm:text-hero outline-none"
          >
            {cluesComplete ? "Your clues are set." : "Your clues aren't finished."}
          </h1>
          <p className="max-w-130 text-balance text-game-muted text-base sm:text-lead">
            {!cluesComplete
              ? INCOMPLETE_CLUES_COPY
              : desk.welcoming
                ? `${desk.playerFirstName} gets one every three days.`
                : "If you're picked as a new hire's secret welcomer, they get one every three days."}
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
        ) : (
          <GameTooltip label={`Locked while ${who} is playing`} side="top">
            <GameButton
              variant="link"
              aria-disabled="true"
              className="cursor-not-allowed aria-disabled:pointer-events-auto hover:text-game-muted"
              onClick={(event) => event.preventDefault()}
            >
              Edit clues
            </GameButton>
          </GameTooltip>
        )}
      </GameStage>
    ),
  };

  return (
    <GameShell>
      <AppTopNav nav={nav} current="clues" />
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
      <SaveAnywayDialog
        open={confirmingIncomplete}
        title="Save incomplete clues?"
        description={INCOMPLETE_CLUES_COPY}
        onKeepEditing={() => setConfirmingIncomplete(false)}
        onSave={() => {
          setConfirmingIncomplete(false);
          finish();
        }}
      />
    </GameShell>
  );
}
