"use client";

import { Tooltip } from "@inbeat/ui/components/tooltip";
import { InfoIcon } from "lucide-react";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { CardDetailLabel } from "@/shared/components/game/card-detail";
import { GameField } from "@/shared/components/game/game-field";
import { gameToast } from "@/shared/components/game/game-toaster";
import { collectSticker } from "../actions/collect-sticker";
import { type AutosaveStatus, useNoteAutosave } from "../hooks/use-note-autosave";
import type { CollectTarget } from "../queries/get-collect-target";
import { collectStickerSchema, NOTE_MAX } from "../schemas";

const STATUS_LINE: Partial<Record<AutosaveStatus, string>> = {
  saving: "Saving…",
  saved: "Saved",
};

type NotesProps = { target: CollectTarget };

type CollectNoteProps = NotesProps & {
  /** The form's id, so the card's action ("Collect sticker") can submit it from outside. */
  formId: string;
  onPendingChange: (pending: boolean) => void;
};

function NotesBlock({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-center gap-2 w-fit">
        <CardDetailLabel className="w-fit">Your notes</CardDetailLabel>
        <Tooltip content="Only you see this" side="top">
          <InfoIcon className="w-4 h-4" />
        </Tooltip>
      </div>

      {children}
    </div>
  );
}

/** Before collecting: the first note. Collecting is the card's action, outside this form. */
function CollectNote({ target, formId, onPendingChange }: CollectNoteProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => onPendingChange(pending), [pending, onPendingChange]);

  const collect = () => {
    const parsed = collectStickerSchema.safeParse({ personId: target.id, note });
    if (!parsed.success) {
      setError(parsed.error.issues.find((issue) => issue.path[0] === "note")?.message);
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await collectSticker(parsed.data);
      if (result.ok) gameToast(`New sticker unlocked: ${target.firstName}`, { tone: "unlock" });
      else gameToast(result.error);
    });
  };

  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        collect();
      }}
    >
      <NotesBlock>
        <GameField
          multiline
          hideLabel
          label={`Your notes on ${target.firstName}`}
          placeholder={`What did you learn about ${target.firstName}?`}
          rows={4}
          value={note}
          maxLength={NOTE_MAX}
          error={error}
          onChange={(event) => setNote(event.target.value)}
        />
      </NotesBlock>
    </form>
  );
}

/** After collecting: the same notes, saved as they are typed. */
function EditNote({ target }: NotesProps) {
  const [note, setNote] = useState(target.note ?? "");
  const autosave = useNoteAutosave(target.id, target.note ?? "");

  return (
    <NotesBlock>
      <GameField
        multiline
        hideLabel
        label={`Your notes on ${target.firstName}`}
        placeholder={`What did you learn about ${target.firstName}?`}
        rows={4}
        value={note}
        maxLength={NOTE_MAX}
        error={autosave.error}
        help={autosave.status && STATUS_LINE[autosave.status]}
        onChange={(event) => {
          setNote(event.target.value);
          autosave.change(event.target.value);
        }}
        onBlur={autosave.blur}
      />
    </NotesBlock>
  );
}

/**
 * The player's private notes on one teammate: written to collect, editable for good after. What
 * acts on the whole card, "Collect sticker" included, lives outside, beside neither column.
 */
export function StickerNotes({
  target,
  formId,
  onPendingChange,
}: NotesProps & Pick<CollectNoteProps, "formId" | "onPendingChange">) {
  if (target.collected) return <EditNote key={target.id} target={target} />;
  return (
    <CollectNote
      key={target.id}
      target={target}
      formId={formId}
      onPendingChange={onPendingChange}
    />
  );
}
