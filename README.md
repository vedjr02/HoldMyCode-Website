# HoldMyCode — website

Static marketing site for HoldMyCode, a free macOS menu-bar app that keeps your
Mac awake only while a coding agent is actually working. Live at
**[holdmycode.xyz](https://holdmycode.xyz)**.

The site currently describes app **2.0.1**.

The app is closed-source. The site must not claim otherwise — see
[STATUS.md](STATUS.md).

No build step and no dependencies. Plain HTML, CSS and a little vanilla JS.

The design is strictly monochrome — every colour in the project is a pure grey
between black and white, and shipped-vs-planned status is signalled with
contrast and weight instead of colour. See [STATUS.md](STATUS.md) before
changing anything visual.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole page: hero, how it works, features + what's new, agents, FAQ, download, and the two `<dialog>` modals. |
| `404.html` | Not-found page. Links back with root-relative `/#anchor` hrefs. |
| `styles.css` | Every style. One file, sectioned by page area. |
| `main.js` | Reveal-on-scroll, the FAQ accordion, the email gate and the download handoff. Progressive enhancement: with JS off, the page reads fine and the download links still work. |
| `logos/` | Agent logos used in the agents section. |
| `downloads/` | Legacy. Nothing links here any more — see `downloads/README.md`. |
| `walkthrough.mp4`, `hero-laptop.webp`, `og-image.png`, favicons | Media, committed as-is. |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | Hardcoded to `holdmycode.xyz`; update all three together if the domain changes. |

## Run it locally

```bash
python3 -m http.server 4173
```

Open http://localhost:4173.

## Downloads

Every Download button points at the latest GitHub release:

```
https://github.com/vedjr02/Hold-My-Code/releases/latest/download/HoldMyCode.dmg
```

That URL always resolves to the newest published DMG, so the site never goes
stale when a release ships and no build is committed here. The DMG left in
`downloads/` is an unused 1.x leftover.

A download is gated behind an email address (`#gate` in `index.html`, handled
in `main.js`). The address goes to a Google Apps Script endpoint that writes to
a Sheet — that is the entire backend. The gate fails open: if the request or
`localStorage` fails, the download still starts. A returning visitor whose
address is already in `localStorage` under `hmc.email` skips the dialog.

## Editing

- **Bump the cache key** after touching `styles.css` or `main.js`. Both are
  loaded as `styles.css?v=N` / `main.js?v=N`, and `styles.css` is referenced
  from **both** `index.html` and `404.html` — change every copy in the same
  commit, or a returning visitor gets old CSS against new markup. Current:
  `styles.css?v=15`, `main.js?v=8`.
- **Say a thing once.** Copy that repeats across sections reads as filler; the
  email-gate explanation, for instance, lives in the gate dialog and in one
  short line under the download buttons, not in the hero as well.
- Keep the plain / `.band` alternation running down the page when adding a
  section, or add the block inside an existing section instead.
- Version numbers, the DMG size and the specs table in the download panel all
  need updating together when the app ships a release.

## Deploy

Vercel, on push to `main`. The project serves the repository root as-is; there
is nothing to build and no environment to configure. Hosting is
interchangeable — any static host (Netlify, Cloudflare Pages, GitHub Pages)
would serve the same files.

## Where the detail lives

[STATUS.md](STATUS.md) is the running handoff log: per-session changes, the
assumptions baked into the copy, the design rules behind the monochrome
palette, and what is still open. Read it before a non-trivial change.
