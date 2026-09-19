import { PrismaNeon } from "@prisma/adapter-neon"
import { config } from "dotenv"

import { COACH_PROFILE_DEFAULTS } from "../src/config/coaching"
import { PrismaClient } from "../src/generated/prisma/client"

config({ path: [".env.local", ".env"], quiet: true })

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.")
}

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })

async function main() {
  // Create the coach profile once. Re-running the seed never overwrites edits
  // made from the admin panel.
  const coach = await db.coachProfile.upsert({
    where: { id: "coach" },
    create: { id: "coach", ...COACH_PROFILE_DEFAULTS },
    update: {},
  })
  console.info(`Coach profile ready: ${coach.name}`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
