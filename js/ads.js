// Race Cities — camada de anúncios (independente de provedor).
// Uso: import { ads } from './ads.js';  ads.init();  await ads.interstitial('race_end');
// Tudo é à prova de falhas: SDK bloqueado, sem internet ou erro => resolve sem anúncio, nunca trava o jogo.
// Guia: docs/ANUNCIOS.md
import { ADS_CONFIG } from './ads-config.js';

const STORE_KEY = 'marileo_ads';
const NOADS_KEY = 'marileo_noads';
const NO_FALLBACK = ['frequency-capped'];

// ---------- utilidades ----------
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function deepMerge(base, patch) {
  for (const k of Object.keys(patch || {})) {
    if (isObj(patch[k]) && isObj(base[k])) deepMerge(base[k], patch[k]);
    else base[k] = patch[k];
  }
  return base;
}
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
// resolve com `fallback` se a promessa demorar mais que ms (ou falhar)
function within(promise, ms, fallback) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(fallback), ms);
    Promise.resolve(promise).then(v => { clearTimeout(t); resolve(v); }, () => { clearTimeout(t); resolve(fallback); });
  });
}
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
function dayStr(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function loadScript(src, attrs = {}, timeoutMs = 5000) {
  return new Promise(resolve => {
    let done = false;
    const s = document.createElement('script');
    const end = ok => { if (done) return; done = true; clearTimeout(t); if (!ok) s.remove(); resolve(ok); };
    const t = setTimeout(() => end(false), timeoutMs);
    s.async = true; s.src = src;
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.onload = () => end(true);
    s.onerror = () => end(false);
    try { document.head.appendChild(s); } catch (e) { end(false); }
  });
}

// Executa um anúncio baseado em callbacks, com vigilância:
//  - precisa começar (api.started()) em startMs, senão resolve {shown:false, reason:'timeout'}
//  - depois de começar, no máximo maxMs.
function watched(cfg, setup) {
  return new Promise(resolve => {
    let done = false, started = false, t1 = 0, t2 = 0;
    const api = {
      get started() { return started; },
      get done() { return done; },
      start() { started = true; clearTimeout(t1); },
      finish(r) { if (done) return; done = true; clearTimeout(t1); clearTimeout(t2); resolve(r); },
    };
    t1 = setTimeout(() => { if (!started) api.finish({ shown: false, reason: 'timeout' }); }, cfg.startTimeoutMs);
    t2 = setTimeout(() => api.finish({ shown: started, reason: 'max-time' }), cfg.maxAdMs);
    try { setup(api); } catch (e) { api.finish({ shown: false, reason: 'error' }); }
  });
}

// ---------- provedor: house (anúncios próprios) ----------
const house = {
  name: 'house',
  _overlay: null,
  _last: null,
  available(cfg, core) { return core.activeCampaigns().length > 0; },
  async load() { return true; },
  closeNow() { if (this._overlay) this._overlay.close(false); },
  interstitial(placement, ctx) { return this._show('interstitial', placement, ctx); },
  rewarded(placement, ctx) { return this._show('rewarded', placement, ctx); },
  _pick(core) {
    let list = core.activeCampaigns();
    if (list.length > 1 && this._last) list = list.filter(c => c.id !== this._last);
    const total = list.reduce((a, c) => a + (c.weight > 0 ? c.weight : 1), 0);
    let r = Math.random() * total;
    for (const c of list) { r -= (c.weight > 0 ? c.weight : 1); if (r <= 0) return c; }
    return list[list.length - 1];
  },
  _show(kind, placement, ctx) {
    const core = ctx.core, cfg = ctx.cfg.house;
    const camp = this._pick(core);
    if (!camp) return Promise.resolve({ shown: false, reason: 'no-campaign' });
    this._last = camp.id;
    return new Promise(resolve => {
      const rewarded = kind === 'rewarded';
      const link = safeUrl(camp.url);
      const root = document.createElement('div');
      root.className = 'mk-ad';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Anúncio');
      const card = div('mk-ad__card');
      card.appendChild(span('mk-ad__tag', cfg.sponsorLabel + (rewarded ? ' • Assista e ganhe' : '')));

      let hasImg = false;
      const body = div('mk-ad__body');
      if (camp.image) {
        const media = div('mk-ad__media');
        const img = document.createElement('img');
        img.alt = camp.title || '';
        img.referrerPolicy = 'no-referrer';
        img.draggable = false;
        img.onerror = () => { media.remove(); card.classList.remove('mk-ad--img'); };
        img.src = camp.image;
        media.appendChild(img);
        body.appendChild(media);
        card.classList.add('mk-ad--img');
        hasImg = true;
        if (link) { media.classList.add('mk-ad__tap'); media.addEventListener('click', () => openGate()); }
      }
      const txt = div('mk-ad__text');
      if (camp.title) txt.appendChild(el('h2', 'mk-ad__title', camp.title));
      if (camp.text) txt.appendChild(el('p', 'mk-ad__desc', camp.text));
      let linkBtn = null;
      if (link) {
        linkBtn = el('button', 'mk-ad__link', '🔗 ' + (camp.linkLabel || 'Saiba mais'));
        linkBtn.type = 'button';
        linkBtn.addEventListener('click', () => openGate());
        txt.appendChild(linkBtn);
      }
      body.appendChild(txt);
      card.appendChild(body);

      const bar = div('mk-ad__bar');
      let cancelBtn = null;
      if (rewarded) {
        cancelBtn = el('button', 'mk-ad__cancel', 'Cancelar');
        cancelBtn.type = 'button';
        bar.appendChild(cancelBtn);
      }
      const go = el('button', 'mk-ad__go', '');
      go.type = 'button'; go.disabled = true;
      bar.appendChild(go);
      card.appendChild(bar);
      root.appendChild(card);

      // portão dos pais
      const gate = div('mk-ad__gate'); gate.hidden = true;
      const gp = div('mk-ad__gatebox');
      gp.appendChild(el('div', 'mk-ad__gateicon', '🔒'));
      gp.appendChild(el('h3', '', 'Área para adultos'));
      gp.appendChild(el('p', '', 'Abrir site do patrocinador?'));
      const host = el('p', 'mk-ad__host', link ? link.hostname : '');
      gp.appendChild(host);
      const hold = el('button', 'mk-ad__hold', 'Segure por ' + Math.round(cfg.gateHoldMs / 1000) + ' segundos');
      hold.type = 'button';
      gp.appendChild(hold);
      const gcancel = el('button', 'mk-ad__gatecancel', 'Cancelar');
      gcancel.type = 'button';
      gp.appendChild(gcancel);
      gate.appendChild(gp);
      root.appendChild(gate);

      // estado
      let remaining = Math.max(0, cfg.countdown | 0);
      let closed = false, gateOpen = false, holding = false, holdStart = 0, raf = 0, gpRaf = 0, padWas = false;
      const label = () => {
        if (remaining > 0) { go.textContent = `${rewarded ? 'Receber recompensa' : 'Continuar'} em ${remaining}`; go.disabled = true; }
        else { go.textContent = rewarded ? 'Receber recompensa ▶' : 'Continuar ▶'; go.disabled = false; go.classList.add('ready'); }
      };
      label();
      const interval = setInterval(() => {
        if (document.hidden) return;
        if (remaining > 0) { remaining--; label(); if (remaining === 0) { try { go.focus({ preventScroll: true }); } catch (e) { /* */ } } }
      }, 1000);
      const maxT = setTimeout(() => close(false), cfg.maxMs);

      function openGate() { if (!link || closed) return; gateOpen = true; gate.hidden = false; try { hold.focus({ preventScroll: true }); } catch (e) { /* */ } }
      function closeGate() { gateOpen = false; gate.hidden = true; stopHold(); }
      function setP(p) { hold.style.setProperty('--p', String(p)); }
      function startHold() {
        if (holding) return;
        holding = true; holdStart = performance.now(); hold.classList.add('holding');
        const tick = () => {
          if (!holding) return;
          const p = Math.min(1, (performance.now() - holdStart) / cfg.gateHoldMs);
          setP(p);
          if (p >= 1) { holding = false; hold.classList.remove('holding'); complete(); } else raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
      function stopHold() { holding = false; cancelAnimationFrame(raf); hold.classList.remove('holding'); setP(0); }
      function complete() {
        closeGate();
        core.count(`campaign.${camp.id}.click`);
        core.count(`click.${placement}.house`);
        try {
          if (typeof core.onOpenUrl === 'function') core.onOpenUrl(link.href);
          else window.open(link.href, '_blank', 'noopener,noreferrer');
        } catch (e) { /* ignore */ }
      }
      hold.addEventListener('pointerdown', e => { e.preventDefault(); try { hold.setPointerCapture(e.pointerId); } catch (x) { /* */ } startHold(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => hold.addEventListener(t, stopHold));
      hold.addEventListener('contextmenu', e => e.preventDefault());
      hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
      hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stopHold(); });
      hold.addEventListener('blur', stopHold);
      gcancel.addEventListener('click', closeGate);

      go.addEventListener('click', () => { if (remaining <= 0) close(true); });
      if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));

      // teclado: o jogo não pode receber teclas enquanto o anúncio está aberto
      const onKey = e => {
        if (/^F\d+$/.test(e.key)) return;
        e.stopImmediatePropagation();
        if (gateOpen) {
          if (e.key === 'Escape') { e.preventDefault(); closeGate(); }
          else if (e.key === 'Tab') { /* mantém o foco dentro */ }
          return;
        }
        if (e.key === 'Escape' && rewarded) { e.preventDefault(); close(false); return; }
        if ((e.key === 'Enter' || e.key === ' ') && remaining <= 0 && document.activeElement !== linkBtn) { e.preventDefault(); close(true); }
        else if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
      };
      window.addEventListener('keydown', onKey, true);
      // controle (gamepad): botão A continua
      const pollPad = () => {
        if (closed) return;
        let down = false;
        try { for (const p of (navigator.getGamepads ? navigator.getGamepads() : [])) if (p && p.buttons[0] && p.buttons[0].pressed) down = true; } catch (e) { /* */ }
        if (down && !padWas && remaining <= 0 && !gateOpen) close(true);
        padWas = down;
        gpRaf = requestAnimationFrame(pollPad);
      };
      gpRaf = requestAnimationFrame(pollPad);

      function close(ok) {
        if (closed) return;
        closed = true;
        clearInterval(interval); clearTimeout(maxT);
        cancelAnimationFrame(raf); cancelAnimationFrame(gpRaf);
        window.removeEventListener('keydown', onKey, true);
        root.remove();
        house._overlay = null;
        resolve(rewarded
          ? { shown: true, rewarded: !!ok, reason: ok ? 'rewarded' : 'cancelled', campaign: camp.id }
          : { shown: true, reason: ok ? 'closed' : 'auto-closed', campaign: camp.id });
      }
      house._overlay = { close };

      document.body.appendChild(root);
      ctx.pause();
      core.count(`campaign.${camp.id}.shown`);
      void hasImg;
    });
  },
};

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
function div(cls) { return el('div', cls); }
function span(cls, text) { return el('span', cls, text); }
function safeUrl(u) {
  if (!u) return null;
  try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x : null; } catch (e) { return null; }
}

