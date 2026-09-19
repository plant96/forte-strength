import { z } from "zod"

import type { CoachProfileData } from "@/config/coaching"
import { createFormReader } from "@/lib/forms/reader"

/** Coach profile form state (numbers as strings, reach as one comma-separated line). */
export interface CoachProfileFormInput {
  name: string
  title: string
  credentials: string
  yearsExperience: string
  bio: string
  worldRecords: string
  americanRecords: string
  stateRecords: string
  homeBase: string
  reach: string
}

export function coachProfileToFormInput(profile: CoachProfileData): CoachProfileFormInput {
  return {
    name: profile.name,
    title: profile.title,
    credentials: profile.credentials,
    yearsExperience: String(profile.yearsExperience),
    bio: profile.bio,
    worldRecords: String(profile.worldRecords),
    americanRecords: String(profile.americanRecords),
    stateRecords: String(profile.stateRecords),
    homeBase: profile.homeBase,
    reach: profile.reach.join(", "),
  }
}

/** "12 states, the UK; Canada" → ["12 states", "the UK", "Canada"] */
export function parseReach(text: string) {
  return text
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export const coachProfileSchema = z
  .object({
    name: z.string(),
    title: z.string(),
    credentials: z.string(),
    yearsExperience: z.string(),
    bio: z.string(),
    worldRecords: z.string(),
    americanRecords: z.string(),
    stateRecords: z.string(),
    homeBase: z.string(),
    reach: z.string(),
  })
  .transform((raw, ctx): CoachProfileData => {
    const read = createFormReader(raw, ctx)
    const record = (field: "worldRecords" | "americanRecords" | "stateRecords", label: string) =>
      read.number(field, {
        label,
        integer: true,
        min: 0,
        max: 9999,
        requiredMessage: "Enter a number",
      })

    const profile = {
      name: read.text("name", { label: "Name", max: 80 }),
      title: read.text("title", { label: "Title", max: 60 }),
      credentials: read.text("credentials", { label: "Credentials", max: 160 }),
      yearsExperience: read.number("yearsExperience", {
        label: "Years",
        integer: true,
        min: 0,
        max: 80,
        requiredMessage: "Enter a number",
      }),
      bio: read.text("bio", { label: "Bio", max: 1500 }),
      worldRecords: record("worldRecords", "World records"),
      americanRecords: record("americanRecords", "American records"),
      stateRecords: record("stateRecords", "State records"),
      homeBase: read.text("homeBase", { label: "Home base", max: 80 }),
      reach: parseReach(raw.reach),
    }

    if (profile.reach.length > 12) read.fail("reach", "List up to 12 places")
    if (profile.reach.some((place) => place.length > 40)) {
      read.fail("reach", "Keep each place under 40 characters")
    }

    return read.valid ? profile : z.NEVER
  })
