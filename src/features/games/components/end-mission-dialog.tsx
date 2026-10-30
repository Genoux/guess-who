"use client";

import { GameButton } from "@/shared/components/game/game-button";
import { GameModal } from "@/shared/components/game/game-modal";
import { firstName } from "../lib/first-name";
import type { PlayingRowView } from "../lib/people-view";

type EndMissionDialogProps = {
  /** The running mission to end; the dialog is open while it is set. */
  row: PlayingRowView | null;
  /** Ends it: the person moves to No mission at once, and the dialog closes. */
  onEnd: (row: PlayingRowView) => void;
  onClose: () => void;
};

/** Keeping the mission is the button and ending it the quiet link, so a stray Enter changes nothing. */
export function EndMissionDialog({ row, onEnd, onClose }: EndMissionDialogProps) {
  return (
    <GameModal
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`End ${row ? firstName(row.name ?? row.email) : ""}'s mission?`}
      description="Their welcomer and guesses are reset. Their album stays."
    >
      <div className="flex w-full flex-col items-center gap-4">
        <GameButton className="w-full" onClick={onClose}>
          Keep playing
        </GameButton>
        <GameButton variant="link" onClick={() => row && onEnd(row)}>
          End mission
        </GameButton>
      </div>
    </GameModal>
  );
}
