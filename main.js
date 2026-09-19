/* HoldMyCode — landing page behaviour.
   Everything here is progressive enhancement: with JS off the page is fully
   readable and every section is visible. */

(function () {
  'use strict';

  /* 1. Hairline under the sticky nav once the page scrolls. */
  var header = document.getElementById('siteHeader');
  if (header) {
    var syncHeader = function () {
      header.classList.toggle('is-stuck', window.scrollY > 4);
    };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
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
        'translate3d(0,' + (-4 + 24 * t).toFixed(2) + '%,0) ' +
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

  /* 4. "How it works" — one card that plays through five states.
        Always autoplays; there is no pause button by design. The segments
        double as controls, so a viewer can still jump to any step.
        Enhancement only: with JS off the five steps are listed in order. */
  var demo = document.getElementById('demo');
  if (demo) {
    var steps  = Array.prototype.slice.call(demo.querySelectorAll('.step'));
    var segs   = Array.prototype.slice.call(demo.querySelectorAll('.seg'));
    var DWELL  = 4200;
    var index  = 0;
    var timer  = null;
    var hasIO  = 'IntersectionObserver' in window;
    // Start "not in view" when we can observe — the observer reports the real
    // state within a frame. Without an observer we just play.
    var inView = !hasIO;

    demo.classList.add('is-enhanced');
    demo.style.setProperty('--dwell', DWELL + 'ms');

    function paint() {
      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === index);
      });
      segs.forEach(function (seg, i) {
        seg.classList.toggle('is-done', i < index);
        seg.classList.remove('is-current');
        seg.setAttribute('aria-current', i === index ? 'step' : 'false');
      });
      // The fill is a CSS animation, so it would otherwise run to completion
      // off-screen and be sitting full (and apparently stuck) by the time the
      // card is scrolled into view. Only arm it while the card is visible.
      if (!inView) return;
      // Re-add on the next frame so the animation restarts from zero.
      requestAnimationFrame(function () {
        if (segs[index]) segs[index].classList.add('is-current');
      });
    }

    function schedule() {
      clearTimeout(timer);
      if (!inView) return;
      timer = setTimeout(function () {
        index = (index + 1) % steps.length;
        paint();
        schedule();
      }, DWELL);
    }

    segs.forEach(function (seg, i) {
      seg.addEventListener('click', function () {
        index = i;
        paint();
        schedule();
      });
    });

    /* Only run while the card is actually on screen — no timer churning on a
       section nobody is looking at. threshold 0 so it starts the moment any
       part of the card appears, rather than waiting for a quarter of it. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var last = entries[entries.length - 1];
        var nowInView = last.isIntersecting;
        if (nowInView === inView) return;
        inView = nowInView;
        paint();      // arms the fill on entry, clears it on exit
        schedule();   // a full dwell starts from here, so the bar matches
      }, { threshold: 0 }).observe(demo);
    }

    paint();
    schedule();
  }

  /* 5. Nav reflects where you are on the page. Cheap: one rAF-throttled read
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

  /* 6. Download flow: ask for an email, then start the download, then say thanks.

        Progressive enhancement throughout. With JS off every download link is a
        plain link to the DMG: the gate never opens and the download still works.
        With JS on the gate is mandatory — the DMG is only fetched once a valid
        address has been submitted, or once one was submitted on an earlier
        visit. The native <dialog> handles Esc, focus-trap and return-focus. */
  /* Where downloads and email sign-ups are recorded. Leave '' and the site stays
     fully static — no ping, and the gate lets everyone straight through. */
  var TRACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxVNvUh3hvZ0p2UyFAsEK160Pzn8PyXY3b4dLrZmNwYuLvl6cW05r2MqpjLqEFesf3HjQ/exec';

  /* Remembering the address keeps a returning visitor from being asked twice.
     Private-mode Safari throws on storage, so every access is guarded. */
  var EMAIL_KEY = 'hmc.email';
  var remembered = function () {
    try { return localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { return ''; }
  };
  var remember = function (email) {
    try { localStorage.setItem(EMAIL_KEY, email); } catch (e) { /* not essential */ }
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

    /* ---- the email gate, asked before any download starts ---- */

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
      var email = (gateInput.value || '').trim();

      if (!email) { showGateError('Enter an email address.'); gateInput.focus(); return; }
      if (!looksLikeEmail(email)) {
        showGateError("That doesn't look like an email address.");
        gateInput.focus();
        return;
      }

      remember(email);
      gateSubmit.disabled = true;

      // If recording the address fails, the download still happens. Losing a
      // row of a count is no reason to withhold a free app.
      track({ type: 'signup', email: email, at: new Date().toISOString() });

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
        if (known && looksLikeEmail(known)) { startDownload(link.href); return; }
        // With no endpoint configured there is nowhere to put an address, so
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
          setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
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

  /* 7. Walkthrough video: plays while it's on screen, pauses when it scrolls
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
})();
