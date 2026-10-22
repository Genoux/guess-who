import { cva } from "class-variance-authority";
import { gameCn } from "./game-cn";

type CardSize = "sm" | "lg";

const RADIUS: Record<CardSize, string> = { sm: "rounded-card", lg: "rounded-card-lg" };

/** The card look every sticker and clue shares: the ink edge, the corner and the hard shadow. */
export const cardSurfaceVariants = cva("border-2 border-game-card-edge", {
  variants: {
    size: RADIUS,
    shadow: { none: "", ink: "shadow-ink" },
  },
  defaultVariants: { size: "sm", shadow: "none" },
});

// Tilt drives `--shadow-x`/`--shadow-y` (the offset) and `--lift` (0 to 1): at rest the shadow
// hides under the card, and it fades in over the first quarter of the slide so it never fringes
// the edge at rest.
const SHADOW_MOTION =
  "[translate:var(--shadow-x,0px)_var(--shadow-y,0px)] [opacity:calc(var(--lift,0)*4)]";

/**
 * The hover shadow of a sticker, which tilts and is always clickable: a solid card-shaped layer
 * placed before the card in a positioned parent.
 * Not a box-shadow: it would share the border's outer edge, and Firefox antialiases the two
 * separately, so a tilted card shows a light seam between them.
 */
export function CardBacking({ size }: { size: CardSize }) {
  return (
    <span
      aria-hidden
      className={gameCn(
        "pointer-events-none absolute inset-0 bg-game-card-edge",
        SHADOW_MOTION,
        RADIUS[size],
      )}
    />
  );
}
