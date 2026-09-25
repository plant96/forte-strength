import { Tex } from "@/components/math/tex"
import type { BreakdownInputRow, GlossaryEntry } from "@/lib/breakdown/types"

interface InputsTableProps<S extends string> {
  rows: BreakdownInputRow<S>[]
  glossary: Record<S, GlossaryEntry>
}

/** What the user entered next to the values the formulas actually use. */
export function InputsTable<S extends string>({ rows, glossary }: InputsTableProps<S>) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Input
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              You entered
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Used in formulas
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-4 py-2.5 text-left font-medium">
                {row.label}
              </th>
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{row.entered}</td>
              <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                {row.symbol && (
                  <span className="mr-1 text-muted-foreground">
                    <Tex math={glossary[row.symbol].tex} /> =
                  </span>
                )}
                <span className="font-semibold text-highlight">{row.used}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
