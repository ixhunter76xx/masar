# CLAUDE.md — مسار (Masar) / منصة مركز حساب

This file gives Claude Code the context that would otherwise need to be re-explained. Read this in full before making changes. Keep it updated as decisions change — it is the project's memory.

## Project Overview

**Current identity: "مسار" (Masar)** — a public marketplace + learning platform for university course content in Bahrain, starting with Arabic-language courses at the University of Bahrain.

**Origin**: this codebase began as "منصة مركز حساب" (Hesab Center Educational Platform), a custom Arabic-first LMS commissioned by a training center client, functionally modeled on Blackboard Ultra (as used at University of Bahrain). The client withdrew from the project after ~80–85% of the MVP was built. Rather than discard the work, the same repo, database, storage bucket, and hosting were repurposed into Masar — a self-serve marketplace, with the owner (a university student, not the original client) as the operator.

**Working style**: iterative and discussion-first. Planning precedes implementation — do not start a significant architectural change without discussing it first, even if the request sounds actionable on its own. Reference docs (the original Hesab Center planning PDF) are directional context, not binding contracts — Masar has diverged from it substantially (see "What changed" below).

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui components
- **Auth**: Auth.js v5 — single unified login form, no on-screen role selector
- **ORM**: Prisma 7 — **breaking change from earlier versions**: `datasource.url` is NOT in `schema.prisma`, it lives in `prisma.config.ts`
- **Database**: Neon PostgreSQL (project "HesabCenter"), Direct Connection string with `?sslmode=require`, **no `-pooler` hostname**
- **Storage**: Cloudflare R2 bucket (for uploaded content files)
- **Fonts**: IBM Plex Sans Arabic (body), IBM Plex Mono (numbers/grades), via `next/font/google`
- **Layout**: RTL-first throughout — always verify RTL rendering when touching layout/CSS
- **Dev environment**: Windows, PowerShell (execution policy `RemoteSigned`), Node.js v24+
- **Auth.js v5 type extensions**: must target `@auth/core/jwt`, **not** `next-auth/jwt`

### Critical environment note
Project path is `C:\dev\hisab-lms\hisab-lms` and **must stay outside OneDrive sync scope**. OneDrive actively interferes with `node_modules` on Windows and has caused repeated corruption. If the project ever needs to be copied/moved, use `robocopy /XD node_modules` or equivalent to exclude `node_modules` and `.git` history — and always verify `git log --oneline` shows real history after any copy, since fresh/empty `.git` folders have appeared silently more than once during this project's life.

## Design System

Built around the client's actual logo (dark navy circular badge, white bird/wing motif, Arabic text).

- Primary background: `#0D1013`
- Secondary: `#7E9AAE`
- Accent-bright / action: `#8FB2C8` (action-active: `#7FA8C2`)
- Light background: `#EEF3F7`
- **No gold accents**
- **Important**: `#A9C3D4` (accent-bright) must NOT be darkened on dark backgrounds — darkening reduces contrast. The correct fix for contrast issues is increasing saturation, which is how `#8FB2C8`/`#7FA8C2` were derived.

## What Changed: Hesab Center LMS → Masar

> **⚠ Read this before trusting any Masar feature description below.**
> The Masar pivot changed the **database schema, the access layer, and the middleware** — but **not the pages**. The application you actually get when you run this repo is still the Hesab Center LMS. Audited against the source on 2026-08-05; every claim below is marked with what was verified.

The original LMS scope (roles: Super Admin, Academic Coordinator, Instructor, Teaching Assistant, Student, Guest; 4-tab course page — المحتوى/الإعلانات/الدرجات/الرسائل; Tools section removed from nav; role-based Roster) is the **foundation**.

### ✅ Actually built and in the source

- **Product/ProductItem layer** between `Course` and content — allows content reuse across products without duplication. Models exist and are used in `src/lib/data/access.ts`, `grades.ts`, `messages.ts`, `settings/actions.ts`.
- **Product-based access layer** — `src/lib/data/access.ts` exports `hasProductAccess`, `hasCourseAccess`, `canViewLesson`, `canViewQuiz`, `accessibleCourseIds`. The question is now "does the user own a product that unlocks this?", not "is the user enrolled in this course?".
- **`Term`/`Semester` removed entirely** — do not reintroduce it.
- **Prices in fils, not dinars** — `OrderItem.unitPriceFils`, integer precision.
- **Price snapshot pattern** — `OrderItem.titleSnapshot` / `unitPriceFils` freeze price and name at order time.
- **`isFreePreview`** on `CourseMaterial` — the flag exists and is referenced in 5 files.
- Auth by **email**, not username.

