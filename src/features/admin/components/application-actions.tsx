"use client"

import { CheckIcon, Loader2Icon, RotateCcwIcon, Trash2Icon } from "lucide-react"
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

import { deleteApplication, setApplicationProcessed } from "../actions"

interface ApplicationActionsProps {
  id: string
  name: string
  processed: boolean
  /** Where to go after deleting (the list, with the same filters). */
  backHref: string
}

export function ApplicationActions({ id, name, processed, backHref }: ApplicationActionsProps) {
  const router = useRouter()
  const [isToggling, startToggle] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function toggleProcessed() {
    startToggle(async () => {
      const result = await setApplicationProcessed(id, !processed)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(processed ? "Marked as unprocessed" : "Marked as processed")
    })
  }

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteApplication(id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setConfirmOpen(false)
      toast.success(`Deleted ${name}'s application`)
      router.push(backHref)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={toggleProcessed}
        disabled={isToggling}
        variant={processed ? "outline" : "default"}
        className="h-10"
      >
        {isToggling ? (
          <Loader2Icon className="animate-spin" />
        ) : processed ? (
          <RotateCcwIcon />
        ) : (
          <CheckIcon />
        )}
        {processed ? "Mark as unprocessed" : "Mark as processed"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="h-10">
            <Trash2Icon />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}&apos;s application?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the application and all of its answers. This can&apos;t be
              undone.
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
    </div>
  )
}
