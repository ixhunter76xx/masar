# Handoff — design vision session

Written 2026-08-13, at the end of a long session. Read this before touching
anything in `design/vision/`. `CLAUDE.md` on this branch is the `master`
copy and knows **nothing** about the work described here.

---

## Say this to open the new session

> اقرأ `design/vision/HANDOFF.md` أولًا — نحن على فرع `masar-vision` ونكمل
> معاينة التصميم البصرية.

---

## 1 · Branch map

| branch | head | vs master | pushed? | what it is |
|---|---|---|---|---|
| `master` | `c1afb92` | — | yes | live. Netlify auto-deploys every push to it. |
| `masar-design-2` | `270bcdf` | +6 | yes | the **real code** design pass. Open as **PR #1**, not merged. |
| `masar-vision` | `4b3ff4b` | +9 | **NO — local only** | this work. Isolated HTML preview. |

**⚠ `masar-vision` has never been pushed.** Nine commits exist only on this
machine. Push it before relying on it surviving.

**⚠ Merging anything to `master` publishes to production.** There is one
database behind everything and no staging step.

### PR #1 (`masar-design-2`) — separate, still waiting
Faculty stations in the real app, widened surface ladder, type scale,
always-visible syllabus with «قيد الرفع», resume in «مقرراتي», catalogue
navigation. CI green. Owner wanted to see CI himself before merging. It is
**independent of the vision branch** — do not entangle them.

---

## 2 · What this branch contains

Two files only. **Nothing under `src/` is touched and it must stay that way.**

```
design/vision/index.html      the whole preview, self-contained
design/vision/logo-masar.png  the new logo (see §6)
```

### Run it
```bash
npx serve design/vision -l 4321
```
Or `preview_start` with the `masar-vision` entry already in
`.claude/launch.json` (port 4321). **Open `/index.html`, not `/`** — the bare
root sometimes fails in the preview pane.

`file://` does **not** work: the preview pane renders it as a static snapshot
and no JavaScript runs.

### What is in it
Four screens behind a top switcher — **الكتالوج · صفحة المقرر · الدراسة ·
لوحة التحكم** — plus a theme switcher with five directions.

---

## 3 · Decisions that are locked

**The theme is `مسار`, taken from the new logo.** Warm neutral charcoal, no
blue. Monochrome by design because the logo is: primary actions are filled
bone-white, text is quieter unfilled white — the distinction is *fill*, not
hue. One amber (`--spark`) reserved strictly for progress and achievement.

⚠ The amber contradicts the inherited "no gold accents" rule in `CLAUDE.md`.
That rule belonged to the Hesab Center identity which this logo replaces. It
is flagged in the file and can be reversed on request.

**Four faculties only** — الآداب، تقنية المعلومات، العلوم، الهندسة. Owner's
explicit decision. The unlit stations are a real roadmap claim, so nine
promised more breadth than intended.

**Empty-faculty wording is «لم تُطرح بعد», never «قريبًا».** The second
promises a timetable nobody controls.

**The other four themes (حبر · شفق · ورق · هدوء) are kept for comparison
only.** Delete them once `مسار` is confirmed final.

---

## 4 · Rejected ideas — do not re-propose these

This is the highest-value section. Each was built and killed for a reason.

| rejected | why |
|---|---|
| «شرح مقرَّرك الجامعي كما يُدرَّس» | description any tutoring site could write |
| «مقرَّرك الجامعي مشروحًا خطوة بخطوة» | same |
| «شرحٌ لمقرَّرك، لا لموضوعه» | wordplay — asks the visitor to solve a puzzle before they know what the site is. Owner called it "غبي جدا" |
| «من أول محاضرة إلى ليلة الامتحان» | "slightly better" but still weak |
| Stat row (٤ كليات · ١٢ مقررًا · ٨٤٠+ طالبًا) | the last number was **invented**; on a live site with one course it is a lie. The others announce how small the catalogue is |
| «معدّل اختباراتك ٨٧٪» | vanity — changes no decision, leads to no action |
| Deadline / «الاختبار النصفي — الأحد القادم» | the platform is not a calendar and does not know the university timetable |
| The segmented bundle bar | abstract strips with a caption explaining how to read them. **A design needing a caption has failed** — the owner could not read it |
| Five-stop journey timeline in the hero | text disguised as a picture; a column of phrases beside a column of prose |
| Side-view student silhouette | replaced by the over-the-shoulder angle from the owner's reference photo |
| Visible `border` on scene objects | reads as vector art. Edges must come from light and shadow only |

