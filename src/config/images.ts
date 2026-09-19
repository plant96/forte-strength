/**
 * Site photos. These point at placeholders for now: drop the real photo into
 * /public/images (any name/format) and update its `src` here. Keep roughly the
 * same aspect ratio so layouts don't shift.
 */
export interface SiteImageData {
  src: string
  alt: string
  width: number
  height: number
}

export const siteImages = {
  coachPortrait: {
    src: "/images/placeholders/coach-portrait.svg",
    alt: "Head Coach Tyler Montano",
    width: 800,
    height: 1000,
  },
  coachPlatform: {
    src: "/images/placeholders/coach-platform.svg",
    alt: "Coach Tyler Montano competing on the platform",
    width: 1200,
    height: 900,
  },
  teamMeetDay: {
    src: "/images/placeholders/team-meet-day.svg",
    alt: "Forte Strength athletes at a meet",
    width: 1200,
    height: 900,
  },
  teamTraining: {
    src: "/images/placeholders/team-training.svg",
    alt: "Forte Strength athletes training",
    width: 900,
    height: 900,
  },
  athleteLift: {
    src: "/images/placeholders/athlete-lift.svg",
    alt: "A Forte Strength athlete lifting",
    width: 900,
    height: 900,
  },
  applicationSide: {
    src: "/images/placeholders/application-side.svg",
    alt: "A Forte Strength athlete",
    width: 900,
    height: 1200,
  },
} satisfies Record<string, SiteImageData>
