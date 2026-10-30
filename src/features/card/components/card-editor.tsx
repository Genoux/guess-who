"use client";

import { PencilIcon } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { GameButton } from "@/shared/components/game/game-button";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameField } from "@/shared/components/game/game-field";
import { gameToast } from "@/shared/components/game/game-toaster";
import { Sticker } from "@/shared/components/game/sticker";
import { formatStickerNumber, type StickerPerson } from "@/shared/components/game/sticker-view";
import { updateMyCard } from "../actions/update-my-card";
import { CARD_LIMITS, updateMyCardSchema } from "../schemas";
import type { CardAudience, CardFields, MyCard } from "../types";

type FieldErrors = Partial<Record<keyof CardFields, string>>;

const COPY: Record<CardAudience, { title: string; lead: string }> = {
  teammate: { title: "Your sticker", lead: "Every new hire collects it." },
  "new-hire": { title: "Your card", lead: "The next new hire will collect it." },
};

// Stand-ins so an empty card still previews as a sticker; team colors come from the teams table.
const EMPTY_TEAM = {
  name: "Your team",
  color: "var(--color-game-hover)",
  tint: "var(--color-game-sidebar)",
};

const SWITCH = "duration-slower ease-game motion-reduce:transition-none";

function toFieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof CardFields;
    errors[field] ??= issue.message;
  }
  return errors;
}

type CardEditorProps = {
  card: MyCard;
  /** Dev preview: the card is not saved. */
  preview?: boolean;
};

/** The sticker with an Edit button, or the sticker beside the form that fills it in. */
export function CardEditor({ card, preview = false }: CardEditorProps) {
  const [values, setValues] = useState(card.fields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editing, setEditing] = useState(() => !updateMyCardSchema.safeParse(card.fields).success);
  const [pending, startTransition] = useTransition();
  const switched = useRef(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const teamField = useRef<HTMLButtonElement>(null);

  // The clicked button goes inert with its state, so focus moves into the new one; never on load.
  useEffect(() => {
    if (switched.current)
      (editing ? teamField : editButton).current?.focus({ preventScroll: true });
  }, [editing]);

  const copy = COPY[card.audience];
  const team = card.teams.find((option) => option.id === values.teamId) ?? EMPTY_TEAM;
  const number = formatStickerNumber(card.stickerNumber);
  const sticker: StickerPerson = {
    name: card.name,
    number,
    team: team.name,
    color: team.color,
    tint: team.tint,
    city: values.location.trim() || "Your city",
    fact: values.fact.trim() || "Your random fact.",
    ask: values.ask.trim() || "What to ask you about",
    photoUrl: card.imageUrl,
  };

  const set = (field: keyof CardFields) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const switchTo = (edit: boolean) => {
    switched.current = true;
    setEditing(edit);
  };

  const saved = (fields: CardFields) => {
    setValues(fields);
    switchTo(false);
    gameToast("Saved");
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
      const result = preview
        ? ({ ok: true, data: parsed.data } as const)
        : await updateMyCard(parsed.data);
      if (!result.ok) {
        gameToast(result.errorId ? `${result.error} Ref ${result.errorId}` : result.error, {
          duration: 6000,
        });
        return;
      }
      saved(result.data);
    });
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-game-serif text-hero-md md:text-hero">{copy.title}</h1>
        <p className="max-w-130 text-game-muted text-lead">{copy.lead}</p>
      </div>

      {/* Side by side, the layout must not change between states, or the slide bends into a curve:
          the pair moves as one by half the form and gap, and only the form's opacity changes.
          On a phone, content-start stops the opening form row stretching the sticker's row. */}
      <div
        className={gameCn(
          "grid w-full grid-cols-[minmax(0,1fr)] content-start justify-center [--form:23.75rem] [--gap:2.5rem] transition-[translate,grid-template-rows] md:grid-cols-[auto_minmax(0,var(--form))] md:grid-rows-1 md:gap-x-(--gap)",
          SWITCH,
          editing
            ? "grid-rows-[auto_1fr]"
            : "grid-rows-[auto_0fr] md:translate-x-[calc((var(--form)+var(--gap))/2)]",
        )}
      >
        <Sticker
          person={sticker}
          size="lg"
          rot={-2}
          celebrateChanges={false}
          className="group justify-self-center"
          corner={
            // Shown on hover or keyboard focus; always on a touch screen, which has no hover.
            <div
              inert={editing}
              className={gameCn(
                "scale-90 opacity-0 transition-[opacity,scale] duration-fast ease-game motion-reduce:transition-none",
                !editing &&
                  "group-hover:scale-100 group-hover:opacity-100 group-has-[:focus-visible]:scale-100 group-has-[:focus-visible]:opacity-100 pointer-coarse:scale-100 pointer-coarse:opacity-100",
              )}
            >
              <GameButton
                ref={editButton}
                size="sm"
                className="[&_svg]:size-4"
                onClick={() => switchTo(true)}
              >
                <PencilIcon />
                Edit
              </GameButton>
            </div>
          }
        />

        <div
          inert={!editing}
          className={gameCn(
            "min-h-0 min-w-0 transition-opacity md:col-start-2 md:row-start-1 md:self-center",
            SWITCH,
            !editing && "opacity-0",
          )}
        >
          <div className="pt-14 md:pt-0">
            <GameBook as="div" className="w-full p-7">
              <form noValidate onSubmit={submit} className="flex w-full flex-col gap-4.5">
                <div className="grid w-full grid-cols-2 gap-3">
                  <GameField
                    ref={teamField}
                    label="Team"
                    name="teamId"
                    options={card.teams.map((option) => ({
                      value: option.id,
                      label: option.name,
                      color: option.color,
                    }))}
                    placeholder="Pick one"
                    value={values.teamId}
                    onValueChange={(teamId) => set("teamId")({ target: { value: teamId } })}
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
                {/* The view switches a moment before the save stops pending, so the button keeps
                    its saving look while the form fades out instead of flashing back on. */}
                <GameButton type="submit" className="w-full" disabled={pending || !editing}>
                  {pending || !editing ? "Saving…" : "Save"}
                </GameButton>
              </form>
            </GameBook>
          </div>
        </div>
      </div>
    </>
  );
}
