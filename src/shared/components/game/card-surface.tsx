import { cva } from "class-variance-authority";
import { gameCn } from "./game-cn";

type CardSize = "sm" | "lg";

const RADIUS: Record<CardSize, string> = { sm: "rounded-card", lg: "rounded-card-lg" };

type CardEdge = "ink" | "found";

const EDGE_FILL: Record<CardEdge, string> = { ink: "bg-game-card-edge", found: "bg-game-found" };

/** The card look every sticker and clue shares: the ink edge and the corner. */
export const cardSurfaceVariants = cva("border-2", {
  variants: {
    size: RADIUS,
    edge: { ink: "border-game-card-edge", found: "border-game-found" },
  },
  defaultVariants: { size: "sm", edge: "ink" },
});

// Tilt drives `--shadow-x`/`--shadow-y` (the offset) and `--lift` (0 to 1): at rest the shadow
// hides under the card, and it fades in over the first quarter of the slide so it never fringes
// the edge at rest.
const SHADOW_MOTION =
  "[translate:var(--shadow-x,0px)_var(--shadow-y,0px)] [opacity:calc(var(--lift,0)*4)]";

/**
 * The hard shadow of a card: a solid card-shaped layer placed before the card in a positioned
 * parent; it slides out from under the card on hover.
 * Not a box-shadow: it would share the border's outer edge, and Firefox antialiases the two
 * separately, so a tilted card shows a light seam between them.
 */
export function CardBacking({ size, edge = "ink" }: { size: CardSize; edge?: CardEdge }) {
  return (
    <span
      aria-hidden
      className={gameCn(
        "pointer-events-none absolute inset-0",
        EDGE_FILL[edge],
        SHADOW_MOTION,
        RADIUS[size],
      )}
    />
  );
}
