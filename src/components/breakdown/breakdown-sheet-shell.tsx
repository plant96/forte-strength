"use client"

import { SigmaIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { BREAKDOWN_SCROLL_ID } from "./jump-nav"

interface BreakdownSheetShellProps {
  title: string
  description?: string
  /** Called when the trigger is hovered or focused, to start loading the heavy content early. */
  onPreload?: () => void
  children: React.ReactNode
}

/** The "View the calculations" button and the side panel it opens. */
export function BreakdownSheetShell({
  title,
  description = "Every formula with your numbers filled in, step by step. Highlighted values are yours.",
  onPreload,
  children,
}: BreakdownSheetShellProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 w-full gap-2 text-sm font-semibold"
          onPointerEnter={onPreload}
          onFocus={onPreload}
        >
          <SigmaIcon className="text-primary" />
          View the calculations
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
          <SheetTitle className="font-heading text-xl font-bold tracking-wide uppercase">
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div id={BREAKDOWN_SCROLL_ID} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Pulse skeletons shown while the KaTeX-heavy content loads. */
export function BreakdownLoading() {
  return (
    <div className="flex flex-col gap-4 p-5" aria-busy="true" aria-label="Loading calculations">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl bg-muted/50" />
      ))}
    </div>
  )
}
