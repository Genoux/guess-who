import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { gameCn } from "./game-cn";

const countChipVariants = cva(
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full font-medium",
  {
    variants: {
      variant: {
        default: "bg-game-sidebar text-game-ink",
        /** On the page background, where the sidebar grey all but disappears. */
        surface: "bg-game-surface text-game-ink shadow-edge-strong",
        yellow: "bg-game-shortlist text-game-ink",
        dark: "bg-game-ink-soft text-white",
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        sm: "h-8 px-3.5 text-small",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type CountChipProps = VariantProps<typeof countChipVariants> & {
  children: ReactNode;
  /** Team or status dot before the text (a CSS color from data). */
  dotColor?: string;
  className?: string;
};

/** Small pill for counts and status: "5 / 20", "No. 21 · Talent", "8 days left". */
export function CountChip({ variant, size, children, dotColor, className }: CountChipProps) {
  return (
    <span className={gameCn(countChipVariants({ variant, size }), className)}>
      {dotColor ? (
        <span
          aria-hidden
          className="size-2 flex-none rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}
