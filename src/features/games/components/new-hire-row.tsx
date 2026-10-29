"use client";

import { CircleAlertIcon, PencilIcon } from "lucide-react";
import { motion } from "motion/react";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameAvatar } from "@/shared/components/game/game-avatar";
import { GameButton } from "@/shared/components/game/game-button";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameTooltip } from "@/shared/components/game/game-tooltip";
import "./new-hire-row.css";
import { ROW_DEAL, ROW_GLOW } from "../lib/new-hire-motion";
import type { NewHireRowView } from "../lib/new-hire-view";

const AVATAR_COLOR = "#edede8";

const CHIP_VARIANT = { dark: "dark", default: "default", found: "found", soft: "soft" } as const;

const FOCUS_RING =
  "rounded-full outline-none focus-visible:outline-2 focus-visible:outline-game-found focus-visible:outline-offset-2";

function RowAlert({ label }: { label: string }) {
  return (
    <GameTooltip label={label} side="top">
      <button
        type="button"
        className={gameCn("flex shrink-0 cursor-default items-center text-game-error", FOCUS_RING)}
      >
        <CircleAlertIcon aria-hidden className="size-4" />
        <span className="sr-only">{label}</span>
      </button>
    </GameTooltip>
  );
}

type NewHireRowProps = {
  row: NewHireRowView;
  /** Just added: the row is dealt in and washed in yellow until the wash fades. */
  fresh: boolean;
  onEdit: (row: NewHireRowView) => void;
  onSettled: () => void;
};

export function NewHireRow({ row, fresh, onEdit, onSettled }: NewHireRowProps) {
  const who = row.name ?? row.email;
  const alert = row.signInWarning
    ? "Hasn't signed in yet"
    : row.stalledDays
      ? `No activity for ${row.stalledDays} days`
      : null;
  return (
    <motion.li
      onClick={row.editable ? () => onEdit(row) : undefined}
      {...(fresh ? ROW_DEAL : {})}
      className={gameCn(
        "hire-row group relative isolate -mx-3 rounded-game-lg px-3 py-4 transition-colors duration-fast ease-game motion-reduce:transition-none",
        row.editable &&
          "hire-row--editable cursor-pointer hover:bg-game-bg focus-within:bg-game-bg",
      )}
    >
      {fresh ? (
        <motion.span
          aria-hidden
          {...ROW_GLOW}
          onAnimationComplete={onSettled}
          className="-z-10 absolute inset-0 rounded-game-lg bg-game-shortlist-soft"
        />
      ) : null}
      <div className="hire-row__person">
        <GameAvatar name={who} color={AVATAR_COLOR} className="hire-row__avatar flex-none" />
        <div className="hire-row__lines">
          <span className="hire-row__name">
            <span title={who} className="min-w-0 truncate font-medium text-base">
              {who}
            </span>
            {alert ? <RowAlert label={alert} /> : null}
          </span>
          {row.name ? (
            <span title={row.email} className="truncate text-game-muted text-small">
              {row.email}
            </span>
          ) : null}
        </div>
      </div>
      <div className="hire-row__meta">
        {alert ? (
          <span className="hire-row__alert-text font-medium text-game-error text-small">
            {alert}
          </span>
        ) : null}
        <div className="hire-row__welcomer flex items-center gap-2">
          <span className="hire-row__welcomer-label text-game-muted text-small">Welcomer</span>
          <GameTooltip side="top" label="Secret welcomer">
            <CountChip
              size="sm"
              tabIndex={0}
              dotColor={row.welcomer.color ?? undefined}
              className={gameCn(
                FOCUS_RING,
                "max-w-full border border-transparent transition-[background-color,border-color] duration-fast ease-game motion-reduce:transition-none",
                row.editable &&
                  "group-focus-within:border-game-border group-focus-within:bg-game-hover group-hover:border-game-border group-hover:bg-game-hover",
              )}
            >
              {row.welcomer.name}
            </CountChip>
          </GameTooltip>
        </div>
        {row.progress ? (
          <div className="hire-row__progress">
            <span className="hire-row__stickers whitespace-nowrap font-medium text-game-ink text-small">
              {row.progress.label}
            </span>
            <span className="hire-row__activity whitespace-nowrap text-game-muted text-small">
              {row.progress.activity}
            </span>
          </div>
        ) : null}
      </div>
      <div
        className={gameCn(
          "hire-row__status",
          row.editable &&
            "transition-opacity duration-fast ease-game motion-reduce:transition-none hoverable:group-focus-within:opacity-0 group-hover:opacity-0",
        )}
      >
        <CountChip size="sm" variant={CHIP_VARIANT[row.status.tone]}>
          {row.status.label}
        </CountChip>
      </div>
      {row.editable ? (
        <GameTooltip side="top" label="Edit">
          <GameButton
            size="round-sm"
            aria-label={`Edit ${who}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row);
            }}
            className="hire-row__pencil transition-opacity duration-fast ease-game motion-reduce:transition-none hoverable:opacity-0 hoverable:focus-visible:opacity-100 hoverable:group-focus-within:opacity-100 hoverable:group-hover:opacity-100"
          >
            <PencilIcon aria-hidden />
          </GameButton>
        </GameTooltip>
      ) : null}
    </motion.li>
  );
}
