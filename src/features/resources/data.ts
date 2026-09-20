/**
 * The mobility, flexibility and warm-up vault, transcribed from the coaching staff's
 * spreadsheet (`resource-vault.csv`, kept beside this file as the source of record).
 * Obvious spelling slips were corrected; the prescriptions and the coaches' wording
 * were not touched.
 */

export const LIFT_SLUGS = ["squat", "bench", "deadlift"] as const

export type LiftSlug = (typeof LIFT_SLUGS)[number]

/** Deadlift drills are often stance-specific. */
export type Stance = "Sumo" | "Conventional" | "Both"

export interface ResourceDrill {
  title: string
  /** Sets, reps or hold time, when the staff prescribed one. */
  prescription?: string
  /** What it does and how to run it. */
  detail: string
  /** Demonstration video. A few drills are simple enough that there isn't one. */
  href?: string
  stance?: Stance
}

export interface ResourceBlock {
  title: string
  summary: string
  drills: ResourceDrill[]
  extras: { title: string; items: string[] }
}

export interface ResourceLift {
  slug: LiftSlug
  /** Nav label. */
  title: string
  heading: string
  description: string
  blocks: ResourceBlock[]
}

export const VAULT_INTRO = {
  eyebrow: "Resource vault",
  lines: [
    "These are links and examples handpicked by our coaching staff. Every demonstration has been tested by us and by our current athletes.",
    "If you have a recommendation, or you don't see a solution to something you're struggling with, DM us personally and we'll sort it out that way.",
  ],
}

const MOBILIZATION = "Mobilization"
const ACTIVATION = "Activation"

const MOBILIZATION_SUMMARY =
  "Open up the joints and soft tissue you're about to load, before you put any weight on them."
const ACTIVATION_SUMMARY =
  "Drive blood into the muscles that do the work, and rehearse the pattern before the bar gets heavy."

