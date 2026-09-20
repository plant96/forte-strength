import type { Metadata } from "next"

import { CoachingCta } from "@/components/marketing/coaching-cta"
import { Reveal } from "@/components/motion/reveal"
import { galleryImages } from "@/config/gallery"
import { GalleryGrid } from "@/features/gallery/components/gallery-grid"

const description =
  "Meet days, podiums and platform lifts from the Forte Strength team. Every photo is one of our athletes."

export const metadata: Metadata = {
  title: "Gallery",
  description,
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Gallery | Forte Strength Systems",
    description,
    url: "/gallery",
  },
}

export default function GalleryPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Reveal>
        <header className="mb-10 flex flex-col gap-4 sm:mb-12">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            Gallery
          </p>
          <h1 className="font-heading text-4xl leading-[1.02] font-extrabold text-balance uppercase sm:text-5xl">
            Meet days on the platform
          </h1>
          <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            {description}
          </p>
        </header>
      </Reveal>

      <GalleryGrid images={galleryImages} />

      <div className="mt-16 sm:mt-20">
        <CoachingCta />
      </div>
    </div>
  )
}
