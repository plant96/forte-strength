"use client"

import {
  CheckIcon,
  LibraryIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { m } from "motion/react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { WeightUnit } from "@/lib/units"

import { createExercise, type CreateExerciseResult } from "../actions"
import {
  EXERCISE_CATALOG,
  GROUP_LABELS,
  GROUP_ORDER,
  searchCatalog,
  type CatalogEntry,
} from "../catalog"
import { describeDay } from "../lib/day"
import { compactName } from "../lib/slug"
import { formatWeight } from "../lib/weight"
import type { ExerciseListItem, ExerciseSummary } from "../queries"

/**
 * Choosing a movement — and the main place duplicates get stopped.
 *
 * The ordering is the point. What the lifter already tracks comes first and biggest,
 * because picking an existing movement is almost always what they mean. The curated
 * library sits right beside the search box as a dropdown, so "ohp" lands on Overhead Press
 * rather than becoming its own entry — a list of chips further down the page was too easy
 * to scroll past, and a missed library is a duplicate waiting to happen. Typing a brand new
 * name is last, and only offered once nothing else matches.
 *
 * The server still gets the final say: `createExercise` resolves aliases, reuses an exact
 * match, and refuses to fork something that looks like a typo until the lifter confirms.
 */

interface ExercisePickerProps {
  exercises: ExerciseListItem[]
  unit: WeightUnit
  /** Omitted when the lifter is choosing for themselves; set when a coach is logging. */
  athleteId?: string
  /** "select" hides every route to creating something new. */
  mode?: "create" | "select"
  onPick: (exercise: ExerciseSummary) => void
}

export function ExercisePicker({
  exercises,
  unit,
  athleteId,
  mode = "create",
  onPick,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("")
  const [confirm, setConfirm] = useState<Extract<
    CreateExerciseResult,
    { status: "confirm" }
  > | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const trimmed = query.trim()
  const needle = compactName(trimmed)

  const mine = trimmed
    ? exercises.filter((exercise) => compactName(exercise.name).includes(needle))
    : exercises
  const mineCompact = new Set(exercises.map((exercise) => compactName(exercise.name)))

  // Library matches for what they are typing. Never repeats something already tracked —
  // the "Your movements" list above covers those.
  const suggestions: CatalogEntry[] = trimmed
    ? searchCatalog(trimmed, 6).filter((entry) => !mineCompact.has(compactName(entry.name)))
    : []

  const exactExists =
    mineCompact.has(needle) || suggestions.some((entry) => compactName(entry.name) === needle)
  const canCreate = mode === "create" && trimmed.length > 0 && !exactExists

  function submit(name: string, force = false) {
    setError(null)
    startTransition(async () => {
      const result = await createExercise({ name, force, athleteId })
      if (result.ok) {
        setConfirm(null)
        setQuery("")
        onPick(result.exercise)
        return
      }
      if (result.status === "confirm") {
        setConfirm(result)
        return
      }
      setError(result.message)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 @md:flex-row">
        <InputGroup className="h-12 flex-1 bg-card">
          <InputGroupAddon align="inline-start">
            {pending ? (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <SearchIcon className="size-4 text-muted-foreground" />
            )}
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setConfirm(null)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canCreate && !pending) {
                event.preventDefault()
                submit(trimmed)
              }
            }}
            placeholder={mode === "create" ? "Search or add a movement" : "Search your movements"}
            aria-label="Movement"
            className="text-base placeholder:text-muted-foreground/60"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear" onClick={() => setQuery("")}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {mode === "create" && (
          <LibrarySelect taken={mineCompact} disabled={pending} onPick={(name) => submit(name)} />
        )}
      </div>

      {confirm && (
        <NearDuplicateWarning
          confirm={confirm}
          pending={pending}
          onUseExisting={(name) => submit(name)}
          onCreateAnyway={() => submit(confirm.typed, true)}
          onDismiss={() => setConfirm(null)}
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>{trimmed ? "You already track" : "Your movements"}</SectionLabel>
          <ul className="grid gap-2 @md:grid-cols-2">
            {mine.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => onPick(exercise)}
                  disabled={pending}
                  className="group flex w-full items-center gap-3 rounded-xl bg-card p-3.5 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/60 hover:ring-primary/40 disabled:opacity-60"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{exercise.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {exercise.entryCount === 0
                        ? "No records yet"
                        : `${exercise.entryCount} record${exercise.entryCount === 1 ? "" : "s"}` +
                          (exercise.bestKg !== null
                            ? ` · best ${formatWeight(exercise.bestKg, unit)}`
                            : "") +
                          (exercise.lastDay ? ` · ${describeDay(exercise.lastDay)}` : "")}
                    </span>
                  </span>
                  <CheckIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Typed matches from the library stay inline: once someone is typing, the fastest
          path is the one already under their cursor. */}
      {mode === "create" && trimmed.length > 0 && suggestions.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>From the library</SectionLabel>
          <ul className="grid gap-2 @md:grid-cols-2">
            {suggestions.map((entry) => (
              <li key={entry.slug}>
                <button
                  type="button"
                  onClick={() => submit(entry.name)}
                  disabled={pending}
                  className="group flex w-full items-center gap-3 rounded-xl bg-card/60 p-3.5 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/60 hover:ring-primary/40 disabled:opacity-60"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{entry.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {GROUP_LABELS[entry.group]}
                    </span>
                  </span>
                  <PlusIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canCreate && !confirm && (
        <button
          type="button"
          onClick={() => submit(trimmed)}
          disabled={pending}
          className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
        >
          <PlusIcon className="size-4 text-highlight" />
          <span>
            Track <span className="font-medium text-foreground">{trimmed}</span> as a new movement
          </span>
        </button>
      )}

      {mine.length === 0 && (!trimmed || suggestions.length === 0) && !canCreate && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {mode === "select"
            ? "No movements match. Log a record first and it will show up here."
            : "Nothing matches that."}
        </p>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </h3>
  )
}

/**
 * The last line of defence before a near-duplicate gets created. "Use the existing one" is
 * the primary action, because it is almost always what was meant.
 */
function NearDuplicateWarning({
  confirm,
  pending,
  onUseExisting,
  onCreateAnyway,
  onDismiss,
}: {
  confirm: Extract<CreateExerciseResult, { status: "confirm" }>
  pending: boolean
  onUseExisting: (name: string) => void
  onCreateAnyway: () => void
  onDismiss: () => void
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-xl bg-primary/8 p-4 ring-1 ring-primary/30"
    >
      <div className="flex gap-3">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-highlight" />
        <div className="text-sm">
          <p className="font-medium">
            That looks like {confirm.suggestions.length > 1 ? "movements" : "a movement"} you
            already have
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Adding <span className="text-foreground">{confirm.typed}</span> separately would split
            your history across two graphs.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {confirm.suggestions.map((suggestion) => (
          <Button
            key={suggestion.name}
            size="sm"
            className="h-9"
            disabled={pending}
            onClick={() => onUseExisting(suggestion.name)}
          >
            Use {suggestion.name}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="h-9"
          disabled={pending}
          onClick={onCreateAnyway}
        >
          Add {confirm.typed} anyway
        </Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={onDismiss}>
          Cancel
        </Button>
      </div>
    </m.div>
  )
}

/**
 * The whole curated library, grouped by body part, one control away.
 *
 * A dropdown rather than a list of chips: it reads as "there is a list here" even before
 * it is opened, which is the point — someone who never notices the library is someone who
 * types their own spelling of a lift that already exists.
 */
function LibrarySelect({
  taken,
  disabled,
  onPick,
}: {
  /** Compact names already tracked, so the library never offers a duplicate. */
  taken: Set<string>
  disabled: boolean
  onPick: (name: string) => void
}) {
  const groups = GROUP_ORDER.map((group) => ({
    group,
    entries: EXERCISE_CATALOG.filter(
      (entry) => entry.group === group && !taken.has(compactName(entry.name)),
    ),
  })).filter((section) => section.entries.length > 0)

  if (groups.length === 0) return null

  return (
    <Select
      // Never holds a value: picking is an action, not a setting.
      value=""
      disabled={disabled}
      onValueChange={(slug) => {
        const entry = EXERCISE_CATALOG.find((candidate) => candidate.slug === slug)
        if (entry) onPick(entry.name)
      }}
    >
      <SelectTrigger className="h-12 w-full bg-card @md:w-56" aria-label="Browse the lift library">
        <span className="flex items-center gap-2 text-muted-foreground">
          <LibraryIcon className="size-4" />
          <SelectValue placeholder="Browse all lifts" />
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {groups.map((section) => (
          <SelectGroup key={section.group}>
            <SelectLabel>{GROUP_LABELS[section.group]}</SelectLabel>
            {section.entries.map((entry) => (
              <SelectItem key={entry.slug} value={entry.slug}>
                {entry.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PickedExercise({
  exercise,
  onChange,
}: {
  exercise: ExerciseSummary
  onChange: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3.5 ring-1 ring-primary/30">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
        <CheckIcon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{exercise.name}</span>
      <Button variant="ghost" size="sm" className="h-9" onClick={onChange}>
        Change
      </Button>
    </div>
  )
}
