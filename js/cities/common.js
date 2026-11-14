// Peças comuns para montar as cidades: pinturas (materiais compartilhados com cor por
// vértice), formas básicas, junção de malhas (menos trabalho para o celular), placas
// num atlas único e fachadas com janelas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const UP = new THREE.Vector3(0, 1, 0);

// ---------- Materiais compartilhados ----------
// Cada "classe" é um material só; a cor de cada peça vira cor de vértice na hora de juntar.
export function makeMaterials(glow) {
  const M = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, ...o });
  return {
    solid: M({ roughness: 0.8, flatShading: true }),
    smooth: M({ roughness: 0.5 }),
    metal: M({ roughness: 0.4, metalness: 0.3, flatShading: true }),
    glass: M({ roughness: 0.12, metalness: 0.5, emissive: 0x24405a, emissiveIntensity: 0.25 + glow * 0.5 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    lit: M({ roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.15 + glow * 0.55 }), // vitrais/janelas que acendem
    flat: M({ roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), // gramados e pisos
    // luz neon: brilha de noite e no fim de tarde; de dia é só uma cor viva
    neon: glow > 0.6 ? new THREE.MeshBasicMaterial({ vertexColors: true }) : M({ roughness: 0.35, metalness: 0.2 }),
    twoSided: M({ roughness: 0.4, side: THREE.DoubleSide }), // cascas finas (velas da ópera, hotel-vela)
  };
}

// Pintura = material da classe + cor.
export const paint = (mats, color, cls = 'solid') => ({ mat: mats[cls], color: new THREE.Color(color) });

function mesh(geo, p) {
  const m = new THREE.Mesh(geo, p.mat);
  m.userData.color = p.color;
  if (p.mat.userData.sign) m.userData.sign = true;
  return m;
}
export function box(w, h, d, p, x = 0, y = 0, z = 0) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), p);
  m.position.set(x, y, z);
  return m;
}
export function cyl(rt, rb, h, p, x = 0, y = 0, z = 0, seg = 10) {
  const m = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), p);
  m.position.set(x, y, z);
  return m;
}
export function cone(r, h, p, x = 0, y = 0, z = 0, seg = 10) {
  const m = mesh(new THREE.ConeGeometry(r, h, seg), p);
  m.position.set(x, y, z);
  return m;
}
export function sphere(r, p, x = 0, y = 0, z = 0, ws = 12, hs = 8, phiLen = Math.PI) {
  const m = mesh(new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, phiLen), p);
  m.position.set(x, y, z);
  return m;
}
export function geo(g, p, x = 0, y = 0, z = 0) {
  const m = mesh(g, p);
  m.position.set(x, y, z);
  return m;
}
// Viga ligando dois pontos.
export function beam(a, b, r, p, seg = 5) {
  const len = a.distanceTo(b);
  const m = mesh(new THREE.CylinderGeometry(r, r, len, seg, 1, true), p);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return m;
}
// Viga quadrada (treliças).
export function bar(a, b, s, p) {
  const len = a.distanceTo(b);
  const m = mesh(new THREE.BoxGeometry(s, len, s), p);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return m;
}
// Prisma de telhado de duas águas (comprimento em x, largura em z, altura h).
export function gableGeo(w, d, h) {
  const x = w / 2, z = d / 2;
  const v = [
    -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0, // frente
    x, 0, -z, -x, 0, -z, -x, h, 0, x, 0, -z, -x, h, 0, x, h, 0, // trás
    -x, 0, -z, -x, 0, z, -x, h, 0, // oitão esq.
    x, 0, z, x, 0, -z, x, h, 0, // oitão dir.
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
// Tronco de pirâmide de base retangular (telhados, pirâmides, pedestais).
export function frustumGeo(w, d, h, k = 0.5) {
  const g = new THREE.CylinderGeometry(Math.SQRT1_2 * k, Math.SQRT1_2, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.scale(w, 1, d);
  return g;
}

// ---------- Junta peças ----------
// Converte uma peça para o formato do material (cor por vértice ou uv) e aplica a matriz.
function prep(m, matrix) {
  let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
  g.applyMatrix4(matrix);
  const vc = !!m.material.vertexColors;
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && !(k === 'uv' && !vc)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (vc) {
    const c = m.userData.color || new THREE.Color(1, 1, 1);
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  } else if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
  return g;
}

// Junta todas as malhas de um objeto (por material). local=true: coordenadas relativas ao objeto.
export function bakeObject(obj, { local = false, shadow = true } = {}) {
  obj.updateMatrixWorld(true);
  const inv = local ? obj.matrixWorld.clone().invert() : null;
  const byMat = new Map();
  const tmp = new THREE.Matrix4();
  obj.traverse(m => {
    if (!m.isMesh) return;
    const g = prep(m, local ? tmp.multiplyMatrices(inv, m.matrixWorld) : m.matrixWorld);
    if (!byMat.has(m.material)) byMat.set(m.material, []);
    byMat.get(m.material).push(g);
  });
  const out = new THREE.Group();
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    const mm = new THREE.Mesh(merged, mat);
    mm.castShadow = shadow && mat.type !== 'MeshBasicMaterial' && !mat.polygonOffset;
    mm.receiveShadow = true;
    out.add(mm);
  }
  obj.traverse(m => { if (m.isMesh) m.geometry.dispose(); });
  return out;
}

// Corta uma malha grande (chão, telhados juntados...) em quadrados de `cell` metros.
// Cada pedaço reaproveita os mesmos vértices (só muda a lista de triângulos) e tem a
// sua própria "bolha" de visibilidade: o que fica atrás da câmera nem é desenhado.
// A aparência não muda. Devolve quantos pedaços ficaram.
export function splitByGrid(mesh, cell, minTris = 0) {
  const g = mesh.geometry, parent = mesh.parent;
  if (!parent || !g.attributes.position) return 1;
  mesh.updateMatrix();
  const pos = g.attributes.position, idx = g.index;
  const n = idx ? idx.count : pos.count;
  if (n / 3 < minTris) return 1;
  const tiles = new Map();
  const v = new THREE.Vector3();
  for (let t = 0; t + 2 < n; t += 3) {
    let cx = 0, cz = 0;
    for (let k = 0; k < 3; k++) {
      const i = idx ? idx.getX(t + k) : t + k;
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrix);
      cx += v.x; cz += v.z;
    }
    const key = Math.floor(cx / 3 / cell) + ',' + Math.floor(cz / 3 / cell);
    let a = tiles.get(key);
    if (!a) tiles.set(key, a = []);
    for (let k = 0; k < 3; k++) a.push(idx ? idx.getX(t + k) : t + k);
  }
  if (tiles.size < 2) return 1;
  const big = pos.count > 65535;
  for (const list of tiles.values()) {
    const tg = new THREE.BufferGeometry();
    for (const [name, attr] of Object.entries(g.attributes)) tg.setAttribute(name, attr);
    tg.setIndex(new THREE.BufferAttribute(big ? new Uint32Array(list) : new Uint16Array(list), 1));
    // caixa e bolha só dos vértices deste pedaço (o three calcularia com todos)
    const box = new THREE.Box3();
    for (const i of list) box.expandByPoint(v.fromBufferAttribute(pos, i));
    tg.boundingBox = box;
    const c = box.getCenter(new THREE.Vector3());
    let r2 = 0;
    for (const i of list) r2 = Math.max(r2, c.distanceToSquared(v.fromBufferAttribute(pos, i)));
    tg.boundingSphere = new THREE.Sphere(c, Math.sqrt(r2));
    const m = new THREE.Mesh(tg, mesh.material);
    m.position.copy(mesh.position); m.quaternion.copy(mesh.quaternion); m.scale.copy(mesh.scale);
    m.castShadow = mesh.castShadow; m.receiveShadow = mesh.receiveShadow; m.renderOrder = mesh.renderOrder;
    m.userData = { ...mesh.userData };
    parent.add(m);
  }
  parent.remove(mesh);
  return tiles.size;
}

// Saco de geometrias soltas (props espalhados pela cidade) que vira poucas malhas no fim.
export class Bag {
  constructor() { this.map = new Map(); }
  add(obj) {
    obj.updateMatrixWorld(true);
    obj.traverse(m => {
      if (!m.isMesh) return;
      if (!this.map.has(m.material)) this.map.set(m.material, []);
      this.map.get(m.material).push(prep(m, m.matrixWorld));
    });
    obj.traverse(m => { if (m.isMesh) m.geometry.dispose(); });
  }
  flush(parent) {
    for (const [mat, geos] of this.map) {
      const merged = mergeGeometries(geos);
      geos.forEach(g => g.dispose());
      if (!merged) continue;
      const mm = new THREE.Mesh(merged, mat);
      mm.castShadow = mat.type !== 'MeshBasicMaterial' && !mat.polygonOffset;
      mm.receiveShadow = true;
      mm.userData.bag = true; // espalhado pela cidade: pode ser cortado em pedaços (splitByGrid)
      parent.add(mm);
    }
    this.map.clear();
  }
}

// ---------- Placas: todas num atlas só (uma chamada de desenho para todas) ----------
export class SignAtlas {
  constructor(glow, W = 2048, H = 1024) {
    this.W = W; this.H = H;
    this.c = document.createElement('canvas');
    this.c.width = W; this.c.height = H;
    this.ctx = this.c.getContext('2d');
    this.shelves = [];
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.mat = new THREE.MeshStandardMaterial({ map: this.tex, emissive: 0xffffff, emissiveMap: this.tex, emissiveIntensity: 0.3 + glow * 0.55, roughness: 0.5 });
    this.mat.userData.sign = true;
    this.full = false;
  }
  _alloc(w, h) {
    for (const s of this.shelves) if (s.h === h && s.x + w <= this.W) { const x = s.x; s.x += w; return { x, y: s.y }; }
    const y = this.shelves.reduce((a, s) => a + s.h, 0);
    if (y + h > this.H) return null;
    this.shelves.push({ y, h, x: w });
    return { x: 0, y };
  }
  // Desenha a placa e devolve a geometria (plano width x height) com uv no atlas.
  // o: { bg, fg, border, px (largura em pixels), font, sub (2ª linha), draw(ctx,w,h) }
  plane(text, width, height, o = {}) {
    const ph = o.ph || (height / width > 0.4 ? 256 : 128);
    const pw = Math.min(this.W, Math.round(ph * width / height / 32) * 32 || 32);
    let a = this._alloc(pw, ph);
    if (!a) { this.full = true; a = { x: 0, y: 0 }; }
    const g = this.ctx;
    g.save();
    g.translate(a.x, a.y);
    g.beginPath(); g.rect(0, 0, pw, ph); g.clip();
    g.fillStyle = o.bg || '#ffffff'; g.fillRect(0, 0, pw, ph);
    if (o.draw) o.draw(g, pw, ph);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = ph * 0.08; g.strokeRect(ph * 0.05, ph * 0.05, pw - ph * 0.1, ph - ph * 0.1); }
    if (text) {
      const lines = String(text).split('\n');
      let size = Math.min(ph * (lines.length > 1 ? 0.4 : 0.64), (ph * 0.86) / lines.length);
      const font = s => `900 ${s}px ${o.font || 'Arial Black, Arial, sans-serif'}`;
      g.font = font(size);
      const mw = Math.max(...lines.map(l => g.measureText(l).width));
      if (mw > pw * 0.88) { size *= (pw * 0.88) / mw; g.font = font(size); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      lines.forEach((l, k) => {
        const y = ph / 2 + (k - (lines.length - 1) / 2) * size * 1.05 + size * 0.05;
        if (o.stroke !== false) { g.lineWidth = size * 0.12; g.strokeStyle = o.stroke || 'rgba(0,0,0,0.35)'; g.strokeText(l, pw / 2, y); }
        g.fillStyle = o.fg || '#222'; g.fillText(l, pw / 2, y);
      });
    }
    g.restore();
    const geo = new THREE.PlaneGeometry(width, height);
    const uv = geo.attributes.uv;
    const u0 = a.x / this.W, u1 = (a.x + pw) / this.W, v1 = 1 - a.y / this.H, v0 = 1 - (a.y + ph) / this.H;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
    this.tex.needsUpdate = true;
    return geo;
  }
  // Reserva um pedaço do atlas e desenha nele (sem texto); devolve o retângulo de uv.
  region(pw, ph, draw) {
    let a = this._alloc(pw, ph);
    if (!a) { this.full = true; a = { x: 0, y: 0 }; }
    const g = this.ctx;
    g.save(); g.translate(a.x, a.y); g.beginPath(); g.rect(0, 0, pw, ph); g.clip();
    draw(g, pw, ph);
    g.restore();
    this.tex.needsUpdate = true;
    return { u0: a.x / this.W, u1: (a.x + pw) / this.W, v1: 1 - a.y / this.H, v0: 1 - (a.y + ph) / this.H };
  }
  // Placa com moldura: grupo (face no atlas + caixa da moldura).
  sign(mats, text, width, height, o = {}) {
    const g = new THREE.Group();
    const face = new THREE.Mesh(this.plane(text, width, height, o), this.mat);
    face.position.z = (o.depth ?? 0.3) / 2 + 0.02;
    g.add(face);
    if (o.frame !== false) g.add(box(width + 0.3, height + 0.3, o.depth ?? 0.3, paint(mats, o.frame ?? 0x2a2a33)));
    if (o.back) { const b = face.clone(); b.rotation.y = Math.PI; b.position.z = -face.position.z; g.add(b); }
    return g;
  }
}

// Ajusta o uv (0..1) de uma geometria para um retângulo do atlas.
export function remapUV(g, r) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, r.u0 + uv.getX(i) * (r.u1 - r.u0), r.v0 + uv.getY(i) * (r.v1 - r.v0));
  return g;
}

