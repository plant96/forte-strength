import { compactName, slugify } from "./lib/slug"

/**
 * A curated list of movements to suggest, so most people never type a name at all.
 *
 * This is the cheapest duplicate prevention there is: picking "Overhead Press" from a list
 * beats five people inventing "OHP", "ohp", "Military Press" and "Overhead press". The
 * aliases are matched but never shown — they exist so that typing "ohp" or "rdl" lands on
 * the canonical movement instead of creating a new one.
 *
 * Free text still works. This list is a shortcut, not a restriction.
 */

/** Organises the list below. Not rendered today — the picker is a typeahead, not a browser. */
export type MuscleGroup =
  "squat" | "bench" | "deadlift" | "press" | "back" | "arms" | "legs" | "core" | "olympic"

export interface CatalogEntry {
  name: string
  slug: string
  group: MuscleGroup
  aliases: string[]
}

/** Slug is derived, never written by hand, so it can never disagree with the name. */
function lift(name: string, group: MuscleGroup, ...aliases: string[]): CatalogEntry {
  return { name, slug: slugify(name), group, aliases }
}

export const EXERCISE_CATALOG: CatalogEntry[] = [
  // Squat
  // Both exist on purpose: plenty of people just write "squat" and mean it literally,
  // and forcing them onto "Back Squat" makes the name feel like someone else's.
  lift("Squat", "squat", "comp squat", "competition squat"),
  lift("Back Squat", "squat", "low bar squat", "high bar squat"),
  lift("Front Squat", "squat", "front squat"),
  lift("Paused Squat", "squat", "pause squat"),
  lift("Box Squat", "squat"),
  lift("Safety Bar Squat", "squat", "ssb", "ssb squat", "safety squat bar"),
  lift("Pin Squat", "squat"),
  lift("Tempo Squat", "squat"),
  lift("Zercher Squat", "squat"),
  lift("Belt Squat", "squat"),
  lift("Hack Squat", "squat"),
  lift("Goblet Squat", "squat"),
  lift("Bulgarian Split Squat", "squat", "bss", "rfess", "rear foot elevated split squat"),
  lift("Leg Press", "squat"),

  // Bench
  lift("Bench Press", "bench", "bench", "comp bench", "competition bench", "flat bench"),
  lift("Paused Bench Press", "bench", "pause bench"),
  lift("Close Grip Bench Press", "bench", "cgbp", "close grip bench"),
  lift("Incline Bench Press", "bench", "incline bench", "incline press"),
  lift("Decline Bench Press", "bench", "decline bench"),
  lift("Spoto Press", "bench"),
  lift("Floor Press", "bench"),
  lift("Larsen Press", "bench"),
  lift("Board Press", "bench"),
  lift("Pin Press", "bench"),
  lift("Dumbbell Bench Press", "bench", "db bench", "dumbbell press"),
  lift("Incline Dumbbell Press", "bench", "incline db press"),
  lift("Cable Fly", "bench", "chest fly", "pec fly", "cable flye"),

  // Deadlift
  lift(
    "Deadlift",
    "deadlift",
    "dl",
    "conventional deadlift",
    "comp deadlift",
    "competition deadlift",
  ),
  lift("Sumo Deadlift", "deadlift", "sumo"),
  lift("Paused Deadlift", "deadlift", "pause deadlift"),
  lift("Deficit Deadlift", "deadlift", "deficit"),
  lift("Block Pull", "deadlift", "blocks", "block pulls"),
  lift("Rack Pull", "deadlift", "rack pulls"),
  lift("Romanian Deadlift", "deadlift", "rdl", "romanian"),
  lift("Stiff Leg Deadlift", "deadlift", "sldl", "stiff legged deadlift"),
  lift("Snatch Grip Deadlift", "deadlift"),
  lift("Trap Bar Deadlift", "deadlift", "hex bar deadlift", "trap bar"),
  lift("Good Morning", "deadlift", "gm", "good mornings"),

  // Shoulders & pressing
  lift(
    "Overhead Press",
    "press",
    "ohp",
    "military press",
    "strict press",
    "standing press",
    "shoulder press",
  ),
  lift("Push Press", "press"),
  lift("Seated Overhead Press", "press", "seated press"),
  lift("Dumbbell Shoulder Press", "press", "db shoulder press"),
  lift("Arnold Press", "press"),
  lift("Landmine Press", "press"),
  lift("Z Press", "press"),
  lift("Lateral Raise", "press", "side raise", "lat raise", "side lateral raise"),
  lift("Rear Delt Fly", "press", "reverse fly", "rear delt flye"),
  lift("Front Raise", "press"),

  // Back & pulling
  lift("Barbell Row", "back", "bb row", "bent over row", "bent over barbell row"),
  lift("Pendlay Row", "back"),
  lift("Dumbbell Row", "back", "db row", "one arm row", "single arm row"),
  lift("Chest Supported Row", "back", "csr"),
  lift("Seal Row", "back"),
  lift("T-Bar Row", "back", "tbar row"),
  lift("Seated Cable Row", "back", "cable row", "seated row"),
  lift("Lat Pulldown", "back", "pulldown", "lat pull down"),
  lift("Pull-Up", "back", "pullup", "pull ups", "weighted pull up"),
  lift("Chin-Up", "back", "chinup", "chin ups", "weighted chin up"),
  lift("Face Pull", "back"),
  lift("Barbell Shrug", "back", "shrug", "shrugs"),
  lift("Straight Arm Pulldown", "back", "straight arm pull down"),

  // Legs & posterior chain
  lift("Hip Thrust", "legs", "barbell hip thrust"),
  lift("Glute Ham Raise", "legs", "ghr", "glute-ham raise"),
  lift("Nordic Curl", "legs", "nordic hamstring curl", "nordics"),
  lift("Reverse Hyper", "legs", "reverse hyperextension"),
  lift("Back Extension", "legs", "hyperextension", "45 degree back extension"),
  lift("Lying Leg Curl", "legs", "leg curl", "hamstring curl"),
  lift("Seated Leg Curl", "legs"),
  lift("Leg Extension", "legs", "quad extension"),
  lift("Walking Lunge", "legs", "lunge", "lunges"),
  lift("Step Up", "legs", "step ups"),
  lift("Standing Calf Raise", "legs", "calf raise"),
  lift("Seated Calf Raise", "legs"),

  // Arms
  lift("Barbell Curl", "arms", "bb curl", "bicep curl", "biceps curl"),
  lift("Dumbbell Curl", "arms", "db curl"),
  lift("Hammer Curl", "arms"),
  lift("Preacher Curl", "arms"),
  lift("Incline Dumbbell Curl", "arms", "incline curl"),
  lift("Cable Curl", "arms"),
  lift("Tricep Pushdown", "arms", "pushdown", "triceps pushdown", "cable pushdown"),
  lift("Skull Crusher", "arms", "skullcrusher", "skull crushers", "lying tricep extension"),
  lift("Overhead Tricep Extension", "arms", "overhead extension", "triceps extension"),
  lift("JM Press", "arms"),
  lift("Dip", "arms", "dips", "weighted dip", "weighted dips"),

  // Core
  lift("Ab Wheel Rollout", "core", "ab wheel", "rollout"),
  lift("Cable Crunch", "core", "kneeling cable crunch"),
  lift("Hanging Leg Raise", "core", "leg raise", "hanging knee raise"),
  lift("Weighted Sit-Up", "core", "weighted situp"),
  lift("Pallof Press", "core"),
  lift("Weighted Plank", "core"),

  // Olympic
  lift("Power Clean", "olympic"),
  lift("Hang Clean", "olympic"),
  lift("Clean", "olympic", "squat clean", "full clean"),
  lift("Clean and Jerk", "olympic", "clean & jerk"),
  lift("Power Snatch", "olympic"),
  lift("Hang Snatch", "olympic"),
  lift("Snatch", "olympic", "full snatch"),
  lift("Push Jerk", "olympic"),
  lift("Split Jerk", "olympic"),
  lift("Clean Pull", "olympic"),
  lift("Snatch Pull", "olympic"),
  lift("Overhead Squat", "olympic", "ohs"),
]

