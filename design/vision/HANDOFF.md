# Handoff — design vision session

Written 2026-08-13, updated the same day at the end of a second session. Read
this before touching anything in `design/vision/`. `CLAUDE.md` on this branch
is the `master` copy and knows **nothing** about the work described here.

**Newest material is in §10.** §5a is the hero as it now stands; §8 is the
trap list, which doubled in the second session and is the section most likely
to save you time.

---

## Status — updated 2026-08-13 (second session)

**The hero direction is now chosen.** The owner picked **`اللوح`** over the
desk, and asked for a comprehensive pass over all four screens. Both are
done; see §10 for what that session changed and §5a for the hero itself.

**Still not signed off as finished.** «اللوح» was chosen against one
alternative, which is not the same as approval. Assume the visual work
continues, and keep bringing something better rather than asking whether
it is good.

### Three standing decisions the owner made this session
1. **`اللوح` is the hero.** The desk is deleted, not parked.
2. **`مسار` is the only palette.** The four comparison themes and the theme
   switcher are deleted; the tokens live on `:root` with no `data-theme`.
3. **The board must not name the lesson its example came from.** The
   «من الدرس الثالث …» footer is gone. Do not reintroduce it.

### One honest note on how to converge faster

This has taken many rounds because taste feedback without a reference loops.
The single thing that moved it fastest was the **photograph** he sent for the
hero angle — one image ended more argument than several paragraphs had. If the
next round stalls, ask for a reference for the screen being worked on (any
site, any field) rather than iterating blind.

### And one on how to verify, which cost real time this session

**Do not read Arabic bidi off a screenshot.** Three separate "bugs" were
spotted in screenshots and all three measured clean — «٥ دروس · ٣ ساعات»,
«الدروس ٣ إلى ٥ ·», and a timestamp that only looked reversed because the
check itself read in the wrong direction. Measure character positions with
`Range.getBoundingClientRect`, sorting **ascending** for `direction:ltr`
numerals and **descending** for Arabic prose. And exclude hidden screens —
elements inside `display:none` return zero rects and read as "broken".

The preview pane also serves **stale frames** after scrolling. If a screenshot
looks blank or wrong, confirm against the DOM before believing it; resizing by
one pixel forces a repaint.

---

## Say this to open the new session

> اقرأ `design/vision/HANDOFF.md` أولًا — نحن على فرع `masar-vision`،
> واللوح معتمد وسمة مسار وحدها، ونكمل الصقل من حيث توقفنا.

---

## 1 · Branch map

| branch | head | vs master | pushed? | what it is |
|---|---|---|---|---|
| `master` | `c1afb92` | — | yes | live. Netlify auto-deploys every push to it. |
| `masar-design-2` | `270bcdf` | +6 | yes | the **real code** design pass. Open as **PR #1**, not merged. |
| `masar-vision` | `ff23895` | +16 | **NO — local only** | this work. Isolated HTML preview. |

**⚠ `masar-vision` has still never been pushed.** Sixteen commits exist only
on this machine. Push it before relying on it surviving — this warning has now
survived two sessions unactioned.

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
لوحة التحكم**. The theme switcher is **gone**; `مسار` is the only palette.

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

~~**The other four themes (حبر · شفق · ورق · هدوء) are kept for comparison
only.** Delete them once `مسار` is confirmed final.~~ **Done 2026-08-13** —
`مسار` was confirmed and the other four are deleted along with the switcher.
The tokens now sit on bare `:root`; there is no `data-theme` attribute
anywhere. The semantic tokens (`--on-accent`, `--sunk`, `--hair`, `--shadow`)
were **kept** even though the light theme is gone: they are what made the
system invertible, and re-deriving them costs more than carrying them.

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
| A big centred circular play button over a poster | 2026-08-13. Tried it on the course player; it covered «كتبَ» entirely — a control hiding the content it advertises. Replaced by a named button in the corner |
| Naming the lesson a hero example came from | owner's call, 2026-08-13. The worked example stands on its own |

**⚠ When an idea is rejected, delete its CSS too.** Two rejected ideas left
orphaned rules behind that were only found this session: `.stat-row` / `.stat b`
from the invented stat row, and `.deadline` / `.deadline-mark` from the
calendar card. Orphan rules are how a rejected idea comes back — the next
person needs a class and finds a ready-made one.

**⚠ And check whether it survived somewhere else.** The deadline idea was
rejected *for the hero* and went on living in the dashboard's activity feed
(«موعد الاختبار النصفي · يوم الأحد القادم») because the rejection was recorded
against a location rather than against the claim. Reject the claim.

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

**⚠ Ask for an SVG.** It stays sharp at any size and inherits colour, which
the PNG does neither. (The five-theme argument no longer applies — there is
one palette now — but resolution alone still justifies it.)

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
  file and carries `display:none`. (The laptop's `.lap` is gone with the desk,
  but the collision is still there for the next new class.)
