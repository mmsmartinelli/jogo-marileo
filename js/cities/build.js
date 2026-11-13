// Monta qualquer pista como uma cidade: chão plano, calçadas, prédios no estilo da
// cidade, postes, árvores, enfeites de rua, mar (quando tem) e os MARCOS famosos,
// colocados sozinhos em lugares livres perto da pista (nunca em cima da pista).
import * as THREE from 'three';
import { lerp, smoothstep, clamp } from '../utils.js';
import { KITS } from './kits.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeMaterials, paint, box, cyl, cone, sphere, geo as geoMesh, Bag, SignAtlas, facadeTextures, isGlassFacade, buildingGeo, bakeObject, frustumGeo, gableGeo, UP } from './common.js';
import { LANDMARKS } from './landmarks.js';
import { PROPS } from './props.js';
import { PigeonMeshes } from '../pigeons.js';
import { buildOsascoBridge, buildOsascoRail } from './osasco.js';

// ---------- Antes do terreno: onde fica o mar ----------
export function prepareCity(track) {
  const def = track.def, th = def.theme;
  if (!th.water) return;
  const e = track.edge;
  // o mar fica do lado da reta de largada (avenida da praia!)
  let best = null;
  for (const sgn of [1, -1]) {
    const nx = track.rx[0] * sgn, nz = track.rz[0] * sgn;
    let mx = -Infinity;
    for (let i = 0; i < track.N; i++) mx = Math.max(mx, track.px[i] * nx + track.pz[i] * nz);
    const gap = mx - (track.px[0] * nx + track.pz[0] * nz);
    if (!best || gap < best.gap) best = { nx, nz, gap, mx };
  }
  const beachW = th.water.beachW ?? 20;
  track.shore = { nx: best.nx, nz: best.nz, d0: best.mx + e + 30 + beachW, beachW, color: th.water.color, beach: th.water.beach };
}

// Distância (com sinal) até a beira do mar: > 0 dentro da água.
export const shoreS = (track, x, z) => (track.shore ? x * track.shore.nx + z * track.shore.nz - track.shore.d0 : -1e9);