// Sólido de revolução a partir de um perfil [[raio, altura], ...] (cúpulas, minaretes...).
export function lathe(profile, seg = 12) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), seg);
}
// Cúpula em forma de cebola (Taj Mahal, Moscou...): raio r, altura h.
export function onionGeo(r, h, seg = 14) {
  const p = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    const rr = r * (t < 0.55 ? Math.sin((t / 0.55) * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) * (1 + 0.12 * Math.sin(t / 0.55 * Math.PI)) : (1 - (t - 0.55) / 0.45) ** 1.6);
    p.push([rr, t * h]);
  }
  return lathe(p, seg);
}
// Parede com um vão em arco (arcos do triunfo, portões): largura W, altura H, profundidade D;
// vão com meia-largura a, altura das laterais b (o topo do vão fica em b + a). pointed = arco ogival.
export function archWallGeo(W, H, D, a, b, pointed = false) {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0); s.lineTo(-a, 0); s.lineTo(-a, b);
  if (pointed) { s.quadraticCurveTo(-a, b + a * 0.9, 0, b + a * 1.25); s.quadraticCurveTo(a, b + a * 0.9, a, b); }
  else s.absarc(0, b, a, Math.PI, 0, true);
  s.lineTo(a, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -D / 2);
  return g;
}

// ---------- Fachadas ----------
// Cada fachada é um ladrilho 4x4 de "andares x janelas" (cor + mapa das janelas acesas).
const FACADES = {
  office: { wall: '#e9e7e2', win: '#3a4a60', lit: 0.36 },
  res: { wall: '#f6f1e7', win: '#3a4a60', lit: 0.36, balcony: '#c9c2b4' },
  res2: { wall: '#f4e6d8', win: '#2f4256', lit: 0.4, balcony: '#ffffff', shutters: '#3f9e7a' },
  glass: { wall: '#c9d3dc', win: '#4a6f94', lit: 0.18, glass: true },
  glass2: { wall: '#d8dfe6', win: '#5f8fb0', lit: 0.22, glass: true, gold: true },
  haussmann: { wall: '#fffaf0', win: '#38404e', lit: 0.4, tall: true, balcony: '#2a2a30', rail: true },
  haussmann2: { wall: '#fdf6ea', win: '#353c4a', lit: 0.4, tall: true, balcony: '#2a2a30', rail: true, sill: true },
  brick: { wall: '#9a4a36', win: '#2a3444', lit: 0.4, brick: '#7a3828', frame: '#f0ece0' },
  stone: { wall: '#d6ccb8', win: '#2f3846', lit: 0.4, frame: '#efe8da', tall: true },
  tokyo: { wall: '#dcdad6', win: '#2c3644', lit: 0.5, bands: true },
  adobe: { wall: '#fff6e6', win: '#4a3a2a', lit: 0.35, small: true, arch: true },
  adobe2: { wall: '#fbf0dc', win: '#3a2e24', lit: 0.3, small: true, shutters: '#3f7a9e' },
  // Roma: janelas altas com persianas (algumas fechadas), floreiras, varais e sacadas
  terracotta: { wall: '#fff4e8', win: '#3a3030', lit: 0.35, tall: true, shutters: '#3f7a4a', sill: true, closed: 0.3, flowers: 0.4, laundry: 0.12 },
  terracotta2: { wall: '#fff8ee', win: '#3a3030', lit: 0.35, tall: true, shutters: '#8a4a2a', sill: true, closed: 0.25, flowers: 0.3 },
  romano: { wall: '#fffaf2', win: '#2f2a2a', lit: 0.38, tall: true, shutters: '#5a8a5a', frame: '#f6efe2', balcony: '#3a3434', rail: true, closed: 0.2, flowers: 0.5, laundry: 0.1 },
  romano2: { wall: '#fff6ea', win: '#352e2a', lit: 0.32, arch: true, small: true, shutters: '#9a5a32', frame: '#fbf3e4', closed: 0.15, flowers: 0.25, laundry: 0.18 },
  indian: { wall: '#ffffff', win: '#3a2a2a', lit: 0.35, arch: true, frame: '#ffffff' },
  chinese: { wall: '#a8a49c', win: '#7a1a1a', lit: 0.45, frame: '#c8202a', small: true, lattice: '#e8b830' },
  // Pequim: casa de beco (hutong) de tijolo cinza com janelas de treliça vermelha
  hutong: { wall: '#8e9094', win: '#5a1a14', lit: 0.4, brick: '#7c7e82', frame: '#b8282a', small: true, lattice: '#d84a3a' },
  // Agra: casarão (haveli) com faixa pintada entre os andares e janelas com balcão (jharokha)
  haveli: { wall: '#fff4e2', win: '#3a2a22', lit: 0.35, arch: true, small: true, band: '#b8452e', shutters: '#2f8a7a' },
  jharokha: { wall: '#ffffff', win: '#3a2a2a', lit: 0.35, arch: true, jharokha: '#efdcbc' },
};
export const FACADE_KINDS = Object.keys(FACADES);
export function isGlassFacade(kind) { return !!FACADES[kind].glass; }

