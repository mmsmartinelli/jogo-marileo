// Física arcade do kart + animação do modelo 3D.
import * as THREE from 'three';
import { buildKart } from './characters.js';
import { clamp, damp, dampAngle, wrapAngle } from './utils.js';
import { COLORS } from './effects.js';

export const BASE_SPEED = 42;
const GRAVITY = 34;
const DRIFT_LEVELS = [1.0, 2.1, 3.3];
const DRIFT_COLORS = [COLORS.spark1, COLORS.spark2, COLORS.spark3];
const DRIFT_BOOST = [0, 0.7, 1.15, 1.7];

const _v = new THREE.Vector3();

export class Kart {
  constructor(race, ch, opts = {}) {
    this.race = race;
    this.ch = ch;
    this.id = opts.id ?? 0;
    this.human = !!opts.human;
    this.playerIndex = opts.playerIndex ?? -1;
    this.model = buildKart(ch);
    race.scene.add(this.model.root);

    const st = ch.stats;
    this.maxSpeedBase = BASE_SPEED * (0.93 + st.speed * 0.024);
    this.accel = 26 + st.accel * 4.5;
    this.turn = 1.85 + st.handling * 0.1;
    this.weight = 0.7 + st.weight * 0.15;
    this.speedFactor = 1; // ajuste da IA / dificuldade

    this.pos = new THREE.Vector3();
    this.heading = 0;
    this.moveAngle = 0;
    this.speed = 0;
    this.vy = 0;
    this.airborne = false;
    this.falling = false;
    this.idx = 0;
    this.proj = {};
    this.lap = 0;
    this.progressTotal = 0;
    this.finished = false;
    this.finishTime = 0;
    this.place = 1;
    this.item = null;
    this.itemCount = 0;
    this.roulette = 0;
    this.pendingItem = null;
    this.boost = 0;
    this.drifting = false;
    this.driftDir = 0;
    this.driftCharge = 0;
    this.driftLevel = 0;
    this.spin = 0;
    this.spinAngle = 0;
    this.shield = 0;
    this.star = 0;
    this.ink = 0;
    this.poop = 0;
    this.squash = 0;
    this.invuln = 0;
    this.slip = 0;
    this.coins = 0;
    this.respawning = 0;
    this.trickReady = false;
    this.trickDone = false;
    this.trickAnim = 0;
    this.wrongWay = 0;
    this.lapStart = 0;
    this.lapTimes = [];
    this.stats = { hits: 0, miniTurbos: 0, tricks: 0, falls: 0, barrelHits: 0, crushed: 0, itemsUsed: 0, maxCoins: 0, pigeons: 0 };
    this.input = { steer: 0, throttle: 0, brake: 0, drift: false, driftPressed: false, itemPressed: false };
    this.steerVis = 0;
    this.bodyYaw = 0;
    this.wheelRot = 0;
    this.offroad = false;
    this.rocketCharge = 0;
    this.stuck = 0;
  }

  get track() { return this.race.track; }

  placeAt(idx, lat) {
    const t = this.track;
    this.idx = t.wrap(idx);
    const p = t.pointAtIdx(this.idx, lat);
    this.pos.copy(p);
    this.heading = this.moveAngle = t.headingAt(this.idx);
    this.speed = 0;
    this.vy = 0;
    this.airborne = false;
    t.project(this.pos.x, this.pos.z, this.idx, this.proj);
    this.lap = this.idx > t.N / 2 ? 0 : 1;
    this.progressTotal = this.lap * t.N + this.proj.progress;
    this.updateVisual(0, 0);
  }

  get forward() { return _v.set(Math.sin(this.heading), 0, Math.cos(this.heading)); }

  sfx(name) { this.race.sfxAt(name, this); }

