"use client";

import { GameModal } from "./game-modal";
import { GameModalActions } from "./game-modal-actions";

type SaveAnywayDialogProps = {
  open: boolean;
  title: string;
  description: string;
  /** Closes without saving, which is also what Escape and the backdrop do. */
  onKeepEditing: () => void;
  onSave: () => void;
};

/** Asks before a save that leaves something unfinished. */
export function SaveAnywayDialog({
  open,
  title,
  description,
  onKeepEditing,
  onSave,
}: SaveAnywayDialogProps) {
  return (
    <GameModal
      open={open}
      onOpenChange={(next) => !next && onKeepEditing()}
      title={title}
      description={description}
    >
      <GameModalActions
        secondary={{ label: "Keep editing", onClick: onKeepEditing }}
        primary={{ label: "Save anyway", onClick: onSave }}
      />
    </GameModal>
  );
}
