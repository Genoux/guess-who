"use client";

import { ok, type Result } from "@inbeat/core/result";
import { CircleAlertIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { GameModal } from "@/shared/components/game/game-modal";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { removeNewHire } from "../actions/remove-new-hire";
import type { NewHireRowView } from "../lib/new-hire-view";

type RemoveNewHireDialogProps = {
  /** The game to remove; the dialog is open while it is set. */
  row: NewHireRowView | null;
  /** Dev preview: nothing is removed. */
  preview: boolean;
  onRemoved: () => void;
  onClose: () => void;
};

export function RemoveNewHireDialog({
  row,
  preview,
  onRemoved,
  onClose,
}: RemoveNewHireDialogProps) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove(target: NewHireRowView) {
    startTransition(async () => {
      const result: Result = preview ? ok() : await removeNewHire({ gameId: target.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onRemoved();
    });
  }

  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(undefined);
          onClose();
        }
      }}
      title="Remove this game?"
      description={`${row?.name ?? row?.email} won't get a game, and nobody gets a message.`}
    >
      {error ? (
        <span
          role="alert"
          className="flex w-full items-center justify-center gap-1.5 font-medium text-game-error text-small"
        >
          <CircleAlertIcon aria-hidden className="size-4 flex-none" />
          {error}
        </span>
      ) : null}
      <GameModalActions
        secondary={{ label: "Keep it", onClick: onClose }}
        primary={{ label: "Remove", disabled: pending, onClick: () => row && remove(row) }}
      />
    </GameModal>
  );
}