// ---------- provedor: h5 (Google AdSense para jogos H5) ----------
const h5 = {
  name: 'h5',
  _ok: false,
  available(cfg) { const c = cfg.h5 && cfg.h5.client; return !!c && !/X{6,}/i.test(c); },
  load(cfg) {
    if (this._ok) return Promise.resolve(true);
    const c = cfg.h5;
    // stubs oficiais: chamadas feitas antes do script carregar ficam na fila
    window.adsbygoogle = window.adsbygoogle || [];
    if (!window.adBreak) window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    if (c.nonPersonalized) window.adsbygoogle.requestNonPersonalizedAds = 1;
    const attrs = { crossorigin: 'anonymous', 'data-ad-client': c.client };
    if (cfg.test) attrs['data-adbreak-test'] = 'on';
    if (c.childDirected) {
      attrs['data-tag-for-child-directed-treatment'] = '1';
      attrs['data-tag-for-age-treatment'] = '1'; // nome novo; o Google avisa que os antigos estão obsoletos
    }
    if (c.underAgeOfConsent) attrs['data-tag-for-under-age-of-consent'] = '1';
    if (c.frequencyHint) attrs['data-ad-frequency-hint'] = c.frequencyHint;
    const src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(c.client);
    return loadScript(src, attrs, cfg.loadTimeoutMs).then(ok => {
      if (ok) { try { window.adConfig({ preloadAdBreaks: 'on', sound: 'on' }); } catch (e) { /* */ } }
      this._ok = ok; return ok;
    });
  },
  _run(kind, placement, ctx) {
    const reward = kind === 'rewarded';
    try { window.adConfig({ sound: ctx.core.soundOn() ? 'on' : 'off' }); } catch (e) { /* */ }
    return watched(ctx.cfg, api => {
      const opts = {
        type: reward ? 'reward' : 'next',
        name: placement,
        beforeAd() { api.start(); ctx.pause(); },
        afterAd() { ctx.resume(); },
        adBreakDone(info) {
          const st = info && info.breakStatus;
          if (reward) api.finish({ shown: api.started, rewarded: st === 'viewed', reason: st || 'done' });
          else api.finish({ shown: api.started || st === 'viewed', reason: mapStatus(st) });
        },
      };
      if (reward) {
        let granted = false;
        opts.beforeReward = showAdFn => { api.start(); try { showAdFn(); } catch (e) { api.finish({ shown: false, rewarded: false, reason: 'error' }); } };
        opts.adViewed = () => { granted = true; };
        opts.adDismissed = () => { granted = false; };
        const done = opts.adBreakDone;
        opts.adBreakDone = info => { if (granted) { api.finish({ shown: true, rewarded: true, reason: 'viewed' }); } else done(info); };
      }
      window.adBreak(opts);
    });
  },
  interstitial(p, ctx) { return this._run('interstitial', p, ctx); },
  rewarded(p, ctx) { return this._run('rewarded', p, ctx); },
};
function mapStatus(st) {
  if (st === 'frequencyCapped') return 'frequency-capped';
  return st || 'no-ad';
}