/**
 * Every catalogue name and alias, flattened to its compact form and pointing at the entry
 * that owns it. Built once, so a keystroke-by-keystroke search stays cheap.
 */
const BY_COMPACT = new Map<string, CatalogEntry>()
for (const entry of EXERCISE_CATALOG) {
  BY_COMPACT.set(compactName(entry.name), entry)
  for (const alias of entry.aliases) {
    // A canonical name always wins over another entry's alias.
    const key = compactName(alias)
    if (!BY_COMPACT.has(key)) BY_COMPACT.set(key, entry)
  }
}

/** The catalogue entry a typed name means, matching hidden aliases too. */
export function findCatalogEntry(name: string) {
  return BY_COMPACT.get(compactName(name)) ?? null
}

/**
 * The lifts someone means first when they type a general word. Without this, "squat" ranks
 * Box Squat above Back Squat purely because the name is shorter.
 */
const COMMON = new Set([
  "squat",
  "back-squat",
  "front-squat",
  "bench-press",
  "incline-bench-press",
  "close-grip-bench-press",
  "deadlift",
  "sumo-deadlift",
  "romanian-deadlift",
  "overhead-press",
  "barbell-row",
  "pull-up",
])

/**
 * Catalogue search. Matches names and hidden aliases, ranking a prefix hit above a
 * mid-string one so "ben" puts Bench Press first, and a staple above an obscure variation.
 */
export function searchCatalog(query: string, limit = 8) {
  const needle = compactName(query)
  if (!needle) return []

  const scored: { entry: CatalogEntry; score: number }[] = []
  for (const entry of EXERCISE_CATALOG) {
    const name = compactName(entry.name)
    let score = -1
    if (name.startsWith(needle)) score = 0
    else if (name.includes(needle)) score = 1
    else if (entry.aliases.some((alias) => compactName(alias).startsWith(needle))) score = 2
    else if (entry.aliases.some((alias) => compactName(alias).includes(needle))) score = 3
    if (score >= 0) scored.push({ entry, score })
  }

  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        Number(COMMON.has(b.entry.slug)) - Number(COMMON.has(a.entry.slug)) ||
        a.entry.name.length - b.entry.name.length,
    )
    .slice(0, limit)
    .map((hit) => hit.entry)
}
