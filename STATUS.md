# HoldMyCode — site status

Handoff note. Written at the end of the first build session (2026-09-14).
The next session starts with no memory of this one, so everything it needs is
in this file plus the source.

---

## What this is

A static marketing/landing site for **HoldMyCode**, a free **closed-source**
macOS menu-bar app that keeps a Mac awake *only while a coding agent is actively
working* — including with the lid closed — via a privileged helper and
`pmset disablesleep`, with battery/thermal cutoffs, notifications, launch at
login, and a global toggle hotkey.

The product was briefly called "AgentWatch" early in the session and renamed to
**HoldMyCode**. `grep -ri agentwatch .` should only ever match this paragraph.

---

## Files

```
index.html            the whole page — every section lives here
styles.css            all styling; design tokens are :root custom properties at the top
main.js               ~55 lines: sticky-nav hairline, FAQ accordion, scroll reveal
assets/favicon.svg
.claude/launch.json   local preview config (python3 -m http.server on :4173)
.gitignore
```

No build step, no dependencies, no framework. Deploys as-is to GitHub Pages,
Vercel, Netlify, or anything that serves static files.

### Previewing locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. (Opening `index.html` as a `file://` URL can
fail to load the stylesheet — use the server.)

---

## Design system — read this before touching any colour

The site is **strictly monochrome**. This was an explicit requirement, not a
stylistic default. Two rules follow from it:

### 1. Every colour is a pure grey

Each hex in the project satisfies `R == G == B`. Note that Apple's own system
greys (`#1D1D1F`, `#F5F5F7`, `#86868B`, `#D2D2D7`) are *slightly* tinted, so
they were snapped to the nearest neutral (`#1D1D1D`, `#F5F5F5`, `#878787`,
`#D4D4D4`). The difference is invisible, but it keeps the palette literally
black-to-white with no hue anywhere.

The full palette, light and dark combined:

```
#000000  #0B0B0B  #141414  #1A1A1A  #1D1D1D  #1F1F1F  #2A2A2A  #333333
#3A3A3A  #707070  #878787  #A3A3A3  #D4D4D4  #E9E9E9  #EDEDED  #F5F5F5
#F7F7F7  #FAFAFA  #FFFFFF
```

You can verify it at any time:

```bash
python3 -c "import re,glob;print([h for f in ['index.html','styles.css','assets/favicon.svg'] for h in set(re.findall(r'#([0-9A-Fa-f]{6})',open(f).read())) if not h[0:2].lower()==h[2:4].lower()==h[4:6].lower()] or 'all pure grey')"
```

### 2. Status is carried by contrast and weight, never colour

This matters more than it sounds. The site has to distinguish *shipped* from
*not shipped* in several places, and with no colour available the encoding is:

| Meaning | Treatment |
|---|---|
| Shipped, active, present | **Solid ink fill**, white text, solid border, solid dot |
| Planned, idle, absent | **Dashed outline**, grey text, hollow dot, recessed background |

Applied consistently: the Claude Code agent card is a filled black monogram
with a filled badge and a black border; every "coming soon" agent gets a dashed
monogram, muted text and a dashed badge. "Display control" in the features grid
gets a dashed icon outline and a muted heading. State A's pill is filled, State
B's is outlined. **If you add anything, follow the same rule** — don't
reintroduce colour to signal state.

### Craft details (the "don't make it look like a template" pass)

A landing page reads as generic when everything is centred, every card is
identical, and the type just wraps wherever the box ends. These are the
counter-measures actually in the file — all small, none structural:

- **Section heads alternate alignment on a rule**, not at random: sections
  whose content is a *grid* (features, agents, screenshots) get a left-aligned
  head via `.section-head.lead`; sections built around a *single object* (hero,
  the walkthrough card, FAQ, download) stay centred. Keep the rule if you add a
  section — the rhythm is the point.
- **`text-wrap: balance` on headings only.** It evens out line lengths so
  two-line headlines don't leave an orphan. It is deliberately *not* on body
  copy: `balance` narrows the measure to even the lines, which looked broken on
  paragraphs (a 620px column rendering at ~250px). Body copy uses
  `text-wrap: pretty` instead. Don't move `balance` onto paragraphs.
- **Tabular numerals** on the spec table, step counters and hero meta, so
  figures don't wobble.
- **Scroll**: `scroll-behavior: smooth` with
  `scroll-margin-top: calc(var(--nav-h) + 18px)` so anchored sections land
  below the sticky nav with breathing room rather than flush against it.
  Disabled under `prefers-reduced-motion`.
