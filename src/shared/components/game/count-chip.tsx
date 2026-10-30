import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { gameCn } from "./game-cn";

const countChipVariants = cva(
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full font-medium",
  {
    variants: {
      variant: {
        default: "bg-game-sidebar text-game-ink",
        /** On the page background, where the sidebar grey all but disappears. */
        soft: "bg-game-ink/6 text-game-ink",
        yellow: "bg-game-shortlist text-game-ink",
        dark: "bg-game-ink-soft text-white",
        /** A mission accomplished, in the found orange. */
        found: "bg-game-found/14 text-game-error",
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        sm: "h-8 px-3.5 text-small",
        /** Inside a tab or a line of text, where sm would crowd it. */
        /** In a list row, at the row's own text size. */
        row: "h-6 px-2.5 text-xs",
        xs: "h-6 px-2 text-xs tabular-nums",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type CountChipProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof countChipVariants> & {
    children: ReactNode;
    /** Team or status dot before the text (a CSS color from data). */
    dotColor?: string;
  };

/** Small pill for counts and status: "5 / 20", "No. 21 · Talent", "8 days left". */
export function CountChip({
  variant,
  size,
  children,
  dotColor,
  className,
  ...props
}: CountChipProps) {
  return (
    <span className={gameCn(countChipVariants({ variant, size }), className)} {...props}>
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