### ⚠️ Schema and plumbing only — no UI exists

- `Order`, `OrderItem`, `Payment`, `Enrollment` models exist and migrations are applied, but **nothing in the app reads or writes them**. Three `Product` rows sit in the DB with no page that renders a price.
- `middleware.ts` declares `/`, `/courses`, and `/courses/` as public routes for the planned catalog — **but this is aspirational and currently has no effect**: `src/app/(app)/layout.tsx:19` redirects any session-less visitor to `/login`, and `src/app/page.tsx:4` redirects `/` straight to `/login`. Verified 2026-08-05 by an anonymous request to a course URL on a preview deploy: **HTTP 307 → `/login`** (note: no `?next=` param, which is how you tell the redirect came from the layout, not the middleware). Nothing is publicly browsable today.

### ❌ Described in earlier versions of this file but never built

Do not assume these exist. None of them are in the source:

- **Public catalog** — `/courses` renders "مقرراتي — ما تملك وصولًا إليه", a logged-in course list, not a storefront.
- **Self-signup** (`/signup`) — route does not exist.
- **`/learn` study environment** — does not exist. The learning environment is still `/courses/[courseId]` with the original 4 tabs and the instructor upload panel.
- **`/settings/orders` admin order queue** — does not exist (404s on a live preview).
- **`markOrderPaid()` / `src/lib/data/orders.ts`** — neither the file nor the symbol appears anywhere in the source.
- **Video progress tracking UI** — the `LessonProgress` model exists; no page drives it.

## Payment Architecture — A DESIGN, NOT AN IMPLEMENTATION

> **⚠ None of the flow below is implemented.** Verified 2026-08-05: `markOrderPaid` does not appear anywhere in the source, `src/lib/data/orders.ts` does not exist, `/settings/orders` 404s, and there is no `wa.me` link or `manual_benefit` string in the repo. Only the **schema** for it exists. Treat this whole section as the agreed design to build toward — the constraints and reasoning are still valid and worth preserving — but do not write code that calls into it as if it were there.

**Current state: no live payment gateway.** The site owner is a Bahraini university student without a Commercial Registration (CR), which is typically required to open a merchant account with a gateway like Tap Payments. Until a lightweight license is obtained (Virtual Commercial Registration or Freelancer/Home Business License — both lighter than a full company CR), payments are **intended** to be handled manually:

1. Student clicks "طلب الدورة" (request course) → creates an `Order` with status `PENDING`. No payment happens yet.
2. Student is shown a WhatsApp link (`wa.me`), pre-filled with the order number, to message the site owner directly.
3. Owner and student agree on payment via personal Benefit Pay transfer, arranged entirely inside the WhatsApp conversation (the Benefit number is **not** shown anywhere on the site — deliberately, to reduce exposure).
4. Owner reviews in `/settings/orders` (admin-only) and clicks confirm, entering a reference note (e.g. `"بنفت #4471"`).
5. Confirming should call **`markOrderPaid(orderId, tx)`**, to live in `src/lib/data/orders.ts` — intended as **the single writer** for anything that grants purchase-based access. It would set `Order.status = PAID`, create the `Payment` record (`provider = "manual_benefit"`, `providerPaymentId` = the reference the student gives), and create the `Enrollment`. **This function has not been written yet — writing it is the first step of implementing the flow.**

### Why this matters for future work
When a real payment gateway (Tap Payments) is eventually integrated, its webhook handler should be the **only other caller** of `markOrderPaid()`. Do not build a second/parallel access-granting path for the gateway — that duplication is exactly what would introduce the kind of bug that gets missed for months. The switch to a live gateway should be "add one `route.ts` file that calls the existing function," not a rewrite. The single-writer rule is the reason to build `markOrderPaid()` first, before any UI that grants access.

