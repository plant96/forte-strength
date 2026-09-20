import Image from "next/image"

/**
 * The shared frame every page under `/tools` sits in: brand mark, title, blurb.
 *
 * This is a component rather than a `layout.tsx` because a layout cannot see the
 * page's own title — each tool passes its own.
 */
export function ToolShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 flex flex-col items-center gap-6 text-center sm:mb-12">
        <Image
          src="/brand/forte-strength-logo.png"
          alt="Forte Strength Systems"
          width={1080}
          height={589}
          preload
          sizes="(min-width: 640px) 224px, 176px"
          className="h-auto w-44 drop-shadow-[0_0_28px_oklch(0.585_0.215_22/0.25)] sm:w-56"
        />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-heading text-4xl font-bold tracking-tight uppercase sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base text-balance text-muted-foreground">{description}</p>
        </div>
      </header>

      {children}

      {footer && <div className="mt-16 sm:mt-20">{footer}</div>}
    </div>
  )
}