- **Scrollspy**: the nav underlines the section you're in
  (`aria-current="true"`), rAF-throttled, one scroll listener total.
- **Hover depth**: cards get a barely-there shadow on hover in light mode and
  none in dark, where a border shift reads better than a shadow.
- **`::selection`** uses the palette instead of the browser's blue — one of the
  few places a stray colour would otherwise sneak into a monochrome page.

### The logo

A laptop outline with a `{ ⌣ }` face on the screen and a small "z" sleep
bubble in the top-right corner — redrawn as SVG from the artwork you supplied,
so it stays sharp at any size and has no raster asset to manage.

### Favicons — the generated set (source of truth)

A proper exported icon set lives at the project root and is what browsers use:

```
favicon.ico                 16 + 32, for older browsers and /favicon.ico probes
favicon-16x16.png
favicon-32x32.png
apple-touch-icon.png        180x180, home-screen icon
android-chrome-192x192.png
android-chrome-512x512.png
site.webmanifest            name filled in as "HoldMyCode"
```

All linked from `<head>` with **relative** paths (no leading slash), and the
manifest's icon `src` values were changed from absolute to relative too, so the
site also works if it's ever deployed under a sub-path rather than a domain
root. The manifest shipped with empty `name` / `short_name`; both are filled in
now.

There's also a `<meta name="theme-color">` pair so browser chrome follows the
page's own light and dark themes.

### The logo — same artwork, everywhere

The header and footer wordmarks both use `android-chrome-192x192.png` as an
`<img class="brand-mark">` (26px in the header, 20px in the footer), so the
logo on the page and the icon in the browser tab are **literally the same
file**. There is no second version of the mark anywhere in the project.

The wordmark uses the **mark only, no tile** — transparent background, so it
sits on the page rather than in a box. Two versions, one per theme, chosen by
`<picture>`:

| Theme | File | Look |
|---|---|---|
| Light | `logo-mark-on-light.png` | black art, transparent |
| Dark  | `logo-mark-on-dark.png` | white art, transparent |

Both were derived from `android-chrome-192x192.png` with a small pure-Python
PNG decoder/encoder (no dependencies), in one pass:

1. **Luminance became alpha**, normalised so the `#141414` tile goes fully
   transparent and the art fully opaque. Antialiased edges keep their partial
   alpha, so the mark stays smooth instead of getting a jagged cut-out edge.
2. **Cropped to the artwork's bounding box** (192×192 → 118×89, plus 2px
   margin), so the display size is the mark's size and not mostly padding.
3. **Written twice**, with the RGB set to black and to white, sharing the same
   alpha channel.

They're 3.4 KB each. Sized by height in CSS (22px header / 18px footer) with
`width: auto`, since the mark is wider than tall (≈1.33:1); the `<img>`
width/height attributes carry the same ratio so nothing shifts on load.

**If you replace the icon artwork, regenerate both files** — nothing recreates
them automatically. The tiled PNGs are still the favicon and manifest icons,
which is correct: an app icon should keep its ground.

A 192px source is used for a 26px slot deliberately — it stays crisp on retina
and is only ~30 KB. Both `<img>`s carry explicit `width`/`height` so there's no
layout shift, and `alt=""` since the wordmark sits right next to them.

Two earlier hand-drawn SVGs (`assets/favicon.svg`, `assets/logo.svg`) were
deleted once the real artwork arrived — the `assets/` folder is gone with them.
Competing near-identical marks were a real drift risk. **If you need a vector
logo later** (print, a large display), export it from the original artwork
rather than redrawing it.

### Other design notes

- **Hero weight contrast**: the headline runs at weight **400** with the three
  pitch-carrying phrases ("agent", "Mac", "clock out") at **800**. The gap is
  deliberately wide — at 600/800 the emphasis barely registered.
- **Apple-flavoured minimalism**: centred hero, generous section padding
  (120px), white / `#F5F5F5` band alternation, 980px pill buttons, thin
  hairlines, `-0.03em` tracking on large headings, 600 weight (not 700).
- **Type** is the system stack (`-apple-system, BlinkMacSystemFont,
  "SF Pro Text", sans-serif`), which renders as SF Pro on any Mac.