// ---------- provedor: CrazyGames SDK v3 ----------
const crazygames = {
  name: 'crazygames',
  _ok: false,
  available() { return true; },
  async load(cfg) {
    if (this._ok) return true;
    const ok = await loadScript(cfg.crazygames.scriptUrl, {}, cfg.loadTimeoutMs);
    if (!ok || !window.CrazyGames || !window.CrazyGames.SDK) return false;
    try { await window.CrazyGames.SDK.init(); } catch (e) { return false; }
    this._ok = true; return true;
  },
  _run(type, ctx) {
    const reward = type === 'rewarded';
    return watched(ctx.cfg, api => {
      window.CrazyGames.SDK.ad.requestAd(type, {
        adStarted() { api.start(); ctx.pause(); },
        adFinished() { ctx.resume(); api.finish(reward ? { shown: true, rewarded: true, reason: 'finished' } : { shown: true, reason: 'finished' }); },
        adError(err) { ctx.resume(); api.finish(reward ? { shown: false, rewarded: false, reason: 'error' } : { shown: false, reason: 'error' }); void err; },
      });
    });
  },
  interstitial(p, ctx) { return this._run('midgame', ctx); },
  rewarded(p, ctx) { return this._run('rewarded', ctx); },
  gameplay(on) { const g = window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game; if (g) (on ? g.gameplayStart() : g.gameplayStop()); },
};

