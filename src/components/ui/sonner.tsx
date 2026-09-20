"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// The site is dark-only, so the toaster is pinned to the dark theme.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      // Toasts still time out on their own; this is the manual way out.
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4 text-highlight" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        close: <XIcon className="size-3" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: "Dismiss notification",
        classNames: {
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          // Sonner's own rules are specific enough to need `!` to beat them.
          closeButton:
            "!size-5 !border-border !bg-popover !text-muted-foreground !transition-colors hover:!border-primary/50 hover:!bg-muted hover:!text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
