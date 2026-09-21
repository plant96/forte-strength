"use client"

import { cn } from "cn"
import {
  CheckIcon,
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { WeightUnit } from "@/lib/units"

import { createExercise, type CreateExerciseResult } from "../actions"
import { searchCatalog } from "../catalog"
import { describeDay } from "../lib/day"
import { compactName } from "../lib/slug"
import { formatWeight } from "../lib/weight"
import type { ExerciseListItem, ExerciseSummary } from "../queries"

/**
 * Choosing a movement — and the main place duplicates get stopped.
 *
 * Typing is the only interface. A floating list of the closest matches drops under the box
 * as an autocomplete, so "ohp" lands on Overhead Press instead of becoming its own entry.
 * There is deliberately nothing to browse: from the lifter's side there is no library, only
 * the lift they are trying to name.
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

/** Capped tight: a long list of guesses is a list nobody reads. */
const MAX_SUGGESTIONS = 5

type Suggestion =
  { kind: "tracked"; name: string; exercise: ExerciseListItem } | { kind: "library"; name: string }

export function ExercisePicker({
  exercises,
  unit,
  athleteId,
  mode = "create",
  onPick,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [confirm, setConfirm] = useState<Extract<
    CreateExerciseResult,
    { status: "confirm" }
  > | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const trimmed = query.trim()
  const needle = compactName(trimmed)
  const mineCompact = new Set(exercises.map((exercise) => compactName(exercise.name)))

  const suggestions = buildSuggestions(trimmed, needle, exercises, mineCompact, mode)
  // Offering to create something the list already contains is how duplicates start.
  const canCreate =
    mode === "create" &&
    trimmed.length > 0 &&
    !mineCompact.has(needle) &&
    !suggestions.some((item) => compactName(item.name) === needle)

  const rows = suggestions.length + (canCreate ? 1 : 0)
  const showList = open && trimmed.length > 0 && rows > 0

  function choose(index: number) {
    const suggestion = suggestions[index]
    if (suggestion) {
      if (suggestion.kind === "tracked") {
        setOpen(false)
        onPick(suggestion.exercise)
        return
      }
      submit(suggestion.name)
      return
    }
    if (canCreate) submit(trimmed)
  }

  function submit(name: string, force = false) {
    setError(null)
    setOpen(false)
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
      <div className="relative" data-picker>
        <InputGroup className="h-12 bg-card">
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
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            aria-controls="movement-suggestions"
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlight(0)
              setOpen(true)
              setConfirm(null)
              setError(null)
            }}
            onFocus={() => setOpen(true)}
            // A click lands after blur, so closing unconditionally here would eat it. The
            // row's own mousedown handler stops the blur; this only closes when focus
            // genuinely leaves the control.
            onBlur={(event) => {
              const picker = event.currentTarget.closest("[data-picker]")
              if (!picker?.contains(event.relatedTarget)) setOpen(false)
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false)
                return
              }
              if (!showList) {
                if (event.key === "Enter" && canCreate && !pending) {
                  event.preventDefault()
                  submit(trimmed)
                }
                return
              }
              if (event.key === "ArrowDown") {
                event.preventDefault()
                setHighlight((current) => (current + 1) % rows)
              } else if (event.key === "ArrowUp") {
                event.preventDefault()
                setHighlight((current) => (current - 1 + rows) % rows)
              } else if (event.key === "Enter") {
                event.preventDefault()
                choose(highlight)
              }
            }}
            placeholder={mode === "create" ? "Type a movement name" : "Search your movements"}
            aria-label="Movement"
            className="text-base placeholder:text-muted-foreground/60"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear"
                onClick={() => {
                  setQuery("")
                  setOpen(false)
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {showList && (
          <m.ul
            id="movement-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 left-0 z-20 mt-1.5 overflow-hidden rounded-xl bg-popover p-1 shadow-[0_12px_32px_rgb(0_0_0/0.5)] ring-1 ring-foreground/15"
          >
            {suggestions.map((suggestion, index) => (
              <SuggestionRow
                key={`${suggestion.kind}-${suggestion.name}`}
                active={highlight === index}
                onHover={() => setHighlight(index)}
                onSelect={() => choose(index)}
              >
                <span className="min-w-0 flex-1 truncate">{suggestion.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {suggestion.kind === "tracked"
                    ? suggestion.exercise.bestKg !== null
                      ? `best ${formatWeight(suggestion.exercise.bestKg, unit)}`
                      : "tracked"
                    : "suggested"}
                </span>
              </SuggestionRow>
            ))}

            {canCreate && (
              <SuggestionRow
                active={highlight === suggestions.length}
                onHover={() => setHighlight(suggestions.length)}
                onSelect={() => submit(trimmed)}
              >
                <PlusIcon className="size-4 shrink-0 text-highlight" />
                <span className="min-w-0 flex-1 truncate">
                  Track <span className="font-medium text-foreground">{trimmed}</span>
                </span>
              </SuggestionRow>
            )}
          </m.ul>
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

      {exercises.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-heading text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Your movements
          </h3>
          <ul className="grid gap-2 @md:grid-cols-2">
            {exercises.map((exercise) => (
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

      {exercises.length === 0 && mode === "select" && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing tracked yet. Log a record and it will show up here.
        </p>
      )}
    </div>
  )
}

/**
 * The closest movements to what is being typed: the lifter's own first, since those are
 * almost always what they mean, then curated names that keep spellings consistent.
 */
function buildSuggestions(
  trimmed: string,
  needle: string,
  exercises: ExerciseListItem[],
  mineCompact: Set<string>,
  mode: "create" | "select",
): Suggestion[] {
  if (!trimmed) return []

  const tracked = exercises
    .map((exercise) => ({ exercise, compact: compactName(exercise.name) }))
    .filter((row) => row.compact.includes(needle))
    // A prefix match is a better guess than one buried mid-word.
    .sort((a, b) => Number(b.compact.startsWith(needle)) - Number(a.compact.startsWith(needle)))
    .map(({ exercise }): Suggestion => ({ kind: "tracked", name: exercise.name, exercise }))

  if (mode === "select") return tracked.slice(0, MAX_SUGGESTIONS)

  const library = searchCatalog(trimmed, MAX_SUGGESTIONS)
    .filter((entry) => !mineCompact.has(compactName(entry.name)))
    .map((entry): Suggestion => ({ kind: "library", name: entry.name }))

  return [...tracked, ...library].slice(0, MAX_SUGGESTIONS)
}

function SuggestionRow({
  active,
  onHover,
  onSelect,
  children,
}: {
  active: boolean
  onHover: () => void
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onMouseEnter={onHover}
        // Stops the input blurring before the click registers.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
          active ? "bg-muted text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
      </button>
    </li>
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
