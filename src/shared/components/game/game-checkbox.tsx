"use client";

import { Checkbox } from "@inbeat/ui/components/checkbox";
import type { ComponentProps } from "react";
import { gameCn } from "./game-cn";

type GameCheckboxProps = Omit<ComponentProps<typeof Checkbox>, "children">;

/**
 * A square tick box drawn like the cards: ink when checked, dashed and quiet when disabled.
 * Keep it inside a padded row so it never touches the row or screen edge.
 */
export function GameCheckbox({ className, ...props }: GameCheckboxProps) {
  return (
    <Checkbox
      className={gameCn(
        // toolkit-gap: the checkbox takes size, radius, border and checked colors from classes with
        // no game variant, so the game look wins through important modifiers.
        "size-6! rounded-game-md! border-[1.5px]! border-game-border-strong! bg-game-surface! shadow-none! outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2 focus-visible:ring-0! data-[state=checked]:border-game-ink! data-[state=checked]:bg-game-ink! data-[state=checked]:text-white! disabled:cursor-not-allowed disabled:border-dashed! disabled:border-game-border! disabled:bg-game-sidebar! disabled:opacity-100! [&_svg]:size-4!",
        className,
      )}
      {...props}
    />
  );
}
