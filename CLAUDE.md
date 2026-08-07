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

> **⚠ The 2026-08-05 audit below is now obsolete. Re-audited 2026-08-06.**
> That audit concluded the pivot had changed the schema, access layer and middleware "but not the pages," and that the app you get is still the Hesab Center LMS. **That is no longer true** — the application layer was built after it was written. Verified 2026-08-06 by running the app and by anonymous HTTP requests (no cookies):
>
> | Route | Anonymous status | |
> |---|---|---|
> | `/` | 307 → `/courses` | not `/login` |
> | `/courses` | **200** | public catalog renders |
> | `/courses/arab110` | **200** | prices, tiers, free-preview |
> | `/signup` | **200** | self-signup exists |
> | `/learn`, `/settings/orders` | 307 | correctly protected |
>
> `markOrderPaid()` exists in `src/lib/data/orders.ts`, `/settings/orders` is a working queue with `wa.me` links and confirmed payments carrying reviewer + reference notes, and `/learn/[courseId]` is the study environment. **Trust the source over any prose in this file, and re-date what you check.**

The original LMS scope (roles: Super Admin, Academic Coordinator, Instructor, Teaching Assistant, Student, Guest; 4-tab course page — المحتوى/الإعلانات/الدرجات/الرسائل; Tools section removed from nav; role-based Roster) is the **foundation**.

### ✅ Actually built and in the source

- **Product/ProductItem layer** between `Course` and content — allows content reuse across products without duplication. Models exist and are used in `src/lib/data/access.ts`, `grades.ts`, `messages.ts`, `settings/actions.ts`.
- **Product-based access layer** — `src/lib/data/access.ts` exports `hasProductAccess`, `hasCourseAccess`, `canViewLesson`, `canViewQuiz`, `accessibleCourseIds`. The question is now "does the user own a product that unlocks this?", not "is the user enrolled in this course?".
  - ~~⚠ `canViewLesson` and `canViewQuiz` have no call sites.~~ **Fixed 2026-08-06** — both are now the real gates (see the paid-bundles section). The warning behind the note still stands and is why it is kept: **a rule is not enforced because it is implemented, only because it is called.** That gap existed for months and cost the bundle boundary.
- **`Term`/`Semester` removed entirely** — do not reintroduce it.
- **Prices in fils, not dinars** — `OrderItem.unitPriceFils`, integer precision.
- **Price snapshot pattern** — `OrderItem.titleSnapshot` / `unitPriceFils` freeze price and name at order time.
- **`isFreePreview`** on `CourseMaterial` — the flag exists and is referenced in 5 files.
- Auth by **email**, not username.

### ✅ Also built since — all verified 2026-08-06

The previous audit listed these as "never built". They are all in the source now:

- **Public catalog** — `(public)/courses` and `(public)/courses/[slug]`, reachable with no session. The course page renders the three product tiers, per-tier lesson lists, the "الأوفر" saving badge, and a free-preview player.
- **Self-signup** — `(auth)/signup` with its own `actions.ts`.
- **`/learn` study environment** — `(app)/learn` and `(app)/learn/[courseId]` with the 4 tabs. `/courses/[slug]` is now the *storefront*; `/learn/[courseId]` is the *classroom*. Two different pages — don't conflate them.
- **`/settings/orders` admin queue** — real, with `wa.me` links, cancel, and confirm-with-reference.
- **`markOrderPaid()`** — exists in `src/lib/data/orders.ts` and takes `{orderId, provider, paymentRef, reviewedById, reviewNote, rawPayload}`. The single-writer rule held: `settings/orders/actions.ts` is its only caller today, and a gateway webhook should be the second.
- **Orders for the buyer** — `(app)/orders` and `(app)/orders/[number]`.

Still schema-only: **video progress tracking** (`LessonProgress` exists; no page drives it).

## Payment Architecture — A DESIGN, NOT AN IMPLEMENTATION

