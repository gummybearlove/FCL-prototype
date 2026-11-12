/* =====================================================================
   First Class Legal — homepage motion system
   Grammar borrowed from the "Tana Camps / Elephant" brief:
     · hero photo settles, type rises letter by letter
     · the photo melts into the paper as you scroll
     · statements climb in one letter at a time, with pills springing in
     · portraits wipe up while their image settles from scale
     · ?rec=1 drives the page with a scripted 6.5s Web Animation
   ===================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ------------------------------------------------------------------
     1 · text splitting  (word masks + per-character spans)
     ------------------------------------------------------------------ */
  var groupCounters = new WeakMap();

  function splitNode(el) {
    var frag = document.createDocumentFragment();

    (function walk(node, target) {
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          child.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
            var word = document.createElement('span');
            word.className = 'word';
            Array.prototype.forEach.call(part, function (chr) {
              var c = document.createElement('span');
              c.className = 'ch';
              c.textContent = chr;
              word.appendChild(c);
            });
            target.appendChild(word);
          });
        } else if (child.nodeType === 1) {
          var clone = child.cloneNode(false);
          walk(child, clone);
          target.appendChild(clone);
        }
      });
    })(el, frag);

    el.innerHTML = '';
    el.appendChild(frag);
  }

  function optsFor(el) {
    var o = { step: 30, rise: '.55em', tilt: 4, blur: '0px' };
    var host = el.closest('[data-split-opts]');
    if (host) {
      if (host.dataset.step) o.step = parseFloat(host.dataset.step);
      if (host.dataset.rise) o.rise = host.dataset.rise;
      if (host.dataset.tilt) o.tilt = parseFloat(host.dataset.tilt);
      if (host.dataset.blur) o.blur = host.dataset.blur;
    }
    if (el.dataset.step) o.step = parseFloat(el.dataset.step);
    if (el.dataset.rise) o.rise = el.dataset.rise;
    if (el.dataset.tilt) o.tilt = parseFloat(el.dataset.tilt);
    if (el.dataset.blur) o.blur = el.dataset.blur;
    return o;
  }

  function splitAll() {
    var targets = document.querySelectorAll('[data-split],[data-split-title]');
    Array.prototype.forEach.call(targets, function (el) {
      var o = optsFor(el);
      var group = el.closest('[data-split-opts]') || el;
      var start = groupCounters.get(group) || 0;
      var n = 0;

      el.style.setProperty('--rise', o.rise);
      el.style.setProperty('--blur', o.blur);

      splitNode(el);
      Array.prototype.forEach.call(el.querySelectorAll('.ch'), function (c) {
        var i = start + n;
        c.style.setProperty('--d', (i * o.step) + 'ms');
        if (o.tilt) c.style.setProperty('--tilt', (n % 2 ? -1 : 1) * o.tilt + 'deg');
        n++;
      });
      groupCounters.set(group, start + n);
      el._chars = el.querySelectorAll('.ch');
    });
  }

  function revealSplit(el) {
    el.classList.add('is-in');
    Array.prototype.forEach.call(el.querySelectorAll('.ch'), function (c) {
      c.classList.add('is-in');
    });
  }

  /* ------------------------------------------------------------------
     2 · staggered rises
     ------------------------------------------------------------------ */
  function stagger(el) {
    el.classList.add('is-in');
    Array.prototype.forEach.call(el.children, function (child, i) {
      child.style.transitionDelay = (i * 90) + 'ms';
    });
  }

  /* ------------------------------------------------------------------
     3 · reveal observers
     ------------------------------------------------------------------ */
  function observeReveals() {
    var statement = document.getElementById('statement');
    var stmtObserver = null;

    if (statement) {
      stmtObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          statement.classList.add('is-in');
          var pills = statement.querySelectorAll('[data-pill]');
          Array.prototype.forEach.call(pills, function (p, i) {
            setTimeout(function () { p.classList.add('is-in'); }, 120 + i * 140);
          });
          var emb = document.querySelector('[data-emblem]');
          if (emb) setTimeout(function () { emb.classList.add('is-in'); }, 340);
          statement._split.forEach(revealSplit);
          stmtObserver.disconnect();
        });
      }, { threshold: 0.35 });
      stmtObserver.observe(statement);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.hasAttribute('data-split') || el.hasAttribute('data-split-title')) {
          revealSplit(el);
        } else if (el.hasAttribute('data-stagger')) {
          stagger(el);
        } else if (el.hasAttribute('data-portrait')) {
          el.classList.add('is-in');
          var chips = el.querySelector('[data-chips]');
          if (chips) {
            Array.prototype.forEach.call(chips.children, function (li, i) {
              li.style.transitionDelay = (0.55 + i * 0.16) + 's';
            });
            chips.classList.add('is-in');
          }
        } else {
          el.classList.add('is-in');
        }
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-rise],[data-split],[data-split-title],[data-stagger],[data-portrait]'),
      function (el) { io.observe(el); }
    );
  }

  /* ------------------------------------------------------------------
     4 · scroll-linked effects  (hero melt, drift, parallax)
     ------------------------------------------------------------------ */
  var heroStage = document.getElementById('heroStage');
  var heroImg = document.querySelector('.hero__img');
  var portraits = [];

  function collectPortraits() {
    portraits = Array.prototype.map.call(document.querySelectorAll('[data-portrait] .frame img'), function (img) {
      return { img: img, frame: img.parentNode };
    });
  }

  function applyScroll(y) {
    var vh = window.innerHeight || 1;
    var melt = clamp(y / (0.6 * vh), 0, 1);
    document.documentElement.style.setProperty('--melt', melt.toFixed(4));

    if (heroStage) heroStage.style.transform = 'translate3d(0,' + (y * 0.32).toFixed(2) + 'px,0)';
    if (heroImg) heroImg.style.filter = 'blur(' + (melt * 6).toFixed(2) + 'px)';

    portraits.forEach(function (p) {
      var r = p.frame.getBoundingClientRect();
      var centre = r.top + r.height / 2;
      var delta = (centre - vh / 2) / vh;      /* -1 .. 1 */
      var drift = clamp(delta * 7, -7, 7);
      p.img.style.setProperty('--par', drift.toFixed(2) + '%');
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      applyScroll(window.scrollY);
      ticking = false;
    });
  }

  /* ------------------------------------------------------------------
     5 · hero load sequence
     ------------------------------------------------------------------ */
  function heroIntro() {
    var lines = document.querySelectorAll('.hero__txt');
    var STEP = 55;   /* between characters */
    var GAP = 150;   /* between lines */
    var cursor = 140;

    Array.prototype.forEach.call(lines, function (line) {
      var chars = line.querySelectorAll('.ch');
      Array.prototype.forEach.call(chars, function (c, i) {
        var d = cursor + i * STEP;
        c.style.setProperty('--d', d + 'ms');
      });
      cursor += chars.length * STEP + GAP;
    });

    requestAnimationFrame(function () {
      document.body.classList.add('is-loaded');
      Array.prototype.forEach.call(lines, function (line) {
        line.classList.add('is-in');
        Array.prototype.forEach.call(line.querySelectorAll('.ch'), function (c) {
          c.classList.add('is-in');
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     6 · chrome behaviour
     ------------------------------------------------------------------ */
  function wireChrome() {
    var header = document.getElementById('header');
    var sticky = document.querySelector('.stickybar');

    function chrome() {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-stuck', y > 12);
      if (sticky) sticky.classList.toggle('is-shown', y > 620);
    }
    window.addEventListener('scroll', chrome, { passive: true });
    chrome();

    /* play badge: 48 radial ticks */
    var ring = document.getElementById('badgeRing');
    if (ring) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 48; i++) {
        var t = document.createElement('i');
        t.style.setProperty('--i', i);
        frag.appendChild(t);
      }
      ring.appendChild(frag);
    }

    /* carousel arrows */
    function trackFor(id) {
      var el = document.getElementById(id);
      if (!el) return null;
      return el.classList.contains('rail__track') ? el : el.querySelector('.rail__track');
    }

    function syncRailButtons(id) {
      var track = trackFor(id);
      if (!track) return;
      var max = Math.max(0, track.scrollWidth - track.clientWidth - 1);
      var prev = document.querySelector('[data-rail-prev="' + id + '"]');
      var next = document.querySelector('[data-rail-next="' + id + '"]');
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft >= max;
      /* if the row already fits, the arrows have nothing to do — hide them */
      var nav = (next || prev) && (next || prev).closest('.rail-nav');
      if (nav) nav.classList.toggle('is-idle', max <= 1);
    }

    function railStep(track) {
      var first = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
      var w = first ? first.getBoundingClientRect().width : track.clientWidth * 0.8;
      return Math.max(120, w + gap);
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-rail-next]'), function (btn) {
      var id = btn.dataset.railNext;
      btn.addEventListener('click', function () {
        var track = trackFor(id);
        if (!track) return;
        var max = Math.max(0, track.scrollWidth - track.clientWidth);
        var left = Math.min(track.scrollLeft + railStep(track), max);
        track.scrollTo({ left: left, behavior: 'smooth' });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-rail-prev]'), function (btn) {
      var id = btn.dataset.railPrev;
      btn.addEventListener('click', function () {
        var track = trackFor(id);
        if (!track) return;
        var left = Math.max(0, track.scrollLeft - railStep(track));
        track.scrollTo({ left: left, behavior: 'smooth' });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-rail-next],[data-rail-prev]'), function (btn) {
      var id = btn.dataset.railNext || btn.dataset.railPrev;
      var track = trackFor(id);
      if (!track) return;
      track.addEventListener('scroll', function () { syncRailButtons(id); }, { passive: true });
      syncRailButtons(id);
    });

    /* FAQ accordion */
    Array.prototype.forEach.call(document.querySelectorAll('.faq__q'), function (q) {
      q.addEventListener('click', function () {
        var item = q.parentNode;
        var open = item.classList.contains('is-open');
        Array.prototype.forEach.call(document.querySelectorAll('.faq__item.is-open'), function (o) {
          o.classList.remove('is-open');
          o.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          q.setAttribute('aria-expanded', 'true');
        }
      });
    });

    /* quote form tabs */
    Array.prototype.forEach.call(document.querySelectorAll('.form__tab'), function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.form__tab'), function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
      });
    });

    var form = document.getElementById('quoteForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var note = document.getElementById('formNote');
        var mode = document.querySelector('.form__tab.is-active');
        if (note) {
          note.textContent = 'Thanks — your ' + (mode ? mode.textContent.toLowerCase() : '') +
            ' quote request is in. We reply within one business hour.';
        }
      });
    }

    /* mobile menu */
    var burger = document.querySelector('.burger');
    if (burger) {
      burger.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
        a.addEventListener('click', function () {
          document.body.classList.remove('nav-open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ------------------------------------------------------------------
     7 · recorder mode  (?rec=1)
     ------------------------------------------------------------------ */
  function recorderMode() {
    var props = document.querySelectorAll('[data-rise],[data-split],[data-split-title],[data-stagger],[data-portrait]');
    var statement = document.getElementById('statement');
    var hero = document.querySelector('.hero');
    var services = document.getElementById('services');

    /* reveals are scheduled rather than observed */
    function revealNow(el) {
      if (el.hasAttribute('data-split') || el.hasAttribute('data-split-title')) revealSplit(el);
      else if (el.hasAttribute('data-stagger')) stagger(el);
      else el.classList.add('is-in');
    }

    Array.prototype.forEach.call(props, function (el) {
      if (hero && hero.contains(el)) { el.classList.add('is-in'); revealSplit(el); }
    });

    setTimeout(function () {
      if (statement) {
        statement.classList.add('is-in');
        Array.prototype.forEach.call(statement.querySelectorAll('[data-pill]'), function (p, i) {
          setTimeout(function () { p.classList.add('is-in'); }, 120 + i * 140);
        });
        var emb = document.querySelector('[data-emblem]');
        if (emb) setTimeout(function () { emb.classList.add('is-in'); }, 340);
        statement._split.forEach(revealSplit);
      }
      Array.prototype.forEach.call(props, function (el) {
        if (statement && statement.contains(el)) return;
        if (hero && hero.contains(el)) return;
        if (services && services.contains(el)) return;
        if (el.closest('.rail')) return;
        revealNow(el);
      });
    }, 2650);

    setTimeout(function () {
      Array.prototype.forEach.call(props, function (el) {
        if (services && services.contains(el)) revealNow(el);
      });
    }, 4850);

    /* scripted scroll */
    var y2 = statement ? statement.getBoundingClientRect().top + window.scrollY - 120 : 0;
    var y3 = services ? services.getBoundingClientRect().top + window.scrollY - 120 : 0;

    var anim = document.documentElement.animate([
      { transform: 'translateY(0px)', offset: 0 },
      { transform: 'translateY(0px)', offset: 1950 / 6500 },
      { transform: 'translateY(' + (-y2) + 'px)', offset: 3350 / 6500 },
      { transform: 'translateY(' + (-y2) + 'px)', offset: 4250 / 6500 },
      { transform: 'translateY(' + (-y3) + 'px)', offset: 5550 / 6500 },
      { transform: 'translateY(' + (-y3) + 'px)', offset: 1 }
    ], {
      duration: 6500,
      easing: 'linear',
      fill: 'forwards'
    });

    function readProgress() {
      var t = anim.currentTime || 0;
      var pts = [
        { t: 0, y: 0 }, { t: 1950, y: 0 }, { t: 3350, y: -y2 },
        { t: 4250, y: -y2 }, { t: 5550, y: -y3 }, { t: 6500, y: -y3 }
      ];
      var y = 0;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        if (t >= a.t && t <= b.t) {
          var p = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
          p = p < 0 ? 0 : p > 1 ? 1 : p;
          y = a.y + (b.y - a.y) * p;
          break;
        }
        if (t > pts[pts.length - 1].t) { y = pts[pts.length - 1].y; }
      }
      applyScroll(-y);
      requestAnimationFrame(readProgress);
    }
    requestAnimationFrame(readProgress);
  }

  /* ------------------------------------------------------------------
     boot
     ------------------------------------------------------------------ */
  function boot() {
    splitAll();

    /* keep a reference to each split group's members for grouped reveals */
    Array.prototype.forEach.call(document.querySelectorAll('[data-split-opts]'), function (host) {
      host._split = Array.prototype.slice.call(host.querySelectorAll('[data-split],[data-split-title]'));
    });
    document.querySelectorAll('[data-split],[data-split-title]').forEach(function (el) {
      if (!el._split) el._split = [el];
    });

    var isRec = new URLSearchParams(location.search).get('rec') === '1';

    if (isRec) {
      document.body.classList.add('is-rec');
      heroIntro();
      wireChrome();
      collectPortraits();
      recorderMode();
    } else {
      heroIntro();
      observeReveals();
      wireChrome();
      collectPortraits();
      applyScroll(window.scrollY);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
	/* ------------------------------------------------------------------
     Video
     ------------------------------------------------------------------ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
