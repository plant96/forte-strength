import "./globals.css"

import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/themes"
import { cn } from "cn"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Saira_Condensed } from "next/font/google"

import { NameRequiredGate } from "@/components/layout/name-required-gate"
import { OnboardingBanner } from "@/components/layout/onboarding-banner"
import { OnboardingLockGate } from "@/components/layout/onboarding-lock-gate"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { MotionProvider } from "@/components/motion/motion-provider"
import { Toaster } from "@/components/ui/sonner"
import { siteConfig } from "@/config/site"
import { AnalyticsBeacon } from "@/features/analytics/components/analytics-beacon"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
  },
  twitter: { card: "summary" },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      appearance={{
        theme: shadcn,
        variables: { fontFamily: "var(--font-geist-sans)", borderRadius: "0.75rem" },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignOutUrl="/"
    >
      <html
        lang="en"
        className={cn(
          "dark h-full antialiased",
          geistSans.variable,
          geistMono.variable,
          sairaCondensed.variable,
        )}
      >
        <body className="flex min-h-full flex-col">
          <MotionProvider>
            <SiteHeader />
            <OnboardingBanner />
            <main className="flex-1">
              <OnboardingLockGate>{children}</OnboardingLockGate>
            </main>
            <SiteFooter />
          </MotionProvider>
          <NameRequiredGate />
          <Toaster position="bottom-right" />
          <AnalyticsBeacon />
        </body>
      </html>
    </ClerkProvider>
  )
}