> **⚠ The "not implemented" warning that stood here is obsolete — the flow is built.** Re-verified 2026-08-06: `markOrderPaid()` lives in `src/lib/data/orders.ts`, `/settings/orders` renders a working queue, and `src/lib/whatsapp.ts` generates the `wa.me` links. Steps 1–5 below describe what the code now does, not a plan. The constraints and reasoning are unchanged and still binding — especially the single-writer rule.

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
2. **RTL bug**: `.numeric` class sets `direction: ltr`, and the browser computes `-start-`/`-end-` logical properties relative to the *element's own* direction, not the page's. This silently flipped numbered "course path" nodes to the wrong side in 4 places (`AttemptRunner`, two grade pages, video duration badge). Fixed in all 4, and the rule is documented in `globals.css` — **read that comment before adding new numeric/LTR-styled elements in an RTL layout.** A second `.numeric` bug of the same family was found and fixed 2026-08-05: the class used `unicode-bidi: embed`, which opens a directional run without isolating it, so two adjacent numeric spans inside one RTL line merged into a single number — "سؤال ١ من ٤" followed by "١ درجة" rendered as "سؤال 1 من 41 درجة". Now `unicode-bidi: isolate`, which fixes the whole class. **Any two numbers that end up adjacent in the markup were affected, not just this one place.**
3. ~~Catalog grid `auto-fill` → `auto-fit`.~~ **Unverifiable — neither `auto-fill` nor `auto-fit` appears anywhere in the source (checked 2026-08-05).** Either the fix lives in a form this note doesn't describe, or it was never made here. Do not rely on this entry.
4. ~~Nav "مقرراتي" pointed at `/courses` instead of `/learn`.~~ **Not applicable — `/learn` does not exist in this repo.** `/courses` is the only course route, so the nav is correct by default.
5. "الإعدادات" (Settings) nav item was showing to students and led to a blank page. Now hidden for the student role.

> Entries 1, 3 and 4 above were wrong or unverifiable when audited. Treat the rest of this file's historical claims as needing a source check before you act on them — and when you check one, update it here with the date, as done above.

## Known, Documented, Not Yet Fixed

- **Production `DATABASE_URL` is not the pooled endpoint.** Verified 2026-08-05 via `netlify env:list`: the Netlify site `hisab-lms` sets `DATABASE_URL` to the Neon **direct** host (`ep-quiet-water-axtvmi6n.c-4...`, no `-pooler`), and sets no `DIRECT_URL` at all. This contradicts `README.md` and `.env.example`, which both require the runtime URL to be pooled — every serverless instance opening a direct connection is how Neon's connection quota gets exhausted under load. Untouched so far because it is a Netlify env-var change, not a code change. There is exactly one database: the same Neon endpoint backs local dev, migrations, and the deployed site — **there is no separate production database.**