export function facadeTextures(kind, seed) {
  const F = FACADES[kind] || FACADES.office;
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 256; return c; };
  const cc = mk(), ce = mk();
  const a = cc.getContext('2d'), e = ce.getContext('2d');
  a.fillStyle = F.wall; a.fillRect(0, 0, 256, 256);
  e.fillStyle = '#000'; e.fillRect(0, 0, 256, 256);
  if (F.brick) {
    a.fillStyle = F.brick;
    for (let y = 0; y < 256; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < 256; x += 12) a.fillRect(x, y, 10, 1);
  }
  if (F.bands) { a.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = 0; y < 256; y += 64) a.fillRect(0, y + 54, 256, 10); }
  if (F.band) {
    for (let y = 0; y < 256; y += 64) {
      a.fillStyle = F.band; a.fillRect(0, y + 57, 256, 6);
      a.fillStyle = '#ffffff'; for (let x = 2; x < 256; x += 8) a.fillRect(x, y + 59, 3, 2);
    }
  }
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const x = col * 64, y = row * 64;
    let wx = x + 9, wy = y + 12, ww = 46, wh = 38;
    if (F.tall) { wx = x + 16; wy = y + 6; ww = 32; wh = 48; }
    if (F.small) { wx = x + 18; wy = y + 16; ww = 28; wh = 30; }
    if (F.glass) { wx = x + 2; wy = y + 3; ww = 60; wh = 58; }
    if (F.frame) { a.fillStyle = F.frame; a.fillRect(wx - 4, wy - 4, ww + 8, wh + 8); }
    if (F.shutters) { a.fillStyle = F.shutters; a.fillRect(wx - 9, wy, 8, wh); a.fillRect(wx + ww + 1, wy, 8, wh); }
    if (F.jharokha && (row + col) % 2 === 0) {
      // balcão fechado: cobertura em cúpula em cima e parapeito com mãos-francesas embaixo
      a.fillStyle = F.jharokha;
      a.beginPath(); a.ellipse(wx + ww / 2, wy + 2, ww / 2 + 6, 9, 0, Math.PI, 0); a.fill();
      a.fillRect(wx - 6, wy + wh - 4, ww + 12, 9);
      for (const bx of [wx, wx + ww - 6]) { a.beginPath(); a.moveTo(bx, wy + wh + 5); a.lineTo(bx + 6, wy + wh + 5); a.lineTo(bx + 3, wy + wh + 12); a.fill(); }
      a.fillStyle = 'rgba(0,0,0,0.25)'; a.fillRect(wx - 6, wy + wh + 3, ww + 12, 2);
    }
    a.fillStyle = F.glass ? (r() < 0.5 ? F.win : '#557da3') : F.win;
    if (F.arch) {
      a.beginPath(); a.moveTo(wx, wy + wh); a.lineTo(wx, wy + ww / 2); a.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); a.lineTo(wx + ww, wy + wh); a.fill();
    } else a.fillRect(wx, wy, ww, wh);
    a.fillStyle = 'rgba(255,255,255,0.18)'; a.fillRect(wx, wy, ww, 4);
    if (F.balcony) {
      a.fillStyle = F.balcony; a.fillRect(x + 4, wy + wh - 2, 56, F.rail ? 4 : 8);
      a.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 7; k++) a.fillRect(x + 6 + k * 8, wy + wh - 12, 2, 10);
    }
    if (F.sill) { a.fillStyle = '#ffffff'; a.fillRect(wx - 4, wy + wh, ww + 8, 4); }
    if (F.closed && r() < F.closed) { // persiana fechada (não acende)
      a.fillStyle = F.shutters; a.fillRect(wx, wy, ww, wh);
      a.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 4; k < wh; k += 5) a.fillRect(wx, wy + k, ww, 1);
      a.fillRect(wx + ww / 2 - 0.5, wy, 1, wh);
      continue;
    }
    if (F.flowers && r() < F.flowers) { // floreira com gerânios
      a.fillStyle = '#8a4a2a'; a.fillRect(wx - 2, wy + wh - 6, ww + 4, 6);
      for (let k = 0; k < 6; k++) { a.fillStyle = k % 2 ? '#3f8a3a' : ['#e8263a', '#ff5fa0', '#ff8a1a'][Math.floor(r() * 3)]; a.beginPath(); a.arc(wx + 2 + k * (ww - 4) / 5, wy + wh - 8, 3.5, 0, Math.PI * 2); a.fill(); }
    }
    if (F.laundry && r() < F.laundry) { // varal com roupas
      a.fillStyle = '#555'; a.fillRect(x, wy + wh + 3, 64, 1);
      for (let k = 0; k < 4; k++) { a.fillStyle = ['#ffffff', '#2f7bff', '#ff5fb0', '#ffd23f', '#e8262a', '#35d07f'][Math.floor(r() * 6)]; a.fillRect(x + 4 + k * 15, wy + wh + 4, 10, 9 + (k % 2) * 4); }
    }
    if (F.glass) {
      a.fillStyle = F.gold ? 'rgba(255,210,120,0.22)' : 'rgba(255,190,160,0.18)'; a.fillRect(wx, wy + wh * 0.5, ww, wh * 0.5);
      if (r() < F.lit) { e.fillStyle = '#6a86a8'; e.fillRect(wx, wy, ww, wh); }
    } else if (r() < F.lit) {
      const warm = kind === 'tokyo' && r() < 0.4 ? ['#9ad8ff', '#ff9ad8', '#c8ffb0'] : ['#ffd98a', '#ffe7b0', '#fff2d6', '#ffc870'];
      const col = warm[Math.floor(r() * warm.length)];
      e.fillStyle = col; a.fillStyle = col;
      if (F.arch) {
        for (const ctx of [a, e]) { ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.fill(); }
      } else { e.fillRect(wx, wy, ww, wh); a.fillRect(wx, wy, ww, wh); }
    }
    if (F.lattice) { // treliça chinesa por cima da janela (também apaga a luz atrás dela)
      a.fillStyle = F.lattice; e.fillStyle = '#000';
      for (let k = 1; k < 4; k++) for (const c of [a, e]) { c.fillRect(wx + k * ww / 4 - 1, wy, 2, wh); c.fillRect(wx, wy + k * wh / 4 - 1, ww, 2); }
    }
  }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
  return { map: tex(cc), emissiveMap: tex(ce) };
}

