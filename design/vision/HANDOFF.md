# Handoff — design vision session

Written 2026-08-13, at the end of a long session. Read this before touching
anything in `design/vision/`. `CLAUDE.md` on this branch is the `master`
copy and knows **nothing** about the work described here.

---

## ⚠ Status: NOT approved. The visual work continues.

The owner's words at handoff: **«الشكل الجديد الذي وصلنا له ليس مقنع كليا»** —
the look reached so far does not convince him, and the new session is to
**carry on developing it from here**, not to polish a finished thing.

So: treat everything in `index.html` as a live draft. The structure and the
decisions in §3 are settled; **the visual result is not.** The three items in
§5 are the ones he named out loud, but they are a starting list, not the full
extent of what is unsatisfying.

Do not open the new session by asking "is this good?" — assume it is not yet,
and bring something better.

### One honest note on how to converge faster

This has now taken many rounds because taste feedback without a reference
loops. The single thing that moved it fastest was the **photograph** he sent
for the hero angle — one image ended more argument than several paragraphs
had. If the next round stalls again, ask for a reference for the screen being
worked on (any site, any field) rather than iterating blind.

---

## Say this to open the new session

> اقرأ `design/vision/HANDOFF.md` أولًا — نحن على فرع `masar-vision`، والشكل
> الحالي غير مقنع بعد، ونكمل تطويره من حيث توقفنا.

---

## 1 · Branch map

| branch | head | vs master | pushed? | what it is |
|---|---|---|---|---|
| `master` | `c1afb92` | — | yes | live. Netlify auto-deploys every push to it. |
| `masar-design-2` | `270bcdf` | +6 | yes | the **real code** design pass. Open as **PR #1**, not merged. |
| `masar-vision` | `0004cea` | +10 | **NO — local only** | this work. Isolated HTML preview. |

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
| **Depicting a scene with CSS boxes at all** | 2026-08-13. See §5a. The frame's loudest objects carried no information and its only informative object was its smallest. Not a polish problem — a ceiling |

**Current headline: «مقرَّرك، مفهومًا.»** on one line (`white-space:nowrap`).
Owner has not endorsed it either. Live alternatives offered: «افهم مقرَّرك.» ·
«مقرَّرك، لا موضوعه.» · «ابدأ من حيث توقّفت المحاضرة.»

---

## 5 · The hero — replaced 2026-08-13. Read §5a first.

### 5a · Current: «اللوح» — the explanation *is* the picture

The desk below was diagnosed as having a ceiling, and the ceiling was
reached. Rendered in CSS boxes, a night desk reads as a pile of grey
rectangles: nothing in the frame is nameable except the three white
sheets, which are the **brightest and largest objects and carry no
information**. The laptop screen — the only element that says what
Masar does — was the **smallest** thing in the frame and the most
foreshortened. The hierarchy was inverted, so polish could not fix it.

**What replaced it.** The explanation itself, at full size and legible,
in a warm lamp pool. The mood survives; the drawn objects do not,
because drawing objects with boxes is what read as clip art.

Two content shapes, because the knowledge has two shapes:
- **`parse`** — إعراب: each word large in **Amiri**, its ruling hung
  beneath on a hairline tie. This is the strongest asset on the page —
  Arabic set well is the one thing no English competitor has, and it
  was previously being spent on a 12px label.
- **`steps`** — an expression, steps revealing one by one, a result.

Rotates every 7.2s over **three** faculties, and the dots are buttons
so nobody waits. Toggle `اللوح / المكتب` under the hero switches
directions; the loser gets deleted.

**Decisions worth not re-litigating:**
- **Three faculties, not four.** An `ENGG201` example was running in the
  hero while «كلية الهندسة» says «لم تُطرح بعد» one screen below. The
  page contradicted itself. What rotates now is exactly what is lit.
- **Fixed height (`min-height` + footer pinned by `margin-top:auto`).**
  The states differed by **73px**, so the hero resized every 7.2s.
- **The result value uses `--accent-bright`, not `--spark`.** Amber
  stays reserved for progress/achievement per §3. A correct answer is
  not progress.
- **The board is content, so it is *not* `aria-hidden`.** The desk was,
  correctly, because it was decoration.
- **Colour via tokens, never raw `rgba`** — the desk hard-coded black
  and broke in «ورق». Verified in all five themes.

**Two overflow bugs fixed on the way**, both invisible behind
`body{overflow-x:hidden}` and both of which made *every phone
screenshot a lie* by shifting the page sideways:
- the preview's own top bar didn't fit under 760px (**+350px**),
- the lamp pool's negative horizontal inset (**+35px**). It is now
  clipped to its box — the glow still spills, because `filter:blur`
  paints outside the box without counting toward layout.

### 5b · Previous: the desk (kept behind the toggle)

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

**These were not fixed, and deliberately so.** They are three symptoms of
the diagnosis in §5a — the approach itself, not its execution. Fixing
them would have bought a better pile of grey rectangles. If the owner
picks `المكتب` over `اللوح`, fix them then.

### Screens that have had almost no design attention
Everything above concerns the catalogue hero. Two screens are still close to
their first draft and are the weakest in the file:
- **الدراسة (study)** — a player and a list, no character at all.
- **بطاقات المقررات** — uniform rectangles; the course code watermark is not
  enough personality.

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

The first is the live one; the rest can wait.

1. **`اللوح` or `المكتب`?** The toggle under the hero switches them. This
   is now the live question, and the loser should be deleted rather than
   left to rot. If neither convinces, the next thing to ask for is a
   **reference image** — one photo ended more argument here than several
   paragraphs had.
2. Is «مقرَّرك، مفهومًا.» the headline, or one of the alternatives in §4?
3. Delete the four comparison themes now that `مسار` is chosen?
4. Push `masar-vision` to the remote? **Still local-only at handoff.**
5. Merge PR #1 (`masar-design-2`) — separate decision, CI is green.
