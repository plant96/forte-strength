import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  isEnabled: vi.fn(),
  sendEmail: vi.fn(),
  userCount: vi.fn(),
  userFindUnique: vi.fn(),
  milestoneFindMany: vi.fn(),
  milestoneCreateMany: vi.fn(),
}))

vi.mock("./queries", () => ({ isNotificationEnabled: mocks.isEnabled }))
vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
  siteUrl: () => "https://fortestrength.org",
}))
vi.mock("@/server/db", () => ({
  db: {
    user: { count: mocks.userCount, findUnique: mocks.userFindUnique },
    notificationMilestone: {
      findMany: mocks.milestoneFindMany,
      createMany: mocks.milestoneCreateMany,
    },
  },
}))

import { checkUserMilestones, notifyClientPr, notifyUserSignedUp } from "./notify"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isEnabled.mockResolvedValue(true)
  mocks.sendEmail.mockResolvedValue({ skipped: false, id: "email-1" })
  mocks.milestoneFindMany.mockResolvedValue([])
  mocks.milestoneCreateMany.mockImplementation(async ({ data }: { data: unknown[] }) => ({
    count: data.length,
  }))
})

describe("sendNotification", () => {
  it("does nothing when the toggle is off", async () => {
    mocks.isEnabled.mockResolvedValue(false)
    const sent = await notifyUserSignedUp({
      id: "u1",
      email: "sam@example.com",
      firstName: "Sam",
      lastName: null,
      createdAt: new Date(),
    })
    expect(sent).toBe(false)
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("emails the coach with a subject naming the person", async () => {
    const sent = await notifyUserSignedUp({
      id: "u1",
      email: "sam@example.com",
      firstName: "Sam",
      lastName: "Lee",
      createdAt: new Date(),
    })
    expect(sent).toBe(true)
    expect(mocks.isEnabled).toHaveBeenCalledWith("user-signed-up")
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "Tym.26911@gmail.com", subject: "New sign-up: Sam Lee" }),
    )
  })

  it("never throws when sending fails", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("Resend down"))
    await expect(
      notifyUserSignedUp({
        id: "u1",
        email: "sam@example.com",
        firstName: null,
        lastName: null,
        createdAt: new Date(),
      }),
    ).resolves.toBe(false)
  })
})

describe("checkUserMilestones", () => {
  it("records every threshold passed and emails only the highest", async () => {
    mocks.userCount.mockResolvedValue(120)
    await checkUserMilestones()

    expect(mocks.milestoneCreateMany).toHaveBeenCalledWith({
      data: [10, 20, 50, 100].map((threshold) => ({ kind: "USERS", threshold })),
      skipDuplicates: true,
    })
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Milestone: 100 website users" }),
    )
  })

  it("stays quiet once a threshold has been recorded", async () => {
    mocks.userCount.mockResolvedValue(120)
    mocks.milestoneFindMany.mockResolvedValue([10, 20, 50, 100].map((threshold) => ({ threshold })))
    await checkUserMilestones()
    expect(mocks.milestoneCreateMany).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("lets the request that lost the insert race stay silent", async () => {
    mocks.userCount.mockResolvedValue(10)
    mocks.milestoneCreateMany.mockResolvedValue({ count: 0 })
    await checkUserMilestones()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("does not even count when the toggle is off", async () => {
    mocks.isEnabled.mockResolvedValue(false)
    mocks.userCount.mockResolvedValue(10_000)
    await checkUserMilestones()
    expect(mocks.milestoneCreateMany).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })
})

describe("notifyClientPr", () => {
  const input = {
    athleteId: "u1",
    exerciseName: "Deadlift",
    shape: { kind: "one-rep-max" as const, sets: 1, reps: 1 },
    weightKg: 250,
    previousKg: 240,
  }

  it("skips athletes who are not coaching clients", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "u1",
      email: "admin@example.com",
      firstName: "Ty",
      lastName: null,
      liftUnit: "KG",
      clientSince: null,
    })
    expect(await notifyClientPr(input)).toBe(false)
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("names the lift and the weight in the athlete's unit", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "u1",
      email: "sam@example.com",
      firstName: "Sam",
      lastName: "Lee",
      liftUnit: "KG",
      clientSince: new Date(),
    })
    expect(await notifyClientPr(input)).toBe(true)
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "PR: Sam Lee hit 250 kg on Deadlift 1 Rep Max" }),
    )
  })
})
