// Caixas surpresa, itens e armadilhas.
import * as THREE from 'three';
import * as TX from './textures.js';
import { COLORS } from './effects.js';

export const ITEMS = {
  turbo: { icon: '⚡', name: 'Turbo' },
  turbo3: { icon: '⚡', name: 'Turbo Triplo' },
  escudo: { icon: '🛡️', name: 'Escudo' },
  estrela: { icon: '⭐', name: 'Estrela' },
  banana: { icon: '🍌', name: 'Banana' },
  oleo: { icon: '🛢️', name: 'Óleo' },
  caixa: { icon: '🎁', name: 'Caixa Falsa' },
  foguete: { icon: '🚀', name: 'Foguete' },
  tinta: { icon: '🦑', name: 'Tinta de Lula' },
};
export const ITEM_KEYS = Object.keys(ITEMS);

// p = 0 (primeiro lugar) ... 1 (último)
function weights(p) {
  return {
    banana: 30 * (1 - p) + 5,
    oleo: 16 * (1 - p) + 4,
    caixa: 14 * (1 - p) + 2,
    escudo: 14 * (1 - p) + 8,
    turbo: 10 + 22 * p,
    turbo3: Math.max(0, 30 * (p - 0.3)),
    foguete: p < 0.05 ? 2 : 8 + 16 * p,
    tinta: p < 0.05 ? 0 : 4 + 10 * p,
    estrela: Math.max(0, 26 * (p - 0.45)),
  };
}

export function rollItem(place, total) {
  const p = total > 1 ? (place - 1) / (total - 1) : 0.5;
  const w = weights(p);
  let sum = 0;
  for (const k in w) sum += w[k];
  let r = Math.random() * sum;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return 'banana';
}