### Order/Payment schema notes
- `OrderStatus`: `PENDING` → `PAID` / `CANCELLED` / `REFUNDED`. `FAILED` is reserved for future gateway use (not used by the manual flow). There is intentionally **no** `UNDER_REVIEW` or `REJECTED` status — WhatsApp itself is the review queue, so those statuses were considered and rejected as unnecessary complexity.
- `Payment` has `reviewedById`, `reviewedAt`, `reviewNote` — records who approved a manual payment and when. This matters for dispute resolution later, even though it seems unnecessary now.
- `Payment` has a unique constraint on `(provider, providerPaymentId)` — this is what prevents double-processing, whether from a double-click on "confirm" today or a webhook retry from Tap later.
- `Enrollment` has a unique constraint on `(userId, productId)` — prevents duplicate access grants from repeated approval clicks.
- Orders stay open indefinitely — no expiry/cron job (explicit decision, revisit if abandoned-cart volume becomes a problem).
- Only the `ADMIN` role can confirm payments (explicit decision).
- `User.phone` was added specifically to generate the `wa.me` links in the admin order queue.

### Legal context (not legal advice — for engineering awareness only)
Moving payment collection off-platform to a personal Benefit account resolves Tap's merchant-account requirement, but does **not** by itself remove the underlying obligation to register a business for regularly receiving payment for a service in Bahrain. This is a known, accepted interim tradeoff while the owner pursues lightweight licensing — not an oversight. Don't "fix" this by re-adding a payment gateway without confirming licensing status first.

## Known Bugs Fixed During the Masar Pivot (context for why certain code looks the way it does)

1. **Security-relevant, and partly inaccurate as originally written.** The story was that renaming `/courses/` → `/learn/` flipped `PUBLIC_PREFIXES` and briefly exposed the paid learning environment, with `requireUser()` as the second layer that still blocked access. Audited 2026-08-05: **there is no `/learn` route and no `requireUser()` symbol in this repo** — that rename never landed here. What is true and still worth knowing: `PUBLIC_PREFIXES` in `src/middleware.ts` currently lists `/courses/`, which *is* the learning environment, so the middleware alone would let anyone through. The thing actually stopping that is `src/app/(app)/layout.tsx:19`. **The lesson stands: routing-layer "public" lists and the layout guard must be reasoned about together, and neither alone is the security boundary.** Confirmed not exploitable today (anonymous request → 307 `/login`).
2. **RTL bug**: `.numeric` class sets `direction: ltr`, and the browser computes `-start-`/`-end-` logical properties relative to the *element's own* direction, not the page's. This silently flipped numbered "course path" nodes to the wrong side in 4 places (`AttemptRunner`, two grade pages, video duration badge). Fixed in all 4, and the rule is documented in `globals.css` — **read that comment before adding new numeric/LTR-styled elements in an RTL layout.**
3. ~~Catalog grid `auto-fill` → `auto-fit`.~~ **Unverifiable — neither `auto-fill` nor `auto-fit` appears anywhere in the source (checked 2026-08-05).** Either the fix lives in a form this note doesn't describe, or it was never made here. Do not rely on this entry.
4. ~~Nav "مقرراتي" pointed at `/courses` instead of `/learn`.~~ **Not applicable — `/learn` does not exist in this repo.** `/courses` is the only course route, so the nav is correct by default.
5. "الإعدادات" (Settings) nav item was showing to students and led to a blank page. Now hidden for the student role.

> Entries 1, 3 and 4 above were wrong or unverifiable when audited. Treat the rest of this file's historical claims as needing a source check before you act on them — and when you check one, update it here with the date, as done above.

## Known, Documented, Not Yet Fixed

- **Production `DATABASE_URL` is not the pooled endpoint.** Verified 2026-08-05 via `netlify env:list`: the Netlify site `hisab-lms` sets `DATABASE_URL` to the Neon **direct** host (`ep-quiet-water-axtvmi6n.c-4...`, no `-pooler`), and sets no `DIRECT_URL` at all. This contradicts `README.md` and `.env.example`, which both require the runtime URL to be pooled — every serverless instance opening a direct connection is how Neon's connection quota gets exhausted under load. Untouched so far because it is a Netlify env-var change, not a code change. There is exactly one database: the same Neon endpoint backs local dev, migrations, and the deployed site — **there is no separate production database.**

