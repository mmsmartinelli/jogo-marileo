// Marileo Kart — aplicação principal: renderizador, menus, fluxo de jogo.
import * as THREE from 'three';
import { CHARACTERS, buildKart } from './characters.js';
import { TRACKS, CUP, getTrack } from './tracks.js';
import { Race } from './race.js';
import { audio } from './audio.js';
import { SOURCES, PlayerInput, onKey, connectedGamepads } from './input.js';
import { setMaxAnisotropy } from './textures.js';
import { formatTime } from './utils.js';
import { PLAYER_COLORS } from './hud.js';
import { isTouchDevice } from './touch.js';

const POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
const $ = s => document.querySelector(s);
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
      mode: 'race', nPlayers: 1, trackId: 'vale', laps: 3, difficulty: 1, autoAccel: this.touch ? 1 : 0,
      players: [{ char: 0, source: this.touch ? 'touch' : 'kb1' }, { char: 1, source: 'kb2' }, { char: 2, source: 'gp0' }, { char: 3, source: 'gp1' }],
    }, saved);
    this.stars = load('marileo_stars', {});
    this.records = load('marileo_tt', {});
    this.menuInputs = ['kb1', 'kb2', 'gp0', 'gp1', 'gp2', 'gp3'].map(s => new PlayerInput(s));
    this.ready = [false, false, false, false];

    this._initRenderer();
    this._bindUI();
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
    });
  }

  async _boot() {
    const fill = $('#loadfill');
    const step = async (p, text) => { fill.style.width = p + '%'; $('#loadtext').textContent = text; await new Promise(r => setTimeout(r, 16)); };
    await step(10, 'Pintando os karts...');
    this._makePortraits();
    await step(50, 'Desenhando as pistas...');
    for (const t of TRACKS) this.thumbs[t.id] = this._trackThumb(t);
    await step(70, 'Ligando os motores...');
    this.startDemo();
    await step(100, 'Pronto!');
    this.show('title');
    this._loop();
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
    return c;
  }

  // ---------- Telas ----------
  show(id) {
    this.screen = id;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    this.focusIdx = 0;
    this._applyFocus();
    if (id === 'setup') this._renderSetup();
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
    document.addEventListener('keydown', () => audio.init());

    $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
      audio.play('confirm');
      this.settings.mode = b.dataset.mode;
      this.show('setup');
    }));
    $$('[data-go]').forEach(b => b.addEventListener('click', () => { audio.play('back'); this.show(b.dataset.go); }));

    $$('#playerCount button').forEach(b => b.addEventListener('click', () => { this.settings.nPlayers = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $$('#lapCount button').forEach(b => b.addEventListener('click', () => { this.settings.laps = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $$('#difficulty button').forEach(b => b.addEventListener('click', () => { this.settings.difficulty = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $$('#autoAccel button').forEach(b => b.addEventListener('click', () => { this.settings.autoAccel = +b.dataset.n; audio.play('select'); this._renderSetup(); }));
    $('#startBtn').addEventListener('click', () => this.startFromSetup());

    $('#resumeBtn').addEventListener('click', () => this.resume());
    $('#restartBtn').addEventListener('click', () => { this.paused = false; this.startRace(this.lastCfg); });
    $('#quitBtn').addEventListener('click', () => { this.paused = false; this.toMenu(); });
    $('#podiumMenu').addEventListener('click', () => this.toMenu());

    onKey(code => {
      if (code === 'KeyM') { const m = audio.toggleMute(); this.toast(m ? '🔇 Som desligado' : '🔊 Som ligado'); }
      if (this.screen === 'race' && (code === 'Escape' || code === 'KeyP')) this.pause();
      else if (this.screen === 'pause' && (code === 'Escape' || code === 'KeyP')) this.resume();
      else if (code === 'Escape') {
        if (this.screen === 'setup' || this.screen === 'howto') { audio.play('back'); this.show('title'); }
      }
    });

    window.addEventListener('gamepadconnected', e => this.toast(`🎮 Controle ${e.gamepad.index + 1} conectado!`));
    window.addEventListener('gamepaddisconnected', e => this.toast(`Controle ${e.gamepad.index + 1} desconectado`));
  }

  // ---------- Configuração ----------
  _renderSetup() {
    const s = this.settings;
    const mode = s.mode;
    $('#setupTitle').textContent = { gp: `🏆 Grande Prêmio — ${CUP.name}`, race: '🏁 Corrida Rápida', tt: '⏱️ Contra o Relógio' }[mode];
    const segOn = (sel, val) => $$(sel + ' button').forEach(b => b.classList.toggle('on', +b.dataset.n === val));
    segOn('#playerCount', s.nPlayers);
    segOn('#lapCount', s.laps);
    segOn('#difficulty', s.difficulty);
    segOn('#autoAccel', s.autoAccel);
    $('#diffBox').style.visibility = mode === 'tt' ? 'hidden' : 'visible';
    $('#trackRow').style.display = mode === 'gp' ? 'none' : 'flex';
    $('#cupRow').style.display = mode === 'gp' ? 'flex' : 'none';

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
        <img class="portrait" src="${this.portraits[p.char]}" alt="">
        <div class="pick"><button data-d="-1">◀</button><div><div class="cname">${ch.name}</div><div style="font-size:14px;opacity:.8">${ch.species}</div></div><button data-d="1">▶</button></div>
        <div class="stats">${stat('Velocidade', ch.stats.speed)}${stat('Aceleração', ch.stats.accel)}${stat('Curvas', ch.stats.handling)}${stat('Peso', ch.stats.weight)}</div>
        <select ${on ? '' : 'disabled'}>${opts}</select>`;
      card.querySelectorAll('.pick button').forEach(b => b.addEventListener('click', () => this._changeChar(i, +b.dataset.d)));
      card.querySelector('select').addEventListener('change', e => { p.source = e.target.value; this._resetReady(); });
      cards.appendChild(card);
    }

    // pistas
    const list = $('#trackList');
    list.innerHTML = '';
    for (const t of TRACKS) {
      const el = document.createElement('div');
      el.className = 'track' + (t.id === s.trackId ? ' on' : '');
      el.appendChild(this._thumbCanvas(t.id));
      const st = this.stars[t.id] || [];
      const rec = this.records[t.id];
      el.insertAdjacentHTML('beforeend', `<div>${t.name}</div><div class="stars">${[0, 1, 2].map(k => st[k] ? '⭐' : '☆').join('')}${mode === 'tt' && rec ? ' • ' + formatTime(rec) : ''}</div>`);
      el.addEventListener('click', () => { s.trackId = t.id; audio.play('select'); this._renderSetup(); });
      list.appendChild(el);
    }
    const cup = $('#cupList');
    cup.innerHTML = '';
    CUP.tracks.forEach((id, n) => {
      const t = getTrack(id);
      const el = document.createElement('div');
      el.className = 'track';
      el.appendChild(this._thumbCanvas(id));
      el.insertAdjacentHTML('beforeend', `<div>${n + 1}. ${t.name}</div>`);
      cup.appendChild(el);
    });
    save('marileo_settings', s);
  }

  _thumbCanvas(id) {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 170;
    c.getContext('2d').drawImage(this.thumbs[id], 0, 0);
    return c;
  }

  _changeChar(i, d) {
    const p = this.settings.players[i];
    p.char = (p.char + d + CHARACTERS.length) % CHARACTERS.length;
    this.ready[i] = false;
    audio.play('select');
    this._renderSetup();
  }

  _resetReady() { this.ready = [false, false, false, false]; }

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
      this.gp = { index: 0, points: {}, aiChars: ai.slice(0, 8 - players.length), players, grid: null };
      this.startGPRace();
    } else {
      this.startRace({ mode: s.mode, trackId: s.trackId, laps: s.laps, difficulty: s.difficulty, autoAccel: !!s.autoAccel, players });
    }
  }

  startGPRace() {
    const s = this.settings;
    const g = this.gp;
    this.startRace({
      mode: 'gp', trackId: CUP.tracks[g.index], laps: s.laps, difficulty: s.difficulty, autoAccel: !!s.autoAccel,
      players: g.players, aiChars: g.aiChars, gridOrder: g.grid,
    });
  }

  // ---------- Corridas ----------
  startDemo() {
    if (this.race) this.race.dispose();
    const ids = TRACKS.map(t => t.id);
    const id = this._demoIdx === undefined ? 'vale' : ids[this._demoIdx % ids.length];
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
  }

  pause() {
    if (this.screen !== 'race') return;
    this.paused = true;
    audio.play('back');
    this.show('pause');
  }

  resume() {
    this.paused = false;
    audio.play('confirm');
    this.show('race');
  }

  toMenu() {
    this.paused = false;
    this.gp = null;
    this.startDemo();
    this.show('title');
  }

  onRaceFinished(race) {
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
        <div style="font-size:13px;opacity:.8">${n.done ? 'Conseguiu: ' + n.who.map(k => 'J' + (k.playerIndex + 1)).join(', ') : (n.wasDone ? 'Já conquistado antes' : 'Ainda não...')}</div></div></div>`).join('');
      const total = Object.values(this.stars).reduce((a, s) => a + s.filter(Boolean).length, 0);
      chalHTML += `<p class="hint">Total de estrelas: <b>${total} / ${TRACKS.length * 3}</b></p>`;
    } else {
      const best = Math.min(...humans.map(k => k.finishTime));
      const rec = this.records[def.id];
      const isRec = !rec || best < rec;
      if (isRec) { this.records[def.id] = best; save('marileo_tt', this.records); }
      chalHTML = `<h3>⏱️ Tempos</h3>` + humans.map(k => `
        <div class="chal done"><span class="star">🏁</span><div><b>J${k.playerIndex + 1} ${k.ch.name}</b>: ${formatTime(k.finishTime)}
        <div style="font-size:13px;opacity:.8">Voltas: ${k.lapTimes.map(formatTime).join(' • ')}</div></div></div>`).join('') +
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
      const tag = k.human ? `<span class="tag" style="background:${PLAYER_COLORS[k.playerIndex]}">J${k.playerIndex + 1}</span>` : '';
      const pts = cfg.mode === 'gp' ? `<td class="pts">+${r.points} • ${this.gp.points[r.key]} pts</td>` : '';
      return `<tr class="${k.human ? 'human' : ''}"><td>${i + 1}º</td><td><img src="${this.portraits[k.charIndex]}">${k.ch.name}${tag}</td>
        <td>${r.estimated ? '~' : ''}${formatTime(r.time)}</td>${pts}</tr>`;
    }).join('');
    $('#resultsTable').innerHTML = rows;
    const title = cfg.mode === 'gp' ? `Corrida ${this.gp.index + 1}/${CUP.tracks.length} — ${def.name}` : def.name;
    $('#resultsTitle').textContent = title;

    const acts = $('#resultsActions');
    acts.innerHTML = '';
    const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = cls; b.textContent = label; b.addEventListener('click', () => { audio.play('confirm'); fn(); }); acts.appendChild(b); };
    if (cfg.mode === 'gp') {
      if (this.gp.index < CUP.tracks.length - 1) {
        const next = getTrack(CUP.tracks[this.gp.index + 1]);
        btn(`▶ Próxima: ${next.name}`, 'big go', () => { this.gp.index++; this.startGPRace(); });
      } else {
        btn('🏆 Ver o pódio!', 'big go', () => this.showPodium());
      }
      btn('🏠 Sair', 'mid ghost', () => this.toMenu());
    } else {
      btn('🔄 Correr de novo', 'big go', () => this.startRace(cfg));
      btn('🗺️ Escolher outra pista', 'mid', () => { this.startDemo(); this.show('setup'); });
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
    audio.play('finish');
    this.show('podium');
  }

  // ---------- Navegação por teclado/controle nos menus ----------
  _navButtons() {
    const sc = document.getElementById(this.screen);
    if (!sc) return [];
    return [...sc.querySelectorAll('.menu button, .actions button')].filter(b => b.offsetParent !== null);
  }

  _applyFocus() {
    const bs = this._navButtons();
    $$('button.focus').forEach(b => b.classList.remove('focus'));
    if (bs.length) bs[Math.min(this.focusIdx, bs.length - 1)].classList.add('focus');
  }

  _menuInput() {
    if (this.screen === 'race' || this.screen === 'loading') {
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
