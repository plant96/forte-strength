import "katex/dist/katex.min.css"

import { cn } from "cn"
import katex, { type KatexOptions } from "katex"

const OPTIONS: KatexOptions = {
  throwOnError: false,
  output: "htmlAndMathml",
  // `\val{…}` highlights a user-supplied number (styled by `.fx-val` in globals.css).
  macros: { "\\val": "\\htmlClass{fx-val}{#1}" },
  trust: (context) => context.command === "\\htmlClass",
  strict: (errorCode: string) => (errorCode === "htmlExtension" ? "ignore" : "warn"),
}

interface TexProps {
  math: string
  /** Block (display) math instead of inline. */
  block?: boolean
  className?: string
}

/** Renders TeX with KaTeX. Only pass TeX built by our own code. */
export function Tex({ math, block = false, className }: TexProps) {
  const html = katex.renderToString(math, { ...OPTIONS, displayMode: block })

  if (block) {
    return (
      <div
        className={cn("tex-block overflow-x-auto overflow-y-hidden py-1", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
