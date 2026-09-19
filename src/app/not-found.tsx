import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-heading text-sm font-semibold tracking-[0.3em] text-primary uppercase">
        404
      </p>
      <h1 className="font-heading text-4xl font-bold uppercase">Page not found</h1>
      <p className="text-muted-foreground">
        That page doesn&apos;t exist, or it hasn&apos;t been built yet.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/tdee-calculator">Go to the TDEE calculator</Link>
      </Button>
    </div>
  )
}
