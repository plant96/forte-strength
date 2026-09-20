"use client"

import { Loader2Icon, UserRoundMinusIcon, UserRoundPlusIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { setUserClient } from "../actions"

/** Marks a website user as a coaching client, or takes that back. No confirmation: it's reversible. */
export function UserClientToggle({ id, client }: { id: string; client: boolean }) {
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const result = await setUserClient(id, !client)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(client ? "No longer a client" : "Marked as a client")
    })
  }

  return (
    <Button
      onClick={toggle}
      disabled={isPending}
      variant={client ? "outline" : "default"}
      className="h-10"
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" />
      ) : client ? (
        <UserRoundMinusIcon />
      ) : (
        <UserRoundPlusIcon />
      )}
      {client ? "Remove client" : "Make client"}
    </Button>
  )
}