- **Range deletes eat lines — twice now.** The first swallowed the hero's
  `@media(min-width:940px)`. The second, deleting the desk markup, took the
  `</div>` that closed `.hero-visual`, so `.split` silently became a grid item
  of `.hero` and the whole catalogue rendered 608px wide at x=−62. **The
  screenshot looked plausible; `el.parentElement.className` did not.** A third,
  a `sed` on `foot:` lines, ate the `},` that closed three object literals.
  Prefer anchored edits, and after any structural delete assert on the parent.
- **`inset-inline-*` resolves against the element's own direction.** Anything
  carrying `.num` (which sets `direction:ltr`) flips. This is the documented
  CLAUDE.md bug and it reappeared here on both video duration badges. Put the
  positioning on a wrapper and `.num` on an inner span.
- **`overflow-x:auto` alone promotes the other axis to `auto`.** Per spec, so
  the browser reserves a vertical scrollbar gutter — `.tabs` measured 925px
  box against 910px clientWidth, and the 15px strip read as a rendering glitch
  beside the tab strip. Always pair with `overflow-y:hidden`.
- **`1fr` has an implicit `min-content` floor.** `.tiers` refused to shrink
  below its longest line and pushed the page to 1219px inside 1165px. Use
  `minmax(0,1fr)`.
- **Absolutely positioned bleed grows `scrollWidth`.** Three instances here —
  the preview top bar, the board's lamp pool, `.scene-art`. `body{overflow-x:
  hidden}` hides the overflow without preventing it, so the page still shifts
  and every screenshot at that width is wrong. `filter:blur` spills for free;
  a negative inset does not.
- **Arabic-Indic digits are not in IBM Plex Mono.** Setting «٨٫٠٠٠» in it made
  the browser fall back per character, and every price rendered ragged as
  «٨ , ٠٠٠». `.num` uses the interface font; `.code` keeps mono for Latin
  identifiers only.
- **Arabic number agreement.** 3–10 takes the plural («٥ دروس»), 11+ takes the
  accusative singular («١٢ درسًا»). `lessonsWord()` / `coursesWord()` handle
  it. The catalogue really does have 11-, 12- and 14-lesson courses, so the
  wrong form was on screen.
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

Answered 2026-08-13: ~~`اللوح` or `المكتب`~~ → `اللوح`. ~~Delete the four
themes~~ → deleted. What is left:

1. **Push `masar-vision` to the remote.** Still local-only, now 17 commits.
   This is the second handoff carrying this warning. It needs the owner —
   agents cannot supply the credential (see CLAUDE.md, "The Repository Has a
   Remote").
2. Is «مقرَّرك، مفهومًا.» the headline, or one of the alternatives in §4? It
   has never been endorsed, only left in place.
3. **Ask for the logo as SVG** (§6).
4. Merge PR #1 (`masar-design-2`) — separate decision, CI is green.
5. **Is the look approved now, or does it keep going?** The hero direction was
   chosen but the result has not been signed off. Assume it continues.

---

## 10 · What the second session (2026-08-13) changed

Commits `0004cea` … `ff23895` on `masar-vision`. Nothing under `src/` was
touched. Every claim below was verified in the browser, by measurement.

| # | Change |
|---|---|
| `0004cea` | **The board replaces the desk as the hero** (§5a) |
| `0b3b1ff` | Handoff records the new direction |
| `466204c` | Desk deleted; four themes and the switcher deleted; tokens onto `:root` |
| `3af0518` | Every price was rendering broken; course cards draw their own lesson count |
| `fb45397` | Course page: poster shows the lesson; three bundles compare side by side |
| `b92857e` | Study screen: poster + resume position; tab-strip scrollbar removed |
| `3266441` | «مقرراتي» stopped pricing courses the student owns; Arabic digits and number agreement |
| `ff23895` | Last two horizontal overflows closed |

### The three faults worth remembering, because they were all invisible

1. **A structural break that still looked fine.** Deleting the desk markup by
   line range took a closing `</div>`, and the catalogue silently rendered
   608px wide, half off the page. Caught by checking `parentElement`, not by
   looking.
2. **Prices had been broken the whole time.** Arabic-Indic digits set in a
   font with no glyphs for them. Visible in every screenshot of every session,
   and read as "slightly loose spacing" rather than as a bug.
3. **A rejected idea living in a second place.** The calendar claim was
   rejected in the hero and survived in the dashboard feed.

### What was deliberately *not* done
- The headline was left alone — it is the owner's call (§9.2).
- `.player` still has no real video; the posters are static by design.
- No animation work beyond what already existed. `improve-animations` is
  plan-only per §7 and was not run.
