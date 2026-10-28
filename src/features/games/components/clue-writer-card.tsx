"use client";

import { ClueCard } from "@/shared/components/game/clue-card";
import { gameCn } from "@/shared/components/game/game-cn";
import { CLUE_MAX } from "../schemas";

type ClueWriterCardProps = {
  number: number;
  value: string;
  placeholder: string;
  /** Shown as the player will read it, not editable: clue 1, or a clue that already landed. */
  locked: boolean;
  onChange: (value: string) => void;
};

/** The player's clue card, wide enough to write on, with the welcomer's text field on its face. */
export function ClueWriterCard({
  number,
  value,
  placeholder,
  locked,
  onChange,
}: ClueWriterCardProps) {
  const label = `Clue ${number}`;
  return (
    <ClueCard
      state="up"
      size="lg"
      label={label}
      rot={-1}
      className={gameCn(
        "h-80 w-140 max-w-full rounded-card-lg",
        locked && "cursor-default select-none",
      )}
      text={
        locked ? (
          value || <span className="text-game-ink/45">{placeholder}</span>
        ) : (
          <textarea
            aria-label={label}
            className="size-full resize-none bg-transparent outline-none placeholder:text-game-ink/45"
            value={value}
            placeholder={placeholder}
            maxLength={CLUE_MAX}
            onChange={(event) => onChange(event.target.value)}
          />
        )
      }
    />
  );
}
