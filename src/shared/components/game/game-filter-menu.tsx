"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { gameCn } from "./game-cn";

export type GameFilterOption<Value extends string> = {
  value: Value;
  label: string;
  count?: number;
  /** A team color, shown as a dot before the label. */
  color?: string;
};

type GameFilterMenuProps<Value extends string> = {
  /** Names the menu for screen readers, e.g. "Show". */
  label: string;
  value: Value;
  /** The first option is the unfiltered one; any other turns the trigger ink. */
  options: readonly GameFilterOption<Value>[];
  onValueChange: (value: Value) => void;
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end";
  className?: string;
};

/** A pill that opens a one-choice menu, for filters that sit beside the team pills. */
export function GameFilterMenu<Value extends string>({
  label,
  value,
  options,
  onValueChange,
  align = "end",
  className,
}: GameFilterMenuProps<Value>) {
  const selected = options.find((option) => option.value === value) ?? options[0];
  const filtering = selected !== options[0];

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={`${label}: ${selected?.label}`}
        className={gameCn(
          "inline-flex h-10 flex-none cursor-pointer items-center gap-2 rounded-full pr-3.5 pl-4 text-button-sm outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2",
          filtering
            ? "bg-game-ink text-white"
            : "bg-game-surface text-game-ink shadow-edge hover:bg-game-sidebar",
          className,
        )}
      >
        {selected?.label}
        <ChevronDownIcon aria-hidden className="size-4 opacity-60" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          collisionPadding={16}
          className="z-50 flex min-w-52 flex-col gap-0.5 rounded-game-lg bg-game-surface p-1.5 font-game-sans text-game-ink shadow-pop"
        >
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(next) => onValueChange(next as Value)}
          >
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="flex h-10 cursor-pointer items-center gap-2.5 rounded-game-md pr-3 pl-2.5 text-button-sm outline-none data-highlighted:bg-game-sidebar"
              >
                <span className="flex size-4 flex-none items-center justify-center">
                  <DropdownMenu.ItemIndicator>
                    <CheckIcon aria-hidden className="size-4" />
                  </DropdownMenu.ItemIndicator>
                </span>
                {option.color ? (
                  <span
                    aria-hidden
                    className="size-2 flex-none rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                ) : null}
                <span className="flex-1 whitespace-nowrap">{option.label}</span>
                {option.count === undefined ? null : (
                  <span className="text-game-muted text-small tabular-nums">{option.count}</span>
                )}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
