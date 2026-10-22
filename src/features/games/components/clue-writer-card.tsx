"use client";

import { LockIcon } from "lucide-react";
import { useId } from "react";
import { gameCn } from "@/shared/components/game/game-cn";
import { CLUE_MAX } from "../schemas";

type ClueWriterCardProps = {
  number: number;
  caption: string;
  value: string;
  placeholder: string;
  /** Landed with the player: shown, not editable. */
  locked: boolean;
  error?: string;
  onChange: (value: string) => void;
};

/** The big yellow card the welcomer writes one clue on. */
export function ClueWriterCard({
  number,
  caption,
  value,
  placeholder,
  locked,
  error,
  onChange,
}: ClueWriterCardProps) {
  const errorId = useId();
  return (
    <div className="flex w-140 max-w-full flex-col items-center gap-3">
      <label
        className={gameCn(
          "flex min-h-70 w-full -rotate-1 flex-col gap-4 rounded-card-lg border border-game-card-edge bg-game-shortlist p-7 text-left text-game-ink shadow-[6px_6px_0_var(--color-game-ink)] focus-within:shadow-[6px_6px_0_var(--color-game-ink),0_0_0_3px_var(--color-game-ink)] motion-reduce:rotate-0",
          locked && "bg-game-shortlist-soft",
        )}
      >
        <span className="flex items-center gap-2 font-game-mono text-caption uppercase">
          {locked ? <LockIcon aria-hidden className="size-3.5" /> : null}
          {caption}
        </span>
        <textarea
          aria-label={`Clue ${number}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-h-38 w-full flex-1 resize-none bg-transparent font-game-serif text-clue-lg text-game-ink outline-none placeholder:text-game-ink/45 read-only:cursor-default"
          value={value}
          placeholder={placeholder}
          maxLength={CLUE_MAX}
          readOnly={locked}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {error ? (
        <span id={errorId} role="alert" className="font-medium text-game-error text-small">
          {error}
        </span>
      ) : null}
    </div>
  );
}
