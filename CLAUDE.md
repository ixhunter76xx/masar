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

The original LMS scope (roles: Super Admin, Academic Coordinator, Instructor, Teaching Assistant, Student, Guest; 4-tab course page — المحتوى/الإعلانات/الدرجات/الرسائل; Tools section removed from nav; role-based Roster) is the **foundation**, but Masar's pivot added/changed:

- **Product/ProductItem layer** inserted between `Course` and content — allows content reuse across products without duplication
- **Public catalog** pages, no login required to browse
- **Self-signup** for students (`/signup`)
- **`Term`/`Semester` concept removed entirely** — do not reintroduce it
- **Multi-instructor model simplified** to a single specialized instructor per course
- **Prices stored in fils, not dinars** (integer precision, avoid float rounding issues) — `OrderItem.unitPriceFils`
- **Price snapshot pattern**: `OrderItem.titleSnapshot` / `unitPriceFils` freeze the price and name at order time, so later catalog price changes don't affect pending/historical orders
- Video progress tracking (for course content)

## Payment Architecture — Read This Before Touching Orders/Payments

**Current state: no live payment gateway.** The site owner is a Bahraini university student without a Commercial Registration (CR), which is typically required to open a merchant account with a gateway like Tap Payments. Until a lightweight license is obtained (Virtual Commercial Registration or Freelancer/Home Business License — both lighter than a full company CR), payments are handled **manually**:

1. Student clicks "طلب الدورة" (request course) → creates an `Order` with status `PENDING`. No payment happens yet.
2. Student is shown a WhatsApp link (`wa.me`), pre-filled with the order number, to message the site owner directly.
3. Owner and student agree on payment via personal Benefit Pay transfer, arranged entirely inside the WhatsApp conversation (the Benefit number is **not** shown anywhere on the site — deliberately, to reduce exposure).
4. Owner reviews in `/settings/orders` (admin-only) and clicks confirm, entering a reference note (e.g. `"بنفت #4471"`).
5. Confirming calls **`markOrderPaid(orderId, tx)`** in `src/lib/data/orders.ts` — this is **the single writer** for anything that grants purchase-based access. It sets `Order.status = PAID`, creates the `Payment` record (`provider = "manual_benefit"`, `providerPaymentId` = the reference the student gives), and creates the `Enrollment`.

### Why this matters for future work
When a real payment gateway (Tap Payments) is eventually integrated, its webhook handler should be the **only other caller** of `markOrderPaid()`. Do not build a second/parallel access-granting path for the gateway — that duplication is exactly what would introduce the kind of bug that gets missed for months. The switch to a live gateway should be "add one `route.ts` file that calls the existing function," not a rewrite.

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

1. **Security-relevant**: renaming `/courses/` → `/learn/` accidentally flipped `PUBLIC_PREFIXES`, briefly making the paid learning environment publicly reachable at the routing layer (a second layer, `requireUser()`, still blocked real access — so it was not fully exploitable, but the first layer was wrong). Fixed, with a warning comment left in the file. **Be careful with any further route renaming near this constant.**
2. **RTL bug**: `.numeric` class sets `direction: ltr`, and the browser computes `-start-`/`-end-` logical properties relative to the *element's own* direction, not the page's. This silently flipped numbered "course path" nodes to the wrong side in 4 places (`AttemptRunner`, two grade pages, video duration badge). Fixed in all 4, and the rule is documented in `globals.css` — **read that comment before adding new numeric/LTR-styled elements in an RTL layout.**
3. Catalog grid used `auto-fill`, so a catalog with a single course rendered it at 1/3 width with dead space around it. Changed to `auto-fit` with a max card width.
4. Nav: "مقرراتي" (My Courses) pointed to `/courses` (the public sales catalog) instead of `/learn` (the study environment) — leftover from the `/courses`→`/learn` rename. Fixed.
5. "الإعدادات" (Settings) nav item was showing to students and led to a blank page. Now hidden for the student role.

## Known, Documented, Not Yet Fixed

- Admin `/settings/...` 404 page returns HTTP status `200` instead of `404`. This is a Next.js streaming-related quirk; the actual access-control check is unaffected (i.e., this is a wrong status code, not a security hole). Deliberately left as-is per owner's instruction — don't "fix" this without checking whether it's still deprioritized.
- A CSP-related artifact was found during local E2E testing: `router.refresh()`'s RSC request got blocked by `upgrade-insecure-requests` when the local test server ran on bare HTTP. This is a **test-environment-only artifact** (production on Netlify is HTTPS already, so no upgrade/block occurs there) — confirmed by inspecting the response header and by reloading the page (which showed the correct state). Worth a sanity check after the first real production deploy, but not currently believed to be a real bug.

## Deferred / Not Started

- Reset the Neon DB to a clean state and recreate/clean the R2 bucket (test data currently lives in both)
- Further build-out of the `/learn` study environment
- Admin screens for product/pricing management
- Tap Payments webhook integration (blocked on licensing — see Payment Architecture section)

## Build & Verify

```powershell
npm install
npx prisma generate
npx prisma migrate dev   # or: npx prisma migrate reset --force  (if resetting Neon)
npm run build
npm run dev
```

Look for an existing `webapp-testing`-style E2E pass before considering a change to orders/auth/routing complete — this project has caught real bugs (see above) only through actual browser testing against a seeded local Postgres DB, not from code review alone.
