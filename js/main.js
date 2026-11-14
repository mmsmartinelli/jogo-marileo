// Race Cities — aplicação principal: renderizador, menus, fluxo de jogo.
import * as THREE from 'three';
import { CHARACTERS, buildKart } from './characters.js';
import { TRACKS, CUPS, getCup, getTrack, WORLD_IDS, FANTASY_IDS } from './tracks.js';
import { infiniteCup, randomSeed, isGenId, GEN_PREFIX } from './trackgen.js';
import { Race } from './race.js';
import { audio } from './audio.js';
import { SOURCES, PlayerInput, onKey, connectedGamepads } from './input.js';
import { setMaxAnisotropy } from './textures.js';
import { formatTime } from './utils.js';
import { PLAYER_COLORS } from './hud.js';
import { isTouchDevice } from './touch.js';
import { Online } from './online.js';
import { ads } from './ads.js';

const POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $$ = s => [...document.querySelectorAll(s)];

function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch (e) { return def; }
}
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } }

class App {
  constructor() {
    this.hudEl = $('#hud');
    this.minimapEl = $('#minimap');
    this.race = null;
    this.paused = false;
    this.screen = 'loading';
    this.portraits = [];
    this.thumbs = {};
    this.focusIdx = 0;
    this.touch = isTouchDevice();
    if (this.touch) document.body.classList.add('touchmode');
    const saved = load('marileo_settings', {});
    this.settings = Object.assign({
      mode: 'race', nPlayers: 1, trackId: 'osasco', laps: 3, difficulty: 1, autoAccel: this.touch ? 1 : 0,
      players: [{ char: 0, source: this.touch ? 'touch' : 'kb1' }, { char: 1, source: 'kb2' }, { char: 2, source: 'gp0' }, { char: 3, source: 'gp1' }],
    }, saved);
    this.stars = load('marileo_stars', {});
    // Copa Infinita: copa mais alta liberada e melhor colocação em cada copa
    this.infinite = Object.assign({ unlocked: 1, best: {} }, load('marileo_infinite', {}));
    // copa antiga ("Copa Marileo") virou a primeira copa da Volta ao Mundo
    if (!this.settings.cup || (this.settings.cup !== 'infinita' && !CUPS.some(c => c.id === this.settings.cup))) this.settings.cup = CUPS[0].id;
    if (!getTrack(this.settings.trackId)) this.settings.trackId = 'osasco';
    this.settings.infCup = Math.max(1, Math.min(this.settings.infCup || this.infinite.unlocked, this.infinite.unlocked));
    if (!isGenId(this.settings.surpriseId)) this.settings.surpriseId = isGenId(this.settings.trackId) ? this.settings.trackId : GEN_PREFIX + randomSeed();
    this.records = load('marileo_tt', {});
    this.menuInputs = ['kb1', 'kb2', 'gp0', 'gp1', 'gp2', 'gp3'].map(s => new PlayerInput(s));
    this.ready = [false, false, false, false];

    this._initRenderer();
    this._bindUI();
    this.online = new Online(this);
    this._boot();
  }

