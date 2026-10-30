"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { GameField } from "@/shared/components/game/game-field";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { addNewHireSchema } from "../schemas";

const ADD_HELP =
  "They'll get a Mission tab when they sign in with Slack and can start right away. Their card and clues come after.";
const CHANGE_HELP = "Use the email their Slack account uses.";

type NewHireEmailFormProps = {
  /** The invite whose email is being fixed; a new hire is added when absent. */
  invite?: { gameId: string; email: string };
  /** The email, once it looks right; the page moves the person at once and reports a refusal. */
  onSubmit: (email: string) => void;
  onCancel: () => void;
};

/** Adds a new hire by email, or fixes the email of an invite until they sign in. */
export function NewHireEmailForm({ invite, onSubmit, onCancel }: NewHireEmailFormProps) {
  const [email, setEmail] = useState(invite?.email ?? "");
  const [error, setError] = useState<string>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = addNewHireSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    onSubmit(parsed.data.email);
  }

  return (
    <form noValidate onSubmit={submit} className="flex w-full flex-col gap-6">
      <GameField
        label="Email"
        type="email"
        name="email"
        autoComplete="off"
        placeholder="name@inbeat.agency"
        value={email}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setEmail(event.target.value);
          setError(undefined);
        }}
        error={error}
        help={error ? undefined : invite ? CHANGE_HELP : ADD_HELP}
      />
      <GameModalActions
        secondary={{ label: "Cancel", onClick: onCancel }}
        primary={{ label: invite ? "Save" : "Add", type: "submit" }}
      />
    </form>
  );
}
