import { EXERCISE_NAME_MAX } from "../schema"
import { parseSeriesKey, seriesKey, type SeriesShape } from "./series"
import { cleanName } from "./slug"

/**
 * A link into the Add panel with the first two steps already answered:
 * `/tools/pr-tracker?panel=add&movement=Bench%20Press&series=2rep`.
 *
 * The dashboard's empty best-lift cells use it, so "log a 2-rep bench" is one tap and the
 * lifter only types the weight. The movement is a *name*, not an id: the panel resolves it
 * the same way the picker does, so it reuses a tracked movement or creates the catalogue one.
 */
export interface AddPrefill {
  movement: string
  series: SeriesShape
}

type Param = string | string[] | undefined

const first = (value: Param) => (Array.isArray(value) ? value[0] : value)

export function parseAddPrefill(movement: Param, series: Param): AddPrefill | null {
  const name = cleanName(first(movement) ?? "")
  const shape = parseSeriesKey(first(series) ?? "")
  if (!name || name.length > EXERCISE_NAME_MAX || !shape) return null
  return { movement: name, series: shape }
}

export function addPrefillHref(basePath: string, movement: string, shape: SeriesShape) {
  return `${basePath}?panel=add&movement=${encodeURIComponent(movement)}&series=${seriesKey(shape)}`
}
