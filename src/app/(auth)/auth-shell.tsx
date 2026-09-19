import { TMark } from "@/components/brand/t-mark"

/** Centered layout shared by the sign-in and sign-up pages. */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-12 sm:py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-secondary ring-1 ring-foreground/10">
          <TMark className="size-6 text-foreground" />
        </span>
        <h1 className="font-heading text-3xl font-bold uppercase">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}
