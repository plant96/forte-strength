import { CheckIcon, HandshakeIcon, ShieldCheckIcon } from "lucide-react"
import Image from "next/image"

/** A website user the coach has marked as a coaching client. */
export function ClientBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-highlight ring-1 ring-primary/30">
      <HandshakeIcon className="size-3" aria-hidden="true" />
      Client
    </span>
  )
}

export function OnboardingBadge({
  onboardedAt,
  skippedAt,
}: {
  onboardedAt: Date | null
  skippedAt: Date | null
}) {
  if (onboardedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-highlight">
        <CheckIcon className="size-3" aria-hidden="true" />
        Profile complete
      </span>
    )
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
      {skippedAt ? "Skipped setup" : "Not started"}
    </span>
  )
}

export function RoleBadge({ role }: { role: "USER" | "ADMIN" }) {
  return role === "ADMIN" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-primary-foreground">
      <ShieldCheckIcon className="size-3" aria-hidden="true" />
      Admin
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">User</span>
  )
}

export function Avatar({ src, size = 32 }: { src: string | null; size?: number }) {
  return src ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-full ring-1 ring-foreground/10"
      style={{ width: size, height: size }}
    />
  ) : (
    <span className="shrink-0 rounded-full bg-muted" style={{ width: size, height: size }} />
  )
}

export function displayName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
}
