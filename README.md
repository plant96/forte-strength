# Forte Strength Systems

Source for [fortestrength.org](https://fortestrength.org), the site for Coach Tyler Montano's
powerlifting team. It has:

- **Landing page** (`/`) about Coach Ty and his coaching, leading to the application.
- **Coaching application** (`/application`). Saved to the database, emailed to the coach, and
  copied to the applicant.
- **Tools** (`/tools`): the TDEE calculator, which autofills from a signed-in user's profile,
  and the PR tracker (`/tools/pr-tracker`), where clients log personal records and watch the
  line climb.
- **Resources** (`/resources/mobility-vault`): the mobility, flexibility and warm-up vault, with a
  page per lift.
- **Website accounts** (Clerk) with onboarding (`/onboarding`) and a profile (`/profile`). These
  are for site users, separate from coaching clients.
- **Admin panel** (`/admin`) for Coach Ty to review applications, browse users, mark coaching
  clients and edit his coach profile. Every date, time and chart bucket in it is Eastern
  (`ADMIN_TIME_ZONE` in `src/lib/dates.ts`), on a 12-hour clock, and follows daylight saving
  automatically because it names the zone rather than an offset.
- **Traffic analytics** (`/admin/analytics`) with traffic trends, sources, visitor locations,
  device breakdowns, a searchable visitor log and automatic retention.

Some areas are **client-only** — see [Client-only areas](#client-only-areas).

## Stack

Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript (strict) ·
Tailwind CSS v4 · shadcn/ui (Radix) · Motion · React Hook Form + Zod · Clerk · Prisma 7 +
Neon Postgres · Resend + React Email · Vitest

Analytics charts use Recharts; the SVG world map uses Natural Earth land data from `world-atlas`.

## Setup

1. `pnpm install` (also generates the Prisma client).
2. Copy `.env.example` to `.env.local` and fill it in:
   - **Neon**: the pooled `DATABASE_URL` and the direct `DATABASE_URL_UNPOOLED`, from the Neon
     dashboard's connection details.
   - **Clerk**: the publishable and secret keys from the Clerk dashboard.
   - **Resend**: `RESEND_API_KEY`, and an `EMAIL_FROM` address on a domain you've verified in
     Resend. Until the domain is verified, Resend only delivers to your own Resend account's
     email. Without a key, emails are printed to the server console instead of sent.
   - `NEXT_PUBLIC_SITE_URL` is the site's public URL, used for links in emails.
3. `pnpm db:migrate` creates the tables. `pnpm db:seed` adds the coach profile. Re-running the
   seed never overwrites edits made in the admin panel.
4. `pnpm dev`

Pages that don't need the database (the landing page, the calculator, the sign-in pages) still
render without it and fall back to the default coach profile in `src/config/coaching.ts`.

### Making Coach Ty an admin

The admin role is stored in the database, not in Clerk:

1. Sign up on the site with the account that should be the admin.
2. Run `pnpm db:studio`, open the **User** table, set that user's `role` to `ADMIN`, and save.
3. Reload the site. An **Admin** button appears in the nav.

Everyone else gets a 404 at `/admin`.

## Scripts

```bash
pnpm dev          # start the dev server
pnpm build        # production build
pnpm start        # serve the production build
pnpm test         # run the test suite once (pnpm test:watch to watch)
pnpm lint         # ESLint
pnpm typecheck    # generate route types, then tsc
pnpm format       # Prettier (with Tailwind class sorting)

pnpm db:migrate   # create/apply migrations in development (prisma migrate dev)
pnpm db:deploy    # apply migrations in production (prisma migrate deploy)
pnpm db:seed      # add the coach profile if it's missing
pnpm db:studio    # browse and edit the database
```

## Layout

```
prisma/                schema.prisma, migrations, seed.ts
src/
  app/
    (marketing)/       landing page, /application, /gallery, /resources
    tools/             /tools, /tools/tdee-calculator, /tools/pr-tracker
    (account)/         /onboarding, /profile
    (auth)/            Clerk sign-in / sign-up
    admin/             admin panel (own layout)
  components/          shared UI: ui/ (shadcn), forms/, layout/, marketing/, motion/, brand/
  config/              site.ts (nav), coaching.ts (default coach profile), images.ts
  emails/              React Email templates
  features/<name>/     one folder per feature: schema.ts, actions.ts, queries.ts, components/
  lib/                 shared helpers (units, dates, email, form parsing)
  server/              db.ts (Prisma client), auth.ts (current user, admin checks)
  proxy.ts             Clerk middleware; protects /onboarding, /profile and /admin
```

### Adding a tool

Put it in its own `features/<name>/` folder with a route under `src/app/tools/`, then add it
to `tools` in `src/config/site.ts`. It shows up in the nav's Tools menu and the sitemap.
Wrap the page in `ToolShell` (`components/layout/tool-shell.tsx`) for the shared header.

### Client-only areas

The PR tracker and the mobility vault are perks of coaching. Access is
`User.clientSince != null` **or** `role === "ADMIN"`, checked by `canAccessClientArea` in
`server/auth.ts`. Mark an entry `locked: true` in `src/config/site.ts` and the nav dims it,
adds a lock and a "Clients" pill, and swaps its description for an apply prompt.

Gating happens **in the page, not only in its layout**. Next renders page segments
independently of whether the parent layout includes `children`, so a layout-only check still
ships the real content in the RSC payload. The pattern is:

```tsx
// layout.tsx — what the visitor sees
if (!canAccessClientArea(user)) return <ClientOnlyGate feature="…" signedIn={…} />

// page.tsx — so there is nothing to ship
if (!(await hasClientAreaAccess())) return null
```

Server actions and privileged queries re-check for themselves, since they are reachable by
direct POST. Locked pages stay in the sitemap: they render an indexable preview that sells the
coaching application rather than redirecting to sign-in.

### Images

The landing page uses placeholder images from `public/images/placeholders/`. They're all listed
in `src/config/images.ts`. To use a real photo, add the file to `public/images/` and change its
path there.

## Accounts and profiles

- New sign-ups go to `/onboarding`, a 4-step wizard: birthday, sex and size; body fat; activity;
  review. It can be skipped, and a banner under the nav reminds the user until it's done.
- The profile stores a birthday rather than an age. Age is worked out each time it's used.
  Weight and height are kept in the units the user chose.
- When a signed-in user with a profile opens the calculator, the form is filled in from it, and
  a notification says so, with a link to settings. Every field can still be changed.

## Coaching applications

- Each field's wording and answer options live in `features/applications/options.ts`. The form,
  the admin panel and the emails all read from it.
- Drafts are saved in the browser as the applicant types.
- On submit the application is saved first. The emails are sent after the response, so a failed
  email never loses an application:
  - **To the coach** (`APPLICATION_NOTIFY_EMAIL`): every answer plus a **View in admin panel**
    link. Replying goes straight to the applicant.
  - **To the applicant**: a copy of their answers. Replying goes to the coach.
- The thank-you page offers an optional free account. Applications aren't linked to accounts.

## Admin panel

- **Applications**: search by name, email, Instagram, phone or location. Filter to Unprocessed,
  Processed or All. Each application has a detail page with contact links, key facts and every
  answer, **Newer/Older** buttons, **Mark processed / unprocessed**, and **Delete**, which asks
  for confirmation first.
- **Users**: website accounts only, separate from applicants. Search by name or email. Each
  user's detail page shows their profile and estimated maintenance calories, and a **Make client**
  button that marks the account as a coaching client.
- **Clients**: the website users marked as clients, most recent first, with the same search.
- **Coach profile**: name, title, credentials, bio, home base, where the team's lifters are, and
  the **world / American / state record counts**. Saving updates the landing page and the
  calculator's coaching card for everyone.

## Traffic analytics

Open **Admin → Analytics** (`/admin/analytics`). Reports include page views, visitors,
sessions, bounce rate, visible time on page, period comparisons, traffic charts, top pages,
referrers and campaigns, countries and cities, devices, browsers, operating systems,
languages, a world map, an hourly activity heatmap, and a searchable, paginated visitor log.
Bot-like user agents are filtered out by default. The live count means visitors with a
recorded page view in the last five minutes, rather than a continuous presence indicator.
Browsers that block the collector and bots that do not execute JavaScript are not counted.

The browser sends an asynchronous request to `/api/collect` on page navigation and reports
visible time when a view is hidden or ends. Admin, API, internal Next.js and sign-in/sign-up
paths are excluded. No form answers or account IDs are included. First-party HTTP-only
cookies identify a visitor for up to a year and group page views into sessions with a
30-minute gap. The public `/privacy` notice describes this collection and is linked in the footer.

Configuration is documented in `.env.example`:

- `ANALYTICS_RETENTION_DAYS`: visit rows, including full IP addresses, expire after 90 days
  by default. Accepts whole days from 1 through 3650; invalid values fall back to 90.
  All charts use the retained history, so a 12-month range cannot recover purged data.
- `ANALYTICS_GEOIP_ENDPOINT`: optional JSON endpoint with an `{ip}` placeholder, such as
  `https://ipapi.co/{ip}/json/`. Hosting location headers are used first. Leave blank for
  headers only; enabling a provider sends visitor IPs to that provider. Local/private IPs
  are not looked up. Location is approximate, and absent data is shown as unknown.
- `CRON_SECRET`: a random secret of at least 16 characters, required for scheduled cleanup.

On Vercel, `vercel.json` schedules a daily request to `/api/cron/analytics-retention` at
06:00 UTC. Set `CRON_SECRET` in the production environment before deploying;
[Vercel sends it as a bearer token](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
On another host, schedule a daily GET to the same URL with `Authorization: Bearer <CRON_SECRET>`.
The endpoint rejects requests if the secret is unset or incorrect. The collector also runs
cleanup in the background, at most daily per warm process, as a fallback when traffic arrives.
Keep the scheduler enabled to clean up even when the site has no traffic; a daily schedule
can leave expired rows until the next successful run. Failed cleanup runs log an error.

The analytics migrations are included in `prisma/migrations`. Run `pnpm db:deploy` before
deploying the feature to another database. Collection failures do not interrupt page navigation.
On self-hosted deployments, the reverse proxy must replace client-supplied forwarding and
location headers with trusted values before forwarding requests to Next.js.

Admin controls can immediately purge expired visits or erase stored IP addresses while
keeping counts and locations. Erasing IPs does not prevent new visits from recording new IPs.

## TDEE calculator

- **BMR** is the average of Revised Harris-Benedict, Mifflin-St Jeor, and Katch-McArdle
  (`features/tdee/lib/bmr.ts`).
- **Activity multiplier** is Forte's own model: a step curve plus a training curve, minus an
  overlap correction, kept within 1.01–1.80. The tunable constants are in `ACTIVITY_MODEL` in
  `features/tdee/lib/activity.ts`.
- **Targets** add or subtract `3500 × DD / 7` kcal/day, with DD in lb/week. kg rates are converted
  to lb first (`features/tdee/lib/goals.ts`).
- **Intensity levels**: the wording shown under the picker and in the Reference guide lives in
  `INTENSITY_LEVELS` in `features/tdee/lib/constants.ts`.
- **Macros**: three splits (Standard, High protein, High carb) at 4/4/9 kcal per gram, built from
  maintenance or any bulk/cut target (`features/tdee/lib/macros.ts`).
- **View the calculations** shows every step with the user's numbers filled in. It's built from
  the same result object the calculator uses (`features/tdee/lib/formulas.ts`), so the panel
  can't drift from the real math.
- The body and activity fields are shared with onboarding and the profile
  (`features/tdee/components/body-fields.tsx`), so all three forms match.
