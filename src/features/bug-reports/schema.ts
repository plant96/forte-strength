import { z } from "zod"

import { createFormReader } from "@/lib/forms/reader"

export const BUG_DESCRIPTION_MIN = 10
export const BUG_DESCRIPTION_MAX = 2000
const EMAIL_MAX = 200
const PATH_MAX = 500

/** Raw footer form state. `website` is a honeypot: hidden from people, filled in by bots. */
export interface BugReportFormInput {
  description: string
  email: string
  path: string
  website: string
}

export const BUG_REPORT_DEFAULTS: BugReportFormInput = {
  description: "",
  email: "",
  path: "/",
  website: "",
}

export interface BugReportValues {
  description: string
  /** Null when left blank (signed-in reporters are identified by their account instead). */
  email: string | null
  path: string
  isSpam: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const bugReportSchema = z
  .object({
    description: z.string(),
    email: z.string(),
    path: z.string(),
    website: z.string(),
  })
  .transform((raw, ctx): BugReportValues => {
    const reader = createFormReader(raw, ctx)

    const description = reader.text("description", {
      label: "Description",
      min: BUG_DESCRIPTION_MIN,
      max: BUG_DESCRIPTION_MAX,
      requiredMessage: "Tell us what went wrong",
    })

    const email = raw.email.trim()
    if (email.length > EMAIL_MAX || (email && !EMAIL_PATTERN.test(email))) {
      reader.fail("email", "Enter a valid email address")
    }

    const trimmedPath = raw.path.trim()
    const path = trimmedPath.startsWith("/") && !trimmedPath.startsWith("//") ? trimmedPath : "/"

    if (!reader.valid) return z.NEVER
    return {
      description,
      email: email || null,
      path: path.slice(0, PATH_MAX),
      isSpam: raw.website.trim().length > 0,
    }
  })
