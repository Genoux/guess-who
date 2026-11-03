"use client";

import { Switch } from "radix-ui";
import type { ComponentProps } from "react";
import { gameCn } from "./game-cn";

type GameSwitchProps = Omit<ComponentProps<typeof Switch.Root>, "children">;

/**
 * On or off with an immediate effect, drawn like the cards: ink edge and knob, the maybe stamp's
 * yellow when on. Never inside a form that has its own submit button.
 */
export function GameSwitch({ className, ...props }: GameSwitchProps) {
  return (
    <Switch.Root
      className={gameCn(
        "inline-flex h-7 w-12 flex-none cursor-pointer items-center rounded-full border-[1.5px] border-game-card-edge bg-game-surface px-0.75 outline-none transition-colors duration-fast ease-game focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-game-shortlist motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <Switch.Thumb className="block size-4.5 rounded-full bg-game-ink transition-transform duration-fast ease-game data-[state=checked]:translate-x-5 motion-reduce:transition-none" />
    </Switch.Root>
  );
}
