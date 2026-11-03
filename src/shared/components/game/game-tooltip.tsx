"use client";

import { TooltipContent, TooltipRoot, TooltipTrigger } from "@inbeat/ui/components/tooltip";
import type { ReactElement } from "react";

type GameTooltipProps = {
  /** Text shown on hover and keyboard focus; usually the control's accessible name. */
  label: string;
  /** The trigger: one element that forwards props and ref (a button or Link). */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
};

/** Ink pill tooltip for the game's icon-only controls, on the toolkit tooltip. */
export function GameTooltip({ label, children, side = "bottom" }: GameTooltipProps) {
  return (
    <TooltipRoot delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        // toolkit-gap: the arrow takes no className, so its ink color comes from this selector
        className="rounded-full bg-game-ink px-3 py-1.5 font-game-sans font-medium text-small! text-white [&_svg]:bg-game-ink [&_svg]:fill-game-ink"
      >
        {label}
      </TooltipContent>
    </TooltipRoot>
  );
}