- Admin `/settings/...` 404 page returns HTTP status `200` instead of `404`. This is a Next.js streaming-related quirk; the actual access-control check is unaffected (i.e., this is a wrong status code, not a security hole). Deliberately left as-is per owner's instruction — don't "fix" this without checking whether it's still deprioritized.
- A CSP-related artifact was found during local E2E testing: `router.refresh()`'s RSC request got blocked by `upgrade-insecure-requests` when the local test server ran on bare HTTP. This is a **test-environment-only artifact** (production on Netlify is HTTPS already, so no upgrade/block occurs there) — confirmed by inspecting the response header and by reloading the page (which showed the correct state). Worth a sanity check after the first real production deploy, but not currently believed to be a real bug.

## Database & R2 Reset — Read Before Resetting Either One

**The rule: never reset the database and R2 independently. Reset both together, or neither.**

R2 object keys embed database-generated ids. See `src/server/r2.ts`:

- `videoObjectKey()` → `courses/{courseId}/videos/{materialId}.mp4`
- `submissionObjectKey()` → `courses/{courseId}/assignments/{assignmentId}/{submissionId}.{ext}`

Both `courseId` and `materialId` are Prisma `cuid()`s, generated at insert time. So **resetting the database regenerates every id, which orphans every existing R2 object — even if you never touch the bucket.** The objects keep paying for storage while being unreachable from the app, since nothing in the DB points at those keys anymore. The reverse is equally broken: wiping R2 alone leaves `CourseMaterial` rows with `status = READY` whose files no longer exist, which fails at stream time rather than at page load.

This is not hypothetical — it already happened once. An audit on 2026-08-05 found the bucket held exactly one object, an assignment submission PNG under `courses/cmsakfq7l0001isukemxl0etn/...`, while the live ARAB110 course id was `cmsdbih8s00020wukz406v2nr`. A prior DB reset had orphaned it. The bucket has since been wiped.

### Don't mistake seeded placeholders for real uploads
`prisma/seed.ts` creates the four ARAB110 lessons with placeholder keys `seed/ARAB110/1..4` and `status = PENDING`. **These are not files and never were** — no object exists at those keys. A lesson only corresponds to a real R2 object once an admin upload has driven it to `status = READY` (see the `complete` branch in `src/app/api/courses/[courseId]/videos/route.ts`). Judge "is there real content?" by `status = READY` plus an actual `ListObjectsV2`, never by row count.

### Audit before any reset
List the bucket and diff it against `CourseMaterial.objectKey` ∪ `Submission.objectKey`. Anything in the bucket with no matching row is already orphaned; any `READY` row with no matching object is already broken. Do this first — it is read-only and takes a minute.

### Prisma blocks agent-initiated resets
`npx prisma migrate reset --force` is refused when Prisma detects it was invoked by an AI agent. It requires `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` set to the exact text of the user's consent message, and explicitly does not accept earlier messages as implicit consent. This guard is correct — leave it in place and ask the owner each time.

### Two standing cautions for this specific database
- Neon `neondb` is the **only** database; it is not a separate dev instance and the deployed Netlify site reads from it. Treat every reset as production-touching regardless of how empty it currently looks.
- Re-seeding recreates `admin@masar.bh` / `ustath@masar.bh`. Their passwords are **no longer hard-coded** (they were `Admin@123` / `Teacher@123` until 2026-08-05): `prisma/seed.ts` reads `SEED_ADMIN_PASSWORD` / `SEED_TEACHER_PASSWORD` from `.env`, and when those are unset it generates 24 random bytes per account and prints them once at the end of the seed run. **Capture that output — it is the only time the password is shown.** Note both vars must live in `.env`, not `.env.local`: the Prisma CLI does not read `.env.local`.
- `seed.ts` uses `ensureUser()` (find-then-create), not `upsert`. This is deliberate: `upsert` with `update: {}` silently leaves an existing account's password untouched, so a generated password would be printed but never applied — worse than a known one, because it looks like it works. Keep this property if you touch the seed.