// ---------- provedor: Poki ----------
const poki = {
  name: 'poki',
  _ok: false,
  available() { return true; },
  async load(cfg) {
    if (this._ok) return true;
    const ok = await loadScript(cfg.poki.scriptUrl, {}, cfg.loadTimeoutMs);
    if (!ok || !window.PokiSDK) return false;
    try { await window.PokiSDK.init(); } catch (e) { return false; }
    try { window.PokiSDK.gameLoadingFinished(); } catch (e) { /* */ }
    this._ok = true; return true;
  },
  interstitial(p, ctx) {
    return watched(ctx.cfg, api => {
      let begun = false;
      window.PokiSDK.commercialBreak(() => { begun = true; api.start(); ctx.pause(); })
        .then(() => { ctx.resume(); api.finish({ shown: begun, reason: begun ? 'finished' : 'no-ad' }); },
          () => { ctx.resume(); api.finish({ shown: begun, reason: 'error' }); });
    });
  },
  rewarded(p, ctx) {
    return watched(ctx.cfg, api => {
      window.PokiSDK.rewardedBreak(() => { api.start(); ctx.pause(); })
        .then(ok => { ctx.resume(); api.finish({ shown: !!ok, rewarded: !!ok, reason: ok ? 'viewed' : 'no-ad' }); },
          () => { ctx.resume(); api.finish({ shown: false, rewarded: false, reason: 'error' }); });
    });
  },
  gameplay(on) { if (window.PokiSDK) (on ? window.PokiSDK.gameplayStart() : window.PokiSDK.gameplayStop()); },
};

