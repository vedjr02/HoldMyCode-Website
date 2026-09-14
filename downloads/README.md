# downloads/

The site's Download buttons link straight to `HoldMyCode.dmg` in this folder —
a direct file download, not a redirect to GitHub.

**Put the built `HoldMyCode.dmg` here before deploying.** Until you do, the
download buttons will 404.

If you'd rather serve the file from somewhere else (a CDN, object storage),
change the three `href="downloads/HoldMyCode.dmg"` links in `index.html`
instead — keep the `download` attribute so the browser saves the file rather
than navigating to it.

Note: the build is notarised with Apple, so it opens normally on first launch —
no Gatekeeper "right-click → Open" workaround is needed on the site.
