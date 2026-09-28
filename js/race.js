// Gerencia uma corrida: cena, karts, câmeras, regras, placar e renderização em tela dividida.
import * as THREE from 'three';
import { Track } from './track.js';
import { Kart } from './kart.js';
import { AIDriver } from './ai.js';
import { ItemSystem } from './items.js';
import { Obstacles } from './obstacles.js';
import { Effects } from './effects.js';
import { HUD, Minimap, layoutViewports } from './hud.js';
import { PlayerInput } from './input.js';
import { mountTouch, unmountTouch } from './touch.js';
import { CHARACTERS } from './characters.js';
import { getTrack } from './tracks.js';
import { audio } from './audio.js';
import { clamp, damp, dampAngle, lerp } from './utils.js';

const DIFF_SPEED = [0.84, 0.94, 1.0];
const DIFF_SKILL = [0.3, 0.55, 0.85];

export class Race {
  // cfg: { mode: 'race'|'gp'|'tt'|'demo', trackId, laps, difficulty, autoAccel,
  //        players: [{ char, source }], aiChars?: [charIndex], grid?: [charIndex...] }
  constructor(app, cfg) {
    this.app = app;
    this.cfg = cfg;
    this.def = getTrack(cfg.trackId);
    this.scene = new THREE.Scene();
    const nHum = cfg.players.length;
    this.track = new Track(this.def, this.scene, { shadows: nHum <= 2 });
    this.effects = new Effects(this.scene, this.def.theme);
    this.items = new ItemSystem(this, cfg.mode !== 'tt');
    this.obstacles = new Obstacles(this);
    this.obstacles.build(this.def.features, true);
    for (const f of this.def.features) if (f.type === 'items') this.items.addBoxRow(f.t);

    this.time = 0;
    this.raceTime = 0;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.finishOrder = 0;
    this.doneTimer = -1;
    this.finalLapAnnounced = false;

    // ---- karts
    this.karts = [];
    this.humans = [];
    this.drivers = new Map();
    const entries = [];
    cfg.players.forEach((p, i) => entries.push({ char: p.char, human: true, playerIndex: i, source: p.source }));
    if (cfg.mode !== 'tt') {
      const total = 8;
      const used = new Set(cfg.players.map(p => p.char));
      let pool = cfg.aiChars ? [...cfg.aiChars] : CHARACTERS.map((_, i) => i).filter(i => !used.has(i));
      while (entries.length < total) {
        if (!pool.length) pool = CHARACTERS.map((_, i) => i);
        entries.push({ char: pool.shift(), human: false });
      }
    }
    // ordem de largada: IA na frente, jogadores atrás (ou ordem do GP)
    let order;
    if (cfg.gridOrder) {
      order = [...entries].sort((a, b) => cfg.gridOrder.indexOf(a.human ? 'P' + a.playerIndex : a.char) - cfg.gridOrder.indexOf(b.human ? 'P' + b.playerIndex : b.char));
    } else {
      const ai = entries.filter(e => !e.human).sort(() => Math.random() - 0.5);
      const hum = entries.filter(e => e.human);
      order = ai.slice(0, Math.max(0, ai.length - 2)).concat(hum, ai.slice(Math.max(0, ai.length - 2)));
    }
    const tr = this.track;
    const rowGap = Math.max(2, Math.round(5.5 / tr.spacing));
    order.forEach((e, slot) => {
      const k = new Kart(this, CHARACTERS[e.char], { id: slot, human: e.human, playerIndex: e.playerIndex });
      const row = Math.floor(slot / 2) + 1;
      const lat = (slot % 2 === 0 ? -1 : 1) * tr.hw * 0.42 + (slot % 2 === 0 ? 0 : 0);
      k.placeAt(tr.wrap(-row * rowGap - (slot % 2) * Math.round(rowGap / 2)), lat);
      k.charIndex = e.char;
      k.gridSlot = slot;
      this.karts.push(k);
      if (e.human) {
        k.controller = new PlayerInput(e.source);
        this.humans.push(k);
        if (cfg.mode === 'tt') { k.item = 'turbo3'; k.itemCount = 3; }
      } else {
        const sk = cfg.mode === 'demo' ? 0.7 : DIFF_SKILL[cfg.difficulty ?? 1];
        this.drivers.set(k, new AIDriver(k, this, clamp(sk + (Math.random() - 0.5) * 0.3, 0, 1)));
      }
    });
    this.humans.sort((a, b) => a.playerIndex - b.playerIndex);

    // ---- câmeras
    this.rects = layoutViewports(this.humans.length || 1);
    this.views = [];
    const mkCam = () => new THREE.PerspectiveCamera(70, 16 / 9, 0.3, 2600);
    if (this.humans.length) {
      this.humans.forEach((k, i) => this.views.push({ k, cam: mkCam(), rect: this.rects[i], camH: k.heading, shake: 0, init: false }));
      if (this.humans.length === 3) this.views.push({ k: null, cam: mkCam(), rect: this.rects[3], overview: true });
    } else {
      this.views.push({ k: this.karts[0], cam: mkCam(), rect: this.rects[0], cinematic: true, camH: 0, shake: 0, shotTime: 0, shot: 0 });
    }

    // ---- HUD
    this.hud = this.humans.length ? new HUD(app.hudEl, this, this.humans, this.rects) : null;
    if (!this.humans.length) app.hudEl.innerHTML = '';
    this.minimap = null;
    if (this.humans.length) {
      this.minimap = new Minimap(app.minimapEl, this.track);
      this._placeMinimap();
    }
    // controles de toque (celular/tablet)
    const tk = this.humans.find(k => k.controller && k.controller.source === 'touch');
    if (tk) mountTouch(this.rects[this.humans.indexOf(tk)], () => app.pause());

    this.engines = cfg.mode === 'demo' ? [] : this.humans.map(() => audio.createEngine());
    if (cfg.mode !== 'demo') audio.startMusic(this.def.music);
    this.phaseTime = 0;
    this.countStep = -1;
  }