- The "not found" page returns HTTP status `200` instead of `404`. A Next.js streaming quirk; access control is unaffected (wrong status code, not a security hole). Deliberately left as-is per owner's instruction — don't "fix" it without checking whether it's still deprioritized. **Scope is wider than previously recorded** (measured 2026-08-06 as a signed-in student, via same-origin `fetch` so the session cookie was sent): `/settings`, `/settings/orders`, `/settings/users` **and** `/orders/<someone else's number>` all render the 404 page with status **200**.
  - Consequence for testing: **status code cannot tell you whether access was denied.** Assert on the rendered page instead. And do not test this with a raw `fetch` + string match on the response body — the not-found boundary markup ships inside *every* RSC payload, so "الصفحة غير موجودة" appears in the HTML of pages that rendered perfectly well. Match on something only the real page contains (a price, a title) or read the rendered DOM.
- ~~A CSP artifact blocks `router.refresh()` on bare HTTP; test-environment only.~~ **This entry was wrong and has been deleted. It was a real production bug, fixed 2026-08-05 — see "The `router.refresh()` bug" below. Do not reintroduce the CSP explanation: it cost two sessions and produced a false "the button is broken" report.**

## The `router.refresh()` Bug — Fixed 2026-08-05, Read Before Touching `PageTransition`

**Symptom, if it ever returns:** a button appears dead. The server action succeeds, the database changes, no error is shown anywhere, and the screen does not update. Reloading shows the change was there all along.

**What it actually was.** `FrozenRouter` inside `src/components/motion/PageTransition.tsx` captured `LayoutRouterContext` once with `useRef` and served that frozen value for the lifetime of the keyed subtree. The key is the pathname. `router.refresh()` does not change the pathname, so the subtree was never remounted and went on reading a stale context — the refreshed RSC payload arrived and was discarded.

**Confirmed by network, not by guessing:** the action `POST` returns **200** and the follow-up `GET …?_rsc=…` also returns **200**. Nothing is blocked. The response is fetched and ignored.

**Blast radius — every `router.refresh()` in the product:**
- Adding a question to a quiz. The question was created; the editor kept showing the old count. This is what made it look like an instructor could never build a quiz.
- **Confirming a payment in `/settings/orders`.** `markOrderPaid()` ran, the order became `PAID`, the `Enrollment` was created — and the order stayed sitting in the "بانتظار التأكيد" column. An admin watching the screen would reasonably click confirm again.

**The fix.** Freeze only the *outgoing* copy: a subtree whose mount-time pathname still equals the current pathname is the live one and must read context directly; only a subtree left behind with a different pathname is exiting and stays frozen until its exit animation finishes. `FrozenRouter` now takes a `mountedPath` prop for exactly this comparison.

**If you touch `PageTransition`, re-test with a `router.refresh()` path** — adding a quiz question is the fastest one — and watch the screen update *without* reloading. A passing build proves nothing here; the failure is silent by construction.

## The Double App Shell — Fixed 2026-08-06, Read Before Adding a Route Under `/learn/[courseId]/`

**Symptom:** two «تسجيل الخروج» buttons stacked on the page, two `<header>`s, the course tab strip appearing on pages that are not tabs, and — the part that actually breaks something — **two `<main id="main">` elements**. Duplicate `id` is invalid HTML and makes the «تخطٍ إلى المحتوى» skip link ambiguous for assistive tech.

**Cause.** `AppPage` (`src/components/shell/AppPage.tsx`) renders `Topbar` + `<main id="main">`. The course layout rendered it *and* every nested page rendered it again, so the shell nested. Affected `assignments/new`, `assignments/[assignmentId]`, `quizzes/new`, `quizzes/[quizId]`, and `quizzes/[quizId]/attempt/[attemptId]` — verified in the browser: `main#main` count was **2** on each.

**The fix — a `(tabs)` route group.** The course layout is for the four tabs only (المحتوى/الإعلانات/الدرجات/الرسائل), so those four plus `layout.tsx` and `loading.tsx` moved into `learn/[courseId]/(tabs)/`. `quizzes/` and `assignments/` now sit outside that layout and keep their own `AppPage`. Route groups do not appear in URLs — **every route path is byte-identical before and after**, confirmed against the build output.

**Why this was safe:** every page under `[courseId]` already calls `requireCourseAccess()` itself and does not lean on the layout for its access check (the announcements page even documents this). Moving the layout therefore removed no security boundary. `loading.tsx` moved too — its skeleton draws the course header *with four tab placeholders*, so it only ever fitted the tab pages; nested routes now fall back to `(app)/loading.tsx`.

**The rule going forward:** a new page under `/learn/[courseId]/` must render `AppPage` **only** if it lives outside `(tabs)/`. Inside `(tabs)/`, return a bare fragment — the layout supplies the shell. If you add a route and see the nav twice, this is why.

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
- **If the printed password was lost, `npx prisma db seed` will not help** — `ensureUser()` finds the existing account and leaves its password alone, by the design just above. Use `scripts/set-seed-passwords.mts` (added 2026-08-06), which reads `SEED_ADMIN_PASSWORD` / `SEED_TEACHER_PASSWORD` from `.env` and applies them to the existing rows. It refuses to run without those vars, so no credential is ever hard-coded in the repo.

