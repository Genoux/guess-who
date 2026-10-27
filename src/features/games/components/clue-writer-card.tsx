"use client";

import { useId } from "react";
import { ClueCard } from "@/shared/components/game/clue-card";
import { gameCn } from "@/shared/components/game/game-cn";
import { CLUE_MAX } from "../schemas";

type ClueWriterCardProps = {
  number: number;
  value: string;
  placeholder: string;
  /** Shown as the player will read it, not editable: clue 1, or a clue that already landed. */
  locked: boolean;
  error?: string;
  onChange: (value: string) => void;
};

/** The player's clue card, wide enough to write on, with the welcomer's text field on its face. */
export function ClueWriterCard({
  number,
  value,
  placeholder,
  locked,
  error,
  onChange,
}: ClueWriterCardProps) {
  const errorId = useId();
  const label = `Clue ${number}`;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ClueCard
        state="up"
        size="lg"
        label={label}
        rot={-1}
        className={gameCn(
          "h-80 w-140 max-w-full rounded-card-lg focus-within:outline-2 focus-within:outline-game-found focus-within:outline-offset-3",
          locked && "cursor-default select-none",
        )}
        text={
          locked ? (
            value || <span className="text-game-ink/45">{placeholder}</span>
          ) : (
            <textarea
              aria-label={label}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="size-full resize-none bg-transparent outline-none placeholder:text-game-ink/45"
              value={value}
              placeholder={placeholder}
              maxLength={CLUE_MAX}
              onChange={(event) => onChange(event.target.value)}
            />
          )
        }
      />
      {error ? (
        <span id={errorId} role="alert" className="font-medium text-game-error text-small">
          {error}
        </span>
      ) : null}
    </div>
  );
}
