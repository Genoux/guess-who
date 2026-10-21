"use client";

import { CompassIcon, StarIcon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { GameButton } from "@/shared/components/game/game-button";
import { GameStage } from "@/shared/components/game/game-stage";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Pop } from "@/shared/components/game/pop";
import { Stepper } from "@/shared/components/game/stepper";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerPerson } from "@/shared/components/game/sticker-view";
import { ROUTES } from "@/shared/config/routes";
import { markIntroSeen } from "../actions/mark-intro-seen";

type WelcomeIntroProps = {
  firstName: string;
  /** Up to three album stickers for the opening fan, public fields only. */
  fan: StickerPerson[];
  /** Two team colors behind the "collect" and "win" steps. */
  colors: [string | undefined, string | undefined];
};

const FAN_PLACEMENT = [
  "-translate-x-[130%] rotate-[-9deg]",
  "translate-x-[30%] rotate-[8deg]",
  "-translate-x-1/2 -translate-y-2 z-2",
];

// The canvas uses Fieldtrip illustrations here; until they ship with the fonts, each step shows
// its idea with an icon or a game piece on a team color.
function Art({ color, children }: { color?: string; children: ReactNode }) {
  return (
    <div
      className="flex h-75 w-105 max-w-full items-center justify-center overflow-hidden rounded-modal bg-game-shortlist"
      style={color ? { backgroundColor: color } : undefined}
    >
      {children}
    </div>
  );
}

/** Four steps on the player's first visit: welcome, collect, the secret welcomer, the prize. */
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

  const steps = [
    {
      art: (
        <div className="relative h-75 w-120 max-w-full">
          {fan.slice(0, 3).map((person, index) => (
            <div
              key={`${person.name}-${person.number}`}
              className={`absolute top-5 left-1/2 ${FAN_PLACEMENT[index]}`}
            >
              <Sticker
                person={person}
                mode={index === 0 ? "locked" : "collected"}
                tilt={index === 2}
                celebrateChanges={false}
              />
            </div>
          ))}
        </div>
      ),
      title: `Welcome, ${firstName}.`,
      lead: "Your first two weeks come with a small game.",
    },
    {
      art: (
        <Art color={colors[0]}>
          <UsersIcon aria-hidden className="size-30 text-game-ink" strokeWidth={1.25} />
        </Art>
      ),
      title: "Collect the team.",
      lead: "Chat with someone, write one thing you learned, get their sticker.",
    },
    {
      art: (
        <Art>
          <div className="flex items-center gap-4">
            <ClueCard state="down" label="Day 3" rot={-6} />
            <CompassIcon aria-hidden className="size-20 text-game-ink" strokeWidth={1.25} />
          </div>
        </Art>
      ),
      title: "Someone is secretly welcoming you.",
      lead: "A clue lands on days 3, 6, 9 and 12. Guess whenever you like.",
    },
    {
      art: (
        <Art color={colors[1]}>
          <StarIcon aria-hidden className="size-30 text-game-ink" strokeWidth={1.25} />
        </Art>
      ),
      title: "Find them, win your card.",
      lead: "Then you two grab a virtual coffee, and you join the album.",
    },
  ];
  const current = steps[step] ?? steps[0];
  const last = step === steps.length - 1;

  return (
    <GameStage middle>
      <Pop key={step} className="flex w-full flex-col items-center gap-10">
        {current?.art}
        <div className="flex flex-col items-center gap-3">
          <h1 className="max-w-180 font-game-serif text-hero">{current?.title}</h1>
          <p className="text-game-muted text-lead">{current?.lead}</p>
        </div>
      </Pop>
      <Stepper count={steps.length} current={step + 1} />
      <div className="flex min-h-13 flex-wrap items-center justify-center gap-4">
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
    </GameStage>
  );
}