// ---------- provedor: native (apps Android/iOS) ----------
const nativeBridge = {
  name: 'native',
  available() { return hasNative(); },
  // Avisa o app uma única vez (ads.init ou primeiro anúncio) para iniciar o SDK e pré-carregar.
  // Sem isso o app nem inicia o SDK do Google (anúncios desligados = nenhum contato com o Google).
  async load(cfg) {
    try {
      const A = window.AndroidApp;
      const test = !!(cfg && cfg.test);
      if (A && A.prepareAds) A.prepareAds(JSON.stringify({ test }));
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ads) {
        window.webkit.messageHandlers.ads.postMessage({ action: 'prepare', test });
      }
    } catch (e) { /* o app antigo não tem prepare: segue */ }
    return true;
  },
  _call(kind, placement, ctx) {
    const cfg = ctx.cfg, n = cfg.native;
    return new Promise(resolve => {
      let done = false, started = false, t1 = 0, t2 = 0;
      const finish = r => {
        if (done) return; done = true; clearTimeout(t1); clearTimeout(t2);
        if (window.__adDone === onDone) window.__adDone = undefined;
        if (window.__adStarted === onStart) window.__adStarted = undefined;
        resolve(r);
      };
      const onStart = () => { started = true; clearTimeout(t1); ctx.pause(); };
      const onDone = raw => finish(normalizeNative(raw, kind));
      window.__adStarted = onStart;
      window.__adDone = onDone;
      t1 = setTimeout(() => finish(kind === 'rewarded' ? { shown: false, rewarded: false, reason: 'timeout' } : { shown: false, reason: 'timeout' }), n.startTimeoutMs);
      t2 = setTimeout(() => finish({ shown: started, rewarded: false, reason: 'max-time' }), n.timeoutMs);
      try {
        const A = window.AndroidApp;
        const msg = { action: kind, placement, test: !!cfg.test, childDirected: true };
        if (A && (kind === 'rewarded' ? A.showRewarded : A.showInterstitial)) {
          if (kind === 'rewarded') A.showRewarded(placement); else A.showInterstitial(placement);
        } else {
          window.webkit.messageHandlers.ads.postMessage(msg);
        }
      } catch (e) { finish({ shown: false, rewarded: false, reason: 'error' }); }
    });
  },
  interstitial(p, ctx) { return this._call('interstitial', p, ctx); },
  rewarded(p, ctx) { return this._call('rewarded', p, ctx); },
};
function hasNative() {
  try {
    return !!((window.AndroidApp && window.AndroidApp.showInterstitial) ||
      (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ads));
  } catch (e) { return false; }
}
function normalizeNative(raw, kind) {
  let r = raw;
  if (typeof r === 'string') { try { r = JSON.parse(r); } catch (e) { /* string simples */ } }
  let shown, rewarded, reason = 'native';
  if (r === true || r === 'true' || r === 'shown' || r === 'rewarded' || r === 'ok') shown = rewarded = true;
  else if (isObj(r)) {
    // o anúncio com recompensa pode ter aparecido e sido fechado antes do fim:
    // shown:true + rewarded:false (não cai para o cartão próprio, e não dá prêmio)
    shown = !!(r.shown ?? r.rewarded);
    rewarded = !!(r.rewarded ?? r.shown);
    reason = r.reason || reason;
  } else shown = rewarded = false;
  return kind === 'rewarded' ? { shown, rewarded: shown && rewarded, reason } : { shown, reason };
}

const PROVIDERS = { house, h5, crazygames, poki, native: nativeBridge };

// ---------- núcleo ----------
class Ads {
  constructor() {
    this.config = clone(ADS_CONFIG);
    this.onPause = null;
    this.onResume = null;
    this.onOpenUrl = null;   // opcional: (url) => abrir no navegador do sistema
    this.isSoundOn = null;   // opcional: () => bool (para o AdSense)
    this.nowFn = () => new Date();
    this._calls = 0; this._shownCount = 0; this._lastAt = 0;
    this._busy = false; this._paused = false;
    this._session = {};
    this._loads = new Map();
    this._gp = false;
    this._inited = false;
    this._ready = Promise.resolve();
  }

