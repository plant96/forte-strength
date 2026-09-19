import type { Metadata } from "next"
import Image from "next/image"

import { CoachingCta } from "@/components/marketing/coaching-cta"
import { getCalculatorAutofill } from "@/features/profile/queries"
import { TdeeCalculator } from "@/features/tdee/components/tdee-calculator"

const description =
  "Find your maintenance calories from the average of three BMR equations and an activity model built for lifters, then see exactly what to eat to bulk or cut."

export const metadata: Metadata = {
  title: "TDEE Calculator",
  description,
  alternates: { canonical: "/tdee-calculator" },
  openGraph: {
    title: "TDEE Calculator | Forte Strength Systems",
    description,
    url: "/tdee-calculator",
  },
}

export default async function TdeeCalculatorPage() {
  const initialValues = await getCalculatorAutofill()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 flex flex-col items-center gap-6 text-center sm:mb-12">
        <Image
          src="/brand/forte-strength-logo.png"
          alt="Forte Strength Systems"
          width={1080}
          height={589}
          preload
          sizes="(min-width: 640px) 224px, 176px"
          className="h-auto w-44 drop-shadow-[0_0_28px_oklch(0.585_0.215_22/0.25)] sm:w-56"
        />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-heading text-4xl font-bold tracking-tight uppercase sm:text-5xl">
            TDEE Calculator
          </h1>
          <p className="max-w-2xl text-base text-balance text-muted-foreground">{description}</p>
        </div>
      </header>

      <TdeeCalculator initialValues={initialValues} />

      <div className="mt-16 sm:mt-20">
        <CoachingCta />
      </div>
    </div>
  )
}
