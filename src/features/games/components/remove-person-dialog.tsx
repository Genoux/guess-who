"use client";

import { GameModal } from "@/shared/components/game/game-modal";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { firstName } from "../lib/first-name";
import type { PersonIdentity } from "../lib/people-view";

type RemovePersonDialogProps = {
  /** The person to remove; the dialog is open while it is set. */
  row: PersonIdentity | null;
  onConfirm: (row: PersonIdentity) => void;
  onClose: () => void;
};

export function RemovePersonDialog({ row, onConfirm, onClose }: RemovePersonDialogProps) {
  const fresh = row?.signedIn ? " They can sign in again and start fresh." : "";
  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Remove ${row ? firstName(row.name ?? row.email) : ""}?`}
      description={`Their card, clues, album and notes are deleted, and their sticker leaves everyone's album.${fresh}`}
    >
      <GameModalActions
        secondary={{ label: "Cancel", onClick: onClose }}
        primary={{ label: "Remove", onClick: () => row && onConfirm(row) }}
      />
    </GameModal>
  );
}
