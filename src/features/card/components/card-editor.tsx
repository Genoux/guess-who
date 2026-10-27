"use client";

import { type FormEvent, useState, useTransition } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { GameButton } from "@/shared/components/game/game-button";
import { GameField } from "@/shared/components/game/game-field";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Sticker } from "@/shared/components/game/sticker";
import { formatStickerNumber, type StickerPerson } from "@/shared/components/game/sticker-view";
import { updateMyCard } from "../actions/update-my-card";
import { CARD_LIMITS, updateMyCardSchema } from "../schemas";
import type { CardAudience, CardFields, MyCard } from "../types";

type FieldErrors = Partial<Record<keyof CardFields, string>>;

const COPY: Record<CardAudience, { title: string; lead: string }> = {
  teammate: {
    title: "Your sticker",
    lead: "Every new hire collects it. Takes a minute.",
  },
  "new-hire": {
    title: "Your card",
    lead: "Make your sticker. The next new hire will collect it.",
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
  const [pending, startTransition] = useTransition();

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
      gameToast("Saved");
    });
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-game-serif text-hero-md md:text-hero">{copy.title}</h1>
        <p className="max-w-130 text-game-muted text-lead">{copy.lead}</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-14 md:flex-row md:gap-10">
        <Sticker
          person={preview}
          size="lg"
          rot={-2}
          celebrateChanges={false}
          className="flex-none"
        />

        <GameBook as="div" className="w-full p-7 md:min-w-0 md:max-w-95 md:flex-1">
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
              {pending ? "Saving…" : "Save"}
            </GameButton>
          </form>
        </GameBook>
      </div>
    </>
  );
}