// ---------- Contexto de montagem ----------
export class CityCtx {
  constructor(track) {
    this.track = track;
    this.def = track.def;
    this.kitId = track.def.city === true ? 'osasco' : track.def.city;
    this.kit = KITS[this.kitId] || KITS.osasco;
    this.th = track.def.theme;
    this.glow = this.th.glow ?? 0.5;
    this.gl = track.def.groundY ?? -1.4;
    this.e = track.edge;
    this.rand = track.rand;
    this.group = track.group;
    this.N = track.N;
    this.reserved = [];
    this.placedB = [];
    this.placed = []; // marcos colocados
    this.warn = [];
    this.trees = [];
    this.mats = makeMaterials(this.glow);
    this.bag = new Bag();
    this.atlas = new SignAtlas(this.glow);
    this.blocks = {};
    this.roofBag = new Bag();
    this.anims = track.animated;
    this.footprints = []; // para a auditoria (nada pode encostar na pista)
    // pontos de vista ao longo da pista (para escolher lugares bem visíveis)
    this.views = [];
    const st = Math.max(1, Math.round(22 / track.spacing));
    for (let i = 0; i < this.N; i += st) this.views.push({ i, x: track.px[i], z: track.pz[i], tx: track.tx[i], tz: track.tz[i] });
  }
  P(c, cls = 'solid') { return paint(this.mats, c, cls); }
  reserve(x, z, r) { this.reserved.push({ x, z, r }); }
  isFree(x, z, r) {
    for (const q of this.reserved) if ((q.x - x) ** 2 + (q.z - z) ** 2 < (q.r + r) ** 2) return false;
    return true;
  }
  // corredor de visão: nada de prédio entre o ponto de vista e o marco
  reserveLine(x0, z0, x1, z1, r) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(L / (r * 0.9)));
    for (let k = 0; k <= n; k++) this.reserve(lerp(x0, x1, k / n), lerp(z0, z1, k / n), r);
  }
  near(x, z) { return this.track._nearestCoarse(x, z); }
  shoreS(x, z) { return shoreS(this.track, x, z); }
  world(obj, x, y, z) { obj.updateMatrixWorld(true); return new THREE.Vector3(x, y, z).applyMatrix4(obj.matrixWorld); }
  sign(text, width, height, o = {}) { return this.atlas.sign(this.mats, text, width, height, o); }
  signPlane(text, width, height, o = {}) { return new THREE.Mesh(this.atlas.plane(text, width, height, o), this.atlas.mat); }
  anim(fn) { this.anims.push(fn); }
  // pombos de enfeite (criados só quando algum marco usa)
  pigeons(n = 40, scale = 1) { return new PigeonMeshes(this.group, n, scale); }
  // árvore em coordenadas do mundo (s = escala)
  tree(x, z, s = 1, kind) { this.trees.push({ x, z, s, kind, check: true }); }
  // prédio com janelas (entra nos prédios juntados da cidade)
  addBuilding(b) {
    const type = b.type || this.kit.buildings.types[0];
    (this.blocks[type] = this.blocks[type] || []).push({ color: 0xffffff, ...b, type });
    this.placedB.push({ x: b.x, z: b.z, r: Math.max(b.w, b.d) * 0.72 });
  }
  // peça animada: junta as partes dela numa malha local e põe na cena
  dynamic(obj) {
    const baked = bakeObject(obj, { local: true });
    baked.position.copy(obj.position); baked.quaternion.copy(obj.quaternion); baked.scale.copy(obj.scale);
    if (obj.parent) { obj.parent.updateMatrixWorld(true); baked.applyMatrix4(obj.parent.matrixWorld); obj.parent.remove(obj); }
    this.group.add(baked);
    return baked;
  }
  // Junta um marco inteiro em poucas malhas (por material) e põe na cena.
  bake(obj) {
    const baked = bakeObject(obj);
    this.group.add(baked);
    if (obj.parent) obj.parent.remove(obj);
    return baked;
  }

  // ---------- Onde colocar os marcos ----------
  _visibility(cx, cz, hero, maxD) {
    let v = 0, bestJ = -1, bestS = 0;
    for (let j = 0; j < this.views.length; j++) {
      const vp = this.views[j];
      const dx = cx - vp.x, dz = cz - vp.z;
      const along = dx * vp.tx + dz * vp.tz;
      if (along < 40) continue;
      const dist = Math.hypot(dx, dz);
      if (dist > maxD) continue;
      const lat = Math.abs(dx * vp.tz - dz * vp.tx);
      const ang = Math.atan2(lat, along);
      if (ang > 0.5) continue;
      let s = (1 - ang / 0.5) * (dist < 110 ? 0.6 : 1);
      v += s;
      if (s > bestS) { bestS = s; bestJ = j; }
    }
    return { v, j: bestJ };
  }

  // Confere o terreno do marco (retângulo w x d com a frente virada para a pista).
  _footprintOK(cx, cz, rot, w, d, minRoad) {
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) {
      const lx = lerp(-w / 2, w / 2, a / 4), lz = lerp(-d / 2, d / 2, b / 4);
      const x = cx + lx * c + lz * s, z = cz - lx * s + lz * c;
      if (this.near(x, z).d < minRoad) return false;
    }
    return true;
  }

  findSpot(spec, hero) {
    const tr = this.track, e = this.e, N = this.N;
    const w = spec.w, d = spec.d;
    const R = Math.hypot(w, d) / 2;
    const far = spec.kind === 'far';
    const offs = spec.offs || (far ? [60, 95, 135, 180, 230] : [5, 12, 22, 36]);
    const step = Math.max(1, Math.round((far ? 14 : 9) / tr.spacing));
    const maxD = far ? 900 : 420;
    const shore = this.track.shore;
    let best = null;
    for (let i0 = 0; i0 < N; i0 += step) {
      const i = (i0 + Math.floor(this.rand() * step)) % N;
      for (const side of [-1, 1]) {
        for (const off of offs) {
          const lat = e + off + d / 2;
          const cx = tr.px[i] + tr.rx[i] * side * lat, cz = tr.pz[i] + tr.rz[i] * side * lat;
          const n = this.near(cx, cz);
          if (n.d < lat - 3) continue; // outro trecho da pista está mais perto
          if (!this.isFree(cx, cz, R * 0.85)) continue;
          if (this.placed.some(p => (p.x - cx) ** 2 + (p.z - cz) ** 2 < (p.R + R + 20) ** 2)) continue;
          if (shore) {
            const s = this.shoreS(cx, cz);
            if (spec.water === 'in' && s < R * 0.6 + 4) continue;
            if (spec.water === 'shore' && (s < -R * 0.6 || s > R * 0.25)) continue;
            if (!spec.water && s > -shore.beachW - R * 0.6) continue;
          } else if (spec.water === 'in' || spec.water === 'shore') continue;
          const rot = Math.atan2(-side * tr.rx[i], -side * tr.rz[i]);
          if (!this._footprintOK(cx, cz, rot, w, d, e + (far ? 25 : 3))) continue;
          const vis = this._visibility(cx, cz, hero, maxD);
          let score = vis.v + this.rand() * 1.5 - off * 0.02;
          if (hero) {
            // o marco principal fica bem na frente da reta de largada, nem perto nem longe demais
            const v0 = this.views[0], dx = cx - v0.x, dz = cz - v0.z;
            const along = dx * v0.tx + dz * v0.tz, lat = Math.abs(dx * v0.tz - dz * v0.tx);
            const target = (far ? 300 : 170) + d * 0.3;
            if (along > 60) score += 80 * Math.exp(-(((along - target) / 110) ** 2)) * Math.max(0, 1 - Math.atan2(lat, along) / 0.62) ** 0.7;
          }
          // espalha os marcos pela volta
          for (const p of this.placed) {
            let di = Math.abs(p.i - i); di = Math.min(di, N - di) / N;
            if (di < 0.12) score -= (0.12 - di) * 60;
          }
          if (!best || score > best.score) best = { i, side, off, x: cx, z: cz, rot, R, score, view: vis.j };
        }
      }
    }
    return best;
  }

  findSpan(spec) {
    const tr = this.track, N = this.N, e = this.e;
    const kap = i => {
      const a = tr.wrap(i - 2), b = tr.wrap(i + 2);
      return Math.abs(Math.atan2(tr.tx[b], tr.tz[b]) - Math.atan2(tr.tx[a], tr.tz[a])) % (Math.PI * 2);
    };
    const avoid = (this.def.features || []).filter(f => f.type === 'ramp').map(f => f.t);
    for (const p of this.placed) if (p.span) avoid.push(p.i / N, p.i / N + 0.06, p.i / N - 0.06);
    const half = Math.round((spec.d / 2 + 16) / tr.spacing);
    const pillarLat = e + 1.6 + spec.pillar / 2;
    let best = null;
    for (let i = Math.round(N * 0.14); i < N * 0.88; i += 3) {
      const t = i / N;
      if (avoid.some(u => Math.abs(u - t) < 0.045)) continue;
      let straight = true;
      for (let k = -half; k <= half && straight; k += 2) if (Math.abs(kap(i + k)) > 0.05) straight = false;
      if (!straight) continue;
      let ok = true;
      for (const side of [-1, 1]) {
        const x = tr.px[i] + tr.rx[i] * side * pillarLat, z = tr.pz[i] + tr.rz[i] * side * pillarLat;
        if (this.near(x, z).d < pillarLat - 0.5 || !this.isFree(x, z, spec.pillar)) ok = false;
        // todo o pé do portal (ao longo do comprimento dele) fica fora da mureta, mesmo com a pista curvando
        for (let a = -1; a <= 1 && ok; a += 0.5) for (const l of [e + 1.6, pillarLat, e + 1.6 + spec.pillar]) {
          const px = x + tr.tx[i] * a * spec.d / 2 + tr.rx[i] * side * (l - pillarLat), pz = z + tr.tz[i] * a * spec.d / 2 + tr.rz[i] * side * (l - pillarLat);
          if (this.near(px, pz).d < e + 0.8) { ok = false; break; }
        }
        // e as partes que se estendem para os lados (aquedutos, correntes) não cruzam outro trecho da pista
        for (let l = pillarLat; l <= spec.w / 2 && ok; l += 6) {
          const px = tr.px[i] + tr.rx[i] * side * l, pz = tr.pz[i] + tr.rz[i] * side * l;
          if (this.near(px, pz).d < Math.min(l, e + 3) - 0.5) ok = false;
        }
      }
      if (!ok) continue;
      // trecho reto antes do portal (dá para ver de longe)
      let run = 0;
      while (run < N / 3 && Math.abs(kap(i - half - run)) < 0.04) run += 2;
      const score = run + this.rand() * 10;
      if (!best || score > best.score) best = { i, score };
    }
    return best;
  }

  placeLandmark(entry, idx) {
    const id = typeof entry === 'string' ? entry : entry.id;
    const base = LANDMARKS[id];
    if (!base) { this.warn.push(`marco desconhecido: ${id}`); return; }
    const sc = base.scale || 1;
    const spec = sc === 1 ? base : { ...base, w: base.w * sc, d: base.d * sc };
    const tr = this.track, e = this.e;
    const hero = typeof entry === 'string' ? idx === 0 : !!entry.hero;
    const g = new THREE.Group();
    let info;
    if (spec.kind === 'span') {
      const s = this.findSpan(spec);
      if (!s) { this.warn.push(`sem lugar para ${id}`); return; }
      const i = s.i;
      g.position.set(tr.px[i], this.gl, tr.pz[i]);
      g.rotation.y = tr.headingAt(i);
      info = { id, i, x: tr.px[i], z: tr.pz[i], R: e + spec.pillar + 2, span: true };
      for (const side of [-1, 1]) {
        const lat = e + 1.6 + spec.pillar / 2;
        this.reserve(tr.px[i] + tr.rx[i] * side * lat, tr.pz[i] + tr.rz[i] * side * lat, spec.pillar * 0.8 + 3);
        this.footprints.push({ x: tr.px[i] + tr.rx[i] * side * lat, z: tr.pz[i] + tr.rz[i] * side * lat, rot: g.rotation.y, w: spec.pillar, d: spec.d, id });
      }
      // corredor de visão: reta antes do portal
      const j = tr.wrap(i - Math.round(160 / tr.spacing));
      this.reserveLine(tr.px[j], tr.pz[j], tr.px[i], tr.pz[i], e + 2);
    } else {
      let s;
      if (typeof entry === 'object' && entry.t !== undefined) {
        const i = tr.wrap(Math.floor(entry.t * this.N));
        const lat = e + entry.off + spec.d / 2;
        s = { i, side: entry.side, off: entry.off, x: tr.px[i] + tr.rx[i] * entry.side * lat, z: tr.pz[i] + tr.rz[i] * entry.side * lat, rot: Math.atan2(-entry.side * tr.rx[i], -entry.side * tr.rz[i]), R: Math.hypot(spec.w, spec.d) / 2, view: -1 };
      } else s = this.findSpot(spec, hero);
      if (!s) { this.warn.push(`sem lugar para ${id}`); return; }
      const y = spec.water === 'in' ? this.gl - 2.5 : this.gl;
      g.position.set(s.x, y, s.z);
      g.rotation.y = s.rot;
      info = { id, i: s.i, x: s.x, z: s.z, R: s.R, side: s.side, off: s.off };
      this.reserve(s.x, s.z, s.R * 0.95 + 4);
      this.footprints.push({ x: s.x, z: s.z, rot: s.rot, w: spec.w, d: spec.d, id });
      // corredores de visão (do melhor ponto de vista e, para o principal, da largada)
      const views = [];
      if (s.view >= 0) views.push(this.views[s.view]);
      if (hero) views.push(this.views[0]);
      for (const vp of views) {
        const dx = s.x - vp.x, dz = s.z - vp.z, L = Math.hypot(dx, dz);
        const k = Math.max(0, (L - s.R) / L);
        this.reserveLine(vp.x, vp.z, vp.x + dx * k, vp.z + dz * k, spec.kind === 'far' ? 16 : 11);
      }
    }
    if (sc !== 1) g.scale.setScalar(sc);
    this.group.add(g);
    g.updateMatrixWorld(true);
    spec.build(this, g, entry.opts || {}, info);
    info.baked = this.bake(g);
    this.placed.push(info);
  }

  // ---------- Prédios ----------
  tryBuilding(x, z, w, d, h, rot, type) {
    const r = Math.max(w, d) * 0.72;
    const n = this.near(x, z);
    if (n.d < this.e + 7 + r) return false;
    if (!this.isFree(x, z, r)) return false;
    for (const b of this.placedB) if ((b.x - x) ** 2 + (b.z - z) ** 2 < (b.r + r + 3) ** 2) return false;
    if (this.track.shore && this.shoreS(x, z) > -this.track.shore.beachW - r - 2) return false;
    this.placedB.push({ x, z, r });
    const B = this.kit.buildings;
    const tints = B.tints && !isGlassFacade(type) ? B.tints : isGlassFacade(type) ? ['#ffffff', '#d8e6f5', '#e6f0ff'] : ['#ffffff', '#f5e6d0', '#e8eef5', '#f2dcd0', '#dfe8d8', '#d0d4dc'];
    (this.blocks[type] = this.blocks[type] || []).push({ x, y: this.gl, z, w, h, d, rot, type, color: tints[Math.floor(this.rand() * tints.length)], roof: true });
    this.footprints.push({ x, z, rot, w, d, id: 'prédio', building: true });
    return true;
  }

  buildBuildings() {
    const tr = this.track, N = this.N, e = this.e, rand = this.rand;
    const B = this.kit.buildings;
    const types = B.types;
    const dens = B.density || 1;
    const pickType = (row) => {
      const glassy = types.filter(isGlassFacade), other = types.filter(t => !isGlassFacade(t));
      if (row >= 2 && glassy.length && rand() < 0.45) return glassy[Math.floor(rand() * glassy.length)];
      const pool = other.length ? other : types;
      return pool[Math.floor(rand() * pool.length)];
    };
    const bi = tr.bridgeIdx;
    const step = Math.max(1, Math.round(24 / dens / tr.spacing));
    for (let i = 0; i < N; i += step) {
      const near = bi !== undefined && Math.abs(((i - bi + N / 2) % N + N) % N - N / 2) * tr.spacing < this.def.bridge.span + 30;
      for (const side of [-1, 1]) {
        B.heights.forEach(([hmin, hmax], row) => {
          if (near && row === 0) return;
          if (rand() < 0.18) return;
          const dmin = [16, 46, 80][row];
          const w = 12 + rand() * 9, d = 12 + rand() * 9;
          const off = e + dmin + d / 2 + rand() * 6;
          const x = tr.px[i] + tr.rx[i] * side * off, z = tr.pz[i] + tr.rz[i] * side * off;
          this.tryBuilding(x, z, w, d, lerp(hmin, hmax, rand()), Math.atan2(tr.tx[i], tr.tz[i]), pickType(row));
        });
      }
    }
    // horizonte de prédios mais longe
    const [fmin, fmax] = B.far;
    for (let k = 0; k < 220 * dens; k++) {
      const s = tr._randomSpot(e + 110, e + 330, 20);
      if (!s) continue;
      const w = 14 + rand() * 12;
      this.tryBuilding(s.x, s.z, w, w * (0.8 + rand() * 0.4), lerp(fmin, fmax, rand()), rand() * Math.PI, pickType(2));
    }
    // miolo da pista (bairro entre as retas)
    const [m0, m1] = B.heights[1];
    for (let k = 0; k < 160 * dens; k++) {
      const s = tr._randomSpot(e + 20, e + 110, 20);
      if (!s) continue;
      const w = 12 + rand() * 10;
      this.tryBuilding(s.x, s.z, w, w * (0.8 + rand() * 0.4), lerp(m0 * 0.7, m1, rand()), Math.atan2(tr.tx[s.i], tr.tz[s.i]), pickType(1));
    }

    for (const [type, list] of Object.entries(this.blocks)) {
      if (!list.length) continue;
      const geos = [];
      const col = new THREE.Color();
      for (const b of list) {
        geos.push(buildingGeo(b.w, b.h, b.d, b.x, b.y, b.z, b.rot, col.set(b.color), true, Math.floor(rand() * 4) / 4, Math.floor(rand() * 4) / 4));
        if (b.roof) this._roof(b);
      }
      const merged = mergeAll(geos);
      const tx = facadeTextures(type, type.length * 1031 + 7);
      const glass = isGlassFacade(type);
      const mat = new THREE.MeshStandardMaterial({
        map: tx.map, emissiveMap: tx.emissiveMap, emissive: 0xffffff, emissiveIntensity: this.glow * (glass ? 0.7 : 1), vertexColors: true,
        roughness: glass ? 0.25 : 0.8, metalness: glass ? 0.4 : 0,
      });
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    this.roofBag.flush(this.group);
  }

  // Telhado de cada estilo de cidade.
  _roof(b) {
    const style = this.kit.buildings.roof;
    const rand = this.rand;
    const g = new THREE.Group();
    g.position.set(b.x, b.y + b.h, b.z);
    g.rotation.y = b.rot;
    const P = (c, cls) => this.P(c, cls);
    const glass = isGlassFacade(b.type);
    if (style === 'tank' || style === 'flatRail') {
      if (rand() < 0.5) g.add(box(3, 2.4, 3, P(0xa8a39a), (rand() - 0.5) * b.w * 0.4, 1.2, (rand() - 0.5) * b.d * 0.4));
      if (style === 'flatRail') g.add(box(b.w + 0.4, 0.8, b.d + 0.4, P(0xe6cc98), 0, 0.4, 0));
    } else if (style === 'flat') {
      g.add(box(b.w + 0.3, 0.6, b.d + 0.3, P(glass ? 0x8a96a4 : 0xb8b2a8), 0, 0.3, 0));
      if (rand() < 0.35) g.add(box(b.w * 0.3, 2.2, b.d * 0.3, P(0x9a968e), 0, 1.4, 0));
    } else if (style === 'mansard') {
      g.add(geoMesh(frustumGeo(b.w + 0.6, b.d + 0.6, 4.2, 0.62).translate(0, 2.1, 0), P(0x5f6a7a)));
      for (let k = 0; k < 2; k++) g.add(box(1.4, 3, 1.4, P(0xd6cfc4), (k - 0.5) * b.w * 0.5, 5, 0));
    } else if (style === 'gable') {
      g.add(geoMesh(gableGeo(b.w + 0.6, b.d + 0.6, Math.min(7, b.d * 0.4)), P(rand() < 0.5 ? 0x4a4a52 : 0x6a4a3a)));
      if (rand() < 0.6) g.add(box(1.2, 3, 1.2, P(0x8a4a36), b.w * 0.3, 2.8, 0));
    } else if (style === 'tiles') {
      g.add(geoMesh(frustumGeo(b.w + 1.2, b.d + 1.2, 3, 0.25).translate(0, 1.5, 0), P(rand() < 0.5 ? 0xc0502a : 0xb04a28)));
    } else if (style === 'spire') {
      if (b.h > 45) {
        g.add(box(b.w * 0.7, b.h * 0.12, b.d * 0.7, P(glass ? 0x9aaabb : 0xc8c4bc), 0, b.h * 0.06, 0));
        g.add(box(b.w * 0.42, b.h * 0.08, b.d * 0.42, P(glass ? 0xaabbcc : 0xd6d2ca), 0, b.h * 0.16, 0));
        if (rand() < 0.6) g.add(cone(0.6, b.h * 0.18, P(0xdddddd, 'metal'), 0, b.h * 0.2 + b.h * 0.09, 0, 6));
      } else g.add(box(b.w + 0.3, 0.6, b.d + 0.3, P(0xb0aaa0), 0, 0.3, 0));
    } else if (style === 'pagoda') {
      if (b.h < 16) {
        g.add(geoMesh(frustumGeo(b.w + 3, b.d + 3, 3.2, 0.35).translate(0, 1.6, 0), P(rand() < 0.6 ? 0x2f4a3f : 0x8a2a20)));
      } else g.add(box(b.w + 0.3, 0.6, b.d + 0.3, P(0xa8a49c), 0, 0.3, 0));
    } else if (style === 'domes') {
      g.add(box(b.w + 0.4, 0.8, b.d + 0.4, P(0xf2e6d0), 0, 0.4, 0));
      if (rand() < 0.55) {
        g.add(cyl(1.6, 1.6, 2, P(0xf6efe2), b.w * 0.25, 1.8, b.d * 0.25, 8));
        g.add(sphere(1.9, P(0xf6efe2, 'smooth'), b.w * 0.25, 2.8, b.d * 0.25, 10, 6, Math.PI / 2));
      }
    } else if (style === 'mughal') {
      // Agra: parapeito colorido, cúpula ou chhatri, caixa d'água preta; quem fica de frente
      // para a pista ganha toldo de loja no térreo e um balcão (jharokha) na fachada.
      const PC = [0xf2e6d0, 0xffffff, 0xe8c8a0, 0xd8846a, 0xf0d890, 0xc8e0e8];
      g.add(box(b.w + 0.4, 1.0, b.d + 0.4, P(PC[Math.floor(rand() * PC.length)]), 0, 0.5, 0));
      const r = rand(), cx = (rand() - 0.5) * b.w * 0.4, cz = (rand() - 0.5) * b.d * 0.4;
      if (r < 0.38) {
        g.add(cyl(1.6, 1.6, 1.8, P(0xf6efe2), cx, 1.8, cz, 8));
        g.add(sphere(1.9, P(rand() < 0.75 ? 0xf6efe2 : 0xe8a050, 'smooth'), cx, 2.7, cz, 8, 4, Math.PI / 2));
        g.add(cone(0.12, 1.2, P(0xd8b04a, 'metal'), cx, 5, cz, 4));
      } else if (r < 0.66) {
        for (const [a, c] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(box(0.35, 2.4, 0.35, P(0xf2ece0), cx + a * 1.3, 2.2, cz + c * 1.3));
        g.add(box(3.4, 0.4, 3.4, P(0xf2ece0), cx, 3.5, cz));
        g.add(sphere(1.5, P(0xfaf6ee, 'smooth'), cx, 3.7, cz, 6, 3, Math.PI / 2));
      }
      if (rand() < 0.35) g.add(cyl(1, 1, 1.6, P(0x2a2a2e), -cx * 0.5 + b.w * 0.3, 1.8, -cz * 0.5 - b.d * 0.3, 6));
      const n = this.near(b.x, b.z);
      if (n.d < this.e + 45) {
        const i = n.i, tr = this.track;
        const s = Math.sign((tr.px[i] - b.x) * Math.cos(b.rot) - (tr.pz[i] - b.z) * Math.sin(b.rot)) || 1;
        const AW = [0xe8262a, 0xff8a1a, 0x1fae9c, 0xffc81a, 0xff5e9c, 0x2f7bff, 0x7a3fb8];
        const aw = box(2, 0.14, b.d * 0.8, P(AW[Math.floor(rand() * AW.length)]), s * (b.w / 2 + 0.9), -b.h + 3.6, 0);
        aw.rotation.z = -s * 0.35; g.add(aw);
        if (b.h > 11 && rand() < 0.65) {
          const bz = (rand() - 0.5) * b.d * 0.4, by = -b.h + 7 + rand() * Math.max(0, b.h - 11);
          g.add(box(1.3, 2.4, 3.2, P(0xf2e2c6), s * (b.w / 2 + 0.6), by, bz));
          g.add(box(1.7, 0.4, 3.6, P(0xd8846a), s * (b.w / 2 + 0.7), by + 1.4, bz));
        }
      }
    }
    this.roofBag.add(g);
  }

  // ---------- Postes e árvores ----------
  buildStreet() {
    const tr = this.track, N = this.N, e = this.e, rand = this.rand;
    const bi = tr.bridgeIdx;
    const lamps = [];
    const lampStep = Math.max(1, Math.round(26 / tr.spacing));
    const spans = this.placed.filter(p => p.span).map(p => p.i);
    const mix = this.kit.treeMix; // cidades com mais de um tipo de árvore na rua (Agra: palmeiras)
    for (let i = 0; i < N; i += lampStep) {
      if (Math.abs(i) < 8 || N - i < 8) continue;
      const nearBridge = bi !== undefined && Math.abs(((i - bi + N / 2) % N + N) % N - N / 2) * tr.spacing < this.def.bridge.span + 4;
      const nearSpan = spans.some(s => { const di = Math.abs(s - i); return Math.min(di, N - di) * tr.spacing < 14; });
      for (const side of [-1, 1]) {
        const lat = side * (e + 1.4);
        const lx = tr.px[i] + tr.rx[i] * lat, lz = tr.pz[i] + tr.rz[i] * lat;
        if (!nearBridge && !nearSpan && this.near(lx, lz).d > e + 0.5) lamps.push({ i, side, x: lx, z: lz, y: tr.py[i] + 1.1 });
        const j = tr.wrap(i + Math.round(lampStep / 2));
        const tl = side * (e + 6);
        const tx2 = tr.px[j] + tr.rx[j] * tl, tz2 = tr.pz[j] + tr.rz[j] * tl;
        if (!nearBridge && this.near(tx2, tz2).d > e + 4 && this.shoreS(tx2, tz2) < -4) this.trees.push({ x: tx2, z: tz2, s: 0.75 + rand() * 0.3, check: true, y: tr.py[j] - 0.9, kind: mix ? mix[Math.floor(rand() * mix.length)] : undefined });
      }
    }
    // árvores soltas nos terrenos entre os prédios (só nas cidades que pedem: kit.lotTrees)
    for (let k = 0; k < (this.kit.lotTrees || 0); k++) {
      const s = tr._randomSpot(e + 14, e + 240, 20);
      if (!s || !this.isFree(s.x, s.z, 3) || this.shoreS(s.x, s.z) > -4) continue;
      this.trees.push({ x: s.x, z: s.z, y: s.y, s: 0.9 + rand() * 0.5, check: true, kind: mix ? mix[Math.floor(rand() * mix.length)] : undefined });
    }
    this._lamps(lamps);
    this._trees();
  }

  _lamps(lamps) {
    if (!lamps.length) return;
    const tr = this.track;
    const style = this.kit.lamps;
    const pole = new THREE.MeshStandardMaterial({ color: style === 'classic' ? 0x24262c : 0x5a5f6a, metalness: 0.5, roughness: 0.4 });
    const light = new THREE.MeshBasicMaterial({ color: style === 'lantern' ? 0xffb050 : 0xfff0c8 });
    let parts;
    if (style === 'classic') {
      parts = [
        { geo: new THREE.CylinderGeometry(0.12, 0.22, 6, 6).translate(0, 3, 0), mat: pole },
        { geo: new THREE.CylinderGeometry(0.5, 0.25, 0.9, 6).translate(0, 6.5, 0), mat: light },
        { geo: new THREE.ConeGeometry(0.62, 0.6, 6).translate(0, 7.2, 0), mat: pole },
      ];
    } else if (style === 'lantern') {
      parts = [
        { geo: new THREE.CylinderGeometry(0.12, 0.18, 6.5, 6).translate(0, 3.25, 0), mat: pole },
        { geo: new THREE.BoxGeometry(1.6, 0.14, 0.14).translate(0.7, 6.4, 0), mat: pole },
        { geo: new THREE.SphereGeometry(0.55, 8, 6).scale(1, 1.3, 1).translate(1.3, 5.6, 0), mat: new THREE.MeshBasicMaterial({ color: this.kitId === 'pequim' ? 0xff3a2a : 0xffb050 }) },
      ];
    } else {
      parts = [
        { geo: new THREE.CylinderGeometry(0.14, 0.2, 8, 6).translate(0, 4, 0), mat: pole },
        { geo: new THREE.BoxGeometry(2.6, 0.16, 0.16).translate(1.2, 7.9, 0), mat: pole },
        { geo: new THREE.BoxGeometry(1.1, 0.25, 0.5).translate(2.3, 7.8, 0), mat: light },
      ];
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    for (const p of parts) {
      const im = new THREE.InstancedMesh(p.geo, p.mat, lamps.length);
      lamps.forEach((l, k) => {
        const dx = -l.side * tr.rx[l.i], dz = -l.side * tr.rz[l.i];
        q.setFromAxisAngle(UP, Math.atan2(-dz, dx));
        m.compose(v.set(l.x, l.y - 1.3, l.z), q, s);
        im.setMatrixAt(k, m);
      });
      im.castShadow = p.mat === pole;
      this.group.add(im);
    }
    this.lampCount = lamps.length;
  }

  _trees() {
    const list = this.trees.filter(t => !t.check || this.placedB.every(b => (b.x - t.x) ** 2 + (b.z - t.z) ** 2 > (b.r + 2) ** 2));
    const byKind = {};
    for (const t of list) (byKind[t.kind || this.kit.trees] = byKind[t.kind || this.kit.trees] || []).push(t);
    const std = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });
    const leaf = std(0xffffff);
    for (const [kind, ts] of Object.entries(byKind)) {
      let parts;
      if (kind === 'palm') {
        const fronds = [];
        for (let l = 0; l < 7; l++) {
          const f = new THREE.ConeGeometry(0.75, 5.2, 4).rotateX(Math.PI / 2 + 0.45).translate(0, -0.6, 2.4).rotateY((l / 7) * Math.PI * 2);
          fronds.push(f.index ? f.toNonIndexed() : f);
        }
        parts = [
          { geo: new THREE.CylinderGeometry(0.3, 0.5, 9, 6).rotateZ(0.08).translate(0.35, 4.5, 0), mat: std(0x9a6a3a) },
          { geo: mergeAll(fronds).translate(0.7, 9.2, 0), mat: leaf, colors: ['#3aa84a', '#2f9a40', '#4cb85a'] },
        ];
      } else if (kind === 'cypress') {
        parts = [
          { geo: new THREE.CylinderGeometry(0.2, 0.3, 1.6, 5).translate(0, 0.8, 0), mat: std(0x5a3a22) },
          { geo: new THREE.ConeGeometry(1.3, 7.5, 7).translate(0, 5, 0), mat: leaf, colors: ['#2f6a3a', '#357440', '#2a6034'] },
        ];
      } else if (kind === 'pine') {
        parts = [
          { geo: new THREE.CylinderGeometry(0.25, 0.42, 9, 6).translate(0, 4.5, 0), mat: std(0x7a5a3a) },
          { geo: new THREE.IcosahedronGeometry(3, 0).scale(1.5, 0.45, 1.5).translate(0, 9.6, 0), mat: leaf, colors: ['#3f7a3a', '#4a8a40', '#356a32'] },
          { geo: new THREE.IcosahedronGeometry(2, 0).scale(1.4, 0.45, 1.4).translate(1.6, 9.1, 0.8), mat: leaf, colors: ['#477f3c', '#3a7034'] },
        ];
      } else if (kind === 'sakura') {
        parts = [
          { geo: new THREE.CylinderGeometry(0.25, 0.42, 3.4, 6).translate(0, 1.7, 0), mat: std(0x5a3a2e) },
          { geo: new THREE.IcosahedronGeometry(2.4, 0).translate(0, 4.6, 0), mat: leaf, colors: ['#ffb7d5', '#ffc8e0', '#ff9fc8', '#ffd6e8'] },
          { geo: new THREE.IcosahedronGeometry(1.7, 0).translate(1.1, 5.6, 0.4), mat: leaf, colors: ['#ffc0dc', '#ffa8cc'] },
          { geo: new THREE.IcosahedronGeometry(1.5, 0).translate(-1.2, 5.2, -0.5), mat: leaf, colors: ['#ffd0e6', '#ffb0d0'] },
        ];
      } else if (kind === 'plane') {
        parts = [
          { geo: new THREE.CylinderGeometry(0.28, 0.42, 4, 6).translate(0, 2, 0), mat: std(0x8a7a62) },
          { geo: new THREE.IcosahedronGeometry(2.6, 1).scale(1, 1.15, 1).translate(0, 5.6, 0), mat: leaf, colors: ['#6aa84a', '#5a9a40', '#78b456'] },
        ];
      } else {
        parts = [
          { geo: new THREE.CylinderGeometry(0.25, 0.4, 3.4, 6).translate(0, 1.7, 0), mat: std(0x6a4a2a) },
          { geo: new THREE.IcosahedronGeometry(2.3, 0).translate(0, 4.6, 0), mat: leaf, colors: ['#3f9e3a', '#4cb043', '#2f8a34', '#5aa83f'] },
          { geo: new THREE.IcosahedronGeometry(1.6, 0).translate(0.9, 5.8, 0.3), mat: leaf, colors: ['#52b848', '#3a9a3a'] },
        ];
      }
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
      for (const p of parts) {
        const im = new THREE.InstancedMesh(p.geo, p.mat, ts.length);
        ts.forEach((t, k) => {
          q.setFromAxisAngle(UP, k * 2.4);
          m.compose(v.set(t.x, t.y ?? this.gl, t.z), q, s.setScalar(t.s));
          im.setMatrixAt(k, m);
          if (p.colors) im.setColorAt(k, new THREE.Color(p.colors[k % p.colors.length]));
        });
        im.castShadow = true;
        this.group.add(im);
      }
    }
    this.treeCount = list.length;
  }

  // Lugares livres na beira da pista para enfeites (sem prédio, sem marco, fora da pista).
  propSpots(n, latMin, latMax, every = 30, r = 3) {
    const tr = this.track, out = [];
    const step = Math.max(1, Math.round(every / tr.spacing));
    const start = Math.floor(this.rand() * step);
    for (let i = start; i < this.N && out.length < n; i += step) {
      if (i < 30 || this.N - i < 30) continue;
      const side = this.rand() < 0.5 ? -1 : 1;
      const lat = lerp(latMin, latMax, this.rand());
      const x = tr.px[i] + tr.rx[i] * side * (this.e + lat), z = tr.pz[i] + tr.rz[i] * side * (this.e + lat);
      if (this.near(x, z).d < this.e + lat - 1) continue;
      if (!this.isFree(x, z, r) || this.placedB.some(b => (b.x - x) ** 2 + (b.z - z) ** 2 < (b.r + r) ** 2)) continue;
      if (this.shoreS(x, z) > -4) continue;
      this.reserve(x, z, r);
      out.push({ i, side, x, z, rot: Math.atan2(-side * tr.rx[i], -side * tr.rz[i]) });
    }
    return out;
  }

  // Auditoria pela geometria de verdade: nenhum vértice de marco dentro da faixa da pista
  // (nos portais, só o que está no alto pode passar por cima da pista).
  geomAudit() {
    let bad = 0, checked = 0;
    const who = new Set();
    const v = new THREE.Vector3();
    for (const p of this.placed) {
      if (!p.baked) continue;
      p.baked.updateMatrixWorld(true);
      p.baked.traverse(m => {
        if (!m.isMesh) return;
        const pos = m.geometry.attributes.position;
        const stride = Math.max(1, Math.floor(pos.count / 1500));
        for (let i = 0; i < pos.count; i += stride) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
          if (p.span && v.y > this.gl + 9) continue;
          checked++;
          if (this.near(v.x, v.z).d < this.e - 0.05) { bad++; who.add(p.id); }
        }
      });
    }
    return { bad, checked, who: [...who] };
  }

  // Auditoria: conta pedaços de marcos/prédios que encostam na faixa da pista (deve ser 0).
  audit(margin = 0.5) {
    let bad = 0, checked = 0;
    const lim = this.e + margin;
    const list = [];
    for (const f of this.footprints) {
      const c = Math.cos(f.rot), s = Math.sin(f.rot);
      for (let a = 0; a <= 3; a++) for (let b = 0; b <= 3; b++) {
        const lx = lerp(-f.w / 2, f.w / 2, a / 3), lz = lerp(-f.d / 2, f.d / 2, b / 3);
        const x = f.x + lx * c + lz * s, z = f.z - lx * s + lz * c;
        checked++;
        if (this.near(x, z).d < lim) { bad++; list.push(f.id); }
      }
    }
    return { bad, checked, who: [...new Set(list)] };
  }
}