  _placeMinimap() {
    const el = this.app.minimapEl;
    el.style.display = 'block';
    const n = this.humans.length;
    const s = el.style;
    s.left = s.right = s.top = s.bottom = s.transform = '';
    const touch = this.humans.some(k => k.controller && k.controller.source === 'touch');
    if (touch && n === 1) { s.left = '50%'; s.bottom = '6px'; s.transform = 'translateX(-50%)'; s.width = s.height = '120px'; }
    else if (n === 1) { s.right = '14px'; s.top = '50%'; s.transform = 'translateY(-50%)'; s.width = s.height = '210px'; }
    else if (n === 2) { s.right = '14px'; s.top = '50%'; s.transform = 'translateY(-50%)'; s.width = s.height = '180px'; }
    else if (n === 3) { s.left = '75%'; s.top = '75%'; s.transform = 'translate(-50%,-50%)'; s.width = s.height = 'min(40vh, 40vw)'; }
    else { s.left = '50%'; s.top = '50%'; s.transform = 'translate(-50%,-50%)'; s.width = s.height = '150px'; }
  }

  // ---------- Áudio posicional simples ----------
  sfxAt(name, obj, range = 35) {
    if (this.cfg.mode === 'demo') return;
    if (obj && obj.human) { audio.play(name); return; }
    const p = obj && obj.pos;
    if (!p) return;
    for (const h of this.humans) {
      if (h.pos.distanceToSquared(p) < range * range) { audio.play(name); return; }
    }
  }
  sfxAll(name) { if (this.cfg.mode !== 'demo') audio.play(name); }

  shake(k, amt) {
    const v = this.views.find(v => v.k === k);
    if (v) v.shake = Math.max(v.shake, amt);
  }

  hudEvent(k, type) {
    if (!this.hud) return;
    if (type === 'hit') this.shake(k, 0.3);
    if (type === 'ink') this.hud.message(k, 'SPLASH!', 1.2, 'warn');
    if (type === 'trick') this.hud.message(k, 'MANOBRA!', 1.0);
  }

  onLap(k, dir) {
    if (dir < 0) { k.lap--; return; }
    k.lap++;
    k.maxLap = Math.max(k.maxLap || 0, k.lap);
    if (this.phase !== 'racing') return;
    const laps = this.cfg.laps;
    if (k.lap >= 2 && k.lap === k.maxLap) {
      const lt = this.raceTime - k.lapStart;
      k.lapTimes.push(lt);
      k.lapStart = this.raceTime;
    }
    if (k.lap > laps && !k.finished) {
      k.finished = true;
      k.finishTime = this.raceTime;
      k.finishOrder = ++this.finishOrder;
      if (k.human) {
        k.controller = null;
        this.drivers.set(k, new AIDriver(k, this, 0.6));
        const place = this._placeOf(k);
        if (this.cfg.mode === 'tt') this.hud.message(k, 'CHEGADA!', 99);
        else this.hud.message(k, place === 1 ? '1º LUGAR!' : `CHEGADA! ${place}º`, 99);
        audio.play(place <= 3 || this.cfg.mode === 'tt' ? 'finish' : 'lose');
        this.effects.confetti(k.pos, 80);
        this.track.cheer = 1;
      }
    } else if (k.human && k.lap === k.maxLap && k.lap > 1) {
      if (k.lap === laps) {
        this.hud.message(k, 'VOLTA FINAL!', 2);
        audio.play('finallap');
        if (!this.finalLapAnnounced) { this.finalLapAnnounced = true; audio.setMusicRate(1.12); }
      } else {
        this.hud.message(k, `VOLTA ${k.lap}`, 1.4);
        audio.play('lap');
      }
    }
  }

