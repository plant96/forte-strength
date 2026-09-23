import { Button, Column, Heading, Row, Section, Text } from "react-email"

import { EmailLayout, emailColors, Eyebrow } from "./email-layout"

export interface EmailFact {
  label: string
  value: string
}

export interface NotificationEmailProps {
  preview: string
  eyebrow: string
  title: string
  intro?: string
  facts?: EmailFact[]
  cta?: { label: string; href: string }
  footnote?: string
}

/** One template for every coach notification: an eyebrow, a headline, some facts, a button. */
export function NotificationEmail({
  preview,
  eyebrow,
  title,
  intro,
  facts = [],
  cta,
  footnote,
}: NotificationEmailProps) {
  const rows: EmailFact[][] = []
  for (let index = 0; index < facts.length; index += 2) rows.push(facts.slice(index, index + 2))

  return (
    <EmailLayout preview={preview}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading
        as="h1"
        style={{
          margin: "0 0 8px",
          fontSize: 28,
          lineHeight: "32px",
          fontWeight: 800,
          textTransform: "uppercase",
          color: emailColors.text,
        }}
      >
        {title}
      </Heading>
      {intro && (
        <Text
          style={{ margin: "0 0 18px", fontSize: 15, lineHeight: "22px", color: emailColors.muted }}
        >
          {intro}
        </Text>
      )}

      {rows.length > 0 && (
        <Section
          style={{
            backgroundColor: emailColors.cardAlt,
            borderRadius: 12,
            padding: "14px 16px 4px",
            marginBottom: 18,
          }}
        >
          {rows.map((pair, index) => (
            <Row key={index}>
              {pair.map((fact) => (
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
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {fact.value}
                  </Text>
                </Column>
              ))}
            </Row>
          ))}
        </Section>
      )}

      {cta && (
        <Button
          href={cta.href}
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
          {cta.label}
        </Button>
      )}

      <Text style={{ margin: "18px 0 12px", fontSize: 12, color: emailColors.muted }}>
        {footnote ?? "You can switch this email off under Admin → Notifications."}
      </Text>
    </EmailLayout>
  )
}