### `migrate reset` does not run the seed here
Observed 2026-08-05: `npx prisma migrate reset --force` dropped and re-migrated cleanly but **did not** invoke `migrations.seed` from `prisma.config.ts` — the DB was left completely empty (0 users, 0 courses). Run `npx prisma db seed` as a separate second step and verify row counts afterwards. Don't assume the reset re-seeded.

## Deferred / Not Started

- ~~Reset the Neon DB and clean the R2 bucket~~ — **done 2026-08-05.** The bucket was wiped (it held one orphaned test PNG, no real content) and the DB was reset and re-seeded. Both are now clean and consistent: 2 seeded users, 1 course, 4 `PENDING` lessons, 3 products, 0 orders, and an empty bucket.
- ~~**The entire Masar application layer.**~~ **Built — all six steps done, verified 2026-08-06.** `markOrderPaid()`, the public catalog, pricing + "طلب الدورة" → `Order(PENDING)` + `wa.me`, the `/settings/orders` queue, `/signup`, and `/learn` as the study environment (the "or drop `/learn`" question resolved in favour of keeping it — `/courses/[slug]` is the storefront, `/learn/[courseId]` the classroom).
- Admin screens for product/pricing management — **still not built.** `/settings` has الطلبات and المستخدمون only; the three `Product` rows and their prices are seed-only and not editable in any UI.
- ~~**Instructor-role sweep is incomplete.**~~ **Done 2026-08-06**, signed in as `ustath@masar.bh` against a production build on :3100. Announcements, assignments and the gradebook were covered on the admin account first (it passes `canManageCourse` on the identical path); course messages had to wait for the real instructor, since the messages tab deliberately excludes the admin account ("المحادثات خاصة بطرفيها، ولا يشارك فيها حساب الإدارة"). Sending a message works, renders live, and shows an unread receipt.

- **Deferred: finish the real video upload.** *Add `http://localhost:3100` to the R2 bucket's CORS `AllowedOrigins` in the Cloudflare dashboard, or re-test on :3000 later.* Not a code defect — attempted 2026-08-06 with a genuine MP4 and the server started a real multipart upload (valid `uploadId`), then the browser's cross-origin PUT was refused because `AllowedOrigins` lists `http://localhost:3000` (see README) and **not** `:3100`. The whole platform works on :3100; only the upload fails, which is what makes it look like a bug.
  - The client cleans up correctly on failure: it aborts the R2 multipart upload and removes the `CourseMaterial` row, so a failed attempt leaves no orphan in either place (verified — only the 4 seeded lessons remained).
  - The origin check is **port-sensitive**. A host-only reading of `AllowedOrigins` is exactly what hides this, so the upload error messages now name the port explicitly.
  - Still genuinely untested end-to-end: a completed upload driving a lesson to `status = READY`, and playback from R2.

- **Student and registered-visitor roles are still unexercised.** `student.test@masar.bh` (bought, has a graded attempt and an instructor message) and `fresh.visitor@masar.bh`. Their passwords never existed anywhere — both accounts came from self-signup testing, not the seed — so `scripts/set-seed-passwords.mts` now covers them via `SEED_STUDENT_PASSWORD` / `SEED_VISITOR_PASSWORD`.
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

## Paid Bundles — Fixed 2026-08-06. Read Before Adding Any Content Type

**The rule, decided by the owner:** an assessment follows its lesson's scope *exactly*. A quiz or assignment built on a lesson is visible only to someone holding a bundle that contains that lesson. `lessonId = null` means course-wide — an assessment that measures no single unit — and that is the default every existing row still has.

### The symptom it fixed

`fresh.visitor@masar.bh` bought `دورة المنتصف` (8 د.ب, lessons ١–٢). With the quiz attached to `النحو` and the assignment to `البلاغة` — both in the half they did **not** buy — before the fix they saw and could open both, identically to the 14 د.ب full-course buyer.

### Why it happened

Three separate paths each asked a *course-level* question, and the one function that asked the right question had no callers:

