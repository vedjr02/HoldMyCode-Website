/* HoldMyCode — landing page behaviour.
   Everything here is progressive enhancement: with JS off the page is fully
   readable and every section is visible. */

(function () {
  'use strict';

  // Raised every time a sticker is picked up, so the last one grabbed is on top.
  var stickerTop = 10;

  /* 1. Hairline under the sticky nav once the page scrolls. */
  var header = document.getElementById('siteHeader');
  if (header) {
    var syncHeader = function () {
      header.classList.toggle('is-stuck', window.scrollY > 4);
    };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  /* 1b. The menu bar clock. Written by JS only, so with JS off the bar simply
        has no clock rather than a wrong one. Minute resolution, like macOS. */
  var clock = document.getElementById('mbClock');
  if (clock) {
    var drawClock = function () {
      var now = new Date();
      var text;
      try {
        text = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } catch (e) {
        text = now.getHours() + ':' + ('0' + now.getMinutes()).slice(-2);
      }
      clock.textContent = text;
    };
    drawClock();
    // Land on the minute, then keep to it.
    window.setTimeout(function () {
      drawClock();
      window.setInterval(drawClock, 60000);
    }, (60 - new Date().getSeconds()) * 1000);
  }

  /* 1c. The mobile Control Center. The toggle in the bar opens #cc as a modal
        <dialog>, which brings the focus trap and Esc with it. Any link inside
        closes it first — in the capture phase, so a download link's own
        handler can open the name gate over a page that is already clear. */
  var cc = document.getElementById('cc');
  var ccOpen = document.querySelector('[data-cc-open]');
  if (cc && ccOpen && typeof cc.showModal === 'function') {
    var ccClock = document.getElementById('ccClock');
    var closeCc = function () { if (cc.open) cc.close(); };

    ccOpen.addEventListener('click', function () {
      if (ccClock) {
        try {
          ccClock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch (e) { /* leave it blank */ }
      }
      cc.showModal();
      ccOpen.setAttribute('aria-expanded', 'true');
    });
    cc.addEventListener('close', function () {
      ccOpen.setAttribute('aria-expanded', 'false');
    });
    cc.querySelector('[data-cc-close]').addEventListener('click', closeCc);
    cc.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeCc();
    }, true);

    // Rotating a tablet to landscape can cross the breakpoint with the sheet
    // open, leaving it up with no button to close it from.
    var wide = window.matchMedia('(min-width: 941px)');
    var onWide = function () { if (wide.matches) closeCc(); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* 2. FAQ: keep one answer open at a time. */
  var faqItems = document.querySelectorAll('.faq details');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* 2b. Changelog: open downwards. Scroll anchoring would otherwise lock onto
        the section below and scroll the page to keep it still, so the summary
        jumps up and the list looks like it grows upwards. Anchoring is paused
        for the length of the open/close transition only. */
  var changelog = document.querySelector('.changelog > summary');
  if (changelog) {
    var anchorTimer;
    changelog.addEventListener('click', function () {
      var root = document.documentElement;
      root.style.overflowAnchor = 'none';
      clearTimeout(anchorTimer);
      anchorTimer = setTimeout(function () { root.style.overflowAnchor = ''; }, 600);
    });
  }

  /* 3. Fade sections in on scroll.
        The CSS only hides .reveal elements once <html> has .reveal-ready, so
        if this script never runs — or the browser lacks IntersectionObserver,
        or the visitor prefers reduced motion — everything stays visible. */
  var stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !stillMotion) {
    document.documentElement.classList.add('reveal-ready');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(function (el, i) {
      // Stagger cards within a grid so they don't all land at once.
      el.style.transitionDelay = (i % 3) * 60 + 'ms';
      observer.observe(el);
    });

    // Safety net: if anything is still hidden after load, show it.
    window.addEventListener('load', function () {
      setTimeout(function () {
        document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
          var box = el.getBoundingClientRect();
          if (box.top < window.innerHeight) el.classList.add('in');
        });
      }, 400);
    });
  }

  /* 3b. Hero parallax, fallback only.
         Browsers with scroll-driven timelines run this in CSS, on the
         compositor, and this block never attaches. The numbers below are the
         same ones in the heroParallax keyframes — keep them in step. */
  var shotWrap = document.querySelector('.hero-shot-wrap');
  var hasViewTimeline = typeof CSS !== 'undefined' && CSS.supports &&
                        CSS.supports('animation-timeline', 'view()');
  if (shotWrap && !hasViewTimeline && !stillMotion) {
    var figure = shotWrap.parentElement;   // untransformed, so safe to measure
    var queued = false;

    var drawParallax = function () {
      queued = false;
      var box = figure.getBoundingClientRect();
      var span = window.innerHeight + box.height;
      if (span <= 0) return;
      // 0 as the figure's top reaches the bottom of the viewport, 1 once its
      // bottom has passed the top — the same span CSS calls `cover`.
      var t = (window.innerHeight - box.top) / span;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      shotWrap.style.transform =
        'translate3d(0,' + (-4 + 18 * t).toFixed(2) + '%,0) ' +
        'scale(' + (1.03 - 0.09 * t).toFixed(4) + ') ' +
        'rotateX(' + (7 * t).toFixed(2) + 'deg)';
    };

    var queueParallax = function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(drawParallax);
    };

    drawParallax();
    window.addEventListener('scroll', queueParallax, { passive: true });
    window.addEventListener('resize', queueParallax, { passive: true });
  }

  /* 3c. Scroll progress rule under the nav, fallback only.
         Browsers with scroll() timelines fill it in CSS, on the compositor,
         and this block never attaches. Decoration: with neither path it stays
         at scaleX(0) and the nav looks exactly as it does today. */
  var progress = document.querySelector('.scroll-progress');
  var hasScrollTimeline = typeof CSS !== 'undefined' && CSS.supports &&
                          CSS.supports('animation-timeline', 'scroll()');
  if (progress && !hasScrollTimeline && !stillMotion) {
    var pQueued = false;

    var drawProgress = function () {
      pQueued = false;
      var doc = document.documentElement;
      var span = doc.scrollHeight - window.innerHeight;
      var t = span > 0 ? window.scrollY / span : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      progress.style.transform = 'scaleX(' + t.toFixed(4) + ')';
    };

    var queueProgress = function () {
      if (pQueued) return;
      pQueued = true;
      window.requestAnimationFrame(drawProgress);
    };

    drawProgress();
    window.addEventListener('scroll', queueProgress, { passive: true });
    window.addEventListener('resize', queueProgress, { passive: true });
  }

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* 3f. Section headings are split into words, so they can land one at a time.
         Only headings that are a single text node are touched — anything with
         markup inside is left exactly as written. The words keep the spaces
         between them as real text, so the line breaks are the ones the browser
         picked before. Skipped wholesale under reduced motion, which leaves
         the headings as plain, unsplit type. */
  if (!stillMotion) {
    var headings = document.querySelectorAll(
      '.section-head h2, .slab-head h2, .download-panel > h2'
    );
    headings.forEach(function (h) {
      if (h.childNodes.length !== 1 || h.firstChild.nodeType !== 3) return;
      var words = h.textContent.trim().split(/\s+/);
      if (words.length < 2) return;

      // The head's own stagger puts the heading at .07s; the words go on from there.
      var base = h.closest('.section-head') ? 0.07 : 0;
      var frag = document.createDocumentFragment();
      words.forEach(function (word, i) {
        var span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        span.style.animationDelay = (base + i * 0.045).toFixed(3) + 's';
        frag.appendChild(span);
        if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
      });
      h.textContent = '';
      h.appendChild(frag);
      h.classList.add('has-words');
    });
  }

  /* 3g. Agent tiles lean towards the pointer, like the hero shot does.
         Four degrees at the corners, on top of the two-pixel lift the CSS
         hover gives them. The perspective is baked into each tile's own
         transform so a tile at the edge of the grid tilts on its own axis. */
  if (finePointer && !stillMotion) {
    document.querySelectorAll('.agent').forEach(function (tile) {
      var tQueued = false;
      var rx = 0, ry = 0;

      var drawTilt = function () {
        tQueued = false;
        tile.style.transform =
          'perspective(700px) translateY(-2px) ' +
          'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      };

      tile.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var box = tile.getBoundingClientRect();
        if (!box.width || !box.height) return;
        // Tilt away from the cursor on the vertical, towards it on the horizontal.
        rx = -(((e.clientY - box.top)  / box.height - 0.5) * 2) * 4;
        ry =  (((e.clientX - box.left) / box.width  - 0.5) * 2) * 4;
        if (tQueued) return;
        tQueued = true;
        window.requestAnimationFrame(drawTilt);
      }, { passive: true });

      tile.addEventListener('pointerleave', function () { tile.style.transform = ''; });
    });
  }

  /* 4. Nav reflects where you are on the page. Cheap: one rAF-throttled read
        per scroll, no observer per link. */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"]')
  );
  if (navLinks.length) {
    var targets = navLinks
      .map(function (link) {
        return { link: link, el: document.getElementById(link.hash.slice(1)) };
      })
      .filter(function (t) { return t.el; });

    var ticking = false;
    var activeLink = null;

    function markActive() {
      ticking = false;
      var line = window.scrollY + (parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
      ) || 48) + 80;

      var current = null;
      targets.forEach(function (t) {
        if (t.el.offsetTop <= line) current = t.link;
      });

      // Once the page is at the very bottom, the last section wins outright.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = targets[targets.length - 1].link;
      }

      if (current === activeLink) return;
      if (activeLink) activeLink.removeAttribute('aria-current');
      if (current) current.setAttribute('aria-current', 'true');
      activeLink = current;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(markActive);
    }, { passive: true });

    markActive();
  }

  /* 5. Download flow: ask for a name (or an email, if they'd rather), then start
        the download, then say thanks.

        Progressive enhancement throughout. With JS off every download link is a
        plain link to the DMG: the gate never opens and the download still works.
        With JS on the gate is mandatory — the DMG is only fetched once a name
        or address has been submitted, or once one was submitted on an earlier
        visit. The native <dialog> handles Esc, focus-trap and return-focus. */
  /* Where downloads and sign-ups are recorded. Leave '' and the site stays
     fully static — no ping, and the gate lets everyone straight through. */
  var TRACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxVNvUh3hvZ0p2UyFAsEK160Pzn8PyXY3b4dLrZmNwYuLvl6cW05r2MqpjLqEFesf3HjQ/exec';

  /* Remembering the entry keeps a returning visitor from being asked twice.
     The key predates names, and is kept so earlier visitors still skip the gate.
     Private-mode Safari throws on storage, so every access is guarded. */
  var SIGNUP_KEY = 'hmc.email';
  var remembered = function () {
    try { return localStorage.getItem(SIGNUP_KEY) || ''; } catch (e) { return ''; }
  };
  var remember = function (entry) {
    try { localStorage.setItem(SIGNUP_KEY, entry); } catch (e) { /* not essential */ }
  };

  /* Deliberately loose: a shape check, not an attempt to decide what a real
     address is. One @, something either side, a dot in the domain. */
  var looksLikeEmail = function (value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  };

  var thanks = document.getElementById('thanks');
  var gate   = document.getElementById('gate');

  if (thanks && typeof thanks.showModal === 'function' &&
      gate   && typeof gate.showModal === 'function') {

    /* Fire-and-forget POST. The endpoint answers opaquely across origins, so a
       resolved promise only means the request left, which is all we need. The
       caller never waits on it; a failure is logged, never surfaced, and never
       stops a download. */
    var track = function (payload) {
      if (!TRACK_ENDPOINT) return;
      try {
        fetch(TRACK_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).catch(function (err) {
          console.warn('HoldMyCode: could not record ' + payload.type, err);
        });
      } catch (err) {
        console.warn('HoldMyCode: could not record ' + payload.type, err);
      }
    };

    var openThanks = function () {
      // Record the download (a no-op until an endpoint is set), then show the card.
      track({ type: 'download', at: new Date().toISOString() });
      setTimeout(function () {
        if (!thanks.open) {
          thanks.showModal();
          // Focusing the close button can scroll a tall card; start at its top.
          thanks.scrollTop = 0;
        }
      }, 80);
    };

    // Start the download in a hidden iframe instead of a top-level navigation,
    // so the cross-origin release URL doesn't flash a page for a split second.
    var downloadVia = function (url) {
      var f = document.getElementById('dl-frame');
      if (!f) {
        f = document.createElement('iframe');
        f.id = 'dl-frame';
        f.style.display = 'none';
        document.body.appendChild(f);
      }
      f.src = url;
    };

    var startDownload = function (url) {
      downloadVia(url);
      openThanks();
    };

    /* ---- the name gate, asked before any download starts ---- */

    var gateForm   = gate.querySelector('.gate-form');
    var gateInput  = gate.querySelector('.gate-input');
    var gateError  = gate.querySelector('.gate-error');
    var gateSubmit = gate.querySelector('.gate-submit');
    var pendingURL = '';

    var showGateError = function (message) {
      gateError.textContent = message;
      gateError.hidden = false;
      gateForm.classList.add('is-invalid');
      gateInput.setAttribute('aria-invalid', 'true');
    };

    var clearGateError = function () {
      gateError.hidden = true;
      gateForm.classList.remove('is-invalid');
      gateInput.removeAttribute('aria-invalid');
    };

    var openGate = function (url) {
      pendingURL = url;
      clearGateError();
      gateSubmit.disabled = false;
      gate.showModal();
      gate.scrollTop = 0;
      // showModal() focuses the first focusable child, which is the close
      // button. The field is what someone opened this to fill in.
      setTimeout(function () { gateInput.focus(); }, 0);
    };

    gateInput.addEventListener('input', clearGateError);

    gateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var entry = (gateInput.value || '').trim();

      if (!entry) { showGateError('Enter your name.'); gateInput.focus(); return; }
      // A name is taken as typed. Only something that is trying to be an
      // address gets the shape check.
      var isEmail = entry.indexOf('@') !== -1;
      if (isEmail && !looksLikeEmail(entry)) {
        showGateError("That email doesn't look quite right. A name works too.");
        gateInput.focus();
        return;
      }

      remember(entry);
      gateSubmit.disabled = true;

      // If recording the entry fails, the download still happens. Losing a
      // row of a count is no reason to withhold a free app.
      track({
        type: 'signup',
        name: isEmail ? '' : entry,
        email: isEmail ? entry : '',
        at: new Date().toISOString()
      });

      gate.close();
      startDownload(pendingURL);
    });

    gate.querySelectorAll('[data-gate-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { gate.close(); });
    });

    // A click on the backdrop (the dialog area outside the card) closes it.
    gate.addEventListener('click', function (e) {
      if (e.target === gate) gate.close();
    });

    /* ---- every download button on the page goes through the gate ---- */

    document.querySelectorAll('a[href$="HoldMyCode.dmg"]').forEach(function (link) {
      // Don't hijack the "start it manually" link inside the dialog itself.
      if (thanks.contains(link) || gate.contains(link)) return;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        // Asked once, not twice — the download itself is still recorded.
        var known = remembered();
        if (known) { startDownload(link.href); return; }
        // With no endpoint configured there is nowhere to put a name, so
        // asking for one would be theatre.
        if (!TRACK_ENDPOINT) { startDownload(link.href); return; }
        openGate(link.href);
      });
    });

    /* ---- the thank-you dialog ---- */

    // Copy buttons in the install guide.
    thanks.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var source = document.getElementById(btn.getAttribute('data-copy'));
        if (!source || !navigator.clipboard) return;
        navigator.clipboard.writeText(source.textContent).then(function () {
          btn.textContent = 'Copied';
          // Restarting the animation needs the class off for a frame.
          btn.classList.remove('is-copied');
          void btn.offsetWidth;
          btn.classList.add('is-copied');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('is-copied');
          }, 1600);
        });
      });
    });

    thanks.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { thanks.close(); });
    });

    // A click on the backdrop (the dialog area outside the card) closes it.
    thanks.addEventListener('click', function (e) {
      if (e.target === thanks) thanks.close();
    });

    // Esc-to-close. The native <dialog> already does this; this guarantees it
    // across environments and is a harmless no-op when nothing is open.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (gate.open) gate.close();
      else if (thanks.open) thanks.close();
    });
  }

  /* 6. Walkthrough video: plays while it's on screen, pauses when it scrolls
        away. Muted, no audio track; a click toggles play/pause. Under reduced
        motion it doesn't autoplay and shows native controls instead. */
  var wv = document.querySelector('.walkthrough-video');
  if (wv) {
    var reduceWv = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceWv) {
      wv.setAttribute('controls', '');
    } else {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { wv.play().catch(function () {}); }
            else { wv.pause(); }
          });
        }, { threshold: 0.25 }).observe(wv);
      } else {
        wv.play().catch(function () {});
      }
      wv.addEventListener('click', function () {
        if (wv.paused) wv.play().catch(function () {}); else wv.pause();
      });
    }
  }
  /* 7. Desk clutter: the stickers can be picked up and moved.
        Pointer events and two style properties, no library. A sticker keeps
        its rotation while it moves, because the rotation lives in `transform`
        and the drag only ever writes `left` and `top`. Each pickup raises the
        z-index, so whatever you touched last is on top, and a sticker that
        travelled more than a few pixels swallows the click that follows it so
        a drag never reads as a press. Nothing is stored: a reload puts the
        desk back the way it was. */
  document.querySelectorAll('.stickers').forEach(function (layer) {
    layer.querySelectorAll('.sticker').forEach(function (el) {

      // The browser's own image drag would hijack the gesture.
      el.addEventListener('dragstart', function (e) { e.preventDefault(); });

      el.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();

        // offsetLeft/offsetTop are the layout position inside .stickers, so
        // they read the same whether the sticker was anchored left or right,
        // and they ignore the rotation.
        var x = el.offsetLeft;
        var y = el.offsetTop;
        var startX = e.clientX;
        var startY = e.clientY;

        // Keep it inside its own section: no sticker can be shoved off the
        // page and drag a horizontal scrollbar in behind it.
        var maxX = layer.clientWidth  - el.offsetWidth;
        var maxY = layer.clientHeight - el.offsetHeight;

        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.right = 'auto';      // once moved it stops being edge-anchored
        el.style.bottom = 'auto';
        el.style.zIndex = String(++stickerTop);
        el.classList.add('is-dragging');
        el.setPointerCapture(e.pointerId);

        var moved = false;

        var onMove = function (ev) {
          var dx = ev.clientX - startX;
          var dy = ev.clientY - startY;
          if (!moved && Math.abs(dx) + Math.abs(dy) > 3) moved = true;
          el.style.left = Math.max(0, Math.min(maxX, x + dx)) + 'px';
          el.style.top  = Math.max(0, Math.min(maxY, y + dy)) + 'px';
        };

        var onUp = function () {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          el.removeEventListener('pointercancel', onUp);
          el.classList.remove('is-dragging');
          if (moved) {
            window.addEventListener('click', function (ev) {
              ev.stopPropagation();
              ev.preventDefault();
            }, { capture: true, once: true });
          }
        };

        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
      });
    });
  });
})();
