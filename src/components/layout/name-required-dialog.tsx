"use client"

import { Loader2Icon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { NameForm } from "@/features/profile/components/name-form"
import type { NameFormInput } from "@/features/profile/schema"

const stay = (event: Event) => event.preventDefault()

/**
 * The one dialog on the site that can't be dismissed: an account with no first and
 * last name has to supply them before doing anything else. Not shown on `/onboarding`,
 * where the wizard's first step asks the same question.
 */
export function NameRequiredDialog({ initialValues }: { initialValues: NameFormInput }) {
  const pathname = usePathname()
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  if (saved || pathname.startsWith("/onboarding")) return null

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={stay}
        onPointerDownOutside={stay}
        onInteractOutside={stay}
        className="gap-5 p-5 sm:max-w-md sm:p-6"
      >
        <DialogHeader className="gap-1.5">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            One quick thing
          </p>
          <DialogTitle className="font-heading text-2xl font-bold uppercase">
            What should we call you?
          </DialogTitle>
          <DialogDescription>
            Your coach needs your first and last name. It takes ten seconds.
          </DialogDescription>
        </DialogHeader>
        <NameForm
          id="name-required"
          initialValues={initialValues}
          onSaved={(values) => {
            setSaved(true)
            toast.success(`Thanks, ${values.firstName}`)
            router.refresh()
          }}
          footer={({ pending }) => (
            <DialogFooter className="-mx-5 -mb-5 px-5 sm:-mx-6 sm:-mb-6 sm:px-6">
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="h-10 font-heading tracking-wider uppercase"
              >
                {pending && <Loader2Icon className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
