"use client";

import { type FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { CARD_LIMITS, hasOwnCardFields, isCardComplete } from "@/entities/card";
import { GameBook } from "@/shared/components/game/game-book";
import { GameButton } from "@/shared/components/game/game-button";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameField } from "@/shared/components/game/game-field";
import { gameToast } from "@/shared/components/game/game-toaster";
import { SaveAnywayDialog } from "@/shared/components/game/save-anyway-dialog";
import { Sticker } from "@/shared/components/game/sticker";
import { formatStickerNumber, type StickerPerson } from "@/shared/components/game/sticker-view";
import { updateMyCard } from "../actions/update-my-card";
import { type UpdateMyCardInput, updateMyCardSchema } from "../schemas";
import type { CardAudience, CardFields, MyCard } from "../types";

type EditableField = keyof UpdateMyCardInput;
type FieldErrors = Partial<Record<EditableField, string>>;

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

// Radix Select refuses an empty item value, so clearing the team goes through a sentinel.
const NO_TEAM = "none";

const SWITCH = "duration-slower ease-game motion-reduce:transition-none";

function toFieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as EditableField;
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
  const [editing, setEditing] = useState(() => !isCardComplete(card.fields));
  const [incompleteCard, setIncompleteCard] = useState<UpdateMyCardInput | null>(null);
  const [pending, startTransition] = useTransition();
  const [askFocused, setAskFocused] = useState(false);
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

  const set = (field: EditableField) => (value: string) => {
    const next = field === "teamId" && value === NO_TEAM ? null : value;
    setValues((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const setText = (field: "fact" | "ask") => (event: { target: { value: string } }) =>
    set(field)(event.target.value);

  const switchTo = (edit: boolean) => {
    switched.current = true;
    setEditing(edit);
  };

  // An incomplete card stays open for editing, as it does on load.
  const saved = (fields: CardFields) => {
    setValues(fields);
    if (isCardComplete(fields)) switchTo(false);
    gameToast("Saved");
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateMyCardSchema.safeParse({
      teamId: values.teamId,
      fact: values.fact,
      ask: values.ask,
    });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    // Only what the person can fix asks first; a location missing from Deel is shown in the form.
    if (hasOwnCardFields(parsed.data)) save(parsed.data);
    else setIncompleteCard(parsed.data);
  }

  function save(input: UpdateMyCardInput) {
    startTransition(async () => {
      const result = preview
        ? ({ ok: true, data: { ...values, ...input } } as const)
        : await updateMyCard(input);
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
          "@container grid w-full grid-cols-[minmax(0,1fr)] content-start justify-center [--form:23.75rem] [--gap:2.5rem] transition-[translate,grid-template-rows] md:grid-cols-[auto_minmax(0,var(--form))] md:grid-rows-1 md:gap-x-(--gap)",
          SWITCH,
          editing
            ? "grid-rows-[auto_1fr]"
            : "grid-rows-[auto_0fr] md:translate-x-[calc((var(--form)+var(--gap))/2)]",
        )}
      >
        <div className="zoom-open justify-self-center">
          <Sticker
            person={sticker}
            size="sm"
            expanded
            rot={-2}
            celebrateChanges={false}
            askToggle
            askRevealed={askFocused}
            centerActionEnabled={!editing}
            centerAction={
              <GameButton
                ref={editButton}
                variant="light"
                size="sm"
                className="shadow-none hover:shadow-none"
                onClick={() => switchTo(true)}
              >
                Edit
              </GameButton>
            }
          />
        </div>

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
                {!values.location && (
                  <p className="text-game-muted text-small">
                    Your location isn't set yet. Ask People Strategy.
                  </p>
                )}
                <GameField
                  ref={teamField}
                  label="Team"
                  name="teamId"
                  options={[
                    { value: NO_TEAM, label: "No team" },
                    ...card.teams.map((option) => ({
                      value: option.id,
                      label: option.name,
                      color: option.color,
                    })),
                  ]}
                  placeholder="Pick one"
                  value={values.teamId ?? ""}
                  onValueChange={set("teamId")}
                  error={errors.teamId}
                />
                <GameField
                  label="Random fact"
                  name="fact"
                  multiline
                  maxLength={CARD_LIMITS.fact}
                  showCount
                  value={values.fact}
                  onChange={setText("fact")}
                  error={errors.fact}
                />
                <GameField
                  label="Ask me about"
                  name="ask"
                  multiline
                  maxLength={CARD_LIMITS.ask}
                  showCount
                  value={values.ask}
                  onFocus={() => setAskFocused(true)}
                  onBlur={() => setAskFocused(false)}
                  onChange={setText("ask")}
                  error={errors.ask}
                />
                <p className="text-game-muted text-small">Name and location come from Deel.</p>
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

      <SaveAnywayDialog
        open={incompleteCard !== null}
        title="Save incomplete card?"
        description="It won't show in the album until every field is filled in. Anyone who collected it will lose it until then."
        onKeepEditing={() => setIncompleteCard(null)}
        onSave={() => {
          setIncompleteCard(null);
          if (incompleteCard) save(incompleteCard);
        }}
      />
    </>
  );
}
