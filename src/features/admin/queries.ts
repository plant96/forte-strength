import "server-only"

import { cache } from "react"

import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/server/db"

import { PAGE_SIZE, type ApplicationStatusFilter } from "./search-params"

function applicationWhere(
  q: string,
  status: ApplicationStatusFilter,
): Prisma.ApplicationWhereInput {
  const contains = { contains: q, mode: "insensitive" as const }
  return {
    ...(status !== "all" && { status: status === "processed" ? "PROCESSED" : "UNPROCESSED" }),
    ...(q && {
      OR: [
        { fullName: contains },
        { email: contains },
        { instagram: { contains: q.replace(/^@/, ""), mode: "insensitive" } },
        { phone: contains },
        { location: contains },
      ],
    }),
  }
}

/** Deduplicated per request (the layout and overview both need it). */
export const getAdminCounts = cache(async () => {
  const [unprocessed, processed, users, onboarded] = await db.$transaction([
    db.application.count({ where: { status: "UNPROCESSED" } }),
    db.application.count({ where: { status: "PROCESSED" } }),
    db.user.count(),
    db.user.count({ where: { onboardedAt: { not: null } } }),
  ])
  return { unprocessed, processed, applications: unprocessed + processed, users, onboarded }
})

export async function getRecentActivity() {
  const [applications, users] = await db.$transaction([
    db.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        primaryNeed: true,
        primaryNeedOther: true,
        status: true,
        createdAt: true,
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
        createdAt: true,
      },
    }),
  ])
  return { applications, users }
}

export async function listApplications({
  q,
  status,
  page,
}: {
  q: string
  status: ApplicationStatusFilter
  page: number
}) {
  const where = applicationWhere(q, status)
  const [items, unprocessed, processed] = await db.$transaction([
    db.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        email: true,
        location: true,
        primaryNeed: true,
        primaryNeedOther: true,
        readiness: true,
        status: true,
        createdAt: true,
      },
    }),
    // Tab counts respect the search but not the status filter.
    db.application.count({ where: applicationWhere(q, "unprocessed") }),
    db.application.count({ where: applicationWhere(q, "processed") }),
  ])

  const total =
    status === "unprocessed"
      ? unprocessed
      : status === "processed"
        ? processed
        : unprocessed + processed

  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    counts: { unprocessed, processed, all: unprocessed + processed },
  }
}

export type ApplicationListItem = Awaited<ReturnType<typeof listApplications>>["items"][number]

/** One application plus its newer/older neighbours within the current filters. */
export async function getApplicationWithNeighbors(
  id: string,
  { q, status }: { q: string; status: ApplicationStatusFilter },
) {
  const application = await db.application.findUnique({ where: { id } })
  if (!application) return null

  const where = applicationWhere(q, status)
  const [newer, older] = await db.$transaction([
    db.application.findFirst({
      where: { AND: [where, { createdAt: { gt: application.createdAt } }] },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    db.application.findFirst({
      where: { AND: [where, { createdAt: { lt: application.createdAt } }] },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ])

  return { application, newerId: newer?.id ?? null, olderId: older?.id ?? null }
}

export async function listUsers({ q, page }: { q: string; page: number }) {
  const contains = { contains: q, mode: "insensitive" as const }
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ email: contains }, { firstName: contains }, { lastName: contains }] }
    : {}
  const [items, total] = await db.$transaction([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        onboardedAt: true,
        onboardingSkippedAt: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ])
  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export type UserListItem = Awaited<ReturnType<typeof listUsers>>["items"][number]

export function getUserDetail(id: string) {
  return db.user.findUnique({ where: { id }, include: { profile: true } })
}
