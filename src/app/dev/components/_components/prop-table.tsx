import { PropCode } from "./prop-code";

export type PropRow = { name: string; values: string; notes: string };

export function PropTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-small">
        <thead>
          <tr>
            <th className="pr-4 pb-3 font-medium text-game-muted text-xs">Prop</th>
            <th className="pr-4 pb-3 font-medium text-game-muted text-xs">Values</th>
            <th className="pb-3 font-medium text-game-muted text-xs">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-game-border border-t">
              <td className="py-3.5 pr-4 align-top">
                <PropCode>{row.name}</PropCode>
              </td>
              <td className="py-3.5 pr-4 align-top">{row.values}</td>
              <td className="py-3.5 align-top text-game-muted">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
