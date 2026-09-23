"use client"

import { Loader2Icon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { deleteUser } from "../actions"

/**
 * The only place a user can be deleted from: their own page, behind a confirmation.
 * Deliberately not on the user list — a stray click there should never be able to do this.
 */
export function UserDeletePanel({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [isDeleting, startDelete] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteUser(id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setConfirmOpen(false)
      toast.success(`Deleted ${name}'s account`)
      router.push("/admin/users")
    })
  }

  return (
    <section
      aria-labelledby="danger-zone-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-destructive/30 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="danger-zone-heading"
          className="flex items-center gap-2 font-heading text-lg font-bold text-destructive uppercase"
        >
          <TriangleAlertIcon className="size-4" aria-hidden="true" />
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Deleting this account removes their sign-in, profile and every PR they logged. Anonymous
          analytics and any bug reports they filed stay.
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="h-10 shrink-0">
            <Trash2Icon />
            Delete account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}&apos;s account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes their sign-in, their profile and all of their PR history. They would have
              to sign up again from scratch. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                // Keep the dialog open until the delete finishes.
                event.preventDefault()
                confirmDelete()
              }}
            >
              {isDeleting && <Loader2Icon className="animate-spin" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
