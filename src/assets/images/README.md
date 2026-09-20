# Site photos

`src/config/images.ts` and `src/config/gallery.ts` import these by name, so a missing or
misnamed file is a build error rather than a broken image in production.

| File                             | Used by                            | Ratio      |
| -------------------------------- | ---------------------------------- | ---------- |
| `coach-portrait.webp`            | Landing hero                       | 2:3 tall   |
| `coach-team-trophy.webp`         | Landing "Meet your coach"          | 3:4 tall   |
| `team-collage.webp`              | Landing team grid (large tile)     | 1:1 square |
| `team-state-champions.webp`      | Landing team grid (top right)      | 3:4 tall   |
| `athlete-podium.webp`            | Landing team grid (bottom right)   | 3:4 tall   |
| `gallery/*.webp`                 | `/gallery`, in `config/gallery.ts` | mixed      |
| `gallery/medal-celebration.webp` | Also the application page sidebar  | 3:4 tall   |

The three team-grid tiles are rendered square with `object-cover`, so the two 3:4 photos are
centre-cropped — `object-top` keeps faces and trophies in frame. Everything else renders at its
intrinsic ratio.

These are build inputs, not served files: Next resizes and re-encodes them per request and
serves the result from `/_next/image` under a content-hashed URL. That is why they live here
instead of `public/` — anything in `public/` is also downloadable at full size, unoptimized.

Export each one at **2400px on the long edge** and save as WebP at quality ~92. Beyond that you
are only slowing the build down; Next never serves above its largest device size. Prefer an
unmodified export from Lightroom/Photos over a file you already compressed, since Next does its
own lossy pass and stacking two of them softens detail for no byte savings.
