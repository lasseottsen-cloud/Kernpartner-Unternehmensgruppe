/* Kernpartner · Variante F · Baujahr in Bühne und Datenblatt (Wärme), Jahrzehnt in der Farbkarte (Farbe),
   Modellwahl, Zählwerk in der Bühne (max. 3 s).
   Läuft nach site.js (defer-Reihenfolge). site.js rechnet Datenblatt und Farbpalette; hier wird nur angezeigt und gewählt. */
(function () {
  'use strict';
  var now = new Date().getFullYear();
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var valid = function (v) { var y = parseInt(v, 10); return String(v).length === 4 && y >= 1800 && y <= now ? y : 0; };
  var counting = false;
  var show = null;

  // Farbe: Jahrzehnt in der Farbkarte mitführen, Startwert aus <body data-start-dec>
  var decs = document.querySelectorAll('[data-dec]');
  if (decs.length) {
    var decOut = document.querySelectorAll('[data-f-dec]');
    decs.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-dec');
        decOut.forEach(function (el) { el.textContent = k; });
      });
    });
    var start = document.body.getAttribute('data-start-dec');
    var sb = start && document.querySelector('[data-dec="' + start + '"]');
    if (sb) sb.click();
  }

  // Wärme: Förderung in Bühne, 46-%-Block und Rechenbeispiel aus derselben Rechnung wie das Datenblatt (site.js, tagesgenau)
  if (window.KPF && document.querySelector('[data-f-zuschuss],[data-f-pct]')) {
    var F = KPF.regel(), R = F.r, heute = new Date();
    var put = function (sel, t) { document.querySelectorAll(sel).forEach(function (el) { el.textContent = t; }); };
    put('[data-f-zuschuss]', 'Rund ' + KPF.euro(Math.round(F.z / 500) * 500));
    put('[data-f-pct]', F.pct + ' %');
    put('[data-f-pct-note]', R.g + ' % Grundförderung' +
      (R.k ? ' + ' + R.k + ' % Klima-Bonus beim Tausch einer alten Öl- oder Gasheizung' : '') +
      (R.k && R.next ? ', bei Antrag bis ' + KPF.datum(R.bis) + '. Danach ' + (R.next.k ? 'sinkt der Klima-Bonus auf ' + R.next.k + ' %, zusammen ' + (R.g + R.next.k) + ' %.' : 'entfällt der Klima-Bonus.')
                     : '. Stand ' + KPF.datum(heute) + '.'));
    var BSP = 35000, bff = Math.min(BSP, F.ff), bz = Math.round(bff * F.pct / 100);
    put('[data-f-bsp-ff]', KPF.euro(bff));
    put('[data-f-bsp-zl]', 'Zuschuss (' + F.pct + ' %)');
    put('[data-f-bsp-z]', '– ' + KPF.euro(bz));
    put('[data-f-bsp-e]', KPF.euro(BSP - bz));
  }

  // Wärme: Kurzergebnis direkt unter dem Baujahr (am Handy steht das Datenblatt erst unter dem Formular)
  var kurz = document.querySelector('[data-f-kurz]'), eig = document.querySelector('[data-s="eigen"]');
  if (kurz && eig) {
    var upd = function () { var t = eig.textContent.trim(); kurz.hidden = !t; kurz.textContent = 'Ihr Eigenanteil, Richtwert: ' + t + ' · ganzes Datenblatt ↓'; };
    new MutationObserver(upd).observe(eig, { childList: true, characterData: true, subtree: true }); upd();
  }

  // Wärme: Baujahr in Bühne, Datenblatt und Modellwahl
  var cj = document.getElementById('c-jahr');
  if (cj) {
    var years = document.querySelectorAll('[data-f-year]');
    var plain = document.querySelectorAll('[data-f-year-plain]');
    var modell = document.querySelectorAll('[data-f-modell]');
    var bauart = document.querySelector('[data-f-bauart]');
    var drawing = document.querySelector('[data-f-drawing]');
    var picks = document.querySelectorAll('[data-pick]');
    // Baureihe: bis 1948 Siedlerhaus, 1949 – 1969 Siedlungshaus, ab 1970 Bungalow
    var reihe = function (y) { return y <= 1948 ? ['1936', 'Siedlerhaus'] : (y <= 1969 ? ['1958', 'Siedlungshaus'] : ['1974', 'Bungalow']); };
    show = function (v) {
      var y = valid(v);
      var t = y ? String(y) : (v && v.length ? v : '….');
      if (!counting) years.forEach(function (el) { el.textContent = t; });
      plain.forEach(function (el) { el.textContent = t; });
      modell.forEach(function (el) { el.textContent = 'Modell ' + t; });
      if (!y) return;
      var r = reihe(y);
      if (bauart) bauart.textContent = r[1];
      if (drawing && drawing.getAttribute('src').indexOf(r[0]) < 0) drawing.setAttribute('src', '../img/modell-' + r[0] + '.jpg');
      picks.forEach(function (b) {
        var p = b.getAttribute('data-pick');
        b.setAttribute('aria-pressed', p && reihe(parseInt(p, 10))[0] === r[0] ? 'true' : 'false');
      });
    };
    cj.addEventListener('input', function () { show(cj.value); });
    show(cj.value);

    // Modellwahl: Baujahr setzen, Datenblatt rechnen lassen (site.js hört auf input), hinscrollen
    picks.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-pick');
        var sec = document.getElementById('baujahr');
        if (p) {
          cj.value = p;
          cj.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (sec) sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (!p) setTimeout(function () { cj.focus(); cj.select(); }, reduce ? 0 : 450);
      });
    });
  }

  // Zählwerk in der Bühne: einmal pro Besuch und Seite, nicht bei „Bewegung reduzieren“, Sprunglinks oder ?intro=0
  var hero = document.querySelector('.hero [data-f-year]');
  if (!hero) return;
  var key = 'kp-f-intro' + location.pathname, q = location.search, seen = false;
  try { seen = !!sessionStorage.getItem(key); } catch (e) {}
  if (reduce || location.hash || q.indexOf('intro=0') > -1 || (seen && q.indexOf('intro=1') < 0)) return;
  var target = cj ? valid(cj.value) : valid(hero.textContent);
  if (!target || target >= now) return;
  var dur = Math.min(3000, 1200 + (now - target) * 18), t0 = null;
  var h1 = document.getElementById('h1');
  counting = true;
  if (h1) h1.setAttribute('aria-label', 'Modell ' + target + '.');
  var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
  var frame = function (ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    hero.textContent = String(Math.round(now - (now - target) * ease(p)));
    if (p < 1) { requestAnimationFrame(frame); return; }
    counting = false;
    if (h1) h1.removeAttribute('aria-label');
    if (show) show(cj.value); else hero.textContent = String(target);
    try { sessionStorage.setItem(key, '1'); } catch (e) {}
  };
  requestAnimationFrame(frame);
})();
