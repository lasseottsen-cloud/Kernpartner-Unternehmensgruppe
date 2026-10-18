/* Kernpartner · Website-Intro für Gruppe, Wärme und Farbe (Stand 18.10.2026)
   Baut die Ebene .kpo über die Seite, schaltet die Phasen und landet auf der echten Bühne.
   Läuft nur, wenn das Skript im <head> html.kpo-on gesetzt hat (einmal pro Besuch,
   nicht bei „Bewegung reduzieren“, nicht bei Sprunglinks). ?intro=1 spielt es erneut. */
(function () {
  'use strict';

  var html = document.documentElement;
  var body = document.body;
  var site = body.classList.contains('t-gruppe') ? 'gruppe'
    : body.classList.contains('t-waerme') ? 'waerme'
    : body.classList.contains('t-farbe') ? 'farbe' : '';

  // Baujahr aus dem Link (?baujahr=1958): Bühne und Baujahr-Check von Wärme vorbelegen
  var thisYear = new Date().getFullYear();
  var bj = (location.search.match(/[?&]baujahr=(\d{4})/) || [])[1];
  if (bj && (+bj < 1800 || +bj > thisYear)) bj = null;
  if (site === 'waerme' && bj) {
    var jahr = document.getElementById('jahr');
    if (jahr) { jahr.value = bj; jahr.dispatchEvent(new Event('input')); }
  }

  if (!site || !html.classList.contains('kpo-on')) { html.classList.remove('kpo-on', 'kpo-hell'); return; }

  var mobile = window.innerWidth <= 760;
  var W = mobile ? 390 : 1440, H = mobile ? 844 : 900;
  var S = 1, O = { x: 0, y: 0 };
  var timers = [], anims = [], hidden = [], done = false;
  var hero = document.querySelector('.hero');
  var heroTxt = hero ? Array.prototype.slice.call(hero.querySelectorAll('.txt > *')) : [];
  var heroPic = hero ? hero.querySelector('.pic') : null;
  var q = function (sel) { return hero ? hero.querySelector(sel) : null; };

  function mk(tag, cls, htmlStr) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (htmlStr) e.innerHTML = htmlStr;
    return e;
  }
  function px(v) { return v + 'px'; }
  function setVars(e, o) { for (var k in o) e.style.setProperty('--' + k, typeof o[k] === 'number' ? px(o[k]) : o[k]); }
  function rect(e) { return e.getBoundingClientRect(); }

  // ---------- Ebene ----------
  var siteCls = site === 'gruppe' ? 'gr' : site === 'waerme' ? 'wa' : 'fa';
  var base = 'kpo ' + siteCls + (mobile ? ' m' : '');
  var ov = mk('div', base);
  var stage = mk('div', 'kpo-stage');
  stage.setAttribute('aria-hidden', 'true');
  var shake = mk('div', 'kpo-shake');
  stage.appendChild(shake);
  var skip = mk('button', 'kpo-skip');
  skip.type = 'button';
  skip.textContent = 'Überspringen';

  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    S = Math.min(vw / W, vh / H);
    O = { x: (vw - W * S) / 2, y: (vh - H * S) / 2 };
    stage.style.transform = 'translate(' + px(O.x) + ',' + px(O.y) + ') scale(' + S + ')';
  }
  // Viewport-Rechteck in Bühnen-Koordinaten
  function toStage(r) { return { x: (r.left - O.x) / S, y: (r.top - O.y) / S, w: r.width / S, h: r.height / S }; }

  function hide(e) { if (e) { e.style.opacity = '0'; hidden.push(e); } }
  function rise(els, delay) {
    els.forEach(function (e, i) {
      if (!e) return;
      var a = e.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }],
        { duration: 600, delay: (delay || 0) + i * 80, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
      anims.push(a);
      a.onfinish = function () { e.style.opacity = ''; };
    });
  }
  function center(e, cx, cy, k0, ks, wFinal) {
    var w = wFinal || e.offsetWidth, h = e.offsetHeight;
    setVars(e, {
      x0: cx - w * k0 / 2, y0: cy - h * k0 / 2, k0: String(k0),
      xs: cx - w * ks / 2, ys: cy - h * ks / 2, ks: String(ks)
    });
  }
  // Text der Ebene auf den echten Text der Bühne legen (gleiche Schrift, gleiche Zeilenhöhe)
  function land(e, target, dur) {
    if (!e || !target) return;
    var r = rect(target);
    var k = parseFloat(getComputedStyle(target).fontSize) / (parseFloat(getComputedStyle(e).fontSize) * S);
    var to = 'translate(' + px((r.left - O.x) / S) + ',' + px((r.top - O.y) / S) + ') scale(' + k + ')';
    var a = e.animate([{ transform: getComputedStyle(e).transform }, { transform: to }],
      { duration: dur || 750, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    anims.push(a);
  }
  function moveBox(e, r, dur, extra) {
    var from = { left: e.style.left, top: e.style.top, width: e.style.width, height: e.style.height };
    var to = { left: px(r.left), top: px(r.top), width: px(r.width), height: px(r.height) };
    var a = e.animate([from, to], { duration: dur || 750, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    anims.push(a);
    if (extra) extra();
  }
  function placeBox(e, r) { e.style.left = px(r.left); e.style.top = px(r.top); e.style.width = px(r.width); e.style.height = px(r.height); }

  function phaseCls(n) { var c = base; for (var i = 1; i <= n; i++) c += ' p' + i; return c; }
  function run(steps, endAt) {
    steps.forEach(function (s) {
      timers.push(setTimeout(function () {
        if (done) return;
        if (s[2]) { try { s[2](); } catch (e) { /* weiter */ } }
        ov.className = phaseCls(s[1]);
      }, s[0]));
    });
    timers.push(setTimeout(function () { finish(); }, endAt));
  }

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    ov.classList.add('leave', 'gone');
    hidden.forEach(function (e) { e.style.opacity = ''; e.style.clipPath = ''; });
    setTimeout(function () {
      anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      hidden.forEach(function (e) { e.style.opacity = ''; e.style.clipPath = ''; });
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      html.classList.remove('kpo-run', 'kpo-on', 'kpo-hell');
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    }, 320);
  }
  function onKey(e) { if (e.key === 'Escape') finish(); }
  function onResize() { finish(); }

  // ---------- Gruppe: Fuge und Orte ----------
  function buildGruppe() {
    var L = 'kernpartner'.split('');
    var spans = '';
    ['t', 'b'].forEach(function (half) {
      L.forEach(function (ch, i) { spans += '<span class="ltr ' + half + ' ' + (i < 5 ? 'fly' : 'x') + ' L' + i + '">' + ch + '</span>'; });
    });
    var pts = [['E', 426.67, 118.9], ['K', 918.14, 553.97], ['P', 1407.99, 1019.25], ['N', 661.93, 1281.1], ['R', 118.9, 612.38]];
    var svg = '<svg viewBox="0 0 1527.07 1400">';
    pts.forEach(function (p) { svg += '<circle class="rip r' + p[0] + '" cx="' + p[1] + '" cy="' + p[2] + '" r="118.9"></circle>'; });
    svg += '<path class="ring" d="M426.67 118.9 L918.14 553.97 L1407.99 1019.25 L661.93 1281.1 L118.9 612.38 Z"></path>';
    pts.forEach(function (p) { svg += '<circle class="dot d' + p[0] + '" cx="' + p[1] + '" cy="' + p[2] + '" r="118.9"></circle>'; });
    svg += '<circle class="pulse u1" cx="706.73" cy="717.12" r="118.9"></circle><circle class="pulse u2" cx="706.73" cy="717.12" r="118.9"></circle><circle class="pulse u3" cx="706.73" cy="717.12" r="118.9"></circle><circle class="core" cx="706.73" cy="717.12" r="118.9"></circle></svg>';
    shake.innerHTML = '<div class="word">' + spans + '</div><div class="cut1"></div><div class="kform">' + svg + '</div>' +
      '<span class="ort oE">Eckernförde</span><span class="ort oK">Kiel</span><span class="ort oP">Plön</span><span class="ort oN">Neumünster</span><span class="ort oR">Rendsburg</span>';
    ov.appendChild(stage);
    ov.appendChild(mk('div', 'kpo-curtain'));
    heroTxt.forEach(hide);
    if (heroPic) { heroPic.style.clipPath = 'inset(0 0 0 100%)'; hidden.push(heroPic); }
  }
  function startGruppe() {
    run([[100, 1], [1000, 2], [1600, 3], [2150, 4], [2750, 5], [3200, 6], [3950, 7], [4550, 8], [5250, 9],
      [5300, 10, function () {
        rise(heroTxt, 250);
        if (heroPic) {
          var a = heroPic.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }],
            { duration: 900, delay: 350, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
          anims.push(a);
          a.onfinish = function () { heroPic.style.clipPath = ''; };
        }
      }]], 6700);
  }

  // ---------- Wärme: Modell 1964. ----------
  var DW = [0.686, 0.524, 0.659, 0.561, 0.632, 0.588, 0.570, 0.629, 0.558, 0.570];
  var waEls = {};
  function odometer(start, target) {
    var s = String(start), t = String(target), diff = start - target, out = '', shrink = 0;
    for (var i = 0; i < 4; i++) {
      var d0 = +s[i], d1 = +t[i];
      var cycles = (i === 3 && diff >= 10) ? 2 : (i === 2 && diff >= 10) ? 1 : 0;
      var steps = ((d0 - d1) % 10 + 10) % 10 + 10 * cycles;
      var seq = '';
      for (var k = 0; k <= steps; k++) seq += '<span>' + ((d0 - k + 100) % 10) + '</span>';
      var dur = i < 2 ? '.3s' : i === 2 ? '1.22s' : '1.3s', dl = i < 2 ? '.1s' : '0s';
      out += '<span class="col" style="--w0:' + DW[d0] + 'em;--w1:' + DW[d1] + 'em;--n:' + steps + ';--d:' + dur + ';--dl:' + dl + '"><span class="strip">' + seq + '</span></span>';
      shrink += DW[d0] - DW[d1];
    }
    return { html: '<span class="odo">' + out + '</span>', shrink: shrink };
  }
  function buildWaerme() {
    var target = +(bj || ((q('.h1') && (q('.h1').textContent.match(/\d{4}/) || [])[0]) || 1964));
    var start = Math.max(thisYear, target + 1);
    var od = odometer(start, target);
    var words = ['Ihr', 'Haus', 'ist', 'kein', 'Altbau.'].map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ') +
      '<br>' + ['Es', 'ist', 'ein'].map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var pre = mk('span', 'fx pre', words);
    var subh = mk('span', 'fx subh', 'Jetzt mit Wärmepumpe.');
    var str = mk('div', 'str', '<i class="l"></i><i class="f"></i><i class="b"></i>');
    var foto = mk('div', 'kpo-foto');
    var picImg = heroPic ? heroPic.querySelector('img') : null;
    foto.innerHTML = '<img alt="" src="' + (picImg ? (picImg.currentSrc || picImg.src) : '') + '"><div class="scrim"></div>';
    ov.appendChild(foto);
    ov.appendChild(stage);
    shake.appendChild(pre);
    if (mobile) {
      waEls.mw = mk('span', 'fx mw', 'Modell');
      waEls.yr = mk('span', 'fx yr', od.html + '.');
      shake.appendChild(waEls.mw); shake.appendChild(waEls.yr);
    } else {
      waEls.h1 = mk('span', 'fx h1', 'Modell ' + od.html + '.');
      shake.appendChild(waEls.h1);
    }
    shake.appendChild(subh);
    shake.appendChild(str);
    waEls.pre = pre; waEls.subh = subh; waEls.str = str; waEls.foto = foto; waEls.shrink = od.shrink;
    heroTxt.forEach(hide);
  }
  function layoutWaerme() {
    var e = waEls;
    if (mobile) {
      center(e.pre, 195, 245.6, 1.25, 1.25);
      center(e.mw, 195, 360.7, 1.391, 2.2);
      var yrW = e.yr.offsetWidth - e.shrink * 46;
      center(e.yr, 195, 455.4, 2.6, 4, yrW);
      center(e.subh, 195, 556.5, 1.12, 2.1);
    } else {
      center(e.pre, 720, 215, 1.6, 1.6);
      center(e.h1, 720, 395, 2.2, 3.4, e.h1.offsetWidth - e.shrink * 88);
      center(e.subh, 720, 555, 1.5, 2.8);
    }
    var sy = mobile ? 596 : 635;
    e.str.style.left = px(-O.x / S); e.str.style.width = px(window.innerWidth / S); e.str.style.top = px(sy);
  }
  function startWaerme() {
    run([[100, 1], [1500, 2], [1800, 3], [3100, 4], [3450, 5], [3700, 6],
      [4200, 7, function () {
        if (heroPic) moveBox(waEls.foto, rect(heroPic), 750);
        if (mobile) {
          rise([q('.pre'), q('.h1'), q('.subh'), q('.lead'), q('form')], 150);
        } else {
          land(waEls.pre, q('.pre'));
          land(waEls.h1, q('.h1'));
          land(waEls.subh, q('.subh'));
          rise([q('.lead'), q('form')], 250);
        }
      }]], 5300);
  }
  function placeWaerme() {
    placeBox(waEls.foto, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
  }

  // ---------- Farbe: Modellreihe ----------
  var faEls = {};
  var HOUSES = {
    li1: '<g class="hs li"><g transform="translate(-48 700)"><path d="M0 0 V-110 H300 V0"></path><path d="M-18 -110 L70 -178 H230 L318 -110 Z"></path><rect x="200" y="-200" width="18" height="40"></rect><rect x="24" y="-82" width="96" height="42"></rect><path class="fein" d="M72 -82 V-40"></path><rect x="188" y="-82" width="88" height="42"></rect><path class="fein" d="M232 -82 V-40"></path><rect x="138" y="-90" width="34" height="90"></rect></g></g>',
    li2: '<g class="hs li"><g transform="translate(322 700)"><path d="M0 0 V-118 H200 V0"></path><path d="M-14 -118 L42 -228 H158 L214 -118 Z"></path><rect x="138" y="-248" width="16" height="30"></rect><rect x="78" y="-200" width="44" height="34"></rect><path d="M72 -200 L100 -218 L128 -200"></path><rect x="22" y="-92" width="42" height="44"></rect><path class="fein" d="M43 -92 V-48 M22 -70 H64"></path><rect x="136" y="-92" width="42" height="44"></rect><path class="fein" d="M157 -92 V-48 M136 -70 H178"></path><rect x="84" y="-86" width="32" height="86"></rect></g></g>',
    h31: '<g class="h31"><path d="M120 603 V80 H560 V603"></path><path d="M100 80 L158 27 H404 L586 80 Z"></path><rect x="166" y="-2" width="48" height="31"></rect><rect x="378" y="-8" width="24" height="24"></rect><rect x="313" y="6" width="70" height="52"></rect><path d="M305 8 L348 -12 L391 8"></path><path class="fein" d="M96 603 H586"></path><rect x="200" y="120" width="103" height="73"></rect><path class="fein" d="M251 120 V193 M200 146 H303"></path><rect x="192" y="193" width="119" height="10"></rect><rect x="400" y="120" width="80" height="73"></rect><path class="fein" d="M440 120 V193 M400 146 H480"></path><rect x="392" y="193" width="96" height="10"></rect><rect x="157" y="263" width="80" height="100"></rect><path class="fein" d="M197 263 V363 M157 297 H237"></path><rect x="267" y="263" width="80" height="100"></rect><path class="fein" d="M307 263 V363 M267 297 H347"></path><rect x="400" y="263" width="80" height="100"></rect><path class="fein" d="M440 263 V363 M400 297 H480"></path><path class="fein" d="M151 365 H243 M261 365 H353 M394 365 H486"></path><rect x="157" y="437" width="80" height="110"></rect><path class="fein" d="M197 437 V547 M157 474 H237"></path><rect x="267" y="437" width="80" height="110"></rect><path class="fein" d="M307 437 V547 M267 474 H347"></path><rect x="380" y="417" width="123" height="186"></rect><rect class="tuer" x="403" y="440" width="76" height="163"></rect><rect x="403" y="440" width="76" height="163"></rect></g>',
    re1: '<g class="hs re"><g transform="translate(918 700)"><path d="M0 0 V-150 H280 V0"></path><path d="M-16 -150 L140 -292 L296 -150 Z"></path><path class="fein" d="M140 0 V-150"></path><rect x="110" y="-236" width="22" height="34"></rect><rect x="148" y="-236" width="22" height="34"></rect><rect x="28" y="-132" width="44" height="40"></rect><rect x="208" y="-132" width="44" height="40"></rect><rect x="28" y="-72" width="44" height="44"></rect><rect x="208" y="-72" width="44" height="44"></rect><rect x="96" y="-92" width="30" height="92"></rect><rect x="154" y="-92" width="30" height="92"></rect></g></g>',
    re2: '<g class="hs re"><g transform="translate(1268 700)"><path d="M0 0 V-260 H230 V0"></path><path d="M-14 -260 L40 -350 H190 L244 -260 Z"></path><path d="M120 -260 L175 -340 L230 -260"></path><rect x="24" y="-236" width="34" height="74"></rect><rect x="80" y="-236" width="34" height="74"></rect><rect x="150" y="-246" width="48" height="84"></rect><rect x="24" y="-118" width="34" height="74"></rect><rect x="80" y="-118" width="34" height="74"></rect><rect x="160" y="-120" width="40" height="120"></rect></g></g>'
  };
  function buildFarbe() {
    var labels = '<text class="lbl" x="102" y="756">Modell 1974</text><text class="lbl" x="422" y="756">Modell 1958</text><text class="lbl lc" x="720" y="756">Modell 1931</text><text class="lbl" x="1058" y="756">Modell 1927</text><text class="lbl" x="1383" y="756">Modell 1905</text>';
    var frame = mk('div', 'kpo-frame');
    var picImg = heroPic ? heroPic.querySelector('img') : null;
    frame.innerHTML = '<img alt="" src="' + (picImg ? (picImg.currentSrc || picImg.src) : '') + '">' +
      '<i class="pr lr pr1"></i><i class="pr rl pr2"></i><i class="pr lr pr3"></i><i class="pr rl pr4"></i><i class="pr lr pr5"></i>';
    var str = mk('div', 'strasse', '<i class="l"></i><i class="f"></i><i class="b"></i>');
    var reihe = mk('div', 'reihe', '<svg viewBox="0 0 1440 900">' + HOUSES.li1 + HOUSES.li2 + HOUSES.h31 + HOUSES.re1 + HOUSES.re2 + labels + '</svg>');
    var h1 = mk('span', 'fx h1', 'Modell 1931.');
    ov.appendChild(frame);
    ov.appendChild(stage);
    shake.appendChild(str); shake.appendChild(reihe); shake.appendChild(h1);
    faEls = { frame: frame, str: str, reihe: reihe, h1: h1, h31: reihe.querySelector('.h31'), img: frame.querySelector('img') };
    heroTxt.forEach(hide);
  }
  // Rahmen F (Viewport) und Bildausschnitt: daraus die Lage der Zeichnung in der Reihe-Grafik
  function aimFarbe(F, posX, posY) {
    placeBox(faEls.frame, F);
    faEls.img.style.objectPosition = (posX * 100) + '% ' + (posY * 100) + '%';
    var s = Math.max(F.width / 928, F.height / 1152);
    var ox = (928 * s - F.width) * posX, oy = (1152 * s - F.height) * posY;
    var k = s / 0.7759;
    var tx = (F.left - ox - O.x) / S, ty = (F.top + 64 * k - oy - O.y) / S, ks = k / S;
    var w = mobile ? { x: -251.4, y: 126, k: 0.62 } : { x: 0, y: 0, k: 1 };
    setVars(faEls.h31, { hx: (tx - w.x) / w.k, hy: (ty - w.y) / w.k, hk: String(ks / w.k) });
  }
  function layoutFarbe() {
    if (mobile) center(faEls.h1, 195, 120, 1.25, 2.2);
    else center(faEls.h1, 720, 150, 1.25, 2.4);
    faEls.str.style.left = px(-O.x / S); faEls.str.style.width = px(window.innerWidth / S);
    var F;
    if (mobile) F = { left: O.x, top: O.y + 176 * S, width: 390 * S, height: 668 * S };
    else F = heroPic ? rect(heroPic) : { left: 0, top: 0, width: 0, height: 0 };
    aimFarbe(F, mobile ? 0.398 : 0.5, mobile ? 0 : 0.45);
  }
  function startFarbe() {
    var subhIn = function () {
      var e = q('.subh'); if (!e) return;
      e.style.opacity = '';
      var a = e.animate([{ clipPath: 'inset(-10px 100% -20px 0)' }, { clipPath: 'inset(-10px -10px -20px -10px)' }],
        { duration: 550, delay: 100, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' });
      anims.push(a);
    };
    var steps = [[100, 1], [350, 2], [1650, 3]];
    if (mobile) {
      steps.push([2250, 4], [3150, 5], [3550, 6], [4950, 7, function () {
        if (heroPic) {
          var r = rect(heroPic);
          moveBox(faEls.frame, r, 750);
          var a = faEls.img.animate([{ objectPosition: faEls.img.style.objectPosition }, { objectPosition: '50% 45%' }],
            { duration: 750, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
          anims.push(a);
        }
        land(faEls.h1, q('.h1'));
        rise([q('.pre'), q('.subh'), q('.lead'), q('.btns'), q('.trust')], 150);
      }]);
      run(steps, 6100);
    } else {
      steps.push([2250, 4, function () {
        if (heroPic) aimFarbe(rect(heroPic), 0.5, 0.45);
        land(faEls.h1, q('.h1'), 850);
      }], [3150, 5, subhIn], [3550, 6], [4700, 7, function () {
        rise([q('.pre'), q('.lead'), q('.btns'), q('.trust')], 0);
      }]);
      run(steps, 5700);
    }
  }

  // ---------- Start ----------
  try {
    window.scrollTo(0, 0);
    ov.appendChild(skip);
    if (site === 'gruppe') buildGruppe();
    else if (site === 'waerme') buildWaerme();
    else buildFarbe();
    // Überspringen-Knopf zuletzt, damit er über allem liegt
    ov.appendChild(skip);
    body.appendChild(ov);
    html.classList.add('kpo-run');
    html.classList.remove('kpo-on');
    fit();
    if (site === 'waerme') placeWaerme();
    try { sessionStorage.setItem('kp-intro-' + site, '1'); } catch (e) {}
    skip.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);

    var started = false;
    var go = function () {
      if (started || done) return;
      started = true;
      try {
        fit();
        if (site === 'waerme') layoutWaerme();
        if (site === 'farbe') layoutFarbe();
        window.addEventListener('resize', onResize);
        if (site === 'gruppe') startGruppe();
        else if (site === 'waerme') startWaerme();
        else startFarbe();
      } catch (e) { finish(); }
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load("700 88px 'Kernschrift Fuge'"),
        document.fonts.load("400 30px 'Kernschrift Fuge'")
      ]).then(go, go);
    }
    setTimeout(go, 1500);
  } catch (e) {
    finish();
  }
})();
