import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "react-email"

import type { AnswerSection } from "@/features/applications/format"

/** Site colors, as hex for email clients. */
export const emailColors = {
  page: "#0b0b0b",
  card: "#161616",
  cardAlt: "#1d1d1d",
  border: "#2a2a2a",
  text: "#f4f4f4",
  muted: "#a3a3a3",
  primary: "#d6283c",
  highlight: "#f07a82",
}

const fontStack = "'Segoe UI', Helvetica, Arial, sans-serif"

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: emailColors.page,
          color: emailColors.text,
          fontFamily: fontStack,
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container style={{ maxWidth: 640, margin: "0 auto" }}>
          <Text
            style={{
              margin: "0 0 20px",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: emailColors.text,
            }}
          >
            <span style={{ color: emailColors.primary }}>▌</span> Forte Strength Systems
          </Text>
          <Section
            style={{
              backgroundColor: emailColors.card,
              border: `1px solid ${emailColors.border}`,
              borderRadius: 16,
              padding: "28px 28px 8px",
            }}
          >
            {children}
          </Section>
          <Text
            style={{ fontSize: 12, color: emailColors.muted, marginTop: 20, textAlign: "center" }}
          >
            Forte Strength Systems · fortestrength.org
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 6px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: emailColors.primary,
      }}
    >
      {children}
    </Text>
  )
}

/** Every answer, grouped into titled sections. */
export function AnswerSections({ sections }: { sections: AnswerSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <Section key={section.title} style={{ marginTop: 8 }}>
          <Hr style={{ borderColor: emailColors.border, margin: "16px 0" }} />
          <Text
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: emailColors.highlight,
            }}
          >
            {section.title}
          </Text>
          {section.items.map((item) => (
            <Section key={item.label} style={{ marginBottom: 14 }}>
              <Text
                style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: emailColors.muted }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  margin: "4px 0 0",
                  fontSize: 15,
                  lineHeight: "22px",
                  color: emailColors.text,
                  whiteSpace: "pre-wrap",
                  ...(item.long
                    ? {
                        backgroundColor: emailColors.cardAlt,
                        borderRadius: 10,
                        padding: "10px 12px",
                      }
                    : {}),
                }}
              >
                {item.value}
              </Text>
            </Section>
          ))}
        </Section>
      ))}
    </>
  )
}
