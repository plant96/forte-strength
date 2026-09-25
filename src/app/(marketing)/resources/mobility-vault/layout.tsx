import { ClientOnlyGate } from "@/components/layout/client-only-gate"
import { CoachingCta } from "@/components/marketing/coaching-cta"
import { VaultHeader } from "@/features/resources/components/resource-vault"
import { canAccessClientArea, getCurrentUser, isClient } from "@/server/auth"

/**
 * Shared by the lift pages, so the heading and switcher stay put while the lift changes.
 *
 * It is also where the vault is gated: one check here covers every lift below it, and
 * non-clients get the upsell instead of the drills — which are never rendered for them.
 */
export default async function MobilityVaultLayout({
  children,
}: LayoutProps<"/resources/mobility-vault">) {
  const user = await getCurrentUser()
  if (!canAccessClientArea(user)) {
    return <ClientOnlyGate feature="mobility-vault" signedIn={Boolean(user)} />
  }

  return (
    <>
      <VaultHeader />
      {children}
      {/* Clients are already coached; only admins previewing the vault see the invitation. */}
      {!isClient(user) && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-6 sm:pb-24">
          <CoachingCta />
        </div>
      )}
    </>
  )
}