function mergeAll(geos) {
  const out = [];
  for (const g of geos) out.push(g.index ? g.toNonIndexed() : g);
  const m = mergeGeometries(out);
  out.forEach(g => g.dispose());
  return m;
}

// ---------- Mar ----------
function buildWater(ctx) {
  const sh = ctx.track.shore;
  if (!sh) return;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = sh.color; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 2;
  for (let k = 0; k < 10; k++) {
    const y = k * 13 + 4;
    g.beginPath();
    for (let x = 0; x <= 128; x += 8) g.lineTo(x, y + Math.sin(x / 128 * Math.PI * 4 + k) * 2.5);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(120, 120);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.15, metalness: 0.25, emissive: new THREE.Color(sh.color), emissiveIntensity: 0.12 + ctx.glow * 0.1 });
  const S = 2400;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(S, S).rotateX(-Math.PI / 2), mat);
  // metade do plano começa na beira do mar
  const tx = -sh.nz, tz = sh.nx;
  plane.position.set(sh.nx * (sh.d0 + S / 2), ctx.gl - 0.35, sh.nz * (sh.d0 + S / 2));
  plane.rotation.y = Math.atan2(tx, tz);
  plane.receiveShadow = true;
  ctx.group.add(plane);
  ctx.anim(dt => { tex.offset.x += dt * 0.01; tex.offset.y += dt * 0.004; });
  // barquinhos
  const nb = 5;
  const boats = [];
  for (let k = 0; k < nb; k++) {
    const b = new THREE.Group();
    b.add(box(3, 1.2, 9, ctx.P(0xffffff), 0, 0.6, 0));
    b.add(box(2.4, 1.2, 3, ctx.P(k % 2 ? 0x2f7bff : 0xff5a3a), 0, 1.8, -1));
    if (k % 2 === 0) { b.add(cyl(0.12, 0.12, 9, ctx.P(0xdddddd), 0, 5, 1)); b.add(cone(2.4, 7, ctx.P(0xffffff), 0, 5, 2.2, 3)); }
    const baked = ctx.dynamic(b);
    boats.push({ o: baked, d: 60 + ctx.rand() * 260, s: (ctx.rand() - 0.5) * 900, v: (ctx.rand() < 0.5 ? -1 : 1) * (3 + ctx.rand() * 4) });
  }
  ctx.anim((dt, t) => {
    for (const b of boats) {
      b.s += b.v * dt;
      if (b.s > 600) b.s = -600; if (b.s < -600) b.s = 600;
      const x = sh.nx * (sh.d0 + b.d) + tx * b.s, z = sh.nz * (sh.d0 + b.d) + tz * b.s;
      b.o.position.set(x, ctx.gl - 0.4 + Math.sin(t * 1.3 + b.d) * 0.15, z);
      b.o.rotation.y = Math.atan2(tx * Math.sign(b.v), tz * Math.sign(b.v));
    }
  });
}