  _initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.1;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    $('#game').appendChild(r.domElement);
    setMaxAnisotropy(Math.min(8, r.capabilities.getMaxAnisotropy()));
    this.renderer = r;
    window.addEventListener('resize', () => {
      r.setSize(window.innerWidth, window.innerHeight);
      if (this.race && this.race.hud) this.race.hud.resize();
      this._relayout();
    });
  }

  async _boot() {
    const fill = $('#loadfill');
    const step = async (p, text) => { fill.style.width = p + '%'; $('#loadtext').textContent = text; await new Promise(r => setTimeout(r, 16)); };
    await step(10, 'Pintando os karts...');
    this._makePortraits();
    await step(50, 'Desenhando as cidades...');
    for (const t of TRACKS) this.thumbs[t.id] = this._trackThumb(t);
    await step(70, 'Construindo os prédios...');
    this.startDemo();
    await step(100, 'Pronto!');
    this.show('title');
    this._loop();
    // convite: ?sala=CODIGO abre direto a tela online com o código preenchido
    try {
      const sala = new URLSearchParams(location.search).get('sala');
      if (sala) this.online.open(sala);
    } catch (e) { /* ignore */ }
  }

  // ---------- Retratos dos personagens ----------
  _makePortraits() {
    const size = 256;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(size, size);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.2;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x886644, 1.6));
    const d = new THREE.DirectionalLight(0xffffff, 2.2);
    d.position.set(3, 6, 5);
    scene.add(d);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    cam.position.set(2.8, 3.0, 6.0);
    cam.lookAt(0, 1.25, 0);
    for (const ch of CHARACTERS) {
      const m = buildKart(ch);
      m.root.rotation.y = 0.35;
      m.shadow.visible = false;
      scene.add(m.root);
      r.render(scene, cam);
      this.portraits.push(r.domElement.toDataURL('image/png'));
      scene.remove(m.root);
    }
    r.dispose();
    r.forceContextLoss && r.forceContextLoss();
  }

  _trackThumb(def) {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 170;
    const ctx = c.getContext('2d');
    const th = def.theme;
    const g = ctx.createLinearGradient(0, 0, 0, 170);
    g.addColorStop(0, th.skyTop); g.addColorStop(0.45, th.skyHorizon); g.addColorStop(0.46, th.ground[0]); g.addColorStop(1, th.ground[3] || th.ground[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 300, 170);
    if (def.city) {
      // silhueta de prédios no horizonte
      let r = 7;
      for (const ch of def.id) r = (r * 31 + ch.charCodeAt(0)) % 9973;
      const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
      ctx.fillStyle = 'rgba(30,30,60,0.28)';
      for (let x = 0; x < 300;) { const w = 10 + rnd() * 18, h = 12 + rnd() * 40; ctx.fillRect(x, 77 - h, w - 2, h); x += w; }
    }
    const curve = new THREE.CatmullRomCurve3(def.points.map(p => new THREE.Vector3(p[0], p[1], p[2])), true, 'centripetal');
    const pts = curve.getPoints(240);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of pts) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
    const s = Math.min(260 / (maxX - minX), 140 / (maxZ - minZ));
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const map = p => [150 - (p.x - cx) * s, 85 - (p.z - cz) * s];
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = map(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
    ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 14; ctx.stroke();
    path(); ctx.strokeStyle = th.curbA; ctx.lineWidth = 10; ctx.stroke();
    path(); ctx.strokeStyle = th.road; ctx.lineWidth = 6; ctx.stroke();
    const [sx, sy] = map(new THREE.Vector3(...def.points[1]));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill();
    ctx.font = '38px serif'; ctx.fillText(def.emoji, 8, 44);
    if (def.timeOfDay === 'noite') { ctx.font = '26px serif'; ctx.fillText('🌙', 262, 34); }
    else if (def.timeOfDay === 'tarde') { ctx.font = '26px serif'; ctx.fillText('🌇', 262, 34); }
    return c;
  }

  // ---------- Telas ----------
  show(id) {
    this.screen = id;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    this.focusIdx = 0;
    if (id === 'setup') this._renderSetup();
    if (id === 'howto') this._tabs($('#howPanel'), this.howTab || 'ctrl');
    this._applyFocus();
  }

  // ---------- Menus que cabem numa tela só ----------
  // Abas/passos: em tela pequena mostra só a aba escolhida; se o painel tiver data-all e a tela for grande, mostra tudo junto.
  _tabs(panel, tab) {
    const all = !!panel.dataset.all && matchMedia(panel.dataset.all).matches;
    panel.classList.toggle('steps', !all);
    panel.dataset.tab = tab;
    panel.querySelectorAll('[data-pane]').forEach(p => p.classList.toggle('pane-off', !all && p.dataset.pane !== tab));
    panel.querySelectorAll('.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    this._fitGrids(panel);
    return all;
  }

  // Grade de cidades: escolhe quantas colunas deixam os cartões maiores no espaço que sobra (sem rolar).
  _fitGrids(root = document) {
    if (!this._gridRO && window.ResizeObserver) this._gridRO = new ResizeObserver(es => es.forEach(e => this._fitGrid(e.target)));
    root.querySelectorAll('.tracks.grid').forEach(el => {
      if (this._gridRO && !el._observed) { el._observed = true; this._gridRO.observe(el); }
      this._fitGrid(el);
    });
  }

  _fitGrid(el) {
    const n = el.children.length;
    const W = el.clientWidth, H = el.clientHeight;
    if (!n || !W || !H) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const ratio = +el.dataset.ratio || 1.6;
    let best = 1, bestS = 0;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const sz = Math.min((W - gap * (c - 1)) / c / ratio, (H - gap * (r - 1)) / r);
      if (sz > bestS + 0.5) { bestS = sz; best = c; }
    }
    el.style.setProperty('--tc', best);
    el.style.setProperty('--tr', Math.ceil(n / best));
  }

  // Tela girou ou mudou de tamanho: refaz abas e grades do menu aberto.
  _relayout() {
    if (this.screen === 'setup') { this._tabs($('#setupPanel'), this.setupTab || 'players'); this._setupFooter(); }
    else if (this.screen === 'howto') this._tabs($('#howPanel'), this.howTab || 'ctrl');
    else if (this.screen === 'online') this.online.render();
  }

  _setSetupTab(tab) {
    this.setupTab = tab;
    this._tabs($('#setupPanel'), tab);
    this._setupFooter();
    this.focusIdx = 0;
    this._applyFocus();
  }

  // Rodapé da configuração: no passo 1 "Escolher pista ▶"; no passo 2 (ou com tudo junto) "CORRER!"
  _setupFooter() {
    const steps = $('#setupPanel').classList.contains('steps');
    const first = steps && this.setupTab !== 'track';
    $('#setupNext').hidden = !first;
    $('#startBtn').hidden = first;
    $('#setupBack').textContent = steps && this.setupTab === 'track' ? '⬅ Pilotos' : '⬅ Voltar';
  }

  toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  showCount(text, go = false) {
    const el = $('#countdown');
    el.className = go ? 'go' : '';
    el.innerHTML = `<span class="tick">${text}</span>`;
    clearTimeout(this._countT);
    this._countT = setTimeout(() => { el.innerHTML = ''; }, 950);
  }

  _bindUI() {
    document.addEventListener('pointerdown', () => audio.init(), { once: false });
    // iPhone/iPad: o Safari só libera o som quando o dedo solta a tela
    document.addEventListener('touchend', () => audio.init(), { passive: true });
    document.addEventListener('click', () => audio.init());
    document.addEventListener('keydown', () => audio.init());

    // intervalo comercial entre as corridas (desligado até ser ativado em js/ads-config.js)
    ads.onPause = () => { if (audio.ctx) audio.ctx.suspend(); };
    ads.onResume = () => { if (audio.ctx) audio.ctx.resume(); };
    ads.isSoundOn = () => !audio.muted;
    ads.onOpenUrl = url => {
      if (window.AndroidApp && window.AndroidApp.openUrl) window.AndroidApp.openUrl(url);
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.openurl) window.webkit.messageHandlers.openurl.postMessage(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    };
    ads.init();

    $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
      audio.play('confirm');
      this.settings.mode = b.dataset.mode;
      this.setupTab = 'players';
      this.show('setup');
    }));
    $$('[data-go]').forEach(b => b.addEventListener('click', () => { audio.play('back'); this.show(b.dataset.go); }));

    $$('#playerCount button').forEach(b => b.addEventListener('click', () => { this.settings.nPlayers = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $$('#lapCount button').forEach(b => b.addEventListener('click', () => { this.settings.laps = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $$('#difficulty button').forEach(b => b.addEventListener('click', () => { this.settings.difficulty = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $$('#autoAccel button').forEach(b => b.addEventListener('click', () => { this.settings.autoAccel = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $('#startBtn').addEventListener('click', () => this.startFromSetup());
    $('#setupNext').addEventListener('click', () => { audio.play('confirm'); this._setSetupTab('track'); });
    $('#setupBack').addEventListener('click', () => this._setupBackAct());
    $$('#setupTabs [data-tab]').forEach(b => b.addEventListener('click', () => { audio.play('select'); this._setSetupTab(b.dataset.tab); }));
    $$('#howTabs [data-tab]').forEach(b => b.addEventListener('click', () => { audio.play('select'); this.howTab = b.dataset.tab; this._tabs($('#howPanel'), b.dataset.tab); }));
    // no Android (fora do app) oferece o app de verdade
    if (/Android/i.test(navigator.userAgent) && !window.AndroidApp) $('#apkBtn').hidden = false;
    $('#apkBtn').addEventListener('click', () => { location.href = 'baixar.html'; });
    $('#onlineBtn').addEventListener('click', () => {
      audio.init();
      // dentro de outra página (ex.: pré-visualização) a conexão entre aparelhos é bloqueada
      if (window.top !== window) { this.toast('O modo online funciona no app: mmsmartinelli.github.io/jogo-marileo'); return; }
      audio.play('confirm');
      this.online.open();
    });

    $('#resumeBtn').addEventListener('click', () => this.resume());
    $('#restartBtn').addEventListener('click', () => { this.paused = false; this.startRace(this.lastCfg); });
    $('#quitBtn').addEventListener('click', () => {
      this.paused = false;
      if (this.race && this.race.online) this.online.leave();
      else this.toMenu();
    });
    // Grande Prêmio: Copa Infinita (◀ ▶ escolhe entre as copas já liberadas). Os botões das copas são criados em _renderSetup.
    $('#infPrev').addEventListener('click', () => { this.settings.infCup = Math.max(1, this.settings.infCup - 1); audio.play('select'); this._renderSetup(); });
    $('#infNext').addEventListener('click', () => { this.settings.infCup = Math.min(this.infinite.unlocked, this.settings.infCup + 1); audio.play('select'); this._renderSetup(); });

    onKey(code => {
      if (code === 'KeyM') { const m = audio.toggleMute(); this.toast(m ? '🔇 Som desligado' : '🔊 Som ligado'); }
      if (this.screen === 'race' && (code === 'Escape' || code === 'KeyP')) this.pause();
      else if (this.screen === 'pause' && (code === 'Escape' || code === 'KeyP')) this.resume();
      else if (code === 'Escape') {
        if (this.screen === 'setup') this._setupBackAct();
        else if (this.screen === 'howto') { audio.play('back'); this.show('title'); }
        else if (this.screen === 'online' && !this.online.connected) { audio.play('back'); this.show('title'); }
      }
    });

    // botão "voltar" do app Android: pausa a corrida ou volta uma tela; false = pode fechar o app
    window.androidBack = () => {
      const sc = this.screen;
      if (sc === 'race') { this.pause(); return true; }
      if (sc === 'pause') { this.resume(); return true; }
      if (this.online.connected && (sc === 'online' || sc === 'results')) { this.online.leave(); return true; }
      if (sc === 'title') return false;
      audio.play('back');
      if (sc === 'results' || sc === 'podium') this.toMenu();
      else this.show('title');
      return true;
    };

    window.addEventListener('gamepadconnected', e => this.toast(`🎮 Controle ${e.gamepad.index + 1} conectado!`));
    window.addEventListener('gamepaddisconnected', e => this.toast(`Controle ${e.gamepad.index + 1} desconectado`));
  }

  // ---------- Configuração ----------
  _renderSetup() {
    const s = this.settings;
    const mode = s.mode;
    const cupDef = this._activeCup();
    $('#setupTitle').textContent = { gp: '🏆 Grande Prêmio', race: '🏁 Corrida Rápida', tt: '⏱️ Contra o Relógio' }[mode];
    const segOn = (sel, val) => $$(sel + ' button').forEach(b => b.classList.toggle('on', +b.dataset.n === val));
    segOn('#playerCount', s.nPlayers);
    segOn('#lapCount', s.laps);
    segOn('#difficulty', s.difficulty);
    segOn('#autoAccel', s.autoAccel);
    // na Copa Infinita o computador fica mais esperto sozinho a cada copa
    $('#diffBox').style.visibility = mode === 'tt' || (mode === 'gp' && cupDef.infinite) ? 'hidden' : 'visible';
    $('#trackRow').hidden = mode === 'gp';
    $('#cupRow').hidden = mode !== 'gp';

    // cartões
    const cards = $('#playerCards');
    cards.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const p = s.players[i];
      const ch = CHARACTERS[p.char];
      const on = i < s.nPlayers;
      const card = document.createElement('div');
      card.className = 'card' + (on ? '' : ' off');
      card.style.borderColor = on ? PLAYER_COLORS[i] : '';
      const stat = (label, v) => `<div><span>${label}</span><i style="--v:${v * 20}%"></i></div>`;
      const pads = connectedGamepads();
      const opts = SOURCES.map(so => {
        const missing = so.id.startsWith('gp') && !pads.includes(+so.id.slice(2));
        return `<option value="${so.id}" ${so.id === p.source ? 'selected' : ''}>${so.label}${missing ? ' (desconectado)' : ''}</option>`;
      }).join('');
      card.innerHTML = `
        <div class="pnum" style="background:${PLAYER_COLORS[i]}">Jogador ${i + 1}${this.ready[i] && on ? ' ✔' : ''}</div>
        <div class="cin">
        <img class="portrait" src="${this.portraits[p.char]}" alt="">
        <div class="pick"><button data-d="-1" aria-label="Personagem anterior">◀</button><div><div class="cname">${ch.name}</div><div class="species">${ch.species}</div></div><button data-d="1" aria-label="Próximo personagem">▶</button></div>
        <div class="stats">${stat('Velocidade', ch.stats.speed)}${stat('Aceleração', ch.stats.accel)}${stat('Curvas', ch.stats.handling)}${stat('Peso', ch.stats.weight)}</div>
        <select ${on ? '' : 'disabled'}>${opts}</select>
        </div>`;
      card.querySelectorAll('.pick button').forEach(b => b.addEventListener('click', () => this._changeChar(i, +b.dataset.d)));
      card.querySelector('select').addEventListener('change', e => { p.source = e.target.value; this._resetReady(); });
      cards.appendChild(card);
    }

    // cidades (e as pistas de fantasia no fim da fila)
    const list = $('#trackList');
    list.innerHTML = '';
    const card = t => {
      const el = document.createElement('div');
      el.className = 'track' + (t.id === s.trackId ? ' on' : '') + (t.city ? '' : ' fantasy');
      el.appendChild(this._thumbCanvas(t.id));
      const st = this.stars[t.id] || [];
      const rec = this.records[t.id];
      el.insertAdjacentHTML('beforeend', `<div class="tname">${t.city ? `${t.emoji} ${esc(t.cityName || t.name)}` : esc(t.name)}</div><div class="stars">${[0, 1, 2].map(k => st[k] ? '⭐' : '☆').join('')}${mode === 'tt' && rec ? ' • ' + formatTime(rec) : ''}</div>`);
      el.addEventListener('click', () => { s.trackId = t.id; audio.play('select'); this._renderSetup(); });
      return el;
    };
    for (const id of WORLD_IDS) list.appendChild(card(getTrack(id)));
    // 🎲 Cidade Surpresa: uma cidade com pista nova a cada sorteio
    list.appendChild(this._surpriseCard(s.surpriseId, s.trackId === s.surpriseId,
      () => { s.trackId = s.surpriseId; audio.play('select'); this._renderSetup(); },
      () => { s.surpriseId = s.trackId = GEN_PREFIX + randomSeed(); audio.play('confirm'); this._renderSetup(); },
      id => {
        const st = this.stars[id] || [];
        const rec = this.records[id];
        return [0, 1, 2].map(k => (st[k] ? '⭐' : '☆')).join('') + (mode === 'tt' && rec ? ' • ' + formatTime(rec) : '');
      }));
    for (const id of FANTASY_IDS) list.appendChild(card(getTrack(id)));

    // copa do Grande Prêmio: as copas da Volta ao Mundo, a Copa Fantasia ou a Copa Infinita
    const cm = $('#cupMode');
    if (!cm.children.length) {
      for (const c of [...CUPS, { id: 'infinita', emoji: '♾️', name: 'Copa Infinita' }]) {
        const b = document.createElement('button');
        b.dataset.c = c.id;
        b.innerHTML = `${c.emoji}<span class="cn"> ${esc(c.name.replace(/^Copa /, ''))}</span>`;
        b.title = c.name;
        b.addEventListener('click', () => { this.settings.cup = c.id; audio.play('select'); this._renderSetup(); });
        cm.appendChild(b);
      }
    }
    $$('#cupMode button').forEach(b => b.classList.toggle('on', b.dataset.c === s.cup));
    $('#cupName').textContent = cupDef.infinite ? '' : `${cupDef.emoji} ${cupDef.name}${cupDef.bonus ? ' (bônus)' : ''}`;
    $('#infPick').hidden = !cupDef.infinite;
    if (cupDef.infinite) {
      const n = cupDef.number;
      $('#infName').textContent = `Copa ${n}`;
      $('#infPrev').disabled = n <= 1;
      $('#infNext').disabled = n >= this.infinite.unlocked;
      $('#infNext').textContent = n >= this.infinite.unlocked ? '🔒' : '▶';
      const best = this.infinite.best[n];
      const ai = cupDef.aiDifficulty < 0.5 ? 'Fácil' : cupDef.aiDifficulty < 1.5 ? 'Normal' : 'Difícil';
      $('#infInfo').textContent = `${best ? `Melhor: ${best}º lugar` : 'Copa nova!'} • Computador: ${ai}`;
    }
    const cup = $('#cupList');
    cup.innerHTML = '';
    cupDef.tracks.forEach((id, n) => {
      const t = getTrack(id);
      const el = document.createElement('div');
      el.className = 'track';
      el.appendChild(this._thumbCanvas(id));
      el.insertAdjacentHTML('beforeend', `<div class="tname">${n + 1}. ${t.city ? `${t.emoji} ${esc(t.cityName || t.name)}` : esc(t.name)}</div>`);
      cup.appendChild(el);
    });
    if (this.screen === 'setup') { this._tabs($('#setupPanel'), this.setupTab || 'players'); this._setupFooter(); }
    save('marileo_settings', s);
  }

  _thumbCanvas(id) {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 170;
    // pistas geradas ganham a miniatura na hora em que aparecem
    if (!this.thumbs[id]) { const def = getTrack(id); if (def) this.thumbs[id] = this._trackThumb(def); }
    if (this.thumbs[id]) c.getContext('2d').drawImage(this.thumbs[id], 0, 0);
    return c;
  }

  // Cartão "🎲 Cidade Surpresa" (Corrida Rápida, Contra o Relógio e sala online).
  _surpriseCard(id, on, onPick, onReroll, extra) {
    const t = getTrack(id);
    const el = document.createElement('div');
    el.className = 'track surprise' + (on ? ' on' : '');
    el.appendChild(this._thumbCanvas(id));
    el.insertAdjacentHTML('beforeend', `<div class="sname"><small>🎲 Surpresa</small><span>${t.emoji} ${esc(t.name)}</span></div>${extra ? `<div class="stars">${extra(id)}</div>` : ''}`);
    el.addEventListener('click', onPick);
    // o sorteio de outra cidade é um cartão próprio, grande o bastante para o dedo
    const b = document.createElement('button');
    b.className = 'track reroll';
    b.innerHTML = '<b>🎲</b><span>Sortear outra</span>';
    b.title = 'Sortear outra cidade surpresa';
    b.addEventListener('click', e => { e.stopPropagation(); onReroll(); });
    const f = document.createDocumentFragment();
    f.append(el, b);
    return f;
  }

  // Copa escolhida para o Grande Prêmio: { name, tracks, infinite?, number?, aiDifficulty? }
  _activeCup() {
    const s = this.settings;
    return s.cup === 'infinita' ? infiniteCup(s.infCup) : getCup(s.cup);
  }

  _saveInfinite() { save('marileo_infinite', this.infinite); }

  _changeChar(i, d) {
    const p = this.settings.players[i];
    p.char = (p.char + d + CHARACTERS.length) % CHARACTERS.length;
    this.ready[i] = false;
    audio.play('select');
    this._renderSetup();
  }

  _resetReady() { this.ready = [false, false, false, false]; }

  // Voltar na configuração: do passo 2 volta para os pilotos; do passo 1 volta ao menu.
  _setupBackAct() {
    audio.play('back');
    if ($('#setupPanel').classList.contains('steps') && this.setupTab === 'track') this._setSetupTab('players');
    else this.show('title');
  }

  // No celular: tela cheia e trava na horizontal (quando o navegador permite).
  _goFullscreen() {
    if (!this.touch) return;
    try {
      const el = document.documentElement;
      const p = !document.fullscreenElement && el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null;
      const lock = () => { try { const q = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (q && q.catch) q.catch(() => {}); } catch (e) { /* ignore */ } };
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) { /* ignore */ }
  }

  startFromSetup() {
    audio.init();
    audio.play('confirm');
    this._goFullscreen();
    const s = this.settings;
    save('marileo_settings', s);
    const players = s.players.slice(0, s.nPlayers).map(p => ({ char: p.char, source: p.source }));
    // avisa sobre controles repetidos
    const srcs = players.map(p => p.source);
    if (new Set(srcs).size !== srcs.length) { this.toast('⚠️ Dois jogadores estão usando o mesmo controle!'); }
    this._resetReady();
    if (s.mode === 'gp') {
      const used = new Set(players.map(p => p.char));
      const ai = CHARACTERS.map((_, i) => i).filter(i => !used.has(i));
      while (ai.length < 8 - players.length) ai.push(Math.floor(Math.random() * CHARACTERS.length));
      this.gp = { index: 0, points: {}, aiChars: ai.slice(0, 8 - players.length), players, grid: null, cup: this._activeCup() };
      this.startGPRace();
    } else {
      this.startRace({ mode: s.mode, trackId: s.trackId, laps: s.laps, difficulty: s.difficulty, autoAccel: !!s.autoAccel, players });
    }
  }

  startGPRace() {
    const s = this.settings;
    const g = this.gp;
    const cup = g.cup;
    this.startRace({
      mode: 'gp', trackId: cup.tracks[g.index], laps: s.laps, difficulty: cup.infinite ? cup.aiDifficulty : s.difficulty, autoAccel: !!s.autoAccel,
      players: g.players, aiChars: g.aiChars, gridOrder: g.grid,
    });
  }

  // ---------- Corridas ----------
  startDemo() {
    if (this.race) this.race.dispose();
    // no fundo do menu passa uma volta por cada cidade
    const ids = ['paris', 'toquio', 'rio', 'londres', 'novayork', 'cairo', 'roma', 'sydney', 'dubai', 'agra', 'pequim', 'osasco'];
    const id = ids[(this._demoIdx ?? 0) % ids.length];
    this._demoIdx = (this._demoIdx ?? 0) + 1;
    this.race = new Race(this, { mode: 'demo', trackId: id, laps: 99, difficulty: 1, players: [] });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.demoTime = 0;
  }

  startRace(cfg) {
    audio.init();
    if (this.race) this.race.dispose();
    this.lastCfg = cfg;
    this.paused = false;
    const n = cfg.players.length;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, n >= 3 ? 1 : n === 2 ? 1.25 : 1.5));
    this.race = new Race(this, cfg);
    this.show('race');
    ads.gameplayStart();
  }

  // Mostra o intervalo comercial (se as regras deixarem) e só depois segue para a próxima corrida.
  async _adBreak(next, cfg) {
    if (this._adBusy) return;
    this._adBusy = true;
    try { await ads.interstitial('race_end', { online: !!(cfg && cfg.online) }); } catch (e) { /* nunca trava o jogo */ }
    this._adBusy = false;
    next();
  }

  // Corrida online: cada aparelho monta a mesma corrida com o seu kart.
  startOnlineRace(cfg, online) {
    this._goFullscreen();
    const source = this.touch ? 'touch' : 'any';
    this.startRace({
      ...cfg, autoAccel: !!this.settings.autoAccel,
      players: [{ char: this.online.me.char, source }],
      online: { ...online, entries: cfg.entries, source },
    });
  }

  pause() {
    if (this.screen !== 'race') return;
    const online = !!(this.race && this.race.online);
    // online a corrida continua para os amigos: só mostra o menu
    this.paused = !online;
    $('#restartBtn').hidden = online;
    $('#quitBtn').textContent = online ? '🚪 Sair da sala' : '🏠 Sair para o menu';
    audio.play('back');
    this.show('pause');
    ads.gameplayStop();
  }

  resume() {
    this.paused = false;
    audio.play('confirm');
    this.show('race');
    ads.gameplayStart();
  }

  toMenu() {
    ads.gameplayStop();
    this.paused = false;
    this.gp = null;
    if (this.online.connected) this.online.leave(true);
    this.startDemo();
    this.show('title');
  }

  onRaceFinished(race) {
    ads.gameplayStop();
    const cfg = race.cfg;
    const res = race.results();
    const def = race.def;
    const humans = race.humans;

    // desafios
    let chalHTML = '';
    if (cfg.mode !== 'tt') {
      const prev = this.stars[def.id] || [false, false, false];
      const now = def.challenges.map((c, i) => {
        const who = humans.filter(k => this._checkChallenge(c, k));
        return { c, who, done: who.length > 0, wasDone: !!prev[i] };
      });
      this.stars[def.id] = now.map((n, i) => n.done || !!prev[i]);
      save('marileo_stars', this.stars);
      chalHTML = `<h3>⭐ Desafios — ${def.name}</h3>` + now.map(n => `
        <div class="chal ${n.done ? 'done' : ''}"><span class="star">⭐</span><div>${n.c.text}
        <div class="sub">${n.done ? 'Conseguiu: ' + n.who.map(k => k.netName ? esc(k.netName) : 'J' + (k.playerIndex + 1)).join(', ') : (n.wasDone ? 'Já conquistado antes' : 'Ainda não...')}</div></div></div>`).join('');
      const total = TRACKS.reduce((a, t) => a + (this.stars[t.id] || []).filter(Boolean).length, 0);
      chalHTML += `<p class="hint">Total de estrelas: <b>${total} / ${TRACKS.length * 3}</b>${def.generated ? ' (pistas fixas)' : ''}</p>`;
    } else {
      const best = Math.min(...humans.map(k => k.finishTime));
      const rec = this.records[def.id];
      const isRec = !rec || best < rec;
      if (isRec) { this.records[def.id] = best; save('marileo_tt', this.records); }
      chalHTML = `<h3>⏱️ Tempos</h3>` + humans.map(k => `
        <div class="chal done"><span class="star">🏁</span><div><b>J${k.playerIndex + 1} ${k.ch.name}</b>: ${formatTime(k.finishTime)}
        <div class="sub">Voltas: ${k.lapTimes.map(formatTime).join(' • ')}</div></div></div>`).join('') +
        `<div class="chal ${isRec ? 'done' : ''}"><span class="star">🏆</span><div>${isRec ? 'NOVO RECORDE!' : 'Recorde'}: ${formatTime(this.records[def.id])}</div></div>`;
    }
    $('#challenges').innerHTML = chalHTML;

    // pontos do GP
    if (cfg.mode === 'gp') {
      res.forEach((r, i) => {
        const key = r.kart.human ? 'P' + r.kart.playerIndex : r.kart.charIndex;
        r.points = POINTS[i] || 0;
        this.gp.points[key] = (this.gp.points[key] || 0) + r.points;
        r.key = key;
      });
      // largada da próxima: do último para o primeiro
      const order = Object.keys(this.gp.points).sort((a, b) => this.gp.points[a] - this.gp.points[b]);
      this.gp.grid = order.map(k => (k.startsWith('P') ? k : +k));
      this.gp.lastKarts = res.map(r => ({ key: r.key, char: r.kart.charIndex, human: r.kart.human, playerIndex: r.kart.playerIndex, name: r.kart.ch.name }));
    }

    // tabela
    const rows = res.map((r, i) => {
      const k = r.kart;
      const tag = cfg.online
        ? (k.netHuman ? `<span class="tag" style="background:${k.human ? '#ffb020' : '#7c3aed'}">${k.human ? 'você' : '🌐'}</span>` : '')
        : (k.human ? `<span class="tag" style="background:${PLAYER_COLORS[k.playerIndex]}">J${k.playerIndex + 1}</span>` : '');
      const pts = cfg.mode === 'gp' ? `<td class="pts">+${r.points} • ${this.gp.points[r.key]} pts</td>` : '';
      return `<tr class="${k.human ? 'human' : ''}"><td>${i + 1}º</td><td><img src="${this.portraits[k.charIndex]}">${esc(k.netName || k.ch.name)}${tag}</td>
        <td>${r.estimated ? '~' : ''}${formatTime(r.time)}</td>${pts}</tr>`;
    }).join('');
    $('#resultsTable').innerHTML = rows;
    const gcup = cfg.mode === 'gp' ? this.gp.cup : null;
    const title = gcup ? `${gcup.infinite ? `Copa ${gcup.number} • ` : ''}Corrida ${this.gp.index + 1}/${gcup.tracks.length} — ${def.name}` : def.name;
    $('#resultsTitle').textContent = title;

    const acts = $('#resultsActions');
    acts.innerHTML = '';
    const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = cls; b.textContent = label; b.addEventListener('click', () => { audio.play('confirm'); fn(); }); acts.appendChild(b); };
    if (cfg.online) {
      // continua na mesma sala: volta para escolher piloto, pista e dificuldade
      btn('🔄 Jogar novamente', 'big go', () => this.online.backToLobby(this.online.isHost));
      if (this.online.isHost) btn('⚡ Revanche: mesma pista', 'mid', () => this.online.rematch());
      btn('🚪 Sair da sala', 'mid ghost', () => this.online.leave());
    } else if (cfg.mode === 'gp') {
      if (this.gp.index < this.gp.cup.tracks.length - 1) {
        const next = getTrack(this.gp.cup.tracks[this.gp.index + 1]);
        btn(`▶ Próxima: ${next.name}`, 'big go', () => this._adBreak(() => { this.gp.index++; this.startGPRace(); }, cfg));
      } else {
        btn('🏆 Ver o pódio!', 'big go', () => this.showPodium());
      }
      btn('🏠 Sair', 'mid ghost', () => this.toMenu());
    } else {
      btn('🔄 Correr de novo', 'big go', () => this._adBreak(() => this.startRace(cfg), cfg));
      btn('🗺️ Outra pista', 'mid', () => { this.startDemo(); this.setupTab = 'track'; this.show('setup'); });
      btn('🏠 Menu', 'mid ghost', () => this.toMenu());
    }
    this.show('results');
  }

  _checkChallenge(c, k) {
    const st = k.stats;
    switch (c.type) {
      case 'place': return k.place <= c.value;
      case 'coins': return k.coins >= c.value;
      case 'boosts': return st.miniTurbos >= c.value;
      case 'hits': return st.hits >= c.value;
      case 'nohit': return st.barrelHits === 0;
      case 'tricks': return st.tricks >= c.value;
      case 'nosquash': return st.crushed === 0;
      case 'nofall': return st.falls === 0;
      case 'pigeons': return (st.pigeons || 0) >= c.value;
    }
    return false;
  }

  showPodium() {
    const g = this.gp;
    const entries = Object.keys(g.points).map(key => {
      const info = g.lastKarts.find(k => String(k.key) === String(key));
      return { key, pts: g.points[key], info };
    }).sort((a, b) => b.pts - a.pts);
    const box = $('#podiumBox');
    const step = (e, n) => e ? `<div class="step p${n}"><img src="${this.portraits[e.info.char]}"><div>${e.info.name}${e.info.human ? ` (J${e.info.playerIndex + 1})` : ''}</div><div>${e.pts} pts</div><div class="block">${n}</div></div>` : '';
    box.innerHTML = step(entries[1], 2) + step(entries[0], 1) + step(entries[2], 3);
    $('#podiumTable').innerHTML = entries.map((e, i) => `<tr class="${e.info.human ? 'human' : ''}"><td>${i + 1}º</td><td><img src="${this.portraits[e.info.char]}">${e.info.name}${e.info.human ? ` <span class="tag" style="background:${PLAYER_COLORS[e.info.playerIndex]}">J${e.info.playerIndex + 1}</span>` : ''}</td><td class="pts">${e.pts} pts</td></tr>`).join('');
    const humanWin = entries[0] && entries[0].info.human;
    $('#podiumTitle').textContent = humanWin ? `🏆 J${entries[0].info.playerIndex + 1} é o grande campeão! 🏆` : '🏆 Campeões da Copa! 🏆';
    const acts = $('#podiumActions');
    acts.innerHTML = '';
    const btn = (label, cls, fn) => {
      const b = document.createElement('button');
      b.className = cls; b.textContent = label;
      b.addEventListener('click', () => { audio.play('confirm'); fn(); });
      acts.appendChild(b);
    };
    let note = '';
    if (g.cup.infinite) {
      // melhor colocação de um jogador na classificação final da copa
      const n = g.cup.number;
      const place = entries.findIndex(e => e.info.human) + 1;
      if (place > 0) {
        const inf = this.infinite;
        inf.best[n] = Math.min(inf.best[n] || 99, place);
        const won = place <= 3;
        if (won && inf.unlocked < n + 1) { inf.unlocked = n + 1; note = `🔓 Copa ${n + 1} liberada!`; }
        else if (!won && inf.unlocked <= n) note = `Termine entre os 3 primeiros para liberar a Copa ${n + 1}.`;
        this._saveInfinite();
      }
      const again = num => { Object.assign(g, { index: 0, points: {}, grid: null, cup: infiniteCup(num) }); this.startGPRace(); };
      if (this.infinite.unlocked > n) {
        btn('▶ Próxima copa', 'big go', () => { this.settings.infCup = n + 1; save('marileo_settings', this.settings); again(n + 1); });
      } else {
        btn('🔄 Tentar de novo', 'big go', () => again(n));
      }
    }
    $('#podiumNote').textContent = note;
    $('#podiumNote').hidden = !note;
    btn('🏠 Menu principal', g.cup.infinite ? 'mid ghost' : 'big', () => this.toMenu());
    audio.play('finish');
    this.show('podium');
  }

  // ---------- Navegação por teclado/controle nos menus ----------
  _navButtons() {
    const sc = document.getElementById(this.screen);
    if (!sc) return [];
    return [...sc.querySelectorAll('.menu button, .tabs:not([hidden]) button, .actions button')].filter(b => b.offsetParent !== null);
  }

  _applyFocus() {
    const bs = this._navButtons();
    $$('button.focus').forEach(b => b.classList.remove('focus'));
    if (bs.length) bs[Math.min(this.focusIdx, bs.length - 1)].classList.add('focus');
  }

  _menuInput() {
    if (ads.showing || this.screen === 'race' || this.screen === 'loading') {
      // continua lendo para as "bordas" (apertou agora) não vazarem para o próximo menu
      for (const m of this.menuInputs) m.poll();
      return;
    }
    if (this.screen === 'setup') { this._setupInput(); return; }
    const bs = this._navButtons();
    for (const m of this.menuInputs) {
      const s = m.poll();
      if (!s.connected) continue;
      if (s.upPressed || s.leftPressed) { this.focusIdx = (this.focusIdx - 1 + bs.length) % bs.length; audio.play('select'); this._applyFocus(); }
      if (s.downPressed || s.rightPressed) { this.focusIdx = (this.focusIdx + 1) % bs.length; audio.play('select'); this._applyFocus(); }
      if (s.confirmPressed && bs.length) { audio.init(); bs[Math.min(this.focusIdx, bs.length - 1)].click(); return; }
      if (s.pausePressed && this.screen === 'pause') { this.resume(); return; }
      if (s.backPressed && (this.screen === 'howto')) { this.show('title'); return; }
    }
  }

  _setupInput() {
    const s = this.settings;
    const byPlayer = new Map();
    for (let i = 0; i < s.nPlayers; i++) byPlayer.set(s.players[i].source, i);
    for (const m of this.menuInputs) {
      const st = m.poll();
      if (!st.connected) continue;
      const i = byPlayer.get(m.source);
      if (i === undefined) {
        if (st.backPressed) { this.show('title'); return; }
        continue;
      }
      if (st.leftPressed) this._changeChar(i, -1);
      if (st.rightPressed) this._changeChar(i, 1);
      if (st.confirmPressed) {
        audio.init();
        this.ready[i] = !this.ready[i];
        audio.play(this.ready[i] ? 'confirm' : 'back');
        if (this.ready.slice(0, s.nPlayers).every(Boolean)) { this.startFromSetup(); return; }
        this._renderSetup();
      }
      if (st.backPressed) { this.show('title'); return; }
    }
  }

  _loop() {
    let last = performance.now();
    const frame = now => {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this._menuInput();
      if (this.race) {
        if (!this.paused) this.race.update(dt);
        this.race.render(this.renderer);
        if (this.race.cfg.mode === 'demo') {
          this.demoTime += dt;
          if (this.demoTime > 45 && this.screen === 'title') this.startDemo();
        }
      }
    };
    requestAnimationFrame(frame);
  }
}

window.app = new App();

// App instalável (PWA): guarda os arquivos para jogar sem internet.
if ('serviceWorker' in navigator && window.isSecureContext && window.top === window) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sem suporte: segue normal */ });
  });
}
