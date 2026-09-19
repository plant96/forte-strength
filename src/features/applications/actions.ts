"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { db } from "@/server/db"

import { sendApplicationEmails } from "./notify"
import { applicationSchema, type ApplicationFormInput } from "./schema"

export type SubmitApplicationResult =
  | { ok: true }
  | {
      ok: false
      message: string
      fieldErrors?: Partial<Record<keyof ApplicationFormInput, string>>
    }

/** Public: saves a coaching application and notifies the coach. */
export async function submitApplication(
  input: ApplicationFormInput,
): Promise<SubmitApplicationResult> {
  const parsed = applicationSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ApplicationFormInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof ApplicationFormInput | undefined
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: "Some answers need another look.", fieldErrors }
  }

  const { isSpam, liftUnit, ...values } = parsed.data
  // Bots fill the hidden honeypot field. Pretend it worked and drop it.
  if (isSpam) return { ok: true }

  try {
    // Ignore accidental double-submits from the same person.
    const duplicate = await db.application.findFirst({
      where: { email: values.email, createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) } },
      select: { id: true },
    })
    if (duplicate) return { ok: true }

    const application = await db.application.create({
      data: { ...values, liftUnit: liftUnit === "kg" ? "KG" : "LB" },
    })

    // Send emails after the response so the applicant isn't kept waiting.
    after(() => sendApplicationEmails(application))
    revalidatePath("/admin", "layout")
    return { ok: true }
  } catch (error) {
    console.error("[applications] Could not save application:", error)
    return {
      ok: false,
      message: "We couldn't save your application. Please try again in a moment.",
    }
  }
}
