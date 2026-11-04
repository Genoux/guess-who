"use client";

import { GameModal } from "@/shared/components/game/game-modal";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { firstName } from "../lib/first-name";
import type { NoMissionRowView } from "../lib/people-view";

type StartNewHireDialogProps = {
  /** The person to start; the dialog is open while it is set. */
  row: NoMissionRowView | null;
  onConfirm: (row: NoMissionRowView) => void;
  onClose: () => void;
};

export function StartNewHireDialog({ row, onConfirm, onClose }: StartNewHireDialogProps) {
  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Start ${row ? firstName(row.name ?? row.email) : ""} as a new hire?`}
      description="Their mission starts now. Their card and clues are hidden until it ends."
    >
      <GameModalActions
        secondary={{ label: "Cancel", onClick: onClose }}
        primary={{ label: "Start mission", onClick: () => row && onConfirm(row) }}
      />
    </GameModal>
  );
}