**Current headline: «مقرَّرك، مفهومًا.»** on one line (`white-space:nowrap`).
Owner has not endorsed it either. Live alternatives offered: «افهم مقرَّرك.» ·
«مقرَّرك، لا موضوعه.» · «ابدأ من حيث توقّفت المحاضرة.»

---

## 5 · The hero scene (most recent work)

Built from a reference photo the owner supplied: **looking down past a
student's shoulder at a lit desk at night.**

It is a genuine CSS 3D scene, not skewed flat shapes:
- `.stage3d` has `perspective`, `.deskplane` is `rotateX(58deg) rotateZ(-13deg)`
  with `preserve-3d`
- books, papers, mug lie on the plane; the laptop stands on it
- **the laptop screen is a real HTML panel** hinged at the far edge of the
  base, so the worked example renders in perspective
- the panel rotates every 7.2s between four faculties: إعراب · a loop and its
  output · the product rule · static equilibrium
- motion: steam on three offset cycles, lamp breathing, slow camera drift
- the four "poses" are **shoulder shifts** — from this angle you never see a
  seated body, so animating one would be a lie

### Known weak points the owner named
1. **Shoulder is too faint** to read.
2. **Screen is small and heavily foreshortened** — text needs checking.
3. **No lamp body** — the reference has a green banker's lamp; ours is light
   with no object.

These three are the next task unless redirected.

---

## 6 · The logo

`design/vision/logo-masar.png` — copied from `C:\dev\hisab-lms\logo masar.png`.

The charcoal background is **baked into the PNG** and happens to equal
`--panel-high` in the `مسار` theme, so it is shown as a badge with its own
ground rather than knocked out. It is cropped via `background-position` to
skip the file's wide margins.

**⚠ Ask for an SVG.** SVG inherits colour (so it works on all five themes) and
stays sharp at any size. The PNG does neither.

⚠ `public/logo-masar.png` in the repo is the **old** blue calligraphic mark —
unrelated, do not confuse them.

---

## 7 · Standing rules from the owner

- **Never touch `src/`, the Prisma schema, payments, or bundle-access logic**
  in this phase. Visual preview only.
- **Never touch `src/components/motion/PageTransition.tsx`** — it holds
  `FrozenRouter`, which silently kills every `router.refresh()` while the
  build stays green.
- **RTL must be tested every time.** This repo has a documented history of
  direction bugs.
- Skills: `improve-animations` is **plan-only, never `execute`**.
  `pick-ui-library` must **never install without showing first**, and must
  disclose that Sonner is the skill author's own library. `prototype` and
  `review-animations` are `disable-model-invocation: true` — only the owner
  can run them via `/prototype`.

---

## 8 · Technical traps already hit (do not repeat)

- **Class-name collision.** `.screen` already means "page section" in this
  file and carries `display:none`. The laptop panel is `.lap` for that reason.
- **Laptop hinge.** Hinging the screen on top of the base lays it face-down —
  a closed laptop, invisible. It hinges at the far edge (`bottom:100%`).
- **Bulk CSS replacement swallowed a line.** A scripted range replace ate the
  hero's `@media(min-width:940px)` rule and collapsed the layout. Verify line
  ranges before replacing.
- **Bidi.** «٢ / ٥» inside one numeric run renders «٥ / ٢» in RTL. Split into
  two isolated numerals with an Arabic word between them.
- **No positive `letter-spacing` on Arabic** — it breaks the joins. Negative
  tracking on large headings is fine and wanted.
- **No raw horizontal transforms.** `translateX` moves toward physical left
  whatever the direction, so it means the opposite thing in RTL. Audit with
  `grep -rn "translate-x-\[" src/`.
- **Preview pane letterboxes at some widths.** 1000×680 and 900×620 composite
  1:1; 1180+ sometimes returns a stale or offset frame. If a screenshot looks
  broken, verify with the DOM before believing it.

---

## 9 · Open questions for the owner

1. Is «مقرَّرك، مفهومًا.» the headline, or one of the alternatives?
2. Fix the three weak points in §5, or change direction again?
3. Delete the four comparison themes now that `مسار` is chosen?
4. Push `masar-vision` to the remote?
5. Merge PR #1 (`masar-design-2`) — separate decision, CI is green.
