"use client";

import { GameModal } from "@/shared/components/game/game-modal";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { firstName } from "../lib/first-name";
import type { NoMissionRowView } from "../lib/people-view";

type SetNewHireDialogProps = {
  /** The person to flag; the dialog is open while it is set. */
  row: NoMissionRowView | null;
  onConfirm: (row: NoMissionRowView) => void;
  onClose: () => void;
};

export function SetNewHireDialog({ row, onConfirm, onClose }: SetNewHireDialogProps) {
  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Set ${row ? firstName(row.name ?? row.email) : ""} as a new hire?`}
      description="Their card and clues are hidden until they finish a mission."
    >
      <GameModalActions
        secondary={{ label: "Cancel", onClick: onClose }}
        primary={{ label: "Set as new hire", onClick: () => row && onConfirm(row) }}
      />
    </GameModal>
  );
}
