import { Tex } from "@/components/math/tex"

import { GLOSSARY, GLOSSARY_ORDER } from "../../lib/glossary"

export function VariableGlossary() {
  return (
    <dl className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {GLOSSARY_ORDER.map((id) => {
        const entry = GLOSSARY[id]
        return (
          <div key={id} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 px-4 py-3">
            <dt className="text-base text-highlight">
              <Tex math={entry.tex} />
            </dt>
            <dd className="flex flex-col gap-1.5">
              <span className="font-medium">{entry.name}</span>
              <span className="text-sm text-muted-foreground">{entry.meaning}</span>
              <span className="flex flex-wrap gap-1.5 text-[0.7rem] text-muted-foreground">
                <span className="rounded-full bg-muted/60 px-2 py-0.5">Unit: {entry.unit}</span>
                <span className="rounded-full bg-muted/60 px-2 py-0.5">Range: {entry.range}</span>
              </span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
