"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { useState } from "react"

import { SiteImage } from "@/components/site-image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { SiteImageData } from "@/config/images"

export function GalleryGrid({ images }: { images: SiteImageData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const open = openIndex !== null
  const current = open ? images[openIndex] : undefined

  const step = (delta: number) =>
    setOpenIndex((index) =>
      index === null ? index : (index + delta + images.length) % images.length,
    )

  return (
    <>
      {/*
        CSS columns rather than a grid: these photos run from 9:16 to 3:2, and masonry lets
        every one keep its own ratio instead of being cropped into a uniform cell.

        Every tile keeps Next's default lazy loading. Eager-loading the first few would be
        wrong here: columns fill top-to-bottom, so the first tiles in the DOM are a vertical
        strip of the left column rather than the top row, and which tiles are above the fold
        changes with the breakpoint. Native lazy loading decides by viewport instead of by
        index, and browsers load in-viewport images immediately anyway.
      */}
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <li key={image.src.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="block w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10 transition-colors hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <SiteImage
                image={image}
                sizes="(min-width: 1024px) 368px, (min-width: 640px) calc(50vw - 28px), calc(100vw - 32px)"
                className="h-auto w-full"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={(next) => !next && setOpenIndex(null)}>
        <DialogContent
          className="max-h-[92dvh] gap-3 p-3 sm:max-w-4xl sm:p-4"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") step(-1)
            if (event.key === "ArrowRight") step(1)
          }}
        >
          <DialogTitle className="sr-only">
            {open ? `Photo ${openIndex + 1} of ${images.length}` : ""}
          </DialogTitle>
          {current && (
            <SiteImage
              image={current}
              quality={90}
              sizes="(min-width: 640px) 896px, calc(100vw - 56px)"
              className="h-auto max-h-[74dvh] w-full rounded-lg object-contain"
            />
          )}
          <div className="flex items-center justify-between gap-4 pr-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous photo"
              onClick={() => step(-1)}
            >
              <ArrowLeftIcon />
            </Button>
            <p className="text-xs text-muted-foreground" aria-hidden="true">
              {open ? `${openIndex + 1} / ${images.length}` : ""}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next photo"
              onClick={() => step(1)}
            >
              <ArrowRightIcon />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
