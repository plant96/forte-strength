import type { Metadata } from "next"

import { CoachingCta } from "@/components/marketing/coaching-cta"
import { ToolShell } from "@/components/layout/tool-shell"
import { DotsCalculator } from "@/features/dots/components/dots-calculator"
import { getDotsAutofill } from "@/features/dots/queries"
import { getViewer } from "@/features/profile/queries"

const description =
  "Turn your total into DOTS, age-adjusted DOTS and IPF GL points to compare lifters across bodyweights and ages, then see the total you'd need for a target score."

export const metadata: Metadata = {
  title: "DOTS / GLP Calculator",
  description,
  alternates: { canonical: "/tools/dots-calculator" },
  openGraph: {
    title: "DOTS / GLP Calculator | Forte Strength Systems",
    description,
    url: "/tools/dots-calculator",
  },
}

export default async function DotsCalculatorPage() {
  const viewer = await getViewer()
  const autofill = await getDotsAutofill(viewer)

  return (
    <ToolShell
      title="DOTS / GLP Calculator"
      description={description}
      footer={viewer.client ? undefined : <CoachingCta />}
    >
      <DotsCalculator
        initialValues={autofill?.initialValues}
        totalFromPrs={autofill?.totalFromPrs}
        accountState={viewer.accountState}
      />
    </ToolShell>
  )
}
