interface SectionBlockProps {
  id: string
  step?: number
  title: string
  description?: string
  children: React.ReactNode
}

/** A titled block of the calculations panel; the jump nav scrolls to its `breakdown-<id>`. */
export function SectionBlock({ id, step, title, description, children }: SectionBlockProps) {
  return (
    <section
      id={`breakdown-${id}`}
      aria-labelledby={`breakdown-${id}-title`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        {step !== undefined && (
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-primary uppercase">
            Step {step}
          </p>
        )}
        <h3 id={`breakdown-${id}-title`} className="font-heading text-2xl font-bold uppercase">
          {title}
        </h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}
