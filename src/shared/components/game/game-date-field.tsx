"use client";

import { Calendar } from "@inbeat/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@inbeat/ui/components/popover";
import { CalendarIcon } from "lucide-react";
import { type Ref, useId, useState } from "react";
import { gameCn } from "./game-cn";
import { describedBy, FieldFrame } from "./game-field";

type GameDateFieldProps = {
  label: string;
  /** The chosen day as YYYY-MM-DD, or empty. */
  value: string;
  onValueChange: (value: string) => void;
  /** The earliest day that can be chosen, as YYYY-MM-DD. */
  min?: string;
  /** Submitted with a surrounding form, as YYYY-MM-DD. */
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  help?: string;
  error?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

const SHOWN = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function parseDay(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

const pad = (part: number) => String(part).padStart(2, "0");
const formatDay = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// toolkit-gap: the calendar takes its colors from the toolkit tokens (primary, accent, muted), so
// they are pointed at the game's on this wrapper, and the cell size is set for a 44 px target.
const CALENDAR_CLASS =
  "bg-transparent! p-0 font-game-sans text-game-ink [--accent-foreground:var(--color-game-ink)] [--accent:var(--color-game-sidebar)] [--cell-size:--spacing(11)] [--muted-foreground:var(--color-game-muted)] [--primary-foreground:#fff] [--primary:var(--color-game-ink)] [--ring:var(--color-game-ink)] [&_.rdp-today:not([data-selected])]:rounded-full [&_.rdp-today:not([data-selected])]:shadow-edge-strong [&_button]:rounded-full! [&_button]:text-base";

/** A date field that opens a calendar in the game look, in place of the browser's date input. */
export function GameDateField({
  label,
  value,
  onValueChange,
  min,
  name,
  disabled,
  placeholder = "Pick a day",
  help,
  error,
  className,
  ref,
}: GameDateFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = parseDay(value);
  const earliest = min ? parseDay(min) : undefined;

  return (
    <FieldFrame id={id} label={label} help={help} error={error} className={className}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={ref}
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { help, error })}
          className={gameCn(
            "flex h-13 w-full cursor-pointer items-center justify-between gap-3 rounded-field border-[1.5px] border-game-border bg-game-surface px-4.5 text-left font-game-sans text-base text-game-ink outline-none focus-visible:border-game-ink aria-invalid:border-game-error disabled:cursor-not-allowed disabled:bg-game-sidebar disabled:text-game-muted data-[state=open]:border-game-ink",
            !selected && "text-game-muted",
          )}
        >
          {selected
            ? SHOWN.format(
                Date.UTC(selected.getFullYear(), selected.getMonth(), selected.getDate()),
              )
            : placeholder}
          <CalendarIcon aria-hidden className="size-4 flex-none text-game-muted" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="z-60 w-auto rounded-game-lg border-0 bg-game-surface p-4 shadow-pop"
        >
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? earliest}
            disabled={earliest ? { before: earliest } : undefined}
            onSelect={(day) => {
              if (!day) return;
              onValueChange(formatDay(day));
              setOpen(false);
            }}
            showOutsideDays={false}
            className={CALENDAR_CLASS}
          />
        </PopoverContent>
      </Popover>
    </FieldFrame>
  );
}
