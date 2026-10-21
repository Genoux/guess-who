"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactElement, ReactNode } from "react";
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
        outline:
          "border border-game-card-edge text-game-muted hover:border-game-border-strong hover:text-game-ink",
      },
      size: {
        default: "size-11 [&_svg]:size-4.5",
        sm: "size-10 [&_svg]:size-5",
        xs: "size-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { tone: "light", size: "default" },
  },
);

export type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    /** Accessible name, also shown as the tooltip, e.g. "Close" or "How it works". */
    label: string;
    /** A rendered icon, e.g. `<XIcon />`: an element, so Server Components can pass it too. */
    icon: ReactNode;
    /** Render the single child (an empty Next Link) instead of a button; the icon goes inside it. */
    asChild?: boolean;
    children?: ReactElement;
  };

/** Round icon-only control with its label as a tooltip. */
export function IconButton({
  label,
  icon,
  tone,
  size,
  asChild = false,
  className,
  children,
  type,
  ...props
}: IconButtonProps) {
  const glyph = (
    <span aria-hidden className="contents [&_svg]:stroke-[1.75]">
      {icon}
    </span>
  );
  const classes = gameCn(iconButtonVariants({ tone, size }), className);

  if (asChild && children) {
    return (
      <GameTooltip label={label}>
        <Slot.Root aria-label={label} className={classes} {...props}>
          <Slot.Slottable>{children}</Slot.Slottable>
          {glyph}
        </Slot.Root>
      </GameTooltip>
    );
  }

  return (
    <GameTooltip label={label}>
      <button aria-label={label} className={classes} type={type ?? "button"} {...props}>
        {glyph}
      </button>
    </GameTooltip>
  );
}