  get showing() { return this._paused; }
  get platform() { return this._detectPlatform(); }

  configure(patch) { deepMerge(this.config, patch || {}); return this; }

  reset() { this._calls = 0; this._shownCount = 0; this._lastAt = 0; this._session = {}; }

  init(overrides) {
    try {
      if (overrides) this.configure(overrides);
      if (!this.config.enabled) return Promise.resolve(false);
      this._inited = true;
      const names = this._chain();
      // só carrega SDKs externos agora (pré-carregamento); house/native não precisam
      // native: só avisa o app (prepareAds), não espera nada
      if (names.includes('native') && hasNative()) this._load('native').catch(() => false);
      this._ready = Promise.all(names.filter(n => n !== 'house' && n !== 'native').map(n => this._load(n).catch(() => false))).then(() => true).catch(() => false);
      return within(this._ready, this.config.loadTimeoutMs + 500, false);
    } catch (e) { return Promise.resolve(false); }
  }

  _detectPlatform() {
    const c = this.config;
    if (c.platform && c.platform !== 'auto') return c.platform;
    try {
      if (hasNative()) return 'native';
      const h = (location.hostname || '').toLowerCase();
      const ref = (document.referrer || '').toLowerCase();
      if (/(^|\.)crazygames\.com$/.test(h) || ref.includes('crazygames.com')) return 'crazygames';
      if (/(^|\.)poki(-gdn)?\.com$/.test(h) || ref.includes('poki.com')) return 'poki';
    } catch (e) { /* */ }
    return 'web';
  }
  _chain() {
    const l = this.config.providers[this._detectPlatform()] || this.config.providers.web || ['house'];
    return l.filter(n => PROVIDERS[n]);
  }

  activeCampaigns() {
    const today = dayStr(this.nowFn());
    const ok = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
    return (this.config.houseCampaigns || []).filter(c => {
      if (!c || c.enabled === false || !c.id) return false;
      if (!c.title && !c.image) return false;
      if (c.start != null && c.start !== '') { if (!ok(c.start) || today < c.start) return false; }
      if (c.end != null && c.end !== '') { if (!ok(c.end) || today > c.end) return false; }
      return true;
    });
  }

  soundOn() { try { return this.isSoundOn ? !!this.isSoundOn() : true; } catch (e) { return true; } }
  removeAds() { return lsGet(NOADS_KEY) === '1'; }

  _load(name) {
    const p = PROVIDERS[name];
    const cur = this._loads.get(name);
    if (cur && (!cur.failedAt || Date.now() - cur.failedAt < 60000)) return cur.promise;
    const entry = { failedAt: 0 };
    entry.promise = within(p.load(this.config), this.config.loadTimeoutMs + 500, false).then(ok => { if (!ok) entry.failedAt = Date.now(); return ok; });
    this._loads.set(name, entry);
    return entry.promise;
  }

  // ---------- estatísticas ----------
  count(key) {
    this._session[key] = (this._session[key] || 0) + 1;
    try {
      const raw = lsGet(STORE_KEY);
      let db = raw ? JSON.parse(raw) : null;
      if (!isObj(db) || !isObj(db.days)) db = { v: 1, days: {} };
      const d = dayStr(this.nowFn());
      const day = db.days[d] || (db.days[d] = {});
      day[key] = (day[key] || 0) + 1;
      const keys = Object.keys(db.days).sort();
      while (keys.length > 45) delete db.days[keys.shift()];
      lsSet(STORE_KEY, JSON.stringify(db));
    } catch (e) { /* ignore */ }
  }
  stats() {
    let days = {};
    try { const db = JSON.parse(lsGet(STORE_KEY) || 'null'); if (db && isObj(db.days)) days = db.days; } catch (e) { /* */ }
    const today = days[dayStr(this.nowFn())] || {};
    const sum = o => Object.keys(o).filter(k => /^(interstitial|rewarded)\./.test(k)).reduce((a, k) => a + o[k], 0);
    return { session: { ...this._session }, sessionShown: sum(this._session), today: { ...today }, todayShown: sum(today), days: clone(days) };
  }

