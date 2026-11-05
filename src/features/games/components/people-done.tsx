import type { ReactNode } from "react";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import type { DoneRowView } from "../lib/people-view";
import { PeopleEmpty } from "./people-empty";
import {
  PEOPLE_HOVER_GROUP,
  PEOPLE_LAST_CLASS,
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
  result: { label: "Result" },
  ended: { label: "Ended", end: true },
} as const satisfies Record<string, PeopleHead>;

type PeopleDoneProps = {
  rows: readonly DoneRowView[];
  /** The team filter. */
  filters: ReactNode;
};

/** Finished missions, most recently ended first. */
export function PeopleDone({ rows, filters }: PeopleDoneProps) {
  return (
    <GameBook
      as="section"
      className={gameCn(
        "people--done items-stretch gap-0 p-4 text-left md:p-6",
        rows.length === 0 && "flex-1",
      )}
    >
      <div className={PEOPLE_TOOLBAR_CLASS}>{filters}</div>
      {rows.length === 0 ? (
        <PeopleEmpty
          title="Nothing here yet"
          text="Finished missions land here, found or revealed."
        />
      ) : (
        <PeopleTable heads={Object.values(HEADS)}>
          {rows.map((row) => (
            <li key={row.key} className={gameCn(PEOPLE_HOVER_GROUP, PEOPLE_ROW_CLASS)}>
              <PersonCell
                name={row.name}
                email={row.email}
                team={row.team}
                imageUrl={row.imageUrl}
              />
              <RoleTag newHire={row.newHire} />
              <TeamTag team={row.team} />
              <WelcomerCell name={row.welcomer} label={HEADS.welcomer.label} />
              <div>
                <CountChip size="row" variant={row.outcome.found ? "found" : "soft"}>
                  {row.outcome.label}
                </CountChip>
              </div>
              <NumberCell muted label={HEADS.ended.label} className={PEOPLE_LAST_CLASS}>
                {row.endedOn}
              </NumberCell>
            </li>
          ))}
        </PeopleTable>
      )}
    </GameBook>
  );
}