// ---------- Montagem completa ----------
export function buildCity(track) {
  const ctx = new CityCtx(track);
  const def = track.def;
  const tr = track, e = ctx.e;
  // área da largada (arquibancadas)
  for (const side of [-1, 1]) {
    const p = tr.pointAtIdx(tr.wrap(-14), side * (e + 14));
    ctx.reserve(p.x, p.z, 30);
    ctx.footprints.push({ x: p.x, z: p.z, rot: 0, w: 1, d: 1, id: 'arquibancada' });
  }
  buildWater(ctx);
  // Osasco feita à mão: Ponte Metálica com avenida embaixo e a linha do trem
  if (def.bridge && tr.bridgeIdx !== undefined) buildOsascoBridge(ctx);
  if (def.rail) buildOsascoRail(ctx);

  const lms = def.landmarks || [];
  lms.forEach((L, k) => ctx.placeLandmark(L, k));

  ctx.buildBuildings();
  ctx.buildStreet();
  for (const p of ctx.kit.props || []) if (PROPS[p]) PROPS[p](ctx);
  ctx.bag.flush(track.group);
  if (ctx.atlas.full) ctx.warn.push('atlas de placas cheio');
  const audit = ctx.audit();
  const geom = ctx.geomAudit();
  if (geom.bad) ctx.warn.push(`${geom.bad} vértices de marcos dentro da pista: ${geom.who.join(', ')}`);
  if (audit.bad) ctx.warn.push(`${audit.bad} pontos encostam na pista: ${audit.who.join(', ')}`);
  if (ctx.warn.length) console.warn(`[${ctx.kit.name}] ` + ctx.warn.join(' | '));
  track.cityInfo = {
    kit: ctx.kitId,
    buildings: Object.values(ctx.blocks).reduce((a, l) => a + l.length, 0),
    trees: ctx.treeCount || 0, lamps: ctx.lampCount || 0,
    landmarks: ctx.placed.map(p => p.id),
    landmarkPos: ctx.placed.map(p => [p.id, Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]),
    audit, geomAudit: geom, warn: ctx.warn,
  };
}
