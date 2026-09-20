import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import type { SiteImageData } from "@/config/images"

import { GalleryGrid } from "./gallery-grid"

function stub(name: string, width: number, height: number): SiteImageData {
  return {
    src: {
      src: `/${name}.webp`,
      width,
      height,
      blurDataURL: `/${name}.webp`,
      blurWidth: 8,
      blurHeight: 8,
    },
    alt: `${name} photo`,
  }
}

const IMAGES = [stub("first", 1200, 900), stub("second", 900, 1200), stub("third", 1000, 1000)]

describe("GalleryGrid", () => {
  it("renders every photo as its own tile, lazily", () => {
    render(<GalleryGrid images={IMAGES} />)

    const tiles = screen.getAllByRole("button")
    expect(tiles).toHaveLength(IMAGES.length)
    for (const image of IMAGES) {
      expect(screen.getByAltText(image.alt)).toHaveAttribute("loading", "lazy")
    }
  })

  it("opens the chosen photo in the lightbox", async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={IMAGES} />)

    await user.click(screen.getByRole("button", { name: "second photo" }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAccessibleName("Photo 2 of 3")
  })

  it("steps through photos with the arrow keys and wraps around", async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={IMAGES} />)

    await user.click(screen.getByRole("button", { name: "first photo" }))
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Photo 1 of 3")

    await user.keyboard("{ArrowRight}")
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Photo 2 of 3")

    // Back past the start, round to the end.
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Photo 3 of 3")
  })

  it("steps with the on-screen controls too", async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={IMAGES} />)

    await user.click(screen.getByRole("button", { name: "third photo" }))
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Photo 3 of 3")

    await user.click(screen.getByRole("button", { name: "Next photo" }))
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Photo 1 of 3")

    await user.click(screen.getByRole("button", { name: "Previous photo" }))
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Photo 3 of 3")
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    render(<GalleryGrid images={IMAGES} />)

    await user.click(screen.getByRole("button", { name: "first photo" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