// Caixa de prédio com UV em metros (janelas do mesmo tamanho em qualquer prédio).
export function buildingGeo(w, h, d, x, y, z, rot, color, windows, ou = 0, ov = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (!windows || f === 2 || f === 3) { uv.setXY(i, 0.004, 0.004); continue; }
      const fw = f < 2 ? d : w;
      uv.setXY(i, ou + uv.getX(i) * Math.max(1, Math.round(fw / 4)) / 4, ov + uv.getY(i) * Math.max(1, Math.round(h / 3.5)) / 4);
    }
  }
  g.translate(0, h / 2, 0);
  g.rotateY(rot);
  g.translate(x, y, z);
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

// Pessoinhas simples (fila, torcida, turistas): corpo + cabeça.
export function person(mats, x, z, shirt, skin, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.35 * s, 0.4 * s, 1.3 * s, paint(mats, shirt), 0, 1.2 * s, 0, 7));
  g.add(cyl(0.18 * s, 0.18 * s, 0.6 * s, paint(mats, 0x333344), 0, 0.3 * s, 0, 5));
  g.add(sphere(0.33 * s, paint(mats, skin, 'smooth'), 0, 2.15 * s, 0, 8, 6));
  g.position.set(x, 0, z);
  return g;
}
export const SKINS = [0xf2c29a, 0xc68a5a, 0x8a5a3a, 0xf6d2b0];
export const SHIRTS = [0x2f7bff, 0x35d07f, 0xff5fb0, 0xffd23f, 0xffffff, 0xff7a1a];

