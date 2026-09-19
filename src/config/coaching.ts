/**
 * Default coach profile. The live values are stored in the database and edited
 * from the admin panel; these seed the database and act as a fallback.
 */
export const COACH_PROFILE_DEFAULTS = {
  name: "Tyler Montano",
  title: "Head Coach",
  credentials: "Competitive powerlifter · Certified personal trainer",
  yearsExperience: 4,
  bio: "Tyler Montano is a competitive powerlifter and certified personal trainer who leads Forte Strength Systems. He builds individualized programs around each athlete's goals, whether that's a first meet, a new total or a spot at Nationals and Worlds.",
  worldRecords: 2,
  americanRecords: 11,
  stateRecords: 38,
  homeBase: "Orlando, FL",
  reach: ["12 states", "the UK", "Romania", "Canada", "the Middle East"],
}

export type CoachProfileData = typeof COACH_PROFILE_DEFAULTS

/** Record counts as display tiles. */
export function coachRecords(profile: CoachProfileData) {
  return [
    { value: `${profile.worldRecords}×`, label: "World records" },
    { value: `${profile.americanRecords}×`, label: "American records" },
    { value: `${profile.stateRecords}`, label: "State records and counting" },
  ]
}

/** "Based in Orlando, FL, with lifters across 12 states, the UK, …" */
export function coachReachSentence(profile: CoachProfileData) {
  const reach = profile.reach
  const list =
    reach.length <= 1
      ? (reach[0] ?? "")
      : `${reach.slice(0, -1).join(", ")} and ${reach[reach.length - 1]}`
  return list
    ? `Based in ${profile.homeBase}, with lifters across ${list}.`
    : `Based in ${profile.homeBase}.`
}
