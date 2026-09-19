import { cn } from "cn"

interface SectionHeadingProps {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  id?: string
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-heading text-3xl leading-[1.05] font-bold text-balance uppercase sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