// Torre de treliça (Torre Eiffel, torre vermelha e branca de Tóquio).
// o: { base (meia-largura no chão), h (altura), colors: [cor] ou função(altura)->cor, decks: [[altura, meia-largura]], top }
export function latticeTower(ctx, g, o) {
  const H = o.h, B = o.base;
  const hw = y => o.top + (B - o.top) * Math.pow(1 - y / H, o.curve || 1.7);
  const col = y => (typeof o.colors === 'function' ? o.colors(y) : o.colors);
  const levels = [];
  const nSeg = o.seg || 14;
  for (let k = 0; k <= nSeg; k++) levels.push(H * Math.pow(k / nSeg, 1.25));
  const V = (sx, sz, y) => new THREE.Vector3(sx * hw(y), y, sz * hw(y));
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let k = 0; k < nSeg; k++) {
    const y0 = levels[k], y1 = levels[k + 1];
    const th = lerpN(o.thick || 2.2, 0.5, k / nSeg);
    const p = ctx.P(col((y0 + y1) / 2), 'metal');
    for (const [sx, sz] of corners) g.add(bar(V(sx, sz, y0), V(sx, sz, y1), th, p));
    // xis nas quatro faces
    const pt = ctx.P(col((y0 + y1) / 2), 'metal');
    for (let f = 0; f < 4; f++) {
      const [ax, az] = corners[f], [bx, bz] = corners[(f + 1) % 4];
      g.add(bar(V(ax, az, y0), V(bx, bz, y1), th * 0.28, pt));
      g.add(bar(V(bx, bz, y0), V(ax, az, y1), th * 0.28, pt));
    }
  }
  for (const [y, s, c] of o.decks || []) {
    const w = hw(y) * 2 + s;
    g.add(box(w, 2.2, w, ctx.P(c || col(y), 'metal'), 0, y, 0));
    g.add(box(w - 1, 1.2, w - 1, ctx.P(0xfff0c0, 'lit'), 0, y + 1.6, 0));
  }
  return hw;
}
const lerpN = (a, b, t) => a + (b - a) * t;

// Ameias (topo de muralhas e fortes) ao longo de x.
export function crenellate(ctx, g, x0, x1, y, z, p, step = 2.4, s = 1.2) {
  for (let x = x0; x <= x1; x += step) g.add(box(s, s, s, p, x, y + s / 2, z));
}