- `getCourseMaterials` / `getCourseQuizzes` never received a `userId` at all — they could not scope by product even in principle.
- `getPlaybackUrl` asked "does this lesson's **course** contain some product the user owns?" — true for any buyer of any bundle, so it would have served every lesson in the course.
- `canViewLesson` asked it correctly and was dead code.
- Nothing linked an assessment to a lesson: `Quiz` and `Assignment` had only `courseId`, and `ProductItemKind` models lessons and quizzes only — so an assignment could not belong to a bundle at all. **The schema gap was the root cause**; no amount of query fixing could scope an assignment without it.

### The fix

1. **Schema** — `Quiz.lessonId` and `Assignment.lessonId`, both nullable, `ON DELETE SET NULL` so deleting a lesson never destroys a quiz with its attempts and grades. Migration `20260806000000_link_assessments_to_lessons` is purely additive.
2. **One rule, one implementation** — `canViewQuiz` and the new `canViewAssignment` *delegate* to `canViewLesson` when `lessonId` is set, and fall back to course-wide access when it is null. They do not re-derive the answer, so the two cannot drift.
3. **`accessibleLessonIds(courseId)`** — the batched form of the same rule, one query, for list filtering. Lists use it; single-item pages use `canViewLesson`/`canViewQuiz`/`canViewAssignment`.
4. **`getPlaybackUrl`'s parallel logic was deleted, not patched** — it now calls `canViewLesson` and keeps only the draft check (`publishedAt`), which is about readiness, not ownership.

**Every path is gated, not just the views** — list, open quiz, open assignment, **start attempt**, **submit assignment**, and **video playback**. Hiding a page while its API still answers is the failure mode this was written to avoid.

### The evidence

Signed in as each account against a production build on :3100, quiz on `النحو` and assignment on `البلاغة`:

| | `fresh.visitor` (midterm) | `student.test` (full) |
|---|---|---|
| content list | **empty** — "لا يوجد محتوى بعد" | both shown |
| quiz by direct URL | **404** | opens, 4/4 history intact |
| assignment by direct URL | **404** | opens with submit form |
| `POST …/submission` (bypassing the UI) | **404** `الواجب غير متاح لك.` | **200** + signed upload URL |

The same API call answering 404 for one buyer and 200 for the other is the proof that matters. Announcements, messages, grades and orders were unchanged for both — those are course-scoped by design.

### Free preview never opens an assessment — decided and enforced 2026-08-06

**The rule:** `isFreePreview` is a **content** affordance. It opens the video so a visitor can judge the teaching before paying. It confers no entitlement to graded work. An assessment always requires real ownership through `ProductItem`, even when it hangs off the free lesson.

**How the code says it.** `ownsLesson()` is the strict check — `ProductItem` ownership or staff, no preview branch. `canViewLesson()` is `ownsLesson()` *plus* the preview door, and is for lessons only. `canViewQuiz`/`canViewAssignment` call `ownsLesson` and never `canViewLesson`. Do not "simplify" them back into one function; that collapse is the bug.

**The batched form must stay split too.** `accessibleLessonIds()` returns **two** sets: `viewable` (owned ∪ free preview) filters *lectures*, `owned` filters *assessments*. Merging them re-opens the hole in listings even while the page guard holds — the list and the page would then disagree, which is how it hides.

**Why it is not merely theoretical — and narrower than it first looks.** A user who bought *nothing* never reaches the course at all: `requireCourseAccess` → `hasCourseAccess` demands a product in that course. The real exposure is a buyer of a *different* bundle in the same course. `الاستفهام` is the free-preview lesson **and** belongs to `midterm`; so a `final`-only buyer, who never bought `midterm`, would have been handed its assessments purely because that lesson is free to preview.

**Evidence — one account, one session, only the linkage changed:**

| assessment linked to | `fresh.visitor` holding `final` only | |
|---|---|---|
| `الاستفهام` (free preview, **not** owned) | list: **absent** · page: **404** · `POST …/submission`: **404** | blocked |
| `النحو` (owned via `final`) | list: **shown** · page: **opens** | allowed |
| `null` (course-wide) | list: **shown** | allowed |

