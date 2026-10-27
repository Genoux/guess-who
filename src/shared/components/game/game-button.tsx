import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { gameCn } from "./game-cn";

const gameButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-game-sans outline-none focus-visible:outline-2 focus-visible:outline-game-found disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        cta: "bg-game-ink text-white hover:bg-game-ink-hover",
        yellow: "bg-game-shortlist text-game-ink hover:bg-game-shortlist-hover",
        light: "bg-game-surface text-game-ink shadow-edge hover:shadow-edge-strong",
        "on-dark": "bg-game-surface text-game-ink hover:bg-game-sidebar",
        link: "rounded-sm text-game-muted underline underline-offset-3 hover:text-game-ink focus-visible:outline-offset-3",
      },
      size: {
        lg: "h-15 gap-3 px-9 text-lead",
        default: "h-13 gap-2.5 px-7 text-base",
        sm: "h-11 gap-2 px-5.5 text-button-sm",
      },
    },
    compoundVariants: [
      {
        variant: ["cta", "yellow", "light", "on-dark"],
        className:
          "rounded-full font-medium transition-[color,background-color,box-shadow] duration-fast ease-game focus-visible:outline-offset-3 motion-reduce:transition-none",
      },
      { variant: "link", className: "h-auto px-0 text-button-sm" },
    ],
    defaultVariants: { variant: "cta", size: "default" },
  },
);

type GameButtonProps = ComponentProps<"button"> &
  VariantProps<typeof gameButtonVariants> & {
    /** Render the single child (a Next Link or an anchor) with the button styles. */
    asChild?: boolean;
  };

/** The pill call to action of the game screens. One dark `cta` per screen. */
export function GameButton({
  className,
  variant = "cta",
  size = "default",
  asChild = false,
  type,
  ...props
}: GameButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-variant={variant}
      className={gameCn(gameButtonVariants({ variant, size }), className)}
      type={asChild ? type : (type ?? "button")}
      {...props}
    />
  );
}
