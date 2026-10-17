/* Kernpartner · Testversion: Menü, Baujahr-Check, Farbjahrzehnte, Formulare (senden nichts) */
(function () {
  'use strict';

  // Menü
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');
  if (nav && burger) {
    var close = function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.links a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // Baujahr-Check (Wärme)
  var VERDICT = [
    '',
    'Dicke Mauern speichern Wärme gut. Oft reicht es, einzelne Heizkörper zu vergrößern.',
    'Vor der ersten Dämmvorschrift gebaut: Wir prüfen zuerst Dach und Fenster – danach passt die Wärmepumpe meist deutlich besser.',
    'Solide Mitte: Häufig reicht ein Heizkörpertausch in wenigen Räumen, und die Wärmepumpe läuft effizient.',
    'Fast bereit: gut gedämmt, oft mit Fußbodenheizung. Die Wärmepumpe kann meist direkt kommen.'
  ];
  var ERA = ['', 'bis 1948', '1949 – 1977', '1978 – 1994', 'ab 1995'];
  function eraOf(y) { return y <= 1948 ? 1 : (y <= 1977 ? 2 : (y <= 1994 ? 3 : 4)); }
  var now = new Date().getFullYear();

  var check = document.getElementById('check-form');
  if (check) {
    var jahr = document.getElementById('jahr');
    var modell = document.querySelectorAll('[data-modell]');
    var res = document.getElementById('check-result');
    var err = document.getElementById('check-err');
    var tiles = document.querySelectorAll('[data-era]');
    var valid = function (v) { var y = parseInt(v, 10); return v.length === 4 && y >= 1800 && y <= now ? y : 0; };
    var mark = function (era) { tiles.forEach(function (t) { t.classList.toggle('on', String(era) === t.getAttribute('data-era')); }); };
    jahr.addEventListener('input', function () {
      jahr.value = jahr.value.replace(/[^0-9]/g, '').slice(0, 4);
      var y = valid(jahr.value);
      modell.forEach(function (m) { m.textContent = 'Modell ' + (jahr.value.length === 4 ? jahr.value : '….') + '.'; });
      err.textContent = '';
      if (y) mark(eraOf(y));
    });
    check.addEventListener('submit', function (e) {
      e.preventDefault();
      var y = valid(jahr.value);
      if (!y) { err.textContent = 'Bitte ein vierstelliges Baujahr zwischen 1800 und ' + now + ' eingeben.'; res.classList.remove('on'); jahr.focus(); return; }
      var era = eraOf(y);
      mark(era);
      res.querySelector('[data-r="k"]').textContent = 'Modell ' + y + ' · Bauzeit ' + ERA[era];
      res.querySelector('[data-r="v"]').textContent = VERDICT[era];
      res.classList.add('on');
      var bj = document.getElementById('k-baujahr');
      if (bj && !bj.value) bj.value = String(y);
      var plz = document.getElementById('plz');
      var kplz = document.getElementById('k-plz');
      if (plz && kplz && !kplz.value) kplz.value = plz.value;
    });
  }

  // Farbjahrzehnte (Farbe)
  var eras = document.querySelectorAll('[data-dec]');
  if (eras.length) {
    var PAL = {
      '1930er': { c: ['#7A2E24', '#2F4A3F', '#D8CBB0', '#3C3A36', '#B08A52'], t: 'Ochsenblutrot, Tannengrün und warmes Sandweiß – kräftig an Türen und Fenstern, ruhig an der Wand.' },
      '1950er': { c: ['#A9C3B0', '#E8D9A8', '#D9A9A0', '#6F8FA6', '#F1EDE2'], t: 'Pastell und Helle: Mintgrün, Vanille, Altrosa und Taubenblau – freundlich und leicht.' },
      '1970er': { c: ['#B5752A', '#6B4A2E', '#C8A43C', '#7C7F3A', '#E3D3B5'], t: 'Erdtöne: Orange, Schokobraun, Senf und Olive – heute am schönsten sparsam als Akzent.' }
    };
    var pal = document.getElementById('palette');
    var txt = document.getElementById('era-text');
    var show = function (k) {
      eras.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-dec') === k ? 'true' : 'false'); });
      pal.innerHTML = '';
      PAL[k].c.forEach(function (hex) {
        var d = document.createElement('div'); d.className = 'c';
        var s = document.createElement('span'); s.style.background = hex;
        var c = document.createElement('code'); c.textContent = hex;
        d.appendChild(s); d.appendChild(c); pal.appendChild(d);
      });
      txt.textContent = PAL[k].t;
      var f = document.getElementById('a-baujahr-dec');
      if (f) f.value = k;
    };
    eras.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-dec')); }); });
    show('1950er');
  }

  // Fotos auswählen (nur Anzeige, nichts wird hochgeladen)
  document.querySelectorAll('.drop').forEach(function (drop) {
    var inp = drop.querySelector('input[type=file]');
    var out = drop.querySelector('.files');
    var list = function () {
      var n = Array.prototype.map.call(inp.files, function (f) { return f.name; });
      out.textContent = n.length ? n.join(' · ') : 'noch keine Fotos gewählt';
    };
    inp.addEventListener('change', list);
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); setTimeout(list, 0); }); });
  });

  // Bewerbung ein-/ausklappen (Gruppe)
  document.querySelectorAll('[data-toggle]').forEach(function (b) {
    var t = document.getElementById(b.getAttribute('data-toggle'));
    b.addEventListener('click', function () {
      t.hidden = !t.hidden;
      b.setAttribute('aria-expanded', t.hidden ? 'false' : 'true');
      if (!t.hidden) { var f = t.querySelector('input,select,textarea'); if (f) f.focus(); }
    });
  });

  // Formulare der Testversion: prüfen, Danke zeigen, nichts senden
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      f.classList.add('sent');
      var d = f.querySelector('.done');
      if (d) { d.setAttribute('tabindex', '-1'); d.focus(); }
    });
    var again = f.querySelector('[data-again]');
    if (again) again.addEventListener('click', function () { f.reset(); f.classList.remove('sent'); var o = f.querySelector('.files'); if (o) o.textContent = 'noch keine Fotos gewählt'; });
  });
})();
