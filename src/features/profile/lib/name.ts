/** True when both names are present and not just whitespace. */
export function hasFullName(
  user: { firstName: string | null; lastName: string | null } | null | undefined,
) {
  return Boolean(user?.firstName?.trim() && user?.lastName?.trim())
}

/** The greeting form of a name: the first name, or a fallback when there is none. */
export function greetingName(firstName: string | null | undefined, fallback = "there") {
  const name = firstName?.trim()
  return name ? name : fallback
}
