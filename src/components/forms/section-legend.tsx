import { FieldLegend } from "@/components/ui/field"

/** Numbered section heading used by the site's multi-part forms ("01 Your body"). */
export function SectionLegend({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <FieldLegend className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.2em] uppercase">
      <span className="text-primary">{index}</span>
      {children}
    </FieldLegend>
  )
}

/** Taller select trigger to line up with the site's 40px inputs. */
export const SELECT_TRIGGER_CLASS = "data-[size=default]:h-10"
