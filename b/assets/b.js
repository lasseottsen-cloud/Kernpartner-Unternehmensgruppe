/* Kernpartner · Variante B · Zählwerk in der Bühne (max. 3 s) und Baujahr im Fließtext.
   Läuft nach site.js (defer-Reihenfolge), damit ?baujahr= schon in der Überschrift steht. */
(function () {
  'use strict';
  var h1 = document.querySelector('.hero [data-modell]');
  if (!h1) return;
  var inline = document.querySelectorAll('[data-modell-inline]');
  var animating = false;

  // Fließtext „Modell 1958“ folgt der Überschrift (ohne Punkt)
  var sync = function () {
    if (animating) return;
    var t = h1.textContent.replace(/\.$/, '');
    inline.forEach(function (el) { el.textContent = t; });
  };
  sync();
  if (window.MutationObserver) new MutationObserver(sync).observe(h1, { childList: true, characterData: true, subtree: true });

  // Zählwerk: einmal pro Besuch, nicht bei „Bewegung reduzieren“, Sprunglinks oder ?intro=0
  var q = location.search;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = !!sessionStorage.getItem('kp-b-intro'); } catch (e) {}
  if (reduce || location.hash || q.indexOf('intro=0') > -1 || (seen && q.indexOf('intro=1') < 0)) return;

  var m = h1.textContent.match(/(\d{4})/);
  if (!m) return;
  var target = parseInt(m[1], 10);
  var start = new Date().getFullYear();
  if (!(target < start)) return;
  var dur = Math.min(3000, 1200 + (start - target) * 18);
  var t0 = null;
  animating = true;
  h1.setAttribute('aria-label', 'Modell ' + target + '.');
  var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
  var frame = function (ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var y = Math.round(start - (start - target) * ease(p));
    h1.textContent = 'Modell ' + y + '.';
    if (p < 1) requestAnimationFrame(frame);
    else {
      h1.textContent = 'Modell ' + target + '.';
      h1.removeAttribute('aria-label');
      animating = false;
      sync();
      try { sessionStorage.setItem('kp-b-intro', '1'); } catch (e) {}
    }
  };
  requestAnimationFrame(frame);
})();
