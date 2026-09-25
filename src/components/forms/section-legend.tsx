import { FieldLegend } from "@/components/ui/field"

const LEGEND_CLASS =
  "flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.2em] uppercase"

/** Numbered section heading used by the site's multi-part forms ("01 Your body"). */
export function SectionLegend({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <FieldLegend className={LEGEND_CLASS}>
      <span className="text-primary">{index}</span>
      {children}
    </FieldLegend>
  )
}

interface SectionLegendRowProps {
  /** Give the enclosing `FieldSet` `aria-labelledby={id}` so it's still named by the heading. */
  id: string
  index: string
  children: React.ReactNode
  /** Something small to sit on the right of the heading, e.g. an account prompt. */
  aside?: React.ReactNode
}

/**
 * The numbered heading as a row with room for something on the right.
 *
 * This renders no `<legend>`: a legend can't share its row with a sibling, and everything
 * inside one becomes the group's accessible name. The `id` lets the fieldset point at just
 * the heading text instead.
 */
export function SectionLegendRow({ id, index, children, aside }: SectionLegendRowProps) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span id={id} className={LEGEND_CLASS}>
        <span className="text-primary">{index}</span>
        {children}
      </span>
      {aside}
    </div>
  )
}

/** Taller select trigger to line up with the site's 40px inputs. */
export const SELECT_TRIGGER_CLASS = "data-[size=default]:h-10"
