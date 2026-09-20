import Image, { type ImageProps } from "next/image"

import type { SiteImageData } from "@/config/images"

type SiteImageProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  image: SiteImageData
}

/**
 * A site photo from `siteImages`. Width, height and the blur placeholder come
 * from the static import. Pass `sizes` describing the photo's rendered width so
 * the browser picks the smallest entry in the generated `srcset`.
 */
export function SiteImage({ image, ...props }: SiteImageProps) {
  return <Image src={image.src} alt={image.alt} placeholder="blur" quality={90} {...props} />
}
