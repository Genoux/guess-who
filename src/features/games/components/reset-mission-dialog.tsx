"use client";

import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { firstName } from "../lib/first-name";
import type { DoneRowView } from "../lib/people-view";

type ResetMissionDialogProps = {
  /** The finished mission to reset; the dialog is open while it is set. */
  row: DoneRowView | null;
  /** Resets it: the person moves to No mission at once, and the dialog closes. */
  onReset: (row: DoneRowView) => void;
  onClose: () => void;
};

/** Keeping the mission is the button and resetting it the quiet link, so a stray Enter changes nothing. */
export function ResetMissionDialog({ row, onReset, onClose }: ResetMissionDialogProps) {
  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Reset ${row ? firstName(row.name ?? row.email) : ""}'s mission?`}
      description="Their finished mission is erased. Their album stays. They can play again once their card and clues are done."
    >
      <div className="flex w-full flex-col items-center gap-4">
        <GameButton className="w-full" onClick={onClose}>
          Keep it
        </GameButton>
        <GameButton variant="link" onClick={() => row && onReset(row)}>
          Reset mission
        </GameButton>
      </div>
    </GameModal>
  );
}
