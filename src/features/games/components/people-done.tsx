import { CountChip } from "@/shared/components/game/count-chip";
import { GameBook } from "@/shared/components/game/game-book";
import { gameCn } from "@/shared/components/game/game-cn";
import type { DoneRowView } from "../lib/people-view";
import { PeopleEmpty } from "./people-empty";
import { PEOPLE_HOVER_GROUP, PEOPLE_ROW_CLASS, PeopleTable } from "./people-table";
import { NumberCell, PersonCell, RoleTag, TeamTag, WelcomerCell } from "./person-cell";

/** Finished missions, most recently ended first. */
export function PeopleDone({ rows }: { rows: readonly DoneRowView[] }) {
  return (
    <GameBook as="section" className="people--done items-stretch gap-0 p-4 text-left md:p-6">
      {rows.length === 0 ? (
        <PeopleEmpty
          title="Nothing here yet"
          text="Finished missions land here, found or revealed."
        />
      ) : (
        <PeopleTable
          heads={[
            { label: "Player" },
            { label: "Role" },
            { label: "Team" },
            { label: "Welcomed by" },
            { label: "Result" },
            { label: "Ended", end: true },
          ]}
        >
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
              <WelcomerCell name={row.welcomer} />
              <div>
                <CountChip size="row" variant={row.outcome.found ? "found" : "soft"}>
                  {row.outcome.label}
                </CountChip>
              </div>
              <NumberCell muted>{row.endedOn}</NumberCell>
            </li>
          ))}
        </PeopleTable>
      )}
    </GameBook>
  );
}
