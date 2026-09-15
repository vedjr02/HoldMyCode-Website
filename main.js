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

  /* 6. Thank-you dialog after a download begins. Enhancement only: the links
        still download with JS off; the dialog simply never opens. The native
        <dialog> handles Esc, focus-trap and return-focus for us. */
  /* Optional analytics: where to record downloads + email sign-ups. Leave '' and
     the site stays fully static — no tracking, no email field. Set it to your
     endpoint URL to turn on the download-count ping and the popup email field. */
  var TRACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxVNvUh3hvZ0p2UyFAsEK160Pzn8PyXY3b4dLrZmNwYuLvl6cW05r2MqpjLqEFesf3HjQ/exec';

  var thanks = document.getElementById('thanks');
  if (thanks && typeof thanks.showModal === 'function') {
    var track = function (payload) {
      if (!TRACK_ENDPOINT) return;
      try {
        fetch(TRACK_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } catch (e) { /* fire-and-forget */ }
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

    document.querySelectorAll('a[href$="HoldMyCode.dmg"]').forEach(function (link) {
      // Don't hijack the "start it manually" link inside the dialog itself.
      if (thanks.contains(link)) return;
      link.addEventListener('click', openThanks);
    });

    // Optional email capture — revealed only when an endpoint is configured.
    var notify = thanks.querySelector('.modal-notify');
    if (notify && TRACK_ENDPOINT) {
      notify.hidden = false;
      notify.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = notify.querySelector('.modal-notify-input');
        var email = (input.value || '').trim();
        if (!email || !input.checkValidity()) { input.focus(); return; }
        track({ type: 'signup', email: email, at: new Date().toISOString() });
        notify.querySelector('.modal-notify-row').hidden = true;
        notify.querySelector('.modal-notify-label').hidden = true;
        var msg = notify.querySelector('.modal-notify-msg');
        msg.hidden = false;
        msg.textContent = "You're on the list — thanks!";
      });
    }

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
    // across environments and is a harmless no-op when the dialog is closed.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && thanks.open) thanks.close();
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
