"use client";

import { GameAvatar } from "@/shared/components/game/game-avatar";
import { GameModal } from "@/shared/components/game/game-modal";
import type { MissingTeammate } from "../lib/new-hire-view";

const AVATAR_COLOR = "#edede8";

type MissingCluesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missing: readonly MissingTeammate[];
};

/** Who cannot be picked as a welcomer yet, and what stops them. */
export function MissingCluesDialog({ open, onOpenChange, missing }: MissingCluesDialogProps) {
  return (
    <GameModal
      open={open}
      onOpenChange={onOpenChange}
      title="Missing clues"
      description="They can't be picked as a secret welcomer until their card and clues are done."
    >
      <ul className="flex w-full flex-col gap-1 text-left">
        {missing.map((teammate) => (
          <li key={teammate.id} className="flex items-center gap-3 rounded-game-lg px-1 py-2">
            <GameAvatar name={teammate.name} color={AVATAR_COLOR} className="flex-none" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2">
                <span title={teammate.name} className="truncate font-medium">
                  {teammate.name}
                </span>
                {teammate.color ? (
                  <span
                    aria-hidden
                    className="size-2 flex-none rounded-full"
                    style={{ backgroundColor: teammate.color }}
                  />
                ) : null}
              </span>
              <span title={teammate.email} className="truncate text-game-muted text-small">
                {teammate.email}
              </span>
            </div>
            <span className="flex-none whitespace-nowrap text-game-muted text-small">
              {teammate.label}
            </span>
          </li>
        ))}
      </ul>
    </GameModal>
  );
}
