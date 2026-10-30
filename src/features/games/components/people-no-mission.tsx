"use client";

import { useState } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { GameButton } from "@/shared/components/game/game-button";
import { GameCheckbox } from "@/shared/components/game/game-checkbox";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameFilterMenu } from "@/shared/components/game/game-filter-menu";
import { GameModal } from "@/shared/components/game/game-modal";
import { GameModalActions } from "@/shared/components/game/game-modal-actions";
import { GameRowMenu } from "@/shared/components/game/game-row-menu";
import { GameSearchField } from "@/shared/components/game/game-search-field";
import {
  matchesPeopleFilter,
  matchesPeopleSearch,
  PEOPLE_FILTERS,
  type PeopleFilter,
} from "../lib/people-filter";
import type { NoMissionRowView } from "../lib/people-view";
import { type AsWelcomer, asWelcomerLabel, canTurnOn } from "../lib/welcomer-readiness";
import { PeopleEmpty } from "./people-empty";
import {
  PEOPLE_HOVER_GROUP,
  PEOPLE_LAST_CLASS,
  PEOPLE_MENU_CLASS,
  PEOPLE_ROW_CLASS,
  PeopleTable,
} from "./people-table";
import { PersonCell, RoleTag, TeamTag } from "./person-cell";

const PAGE_SIZE = 14;
const NEEDS_CARD_AND_CLUES = "Needs card and clues";

const READINESS_DOT: Record<AsWelcomer["kind"], string> = {
  canWelcome: "bg-game-ready",
  cluesMissing: "bg-game-shortlist",
  cardNotDone: "border-[1.5px] border-game-border-strong",
};

const peopleCount = (count: number) => `${count} ${count === 1 ? "person" : "people"}`;

type PeopleNoMissionProps = {
  rows: readonly NoMissionRowView[];
  /** Turns missions on for these people; they move to Playing at once. */
  onTurnOn: (keys: readonly string[]) => void;
  /** Makes them a new hire, with no card or clues asked; they move to Playing at once. */
  onSetNewHire: (row: NoMissionRowView) => void;
};

