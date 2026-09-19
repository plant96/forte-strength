import Image, { type ImageProps } from "next/image"

import type { SiteImageData } from "@/config/images"

type SiteImageProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  image: SiteImageData
}

/** A site photo from `siteImages`. SVG placeholders skip the image optimizer. */
export function SiteImage({ image, ...props }: SiteImageProps) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      unoptimized={image.src.endsWith(".svg")}
      {...props}
    />
  )
}
