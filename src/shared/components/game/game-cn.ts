import { cx } from "class-variance-authority";
import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = Parameters<typeof cx>[number];

// The default merger reads `text-hero` as a color and drops it next to `text-game-ink`; it has to
// know the game theme's size, radius, shadow and font names (game-theme.css).
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
        "sticker",
        "sticker-art",
        "sticker-lg",
        "sticker-art-lg",
        "clue",
        "clue-lg",
        "stage",
        "book",
        "modal",
      ],
      shadow: ["ink", "ink-found", "ink-maybe", "edge"],
      font: ["game-serif", "game-sans", "game-mono"],
      "font-weight": ["book"],
      ease: ["game"],
      tracking: ["caption"],
    },
  },
});

export function gameCn(...inputs: ClassValue[]): string {
  return mergeGameClasses(cx(inputs));
}