  _placeOf(k) {
    this._rank();
    return k.place;
  }

  _rank() {
    const sorted = [...this.karts].sort((a, b) => {
      if (a.finished && b.finished) return a.finishOrder - b.finishOrder;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progressTotal - a.progressTotal;
    });
    sorted.forEach((k, i) => { k.place = i + 1; });
    this.sorted = sorted;
  }

  // ---------- Loop ----------
  update(dt) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    this.phaseTime += dt;
    const t = this.time;

    // fases
    if (this.phase === 'intro') {
      if (this.phaseTime > (this.cfg.mode === 'demo' ? 0 : 2.6)) { this.phase = 'countdown'; this.phaseTime = 0; }
    }
    if (this.phase === 'countdown') {
      if (this.cfg.mode === 'demo') { this.phase = 'racing'; this.phaseTime = 0; }
      else {
        const step = Math.floor(this.phaseTime);
        if (step !== this.countStep) {
          this.countStep = step;
          if (step < 3) {
            this.app.showCount(String(3 - step));
            this.track.setLamps(step + 1);
            audio.play('count');
          } else {
            this.app.showCount('JÁ!', true);
            this.track.setLamps(4);
            audio.play('go');
            this.phase = 'racing';
            this.phaseTime = 0;
            // largada turbo
            for (const k of this.karts) {
              if (k.human) {
                if (k.rocketCharge > 0.4 && k.rocketCharge < 2.1) { k.giveBoost(1.3, 'boost'); this.hud.message(k, 'LARGADA TURBO!', 1.2); }
              } else if (Math.random() < 0.4) k.giveBoost(0.8, null);
              k.lapStart = 0;
            }
          }
        }
      }
    }
    if (this.phase === 'racing' || this.phase === 'done') this.raceTime += dt;

    // entradas
    let pause = false;
    for (const k of this.humans) {
      if (k.controller) {
        const s = k.controller.poll();
        if (s.pausePressed) pause = true;
        let thr = s.throttle;
        if (this.cfg.autoAccel && s.brake < 0.5 && this.phase === 'racing') thr = 1;
        Object.assign(k.input, { steer: s.steer, throttle: thr, brake: s.brake, drift: s.drift, driftPressed: s.driftPressed, itemPressed: s.itemPressed });
      }
    }
    if (pause) this.app.pause();
    for (const [k, d] of this.drivers) {
      if (this.phase === 'countdown' || this.phase === 'intro') { k.input.throttle = 0; k.input.steer = 0; continue; }
      d.update(dt);
    }
    // ajuste de velocidade da IA (dificuldade + "elástico")
    this._rubberBand();

    for (const k of this.karts) k.update(dt, t);
    this._collisions();
    if (this.phase !== 'intro') {
      this.items.update(dt, t);
      this.obstacles.update(dt, t);
    }
    this._rank();

    this.track.update(dt, t);
    this.effects.update(dt, t);
    this.track.cheer = damp(this.track.cheer || 0.3, 0.3, 0.3, dt);

    this._updateCameras(dt);
    if (this.hud) this.hud.update(dt);
    if (this.minimap) this.minimap.draw(this.karts);
    this.engines.forEach((e, i) => { if (e) { const k = this.humans[i]; e.set(k.speed, k.boost > 0, this.phase !== 'intro'); } });

