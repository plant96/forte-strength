import type { StaticImageData } from "next/image"

import medalCelebration from "@/assets/images/gallery/medal-celebration.webp"
import athletePodium from "@/assets/images/athlete-podium.webp"
import coachPortrait from "@/assets/images/coach-portrait.webp"
import coachTeamTrophy from "@/assets/images/coach-team-trophy.webp"
import teamCollage from "@/assets/images/team-collage.webp"
import teamStateChampions from "@/assets/images/team-state-champions.webp"

/**
 * Site photos. Each one is a static import from `src/assets/images`, so its
 * dimensions and blur placeholder are read from the file at build time and the
 * URL is content-hashed. To swap a photo, overwrite the file — nothing here
 * changes. Keep roughly the same aspect ratio so layouts don't shift.
 */
export interface SiteImageData {
  src: StaticImageData
  alt: string
}

export const siteImages = {
  coachPortrait: {
    src: coachPortrait,
    alt: "Head Coach Tyler Montano driving out of a squat at a USA Powerlifting meet",
  },
  coachTeamTrophy: {
    src: coachTeamTrophy,
    alt: "Coach Tyler Montano and the Forte Strength team with their first-place team trophy",
  },
  teamCollage: {
    src: teamCollage,
    alt: "Four moments from Forte Strength meet days: teammates on the platform, medals and gym sessions",
  },
  teamStateChampions: {
    src: teamStateChampions,
    alt: "Two Forte Strength athletes holding the first-place team trophy at the Florida State Championship",
  },
  athletePodium: {
    src: athletePodium,
    alt: "A Forte Strength athlete on the podium with a first-place medal and a Best Raw trophy at Bench Nationals",
  },
  // Shared with the gallery rather than duplicated — one file, two placements.
  applicationSide: {
    src: medalCelebration,
    alt: "A Forte Strength athlete flexing with a medal in front of a USA Powerlifting backdrop",
  },
} satisfies Record<string, SiteImageData>
