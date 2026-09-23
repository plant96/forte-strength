"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { after } from "next/server"

import type { AdminActionResult } from "@/features/admin/actions"
import { notifyBugReport } from "@/features/notifications/notify"
import { getCurrentUser, requireAdmin } from "@/server/auth"
import { db } from "@/server/db"

import { bugReportSchema, type BugReportFormInput } from "./schema"

export type SubmitBugReportResult =
  | { ok: true }
  | {
      ok: false
      message: string
      fieldErrors?: Partial<Record<keyof BugReportFormInput, string>>
    }

/** Public: files a bug report from the footer. Signed-in reporters are identified by account. */
export async function submitBugReport(input: BugReportFormInput): Promise<SubmitBugReportResult> {
  const parsed = bugReportSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof BugReportFormInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof BugReportFormInput | undefined
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: "Check the report and try again.", fieldErrors }
  }

  const { isSpam, ...values } = parsed.data
  // Bots fill the hidden honeypot field. Pretend it worked and drop it.
  if (isSpam) return { ok: true }

  let user: Awaited<ReturnType<typeof getCurrentUser>> = null
  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error("[bug-reports] Could not load the reporter; filing anonymously:", error)
  }
  const email = user?.email ?? values.email
  // Read on the server so a report can't claim to come from a browser it didn't.
  const userAgent = (await headers()).get("user-agent")?.slice(0, 500) ?? null

  try {
    // Ignore an accidental double-submit from the same person.
    const duplicate = await db.bugReport.findFirst({
      where: {
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
        ...(user ? { userId: user.id } : email ? { email } : { description: values.description }),
      },
      select: { id: true },
    })
    if (duplicate) return { ok: true }

    const report = await db.bugReport.create({
      data: {
        description: values.description,
        path: values.path,
        userAgent,
        userId: user?.id ?? null,
        email,
      },
    })
    after(() => notifyBugReport(report))
  } catch (error) {
    console.error("[bug-reports] Could not save the report:", error)
    return { ok: false, message: "We couldn't send that. Please try again in a moment." }
  }

  revalidatePath("/admin", "layout")
  return { ok: true }
}

export async function setBugReportArchived(
  id: string,
  archived: boolean,
): Promise<AdminActionResult> {
  await requireAdmin()
  try {
    await db.bugReport.update({
      where: { id },
      data: archived
        ? { status: "ARCHIVED", archivedAt: new Date() }
        : { status: "OPEN", archivedAt: null },
    })
  } catch (error) {
    console.error("[bug-reports] Could not update the report:", error)
    return { ok: false, message: "Couldn't update the report. It may have been deleted." }
  }
  revalidatePath("/admin", "layout")
  return { ok: true }
}

/** Only archived reports can be deleted: dealing with a bug comes before forgetting it. */
export async function deleteBugReport(id: string): Promise<AdminActionResult> {
  await requireAdmin()
  try {
    await db.bugReport.delete({ where: { id, status: "ARCHIVED" } })
  } catch (error) {
    console.error("[bug-reports] Could not delete the report:", error)
    return {
      ok: false,
      message: "Couldn't delete the report. It may already be gone, or it hasn't been archived.",
    }
  }
  revalidatePath("/admin", "layout")
  return { ok: true }
}