    // fim da corrida
    if (this.cfg.mode !== 'demo' && this.phase === 'racing' && this.humans.every(k => k.finished)) {
      this.phase = 'done';
      this.phaseTime = 0;
    }
    if (this.phase === 'done' && this.phaseTime > 3.5 && !this.resultsShown) {
      this.resultsShown = true;
      this.app.onRaceFinished(this);
    }
  }

  _rubberBand() {
    const base = this.cfg.mode === 'demo' ? 0.95 : DIFF_SPEED[this.cfg.difficulty ?? 1];
    let best = -Infinity, worst = Infinity;
    for (const h of this.humans) { best = Math.max(best, h.progressTotal); worst = Math.min(worst, h.progressTotal); }
    for (const [k] of this.drivers) {
      if (k.human) { k.speedFactor = 1; continue; }
      let f = base;
      if (this.humans.length && this.phase === 'racing') {
        const sp = this.track.spacing;
        const ahead = (k.progressTotal - best) * sp;
        const behind = (worst - k.progressTotal) * sp;
        if (ahead > 40) f *= 1 - Math.min(0.14, (ahead - 40) / 800);
        if (behind > 60) f *= 1 + Math.min(0.12, (behind - 60) / 700);
      }
      k.speedFactor = damp(k.speedFactor, f, 1, 1 / 60);
    }
  }

  _collisions() {
    const ks = this.karts;
    for (let i = 0; i < ks.length; i++) {
      const a = ks[i];
      if (a.respawning > 0 || a.falling) continue;
      for (let j = i + 1; j < ks.length; j++) {
        const b = ks[j];
        if (b.respawning > 0 || b.falling) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const d2 = dx * dx + dz * dz;
        const R = 2.3;
        if (d2 > R * R || Math.abs(a.pos.y - b.pos.y) > 2) continue;
        if (a.star > 0 && b.star <= 0) { b.hit('launch', a); continue; }
        if (b.star > 0 && a.star <= 0) { a.hit('launch', b); continue; }
        const d = Math.sqrt(d2) || 0.01;
        const nx = dx / d, nz = dz / d;
        const overlap = R - d;
        const wa = b.weight / (a.weight + b.weight), wb = 1 - wa;
        a.pos.x -= nx * overlap * wa; a.pos.z -= nz * overlap * wa;
        b.pos.x += nx * overlap * wb; b.pos.z += nz * overlap * wb;
        const rel = Math.abs(a.speed - b.speed);
        if (rel > 6) {
          if (a.speed > b.speed) { a.speed *= 0.9; b.speed = Math.min(b.speed + rel * 0.3 * wa, b.maxSpeedBase); }
          else { b.speed *= 0.9; a.speed = Math.min(a.speed + rel * 0.3 * wb, a.maxSpeedBase); }
          if (a.human || b.human) audio.play('bump');
        }
      }
    }
  }

  _updateCameras(dt) {
    const tr = this.track;
    for (const v of this.views) {
      const cam = v.cam;
      if (v.overview) {
        const a = this.time * 0.05;
        const R = tr.radius * 1.25;
        cam.position.set(tr.center.x + Math.cos(a) * R, tr.bounds.maxY + R * 0.9, tr.center.z + Math.sin(a) * R);
        cam.lookAt(tr.center.x, tr.bounds.minY, tr.center.z);
        cam.fov = 55;
        continue;
      }
      if (v.cinematic) { this._cinematic(v, dt); continue; }
      const k = v.k;
      const intro = this.phase === 'intro';
      const finished = k.finished;
      // direção da câmera acompanha o kart suavemente
      const targetH = k.heading + k.bodyYaw * 0.4;
      v.camH = v.init ? dampAngle(v.camH, targetH, k.airborne ? 3 : 6, dt) : targetH;
      const dist = 7.2 + Math.max(0, k.speed) * 0.035;
      const height = 3.0;
      let px = k.pos.x - Math.sin(v.camH) * dist;
      let pz = k.pos.z - Math.cos(v.camH) * dist;
      let py = k.pos.y + height;
      let lx = k.pos.x + Math.sin(v.camH) * 5, lz = k.pos.z + Math.cos(v.camH) * 5, ly = k.pos.y + 1.4;
      if (finished) {
        // gira em volta do kart ao terminar
        const a = this.time * 0.4 + k.playerIndex;
        px = k.pos.x + Math.sin(a) * 8; pz = k.pos.z + Math.cos(a) * 8; py = k.pos.y + 3;
        lx = k.pos.x; lz = k.pos.z; ly = k.pos.y + 1;
      }
      if (intro) {
        // voo de apresentação: começa na frente e gira para trás do kart
        const f = Math.min(1, this.phaseTime / 2.6);
        const e = f * f * (3 - 2 * f);
        const ang = k.heading + Math.PI * (1 - e) + (1 - e) * 0.8;
        const rr = lerp(10, dist, e);
        px = k.pos.x - Math.sin(ang) * rr; pz = k.pos.z - Math.cos(ang) * rr; py = k.pos.y + lerp(4.5, height, e);
        lx = k.pos.x; lz = k.pos.z; ly = k.pos.y + 1.2;
        v.init = false;
      }
      if (!v.init || intro) {
        cam.position.set(px, py, pz);
        v.init = !intro;
      } else {
        cam.position.x = damp(cam.position.x, px, 14, dt);
        cam.position.z = damp(cam.position.z, pz, 14, dt);
        cam.position.y = damp(cam.position.y, py, 7, dt);
      }
      // não deixa a câmera entrar no chão
      cam.position.y = Math.max(cam.position.y, k.proj.y + 1.2);
      if (v.shake > 0) {
        v.shake = Math.max(0, v.shake - dt);
        cam.position.x += (Math.random() - 0.5) * v.shake * 1.2;
        cam.position.y += (Math.random() - 0.5) * v.shake * 1.2;
      }
      cam.lookAt(lx, ly, lz);
      const fovT = 68 + clamp(k.speed / 50, 0, 1) * 6 + (k.boost > 0 ? 9 : 0);
      cam.fov = damp(cam.fov, fovT, 4, dt);
    }
  }

  _cinematic(v, dt) {
    v.shotTime -= dt;
    if (v.shotTime <= 0) {
      v.shotTime = 6;
      v.shot = (v.shot + 1) % 4;
      v.k = this.sorted ? this.sorted[Math.floor(Math.random() * Math.min(4, this.sorted.length))] : this.karts[0];
      v.camH = v.k.heading;
      v.side = Math.random() < 0.5 ? -1 : 1;
    }
    const k = v.k, cam = v.cam;
    v.camH = dampAngle(v.camH, k.heading, 3, dt);
    const fh = v.camH;
    let p;
    switch (v.shot) {
      case 0: p = [k.pos.x - Math.sin(fh) * 9, k.pos.y + 3.5, k.pos.z - Math.cos(fh) * 9]; break;
      case 1: p = [k.pos.x + Math.sin(fh) * 7 + Math.cos(fh) * v.side * 3, k.pos.y + 1.5, k.pos.z + Math.cos(fh) * 7 - Math.sin(fh) * v.side * 3]; break;
      case 2: p = [k.pos.x - Math.cos(fh) * v.side * 7, k.pos.y + 1.2, k.pos.z + Math.sin(fh) * v.side * 7]; break;
      default: p = [k.pos.x - Math.sin(fh) * 14, k.pos.y + 12, k.pos.z - Math.cos(fh) * 14];
    }
    if (v.shotTime > 5.95) cam.position.set(...p);
    else {
      cam.position.x = damp(cam.position.x, p[0], 5, dt);
      cam.position.y = damp(cam.position.y, p[1], 5, dt);
      cam.position.z = damp(cam.position.z, p[2], 5, dt);
    }
    cam.position.y = Math.max(cam.position.y, k.pos.y + 0.8);
    cam.lookAt(k.pos.x, k.pos.y + 1.2, k.pos.z);
    cam.fov = 60;
  }

  render(renderer) {
    const W = renderer.domElement.clientWidth, H = renderer.domElement.clientHeight;
    const pr = renderer.getPixelRatio();
    renderer.setScissorTest(true);
    for (const v of this.views) {
      const r = v.rect;
      const x = Math.floor(r.x * W), w = Math.ceil(r.w * W);
      const h = Math.ceil(r.h * H), y = Math.floor(H - (r.y + r.h) * H);
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      v.cam.aspect = w / h;
      v.cam.updateProjectionMatrix();
      this.track.sky.position.copy(v.cam.position);
      this.effects.prepareView(v.cam, h * pr);
      const focus = v.k ? v.k.pos : this.track.center;
      this.track.focusSun(focus);
      renderer.render(this.scene, v.cam);
    }
    renderer.setScissorTest(false);
  }

  results() {
    this._rank();
    const laps = this.cfg.laps;
    return this.sorted.map(k => {
      let time = k.finished ? k.finishTime : null;
      if (!k.finished) {
        const remaining = (laps + 1) * this.track.N - k.progressTotal;
        time = this.raceTime + Math.max(0, remaining * this.track.spacing) / 36;
      }
      return { kart: k, time, estimated: !k.finished };
    }).sort((a, b) => {
      if (a.kart.finished && b.kart.finished) return a.kart.finishOrder - b.kart.finishOrder;
      if (a.kart.finished) return -1;
      if (b.kart.finished) return 1;
      return a.time - b.time;
    });
  }

  dispose() {
    for (const e of this.engines) if (e) e.stop();
    audio.stopMusic();
    for (const k of this.karts) k.dispose();
    this.items.dispose();
    this.obstacles.dispose();
    this.effects.dispose();
    this.track.dispose();
    if (this.hud) this.hud.clear();
    unmountTouch();
    this.app.minimapEl.style.display = 'none';
  }
}