export class ItemSystem {
  constructor(race, enabled = true) {
    this.race = race;
    this.scene = race.scene;
    this.enabled = enabled;
    this.boxes = [];
    this.hazards = [];
    this.missiles = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.boxGeo = new THREE.BoxGeometry(1.7, 1.7, 1.7);
    const tex = TX.itemBoxTexture(false);
    this.boxMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.3, transparent: true, opacity: 0.92 });
    const ftex = TX.itemBoxTexture(true);
    this.fakeMat = new THREE.MeshStandardMaterial({ map: ftex, emissive: 0xffffff, emissiveMap: ftex, emissiveIntensity: 0.35, roughness: 0.3 });
    this.coreGeo = new THREE.IcosahedronGeometry(0.45, 0);
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // banana
    this.bananaGeo = new THREE.TorusGeometry(0.55, 0.2, 8, 14, Math.PI * 0.95);
    this.bananaMat = new THREE.MeshStandardMaterial({ color: 0xffd93b, roughness: 0.45 });
    this.bananaTip = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
    // óleo
    this.oilGeo = new THREE.CircleGeometry(2.6, 20).rotateX(-Math.PI / 2);
    this.oilMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b12, roughness: 0.05, clearcoat: 1, metalness: 0.4, iridescence: 1, iridescenceIOR: 1.6, polygonOffset: true, polygonOffsetFactor: -3 });
  }

  // Coloca fileiras de caixas surpresa.
  addBoxRow(t) {
    if (!this.enabled) return;
    const track = this.race.track;
    for (const lat of [-0.6, -0.2, 0.2, 0.6]) {
      const p = track.pointAt(t, lat);
      const mesh = new THREE.Mesh(this.boxGeo, this.boxMat);
      mesh.castShadow = true;
      const core = new THREE.Mesh(this.coreGeo, this.coreMat);
      mesh.add(core);
      mesh.position.set(p.x, p.y + 1.5, p.z);
      mesh.rotation.set(0.5, Math.random() * 6, 0.3);
      this.group.add(mesh);
      this.boxes.push({ mesh, pos: new THREE.Vector3(p.x, p.y, p.z), active: true, timer: 0, phase: Math.random() * 6, index: this.boxes.length });
    }
  }

  // ---------- Uso ----------
  use(k) {
    const item = k.item;
    if (!item) return;
    const race = this.race;
    k.itemCount--;
    k.stats.itemsUsed++;
    if (k.itemCount <= 0) { k.item = null; k.itemCount = 0; }
    switch (item) {
      case 'turbo':
      case 'turbo3':
        k.giveBoost(1.35, 'boost');
        break;
      case 'escudo':
        k.shield = 10;
        k.sfx('shield');
        break;
      case 'estrela':
        k.star = 7;
        k.invuln = 0;
        k.sfx('star');
        break;
      case 'banana':
      case 'caixa':
      case 'oleo':
        this.dropHazard(k, item);
        k.sfx('drop');
        break;
      case 'foguete':
        this.fireMissile(k);
        break;
      case 'tinta':
        this.applyInk(k, true);
        break;
    }
  }

  // Tinta de lula: suja a tela de quem está à frente de `k`.
  applyInk(k, local) {
    const race = this.race;
    const victims = race.karts.filter(o => o !== k && !o.finished && o.place < k.place);
    const list = victims.length ? victims : race.karts.filter(o => o !== k && !o.finished);
    for (const o of list) {
      if (o.remote || o.star > 0) continue;
      if (o.shield > 0) { o.shield = 0; o.sfx('shieldBreak'); continue; }
      o.ink = 4.5;
      if (o.human) race.hudEvent(o, 'ink');
    }
    race.sfxAll('ink');
    if (local) {
      k.stats.hits += Math.min(1, list.length);
      if (race.netSync) race.netSync.event({ e: 'ink', owner: k.id });
    }
  }

  dropHazard(k, type) {
    const race = this.race;
    const track = race.track;
    const back = 3.0;
    const x = k.pos.x - Math.sin(k.heading) * back;
    const z = k.pos.z - Math.cos(k.heading) * back;
    const idx = track.findNearest(x, z, k.idx);
    const pr = track.project(x, z, idx, {});
    const id = race.netSync ? race.netSync.newId() : null;
    this.addHazard(type, x, pr.y, z, k, id);
    if (race.netSync) race.netSync.event({ e: 'haz', id, type, x, y: pr.y, z, owner: k.id });
  }

  // Cria uma armadilha (local ou vinda de outro aparelho).
  addHazard(type, x, y, z, owner, id = null) {
    const pos = new THREE.Vector3(x, y, z);
    let mesh, radius;
    if (type === 'banana') {
      mesh = new THREE.Group();
      const b = new THREE.Mesh(this.bananaGeo, this.bananaMat);
      b.rotation.z = Math.PI * 0.05;
      b.position.y = 0.2;
      b.castShadow = true;
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), this.bananaTip);
      tip.position.set(0.55, 0.25, 0);
      mesh.add(b, tip);
      radius = 1.4;
    } else if (type === 'caixa') {
      mesh = new THREE.Mesh(this.boxGeo, this.fakeMat);
      mesh.castShadow = true;
      radius = 1.6;
    } else {
      mesh = new THREE.Mesh(this.oilGeo, this.oilMat);
      radius = 2.5;
    }
    mesh.position.copy(pos);
    if (type === 'caixa') mesh.position.y += 1.5;
    this.group.add(mesh);
    this.hazards.push({ id, type, mesh, pos, radius, owner, arm: 0.6, life: type === 'oleo' ? 25 : 60, drop: type !== 'oleo' ? 0.35 : 0 });
  }

  removeHazard(id) {
    const i = this.hazards.findIndex(h => h.id === id);
    if (i < 0) return;
    this.group.remove(this.hazards[i].mesh);
    this.hazards.splice(i, 1);
  }

  _hazardGone(h) {
    if (h.id && this.race.netSync) this.race.netSync.event({ e: 'hazX', id: h.id });
  }

  takeBox(i) {
    const b = this.boxes[i];
    if (!b || !b.active) return;
    b.active = false; b.timer = 2.2; b.mesh.visible = false;
    this.race.effects.burst(b.mesh.position, new THREE.Color().setHSL(Math.random(), 1, 0.6), 18, 8, 0.7, 0.6);
  }

  fireMissile(k) {
    const race = this.race;
    // alvo: quem está logo à frente
    let target = null;
    if (k.place > 1) target = race.karts.find(o => o.place === k.place - 1) || null;
    const r = v => Math.round(v * 100) / 100;
    const e = {
      id: race.netSync ? race.netSync.newId() : null, owner: k.id, target: target ? target.id : -1,
      x: r(k.pos.x + Math.sin(k.heading) * 2.5), y: r(k.pos.y + 1.2), z: r(k.pos.z + Math.cos(k.heading) * 2.5),
      h: r(k.heading), speed: r(Math.max(70, k.speed + 30)), idx: k.idx,
    };
    this.spawnMissile(e, true);
    if (race.netSync) race.netSync.event({ e: 'mis', ...e });
  }

  // Cria o foguete (local ou vindo de outro aparelho).
  spawnMissile(e, local) {
    const race = this.race;
    const owner = race.karts[e.owner];
    const target = e.target >= 0 ? race.karts[e.target] : null;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.3, metalness: 0.3 }));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    nose.position.z = 1.1;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    eyeL.position.set(0.14, 0.15, 0.7);
    const eyeR = eyeL.clone(); eyeR.position.x = -0.14;
    g.add(body, nose, eyeL, eyeR);
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0xffd23f }));
      fin.position.z = -0.7;
      fin.rotation.z = i * Math.PI / 2;
      fin.position.x = Math.cos(i * Math.PI / 2) * 0.3; fin.position.y = Math.sin(i * Math.PI / 2) * 0.3;
      g.add(fin);
    }
    const pos = new THREE.Vector3(e.x, e.y, e.z);
    g.position.copy(pos);
    this.group.add(g);
    this.missiles.push({ id: e.id, mesh: g, pos, owner, target, idx: e.idx, heading: e.h, life: 8, speed: e.speed });
    if (owner) owner.sfx('missile');
  }

  removeMissile(id, x, y, z) {
    const i = this.missiles.findIndex(m => m.id === id);
    if (i < 0) return;
    const m = this.missiles[i];
    m.pos.set(x, y, z);
    this.race.effects.explosion(m.pos);
    this.race.sfxAt('explosion', m);
    this.group.remove(m.mesh);
    this.missiles.splice(i, 1);
  }

  // ---------- Atualização ----------
  update(dt, t) {
    const race = this.race;
    const karts = race.karts;
    const fx = race.effects;
    const track = race.track;

    // caixas
    for (const b of this.boxes) {
      if (!b.active) {
        b.timer -= dt;
        if (b.timer <= 0) { b.active = true; b.mesh.visible = true; b.mesh.scale.setScalar(0.01); }
        continue;
      }
      const s = Math.min(1, b.mesh.scale.x + dt * 3);
      b.mesh.scale.setScalar(s);
      b.mesh.rotation.y += dt * 1.4;
      b.mesh.rotation.x += dt * 0.6;
      b.mesh.position.y = b.pos.y + 1.5 + Math.sin(t * 2.5 + b.phase) * 0.25;
      b.mesh.children[0].rotation.y -= dt * 3;
      for (const k of karts) {
        if (k.remote || k.respawning > 0 || k.falling) continue;
        const dx = k.pos.x - b.pos.x, dz = k.pos.z - b.pos.z;
        if (dx * dx + dz * dz < 2.4 * 2.4 && Math.abs(k.pos.y - b.pos.y) < 3.5) {
          this.takeBox(b.index);
          if (race.netSync) race.netSync.event({ e: 'box', i: b.index });
          if (!k.item && k.roulette <= 0 && !k.finished) {
            k.pendingItem = rollItem(k.place, karts.length);
            k.roulette = k.human ? 1.3 : 0.6;
            k.sfx('box');
          }
          break;
        }
      }
    }

    // armadilhas
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      h.arm -= dt;
      if (h.drop > 0) h.drop -= dt;
      if (h.type === 'caixa') { h.mesh.rotation.y += dt * 1.4; h.mesh.position.y = h.pos.y + 1.5 + Math.sin(t * 2.5) * 0.25; }
      if (h.type === 'banana') h.mesh.rotation.y += dt * 0.5;
      if (h.type === 'oleo') { const s = Math.min(1, (25 - h.life) * 4 + 0.2); h.mesh.scale.setScalar(s); }
      let remove = h.life <= 0;
      if (!remove) {
        for (const k of karts) {
          if (k.remote) continue;
          if (k === h.owner && h.arm > 0) continue;
          if (k.airborne && k.pos.y - h.pos.y > 1.5) continue;
          const dx = k.pos.x - h.pos.x, dz = k.pos.z - h.pos.z;
          const r = h.radius + 0.9;
          if (dx * dx + dz * dz < r * r) {
            if (h.type === 'oleo') {
              if (k.slip <= 0 && k.invuln <= 0 && k.star <= 0) {
                if (k.shield > 0) { k.hit('spin', h.owner); remove = true; }
                else { k.slip = 1.0; if (k.hit('spin', h.owner)) k.spin = 0.9; }
              }
            } else {
              k.hit(h.type === 'caixa' ? 'launch' : 'spin', h.owner);
              fx.burst(h.mesh.position, h.type === 'banana' ? new THREE.Color(0xffd93b) : new THREE.Color(0xff5555), 16, 7, 0.6, 0.5);
              if (h.type === 'caixa') fx.explosion(h.mesh.position);
              remove = true;
              break;
            }
          }
        }
      }
      if (remove) {
        this.group.remove(h.mesh);
        this.hazards.splice(i, 1);
        if (h.life > 0) this._hazardGone(h);
      }
    }

    // foguetes
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;
      let aim;
      const tg = m.target;
      if (tg && !tg.finished && tg.respawning <= 0) {
        const d = m.pos.distanceTo(tg.pos);
        if (d < 30) aim = tg.pos.clone().setY(tg.pos.y + 1);
        else {
          const ai = track.wrap(m.idx + 10);
          const tl = tg.proj.lat || 0;
          aim = track.pointAtIdx(ai, tl * 0.6).setY(track.py[ai] + 1.2);
        }
      } else {
        const ai = track.wrap(m.idx + 10);
        aim = track.pointAtIdx(ai, 0).setY(track.py[ai] + 1.2);
      }
      const dir = aim.clone().sub(m.pos);
      const want = Math.atan2(dir.x, dir.z);
      let dh = want - m.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      m.heading += dh * Math.min(1, dt * 8);
      m.pos.x += Math.sin(m.heading) * m.speed * dt;
      m.pos.z += Math.cos(m.heading) * m.speed * dt;
      m.idx = track.findNearest(m.pos.x, m.pos.z, m.idx);
      m.pos.y += ((track.py[m.idx] + 1.2) - m.pos.y) * Math.min(1, dt * 6);
      m.mesh.position.copy(m.pos);
      m.mesh.rotation.set(0, m.heading, Math.sin(t * 20) * 0.2);
      fx.boostFlame(m.pos.clone().addScaledVector(new THREE.Vector3(Math.sin(m.heading), 0, Math.cos(m.heading)), -1), new THREE.Vector3(-Math.sin(m.heading), 0, -Math.cos(m.heading)), 2);
      if (Math.random() < 0.5) fx.smoke(m.pos.clone(), 1);
      let boom = m.life <= 0;
      let sendBoom = false;
      for (const k of karts) {
        if (k.remote) continue;
        if (k === m.owner && m.life > 7.5) continue;
        if (k.pos.distanceToSquared(m.pos) < 2.6 * 2.6) {
          k.hit('launch', m.owner);
          boom = true;
          sendBoom = true;
          break;
        }
      }
      // explode em armadilhas pelo caminho
      for (let j = this.hazards.length - 1; j >= 0 && !boom; j--) {
        const h = this.hazards[j];
        if (h.type !== 'oleo' && h.pos.distanceToSquared(m.pos) < 4) {
          this.group.remove(h.mesh);
          this.hazards.splice(j, 1);
          this._hazardGone(h);
          boom = true;
          sendBoom = true;
        }
      }
      if (boom) {
        if (sendBoom && m.id && race.netSync) race.netSync.event({ e: 'misX', id: m.id, x: m.pos.x, y: m.pos.y, z: m.pos.z });
        fx.explosion(m.pos);
        race.sfxAt('explosion', m);
        this.group.remove(m.mesh);
        this.missiles.splice(i, 1);
      }
    }
  }

  // Usado pela IA para saber se há alguém logo atrás.
  someoneBehind(k, range = 25) {
    return this.race.karts.some(o => o !== k && o.place === k.place + 1 && o.pos.distanceTo(k.pos) < range);
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(o => { if (o.geometry && o.geometry !== this.boxGeo) o.geometry.dispose(); });
    this.boxGeo.dispose();
  }
}