- **Monospace (`--mono`) is reserved for machine-ish asides** — the hero spec
  line, the agents legend, and the setup footnote. It's a deliberate signal
  ("this is a fact about the software", not prose), so don't spread it to body
  copy or it stops meaning anything. Each of those rules drops to 12px and
  resets `letter-spacing: 0`, because mono runs optically larger and the body's
  -0.01em tracking fights it. The agents legend emphasises its term with a
  bold `<strong>` in the same mono face, rather than embedding a UI-type pill
  mid-sentence.
- **Light and dark** both ship. Light is primary; dark is a token swap in a
  single `@media (prefers-color-scheme: dark)` block near the top of
  `styles.css`. Change tokens there, not in individual rules.
- **The SVG illustrations are theme-aware.** They carry no hard-coded paint —
  every fill/stroke is a class (`.f-ink`, `.f-surface`, `.s-line`, `.f-art1`…)
  defined at the bottom of `styles.css`, because CSS beats SVG presentation
  attributes. If you add an illustration, use those classes, or it will glow
  white in dark mode.
- Content width is 1000px; the hero mock is capped at 620px so it reads as a
  focused product shot rather than a stretched banner.

---

## The five-state player (`#how`)

The centrepiece of the page. **One card, five states** — not five cards. It
auto-advances every 4.2s and loops, with the segmented bar at the bottom
filling across the current step. Modelled on the genre convention of a
self-playing product walkthrough; the frames, copy and motion are this
project's own.

### How it's put together

- **Markup** (`index.html`): a `.demo` wrapper containing `.demo-stage` with
  five `.step` articles, then `.demo-controls` (a pause/play button plus five
  `.seg` buttons).
- **Each `.step` carries its own visual and its own copy**, so a step is a
  self-contained unit. In enhanced mode all five occupy the same grid cell
  (`grid-area: 1 / 1`) and cross-fade.
- **`main.js`** adds `.is-enhanced` to the card, then drives `index`, paints
  `.is-active` / `.is-done` / `.is-current`, and schedules the next step.
- **The fill animation** is pure CSS: `.seg.is-current .seg-fill::after` runs
  the `segFill` keyframe over `var(--dwell)`, which JS sets from the same
  constant that drives the timer, so the bar and the advance stay in sync. To
  change the pace, edit `DWELL` in `main.js` — the CSS follows automatically.
- Restarting the fill needs the class removed and re-added on the next frame
  (`requestAnimationFrame` in `paint()`), otherwise the animation won't replay.

### Behaviour worth preserving

- **It always autoplays. There is no pause button** — removed by request.
- **`prefers-reduced-motion` does NOT stop it.** This is the important one.
  An earlier version skipped autoplay entirely under reduced motion, which
  meant anyone with macOS *Reduce Motion* enabled (System Settings →
  Accessibility → Display) saw a card that never moved — and since the pause
  button was hidden in that mode too, there was nothing to click either. It
  looked broken, and it was the reported bug. Reduced motion now only removes
  the *animation*: the cross-fade and the sweeping bar fill are dropped, and
  the steps still advance. Don't reinstate a `prefers-reduced-motion` guard on
  the timer.
- **Segments are buttons**, each labelled "Step N of 5: <title>", with
  `aria-current="step"` on the active one. Clicking jumps to that step and the
  timer restarts from there. They're the only viewer control now.
- **It stops when off-screen** via IntersectionObserver at `threshold: 0`, so
  it begins as soon as any part of the card appears rather than waiting for a
  quarter of it. The callback reads the *last* entry, since entries can batch.
- **No JS at all**: `.is-enhanced` is never added, so the CSS never hides
  anything. All five steps render stacked in order, each showing its own
  "Step N of 5" caption, and the controls are `display: none`. Verified.

**Accessibility note, recorded honestly:** WCAG 2.2.2 wants a pause mechanism
for content that auto-updates for more than five seconds. Clicking a segment is
the only one here. That was a deliberate product call, not an oversight — if
you ever want to satisfy the guideline properly, pause-on-hover plus
pause-on-`focus-within` would do it without putting a button back on screen.

### Adding or removing a step

Add a `.step` article and a matching `.seg` button — the JS counts DOM
elements, so nothing else needs changing. Keep the laptop drawn at the same
coordinates across frames; the object staying put while only its *state*
changes is what makes the sequence read as continuous rather than as five
unrelated pictures.

---

## What's built

All eight requested sections, with real copy:

1. **Hero** — centred, with an original SVG mock of the menu-bar dropdown
   anchored under a status item the way a real macOS menu extra behaves. It's
   labelled "Illustrative mock — not a final screenshot".
