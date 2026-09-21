import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shown while the route's own data loads.
 *
 * Switching panels no longer navigates, so this only covers the first arrival — but that
 * one still waits on Clerk and three Neon queries, and a blank page for a second reads as
 * a broken link. The shape matches what lands, so nothing jumps when it does.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 flex flex-col items-center gap-6 sm:mb-12">
        <Skeleton className="h-[7.5rem] w-44 sm:w-56" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-2xl sm:mx-auto sm:w-80" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  )
}
