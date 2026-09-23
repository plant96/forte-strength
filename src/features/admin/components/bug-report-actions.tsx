"use client"

import { ArchiveIcon, ArchiveRestoreIcon, Loader2Icon, Trash2Icon } from "lucide-react"
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
import { deleteBugReport, setBugReportArchived } from "@/features/bug-reports/actions"

interface BugReportActionsProps {
  id: string
  status: "OPEN" | "ARCHIVED"
}

/** Archive an open report; restore or permanently delete an archived one. */
export function BugReportActions({ id, status }: BugReportActionsProps) {
  const [isToggling, startToggle] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const archived = status === "ARCHIVED"

  function toggleArchived() {
    startToggle(async () => {
      const result = await setBugReportArchived(id, !archived)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(archived ? "Restored to open reports" : "Archived")
    })
  }

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteBugReport(id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setConfirmOpen(false)
      toast.success("Bug report deleted")
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={toggleArchived}
        disabled={isToggling}
        variant={archived ? "outline" : "default"}
        size="sm"
        className="h-9"
      >
        {isToggling ? (
          <Loader2Icon className="animate-spin" />
        ) : archived ? (
          <ArchiveRestoreIcon />
        ) : (
          <ArchiveIcon />
        )}
        {archived ? "Restore" : "Archive"}
      </Button>

      {archived && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-9">
              <Trash2Icon />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this bug report?</AlertDialogTitle>
              <AlertDialogDescription>
                It disappears from the archive for good. This can&apos;t be undone.
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
      )}
    </div>
  )
}