2. **How it works** — **one card that plays through five states**, like a short
   looping video. Left half is a visual panel with a status pill; right half is
   the label / headline / description; a segmented progress bar runs along the
   bottom and fills across each step before advancing. The five steps are:
   task starts (lid open) → you shut the lid → wake lock engages → run finishes
   (grace timer) → sleep handed back. See "The five-state player" below.
3. **Features** — 6 cards, 2-column on desktop, original inline SVG icons.
4. **Supported agents** — 5 cards with original monogram marks, plus a legend
   explaining the filled/dashed distinction. The legend sets "Lifecycle hooks"
   as **bold text, not a second filled pill** — one heavy black chip per
   section is enough, and the legend is quoting the badge's wording rather than
   repeating the badge. The real badge on the Claude Code card keeps its fill;
   that's the one carrying the shipped/planned distinction, so don't flatten
   it too. Claude Code (shipped) plus Codex,
   Gemini CLI, Cursor and Cline (planned). Laid out 5-up on desktop so the row
   is complete with no orphan card; 3-up then 2-up as it narrows. **If you add
   or remove an agent, re-check the column count** — and the copy counts them
   too ("...than four that guess" in the section head, and the list in the FAQ).
5. **Getting started** (`#setup`) — three numbered steps: drag to Applications,
   approve the helper once, start a task and close the lid. Replaced the old
   screenshots section, which was three empty placeholder boxes for captures
   that don't exist yet. Deliberately uses a hairline-divided run with ghosted
   numerals rather than a third grid of rounded cards, so the page doesn't read
   as card-grid-all-the-way-down.
6. **FAQ** — 6 questions, `<details>`-based, works without JS.
7. **Download** — free/open-source framing and a hairline spec table.
8. **Footer** — GitHub links, credit line, no pricing or licence page.

### Accuracy guardrails that are deliberate — please keep them

- **Display control is marked "Coming soon"** and its copy ends "Not in the app
  yet." Don't let it drift into sounding shipped.
- **Claude Code is the only agent shown as working.** The other four are
  dashed "Coming soon", the section heading says "One agent today. More on the
  list.", and the FAQ repeats it.
- **Free is stated plainly** in the hero, the download heading and the spec
  table — it's the real differentiator against the paid apps in this category.
- No competitor's copy was referenced or adapted. The Caffeine/Amphetamine FAQ
  answer describes their behaviour factually, in original words.

### Accessibility / UX details already handled

- Skip-to-content link, visible `:focus-visible` rings.
- `scroll-margin-top` on sections so anchor links clear the sticky nav.
- Scroll-reveal is progressive: CSS only hides `.reveal` elements once JS adds
  `.reveal-ready` to `<html>`, so with JS off — or with
  `prefers-reduced-motion` — everything is visible. There's also a post-load
  safety net that un-hides anything still hidden in the viewport.
- All animation is disabled under `prefers-reduced-motion`.

---

## Production readiness

Added in the hardening pass:

| File | Purpose |
|---|---|
| `404.html` | Styled not-found page, `noindex`, same header/footer as the site |
| `robots.txt` | Allows everything, points at the sitemap |
| `sitemap.xml` | Single URL |
| `og-image.png` | 1200×630 share card — the logo mark on the icon's dark ground, generated from `logo-mark-on-dark.png` at an integer 3× scale so the edges stay clean |

And in `index.html`'s `<head>`: canonical URL, the full Open Graph set
(`og:url`, `og:image` + dimensions + alt, `og:site_name`), Twitter
`summary_large_image` tags, and a `SoftwareApplication` JSON-LD block declaring
price 0.

`site.webmanifest` gained `start_url`, `scope`, `id` and `description` —
without `start_url` Chrome won't offer to install the app. Its `theme_color`
moved from `#ffffff` to `#141414` to match the icon, and a `maskable` icon
entry was added so Android doesn't letterbox the mark inside its adaptive mask.

### Asset versioning — read this before editing CSS or JS

`index.html` and `404.html` load `styles.css?v=2` and `main.js?v=2`. The
version query is the only cache-busting this build-less site has.

**Bump the number in both files whenever you edit `styles.css` or `main.js`.**
This is a genuine footgun and it already bit once during development: the 404
page silently rendered with a stale stylesheet and none of its own layout
rules, which looked like a CSS bug rather than a cache hit. If you later deploy
somewhere with proper cache headers (Vercel, Netlify, Cloudflare all do this by
default), you can drop the query entirely.