  // ---------- Danos e efeitos ----------
  hit(type, cause = null) {
    if (this.finished && !this.human) return false;
    if (this.invuln > 0 || this.star > 0 || this.respawning > 0) return false;
    if (this.shield > 0) {
      this.shield = 0;
      this.sfx('shieldBreak');
      this.race.effects.burst(this.pos.clone().setY(this.pos.y + 1), new THREE.Color(0x88eeff), 30, 10, 0.8, 0.6);
      this.invuln = 0.5;
      return false;
    }
    this.drifting = false;
    this.driftCharge = 0;
    this.boost = 0;
    if (type === 'squash') {
      this.squash = 1.6;
      this.spin = 1.1;
      this.speed = 0;
      this.stats.crushed++;
      this.sfx('crush');
    } else if (type === 'launch') {
      this.spin = 1.5;
      this.vy = 11;
      this.airborne = true;
      this.trickReady = false;
      this.speed *= 0.25;
      this.sfx('hit');
    } else {
      this.spin = 1.15;
      this.speed *= 0.35;
      this.sfx('spin');
    }
    if (type === 'barrel') this.stats.barrelHits++;
    this.invuln = this.spin + 0.9;
    const lost = Math.min(this.coins, 2);
    if (lost > 0) {
      this.coins -= lost;
      for (let i = 0; i < lost; i++) this.race.effects.coinSparkle(this.pos.clone().setY(this.pos.y + 1.5));
    }
    if (cause && cause !== this) cause.stats.hits++;
    if (this.human) this.race.hudEvent(this, 'hit');
    return true;
  }

  giveBoost(t, sound = 'boost') {
    this.boost = Math.max(this.boost, t);
    if (sound) this.sfx(sound);
  }

  launch(vy, trick = true) {
    if (this.airborne) return;
    this.vy = vy;
    this.airborne = true;
    this.trickReady = trick;
    this.trickDone = false;
    this.sfx('jump');
  }

  respawn() {
    const t = this.track;
    // volta alguns metros para trás, no centro da pista
    const i = t.wrap(this.idx - 3);
    this.idx = i;
    const p = t.pointAtIdx(i, 0);
    this.pos.set(p.x, p.y + 7, p.z);
    this.heading = this.moveAngle = t.headingAt(i);
    this.speed = 0;
    this.vy = 0;
    this.falling = false;
    this.airborne = true;
    this.respawning = 1.2;
    this.drifting = false;
    this.spin = 0;
    this.invuln = 2.6;
    this.stuck = 0;
  }

