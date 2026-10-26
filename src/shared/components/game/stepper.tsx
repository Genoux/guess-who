import { cva } from "class-variance-authority";
import { gameCn } from "./game-cn";

type StepperProps = {
  /** Number of dots. */
  count: number;
  /** Current step, 1-based. */
  current: number;
  /** Light dots on the game background, or grey and yellow on ink. */
  tone?: "light" | "dark";
  /** Fill every dot up to the current one (progress), not only the current one (step). */
  cumulative?: boolean;
  /** Accessible text; defaults to "Step 2 of 4". */
  label?: string;
  className?: string;
};

const dotVariants = cva(
  "h-2 rounded-full transition-[width,background-color] duration-fast ease-game motion-reduce:transition-none",
  {
    variants: {
      tone: { light: "", dark: "" },
      on: { true: "w-6", false: "w-2" },
    },
    compoundVariants: [
      { tone: "light", on: true, className: "bg-game-ink" },
      { tone: "light", on: false, className: "bg-game-border" },
      { tone: "dark", on: true, className: "bg-game-shortlist" },
      { tone: "dark", on: false, className: "bg-game-ink-dots" },
    ],
  },
);

/** Dots for onboarding steps, the clue writer and clue progress. */
export function Stepper({
  count,
  current,
  tone = "light",
  cumulative = false,
  label,
  className,
}: StepperProps) {
  return (
    <div
      role="img"
      aria-label={label ?? `Step ${current} of ${count}`}
      className={gameCn("flex justify-center gap-2", className)}
    >
      {Array.from({ length: count }, (_, index) => {
        const step = index + 1;
        const on = cumulative ? step <= current : step === current;
        return <span key={step} className={dotVariants({ tone, on })} />;
      })}
    </div>
  );
}
