import { Heading, Text } from "react-email"

import { applicationSections, type ApplicationRecord } from "@/features/applications/format"

import { AnswerSections, EmailLayout, emailColors, Eyebrow } from "./email-layout"

interface ApplicationReceiptEmailProps {
  application: ApplicationRecord
  coachName: string
}

/** Sent to the applicant as confirmation, with a copy of their answers. */
export function ApplicationReceiptEmail({ application, coachName }: ApplicationReceiptEmailProps) {
  const firstName = application.fullName.split(" ")[0] ?? application.fullName
  const coachFirstName = coachName.split(" ")[0] ?? coachName

  return (
    <EmailLayout preview="We received your application to Team Forte Strength">
      <Eyebrow>Application received</Eyebrow>
      <Heading
        as="h1"
        style={{
          margin: "0 0 12px",
          fontSize: 28,
          lineHeight: "32px",
          fontWeight: 800,
          textTransform: "uppercase",
          color: emailColors.text,
        }}
      >
        Thanks, {firstName}!
      </Heading>
      <Text
        style={{ margin: "0 0 10px", fontSize: 15, lineHeight: "23px", color: emailColors.text }}
      >
        Your application to Team Forte Strength is in. Coach {coachName} reads every application
        personally and will be in touch soon.
      </Text>
      <Text
        style={{ margin: "0 0 4px", fontSize: 14, lineHeight: "22px", color: emailColors.muted }}
      >
        Here&apos;s a copy of your answers for your records. Have something to add? Just reply to
        this email and it goes straight to {coachFirstName}.
      </Text>

      <AnswerSections sections={applicationSections(application)} />
    </EmailLayout>
  )
}
