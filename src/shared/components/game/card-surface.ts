import { cva } from "class-variance-authority";

/** The card look every sticker and clue shares: the ink edge, the corner and the hard shadow. */
export const cardSurfaceVariants = cva("border border-game-card-edge", {
  variants: {
    size: { sm: "rounded-card", lg: "rounded-card-lg" },
    shadow: {
      none: "",
      ink: "shadow-ink",
      maybe: "shadow-ink-maybe",
      // The edge takes the shadow's color, so the card reads as one solid block.
      found: "border-game-found shadow-ink-found",
    },
  },
  defaultVariants: { size: "sm", shadow: "none" },
});

export type CardShadow = "none" | "ink" | "maybe" | "found";