### `migrate reset` does not run the seed here
Observed 2026-08-05: `npx prisma migrate reset --force` dropped and re-migrated cleanly but **did not** invoke `migrations.seed` from `prisma.config.ts` — the DB was left completely empty (0 users, 0 courses). Run `npx prisma db seed` as a separate second step and verify row counts afterwards. Don't assume the reset re-seeded.

## Deferred / Not Started

- ~~Reset the Neon DB and clean the R2 bucket~~ — **done 2026-08-05.** The bucket was wiped (it held one orphaned test PNG, no real content) and the DB was reset and re-seeded. Both are now clean and consistent: 2 seeded users, 1 course, 4 `PENDING` lessons, 3 products, 0 orders, and an empty bucket.
- **The entire Masar application layer.** The schema, access layer and middleware are ready; the pages are not. Roughly in dependency order:
  1. `markOrderPaid()` in `src/lib/data/orders.ts` — build this **first**, it is the single writer for access grants
  2. Public catalog: make `/` and `/courses` genuinely reachable without a session (today the `(app)` layout blocks them regardless of what the middleware says)
  3. Product/pricing display and the "طلب الدورة" → `Order(PENDING)` + `wa.me` link flow
  4. `/settings/orders` admin queue calling `markOrderPaid()`
  5. `/signup` self-signup
  6. `/learn` study environment (or decide `/courses/[courseId]` stays the learning environment and drop `/learn` from the plan)
- Admin screens for product/pricing management
- Redeploy production — it is three days and ~12 commits behind (see Deployment section)
- Tap Payments webhook integration (blocked on licensing — see Payment Architecture section)

## Deployment (Netlify) — Facts Established 2026-08-05

Site `hisab-lms` → `https://hisab-lms.netlify.app`, project id `c4f1e74f-5254-485b-9a5c-ac40e0b3c32d` (matches `.netlify/state.json`). Build command `npm run build` and publish dir are configured **in the Netlify UI**, not in a committed `netlify.toml`; the Next.js runtime comes from `@netlify/plugin-nextjs`.

- **The site is not git-connected.** All deploys so far were manual CLI deploys — the deploy records carry no `branch` or `commit_ref`. Nothing deploys automatically when you commit.
- **Production is badly stale.** Only two deploys exist, both from 2026-08-01, while the newest commit is 2026-08-04. Production is running pre-Masar code: old "مركز حساب" branding and **username** login, from before `d8c0447` (Masar schema) and `63dc825` (email auth). Anything you test on the live URL is testing three-day-old code.
- **`npm run build` runs `prisma migrate deploy`.** Every deploy touches the production database. Harmless when nothing is pending, but know it happens.

### Deploying from a local machine
Use `npx netlify deploy --build --context dev` for a draft, and add `--prod` only when promoting.

The `--context dev` part is **required**, and the reason is non-obvious: Netlify stores these env vars as *secret* values, so the API returns them masked (last 4 characters only) for the `production`, `deploy-preview`, and `branch-deploy` contexts. A local build in any of those contexts receives the **mask itself** as the variable's value, and `prisma migrate deploy` then fails with a confusing `P1013: The scheme is not recognized in database URL` plus a `Datasource "db": PostgreSQL database` line with no host. Only the `dev` context returns real values to a local build.

The same masking is a trap when auditing: `netlify env:list` run locally reports the **`dev`-context** value, not production's. Do not use it to prove what production points at — query `getEnvVars` and read the per-context entries instead, and remember you will only see the last 4 characters of each.

### `AUTH_URL` is pinned to the production origin
`AUTH_URL=https://hisab-lms.netlify.app` while `src/auth.config.ts` also sets `trustHost: true`. On a preview deploy, any redirect to `/login` lands on the **production** domain instead of the preview host — observed 2026-08-05, which meant a preview test silently ended up on the old production build. Harmless in production (the origins match) but it will break the first time a custom domain is added, and it limits what can be tested on previews.

## Build & Verify

```powershell
npm install
npx prisma generate
npx prisma migrate dev   # or: npx prisma migrate reset --force  (if resetting Neon)
npm run build
npm run dev
```

Look for an existing `webapp-testing`-style E2E pass before considering a change to orders/auth/routing complete — this project has caught real bugs (see above) only through actual browser testing against a seeded local Postgres DB, not from code review alone.
