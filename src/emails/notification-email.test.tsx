import { render, toPlainText } from "@react-email/render"
import { describe, expect, it } from "vitest"

import { NotificationEmail } from "./notification-email"

describe("NotificationEmail", () => {
  it("renders the headline, every fact and the call to action", async () => {
    const html = await render(
      <NotificationEmail
        preview="New bug report"
        eyebrow="Bug report"
        title="Something broke on /tools/pr-tracker"
        intro="A visitor hit a problem."
        facts={[
          { label: "Page", value: "/tools/pr-tracker" },
          { label: "Reporter", value: "sam@example.com" },
          { label: "Browser", value: "Chrome on Windows" },
        ]}
        cta={{ label: "Open bug reports", href: "https://fortestrength.org/admin/bug-reports" }}
      />,
    )
    const text = toPlainText(html)

    expect(text).toMatch(/something broke on \/tools\/pr-tracker/i)
    expect(text).toContain("A visitor hit a problem.")
    for (const fact of ["/tools/pr-tracker", "sam@example.com", "Chrome on Windows"]) {
      expect(text, fact).toContain(fact)
    }
    expect(html).toContain('href="https://fortestrength.org/admin/bug-reports"')
    expect(text).toContain("Open bug reports")
    expect(text).toContain("Admin → Notifications")
  })

  it("works with nothing but a title", async () => {
    const html = await render(
      <NotificationEmail preview="Milestone" eyebrow="Milestone" title="100 visitors" />,
    )
    expect(toPlainText(html)).toMatch(/100 visitors/i)
    expect(html).not.toContain("<a")
  })
})
