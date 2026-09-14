# HoldMyCode — website

Static marketing site for HoldMyCode, a free macOS menu-bar app that keeps your
Mac awake only while a coding agent is actually working.

The app is closed-source. The site must not claim otherwise — see STATUS.md.

No build step and no dependencies. Plain HTML, CSS and a little vanilla JS.

The design is strictly monochrome — every colour in the project is a pure grey
between black and white, and shipped-vs-planned status is signalled with
contrast and weight instead of colour. See [STATUS.md](STATUS.md) before
changing anything visual.

## Run it locally

```bash
python3 -m http.server 4173
```

Open http://localhost:4173.

## Deploy

Push the repo and point GitHub Pages / Vercel / Netlify at the root. There is
nothing to build.

## Before launching

Put the built `HoldMyCode.dmg` in `downloads/` — the three download buttons
link straight to it, so until it's there they 404. Then fill in the screenshot
placeholders. See [STATUS.md](STATUS.md) for the full list, the assumptions
baked into the copy, and what's left to do.
