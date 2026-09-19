"use client"

import { cn } from "cn"
import { CheckIcon, CircleHelpIcon, InfoIcon, MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { MACRO_INFO, MACROS, type Macro } from "../../lib/macros"
import { TEF_BY_MACRO, TEF_SOURCE } from "../../lib/tef"

/** The parts of total daily energy expenditure, and which ones this calculator covers. */
const BURN_PARTS = [
  {
    abbr: "BMR",
    name: "Basal metabolic rate",
    detail: "Energy you burn at complete rest.",
    included: true,
  },
  {
    abbr: "NEAT",
    name: "Non-exercise activity thermogenesis",
    detail: "Everyday movement, estimated from your daily steps.",
    included: true,
  },
  {
    abbr: "EAT",
    name: "Exercise activity thermogenesis",
    detail: "Your training, estimated from your sessions and intensity.",
    included: true,
  },
  {
    abbr: "TEF",
    name: "Thermic effect of food",
    detail: "Digesting and processing what you eat.",
    included: false,
  },
] as const

const MACRO_SWATCH: Record<Macro, string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
}

/** Explains that TDEE here leaves out the thermic effect of food, with a definition on demand. */
export function TefNote() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/25 px-4 py-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:gap-4">
      <p className="flex flex-1 items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
        <span>
          <span className="font-medium text-foreground/90">
            Doesn&apos;t include the thermic effect of food (TEF).
          </span>{" "}
          Digesting food burns calories too, and how many depends on what you eat, so your actual
          daily burn may be slightly higher than shown.
        </span>
      </p>
      <TefDialog />
    </div>
  )
}

function TefDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start sm:self-auto"
        >
          <CircleHelpIcon />
          What is TEF?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto p-4 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
            What is TEF?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            The <span className="text-foreground">thermic effect of food</span> is the energy your
            body spends digesting, absorbing and processing what you eat. In short: eating burns
            calories too.
          </DialogDescription>
        </DialogHeader>

        <section aria-labelledby="tef-fit" className="flex flex-col gap-2.5">
          <h3
            id="tef-fit"
            className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
          >
            Where it fits in your daily burn
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {BURN_PARTS.map((part, index) => (
              // Each "+" stays with the chip after it, so a wrap never leaves one dangling.
              <span key={part.abbr} className="inline-flex items-center gap-1.5">
                {index > 0 && (
                  <PlusIcon className="size-3.5 text-muted-foreground" aria-label="plus" />
                )}
                <Part label={part.abbr} included={part.included} />
              </span>
            ))}
          </div>
          <dl className="flex flex-col divide-y divide-border rounded-lg bg-background/50 ring-1 ring-foreground/10">
            {BURN_PARTS.map((part) => (
              <div
                key={part.abbr}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 px-3 py-2"
              >
                <dt
                  className={cn(
                    "font-heading text-sm font-bold tracking-wide",
                    part.included ? "text-foreground" : "text-highlight",
                  )}
                >
                  {part.abbr}
                </dt>
                <dd className="flex flex-col text-xs">
                  <span className="font-medium text-foreground/90">{part.name}</span>
                  <span className="text-muted-foreground">{part.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            This calculator&apos;s TDEE covers BMR, NEAT and EAT. TEF is left out.
          </p>
        </section>

        <section aria-labelledby="tef-size" className="flex flex-col gap-2.5">
          <h3
            id="tef-size"
            className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
          >
            How much it burns
          </h3>
          <p className="text-sm text-foreground/90">
            It depends on what you eat. Each macro takes a different amount of energy to process,
            and protein takes the most:
          </p>
          <table className="w-full text-sm">
            <caption className="sr-only">
              Share of each macro&apos;s calories burned during digestion
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Macro</th>
                <th scope="col">Calories burned processing it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border rounded-lg">
              {MACROS.map((macro) => (
                <tr key={macro}>
                  <th scope="row" className="py-2 text-left font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn("size-2.5 rounded-full", MACRO_SWATCH[macro])}
                        aria-hidden="true"
                      />
                      {MACRO_INFO[macro].label}
                    </span>
                  </th>
                  <td className="py-2 text-right text-muted-foreground tabular-nums">
                    {TEF_BY_MACRO[macro].min}–{TEF_BY_MACRO[macro].max}% of its calories
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm ring-1 ring-primary/25">
          Because it depends on what you eat, TEF differs from athlete to athlete. A{" "}
          <span className="font-semibold text-highlight">higher-protein diet</span> burns more
          through digestion than one built mostly on carbs or fat.
        </p>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Treat your TDEE as a solid starting point, then fine-tune it with your weekly weigh-ins
          over a few weeks.
        </p>
        <p className="text-[0.7rem] text-muted-foreground/80">Source: {TEF_SOURCE}</p>
      </DialogContent>
    </Dialog>
  )
}

function Part({ label, included }: { label: string; included: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
        included
          ? "bg-muted/70 text-foreground"
          : "border border-dashed border-primary/60 text-highlight",
      )}
    >
      {included ? (
        <CheckIcon className="size-3" aria-hidden="true" />
      ) : (
        <MinusIcon className="size-3" aria-hidden="true" />
      )}
      {label}
      {included ? (
        <span className="sr-only"> (included)</span>
      ) : (
        <span className="text-[0.65rem] opacity-80">not included</span>
      )}
    </span>
  )
}
