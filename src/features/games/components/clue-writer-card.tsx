"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

const WRITER_TEXT_STEPS = [
  "text-clue-lg",
  "text-name-lg",
  "text-clue",
  "text-heading",
  "text-quote",
  "text-small",
];

/**
 * The card is a fixed box whose width follows the screen, so the text steps down a size until it
 * fits: a clue is never scrolled or clipped. Measured, not guessed from the length, because the
 * same clue wraps differently on a phone.
 */
function useFittedTextStep<FittedElement extends HTMLElement>(value: string) {
  const fittedRef = useRef<FittedElement>(null);
  const [fit, setFit] = useState({ value, step: 0 });
  const step = fit.value === value ? fit.step : 0;

  useLayoutEffect(() => {
    const fitted = fittedRef.current;
    if (!fitted || step === WRITER_TEXT_STEPS.length - 1) return;
    if (fitted.scrollHeight > fitted.clientHeight) setFit({ value, step: step + 1 });
  }, [value, step]);

  return { fittedRef, textClassName: WRITER_TEXT_STEPS[step] };
}

/** The player's clue card, wide enough to write on, with the welcomer's text field on its face. */
export function ClueWriterCard({
  number,
  value,
  placeholder,
  locked,
  onChange,
}: ClueWriterCardProps) {
  const label = `Clue ${number}`;
  const lockedFit = useFittedTextStep<HTMLDivElement>(value);
  const fieldFit = useFittedTextStep<HTMLTextAreaElement>(value);
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
          <div
            ref={lockedFit.fittedRef}
            className={gameCn("size-full overflow-hidden", lockedFit.textClassName)}
          >
            {value || <span className="text-game-ink/45">{placeholder}</span>}
          </div>
        ) : (
          <textarea
            ref={fieldFit.fittedRef}
            aria-label={label}
            className={gameCn(
              "size-full resize-none bg-transparent outline-none placeholder:text-game-ink/45",
              fieldFit.textClassName,
            )}
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
