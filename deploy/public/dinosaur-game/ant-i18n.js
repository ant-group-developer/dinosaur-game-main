/*
 * ANT Play localisation and fitting for Dinosaur Game (Vietnamese / English).
 * - Language comes from ?lang=vi|en (default vi). The browser language is never used.
 * - The parent page can switch live: postMessage({type:'ant-play:locale', locale:'vi'|'en'}).
 * - Vietnamese text is drawn with the bundled VT323 pixel font (it has Vietnamese glyphs);
 *   the original sprite only contains "HI" and "GAME OVER".
 * - The 600x150 runner is scaled up to fill wide frames and keeps the original narrow-screen
 *   behaviour (narrower canvas, scale 1) on small screens.
 */
(function () {
  'use strict';

  var LANGS = { vi: true, en: true };
  function pick(v) { v = String(v || '').toLowerCase(); return LANGS[v] ? v : null; }
  var lang = pick(new URLSearchParams(location.search).get('lang')) || 'vi';
  document.documentElement.lang = lang;

  var TEXT = {
    vi: {
      start: 'Nhấn Space hoặc chạm để chơi',
      restart: 'Nhấn Space hoặc chạm để chơi lại',
      resume: 'Nhấn Space hoặc chạm để tiếp tục',
      gameOver: 'KẾT THÚC',
      hi: 'KỶ LỤC'
    },
    en: {
      start: 'Press Space or tap to play',
      restart: 'Press Space or tap to play again',
      resume: 'Press Space or tap to continue',
      gameOver: null,
      hi: null
    }
  };
  var FONT = '"VT323", "Courier New", monospace';
  var fontReady = document.fonts && document.fonts.load
    ? document.fonts.load('16px "VT323"', 'KẾT THÚC KỶ LỤC Nhấn để chơi lại').catch(function () {})
    : Promise.resolve();

  var listeners = [];
  function setLang(next) {
    next = pick(next);
    if (!next || next === lang) return;
    lang = next;
    document.documentElement.lang = lang;
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) { console.warn(e); } });
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || d.type !== 'ant-play:locale') return;
    if (e.source !== window.parent && e.source !== window) return;
    setLang(d.locale);
  });

  // ------------------------------------------------------------------ fitting
  var BASE_W = 600, BASE_H = 150;
  var state = { scale: 1, width: BASE_W };
  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw * 0.94 / BASE_W, vh * 0.62 / BASE_H);
    s = Math.max(1, Math.min(s, 4));
    var w = Math.min(BASE_W, Math.floor(vw / s));
    state.scale = s;
    state.width = w;
    var root = document.documentElement.style;
    root.setProperty('--dino-scale', String(s));
    root.setProperty('--dino-w', w + 'px');
    var hint = document.getElementById('ant-hint');
    if (hint) {
      hint.style.top = Math.round(vh / 2 + (BASE_H / 2) * s + Math.max(10, 8 * s)) + 'px';
      hint.style.fontSize = Math.round(Math.max(18, Math.min(34, 11 * s))) + 'px';
    }
  }
  window.addEventListener('resize', fit);

  // ------------------------------------------------------------------ hint line
  function hintText(r) {
    var t = TEXT[lang];
    if (!r) return t.start;
    if (r.crashed) return r.gameOverPanel ? t.restart : '';
    if (!r.started) return t.start;
    if (r.paused && !r.activated) return t.resume;
    return '';
  }
  function updateHint() {
    var hint = document.getElementById('ant-hint');
    if (!hint) return;
    var text = hintText(window.Runner && Runner.instance_);
    if (hint.textContent !== text) hint.textContent = text;
    hint.style.visibility = text ? 'visible' : 'hidden';
  }
  setInterval(updateHint, 150);

  function redraw() {
    var r = window.Runner && Runner.instance_;
    if (!r || !r.canvas) return;
    if (r.crashed || !r.activated) {
      r.adjustDimensions();
      if (!r.crashed && r.started && r.distanceMeter) r.distanceMeter.update(0, Math.ceil(r.distanceRan));
    }
    updateHint();
  }
  listeners.push(redraw);
  fontReady.then(redraw);

  window.antI18n = {
    get lang() { return lang; },
    text: function (k) { return TEXT[lang][k]; },
    font: FONT,
    get scale() { return state.scale; },
    fit: fit,
    setLang: setLang,
    onChange: function (fn) { listeners.push(fn); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var hint = document.createElement('div');
    hint.id = 'ant-hint';
    hint.setAttribute('aria-live', 'polite');
    document.body.appendChild(hint);
    fit();
    updateHint();
  });
  fit();
})();
