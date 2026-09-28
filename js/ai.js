// Pilotos controlados pelo computador.
import { clamp, wrapAngle } from './utils.js';

export class AIDriver {
  constructor(kart, race, skill = 0.5) {
    this.k = kart;
    this.race = race;
    this.skill = skill;
    this.lane = (Math.random() - 0.5) * 0.8;
    this.laneTarget = this.lane;
    this.laneTimer = 1 + Math.random() * 2;
    this.itemTimer = 0;
    this.itemDelay = 1 + Math.random() * 2;
    this.wasDrifting = false;
  }

  update(dt) {
    const k = this.k, race = this.race, tr = race.track;
    const inp = k.input;
    const hw = tr.hw;

    // escolhe uma faixa de tempos em tempos
    this.laneTimer -= dt;
    if (this.laneTimer <= 0) {
      this.laneTimer = 2 + Math.random() * 3;
      this.laneTarget = (Math.random() - 0.5) * 1.1;
      // procura caixas surpresa à frente se estiver sem item
      if (!k.item && k.roulette <= 0 && race.items.enabled) {
        let best = null, bd = Infinity;
        for (const b of race.items.boxes) {
          if (!b.active) continue;
          const d = b.pos.distanceTo(k.pos);
          if (d < 70 && d < bd) {
            const pr = tr.project(b.pos.x, b.pos.z, tr.findNearest(b.pos.x, b.pos.z, k.idx), {});
            const ahead = ((pr.progress - k.proj.progress) + tr.N) % tr.N;
            if (ahead > 3 && ahead < 40) { bd = d; best = pr.lat / hw; }
          }
        }
        if (best !== null) { this.laneTarget = best; this.laneTimer = 1.5; }
      }
    }

    // desvia de perigos
    let avoid = 0;
    const lookN = Math.round(40 / tr.spacing);
    const checkDanger = (idx, lat, r) => {
      const ahead = ((idx - k.idx) + tr.N) % tr.N;
      if (ahead < 2 || ahead > lookN) return;
      const myLat = this.lane * hw;
      if (Math.abs(myLat - lat) < r + 2.5) avoid += (myLat >= lat ? 1 : -1) * (1 - ahead / lookN);
    };
    for (const o of race.obstacles.danger) {
      const lat = o.lat !== undefined ? o.lat : 0;
      checkDanger(o.idx, lat, o.radius || 2);
    }
    for (const h of race.items.hazards) {
      if (h.owner === k && h.arm > 0) continue;
      if (h._idx === undefined) { h._idx = tr.findNearest(h.pos.x, h.pos.z, k.idx); h._lat = tr.project(h.pos.x, h.pos.z, h._idx, {}).lat; }
      checkDanger(h._idx, h._lat, h.radius);
    }
    const target = clamp(this.laneTarget + avoid * 0.9 * (0.5 + this.skill), -0.8, 0.8);
    this.lane += (target - this.lane) * Math.min(1, dt * 2.5);

    // ponto-alvo à frente
    const lookDist = 9 + k.speed * 0.42;
    const look = Math.max(3, Math.round(lookDist / tr.spacing));
    const ti = tr.wrap(k.idx + look);
    const tx = tr.px[ti] + tr.rx[ti] * this.lane * hw;
    const tz = tr.pz[ti] + tr.rz[ti] * this.lane * hw;
    const desired = Math.atan2(tx - k.pos.x, tz - k.pos.z);
    const diff = wrapAngle(desired - k.heading);

    // curvatura adiante
    const far = tr.wrap(k.idx + look * 3);
    const curve = wrapAngle(Math.atan2(tr.tx[far], tr.tz[far]) - Math.atan2(tr.tx[k.idx], tr.tz[k.idx]));

    let steer = clamp(-diff * 2.4, -1, 1);
    let throttle = 1, brake = 0;
    if (Math.abs(diff) > 1.0 && k.speed > 18) throttle = 0.3;
    if (Math.abs(diff) > 1.6) { throttle = 0; brake = k.speed > 10 ? 0.6 : 0; }
    // se estiver de ré/virado, acelera para girar
    if (Math.abs(diff) > 2.2 && k.speed < 5) { throttle = 1; }

    // derrapagem em curvas longas (pilotos habilidosos)
    let drift = false, driftPressed = false;
    if (this.skill > 0.45 && Math.abs(curve) > 0.55 && k.speed > 22 && !k.offroad) {
      drift = true;
      if (!this.wasDrifting) driftPressed = true;
      if (k.drifting) steer = clamp(-diff * 2.0, -1, 1);
    }
    if (k.drifting && (Math.abs(curve) < 0.2 || Math.sign(-curve) !== k.driftDir)) drift = false;
    this.wasDrifting = drift;

    // itens
    let itemPressed = false;
    if (k.item && k.roulette <= 0) {
      this.itemTimer += dt;
      if (this.itemTimer > this.itemDelay) {
        const it = k.item;
        const straight = Math.abs(curve) < 0.25 && Math.abs(diff) < 0.2;
        let use = false;
        if (it === 'turbo' || it === 'turbo3') use = straight;
        else if (it === 'escudo' || it === 'estrela') use = true;
        else if (it === 'banana' || it === 'oleo' || it === 'caixa') use = race.items.someoneBehind(k, 22) || this.itemTimer > 8;
        else if (it === 'foguete') use = k.place > 1;
        else if (it === 'tinta') use = k.place > 2 || this.itemTimer > 4;
        if (use) {
          itemPressed = true;
          this.itemTimer = 0;
          this.itemDelay = 0.5 + Math.random() * 2.5 * (1.2 - this.skill);
        }
      }
    }

    inp.steer = steer;
    inp.throttle = throttle;
    inp.brake = brake;
    inp.drift = drift;
    inp.driftPressed = driftPressed;
    inp.itemPressed = itemPressed;
  }
}