The middle and bottom rows are the controls: the same filter that hides the first row lets these through, so it is ownership resolution and not blanket hiding.

### Still unproven end to end

**Lesson playback.** All four lessons are `PENDING`, so `getPlaybackUrl` returns null at the `READY` filter before ownership is consulted. The rewrite is right by construction and typechecked, but the real test — a `midterm` buyer requesting a `final` lesson's stream and getting **404 instead of a 302** — waits on the first successful upload.

**Starting an attempt.** `startAttempt` is guarded by `canViewQuiz` in the same way the page is, but it is a server action and was not invoked directly; the evidence above covers the page and the assignment's REST write path. Exercise it once a bundle-scoped quiz exists.

## ~~⚠ Paid Bundles Are Not Enforced~~ — the original finding, kept for context

Found 2026-08-06 during the four-role sweep, fixed the same day (see above). **This was the most consequential open issue in the repo**, and it is the exact thing the `Product`/`ProductItem` layer was introduced to prevent.

**The business model sells parts of a course.** `دورة المنتصف` (8 د.ب) = lessons ١–٢, `دورة النهائي` (8 د.ب) = lessons ٣–٤, `الدورة الكاملة` (14 د.ب) = all four. `ProductItem` maps each product to its lessons/quizzes, and `hasProductAccess`/`canViewLesson` implement the per-product question correctly.

**Nothing in the running code asks that question.** Every path a student actually goes through scopes by *course*:

| function | scoping | takes `userId`? |
|---|---|---|
| `getCourseMaterials` (`materials.ts:46`) | `courseId` + `READY` + published | **no** — only `role` |
| `getCourseQuizzes` (`quizzes.ts:23`) | `courseId` + publish status | **no** — only `role` |
| `getPlaybackUrl` (`server/video-url.ts`) | material's course has **some** product the user is enrolled in | yes, but never joins `ProductItem` |
| `canViewLesson` (`access.ts:103`) | **correct per-product check** | — **no call sites** |

`getPlaybackUrl`'s student filter asks "does this lesson's *course* contain any product this user owns?", not "does a product this user owns contain this lesson."

**Empirically confirmed today.** No product contains the quiz — all three bundles hold only `LESSON` items — yet `fresh.visitor@masar.bh`, enrolled in `midterm` alone, sees `اختبار الاستفهام` on the course page, identical to the full-course buyer. Quizzes are course-scoped in practice. Assignments are too, and more fundamentally: `ProductItemKind` only models lessons and quizzes, so an assignment cannot belong to a bundle at all.

**Not yet observable for lessons, and here is why.** All four lessons are `PENDING`, so the `status = READY` filter rejects them before product logic would matter — a correct and an incorrect implementation both return nothing. **The moment one real upload lands, a `midterm` buyer will see and play the `final` lessons**, i.e. the 14 د.ب bundle for 8. Do not read today's empty list as evidence that scoping works.

**The test to run once a lesson is `READY`:** sign in as a `midterm`-only buyer and request `/api/courses/<courseId>/videos/<a final-only lesson>/stream`. A 302 to a signed R2 URL is the bug. Do not test with a `PENDING` lesson — it 404s either way and proves nothing.

**Fix direction (needs a product decision first, do not just patch):** route lesson listing and playback through `ProductItem` — most likely by making `canViewLesson` the single gate and deleting the parallel logic in `getPlaybackUrl`, mirroring the single-writer rule that `markOrderPaid()` follows. Two open questions the code cannot answer alone: should **quizzes** be bundle-scoped (they are already `ProductItem`-capable but none are mapped), and should **assignments** become bundle-scopable (needs a schema change)? A defensible answer is that lessons are the paid unit and quizzes/assignments stay course-wide — but that must be a decision, not an accident.

## The Free Preview Is Advertised but Not Playable Yet — Two Access Paths That Disagree

Established 2026-08-06. Nothing is broken for users today, but the next person to build the preview player will walk into this.

