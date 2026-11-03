import { cx } from "class-variance-authority";
import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = Parameters<typeof cx>[number];

// The default merger reads `text-hero` as a color and drops it next to `text-game-ink`; it has to
// know the game theme's size, radius, shadow, font and duration names (game-theme.css).
const mergeGameClasses = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "hero",
        "hero-md",
        "display",
        "title",
        "logo",
        "heading",
        "lead",
        "button-sm",
        "small",
        "caption",
        "meta",
        "clue",
        "clue-lg",
        "mark",
        "mark-lg",
        "quote",
        "name",
        "name-lg",
        "stamp",
        "stamp-lg",
        "avatar",
      ],
      radius: [
        "game-sm",
        "game-md",
        "game-lg",
        "field",
        "card",
        "card-art",
        "card-lg",
        "card-art-lg",
        "stage",
        "book",
        "modal",
      ],
      shadow: ["ink", "ink-found", "ink-maybe", "edge", "edge-strong"],
      font: ["game-serif", "game-sans", "game-mono"],
      "font-weight": ["book"],
      ease: ["game"],
      tracking: ["caption"],
    },
    classGroups: {
      duration: [{ duration: ["instant", "fast", "base", "slow", "slower"] }],
    },
  },
});

export function gameCn(...inputs: ClassValue[]): string {
  return mergeGameClasses(cx(inputs));
}