export const resourceLifts: ResourceLift[] = [
  {
    slug: "squat",
    title: "Squat",
    heading: "All things squat",
    description:
      "Hip, ankle and thoracic work to get you into position, then glute and abductor activation so the first rep feels like the fifth.",
    blocks: [
      {
        title: MOBILIZATION,
        summary: MOBILIZATION_SUMMARY,
        drills: [
          {
            title: "Pulsing Hip Flexor Stretch",
            prescription: "2 × 20 sec each leg",
            detail: "A general hip flexor stretch with a dynamic pulse to loosen the hips.",
            href: "https://www.youtube.com/shorts/uE22oB4l9ho",
          },
          {
            title: "Hip 90/90s",
            prescription: "2 × 20–30 sec each leg",
            detail:
              "Lean forward with your shoulders over your waist. Great for opening up the hips through internal and external rotation.",
            href: "https://www.youtube.com/watch?v=t4Zz6-aG8Iw",
          },
          {
            title: "T-Spine Foam Rolling",
            detail:
              "Thoracic soft tissue work helps relieve upper back and shoulder stiffness for better bar positioning and brace breathing. Stay on the middle back — NOT the lower back or lumbar.",
            href: "https://www.youtube.com/watch?v=rt6H2ZjcOns&t=23s",
          },
          {
            title: "Air Squat / Bar Sway Holds",
            prescription: "1 × 30 sec in position",
            detail:
              "Stresses one knee at a time to simulate an uneven load. Warms the knees up well while challenging ankle mobility.",
            href: "https://www.youtube.com/shorts/qjAozUE4HEs",
          },
        ],
        extras: {
          title: "Extra dynamic stretches to incorporate",
          items: [
            "Standing toe touches",
            "Lying down quad stretch",
            "Standing calf stretch",
            "Butterfly stretch",
            "Trunk twist",
            "Cross-body seated glute stretch",
          ],
        },
      },
      {
        title: ACTIVATION,
        summary: ACTIVATION_SUMMARY,
        drills: [
          {
            title: "Leg Swings, front to back and side to side",
            detail:
              "Front to back drives blood into the hip flexors and glutes; side to side gets it into the adductors and abductors. Also a great dynamic hamstring stretch.",
            href: "https://www.youtube.com/shorts/k1Eh8x0OZhw",
          },
          {
            title: "Open + Close Gates",
            detail:
              "Half mobilization, half activation. Gets the hips loose while moving blood toward the adductors — one of the most important muscle groups for squatting.",
            href: "https://www.youtube.com/shorts/1cpY_x7yr8c",
          },
          {
            title: "Banded Glute Bridge + Abduction",
            prescription: "3 × 10–12 sec",
            detail:
              "Fires up the abductors and glutes in one movement. Use a medium-heavy band around the knees and push outward while holding a glute bridge.",
            href: "https://www.youtube.com/shorts/VAyThZTtt8E",
          },
          {
            title: "Banded Monster Walk",
            prescription: "2 × 20 steps forward and back",
            detail:
              "Keep the knees bent at about 45 degrees and move slowly, contracting the abductors and hips to keep the band pulled apart.",
            href: "https://www.youtube.com/shorts/Ss43G67pjPc",
          },
        ],
        extras: {
          title: "Notable activation warm-ups",
          items: [
            "Tibialis raise + calf raise, 1 × 30 each",
            "Seated quad extension, 1 × 15 @ RPE 1",
            "Single-leg lying hamstring curl, 1 × 15 each leg",
            "Single-leg hip thrusts",
            "5–10 min incline treadmill walk",
          ],
        },
      },
    ],
  },
  {
    slug: "bench",
    title: "Bench",
    heading: "All things bench",
    description:
      "Chest, lat and thoracic mobility for a stronger arch and a cleaner bar path, then rotator cuff and upper back work so the press is supported.",
    blocks: [
      {
        title: MOBILIZATION,
        summary: MOBILIZATION_SUMMARY,
        drills: [
          {
            title: "PVC Shoulder Dislocates",
            prescription: "1 × 10–12 passovers",
            detail:
              "Opens up the chest and gets the shoulders loose through flexion, abduction and external rotation.",
            href: "https://www.youtube.com/shorts/kXvhVDxMwwE",
          },
          {
            title: "T-Spine Extension Foam Rolling",
            prescription: "40–60 sec in position",
            detail:
              "Thoracic extension supported by a foam roller, to promote a stronger arch during the bench press by mobilizing beforehand.",
            href: "https://www.youtube.com/shorts/t7IJ-ogwI5M",
          },
          {
            title: "Overhead Lat Stretch",
            prescription: "2 × 10 sec each arm",
            detail:
              "Loosens the lats while challenging overhead mobility. Loose lats mean a better bar path and better scapular movement on the bench press.",
            href: "https://www.youtube.com/shorts/xUsETzmcYs4",
          },
          {
            title: "Simple Chest Stretch",
            prescription: "2 × 15 sec each arm",
            detail:
              "Old reliable — but add a dynamic pulse, we don't want it completely static. Grab a wall or doorway and pull away to open up; grab higher on the wall to stretch out the pec minor.",
          },
        ],
        extras: {
          title: "Extra dynamic stretches to incorporate",
          items: [
            "Cross-body in and out chest stretch",
            "Scapular wall slide",
            "Cross-body shoulder stretch hold",
            "Elbow on wall triceps stretch",
            "Sleeper stretch",
          ],
        },
      },
      {
        title: ACTIVATION,
        summary: ACTIVATION_SUMMARY,
        drills: [
          {
            title: 'TRX "W" Raise',
            prescription: "2 × 10 reps",
            detail:
              "Forces blood into the rotator cuffs and rhomboids, along with the rear delt and upper back stabilizers. RELAX THE TRAPS — focus on the rotators with your arms in a W position.",
            href: "https://www.youtube.com/shorts/kLEHvFi0R2o",
          },
          {
            title: 'TRX "Y" Raise',
            prescription: "1 × 12 reps",
            detail:
              "Warms up the lower traps and hits the rear delts directly without much rotator involvement. Eliminate all bicep use — this is strictly blood flow to the upper back.",
            href: "https://www.youtube.com/shorts/1W88y0-0YX8",
          },
          {
            title: "Banded External Rotations",
            prescription: "1 × 10–12 each arm",
            detail:
              "Resistance work that warms the rotator cuffs directly. Can also be done with small weighted plates (2.5–5 lb) or light dumbbells.",
            href: "https://www.youtube.com/shorts/PTi9pfttH64",
          },
          {
            title: "Single-Arm Overhead Tricep Extensions with a Plate",
            prescription: "1 × 12 each arm",
            detail:
              "Take a 5–10 lb plate, put your arm above and behind your head with the elbow at 90 degrees, and fire up quickly using the tricep.",
            href: "https://www.youtube.com/shorts/iHCSIoAdGVE",
          },
        ],
        extras: {
          title: "Notable activation warm-ups",
          items: [
            "Pec deck, 1 × 15 (light, blood flow focused)",
            "Single-arm tricep cable pushdowns, 1 × 12 each arm",
            "Incline or regular push-ups, 1 × 20",
            "DB rear delt raises, 1 × 12",
          ],
        },
      },
    ],
  },
  {
    slug: "deadlift",
    title: "Deadlift",
    heading: "All things deadlift",
    description:
      "Stance-specific hip and hamstring work, then posterior chain activation and hinge rehearsal. Sumo and conventional pullers need different things — the tags say which is which.",
    blocks: [
      {
        title: MOBILIZATION,
        summary: MOBILIZATION_SUMMARY,
        drills: [
          {
            title: "Adductor Rockback",
            prescription: "2 × 10 each leg",
            stance: "Sumo",
            detail:
              "Opens up the adductors and groin, and doubles as a pre-hab movement for injury prevention.",
            href: "https://www.youtube.com/shorts/4YQ9Qg3UWow",
          },
          {
            title: "Hip 90/90 Rotations",
            prescription: "1 × 10 rotations",
            stance: "Both",
            detail:
              "Same as the hip 90/90s, with a twist and a dynamic element added. Less emphasis on the shoulders reaching, more on the rotation itself. Applies to squats too.",
            href: "https://www.youtube.com/shorts/4Xhkf_RG5Gc",
          },
          {
            title: "Elephant Walk Stretch",
            stance: "Conventional",
            detail:
              "Gets your T-spine comfortable in a flexed position and gets you comfortable hinging. Great for mobilizing the hamstrings.",
            href: "https://www.youtube.com/shorts/bPO5FW54Qz8",
          },
          {
            title: "World's Greatest Stretch",
            prescription: "1 × 8 each side",
            detail:
              "Good for a lot of things, but the two that matter here are T-spine and hip mobilization. Take your time, and be intentional about squeezing the glutes on the twist.",
            href: "https://www.youtube.com/watch?v=-CiWQ2IvY34",
          },
        ],
        extras: {
          title: "Extra dynamic stretches to incorporate",
          items: [
            "Leg swings, side to side and front to back",
            "Standing toe touches",
            "T-spine foam rolls (extension)",
            "Dead hangs — only if pressure and compression is severe",
          ],
        },
      },
      {
        title: ACTIVATION,
        summary: ACTIVATION_SUMMARY,
        drills: [
          {
            title: "Single-Leg Glute Bridge or Banded Glute Bridge",
            prescription: "1 × 12 each leg, or 3 × 10 sec holds",
            stance: "Both",
            detail:
              "Abduction warm-ups are essential, especially for sumo pullers. Single leg is more glute focused; banded is more abductor focused.",
            href: "https://www.youtube.com/shorts/VAyThZTtt8E",
          },
          {
            title: "Jaffe Extension",
            prescription: "1 × 8–12",
            stance: "Sumo",
            detail:
              "Works as either an accessory or a warm-up. The goal is a movement-specific warm-up for hip wedging.",
            href: "https://www.youtube.com/shorts/crCVcWJw7JE",
          },
          {
            title: "Romanian Deadlift or BB Good Morning",
            prescription: "1 × 10",
            stance: "Conventional",
            detail:
              "Both enforce a hinge position, get blood into the whole posterior chain, and bank the movement pattern reps before the deadlifts themselves. Be VERY generous with the weight.",
            href: "https://www.youtube.com/watch?v=nWyx81AfTos",
          },
          {
            title: "Hip Abduction + Adduction",
            prescription: "1 × 20 each machine",
            stance: "Sumo",
            detail:
              "Twenty light reps at 5–10 RIR on each machine. Creates a lot of blood flow to the hips and prepares them for sumo positioning.",
            href: "https://www.youtube.com/shorts/cN-yIpErXlw",
          },
        ],
        extras: {
          title: "Notable activation warm-ups",
          items: [
            "Every squat warm-up listed on the squat page",
            "Hip thrust machine, 1 × 12–15",
            "Banded hip flexor raises, 1 × 10 each leg (band around the top of the foot)",
            "Stiff-leg deadlift",
          ],
        },
      },
    ],
  },
]

export function getResourceLift(slug: string) {
  return resourceLifts.find((lift) => lift.slug === slug)
}
