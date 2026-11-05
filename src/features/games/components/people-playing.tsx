import type { ReactNode } from "react";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import { GAME_FILTER_GROUP_CLASS } from "@/shared/components/game/game-filter-menu";
import { GameRowMenu } from "@/shared/components/game/game-row-menu";
import type { PlayingRowView } from "../lib/people-view";
import { PeopleEmpty } from "./people-empty";
import {
  PEOPLE_HOVER_GROUP,
  PEOPLE_LAST_CLASS,
  PEOPLE_MENU_CLASS,
  PEOPLE_ROW_CLASS,
  PEOPLE_TOOLBAR_CLASS,
  PeopleTable,
} from "./people-table";
import { NumberCell, PersonCell, RoleTag, TeamTag, WelcomerCell } from "./person-cell";

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
      <div className={PEOPLE_TOOLBAR_CLASS}>
        <div className={GAME_FILTER_GROUP_CLASS}>{filters}</div>
      </div>
      {rows.length === 0 ? (
        <PeopleEmpty
          title="No one is playing"
          text="Missions show up here as soon as you turn them on."
        />
      ) : (
        <PeopleTable
          menu
          heads={[
            { label: "Player" },
            { label: "Role" },
            { label: "Team" },
            { label: "Welcomed by" },
            { label: "Day", end: true, hint: "Day of 14" },
            { label: "Stickers", end: true },
            { label: "Last active", end: true },
          ]}
        >
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
              <WelcomerCell name={row.welcomer} />
              <NumberCell>{row.day}</NumberCell>
              <NumberCell>{row.progress.label}</NumberCell>
              <NumberCell muted className={PEOPLE_LAST_CLASS}>
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