---

## Placeholders you must replace before launch

| Placeholder | Where | What to do |
|---|---|---|
| **`downloads/HoldMyCode.dmg`** | 3 download buttons (nav, hero, download section) | **The build itself.** Drop the signed `.dmg` at that path or repoint the `href`. Until then the buttons 404 — this is the #1 launch blocker. |
| **`REPLACE-ME-DOMAIN`** | `index.html` head (canonical, og:url, og:image, twitter:image), `robots.txt`, `sitemap.xml` | The real domain. Social scrapers need absolute URLs, so share cards stay broken until this is done. `grep -rn REPLACE-ME-DOMAIN .` finds all seven. |
| **`YOUR-GITHUB-USERNAME`** | Footer contact row (both `index.html` and `404.html`) | The owner's GitHub profile link (a contact link, *not* a source repo — the app stays closed-source). One `grep -n YOUR-GITHUB-USERNAME index.html` finds it. |
| Hero SVG mock | hero | Optional — replace with a real screenshot, or keep the illustration. |
| `og:url` / `og:image` | `<head>` | Marked with a TODO comment; needs a domain and a share image. |

---

## Assumptions I made (change if wrong)

These weren't specified, so I picked something reasonable and flagged it here
rather than leaving blanks in the page:

- **macOS 13 Ventura or later**, Apple silicon and Intel — in the hero and the
  download spec table.
- **~5 MB** app size in the download heading.
- **30-second idle grace period** and a **20% battery release threshold**, used
  as illustrative numbers in the how-it-works card and the hero mock. If the
  real defaults differ, update them so the site matches the app.
- **One admin prompt on first launch** to install the privileged helper —
  derived from the described architecture. Worth confirming against the actual
  installer flow.
- **"No telemetry", "nothing is sent anywhere", "no analytics"** — stated in the
  hero meta line and twice in the FAQ. I inferred this from the product
  description; it was never confirmed. Since the app is closed-source, nobody
  can check it, so **make sure it's actually true before launch** or soften the
  wording. This is the one claim on the page that would be genuinely damaging if
  wrong.
- **Distribution is a direct `.dmg`** served from the site, not a GitHub
  release, per your instruction. Nothing on the page implies a repo any more.
- **The setup steps** in `#setup` describe drag-to-Applications, a one-time
  admin prompt, and zero further configuration. That matches the described
  architecture but hasn't been checked against the real installer — confirm the
  three steps are actually the three steps.
- **No uninstall instructions anywhere.** A privileged helper usually needs
  explicit removal, and I wasn't willing to claim "drag to Trash and it's gone"
  without knowing. Worth adding a line once the behaviour is settled.
- No version number appears anywhere, so there's nothing to bump per release.

---

## Positioning note — agent-agnostic wording, honest support table

The marketing copy deliberately does **not** name a specific agent. The title,
hero, walkthrough and setup steps all say "your coding agent" / "your agent",
because the product is for coding agents generally.

Claude Code is still named in exactly three places, and all three are
statements of *current support status*, not positioning:

1. the agents grid card (tagged "Lifecycle hooks"),
2. the agents section head ("Claude Code is wired up now"),
3. the FAQ answer to "Which agents work today?".

Plus the hero mock, which shows a watched session in the menu-bar UI.

**Worth a decision before launch.** The hero now implies broad agent support
while the agents section says one integration is live and four are planned.
That reads fine if you think of it as "built for agents, wired up for Claude
Code so far" — but if more agents are actually working now, the agents grid and
the FAQ need updating to match, and the "than four that guess" line in the
section head counts them. If nothing else is wired up yet, leave it: the grid
is the honest disclosure and the hero is the category.

---

## Positioning note — it's free, not open source

Worth being deliberate about, because the two got conflated in the first draft.
**Free is still the real differentiator** against the paid apps in this
category, and the page says so plainly in the hero kicker, the download heading
and the spec table.

What the page no longer does is lean on *open source* — that claim was doing
real work in the privacy FAQ ("you can read the helper yourself"), and with a
private repo it would have been false. That answer now says plainly that the
app is closed-source and that the privacy promise is a promise rather than
something you can audit. **Don't reintroduce "open source" or a licence claim** — as of this session
there is no public repo. The one GitHub link on the page is the owner's
*profile*, in the footer contact row; it is not a link to source, and it
shouldn't be relabelled as one.