  // ---------- regras ----------
  _blocked(kind, opts) {
    const c = this.config;
    if (!c.enabled) return 'disabled';
    if (kind === 'rewarded') {
      if (!c.rewardedEnabled) return 'rewarded-off';
      if (this._busy) return 'busy';
      return null;
    }
    this._calls++;
    if (this.removeAds()) return 'no-ads';
    if (this._busy) return 'busy';
    if (c.skipOnline && opts && opts.online) return 'online';
    if (c.skipFirstRace && this._calls === 1) return 'first-race';
    if (c.maxPerSession > 0 && this._shownCount >= c.maxPerSession) return 'session-cap';
    if (this._lastAt && (Date.now() - this._lastAt) < c.minSecondsBetween * 1000) return 'too-soon';
    return null;
  }

  _callHook(name) { try { if (typeof this[name] === 'function') this[name](); } catch (e) { /* o jogo não pode quebrar por causa do anúncio */ } }

  async _run(kind, placement, opts) {
    const blocked = this._blocked(kind, opts);
    if (blocked) { this.count(`blocked.${blocked}`); return kind === 'rewarded' ? { rewarded: false, shown: false, provider: null, reason: blocked } : { shown: false, provider: null, reason: blocked }; }
    this._busy = true;
    const ctx = {
      cfg: this.config, core: this,
      pause: () => { if (!this._paused) { this._paused = true; this._callHook('onPause'); } },
      resume: () => { if (this._paused) { this._paused = false; this._callHook('onResume'); } },
    };
    const c = this.config;
    const hard = Math.max(c.maxAdMs, c.house.maxMs, c.native.timeoutMs) + c.loadTimeoutMs * 2 + 5000;
    let out = null;
    const work = (async () => {
      let last = { shown: false, provider: null, reason: 'no-provider' };
      for (const name of this._chain()) {
        const p = PROVIDERS[name];
        let avail = false;
        try { avail = p.available(c, this); } catch (e) { /* */ }
        if (!avail) { last = { shown: false, provider: name, reason: 'unavailable' }; continue; }
        const ok = await this._load(name);
        if (!ok) { last = { shown: false, provider: name, reason: 'sdk-unavailable' }; continue; }
        let r;
        try { r = await p[kind === 'rewarded' ? 'rewarded' : 'interstitial'](placement, ctx); }
        catch (e) { r = { shown: false, reason: 'error' }; }
        r = r || { shown: false, reason: 'error' };
        last = { ...r, provider: name };
        if (r.shown) break;
        if (NO_FALLBACK.includes(r.reason)) break;
      }
      return last;
    })();
    out = await within(work, hard, { shown: false, provider: null, reason: 'hard-timeout' });
    if (out.reason === 'hard-timeout') house.closeNow();
    ctx.resume();
    this._busy = false;
    if (out.shown) {
      this._lastAt = Date.now();
      if (kind === 'interstitial') this._shownCount++;
      this.count(`${kind}.${placement}.${out.provider}`);
    } else {
      this.count(`nofill.${kind}.${out.reason}`);
    }
    return out;
  }

  // Intervalo entre corridas. Resolve quando o jogador pode seguir.
  // opts: { online: true } quando a corrida foi numa sala online.
  async interstitial(placement = 'race_end', opts = {}) {
    try {
      const r = await this._run('interstitial', placement, opts);
      return { shown: !!r.shown, provider: r.provider || null, reason: r.reason || '' };
    } catch (e) { this._busy = false; return { shown: false, provider: null, reason: 'error' }; }
  }

  // "Assista e ganhe": só chame depois que o jogador tocar num botão que ofereça isso.
  async rewarded(placement = 'bonus') {
    try {
      const r = await this._run('rewarded', placement, {});
      return { rewarded: !!r.rewarded, provider: r.provider || null, reason: r.reason || '' };
    } catch (e) { this._busy = false; return { rewarded: false, provider: null, reason: 'error' }; }
  }

  // Avisos aos portais (CrazyGames/Poki). Nas outras plataformas não fazem nada.
  gameplayStart() { this._gameplay(true); }
  gameplayStop() { this._gameplay(false); }
  _gameplay(on) {
    try {
      if (!this.config.enabled || this._gp === on) return;
      const name = this._detectPlatform();
      const p = PROVIDERS[name];
      if (!p || !p.gameplay || !p._ok) return;
      this._gp = on;
      p.gameplay(on);
    } catch (e) { /* ignore */ }
  }
}

export const ads = new Ads();
export default ads;
if (typeof window !== 'undefined') window.__marileoAds = ads; // útil para depurar no console
