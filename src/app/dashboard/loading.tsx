import { Skeleton } from "@/components/ui/skeleton"

/** The dashboard's shape while Clerk and the PR query resolve, so nothing jumps. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-72 sm:h-20 sm:w-96" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-[17rem] w-full rounded-2xl sm:h-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
