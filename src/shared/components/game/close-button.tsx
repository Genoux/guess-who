"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactElement } from "react";
import { gameCn } from "./game-cn";
import { GameTooltip } from "./game-tooltip";

const closeButtonVariants = cva(
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
  {
    variants: {
      tone: {
        light: "bg-game-sidebar text-game-ink hover:bg-game-hover",
        dark: "bg-game-ink-soft text-white hover:bg-game-ink-hover",
        "on-color": "bg-game-ink/12 text-game-ink hover:bg-game-ink/20",
      },
    },
    defaultVariants: { tone: "light" },
  },
);

type CloseButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  VariantProps<typeof closeButtonVariants> & {
    /** Accessible name, e.g. "Close" or "Back to album". */
    label: string;
    /** Render the single child (an empty Next Link) instead of a button; the icon goes inside it. */
    asChild?: boolean;
    children?: ReactElement;
  };

/** Round 44px close control for full-screen game moments, with its label as a tooltip. */
export function CloseButton({
  label,
  tone = "light",
  asChild = false,
  className,
  children,
  type,
  ...props
}: CloseButtonProps) {
  const icon = <XIcon aria-hidden className="size-4.5" strokeWidth={1.75} />;
  const classes = gameCn(closeButtonVariants({ tone }), className);

  if (asChild && children) {
    return (
      <GameTooltip label={label}>
        <Slot.Root aria-label={label} className={classes} {...props}>
          <Slot.Slottable>{children}</Slot.Slottable>
          {icon}
        </Slot.Root>
      </GameTooltip>
    );
  }

  return (
    <GameTooltip label={label}>
      <button aria-label={label} className={classes} type={type ?? "button"} {...props}>
        {icon}
      </button>
    </GameTooltip>
  );
}
