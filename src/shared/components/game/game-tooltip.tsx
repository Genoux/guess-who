"use client";

import { Tooltip } from "radix-ui";
import type { ReactElement } from "react";

type GameTooltipProps = {
  /** Text shown on hover and keyboard focus; usually the control's accessible name. */
  label: string;
  /** The trigger: one element that forwards props and ref (a button or Link). */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
};

/** Ink pill tooltip for the game's icon-only controls (Radix Tooltip). */
export function GameTooltip({ label, children, side = "bottom" }: GameTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={8}
            className="z-50 rounded-full bg-game-ink px-3 py-1.5 font-game-sans font-medium text-small text-white"
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
