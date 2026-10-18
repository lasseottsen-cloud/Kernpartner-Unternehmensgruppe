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

  // Baujahr-Check (Wärme): kurze Antwort oben, Datenblatt mit Kosten und Förderung in #baujahr
  var VERDICT = [
    '',
    'Dicke Mauern speichern Wärme gut. Oft reicht es, einzelne Heizkörper zu vergrößern.',
    'Vor der ersten Dämmvorschrift gebaut: Wir prüfen zuerst Dach und Fenster – danach passt die Wärmepumpe meist deutlich besser.',
    'Solide Mitte: Häufig reicht ein Heizkörpertausch in wenigen Räumen, und die Wärmepumpe läuft effizient.',
    'Fast bereit: gut gedämmt, oft mit Fußbodenheizung. Die Wärmepumpe kann meist direkt kommen.'
  ];
  var ERA = ['', 'bis 1948', '1949 – 1977', '1978 – 1994', 'ab 1995'];
  var ERA_T = ['', 'dicke Mauern', 'vor der ersten Dämmvorschrift', 'solide Mitte', 'fast bereit'];
  function eraOf(y) { return y <= 1948 ? 1 : (y <= 1977 ? 2 : (y <= 1994 ? 3 : 4)); }
  var now = new Date().getFullYear();
  var valid = function (v) { var y = parseInt(v, 10); return String(v).length === 4 && y >= 1800 && y <= now ? y : 0; };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Richtwerte, Stand Oktober 2026: Luft-Wasser-Wärmepumpe im Bestand, mit Einbau und Abbau der alten Heizung
  var BASE = { s: [26000, 31000], m: [29000, 35000], l: [34000, 42000] };
  var FLAECHE = { s: 'bis 120 m²', m: '120 – 180 m²', l: 'über 180 m²' };
  var ERA_ADD = [null, [2000, 4000], [3000, 6000], [1000, 2500], [0, 1000]];
  var TODO = [null,
    ['2 bis 4 Heizkörper vergrößern, damit die Wärmepumpe mit wenig Vorlauftemperatur auskommt', 'Hydraulischer Abgleich', 'Dach und oberste Decke ansehen'],
    ['Oberste Geschossdecke oder Dach dämmen: bringt bei diesem Baujahr am meisten', '3 bis 6 Heizkörper tauschen', 'Hydraulischer Abgleich'],
    ['1 bis 3 Heizkörper tauschen', 'Hydraulischer Abgleich'],
    ['Meist direkt möglich, oft mit Fußbodenheizung', 'Hydraulischer Abgleich']];
  var HEIZ = { oel: 'Ölheizung', gas: 'Gasheizung', strom: 'Nachtspeicher', andere: 'andere Heizung' };
  var EINK = { hoch: ['über 50.000 €', 'über 60.000 €'], e50: ['40.001 – 50.000 €', '50.001 – 60.000 €'], e40: ['30.001 – 40.000 €', '40.001 – 50.000 €'], e30: ['bis 30.000 €', 'bis 40.000 €'] };
  var EINK_P = { hoch: 0, e50: 10, e40: 30, e30: 40 };
  var KLIMA_BIS = new Date(2027, 0, 31, 23, 59, 59);
  var FF_MAX = 28000;
  var euro = function (n) { return Math.round(n).toLocaleString('de-DE') + ' €'; };
  var span = function (a, b) { return a === b ? euro(a) : euro(a).replace(' €', '') + ' – ' + euro(b); };
  var r500 = function (n) { return Math.round(n / 500) * 500; };

  var check = document.getElementById('check-form');
  var cfg = document.getElementById('cfg');
  var jahr = document.getElementById('jahr');
  var cj = document.getElementById('c-jahr');
  var modell = document.querySelectorAll('[data-modell]');
  var syncing = false;

  function setYear(v, from) {
    if (syncing) return; syncing = true;
    if (from !== jahr && jahr) { jahr.value = v; }
    if (from !== cj && cj) { cj.value = v; }
    modell.forEach(function (m) { m.textContent = 'Modell ' + (v.length === 4 ? v : '….') + '.'; });
    syncing = false;
    if (cfg) render();
  }

  if (check) {
    var res = document.getElementById('check-result');
    var err = document.getElementById('check-err');
    jahr.addEventListener('input', function () {
      jahr.value = jahr.value.replace(/[^0-9]/g, '').slice(0, 4);
      err.textContent = '';
      setYear(jahr.value, jahr);
    });
    check.addEventListener('submit', function (e) {
      e.preventDefault();
      var y = valid(jahr.value);
      if (!y) { err.textContent = 'Bitte ein vierstelliges Baujahr zwischen 1800 und ' + now + ' eingeben.'; res.classList.remove('on'); jahr.focus(); return; }
      var era = eraOf(y);
      res.querySelector('[data-r="k"]').textContent = 'Modell ' + y + ' · Bauzeit ' + ERA[era];
      res.querySelector('[data-r="v"]').textContent = VERDICT[era];
      res.classList.add('on');
      setYear(String(y), jahr);
      var plz = document.getElementById('plz');
      var kplz = document.getElementById('k-plz');
      if (plz && kplz && !kplz.value) kplz.value = plz.value;
      var sec = document.getElementById('baujahr');
      if (sec) setTimeout(function () { sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 350);
    });
  }

  var state = function () {
    var val = function (n) { var el = cfg.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; };
    return { y: valid(cj.value), heiz: val('c-heiz'), alter: val('c-alter'), fl: val('c-flaeche') || 'm', eink: val('c-eink') || 'hoch',
      kind: document.getElementById('c-kind').checked, selbst: document.getElementById('c-selbst').checked };
  };

  function calc(st) {
    var era = eraOf(st.y);
    var lo = BASE[st.fl][0], hi = BASE[st.fl][1];
    var todo = TODO[era].slice();
    if (st.heiz === 'strom') { lo += 8000; hi += 14000; todo = ['Heizkörper und Leitungen in allen Räumen neu: bisher gibt es kein Wasser-Heizsystem', 'Platz für Speicher und Technik, meist im Keller oder Hauswirtschaftsraum']; }
    else { lo += ERA_ADD[era][0]; hi += ERA_ADD[era][1]; }
    if (st.heiz === 'oel') { lo += 1000; hi += 2000; todo.push('Öltank ausbauen und entsorgen'); }
    if (st.heiz === 'gas') { lo += 300; hi += 800; todo.push('Gasanschluss stilllegen lassen'); }
    lo = r500(lo); hi = r500(hi);
    var today = new Date();
    var klimaOk = st.selbst && (st.heiz === 'oel' || st.heiz === 'strom' || (st.heiz === 'gas' && st.alter === 'alt'));
    var g = 30, k = klimaOk && today <= KLIMA_BIS ? 16 : 0, e = st.selbst ? EINK_P[st.eink] : 0;
    var cap = st.selbst && st.eink === 'e30' ? 80 : 70;
    var pct = Math.min(g + k + e, cap);
    var ffLo = Math.min(lo, FF_MAX), ffHi = Math.min(hi, FF_MAX);
    var zLo = Math.round(ffLo * pct / 100), zHi = Math.round(ffHi * pct / 100);
    return { era: era, lo: lo, hi: hi, todo: todo, g: g, k: k, e: e, cap: cap, pct: pct, capped: g + k + e > cap, klimaOk: klimaOk,
      ffLo: ffLo, ffHi: ffHi, zLo: zLo, zHi: zHi, eLo: lo - zLo, eHi: hi - zHi, today: today };
  }

  var S = function (n) { return cfg ? document.querySelector('[data-s="' + n + '"]') : null; };

  function render() {
    var st = state(), cerr = document.getElementById('c-err');
    document.getElementById('c-alter-f').hidden = st.heiz !== 'gas';
    var kind = st.kind ? 1 : 0;
    cfg.querySelectorAll('[data-l]').forEach(function (sp) { sp.textContent = EINK[sp.getAttribute('data-l')][kind]; });
    cfg.querySelectorAll('input[name="c-eink"]').forEach(function (r) { r.disabled = !st.selbst; });
    document.getElementById('c-kind').disabled = !st.selbst;
    document.getElementById('c-kind-l').classList.toggle('off', !st.selbst);
    if (!st.y) {
      cerr.textContent = cj.value.length === 4 ? 'Bitte ein Baujahr zwischen 1800 und ' + now + ' eingeben.' : '';
      S('modell').textContent = 'Modell ' + (cj.value.length === 4 ? cj.value : '….') + '.';
      return;
    }
    cerr.textContent = '';
    var c = calc(st);
    S('modell').textContent = 'Modell ' + st.y + '.';
    S('era').textContent = 'Bauzeit ' + ERA[c.era] + ' · ' + ERA_T[c.era] + ' · ' + HEIZ[st.heiz];
    var ul = S('todo'); ul.innerHTML = '';
    c.todo.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    S('cost-n').textContent = 'Richtwert für ' + FLAECHE[st.fl] + ', mit Abbau der alten Heizung';
    S('cost').textContent = span(c.lo, c.hi);
    S('ff').textContent = span(c.ffLo, c.ffHi);
    S('z-l').textContent = 'Zuschuss (' + c.pct + ' %)';
    S('z').textContent = '– ' + span(c.zLo, c.zHi);
    S('eigen').textContent = span(c.eLo, c.eHi);
    var chips = [['Grundförderung ' + c.g + ' %', 'on'], [c.k ? 'Klima-Bonus ' + c.k + ' %' : 'Klima-Bonus', c.k ? 'on' : 'off'], [c.e ? 'Einkommens-Bonus ' + c.e + ' %' : 'Einkommens-Bonus', c.e ? 'on' : 'off']];
    if (c.capped) chips.push(['höchstens ' + c.cap + ' %', 'on']);
    var box = S('rates'); box.innerHTML = '';
    chips.forEach(function (x) { var sp = document.createElement('span'); sp.textContent = x[0]; sp.className = x[1]; box.appendChild(sp); });
    var why = [];
    if (!st.selbst) why.push('Klima- und Einkommens-Bonus gibt es nur, wenn Sie selbst im Haus wohnen.');
    else if (st.heiz === 'gas' && st.alter === 'jung') why.push('Kein Klima-Bonus: Die Gasheizung ist jünger als 20 Jahre.');
    else if (st.heiz === 'andere') why.push('Klima-Bonus je nach Heizung, zum Beispiel bei Kohle oder Gasetagenheizung. Das prüfen wir beim Termin.');
    if (st.selbst && !c.e) why.push('Einkommens-Bonus nur bis ' + (kind ? '60.000' : '50.000') + ' € zu versteuerndem Haushaltseinkommen.');
    S('why').textContent = why.join(' ');
    var days = Math.ceil((KLIMA_BIS - c.today) / 864e5);
    S('clock').textContent = days > 0
      ? (c.k ? 'Klima-Bonus sichern: Antrag bis 31. Januar 2027 – noch ' + days + ' Tage. Danach sinkt er.' : 'Diese Sätze gelten für Anträge bis 31. Januar 2027 – noch ' + days + ' Tage.')
      : 'Die Sätze haben sich seit Oktober 2026 geändert. Wir rechnen mit dem Stand am Tag Ihres Antrags.';
  }

  if (cfg) {
    // Vorbelegung aus dem Link: ?baujahr=1958&heizung=oel&flaeche=m
    var q = function (n) { return (location.search.match(new RegExp('[?&]' + n + '=([^&#]+)')) || [])[1]; };
    var pick = function (n, v) { var el = cfg.querySelector('input[name="' + n + '"][value="' + v + '"]'); if (el) el.checked = true; };
    if (q('heizung')) pick('c-heiz', q('heizung'));
    if (q('flaeche')) pick('c-flaeche', q('flaeche'));
    if (q('alter')) pick('c-alter', q('alter'));
    var qb = q('baujahr');
    if (qb && valid(qb)) setYear(qb, null);
    cj.addEventListener('input', function () { cj.value = cj.value.replace(/[^0-9]/g, '').slice(0, 4); setYear(cj.value, cj); });
    cfg.addEventListener('change', render);
    cfg.addEventListener('submit', function (e) { e.preventDefault(); });
    document.getElementById('c-cta').addEventListener('click', function () {
      var st = state(); if (!st.y) return;
      var c = calc(st);
      var bj = document.getElementById('k-baujahr'); if (bj) bj.value = String(st.y);
      var tx = document.getElementById('k-text');
      if (tx && !tx.value) tx.value = 'Datenblatt: Modell ' + st.y + ', ' + HEIZ[st.heiz] + (st.heiz === 'gas' ? (st.alter === 'alt' ? ' (20 Jahre oder älter)' : ' (jünger als 20 Jahre)') : '') + ', ' + FLAECHE[st.fl] + '. Richtwert Eigenanteil ' + span(c.eLo, c.eHi) + ' bei ' + c.pct + ' % Zuschuss.';
    });
    var share = document.getElementById('c-share');
    share.addEventListener('click', function () {
      var st = state(); if (!st.y) return;
      var url = location.origin + location.pathname + '?baujahr=' + st.y + '&heizung=' + st.heiz + '&flaeche=' + st.fl + (st.heiz === 'gas' ? '&alter=' + st.alter : '') + '&intro=0#baujahr';
      var done = function () { share.textContent = 'Link kopiert'; setTimeout(function () { share.textContent = 'Link zum Datenblatt kopieren'; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Link zum Datenblatt:', url); });
      else window.prompt('Link zum Datenblatt:', url);
    });
    render();
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
