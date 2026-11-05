"use client";

import { TooltipContent, TooltipRoot, TooltipTrigger } from "@inbeat/ui/components/tooltip";
import { type MouseEvent, type PointerEvent, type ReactElement, useRef, useState } from "react";

type GameTooltipProps = {
  /** Text shown on hover and keyboard focus; usually the control's accessible name. */
  label: string;
  /** The trigger: one element that forwards props and ref (a button or Link). */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  /** Also opens on a tap or click, for a trigger that only explains (an info icon): touch has no
      hover, and the toolkit trigger opens on keyboard focus only. */
  openOnTap?: boolean;
};

/** Ink pill tooltip for the game's icon-only controls, on the toolkit tooltip. */
export function GameTooltip({
  label,
  children,
  side = "bottom",
  openOnTap = false,
}: GameTooltipProps) {
  const [open, setOpen] = useState(false);
  const openAtPress = useRef(false);
  // Radix closes the tooltip on the trigger's pointerdown and click; preventDefault skips those
  // handlers, so a tap toggles it here instead. The open state is read at pointerdown, because the
  // open tooltip's outside-press dismissal closes it before the click lands.
  const tap = openOnTap
    ? {
        root: { open, onOpenChange: setOpen },
        trigger: {
          onPointerDown: (event: PointerEvent<HTMLElement>) => {
            event.preventDefault();
            openAtPress.current = open;
          },
          onClick: (event: MouseEvent<HTMLElement>) => {
            event.preventDefault();
            setOpen(!openAtPress.current);
          },
        },
      }
    : { root: {}, trigger: {} };
  return (
    <TooltipRoot delayDuration={300} {...tap.root}>
      <TooltipTrigger asChild {...tap.trigger}>
        {children}
      </TooltipTrigger>
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
