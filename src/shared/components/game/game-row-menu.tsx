"use client";

import { EllipsisVerticalIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { gameCn } from "./game-cn";

export type GameRowMenuItem = { label: string; onSelect: () => void };

type GameRowMenuProps = {
  /** Names the trigger for screen readers, e.g. "Actions for Maya Chen". */
  label: string;
  items: readonly GameRowMenuItem[];
  className?: string;
};

/** The three dots at the end of a list row, opening its actions. */
export function GameRowMenu({ label, items, className }: GameRowMenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={label}
        className={gameCn(
          "inline-grid size-10 flex-none cursor-pointer place-items-center rounded-full text-game-ink outline-none hover:bg-game-hover focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2 data-[state=open]:bg-game-hover",
          className,
        )}
      >
        <EllipsisVerticalIcon aria-hidden className="size-5" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={16}
          className="z-50 flex min-w-48 flex-col gap-0.5 rounded-game-lg bg-game-surface p-1.5 font-game-sans text-game-ink shadow-pop"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              onSelect={item.onSelect}
              className="flex h-10 cursor-pointer items-center rounded-game-md px-3.5 font-medium text-button-sm outline-none data-highlighted:bg-game-sidebar"
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
