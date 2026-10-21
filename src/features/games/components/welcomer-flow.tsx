"use client";

import { useState, useTransition } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameButton } from "@/shared/components/game/game-button";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameStage } from "@/shared/components/game/game-stage";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Pop } from "@/shared/components/game/pop";
import { Stepper } from "@/shared/components/game/stepper";
import { Sticker } from "@/shared/components/game/sticker";
import { celebrate } from "@/shared/lib/celebrate";
import { writeClue } from "../actions/write-clue";
import type { WelcomerClue, WelcomerDesk } from "../queries/get-welcomer-desk";
import { writeClueSchema } from "../schemas";
import { ClueWriterCard } from "./clue-writer-card";

const HINTS: Record<
  WelcomerClue["number"],
  { heading: string; hint: string; placeholder: string }
> = {
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
const DONE_ROTATIONS = [-4, 1, 4];

type Step = "intro" | "write" | "done";

function firstStep(desk: WelcomerDesk): Step {
  if (desk.status !== "active" || desk.clues.every((clue) => clue.text || clue.released)) {
    return "done";
  }
  return desk.clues.some((clue) => clue.text) ? "write" : "intro";
}

function statusLine(desk: WelcomerDesk) {
  if (desk.status === "found") return `${desk.playerFirstName} found you`;
  if (desk.status === "revealed") return "Revealed on day 14";
  return `Not found yet · day ${desk.day} of ${desk.totalDays}`;
}

/** Picked, then one clue at a time, then the status of the game. */
export function WelcomerFlow({ desk }: { desk: WelcomerDesk }) {
  const [step, setStep] = useState<Step>(() => firstStep(desk));
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      desk.clues.findIndex((clue) => !clue.text && !clue.released),
    ),
  );
  const [drafts, setDrafts] = useState(() => desk.clues.map((clue) => clue.text ?? ""));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const clue = desk.clues[index];
  const editable = desk.status === "active" && desk.clues.some((c) => !c.released);

  const goTo = (next: number) => {
    setError(undefined);
    setIndex(next);
  };

  const finish = () => {
    setStep("done");
    void celebrate({ x: 0.5, y: 0.45 });
  };

  const next = () => {
    if (!clue) return;
    const last = index === desk.clues.length - 1;
    const advance = () => (last ? finish() : goTo(index + 1));
    if (clue.released) {
      advance();
      return;
    }
    const parsed = writeClueSchema.safeParse({ number: clue.number, text: drafts[index] ?? "" });
    if (!parsed.success) {
      setError(parsed.error.issues.find((issue) => issue.path[0] === "text")?.message);
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

  const header = (
    <div className="flex items-center justify-between gap-4 px-4 py-5 md:px-10">
      <span className="font-game-serif text-logo">The Album</span>
      <CountChip>Secret · for {desk.playerFirstName}</CountChip>
    </div>
  );

  if (step === "intro") {
    return (
      <GameShell tone="ink">
        <div className="px-4 py-5 md:px-10">
          <span className="font-game-serif text-logo">The Album</span>
        </div>
        <GameStage middle className="gap-8 pt-0">
          <Pop>
            <Sticker person={desk.player} mode="locked" rot={-3} celebrateChanges={false} />
          </Pop>
          <div className="flex flex-col items-center gap-3">
            <span className="font-game-mono text-caption text-game-shortlist uppercase">
              Top secret
            </span>
            <h1 className="max-w-180 font-game-serif text-hero">
              You’re {desk.playerFirstName}’s secret welcomer.
            </h1>
            <p className="text-game-border-strong text-lead">
              Leave three clues. Then wait to be found.
            </p>
          </div>
          <GameButton variant="yellow" onClick={() => setStep("write")}>
            Write my clues
          </GameButton>
        </GameStage>
      </GameShell>
    );
  }

  if (step === "write" && clue) {
    const hint = HINTS[clue.number];
    return (
      <GameShell>
        {header}
        <GameStage middle className="gap-8 pt-4">
          <Stepper
            count={desk.clues.length}
            current={index + 1}
            label={`Clue ${clue.number} of 4`}
          />
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-game-serif text-hero-md">{hint.heading}</h1>
            <p className="text-game-muted text-lead">{hint.hint}</p>
          </div>
          <Pop key={clue.number}>
            <ClueWriterCard
              number={clue.number}
              caption={
                clue.released
                  ? `Clue ${clue.number} · ${desk.playerFirstName} got it on day ${clue.day}`
                  : `Clue ${clue.number} · ${desk.playerFirstName} gets it on day ${clue.day}`
              }
              value={drafts[index] ?? ""}
              placeholder={hint.placeholder}
              locked={clue.released}
              error={error}
              onChange={(value) =>
                setDrafts((current) => current.map((draft, i) => (i === index ? value : draft)))
              }
            />
          </Pop>
          {index === 0 ? (
            <p className="text-game-muted text-small">
              Clue 1 is your team. We send that one for you.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <GameButton
              variant="link"
              disabled={pending}
              onClick={() => (index === 0 ? setStep("intro") : goTo(index - 1))}
            >
              Back
            </GameButton>
            <GameButton disabled={pending} onClick={next}>
              {index === desk.clues.length - 1 ? "Done" : "Next clue"}
            </GameButton>
          </div>
        </GameStage>
      </GameShell>
    );
  }

  return (
    <GameShell>
      {header}
      <GameStage middle className="gap-9 pt-4">
        <ul aria-label="Your clues" className="flex flex-wrap justify-center gap-5">
          {desk.clues.map((written, i) => (
            <li key={written.number}>
              <Pop delay={i * 0.08}>
                <ClueCard
                  state={written.released ? "open" : "new"}
                  label={`Day ${written.day}`}
                  text={drafts[i] || "…"}
                  rot={DONE_ROTATIONS[i]}
                />
              </Pop>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-game-serif text-hero">
            {desk.status === "active" ? "Your clues are set." : "That’s a wrap."}
          </h1>
          <p className="text-game-muted text-lead">
            {desk.status === "active"
              ? `We’ll send them for you, and tell you the moment ${desk.playerFirstName} finds you.`
              : `Time for that coffee with ${desk.playerFirstName}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <CountChip dotColor="var(--color-game-ink)">{statusLine(desk)}</CountChip>
          {editable ? (
            <GameButton
              variant="link"
              onClick={() => {
                goTo(
                  Math.max(
                    0,
                    desk.clues.findIndex((c) => !c.released),
                  ),
                );
                setStep("write");
              }}
            >
              Edit clues
            </GameButton>
          ) : null}
        </div>
      </GameStage>
    </GameShell>
  );
}
