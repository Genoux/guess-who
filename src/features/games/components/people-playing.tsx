import type { ReactNode } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import { GameRowMenu } from "@/shared/components/game/game-row-menu";
import type { PlayingRowView } from "../lib/people-view";
import { PeopleEmpty } from "./people-empty";
import {
  PEOPLE_HOVER_GROUP,
  PEOPLE_LAST_CLASS,
  PEOPLE_MENU_CLASS,
  PEOPLE_ROW_CLASS,
  PEOPLE_TOOLBAR_CLASS,
  type PeopleHead,
  PeopleTable,
} from "./people-table";
import { NumberCell, PersonCell, RoleTag, TeamTag, WelcomerCell } from "./person-cell";

const HEADS = {
  player: { label: "Player" },
  role: { label: "Role" },
  team: { label: "Team" },
  welcomer: { label: "Welcomed by" },
  day: { label: "Day", end: true, hint: "Day of 14" },
  stickers: { label: "Stickers", end: true },
  active: { label: "Last active", end: true },
} as const satisfies Record<string, PeopleHead>;

type PeoplePlayingProps = {
  rows: readonly PlayingRowView[];
  /** The team filter. */
  filters: ReactNode;
  onEnd: (row: PlayingRowView) => void;
};

/** One row per started mission, furthest day first. */
export function PeoplePlaying({ rows, filters, onEnd }: PeoplePlayingProps) {
  return (
    <GameBook
      as="section"
      className={gameCn(
        "people--playing items-stretch gap-0 p-4 text-left md:p-6",
        rows.length === 0 && "flex-1",
      )}
    >
      <div className={PEOPLE_TOOLBAR_CLASS}>{filters}</div>
      {rows.length === 0 ? (
        <PeopleEmpty
          title="No one is playing"
          text="Missions show up here as soon as you turn them on."
        />
      ) : (
        <PeopleTable menu heads={Object.values(HEADS)}>
          {rows.map((row) => (
            <li key={row.key} className={gameCn(PEOPLE_HOVER_GROUP, PEOPLE_ROW_CLASS)}>
              <PersonCell
                name={row.name}
                email={row.email}
                team={row.team}
                imageUrl={row.imageUrl}
                notSignedIn={!row.signedIn}
              />
              <RoleTag newHire={row.newHire} />
              <TeamTag team={row.team} />
              <WelcomerCell name={row.welcomer} label={HEADS.welcomer.label} />
              <NumberCell label={HEADS.day.label}>{row.day}</NumberCell>
              <NumberCell label={HEADS.stickers.label}>{row.progress.label}</NumberCell>
              <NumberCell muted label={HEADS.active.label} className={PEOPLE_LAST_CLASS}>
                {row.progress.activity}
              </NumberCell>
              <GameRowMenu
                className={PEOPLE_MENU_CLASS}
                label={`Actions for ${row.name ?? row.email}`}
                items={[{ label: "End mission", onSelect: () => onEnd(row) }]}
              />
            </li>
          ))}
        </PeopleTable>
      )}
    </GameBook>
  );
}
