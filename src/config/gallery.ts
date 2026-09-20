import benchPressMeet from "@/assets/images/gallery/bench-press-meet.webp"
import deadliftNationals from "@/assets/images/gallery/deadlift-nationals.webp"
import medalCelebration from "@/assets/images/gallery/medal-celebration.webp"
import podiumSweep from "@/assets/images/gallery/podium-sweep.webp"
import podiumThree from "@/assets/images/gallery/podium-three.webp"
import teamMeetDay from "@/assets/images/gallery/team-meet-day.webp"
import teamMoments1 from "@/assets/images/gallery/team-moments-1.webp"
import teamMoments2 from "@/assets/images/gallery/team-moments-2.webp"
import teamMoments3 from "@/assets/images/gallery/team-moments-3.webp"
import teamMoments4 from "@/assets/images/gallery/team-moments-4.webp"
import teamMoments5 from "@/assets/images/gallery/team-moments-5.webp"
import teammatesBackdrop from "@/assets/images/gallery/teammates-backdrop.webp"
import trophyAndMedal from "@/assets/images/gallery/trophy-and-medal.webp"
import trophyOverhead from "@/assets/images/gallery/trophy-overhead.webp"
import trophyPowerliftingAmerica from "@/assets/images/gallery/trophy-powerlifting-america.webp"
import warmupRoom from "@/assets/images/gallery/warmup-room.webp"

import type { SiteImageData } from "./images"

/**
 * Meet-day and training photos for `/gallery`, in display order. The grid is
 * masonry, so mixed aspect ratios are fine — order these for visual rhythm
 * rather than grouping all the portraits together.
 */
export const galleryImages: SiteImageData[] = [
  {
    src: teamMeetDay,
    alt: "The Forte Strength team together in the venue after a meet, medals around their necks and the team trophy held up",
  },
  {
    src: deadliftNationals,
    alt: "A Forte Strength athlete locking out a deadlift on the platform at USA Powerlifting Raw Nationals",
  },
  {
    src: trophyPowerliftingAmerica,
    alt: "Two Forte Strength lifters with a trophy in front of a Powerlifting America backdrop",
  },
  {
    src: podiumSweep,
    alt: "Three Forte Strength athletes standing on the podium with their medals at a USA Powerlifting meet",
  },
  {
    src: benchPressMeet,
    alt: "A Forte Strength athlete pressing a bench attempt at a meet with spotters either side",
  },
  {
    src: teamMoments1,
    alt: "Four meet-day moments: teammates posing with medals and celebrating together",
  },
  {
    src: trophyOverhead,
    alt: "A Forte Strength athlete raising a trophy overhead on the podium",
  },
  {
    src: teammatesBackdrop,
    alt: "Two Forte Strength teammates in front of a USA Powerlifting backdrop after competing",
  },
  {
    src: teamMoments2,
    alt: "Four moments from a meet weekend: the team in the gym, on the platform and with their medals",
  },
  {
    src: warmupRoom,
    alt: "A Forte Strength lifter in a singlet getting ready in the warm-up room before an attempt",
  },
  {
    src: medalCelebration,
    alt: "A Forte Strength athlete flexing with a medal in front of a USA Powerlifting backdrop",
  },
  {
    src: teamMoments3,
    alt: "Four snapshots of the team: squats, deadlifts and podium finishes",
  },
  {
    src: trophyAndMedal,
    alt: "Two Forte Strength athletes with a first-place team trophy and a medal at a USA Powerlifting meet",
  },
  {
    src: podiumThree,
    alt: "Three Forte Strength lifters on the podium with medals after a USA Powerlifting meet",
  },
  {
    src: teamMoments4,
    alt: "Four moments from the team's meet days: teammates, medals and lifts on the platform",
  },
  {
    src: teamMoments5,
    alt: "Four more moments from Forte Strength meet days and training sessions",
  },
]
