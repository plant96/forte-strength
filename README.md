# Forte Strength Systems

Source for [fortestrength.org](https://fortestrength.org). For now the site has one tool, the
**TDEE calculator** at `/tdee-calculator`. `/` redirects there with a temporary 307 until a
homepage exists.

## Stack

Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript (strict) ·
Tailwind CSS v4 · shadcn/ui (Radix) · Motion · React Hook Form + Zod · KaTeX · Vitest

## Scripts

```bash
pnpm dev          # start the dev server
pnpm build        # production build
pnpm start        # serve the production build
pnpm test         # run the test suite once (pnpm test:watch to watch)
pnpm lint         # ESLint
pnpm typecheck    # generate route types, then tsc
pnpm format       # Prettier (with Tailwind class sorting)
```

## Layout

```
src/
  app/                 routes, root layout, metadata files (icons, manifest, robots, sitemap)
  components/          shared UI: ui/ (shadcn), brand/, layout/, motion/, math/
  config/site.ts       site name, URL, navigation
  lib/                 shared helpers (unit conversions)
  features/<name>/     one folder per tool
    lib/               pure calculation code (no React) + tests
    components/        the tool's UI
    schema.ts          form validation
```

New tools go in their own `features/<name>/` folder with a route under `src/app/(tools)/`,
plus an entry in `config/site.ts` so they show up in the nav and sitemap.

## TDEE calculator

- **BMR** is the average of Revised Harris-Benedict, Mifflin-St Jeor, and Katch-McArdle
  (`features/tdee/lib/bmr.ts`).
- **Activity multiplier** is Forte's own model: a step curve plus a training curve, minus an
  overlap correction, kept within 1.01–1.80. The tunable constants are in `ACTIVITY_MODEL` in
  `features/tdee/lib/activity.ts`.
- **Targets** add or subtract `3500 × DD / 7` kcal/day, with DD in lb/week. kg rates are converted
  to lb first (`features/tdee/lib/goals.ts`).
- **View the calculations** shows every step with the user's numbers filled in. It's built from
  the same result object the calculator uses (`features/tdee/lib/formulas.ts`), so the panel
  can't drift from the real math.