---

## Deliberately left for next session

Nothing is half-implemented — the page is coherent end to end. These are
additions, not repairs:

1. **Replace the placeholders** above. The only thing blocking a real launch.
2. **Screenshots, if you ever want them.** The screenshots section is gone —
   empty placeholder boxes were the weakest thing on the page. If you later get
   real captures, a screenshot section belongs *after* `#setup`, not before it.
   The hero mock is still an illustration and can stay one.
3. **Consider real UI captures inside the five-state player** — the frames are
   currently original line illustrations. Screenshots of the actual menu-bar
   states would be stronger, but the illustrations are deliberate placeholders
   that don't misrepresent anything.
4. **Install instructions** — no Homebrew line or Gatekeeper note is on the
   page, because I didn't want to invent a distribution method. Add one once
   the real install path is settled.
5. **Deploy** — nothing configured, and this isn't a git repo yet
   (`git init` still needs running).
6. **Favicons are done** — full generated set at the project root, wired up
   with relative paths. Nothing outstanding here.
7. **Contact is now in the footer** — a GitHub profile link and
   `vedantambre.tech@gmail.com`. Note there's still no issue tracker (private
   repo), so email is the only real support channel; keep an eye on it.
8. **Gatekeeper note.** A directly-downloaded `.dmg` that isn't notarised will
   be blocked on first open. If the build isn't notarised, the download section
   needs a short "right-click → Open" instruction.

---

## Verified this session

Checked in a real browser, in **both light and dark**, at 375px / 1000px wide:

- Every hex in the project is a pure grey (`R == G == B`) — script above.
- The shipped-vs-planned distinction stays legible with no colour, in both
  themes.
- SVG illustrations invert correctly in dark mode — no white glare.
- No horizontal overflow at 375px.
- Features grid 2→1 columns; agents grid 4→2→1; the state card stacks and its
  arrow rotates.
- FAQ opens one at a time; the + rotates to ×.
- The five-state player auto-advances on its own once scrolled into view
  (observed 1 → 2 → 3 → 4), with no pause button in the DOM and five segment
  controls. Each frame renders correctly in both themes, segment buttons jump
  to their step, and with `.is-enhanced` removed (the no-JS path) all five
  steps render stacked with the controls hidden.
- All three download buttons point at `downloads/HoldMyCode.dmg` with the
  `download` attribute; no GitHub links and no dead `href="#"` anywhere.
- Motion is applied and scoped: hero stagger, hover lifts on buttons/cards, a
  slow breath on live indicators, ring pulse on step 3 — all switched off under
  `prefers-reduced-motion`, and nothing is hidden when motion is disabled.
- Footer contact row renders with both links (`mailto:` resolves correctly);
  the "Not affiliated with Anthropic or Apple" line is gone.
- Hero headline emphasis: "agent", "Mac" and "clock out" render at weight 800
  against the 600 of the rest of the line.
- Smooth scroll: clicking a nav link lands the section 66px below the top
  (nav height + margin), and the nav underline follows the scroll position.
- Section-head alignment rule applied to the three grid sections; body measure
  verified at 620px after restricting `text-wrap: balance` to headings.
- `#setup` replaces `#screens`: no `.placeholder` markup or styles remain, the
  white/grey band alternation still holds, and it stacks to one column on
  mobile in both themes.
- Agents trimmed to five (OpenCode, Copilot CLI and Aider removed): one full
  row at 1000px with no orphan, 3+2 at 860px, and the two places that count
  them in prose were updated to match.
- Logo theme swap verified via `currentSrc`: light mode serves
  `logo-mark-on-light.png`, dark mode `logo-mark-on-dark.png`, both rendering
  at 29×22 with transparent grounds in header and footer.
- Hero headline computes to weight 400 with `<strong>` at 800.
- The three mono asides compute to `ui-monospace`; the agents legend holds no
  `.tag` elements and emphasises its term at weight 600, while the Claude Code
  card's badge still computes to a filled `rgb(29,29,29)`. No overflow at 375px.
- All seven icon files and the manifest serve 200 over HTTP; the manifest
  parses and names the app; the removed `assets/favicon.svg` now 404s with no
  references left in the markup.
- Marketing copy is agent-agnostic (title, og:title, hero, walkthrough step 1,
  features hooks card, setup step 3); Claude Code remains only in the three
  support-status places and the UI mock.
- No console errors.