/** Everyone signed in with no mission: search, filter, and a select mode that turns missions on. */
export function PeopleNoMission({ rows, onTurnOn, onSetNewHire }: PeopleNoMissionProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const matching = rows.filter(
    (row) => matchesPeopleFilter(row, filter) && matchesPeopleSearch(row, query),
  );
  const shown = matching.slice(0, limit);
  // Only people who can welcome are turned on from here; the others wait for their card and clues.
  const choosable = matching.filter(canTurnOn);
  const unselected = choosable.filter((row) => !selected.has(row.key));

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const toggle = (key: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  function turnOnSelected() {
    onTurnOn([...selected]);
    setConfirming(false);
    stopSelecting();
  }

  return (
    <>
      <GameBook
        as="section"
        className={gameCn("people--no-mission items-stretch gap-0 p-4 text-left md:p-6")}
      >
        <div className="flex flex-wrap items-center gap-2 pb-2 md:flex-nowrap md:gap-3">
          <GameSearchField
            label="Search people"
            placeholder="Search people"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            className="w-full md:max-w-105 md:flex-1"
          />
          <GameFilterMenu
            label="Show"
            value={filter}
            options={PEOPLE_FILTERS}
            onValueChange={(next) => {
              setFilter(next);
              setLimit(PAGE_SIZE);
            }}
            className="ml-auto"
          />
          {selecting ? null : (
            <GameButton variant="light" size="sm" onClick={() => setSelecting(true)}>
              Select
            </GameButton>
          )}
        </div>

        {matching.length === 0 ? (
          <PeopleEmpty title="No one matches" text="Try another name or clear the filter." />
        ) : (
          <>
            <PeopleTable
              menu
              heads={[
                { label: "Person" },
                { label: "Role" },
                { label: "Team" },
                { label: "As welcomer" },
              ]}
            >
              {shown.map((row) => {
                const picked = selected.has(row.key);
                return (
                  <li
                    key={row.key}
                    className={gameCn(
                      PEOPLE_ROW_CLASS,
                      picked
                        ? "bg-game-shortlist-soft hoverable:hover:bg-game-shortlist-soft focus-within:bg-game-shortlist-soft"
                        : PEOPLE_HOVER_GROUP,
                    )}
                  >
                    <PersonCell
                      name={row.name}
                      email={row.email}
                      team={row.team}
                      imageUrl={row.imageUrl}
                      leading={
                        selecting ? (
                          <span title={canTurnOn(row) ? undefined : NEEDS_CARD_AND_CLUES}>
                            <GameCheckbox
                              checked={picked}
                              disabled={!canTurnOn(row)}
                              aria-label={
                                canTurnOn(row)
                                  ? `Select ${row.name ?? row.email}`
                                  : `${row.name ?? row.email}: ${NEEDS_CARD_AND_CLUES}`
                              }
                              onCheckedChange={(on) => toggle(row.key, on === true)}
                            />
                          </span>
                        ) : undefined
                      }
                    />
                    <RoleTag newHire={row.newHire} />
                    <TeamTag team={row.team} />
                    <div className={gameCn("flex items-center gap-2 text-sm", PEOPLE_LAST_CLASS)}>
                      <span
                        aria-hidden
                        className={gameCn(
                          "size-2 flex-none rounded-full",
                          READINESS_DOT[row.asWelcomer.kind],
                        )}
                      />
                      {asWelcomerLabel(row.asWelcomer)}
                    </div>
                    {selecting ? null : (
                      <GameRowMenu
                        className={PEOPLE_MENU_CLASS}
                        label={`Actions for ${row.name ?? row.email}`}
                        items={[
                          ...(canTurnOn(row)
                            ? [{ label: "Turn on mission", onSelect: () => onTurnOn([row.key]) }]
                            : []),
                          ...(row.newHire
                            ? []
                            : [{ label: "Set as new hire", onSelect: () => onSetNewHire(row) }]),
                        ]}
                      />
                    )}
                  </li>
                );
              })}
            </PeopleTable>
            {matching.length > shown.length ? (
              <div className="flex justify-center pt-4">
                <GameButton variant="light" size="sm" onClick={() => setLimit(limit + PAGE_SIZE)}>
                  Show more
                </GameButton>
              </div>
            ) : null}
          </>
        )}
      </GameBook>

      {selecting ? <div aria-hidden className="h-24" /> : null}

      {selecting ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-2 md:px-4 md:pb-4">
          <section
            aria-label="Selection"
            className="pointer-events-auto flex w-full max-w-220 flex-wrap items-center gap-x-5 gap-y-2.5 rounded-3xl bg-game-ink p-4 text-white shadow-pop md:rounded-full md:py-3 md:pr-3 md:pl-7"
          >
            <span className="font-medium tabular-nums">{selected.size} selected</span>
            <GameButton
              variant="link"
              className="order-3 basis-full justify-start text-white/75 hover:text-white md:order-none md:basis-auto"
              disabled={unselected.length === 0}
              onClick={() =>
                setSelected(new Set([...selected, ...choosable.map(({ key }) => key)]))
              }
            >
              Select all {choosable.length} in this filter
            </GameButton>
            <GameButton
              variant="link"
              className="ml-auto text-white/75 hover:text-white"
              onClick={stopSelecting}
            >
              Cancel
            </GameButton>
            <GameButton
              variant="on-dark"
              size="sm"
              className="order-4 w-full md:order-none md:w-auto"
              disabled={selected.size === 0}
              onClick={() => setConfirming(true)}
            >
              Turn on missions
            </GameButton>
          </section>
        </div>
      ) : null}

      <GameModal
        open={confirming}
        onOpenChange={setConfirming}
        title={`Turn on missions for ${peopleCount(selected.size)}?`}
        description="They'll see a Mission tab and can start when they're ready."
      >
        <GameModalActions
          secondary={{ label: "Cancel", onClick: () => setConfirming(false) }}
          primary={{ label: "Turn on missions", onClick: turnOnSelected }}
        />
      </GameModal>
    </>
  );
}