**The storefront sells it.** `/courses/arab110` renders «جرّب درسًا كاملًا مجانًا قبل أن تدفع», a «مجاني» badge on lesson 1, and a large play button. **The button is a deliberate placeholder** — `src/app/(public)/courses/[slug]/page.tsx:225` says so: «المشغّل الحقيقي يأتي في مرحلة الشراء — هذا زرّ يمهّد له». It has no handler.

**The trap is what happens when someone wires it up.** There are two access implementations and they disagree about free preview:

| | free preview honoured? | used by anything? |
|---|---|---|
| `canViewLesson` (`access.ts:113`) | **yes** — returns `true` for `isFreePreview` on a published course, before requiring a user | **no call sites** |
| `getPlaybackUrl` (`server/video-url.ts`) | **no** — no `isFreePreview` branch at all; students must have an enrolment | yes — the only playback path |

So the rule is implemented in the function nobody calls, and absent from the one that actually runs. On top of that, `stream/route.ts:22` returns **401 before** consulting either — confirmed with an anonymous request to the free-preview lesson: `401 {"error":"غير مصرّح."}`.

**Net effect if the button is naively pointed at the stream route:** a logged-out visitor gets 401, and a signed-in visitor who has not bought gets 404 — the free preview silently fails for exactly the two audiences it exists to convert, with no error that names the cause.

**Fix it in the playback path, not by loosening the route.** `getPlaybackUrl` needs the `isFreePreview` branch (and to accept an anonymous caller for that case only); `stream/route.ts` must stop rejecting anonymous requests *before* the access check. Deleting the unused `canViewLesson` in favour of one real path would be better than leaving two.

**Also still true:** no lesson has a file. All four are `status = PENDING` with placeholder `seed/ARAB110/*` keys and the bucket is empty, so even a correct player has nothing to play until a real upload lands (see the deferred CORS item).

## Never Run `next dev` and `next start` at the Same Time Here

**Symptom:** the site on **:3100** shows «تعذّر تحميل المنصة» (that string is `src/app/global-error.tsx`, the *root* boundary) or «حدث خطأ غير متوقع» (`src/app/error.tsx`). The page HTML arrives fine — `curl` gets HTTP 200 with real content — but the browser console says `ChunkLoadError: Loading chunk NNNN failed`. Hit 2026-08-06.

**Why.** `.claude/launch.json` defines two servers in the same folder: `masar-dev` (`next dev`, :3000) and `masar-prod` (`next start`, :3100). `next.config.ts` sets no `distDir`, so **both use the same `.next` directory**. Two independent ways that breaks:

1. **Rebuilding under a live `next start`.** Chunk filenames are content-hashed. `next build` renames every chunk whose code changed, so a server started before the build goes on serving HTML that points at chunk names now deleted → `ChunkLoadError`. Routes whose source did *not* change keep their hash and keep working — which is why `/courses` looked healthy while `/learn/...` was broken, and why the fault looks random.
2. **`next dev` writing into `.next` while a production build lives there.** Produces a half-dev/half-prod tree; the giveaway is a server-side `Cannot find module './vendor-chunks/*.js'` in the `next start` log, from `.next/server/webpack-runtime.js`.

**The recovery** (stop *both*, then rebuild — a rebuild alone is not enough):

```powershell
# stop dev AND prod first, then:
Remove-Item -Recurse -Force .next
npm run build:local      # next build only — no prisma migrate deploy
npx next start -p 3100
```

**The rule:** run one or the other, not both. Diagnose from the **browser console and the server log**, not from `curl` — the HTML is a 200 either way, and the status code tells you nothing. If the two ever need to run together, give them separate build dirs (`distDir` in `next.config.ts`, driven by an env var, with the same value set for build and start) — not done today.

## Build & Verify

```powershell
npm install
npx prisma generate
npx prisma migrate dev   # or: npx prisma migrate reset --force  (if resetting Neon)
npm run build
npm run dev
```

Look for an existing `webapp-testing`-style E2E pass before considering a change to orders/auth/routing complete — this project has caught real bugs (see above) only through actual browser testing against a seeded local Postgres DB, not from code review alone.
