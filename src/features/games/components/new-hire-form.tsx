"use client";

import { type Fail, ok, type Result } from "@inbeat/core/result";
import { CheckIcon, CircleAlertIcon, ShuffleIcon } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState, useTransition } from "react";
import { GameButton } from "@/shared/components/game/game-button";
import { GameDateField } from "@/shared/components/game/game-date-field";
import { GameField } from "@/shared/components/game/game-field";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { GameTooltip } from "@/shared/components/game/game-tooltip";
import { createNewHire } from "../actions/create-new-hire";
import { updateNewHire } from "../actions/update-new-hire";
import { nextMonday, pickAnotherWelcomer } from "../lib/new-hire-progress";
import type { NewHireRowView } from "../lib/new-hire-view";
import { createNewHireSchema } from "../schemas";

type FormErrors = { email?: string; startDate?: string; form?: string };

export type SavedNewHire = { message: string; gameId?: string };

const EMAIL_HELP = "The one their Slack account uses. A personal email works too.";
const PREVIEW_WELCOMER = "Ana Ferreira";

function toFieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: FormErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof FormErrors;
    errors[field] ??= issue.message;
  }
  return errors;
}

function toServerErrors({ error, code, errorId }: Fail): FormErrors {
  if (code === "conflict") return { email: error };
  if (code === "validation") return { startDate: error };
  return { form: errorId ? `${error} Ref ${errorId}` : error };
}

type NewHireFormProps = {
  /** The game being edited; a new hire when absent. */
  row?: NewHireRowView;
  today: string;
  /** Dev preview: nothing is saved. */
  preview: boolean;
  onSaved: (saved: SavedNewHire) => void;
  onCancel: () => void;
  onRemove: (row: NewHireRowView) => void;
};

/** Email and first day: adds a new hire, or fixes a game until the new hire signs in. */
export function NewHireForm({
  row,
  today,
  preview,
  onSaved,
  onCancel,
  onRemove,
}: NewHireFormProps) {
  const [email, setEmail] = useState(row?.email ?? "");
  const [startDate, setStartDate] = useState(row?.startDate ?? nextMonday(today));
  const [welcomerId, setWelcomerId] = useState(row?.welcomer.id ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, startTransition] = useTransition();

  const welcomerOptions = row?.welcomerOptions ?? [];
  const welcomerChanged = row !== undefined && welcomerId !== row.welcomer.id;
  const another = pickAnotherWelcomer(welcomerOptions, welcomerId);

  async function save(values: { email: string; startDate: string }): Promise<Result<SavedNewHire>> {
    if (row) {
      const result = preview
        ? ok()
        : await updateNewHire({
            gameId: row.id,
            ...values,
            ...(welcomerChanged && { welcomerPersonId: welcomerId }),
          });
      return result.ok ? ok({ message: "Saved." }) : result;
    }
    const result = preview
      ? ok({ gameId: undefined, welcomerName: PREVIEW_WELCOMER })
      : await createNewHire(values);
    return result.ok
      ? ok({
          message: `Added. ${result.data.welcomerName} is their secret welcomer.`,
          gameId: result.data.gameId,
        })
      : result;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createNewHireSchema.safeParse({ email, startDate });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await save(parsed.data);
      if (!result.ok) {
        setErrors(toServerErrors(result));
        return;
      }
      onSaved(result.data);
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4.5">
        <GameField
          label="Email"
          type="email"
          name="email"
          autoComplete="off"
          placeholder="name@inbeat.agency"
          value={email}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          disabled={row !== undefined && !row.emailEditable}
          error={errors.email}
          help={
            row && !row.emailEditable
              ? "Locked once they've signed in."
              : errors.email
                ? undefined
                : EMAIL_HELP
          }
        />
        <GameDateField
          label="First day"
          name="startDate"
          value={startDate}
          min={row?.started ? undefined : today}
          disabled={row?.started}
          onValueChange={(day) => {
            setStartDate(day);
            setErrors((current) => ({ ...current, startDate: undefined }));
          }}
          error={errors.startDate}
          help={row?.started ? "Locked once the game has started." : undefined}
        />
        {row ? (
          <div className="flex items-start gap-3">
            <GameField
              className="flex-1"
              label="Secret welcomer"
              name="welcomerPersonId"
              options={welcomerOptions.map(({ id, name, team, color }) => ({
                value: id,
                label: team ? `${name} · ${team}` : name,
                color: color ?? undefined,
              }))}
              value={welcomerId}
              disabled={row.started}
              onValueChange={setWelcomerId}
              help={row.started ? "Locked once the game has started." : undefined}
            />
            <GameTooltip label="Pick another at random" side="top">
              <GameButton
                variant="light"
                size="round-sm"
                className="mt-7.5"
                aria-label="Pick another welcomer at random"
                disabled={row.started || !another}
                onClick={() => another && setWelcomerId(another.id)}
              >
                <ShuffleIcon aria-hidden />
              </GameButton>
            </GameTooltip>
          </div>
        ) : (
          <p className="flex items-start gap-2.5 rounded-field bg-game-bg px-4 py-3.5 text-left text-game-ink-soft text-button-sm">
            <CheckIcon aria-hidden className="mt-0.5 size-4.5 flex-none" />
            We pick their secret welcomer at random and tell them in Slack.
          </p>
        )}
        {errors.form ? (
          <span
            role="alert"
            className="flex items-center gap-1.5 text-left font-medium text-game-error text-small"
          >
            <CircleAlertIcon aria-hidden className="size-4 flex-none" />
            {errors.form}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-5">
        <GameModalActions
          secondary={{ label: "Cancel", onClick: onCancel }}
          primary={{ label: row ? "Save" : "Add new hire", type: "submit", disabled: pending }}
        />
        {row && !row.started ? (
          <GameButton variant="link" onClick={() => onRemove(row)}>
            Remove this game
          </GameButton>
        ) : null}
      </div>
    </form>
  );
}
