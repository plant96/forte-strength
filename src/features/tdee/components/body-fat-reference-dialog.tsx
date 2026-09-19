"use client"

import { ImageIcon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function BodyFatReferenceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 shrink-0">
          <ImageIcon />
          Visual reference
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] gap-4 overflow-y-auto p-4 sm:max-w-4xl sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
            Body fat visual reference
          </DialogTitle>
          <DialogDescription>
            Pick the figure closest to your build: men on the top row, women on the bottom. Within a
            few percent is close enough.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Image
            src="/images/bf-visual-reference.webp"
            alt="Body fat percentage chart. Men from 5–9% to over 40%, women from 10–14% to over 45%."
            width={1600}
            height={1200}
            sizes="(min-width: 640px) 848px, 720px"
            className="h-auto w-180 max-w-none rounded-lg sm:w-full sm:max-w-full"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:hidden">
          Scroll sideways to see every range.
        </p>
      </DialogContent>
    </Dialog>
  )
}
