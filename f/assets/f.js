/* Kernpartner · Variante F · Baujahr in Bühne und Datenblatt, Modellwahl über die Zeichnungen, Zählwerk (max. 3 s).
   Läuft nach site.js (defer-Reihenfolge). site.js rechnet das Datenblatt; hier wird nur angezeigt und gewählt. */
(function () {
  'use strict';
  var cj = document.getElementById('c-jahr');
  if (!cj) return;
  var years = document.querySelectorAll('[data-f-year]');
  var plain = document.querySelectorAll('[data-f-year-plain]');
  var modell = document.querySelectorAll('[data-f-modell]');
  var bauart = document.querySelector('[data-f-bauart]');
  var drawing = document.querySelector('[data-f-drawing]');
  var picks = document.querySelectorAll('[data-pick]');
  var now = new Date().getFullYear();
  var valid = function (v) { var y = parseInt(v, 10); return String(v).length === 4 && y >= 1800 && y <= now ? y : 0; };
  // Baureihe zur Zeichnung: bis 1948 Siedlerhaus, 1949 – 1969 Siedlungshaus, ab 1970 Bungalow
  var reihe = function (y) { return y <= 1948 ? ['1936', 'Siedlerhaus'] : (y <= 1969 ? ['1958', 'Siedlungshaus'] : ['1974', 'Bungalow']); };
  var counting = false;

  function show(v) {
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
  }
  cj.addEventListener('input', function () { show(cj.value); });
  show(cj.value);

  // Modellwahl: Baujahr setzen, Datenblatt rechnen lassen (site.js hört auf input), hinscrollen
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // Zählwerk in der Bühne: einmal pro Besuch, nicht bei „Bewegung reduzieren“, Sprunglinks oder ?intro=0
  var hero = document.querySelector('.hero [data-f-year]');
  var q = location.search, seen = false;
  try { seen = !!sessionStorage.getItem('kp-f-intro'); } catch (e) {}
  if (!hero || reduce || location.hash || q.indexOf('intro=0') > -1 || (seen && q.indexOf('intro=1') < 0)) return;
  var target = valid(cj.value);
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
    show(cj.value);
    try { sessionStorage.setItem('kp-f-intro', '1'); } catch (e) {}
  };
  requestAnimationFrame(frame);
})();
