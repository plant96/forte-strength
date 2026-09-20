import type { Metadata } from "next"

import { CoachingCta } from "@/components/marketing/coaching-cta"
import { ToolShell } from "@/components/layout/tool-shell"
import { getCalculatorAutofill } from "@/features/profile/queries"
import { TdeeCalculator } from "@/features/tdee/components/tdee-calculator"

const description =
  "Find your maintenance calories from the average of three BMR equations and an activity model built for lifters, then see exactly what to eat to bulk or cut."

export const metadata: Metadata = {
  title: "TDEE Calculator",
  description,
  alternates: { canonical: "/tools/tdee-calculator" },
  openGraph: {
    title: "TDEE Calculator | Forte Strength Systems",
    description,
    url: "/tools/tdee-calculator",
  },
}

export default async function TdeeCalculatorPage() {
  const initialValues = await getCalculatorAutofill()

  return (
    <ToolShell title="TDEE Calculator" description={description} footer={<CoachingCta />}>
      <TdeeCalculator initialValues={initialValues} />
    </ToolShell>
  )
}
