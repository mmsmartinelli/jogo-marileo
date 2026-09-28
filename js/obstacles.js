// Elementos das pistas: moedas, setas de turbo, rampas, barris rolantes,
// pilões esmagadores, gêiseres e poças.
import * as THREE from 'three';
import * as TX from './textures.js';
import { damp } from './utils.js';
import { COLORS } from './effects.js';
import { PigeonMeshes } from './pigeons.js';

export class Obstacles {
  constructor(race) {
    this.race = race;
    this.track = race.track;
    this.group = new THREE.Group();
    race.scene.add(this.group);
    this.coins = [];
    this.pads = [];
    this.ramps = [];
    this.barrels = [];
    this.crushers = [];
    this.geysers = [];
    this.puddles = [];
    this.flocks = [];
    this.danger = []; // lista para a IA desviar

    this.coinGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.16, 20).rotateX(Math.PI / 2);
    this.coinMat = new THREE.MeshStandardMaterial({ color: 0xffc81a, metalness: 0.9, roughness: 0.25, emissive: 0x6a4a00, emissiveIntensity: 0.6 });
    this.coinInner = new THREE.MeshStandardMaterial({ color: 0xffe066, metalness: 0.9, roughness: 0.2 });
    this.padTex = TX.boostPadTexture();
  }

  build(features, withCoins = true) {
    for (const f of features) {
      switch (f.type) {
        case 'coins': if (withCoins) this.addCoins(f); break;
        case 'boost': this.addPad(f); break;
        case 'ramp': this.addRamp(f); break;
        case 'barrel': this.addBarrel(f); break;
        case 'crusher': this.addCrusher(f); break;
        case 'geyser': this.addGeyser(f); break;
        case 'puddle': this.addPuddle(f); break;
        case 'pigeons': this.addPigeons(f); break;
      }
    }
    if (this.flocks.length) {
      this.pigeonMeshes = new PigeonMeshes(this.group, this.flocks.reduce((a, f) => a + f.birds.length, 0), 1.35);
      // já aparecem ciscando durante a apresentação da pista
      let n = 0;
      for (const f of this.flocks) for (const b of f.birds) this.pigeonMeshes.set(n++, b.pos.x, b.home.y + 0.05, b.pos.z, b.yaw);
      this.pigeonMeshes.commit();
    }
  }

  // Bando de pombos ciscando na pista: saem voando quando um kart chega perto.
  addPigeons(f) {
    const t = this.track;
    const start = Math.floor(f.t * t.N);
    const birds = [];
    let seed = Math.floor(f.t * 9973) + 11;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let k = 0; k < (f.count || 10); k++) {
      const i = t.wrap(start + Math.round((r() - 0.5) * 14 / t.spacing));
      const p = t.pointAtIdx(i, (r() * 1.6 - 0.8) * t.hw);
      birds.push({ home: p, pos: p.clone(), vel: new THREE.Vector3(), yaw: r() * 6.28, ph: r() * 6.28, walk: r() < 0.5 ? 1 : -1 });
    }
    const c = t.pointAtIdx(start);
    this.flocks.push({ birds, center: c, idx: start, state: 'ground', timer: 0 });
  }

  _frame(i) {
    const t = this.track;
    return { tx: t.tx[i], tz: t.tz[i], rx: t.rx[i], rz: t.rz[i], heading: Math.atan2(t.tx[i], t.tz[i]) };
  }

  addCoins(f) {
    const t = this.track;
    const start = Math.floor(f.t * t.N);
    const step = Math.max(1, Math.round(4 / t.spacing));
    for (let c = 0; c < f.count; c++) {
      const i = t.wrap(start + c * step);
      const p = t.pointAtIdx(i, (f.lat || 0) * t.hw);
      const m = new THREE.Mesh(this.coinGeo, this.coinMat);
      const star = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 5).rotateX(Math.PI / 2), this.coinInner);
      m.add(star);
      m.position.set(p.x, p.y + 1.2, p.z);
      m.castShadow = true;
      this.group.add(m);
      this.coins.push({ mesh: m, pos: p, active: true, timer: 0, phase: c * 0.4 });
    }
  }

  addPad(f) {
    const t = this.track;
    const p = t.pointAt(f.t, f.lat || 0);
    const fr = this._frame(p.idx);
    const tex = this.padTex.clone();
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xff9a00, emissiveMap: tex, emissiveIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 7).rotateX(-Math.PI / 2), mat);
    m.position.set(p.x, p.y + 0.06, p.z);
    m.rotation.y = fr.heading;
    m.receiveShadow = true;
    this.group.add(m);
    this.pads.push({ pos: new THREE.Vector3(p.x, p.y, p.z), fr, half: [2.8, 3.6], tex });
  }

  addRamp(f) {
    const t = this.track;
    const p = t.pointAt(f.t, f.lat || 0);
    const fr = this._frame(p.idx);
    const w = 9, len = 6, h = 1.5;
    const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(len, 0), new THREE.Vector2(len, h), new THREE.Vector2(0, 0.02)]);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
    // shape: x = comprimento, y = altura; extrude em z = largura → reorienta
    geo.translate(-len, 0, -w / 2);
    geo.rotateY(-Math.PI / 2);
    const tex = TX.rampTexture();
    tex.repeat.set(0.25, 0.25);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(p.x, p.y + 0.02, p.z);
    m.rotation.y = fr.heading;
    m.castShadow = true; m.receiveShadow = true;
    this.group.add(m);
    // setas luminosas nas laterais
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 0.4), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xff9900, emissiveIntensity: 0.6 }));
      post.position.set(p.x + fr.rx * s * (w / 2 + 0.4), p.y + 1.25, p.z + fr.rz * s * (w / 2 + 0.4));
      this.group.add(post);
    }
    this.ramps.push({ pos: new THREE.Vector3(p.x, p.y, p.z), fr, half: [w / 2, len / 2 + 0.5] });
  }

  addBarrel(f) {
    const t = this.track;
    const i = t.wrap(Math.floor(f.t * t.N));
    const kind = f.kind || 'barrel';
    let mesh, radius = 1.6;
    if (kind === 'barrel') {
      mesh = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x9a5a2a, roughness: 0.8 });
      const band = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8, roughness: 0.3 });
      const b = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.6, 18), wood);
      b.rotation.x = Math.PI / 2;
      mesh.add(b);
      for (const z of [-0.9, 0.9]) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.08, 6, 20), band);
        r.position.z = z;
        mesh.add(r);
      }
      radius = 1.5;
    } else if (kind === 'dogcart') {
      // carrinho de cachorro-quente atravessando a rua
      mesh = new THREE.Group();
      const red = new THREE.MeshStandardMaterial({ color: 0xe8262a, roughness: 0.5 });
      const yel = new THREE.MeshStandardMaterial({ color: 0xffc81a, roughness: 0.5 });
      const cart = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 1.8), red); cart.position.y = 1.5; mesh.add(cart);
      const band = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.35, 1.85), yel); band.position.y = 1.9; mesh.add(band);
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 1.9), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7, roughness: 0.3 })); top.position.y = 2.35; mesh.add(top);
      for (const x of [-1.1, 1.1]) for (const z of [-0.95, 0.95]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 14).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        w.position.set(x, 0.45, z); mesh.add(w);
      }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0xcccccc })); pole.position.y = 3.6; mesh.add(pole);
      const um = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1, 8), yel); um.position.y = 5; mesh.add(um);
      const hd = new THREE.Group(); hd.position.y = 2.75;
      const bun = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.6, 4, 8).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe0a050 }));
      const sau = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.0, 4, 8).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc0462a }));
      sau.position.y = 0.25; hd.add(bun, sau); mesh.add(hd);
      radius = 2.0;
    } else {
      const col = { boulder: 0x8a6a4a, snowball: 0xffffff, gumball: 0xff4fa3 }[kind] || 0x888888;
      const mat = kind === 'gumball'
        ? new THREE.MeshPhysicalMaterial({ color: col, clearcoat: 1, roughness: 0.2 })
        : new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, flatShading: kind === 'boulder' });
      const geo = kind === 'boulder' ? new THREE.DodecahedronGeometry(1.8, 1) : new THREE.SphereGeometry(1.8, 20, 14);
      mesh = new THREE.Mesh(geo, mat);
      radius = 1.8;
    }
    mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.group.add(mesh);
    const fr = this._frame(i);
    const b = { mesh, idx: i, fr, radius, speed: f.speed || 1, phase: this.barrels.length * 2.3 + f.t * 7, lat: 0, roll: 0, pos: new THREE.Vector3(), kind };
    this.barrels.push(b);
    this.danger.push(b);
  }

  addCrusher(f) {
    const t = this.track;
    const p = t.pointAt(f.t, f.lat || 0);
    const fr = this._frame(p.idx);
    const kind = f.kind || (this.track.def.id === 'doce' ? 'candy' : 'stone');
    const g = new THREE.Group();
    const col = { candy: 0xff7ab8, stone: 0x7a7f8f, rock: 0x3a2a28 }[kind] || 0x7a7f8f;
    const block = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, flatShading: true }));
    block.position.y = 2.5;
    block.castShadow = true;
    g.add(block);
    // espinhos
    const spikeMat = new THREE.MeshStandardMaterial({ color: kind === 'candy' ? 0xffffff : 0x444450, roughness: 0.4 });
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6], [0, 0]]) {
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 6).rotateX(Math.PI), spikeMat);
      s.position.set(x, -0.3, z);
      g.add(s);
    }
    // rosto bravo nas faces
    const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff }), eyeB = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let face = 0; face < 4; face++) {
      const fg = new THREE.Group();
      fg.rotation.y = face * Math.PI / 2;
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), eyeW); e.position.set(sx * 1.1, 3.2, 2.51); fg.add(e);
        const pu = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), eyeB); pu.position.set(sx * 1.0, 3.1, 2.52); fg.add(pu);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 0.05), eyeB); brow.position.set(sx * 1.1, 3.95, 2.52); brow.rotation.z = sx * 0.35; fg.add(brow);
      }
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.05), eyeB); mouth.position.set(0, 1.5, 2.52); fg.add(mouth);
      g.add(fg);
    }
    g.position.set(p.x, p.y + 9, p.z);
    g.rotation.y = fr.heading;
    this.group.add(g);
    // sombra de aviso
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
    sh.position.set(p.x, p.y + 0.08, p.z);
    sh.rotation.y = fr.heading;
    this.group.add(sh);
    const c = { mesh: g, shadow: sh, pos: new THREE.Vector3(p.x, p.y, p.z), phase: f.phase || 0, h: 9, landed: false, radius: 3.2, idx: p.idx, lat: (f.lat || 0) * this.track.hw };
    this.crushers.push(c);
    this.danger.push(c);
  }

  addGeyser(f) {
    const t = this.track;
    const p = t.pointAt(f.t, f.lat || 0);
    const kind = f.kind || 'fire';
    const colors = { fire: [0xff6a1a, 0xffd04a], sand: [0xd9a441, 0xffe0a0], water: [0x3fa9ff, 0xbfe8ff] }[kind];
    const g = new THREE.Group();
    g.position.set(p.x, p.y, p.z);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.45, 8, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3030, roughness: 0.9, flatShading: true }));
    rim.position.y = 0.2;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: colors[0] }));
    hole.position.y = 0.1;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.0, 12, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: colors[1], transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    col.position.y = 6;
    col.visible = false;
    g.add(rim, hole, col);
    this.group.add(g);
    const gz = { mesh: g, col, hole, pos: new THREE.Vector3(p.x, p.y, p.z), phase: f.phase || 0, active: false, radius: 2.6, kind, colors: colors.map(c => new THREE.Color(c)), idx: p.idx, lat: (f.lat || 0) * t.hw };
    this.geysers.push(gz);
    this.danger.push(gz);
  }

  addPuddle(f) {
    const t = this.track;
    const p = t.pointAt(f.t, f.lat || 0);
    const fr = this._frame(p.idx);
    const kind = f.kind || 'mud';
    const col = { mud: 0x5a3a1e, quicksand: 0xc99a50, ice: 0xbfeaff, syrup: 0xff5fa8, poop: 0xf3f0e4 }[kind];
    const mat = new THREE.MeshPhysicalMaterial({ color: col, roughness: kind === 'ice' ? 0.05 : 0.4, clearcoat: kind === 'mud' ? 0.3 : 1, transparent: kind === 'ice', opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(new THREE.CircleGeometry(4, 24).rotateX(-Math.PI / 2), mat);
    m.scale.set(1, 1, 1.6);
    m.position.set(p.x, p.y + 0.05, p.z);
    m.rotation.y = fr.heading;
    m.receiveShadow = true;
    this.group.add(m);
    if (kind === 'poop') {
      // cocô de pombo: manchas brancas com miolo cinza
      m.material.color.set(0xf3f0e4); m.material.clearcoat = 0.6;
      const dot = new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3 });
      for (let k = 0; k < 6; k++) {
        const d = new THREE.Mesh(new THREE.CircleGeometry(0.4 + (k % 3) * 0.25, 10).rotateX(-Math.PI / 2), dot);
        d.position.set(Math.sin(k * 2.4) * 2.2, 0.02, Math.cos(k * 1.7) * 2.2);
        m.add(d);
      }
      m.scale.set(1, 1, 1.6);
    }
    this.puddles.push({ pos: new THREE.Vector3(p.x, p.y, p.z), fr, kind, half: [4, 6.4], mesh: m });
  }

  // (x,z) do kart no referencial local de um elemento
  _local(k, o) {
    const dx = k.pos.x - o.pos.x, dz = k.pos.z - o.pos.z;
    return { side: dx * o.fr.rx + dz * o.fr.rz, along: dx * o.fr.tx + dz * o.fr.tz };
  }

  update(dt, t) {
    const race = this.race;
    // no modo online cada aparelho só cuida dos karts que ele mesmo controla
    const karts = race.karts.filter(k => !k.remote);
    const fx = race.effects;
    const track = this.track;

    for (const c of this.coins) {
      if (!c.active) {
        c.timer -= dt;
        if (c.timer <= 0) { c.active = true; c.mesh.visible = true; }
        continue;
      }
      c.mesh.rotation.y += dt * 3;
      c.mesh.position.y = c.pos.y + 1.2 + Math.sin(t * 3 + c.phase) * 0.15;
      for (const k of karts) {
        const dx = k.pos.x - c.pos.x, dz = k.pos.z - c.pos.z;
        if (dx * dx + dz * dz < 2.2 * 2.2 && Math.abs(k.pos.y - c.pos.y) < 3) {
          c.active = false; c.mesh.visible = false; c.timer = 12;
          if (k.coins < 10) { k.coins++; k.stats.maxCoins = Math.max(k.stats.maxCoins, k.coins); }
          fx.coinSparkle(c.mesh.position);
          k.sfx('coin');
          break;
        }
      }
    }

    for (const p of this.pads) {
      p.tex.offset.y = (p.tex.offset.y - dt * 1.5) % 1;
      for (const k of karts) {
        if (k.airborne) continue;
        const l = this._local(k, p);
        if (Math.abs(l.side) < p.half[0] && Math.abs(l.along) < p.half[1]) {
          if (k.boost < 0.6) k.giveBoost(1.0, 'boost');
          else k.boost = Math.max(k.boost, 1.0);
        }
      }
    }

    for (const k of karts) k.groundBonus = 0;
    for (const r of this.ramps) {
      for (const k of karts) {
        const l = this._local(k, r);
        if (Math.abs(l.side) > r.half[0]) continue;
        // sobe pela rampa (comprimento 6, altura 1.5)
        if (l.along > -6 && l.along < 0) k.groundBonus = 1.5 * (1 + l.along / 6);
        if (!k.airborne && k.speed > 8 && l.along > -0.8 && l.along < 1.2) {
          k.launch(8.5 + k.speed * 0.1, true);
          k.boost = Math.max(k.boost, 0.35);
        }
      }
    }

    for (const b of this.barrels) {
      const span = track.hw - 2;
      const prev = b.lat;
      b.lat = Math.sin(t * b.speed * 0.8 + b.phase) * span;
      const p = track.pointAtIdx(b.idx, b.lat);
      b.pos.copy(p);
      if (b.kind === 'dogcart') {
        b.mesh.position.set(p.x, p.y, p.z);
        b.mesh.rotation.y = b.fr.heading + Math.PI / 2;
        b.mesh.rotation.z = Math.sin(t * 9) * 0.03;
      } else {
        b.mesh.position.set(p.x, p.y + b.radius, p.z);
        b.mesh.rotation.y = b.fr.heading;
        b.roll += (b.lat - prev) / b.radius;
        b.mesh.rotation.z = -b.roll;
      }
      for (const k of karts) {
        const dx = k.pos.x - p.x, dz = k.pos.z - p.z;
        const r = b.radius + 1.2;
        if (dx * dx + dz * dz < r * r && k.pos.y - p.y < b.radius * 2) {
          if (k.star > 0) continue;
          if (k.hit('barrel')) fx.dust(k.pos, 6);
          // empurra para fora
          const d = Math.hypot(dx, dz) || 1;
          k.pos.x = p.x + dx / d * r;
          k.pos.z = p.z + dz / d * r;
        }
      }
    }

    const PERIOD = 3.4;
    for (const c of this.crushers) {
      const ph = ((t + c.phase) % PERIOD + PERIOD) % PERIOD;
      let h;
      if (ph < 1.3) h = 9;
      else if (ph < 1.55) h = 9 * (1 - Math.pow((ph - 1.3) / 0.25, 2));
      else if (ph < 2.4) h = 0;
      else h = 9 * ((ph - 2.4) / 1.0);
      const falling = ph >= 1.3 && ph < 1.6;
      if (h <= 0.01 && !c.landed) {
        c.landed = true;
        fx.dust(c.pos, 14);
        race.sfxAt('crush', c, 45);
        for (const k of karts) if (k.human && k.pos.distanceTo(c.pos) < 25) race.shake(k, 0.35);
      }
      if (h > 0.5) c.landed = false;
      c.h = h;
      const shake = h === 0 ? Math.sin(t * 60) * 0.05 : 0;
      c.mesh.position.set(c.pos.x + shake, c.pos.y + h + 0.3, c.pos.z);
      c.shadow.material.opacity = 0.15 + 0.4 * (1 - h / 9) + (ph > 0.9 && ph < 1.3 ? 0.2 : 0);
      for (const k of karts) {
        const dx = k.pos.x - c.pos.x, dz = k.pos.z - c.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < c.radius + 0.8) {
          if (falling && h < 3) { k.hit('squash'); }
          else if (h < 2.5) {
            // bloco no chão funciona como parede
            const r = c.radius + 0.8;
            k.pos.x = c.pos.x + dx / (d || 1) * r;
            k.pos.z = c.pos.z + dz / (d || 1) * r;
            if (k.speed > 12) { k.speed *= 0.5; k.sfx('bump'); }
          }
        }
      }
    }

    const GP = 4.2;
    for (const g of this.geysers) {
      const ph = ((t + g.phase) % GP + GP) % GP;
      const warn = ph > 2.2 && ph < 3.0;
      const active = ph >= 3.0;
      if (active && !g.active) race.sfxAt('geyser', g, 40);
      g.active = active;
      g.col.visible = active;
      if (active) {
        const k = (ph - 3.0) / 1.2;
        g.col.scale.set(1 + Math.sin(t * 30) * 0.08, Math.min(1, k * 5) * (1 - Math.max(0, k - 0.8) * 5), 1 + Math.cos(t * 25) * 0.08);
        g.col.position.y = 6 * g.col.scale.y;
        if (Math.random() < 0.8) fx.burst(g.pos.clone().setY(g.pos.y + 1), g.colors[Math.random() < 0.5 ? 0 : 1], 2, 12, 1.2, 0.8);
      }
      if (warn && Math.random() < 0.4) fx.sparks(g.pos, g.colors[0], 1);
      g.hole.material.color.copy(g.colors[0]).multiplyScalar(warn || active ? 1.3 : 0.6);
      if (active) {
        for (const k of karts) {
          const dx = k.pos.x - g.pos.x, dz = k.pos.z - g.pos.z;
          if (dx * dx + dz * dz < (g.radius + 0.9) ** 2) k.hit('launch');
        }
      }
    }

    if (this.flocks.length) this._updatePigeons(dt, t, karts);

    for (const p of this.puddles) {
      for (const k of karts) {
        if (k.airborne || k.star > 0) continue;
        const l = this._local(k, p);
        const e = (l.side / p.half[0]) ** 2 + (l.along / p.half[1]) ** 2;
        if (e < 1) {
          if (p.kind === 'ice') k.slip = Math.max(k.slip, 0.35);
          else if (k.boost <= 0) {
            k.speed = damp(k.speed, Math.min(k.speed, 17), 3, dt);
            if (Math.random() < 0.3) fx.dust(k.pos, 1, new THREE.Color(p.mesh.material.color));
          }
        }
      }
    }
  }

  _updatePigeons(dt, t, karts) {
    const race = this.race, fx = race.effects;
    const all = race.karts;
    const pm = this.pigeonMeshes;
    let n = 0;
    for (const f of this.flocks) {
      f.timer += dt;
      if (f.state === 'ground') {
        // qualquer kart assusta o bando (também os de outros aparelhos, para todo mundo ver)
        let scarer = null;
        for (const k of all) {
          if (Math.abs(k.speed) < 4) continue;
          for (const b of f.birds) {
            const dx = k.pos.x - b.pos.x, dz = k.pos.z - b.pos.z;
            if (dx * dx + dz * dz < 13 * 13) { scarer = k; break; }
          }
          if (scarer) break;
        }
        if (scarer) this._scare(f, scarer, fx, karts);
      } else if (f.state === 'fly') {
        let near = false;
        for (const k of all) if (k.pos.distanceToSquared(f.center) < 55 * 55) { near = true; break; }
        if (f.timer > 7 && !near) { f.state = 'land'; f.timer = 0; }
      } else if (f.state === 'land' && f.timer > 2.2) {
        f.state = 'ground'; f.timer = 0;
      }
      for (const b of f.birds) {
        if (f.state === 'ground') {
          // anda devagarinho bicando o chão
          const wob = Math.sin(t * 0.8 + b.ph);
          b.yaw += dt * 0.6 * b.walk * (wob > 0.3 ? 1 : 0);
          const stepV = Math.max(0, Math.sin(t * 7 + b.ph)) * 0.5 * (wob > 0.3 ? 1 : 0);
          b.pos.x += Math.sin(b.yaw) * stepV * dt; b.pos.z += Math.cos(b.yaw) * stepV * dt;
          if (b.pos.distanceToSquared(b.home) > 9) b.yaw = Math.atan2(b.home.x - b.pos.x, b.home.z - b.pos.z);
          const peck = wob <= 0.3 ? Math.max(0, Math.sin(t * 6 + b.ph)) ** 5 : 0;
          pm.set(n++, b.pos.x, b.home.y + 0.05, b.pos.z, b.yaw, { peck });
        } else if (f.state === 'fly') {
          b.vel.y = Math.max(3, b.vel.y - dt * 3);
          b.pos.addScaledVector(b.vel, dt);
          if (b.pos.y > b.home.y + 60) { pm.hide(n++); continue; }
          pm.set(n++, b.pos.x, b.pos.y, b.pos.z, Math.atan2(b.vel.x, b.vel.z), { fly: true, flap: Math.sin(t * 24 + b.ph) * 1.0, pitch: -0.35 });
        } else {
          // voltando para o chão
          const k = Math.min(1, f.timer / 2.2), e = 1 - (1 - k) * (1 - k);
          const x = b.home.x + Math.sin(b.ph) * 20 * (1 - e), z = b.home.z + Math.cos(b.ph) * 20 * (1 - e);
          const y = b.home.y + 0.05 + 22 * (1 - e);
          b.pos.set(x, y, z);
          pm.set(n++, x, y, z, b.ph + Math.PI, { fly: k < 0.95, flap: Math.sin(t * 20 + b.ph) * 0.8, pitch: 0.2 });
          if (k >= 1) b.pos.copy(b.home);
        }
      }
    }
    pm.commit();
  }

  _scare(f, k, fx, localKarts) {
    const race = this.race;
    f.state = 'fly'; f.timer = 0;
    let close = false;
    for (const b of f.birds) {
      const dx = b.pos.x - k.pos.x, dz = b.pos.z - k.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      if (d < 4.5) close = true;
      const sp = 5 + Math.random() * 5;
      b.vel.set(dx / d * sp + Math.sin(k.heading) * 6, 7 + Math.random() * 5, dz / d * sp + Math.cos(k.heading) * 6);
    }
    fx.burst(f.birds[0].pos.clone().setY(f.center.y + 1.2), new THREE.Color(0xd6dae3), 18, 6, 0.5, 1.1);
    race.sfxAt('pigeons', f.birds[0], 45);
    if (!localKarts.includes(k)) return;
    k.stats.pigeons = (k.stats.pigeons || 0) + 1;
    // passou bem no meio do bando: um pombo "presenteia" a tela!
    if (close && k.human && k.star <= 0 && Math.random() < 0.6) {
      if (k.shield > 0) return;
      k.poop = 3.2;
      race.hudEvent(k, 'poop');
      k.sfx('poop');
    }
  }

  dispose() {
    this.race.scene.remove(this.group);
    this.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
}
