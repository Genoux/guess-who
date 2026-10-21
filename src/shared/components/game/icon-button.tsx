"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactElement } from "react";
import { gameCn } from "./game-cn";
import { GameTooltip } from "./game-tooltip";

const iconButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
  {
    variants: {
      tone: {
        light: "bg-game-sidebar text-game-ink hover:bg-game-hover",
        dark: "bg-game-ink-soft text-white hover:bg-game-ink-hover",
        "on-color": "bg-game-ink/12 text-game-ink hover:bg-game-ink/20",
        subtle: "text-game-muted hover:bg-game-sidebar hover:text-game-ink",
      },
      size: {
        default: "size-11 [&_svg]:size-4.5",
        sm: "size-10 [&_svg]:size-5",
      },
    },
    defaultVariants: { tone: "light", size: "default" },
  },
);

export type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    /** Accessible name, also shown as the tooltip, e.g. "Close" or "How it works". */
    label: string;
    icon: LucideIcon;
    /** Render the single child (an empty Next Link) instead of a button; the icon goes inside it. */
    asChild?: boolean;
    children?: ReactElement;
  };

/** Round icon-only control with its label as a tooltip. */
export function IconButton({
  label,
  icon: Icon,
  tone,
  size,
  asChild = false,
  className,
  children,
  type,
  ...props
}: IconButtonProps) {
  const icon = <Icon aria-hidden strokeWidth={1.75} />;
  const classes = gameCn(iconButtonVariants({ tone, size }), className);

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