  // Plaquinha com o nome do amigo flutuando sobre o kart.
  setNameTag(text, color = '#ffd23f') {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 34px "Lilita One", Arial Black, sans-serif';
    const w = Math.min(248, ctx.measureText(text).width + 36);
    ctx.fillStyle = 'rgba(20,22,60,0.85)';
    ctx.beginPath();
    ctx.roundRect((256 - w) / 2, 6, w, 50, 22);
    ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 33, 230);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(4, 1, 1);
    sp.position.y = 3.4;
    sp.renderOrder = 20;
    this.model.root.add(sp);
    this.nameTag = sp;
  }

  // ---------- Modo online ----------
  // Estado compacto enviado pela rede para os outros aparelhos.
  netState() {
    const f = (this.boost > 0 ? 1 : 0) | (this.drifting ? 2 : 0) | (this.shield > 0 ? 4 : 0) | (this.star > 0 ? 8 : 0)
      | (this.squash > 0 ? 16 : 0) | (this.airborne ? 32 : 0) | (this.finished ? 64 : 0) | (this.respawning > 0 ? 128 : 0);
    const r = v => Math.round(v * 100) / 100;
    return [this.id, r(this.pos.x), r(this.pos.y), r(this.pos.z), r(this.heading), r(this.speed), this.lap,
      r(this.progressTotal), f, r(this.spin), this.drifting ? this.driftDir * (this.driftLevel + 1) : 0, this.coins,
      this.finished ? r(this.finishTime) : -1, r(this.vy)];
  }

  applyNetState(s, now) {
    const [, x, y, z, h, speed, lap, prog, f, spin, drift, coins, finishTime, vy] = s;
    this.net = { x, y, z, h, speed, vy, at: now };
    if (!this.netInit) { this.pos.set(x, y, z); this.heading = this.moveAngle = h; this.netInit = true; }
    this.speed = speed;
    this.lap = lap;
    this.progressTotal = prog;
    this.boost = f & 1 ? Math.max(this.boost, 0.2) : 0;
    this.drifting = !!(f & 2);
    this.driftDir = Math.sign(drift);
    this.driftLevel = Math.max(0, Math.abs(drift) - 1);
    this.shield = f & 4 ? Math.max(this.shield, 3) : 0;
    this.star = f & 8 ? Math.max(this.star, 0.5) : 0;
    this.squash = f & 16 ? Math.max(this.squash, 0.3) : 0;
    this.airborne = !!(f & 32);
    this.respawning = f & 128 ? 0.5 : 0;
    this.spin = spin;
    this.coins = coins;
    if (finishTime >= 0 && !this.finished) {
      this.finished = true;
      this.finishTime = finishTime;
      this.finishOrder = ++this.race.finishOrder;
    }
  }

  // Kart de outro aparelho: segue a posição recebida, prevendo o movimento entre as mensagens.
  updateRemote(dt, t) {
    const n = this.net;
    const track = this.track;
    if (n) {
      const age = Math.min(0.25, (performance.now() - n.at) / 1000);
      const px = n.x + Math.sin(n.h) * n.speed * age;
      const pz = n.z + Math.cos(n.h) * n.speed * age;
      const far = (px - this.pos.x) ** 2 + (pz - this.pos.z) ** 2 > 20 * 20;
      if (far) this.pos.set(px, n.y, pz);
      this.pos.x = damp(this.pos.x, px, 14, dt);
      this.pos.z = damp(this.pos.z, pz, 14, dt);
      this.pos.y = damp(this.pos.y, n.y + (this.airborne ? n.vy * age : 0), 14, dt);
      this.heading = dampAngle(this.heading, n.h, 14, dt);
      this.moveAngle = this.heading;
    }
    this.idx = track.findNearest(this.pos.x, this.pos.z, this.idx);
    track.project(this.pos.x, this.pos.z, this.idx, this.proj);
    this.offroad = !this.airborne && Math.abs(this.proj.lat) > track.hw + 0.8;
    this.steerVis = damp(this.steerVis, this.drifting ? this.driftDir * 0.6 : 0, 8, dt);
    this.spin = Math.max(0, this.spin - dt);
    this.shield = Math.max(0, this.shield - dt);
    this.star = Math.max(0, this.star - dt);
    this.squash = Math.max(0, this.squash - dt);
    const fx = this.race.effects;
    if (this.drifting && this.driftLevel > 0 && !this.airborne) {
      for (const s of [-1, 1]) fx.sparks(this.wheelWorld(-1.1, s * 1.0), DRIFT_COLORS[Math.min(2, this.driftLevel - 1)], 1);
    }
    if (this.boost > 0) {
      const back = new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
      for (const s of [-0.32, 0.32]) fx.boostFlame(this.wheelWorld(-1.85, s, 1.0), back, 1);
    }
    if (this.offroad && Math.abs(this.speed) > 8 && Math.random() < 0.5) fx.dust(this.wheelWorld(-1.1, 1), 1);
    this.updateVisual(dt, t);
  }

  // ---------- Atualização ----------
  update(dt, t) {
    if (this.remote) { this.updateRemote(dt, t); return; }
    const race = this.race;
    const track = this.track;
    const inp = this.input;
    const fx = race.effects;

    this.boost = Math.max(0, this.boost - dt);
    this.spin = Math.max(0, this.spin - dt);
    this.shield = Math.max(0, this.shield - dt);
    this.star = Math.max(0, this.star - dt);
    this.ink = Math.max(0, this.ink - dt);
    this.poop = Math.max(0, this.poop - dt);
    this.squash = Math.max(0, this.squash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.slip = Math.max(0, this.slip - dt);

    if (this.roulette > 0) {
      this.roulette -= dt;
      if (this.roulette <= 0) {
        this.item = this.pendingItem;
        this.itemCount = this.item === 'turbo3' ? 3 : 1;
        this.pendingItem = null;
        if (this.human) this.sfx('item');
      }
    }

    // Contagem regressiva: só acumula a largada turbo.
    if (race.phase === 'countdown' || race.phase === 'intro' || race.phase === 'waiting') {
      if (race.phase === 'countdown') this.rocketCharge = inp.throttle > 0.5 ? this.rocketCharge + dt : 0;
      this.updateVisual(dt, t);
      return;
    }

    if (this.respawning > 0) {
      this.respawning -= dt;
      const p = track.pointAtIdx(this.idx, 0);
      if (this.respawning > 0.4) {
        this.pos.y = damp(this.pos.y, p.y + 3, 4, dt);
      } else {
        this.airborne = true;
        this.vy = Math.min(this.vy, -2);
      }
      if (this.respawning > 0.4) { this.updateVisual(dt, t); return; }
    }

    let steer = inp.steer, throttle = inp.throttle, brake = inp.brake;
    if (this.spin > 0 || this.squash > 0) { steer = 0; throttle = 0; brake = 0; }
    if (this.ink > 0 && !this.human) steer += Math.sin(t * 5 + this.id) * 0.35;

    // ---- superfície
    const pr = this.proj;
    const absLat = Math.abs(pr.lat || 0);
    this.offroad = !this.airborne && absLat > track.hw + 0.8 && !this.falling;
    let maxSpeed = this.maxSpeedBase * this.speedFactor * (1 + this.coins * 0.009);
    if (this.offroad && this.boost <= 0 && this.star <= 0) maxSpeed *= 0.52;
    if (this.boost > 0) maxSpeed *= 1.38;
    if (this.star > 0) maxSpeed *= 1.18;
    if (this.squash > 0) maxSpeed *= 0.5;

    // ---- aceleração
    if (this.boost > 0 && throttle >= 0) {
      this.speed = Math.max(this.speed, maxSpeed * 0.97);
    }
    if (throttle > 0.05) {
      if (this.speed < maxSpeed) this.speed = Math.min(maxSpeed, this.speed + this.accel * throttle * dt * (this.speed < 0 ? 2 : 1));
      else this.speed = damp(this.speed, maxSpeed, this.offroad ? 3 : 1.2, dt);
    } else if (brake > 0.05) {
      if (this.speed > 0.5) this.speed -= 48 * brake * dt;
      else this.speed = Math.max(-14, this.speed - 20 * brake * dt);
    } else {
      this.speed = damp(this.speed, 0, this.offroad ? 1.6 : 0.7, dt);
      if (this.speed > maxSpeed) this.speed = damp(this.speed, maxSpeed, 2, dt);
    }
    if (this.spin > 0) this.speed = damp(this.speed, 0, 2.5, dt);

    // ---- direção
    const sf = clamp(Math.abs(this.speed) / 12, 0, 1);
    const turnRate = this.turn * (1 - 0.22 * clamp(this.speed / 60, 0, 1));
    let yaw;
    if (this.drifting) {
      const inner = clamp(steer * this.driftDir, -1, 1);
      yaw = -this.driftDir * (0.72 + 0.5 * inner) * turnRate * 1.2;
    } else {
      yaw = -steer * turnRate * sf * Math.sign(this.speed || 1);
    }
    if (this.airborne) yaw *= 0.5;
    this.heading = wrapAngle(this.heading + yaw * dt);
    this.steerVis = damp(this.steerVis, steer, 10, dt);

    // ---- derrapagem
    if (!this.drifting && inp.drift && Math.abs(steer) > 0.3 && this.speed > 15 && !this.airborne && this.spin <= 0) {
      if (inp.driftPressed || this.driftQueued) {
        this.drifting = true;
        this.driftDir = Math.sign(steer);
        this.driftCharge = 0;
        this.driftLevel = 0;
        this.vy = 4.2; this.airborne = true; this.trickReady = false;
        this.driftQueued = false;
        if (this.human) this.sfx('drift');
      }
    }
    if (inp.driftPressed && !this.drifting) this.driftQueued = true;
    if (!inp.drift) this.driftQueued = false;
    if (this.drifting) {
      this.driftCharge += dt * (0.75 + 0.45 * Math.max(0, steer * this.driftDir));
      let lvl = 0;
      for (let k = 0; k < 3; k++) if (this.driftCharge > DRIFT_LEVELS[k]) lvl = k + 1;
      if (lvl > this.driftLevel && this.human) this.sfx('select');
      this.driftLevel = lvl;
      if (!inp.drift || this.speed < 10 || this.spin > 0) {
        this.drifting = false;
        if (this.driftLevel > 0) {
          this.giveBoost(DRIFT_BOOST[this.driftLevel], 'miniturbo');
          this.stats.miniTurbos++;
        }
        this.driftCharge = 0;
        this.driftLevel = 0;
      } else if (this.driftLevel > 0 && !this.airborne) {
        const c = DRIFT_COLORS[this.driftLevel - 1];
        for (const s of [-1, 1]) fx.sparks(this.wheelWorld(-1.1, s * 1.0), c, 1);
      } else if (!this.airborne && Math.random() < 0.5) {
        fx.dust(this.wheelWorld(-1.1, this.driftDir * -1.0), 1, COLORS.smoke);
      }
    }

    // ---- aderência
    let grip = this.drifting ? 3.2 : (track.def.icy ? 6 : 10);
    if (this.slip > 0) grip = 0.7;
    if (this.airborne) grip *= 0.3;
    this.moveAngle = dampAngle(this.moveAngle, this.heading, grip, dt);

    const vx = Math.sin(this.moveAngle) * this.speed, vz = Math.cos(this.moveAngle) * this.speed;
    this.pos.x += vx * dt;
    this.pos.z += vz * dt;

    // ---- restrição da pista
    const prevI = this.proj.i0 ?? this.idx;
    this.idx = track.findNearest(this.pos.x, this.pos.z, this.idx);
    track.project(this.pos.x, this.pos.z, this.idx, pr);
    const wallLat = track.edge - 1.05;
    if (track.def.walls && Math.abs(pr.lat) > wallLat) {
      const s = Math.sign(pr.lat);
      const ex = Math.abs(pr.lat) - wallLat;
      this.pos.x -= pr.rx * s * ex;
      this.pos.z -= pr.rz * s * ex;
      const vLat = (vx * pr.rx + vz * pr.rz) * s;
      if (vLat > 0) {
        const trackH = Math.atan2(pr.tx, pr.tz);
        const fwdDot = Math.sin(this.heading) * pr.tx + Math.cos(this.heading) * pr.tz;
        const along = fwdDot >= 0 ? trackH : trackH + Math.PI;
        if (vLat > 9) {
          this.speed *= 0.55;
          this.sfx('bump');
          fx.sparks(this.pos.clone().addScaledVector(new THREE.Vector3(pr.rx, 0, pr.rz), s * 1.2).setY(this.pos.y + 0.6), COLORS.spark2, 8);
          this.drifting = false;
          if (this.human) this.race.shake(this, 0.25);
        } else {
          this.speed *= 1 - clamp(vLat * 0.05, 0.01, 0.2);
        }
        this.heading = dampAngle(this.heading, along, 8, dt);
        this.moveAngle = dampAngle(this.moveAngle, along, 12, dt);
      }
      track.project(this.pos.x, this.pos.z, this.idx, pr);
    }
    if (track.def.lava && !this.falling && Math.abs(pr.lat) > track.edge + 1.0 && !this.airborne) {
      this.falling = true;
      this.airborne = true;
      this.vy = 2;
      this.drifting = false;
    }

    // ---- vertical
    const groundY = pr.y + (this.groundBonus || 0);
    if (this.falling) {
      this.vy -= GRAVITY * dt;
      this.pos.y += this.vy * dt;
      this.speed = damp(this.speed, 0, 1, dt);
      if (this.pos.y < track.lavaLevel + 0.3) {
        fx.splash(this.pos, new THREE.Color(0xff6a1a), 30);
        fx.smoke(this.pos, 8);
        this.sfx('splash');
        this.stats.falls++;
        this.coins = Math.max(0, this.coins - 2);
        this.respawn();
      }
    } else if (this.airborne) {
      this.vy -= GRAVITY * dt;
      this.pos.y += this.vy * dt;
      if (this.trickReady && !this.trickDone && (inp.driftPressed || inp.itemPressed && !this.item)) {
        this.trickDone = true;
        this.trickAnim = 0.45;
        this.sfx('trick');
      }
      if (this.pos.y <= groundY) {
        this.pos.y = groundY;
        if (this.vy < -9) { this.sfx('land'); fx.dust(this.pos, 6); }
        this.vy = 0;
        this.airborne = false;
        if (this.trickDone) {
          this.giveBoost(0.9, 'miniturbo');
          this.stats.tricks++;
          if (this.human) this.race.hudEvent(this, 'trick');
        }
        this.trickReady = false;
        this.trickDone = false;
        if (this.respawning > 0) this.respawning = 0;
      }
    } else {
      this.pos.y = groundY;
    }

    // ---- voltas
    const N = track.N;
    if (prevI > N * 0.75 && pr.i0 < N * 0.25) this.race.onLap(this, +1);
    else if (prevI < N * 0.25 && pr.i0 > N * 0.75) this.race.onLap(this, -1);
    this.progressTotal = this.lap * N + pr.progress;

    // ---- contramão
    const fd = Math.sin(this.heading) * pr.tx + Math.cos(this.heading) * pr.tz;
    this.wrongWay = fd < -0.3 && this.speed > 3 ? this.wrongWay + dt : 0;

    // ---- preso
    if (!this.human && race.phase === 'racing' && this.speed < 3 && this.spin <= 0 && this.squash <= 0) {
      this.stuck += dt;
      if (this.stuck > 3) this.respawn();
    } else this.stuck = 0;

    // ---- itens
    if (inp.itemPressed && this.item && this.roulette <= 0 && this.spin <= 0) {
      race.items.use(this);
    }

    // ---- efeitos
    if (this.offroad && Math.abs(this.speed) > 8 && Math.random() < 0.6) fx.dust(this.wheelWorld(-1.1, (Math.random() < 0.5 ? -1 : 1)), 1);
    if (this.boost > 0) {
      const back = new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
      for (const s of [-0.32, 0.32]) fx.boostFlame(this.wheelWorld(-1.85, s, 1.0), back, 1);
    }
    if (this.star > 0 && Math.random() < 0.6) {
      fx.sparks(this.pos.clone().setY(this.pos.y + 1 + Math.random()), new THREE.Color().setHSL((t * 2) % 1, 1, 0.6), 1);
    }

    this.updateVisual(dt, t);
  }

  wheelWorld(along, side, up = 0.1) {
    const s = Math.sin(this.heading), c = Math.cos(this.heading);
    // right = (-cos, sin)
    return new THREE.Vector3(this.pos.x + s * along - c * side, this.pos.y + up, this.pos.z + c * along + s * side);
  }

  updateVisual(dt, t) {
    const m = this.model;
    const track = this.track;
    m.root.position.copy(this.pos);
    m.root.rotation.y = this.heading;

    // inclinação conforme a rampa
    const i = this.proj.i0 ?? this.idx;
    const fd = Math.sin(this.heading) * track.tx[i] + Math.cos(this.heading) * track.tz[i];
    const pitch = this.airborne ? clamp(-this.vy * 0.02, -0.35, 0.35) : -Math.atan(track.slope[i] * fd);
    m.body.rotation.x = damp(m.body.rotation.x, pitch, 10, dt || 0.016);

    // guinada extra ao derrapar
    const yawT = this.drifting ? -this.driftDir * 0.4 : 0;
    this.bodyYaw = damp(this.bodyYaw, yawT, 8, dt || 0.016);
    if (this.spin > 0) this.spinAngle += dt * 14 * Math.min(1, this.spin + 0.2);
    else this.spinAngle = damp(this.spinAngle, Math.round(this.spinAngle / (Math.PI * 2)) * Math.PI * 2, 8, dt || 0.016);
    m.body.rotation.y = this.bodyYaw + this.spinAngle;

    // rolagem e manobra
    let roll = -this.steerVis * 0.06 * clamp(this.speed / 30, 0, 1);
    if (this.trickAnim > 0) {
      this.trickAnim = Math.max(0, this.trickAnim - dt);
      roll += (1 - this.trickAnim / 0.45) * Math.PI * 2;
    }
    m.body.rotation.z = roll;
    const bump = this.offroad ? Math.sin(t * 40) * 0.04 * clamp(this.speed / 20, 0, 1) : 0;
    m.body.position.y = bump + (this.drifting ? Math.sin(t * 30) * 0.02 : 0);

    // esmagado
    const sq = this.squash > 0 ? 0.3 : 1;
    m.body.scale.y = damp(m.body.scale.y, sq, 12, dt || 0.016);
    m.body.scale.x = m.body.scale.z = damp(m.body.scale.x, this.squash > 0 ? 1.25 : 1, 12, dt || 0.016);

    // rodas
    this.wheelRot += (this.speed * (dt || 0)) / 0.42;
    for (const sp of m.spinners) sp.g.rotation.x = this.wheelRot * (0.42 / sp.r);
    for (const p of m.steerPivots) p.rotation.y = -this.steerVis * 0.45;
    m.head.rotation.z = this.steerVis * 0.18;
    m.head.rotation.y = -this.steerVis * 0.25;
    m.driver.position.y = 0.95 + Math.sin(t * 9 + this.id) * 0.015 * clamp(this.speed / 20, 0, 1);

    // fogo do turbo
    const fl = this.boost > 0;
    for (const f of m.flames) {
      f.visible = fl;
      if (fl) f.scale.set(1, 1, 0.8 + Math.random() * 0.8);
    }
    // escudo
    m.shield.visible = this.shield > 0;
    if (this.shield > 0) {
      m.shield.rotation.y += (dt || 0) * 1.5;
      m.shield.children[1].rotation.x += (dt || 0) * 0.7;
      const blink = this.shield < 2 ? (Math.sin(t * 20) > 0 ? 1 : 0.3) : 1;
      m.shield.scale.setScalar(blink);
    }
    // estrela: cores do arco-íris
    if (this.star > 0) {
      const c = new THREE.Color().setHSL((t * 1.5) % 1, 1, 0.5);
      m.paint.emissive.copy(c);
      m.paint.emissiveIntensity = 0.8;
      m.accent.emissive.copy(c);
    } else if (m.paint.emissiveIntensity !== 0) {
      m.paint.emissive.set(0); m.accent.emissive.set(0); m.paint.emissiveIntensity = 0;
    }
    // pisca quando invulnerável após renascer
    m.root.visible = !(this.respawning > 0 || (this.invuln > 0 && this.spin <= 0 && this.squash <= 0)) || Math.sin(t * 30) > -0.3;

    // sombra no chão
    const gy = this.proj.y ?? this.pos.y;
    const h = Math.max(0, this.pos.y - gy);
    m.shadow.position.y = -h + 0.05;
    const ss = clamp(1 - h * 0.08, 0.3, 1);
    m.shadow.scale.set(ss, 1, ss);
    m.shadow.visible = !this.falling;
    m.shadow.rotation.y = 0;
  }

  dispose() {
    if (this.nameTag) { this.nameTag.material.map.dispose(); this.nameTag.material.dispose(); }
    this.race.scene.remove(this.model.root);
    this.model.paint.dispose();
    this.model.accent.dispose();
  }
}
