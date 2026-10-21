"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameBook } from "@/shared/components/game/game-book";
import { GameButton } from "@/shared/components/game/game-button";
import { GameField } from "@/shared/components/game/game-field";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Pop } from "@/shared/components/game/pop";
import { Sticker } from "@/shared/components/game/sticker";
import { formatStickerNumber, type StickerPerson } from "@/shared/components/game/sticker-view";
import { celebrate, originFromElement } from "@/shared/lib/celebrate";
import { updateMyCard } from "../actions/update-my-card";
import { CARD_LIMITS, updateMyCardSchema } from "../schemas";
import type { CardAudience, CardFields, MyCard } from "../types";

type FieldErrors = Partial<Record<keyof CardFields, string>>;

type Copy = {
  title: string;
  lead: string;
  submit: string;
  savedTitle: string;
  savedLead: (number: string) => string;
  savedChip: (number: string, team: string) => string;
  savedNote: string;
};

const COPY: Record<CardAudience, Copy> = {
  teammate: {
    title: "Your sticker",
    lead: "Every new hire collects it. Takes a minute.",
    submit: "Save my sticker",
    savedTitle: "Looking good.",
    savedLead: () => "Saved. You can change it any time.",
    savedChip: () => "In every new hire’s album",
    savedNote: "When someone new chats with you, they’ll unlock it.",
  },
  "new-hire": {
    title: "Your turn.",
    lead: "Make your sticker. The next new hire will collect it.",
    submit: "Add me to the album",
    savedTitle: "You’re in.",
    savedLead: (number) => `Sticker No. ${number} is in the album.`,
    savedChip: (number, team) => `No. ${number} · ${team}`,
    savedNote: "The next new hire will be looking for you.",
  },
};

// Stand-ins so an empty card still previews as a sticker; team colors come from the teams table.
const EMPTY_TEAM = {
  name: "Your team",
  color: "var(--color-game-hover)",
  tint: "var(--color-game-sidebar)",
};

function toFieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof CardFields;
    errors[field] ??= issue.message;
  }
  return errors;
}

/** The live sticker preview beside the form that fills it in. */
export function CardEditor({ card }: { card: MyCard }) {
  const [values, setValues] = useState(card.fields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const stickerRef = useRef<HTMLDivElement>(null);

  const copy = COPY[card.audience];
  const team = card.teams.find((option) => option.id === values.teamId) ?? EMPTY_TEAM;
  const number = formatStickerNumber(card.stickerNumber);
  const preview: StickerPerson = {
    name: card.name,
    number,
    team: team.name,
    color: team.color,
    tint: team.tint,
    city: values.location.trim() || "Your city",
    fact: values.fact.trim() || "Your random fact.",
    ask: values.ask.trim() || "What to ask you about",
  };

  const set = (field: keyof CardFields) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateMyCardSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await updateMyCard(parsed.data);
      if (!result.ok) {
        gameToast(result.errorId ? `${result.error} Ref ${result.errorId}` : result.error, {
          duration: 6000,
        });
        return;
      }
      setValues(result.data);
      setSaved(true);
      if (stickerRef.current) void celebrate(originFromElement(stickerRef.current));
    });
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-game-serif text-hero-md md:text-hero">
          {saved ? copy.savedTitle : copy.title}
        </h1>
        <p className="max-w-130 text-game-muted text-lead">
          {saved ? copy.savedLead(number) : copy.lead}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-14">
        <div ref={stickerRef}>
          <Sticker person={preview} size="lg" rot={-2} celebrateChanges={false} />
        </div>

        {saved ? (
          <Pop className="flex w-95 max-w-full flex-col items-center gap-5">
            <CountChip variant="yellow">{copy.savedChip(number, team.name)}</CountChip>
            <p className="text-lead">{copy.savedNote}</p>
            <GameButton variant="light" onClick={() => setSaved(false)}>
              Edit my sticker
            </GameButton>
          </Pop>
        ) : (
          <GameBook as="div" className="w-95 max-w-full p-7 md:p-7">
            <form noValidate onSubmit={submit} className="flex w-full flex-col gap-4.5">
              <div className="grid w-full grid-cols-2 gap-3">
                <GameField
                  label="Team"
                  name="teamId"
                  options={card.teams.map((option) => ({ value: option.id, label: option.name }))}
                  placeholder="Pick one"
                  value={values.teamId}
                  onChange={set("teamId")}
                  error={errors.teamId}
                />
                <GameField
                  label="Location"
                  name="location"
                  autoComplete="address-level2"
                  maxLength={CARD_LIMITS.location}
                  value={values.location}
                  onChange={set("location")}
                  error={errors.location}
                />
              </div>
              <GameField
                label="Random fact"
                name="fact"
                maxLength={CARD_LIMITS.fact}
                value={values.fact}
                onChange={set("fact")}
                error={errors.fact}
              />
              <GameField
                label="Ask me about"
                name="ask"
                maxLength={CARD_LIMITS.ask}
                value={values.ask}
                onChange={set("ask")}
                error={errors.ask}
              />
              <GameButton type="submit" className="w-full" disabled={pending}>
                {pending ? "Saving…" : copy.submit}
              </GameButton>
            </form>
          </GameBook>
        )}
      </div>
    </>
  );
}
