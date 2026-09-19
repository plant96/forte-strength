import { Button, Column, Heading, Link, Row, Section, Text } from "react-email"

import {
  applicationSections,
  formatLifts,
  instagramUrl,
  primaryNeedLabel,
  type ApplicationRecord,
} from "@/features/applications/format"
import { FINANCE_OPTIONS, optionShort, READINESS_OPTIONS } from "@/features/applications/options"

import { AnswerSections, EmailLayout, emailColors, Eyebrow } from "./email-layout"

interface ApplicationNotificationEmailProps {
  application: ApplicationRecord
  adminUrl: string
}

/** Sent to the coach when someone submits an application. */
export function ApplicationNotificationEmail({
  application,
  adminUrl,
}: ApplicationNotificationEmailProps) {
  const lifts = formatLifts(application)
  const firstName = application.fullName.split(" ")[0] ?? application.fullName
  const facts = [
    { label: "Primary need", value: primaryNeedLabel(application) },
    { label: "Ready to start", value: optionShort(READINESS_OPTIONS, application.readiness) },
    { label: "Budget", value: optionShort(FINANCE_OPTIONS, application.financePriority) },
    { label: "Total", value: `${lifts.total}${lifts.competition ? " (comp)" : ""}` },
    { label: "Weight class", value: application.weightClass },
    { label: "Age · location", value: `${application.age} · ${application.location}` },
  ]

  return (
    <EmailLayout
      preview={`New application from ${application.fullName}: ${primaryNeedLabel(application)}`}
    >
      <Eyebrow>New coaching application</Eyebrow>
      <Heading
        as="h1"
        style={{
          margin: "0 0 4px",
          fontSize: 30,
          lineHeight: "34px",
          fontWeight: 800,
          textTransform: "uppercase",
          color: emailColors.text,
        }}
      >
        {application.fullName}
      </Heading>
      <Text style={{ margin: "0 0 18px", fontSize: 13, color: emailColors.muted }}>
        Submitted{" "}
        {application.createdAt.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "America/New_York",
        })}{" "}
        ET
      </Text>

      <Section
        style={{
          backgroundColor: emailColors.cardAlt,
          borderRadius: 12,
          padding: "14px 16px 4px",
          marginBottom: 18,
        }}
      >
        {[0, 2, 4].map((start) => (
          <Row key={start}>
            {facts.slice(start, start + 2).map((fact) => (
              <Column
                key={fact.label}
                style={{ width: "50%", verticalAlign: "top", paddingBottom: 10 }}
              >
                <Text style={{ margin: 0, fontSize: 11, color: emailColors.muted }}>
                  {fact.label}
                </Text>
                <Text
                  style={{
                    margin: "2px 0 0",
                    fontSize: 14,
                    fontWeight: 600,
                    color: emailColors.text,
                  }}
                >
                  {fact.value}
                </Text>
              </Column>
            ))}
          </Row>
        ))}
      </Section>

      <Button
        href={adminUrl}
        style={{
          backgroundColor: emailColors.primary,
          color: "#ffffff",
          borderRadius: 10,
          padding: "13px 22px",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        View in admin panel
      </Button>

      <Text style={{ margin: "18px 0 0", fontSize: 13, color: emailColors.muted }}>
        Contact:{" "}
        <Link href={`mailto:${application.email}`} style={{ color: emailColors.highlight }}>
          {application.email}
        </Link>{" "}
        ·{" "}
        <Link
          href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}
          style={{ color: emailColors.highlight }}
        >
          {application.phone}
        </Link>{" "}
        ·{" "}
        <Link href={instagramUrl(application.instagram)} style={{ color: emailColors.highlight }}>
          @{application.instagram}
        </Link>
      </Text>
      <Text style={{ margin: "6px 0 0", fontSize: 13, color: emailColors.muted }}>
        Reply to this email to reach {firstName} directly.
      </Text>

      <AnswerSections sections={applicationSections(application)} />
    </EmailLayout>
  )
}
