import "server-only"

import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "@/generated/prisma/client"

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.")
  }
  const client = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })
  globalForPrisma.prisma = client
  return client
}

/**
 * The Prisma client. It connects on first use, so importing this module never
 * fails; a missing DATABASE_URL only errors when a query actually runs.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient()
    const value: unknown = Reflect.get(client, property)
    return typeof value === "function" ? value.bind(client) : value
  },
})
