import { CircleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameAvatar } from "@/shared/components/game/game-avatar";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameTooltip } from "@/shared/components/game/game-tooltip";

import { personSubline } from "../lib/person-line";

const NO_TEAM_COLOR = "#edede8";
const NOT_SIGNED_IN = "Hasn't signed in yet";

type PersonCellProps = {
  name: string | null;
  email: string;
  team: { name: string; color: string } | null;
  imageUrl: string | null;
  /** Their invite is still waiting for a first sign-in. */
  notSignedIn?: boolean;
  /** Replaces the subline, for something an admin must act on. */
  note?: string;
  /** Before the avatar: the checkbox in select mode. */
  leading?: ReactNode;
};

/** The person at the start of a row: avatar on their team color, name (or email) and a line. */
export function PersonCell({
  name,
  email,
  team,
  imageUrl,
  notSignedIn = false,
  note,
  leading,
}: PersonCellProps) {
  const who = name ?? email;
  const subline = note ?? personSubline({ name, email });
  return (
    <div className="people-who flex min-w-0 items-center gap-3 text-left">
      {leading}
      <GameAvatar
        name={who}
        color={team?.color ?? NO_TEAM_COLOR}
        photoUrl={imageUrl}
        className="flex-none"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span title={who} className="wrap-anywhere font-game-serif text-base md:truncate">
            {who}
          </span>
          {notSignedIn ? (
            <GameTooltip label={NOT_SIGNED_IN} side="top">
              <CircleAlertIcon
                role="img"
                aria-label={NOT_SIGNED_IN}
                tabIndex={0}
                className="size-4 flex-none text-game-muted outline-none focus-visible:outline-2 focus-visible:outline-game-found max-md:hidden"
              />
            </GameTooltip>
          ) : null}
        </span>
        <span title={subline} className="wrap-anywhere text-game-muted text-xs md:truncate">
          {subline}
        </span>
        {/* A tooltip needs a pointer, so a phone shows the words instead of the icon. */}
        {notSignedIn ? (
          <span className="flex items-center gap-1.5 text-game-muted text-xs md:hidden">
            <CircleAlertIcon aria-hidden className="size-3.5 flex-none" />
            {NOT_SIGNED_IN}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** A teammate named in a row, with a small avatar: "Omar Aziz". */
export function WelcomerCell({ name, label }: { name: string | null; label?: string }) {
  if (name === "" || name === null) {
    return (
      <div data-label={label} className="min-w-0 text-game-muted text-sm">
        {name === "" ? "Picking…" : "Secret from you"}
      </div>
    );
  }
  return (
    <div data-label={label} className="flex min-w-0 items-center gap-2 text-sm">
      <GameAvatar name={name} color={NO_TEAM_COLOR} className="size-7 flex-none text-sm" />
      <span title={name} className="truncate">
        {name}
      </span>
    </div>
  );
}

/** Whether someone is a new hire, whose mission is their rite of passage, or a team member. */
export function RoleTag({ newHire }: { newHire: boolean }) {
  return (
    <div>
      <CountChip
        size="row"
        variant={newHire ? "default" : "soft"}
        // The row's hover background is the chip's own colour, so the chip darkens with the row.
        className={
          newHire
            ? "transition-colors duration-fast ease-game motion-reduce:transition-none group-focus-within:bg-game-hover hoverable:group-hover:bg-game-hover"
            : "transition-colors duration-fast ease-game motion-reduce:transition-none group-focus-within:bg-game-ink/12 hoverable:group-hover:bg-game-ink/12"
        }
      >
        {newHire ? "New hire" : "Team member"}
      </CountChip>
    </div>
  );
}

/** The team as a colour dot and its name, or "No team yet". */
export function TeamTag({ team }: { team: { name: string; color: string } | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <span
        aria-hidden
        className="size-2 flex-none rounded-full bg-game-border-strong"
        style={team ? { backgroundColor: team.color } : undefined}
      />
      <span className="truncate">{team?.name ?? "No team yet"}</span>
    </div>
  );
}

/** A number or time under a right-aligned caption. */
export function NumberCell({
  children,
  label,
  muted = false,
  className,
}: {
  children: ReactNode;
  /** The column's caption, shown before the value where phones stack the row. */
  label?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      data-label={label}
      className={gameCn("text-right text-sm tabular-nums", muted && "text-game-muted", className)}
    >
      {children}
    </div>
  );
}
