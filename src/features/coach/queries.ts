import "server-only"

import { unstable_rethrow } from "next/navigation"
import { cache } from "react"

import { COACH_PROFILE_DEFAULTS, type CoachProfileData } from "@/config/coaching"
import { db } from "@/server/db"

export const COACH_PROFILE_ID = "coach"

/**
 * The coach profile shown across the site (records, bio, reach).
 * Falls back to the defaults if the database is unavailable or not seeded yet.
 */
export const getCoachProfile = cache(async (): Promise<CoachProfileData> => {
  try {
    const row = await db.coachProfile.findUnique({ where: { id: COACH_PROFILE_ID } })
    if (!row) return COACH_PROFILE_DEFAULTS
    return {
      name: row.name,
      title: row.title,
      credentials: row.credentials,
      yearsExperience: row.yearsExperience,
      bio: row.bio,
      worldRecords: row.worldRecords,
      americanRecords: row.americanRecords,
      stateRecords: row.stateRecords,
      homeBase: row.homeBase,
      reach: row.reach,
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error("[coach] Using default coach profile:", error)
    return COACH_PROFILE_DEFAULTS
  }
})
