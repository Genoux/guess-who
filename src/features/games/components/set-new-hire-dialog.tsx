"use client";

import { GameModal } from "@/shared/components/game/game-modal";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { firstName } from "../lib/first-name";
import type { NoMissionRowView } from "../lib/people-view";

type SetNewHireDialogProps = {
  /** The person being made a new hire; the dialog is open while it is set. */
  row: NoMissionRowView | null;
  /** Start their mission now, or only flag them as a new hire. Closing the dialog changes nothing. */
  onChoose: (row: NoMissionRowView, startMission: boolean) => void;
  onClose: () => void;
};

export function SetNewHireDialog({ row, onChoose, onClose }: SetNewHireDialogProps) {
  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Start ${row ? firstName(row.name ?? row.email) : ""}'s mission now?`}
      description="They're a new hire either way."
    >
      <GameModalActions
        secondary={{ label: "Not yet", onClick: () => row && onChoose(row, false) }}
        primary={{ label: "Start mission", onClick: () => row && onChoose(row, true) }}
      />
    </GameModal>
  );
}
