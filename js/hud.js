// HUD por jogador (tela dividida) + minimapa.
import { ITEMS, ITEM_KEYS } from './items.js';
import { formatTime } from './utils.js';
import { inkDataURL, poopDataURL } from './textures.js';

export const PLAYER_COLORS = ['#ff3b3b', '#2f7bff', '#35d07f', '#ffb020'];

export function layoutViewports(n) {
  if (n <= 1) return [{ x: 0, y: 0, w: 1, h: 1 }];
  if (n === 2) return [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }];
  return [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ];
}

let inkImg = null, poopImg = null;

export class HUD {
  constructor(root, race, humans, rects) {
    this.root = root;
    this.race = race;
    this.views = [];
    root.innerHTML = '';
    if (!inkImg) inkImg = inkDataURL(42);
    if (!poopImg) poopImg = poopDataURL(7);
    humans.forEach((k, i) => {
      const r = rects[i];
      const el = document.createElement('div');
      el.className = 'vp' + (humans.length > 1 ? ' divider' : '');
      Object.assign(el.style, { left: r.x * 100 + '%', top: r.y * 100 + '%', width: r.w * 100 + '%', height: r.h * 100 + '%' });
      el.innerHTML = `
        <div class="boost"></div>
        <div class="ink"><img src="${inkImg}" style="width:100%;height:100%;object-fit:cover"></div>
        <div class="poop"><img src="${poopImg}" style="width:100%;height:100%;object-fit:cover"></div>
        <div class="item"><span class="icon"></span><span class="count"></span></div>
        <div class="pname" style="color:${PLAYER_COLORS[k.playerIndex]}">${k.netName || `J${k.playerIndex + 1} • ${k.ch.name}`}</div>
        <div class="time"></div>
        <div class="coins"><span class="coinIco"></span><span class="cv">0</span></div>
        <div class="lap"></div>
        <div class="pos"></div>
        <div class="msg"></div>
        <div class="drift"><i></i></div>`;
      root.appendChild(el);
      const q = s => el.querySelector(s);
      this.views.push({
        k, el, rect: r,
        item: q('.item'), icon: q('.icon'), count: q('.count'), time: q('.time'), coins: q('.cv'),
        lap: q('.lap'), pos: q('.pos'), msg: q('.msg'), ink: q('.ink'), poop: q('.poop'), boost: q('.boost'), drift: q('.drift'), driftBar: q('.drift i'),
        last: {}, msgTimer: 0, rouletteTick: 0,
      });
    });
    if (humans.length === 3) {
      const r = rects[3];
      const el = document.createElement('div');
      el.className = 'vp divider';
      Object.assign(el.style, { left: r.x * 100 + '%', top: r.y * 100 + '%', width: r.w * 100 + '%', height: r.h * 100 + '%' });
      root.appendChild(el);
    }
    this.resize();
  }

  resize() {
    for (const v of this.views) {
      const w = v.rect.w * window.innerWidth, h = v.rect.h * window.innerHeight;
      const s = Math.max(0.42, Math.min(1.25, Math.min(w / 1280, h / 720) * 1.1));
      v.el.style.setProperty('--s', s.toFixed(3));
    }
  }

  message(k, text, dur = 1.6, cls = '') {
    const v = this.views.find(v => v.k === k);
    if (!v) return;
    v.msg.textContent = text;
    v.msg.className = 'msg show ' + cls;
    v.msgTimer = dur;
  }

  messageAll(text, dur, cls) { for (const v of this.views) this.message(v.k, text, dur, cls); }

  set(v, key, val, fn) {
    if (v.last[key] !== val) { v.last[key] = val; fn(val); }
  }

  update(dt) {
    const race = this.race;
    const laps = race.cfg.laps;
    for (const v of this.views) {
      const k = v.k;
      // item / roleta
      if (k.roulette > 0) {
        v.rouletteTick -= dt;
        if (v.rouletteTick <= 0) {
          v.rouletteTick = 0.07;
          v.icon.textContent = ITEMS[ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)]].icon;
          race.sfxAt('roulette', k);
        }
        this.set(v, 'spin', true, () => v.item.classList.add('spin'));
        this.set(v, 'count', '', x => v.count.textContent = x);
        v.last.icon = null;
      } else {
        this.set(v, 'spin', false, () => v.item.classList.remove('spin'));
        const icon = k.item ? ITEMS[k.item].icon : '';
        this.set(v, 'icon', icon, x => v.icon.textContent = x);
        this.set(v, 'count', k.item === 'turbo3' && k.itemCount > 1 ? '×' + k.itemCount : '', x => v.count.textContent = x);
      }
      const time = race.phase === 'racing' || race.phase === 'done' ? (k.finished ? k.finishTime : race.raceTime) : 0;
      this.set(v, 'time', formatTime(time).slice(0, -1), x => v.time.textContent = x);
      this.set(v, 'coins', k.coins, x => v.coins.textContent = x);
      const lapShown = Math.min(laps, Math.max(1, k.lap));
      this.set(v, 'lap', `Volta ${lapShown}/${laps}`, x => v.lap.textContent = x);
      const place = k.place;
      this.set(v, 'place', race.cfg.mode === 'tt' ? 0 : place, x => {
        if (!x) { v.pos.innerHTML = ''; return; }
        v.pos.innerHTML = `${x}<sup>º</sup>`;
        v.pos.className = 'pos bump' + (x <= 3 ? ' p' + x : '');
      });
      this.set(v, 'ink', k.ink > 0.3, x => v.ink.style.opacity = x ? '0.95' : '0');
      this.set(v, 'poop', k.poop > 0.4, x => v.poop.style.opacity = x ? '1' : '0');
      this.set(v, 'boost', k.boost > 0, x => v.boost.style.opacity = x ? '1' : '0');
      // barra de derrapagem
      const dl = k.drifting ? k.driftLevel : -1;
      this.set(v, 'drift', dl, x => {
        v.drift.style.opacity = x >= 0 ? '1' : '0';
        const cols = ['#999', '#5cd6ff', '#ffa030', '#d66bff'];
        v.driftBar.style.background = cols[Math.max(0, x)];
      });
      if (k.drifting) v.driftBar.style.width = Math.min(100, k.driftCharge / 3.3 * 100) + '%';

      // contramão
      if (k.wrongWay > 1.2 && !k.finished) this.message(k, 'CONTRAMÃO!', 0.3, 'warn');

      if (v.msgTimer > 0) {
        v.msgTimer -= dt;
        if (v.msgTimer <= 0) v.msg.className = 'msg';
      }
    }
  }

  clear() { this.root.innerHTML = ''; }
}

// ---------- Minimapa ----------
export class Minimap {
  constructor(canvas, track) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.track = track;
    const b = track.bounds;
    const size = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    this.scale = (canvas.width - 30) / size;
    this.cx = (b.minX + b.maxX) / 2;
    this.cz = (b.minZ + b.maxZ) / 2;
    // pré-desenha a pista
    const bg = document.createElement('canvas');
    bg.width = canvas.width; bg.height = canvas.height;
    const c = bg.getContext('2d');
    c.lineJoin = c.lineCap = 'round';
    const path = () => {
      c.beginPath();
      for (let i = 0; i <= track.N; i += 2) {
        const j = i % track.N;
        const [x, y] = this.map(track.px[j], track.pz[j]);
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    };
    path(); c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 16; c.stroke();
    path(); c.strokeStyle = '#ffffff'; c.lineWidth = 11; c.stroke();
    path(); c.strokeStyle = track.theme.road; c.lineWidth = 7; c.stroke();
    const [sx, sy] = this.map(track.px[0], track.pz[0]);
    c.fillStyle = '#fff'; c.fillRect(sx - 5, sy - 5, 10, 10);
    c.fillStyle = '#111'; c.fillRect(sx - 5, sy - 5, 5, 5); c.fillRect(sx, sy, 5, 5);
    this.bg = bg;
  }

  map(x, z) {
    // norte = +z para cima; espelha x para manter a orientação da câmera
    return [this.canvas.width / 2 - (x - this.cx) * this.scale, this.canvas.height / 2 - (z - this.cz) * this.scale];
  }

  draw(karts) {
    const c = this.ctx;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.bg, 0, 0);
    const sorted = [...karts].sort((a, b) => (a.human ? 2 : a.netHuman ? 1 : 0) - (b.human ? 2 : b.netHuman ? 1 : 0));
    for (const k of sorted) {
      const [x, y] = this.map(k.pos.x, k.pos.z);
      c.beginPath();
      c.arc(x, y, k.human ? 8 : k.netHuman ? 7 : 5.5, 0, Math.PI * 2);
      c.fillStyle = k.ch.color;
      c.fill();
      c.lineWidth = k.human || k.netHuman ? 3 : 2;
      c.strokeStyle = k.human ? PLAYER_COLORS[k.playerIndex] : '#fff';
      c.stroke();
      if (k.human) {
        c.fillStyle = '#fff';
        c.font = 'bold 10px sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(k.playerIndex + 1), x, y + 0.5);
      }
    }
  }
}
