// Roma: bairros temáticos ao longo da pista (ruínas do Fórum, praça com fontes, fonte dos
// desejos, aqueduto, escadaria), colinas com pinheiros-guarda-chuva e a vida da rua
// (lambretas, carrinhos de gelato, bebedouros, vasos, gente e pombos).
// Tudo vai para o "saco" da cidade (vira poucas malhas) ou para instâncias.
// Nomes e placas são todos inventados.
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, archWallGeo, frustumGeo, gableGeo, lathe, SKINS, SHIRTS } from './common.js';

const TRAV = 0xe6d8b8; // travertino
const MARBLE = 0xf2ecdc;
const WATER = 0x5ab4dc;
const GRASS = 0x8fa65e;
const COBBLE = 0xb2a48e;

// ---------- Posição dentro de um bairro ----------
// z = { i, side }: a = metros ao longo da pista, l = metros para fora da beira da pista.
export function F(ctx, z, a, l) {
  const tr = ctx.track;
  const j = tr.wrap(z.i + Math.round(a / tr.spacing));
  const L = ctx.e + l;
  const x = tr.px[j] + tr.rx[j] * z.side * L, zz = tr.pz[j] + tr.rz[j] * z.side * L;
  return { x, z: zz, y: tr.groundHeight(x, zz), rot: Math.atan2(-z.side * tr.rx[j], -z.side * tr.rz[j]) };
}
// Põe um objeto (frente +z virada para a pista) no saco da cidade.
// (Também usado pelos bairros de Pequim.)
// Segurança: se algum canto da base dele ficar perto de qualquer trecho da pista, não entra.
const _box = new THREE.Box3(), _v = new THREE.Vector3();
export function put(ctx, obj, f, turn = 0) {
  _box.setFromObject(obj);
  obj.position.set(f.x, f.y, f.z);
  obj.rotation.y = f.rot + turn;
  obj.updateMatrix();
  const { min, max } = _box;
  for (const x of [min.x, (min.x + max.x) / 2, max.x]) for (const z of [min.z, (min.z + max.z) / 2, max.z]) {
    _v.set(x, 0, z).applyMatrix4(obj.matrix);
    if (ctx.near(_v.x, _v.z).d < ctx.e + 2) { ctx.zoneSkipped = (ctx.zoneSkipped || 0) + 1; return; }
  }
  ctx.bag.add(obj);
}
// Faixa de chão (grama, calçamento) acompanhando a curva da pista.
export function strip(ctx, z, a0, a1, l0, l1, color, dy = 0.08) {
  const n = Math.max(1, Math.round((a1 - a0) / 5));
  const pos = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + (a1 - a0) * k / n;
    for (const l of [l0, l1]) { const f = F(ctx, z, a, l); pos.push(f.x, f.y + dy, f.z); }
  }
  const idx = [];
  for (let k = 0; k < n; k++) { const v = 2 * k; idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); }
  ctx.bag.add(geo(g, ctx.P(color, 'flat')));
}

// ---------- Peças ----------
export function lowPerson(ctx, x, z, shirt, skin, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.3 * s, 0.38 * s, 1.5 * s, ctx.P(shirt), 0, 0.75 * s, 0, 5));
  g.add(sphere(0.3 * s, ctx.P(skin, 'smooth'), 0, 1.8 * s, 0, 5, 3));
  g.position.set(x, 0, z);
  return g;
}
function statue(ctx, x, z, s = 1.4, ped = 2.2, col = MARBLE) {
  const g = new THREE.Group();
  g.add(box(1.6 * s, ped, 1.6 * s, ctx.P(TRAV), 0, ped / 2, 0));
  const p = lowPerson(ctx, 0, 0, col, col, s); p.position.y = ped; g.add(p);
  g.add(box(1.6 * s, 0.2, 0.2, ctx.P(col), 0.5 * s, ped + 1.35 * s, 0)); // braço erguido
  g.position.set(x, 0, z);
  return g;
}
function column(ctx, x, z, h, r = 0.75, cap = true, col = MARBLE) {
  const g = new THREE.Group();
  g.add(box(r * 2.7, 0.5, r * 2.7, ctx.P(TRAV), 0, 0.25, 0));
  g.add(cyl(r * 0.88, r, h, ctx.P(col, 'smooth'), 0, 0.5 + h / 2, 0, 8));
  if (cap) g.add(box(r * 2.9, 0.6, r * 2.9, ctx.P(TRAV), 0, 0.8 + h, 0));
  g.position.set(x, 0, z);
  return g;
}
function pigeon(ctx, x, z, k) {
  const g = new THREE.Group();
  const c = [0x8b93a6, 0x7a8294, 0x9aa2b4][k % 3];
  g.add(box(0.32, 0.3, 0.55, ctx.P(c), 0, 0.3, 0));
  g.add(box(0.2, 0.2, 0.2, ctx.P(0x5a8a7a), 0, 0.5, 0.28));
  g.position.set(x, 0, z);
  g.rotation.y = k * 2.1;
  return g;
}
function obelisk(ctx, x, z, h = 16) {
  const g = new THREE.Group();
  g.add(box(4, 2.4, 4, ctx.P(TRAV), 0, 1.2, 0));
  g.add(box(3, 1, 3, ctx.P(0xd8ccb0), 0, 2.9, 0));
  g.add(geo(frustumGeo(1.7, 1.7, h, 0.62), ctx.P(0xd8c8a8), 0, 3.4 + h / 2, 0));
  g.add(cone(0.75, 1.6, ctx.P(0xd8b04a, 'metal'), 0, 4.2 + h, 0, 4));
  g.position.set(x, 0, z);
  return g;
}
// Fonte redonda: tanque, água, jatos e (opcional) estátua ou obelisco no meio.
function fountain(ctx, R, center) {
  const g = new THREE.Group();
  g.add(cyl(R, R + 0.3, 1.1, ctx.P(TRAV), 0, 0.55, 0, 14));
  g.add(cyl(R - 0.5, R - 0.5, 0.2, ctx.P(WATER, 'smooth'), 0, 1.0, 0, 14));
  g.add(cyl(R * 0.35, R * 0.45, 1.6, ctx.P(TRAV), 0, 1.4, 0, 8));
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + 0.6;
    g.add(cone(0.35, 2.4, ctx.P(0xcfeeff, 'smooth'), Math.cos(a) * R * 0.55, 2.1, Math.sin(a) * R * 0.55, 5));
  }
  g.add(cone(0.5, 3.5, ctx.P(0xcfeeff, 'smooth'), 0, 3.6, 0, 6));
  if (center === 'statue') g.add(statue(ctx, 0, 0, 1.2, 2.2));
  if (center === 'obelisk') { g.add(geo(new THREE.IcosahedronGeometry(R * 0.4, 0), ctx.P(0xcab894), 0, 2.2, 0)); g.add(obelisk(ctx, 0, 0, 15)); g.children.at(-1).position.y = 2.6; }
  return g;
}
function vespa(ctx, k) {
  const g = new THREE.Group();
  const c = ctx.P([0x8fe0c8, 0xe02030, 0xf2e6c8, 0xffd23f, 0x5aa0e0][k % 5], 'smooth');
  g.add(box(0.6, 0.6, 1.5, c, 0, 0.7, -0.15));
  g.add(box(0.6, 1.0, 0.3, c, 0, 0.95, 0.7));
  g.add(box(0.45, 0.2, 0.8, ctx.P(0x5a3a2a), 0, 1.1, -0.35));
  g.add(box(0.8, 0.1, 0.12, ctx.P(0xbbbbbb, 'metal'), 0, 1.5, 0.75));
  for (const z of [-0.75, 0.75]) { const w = cyl(0.32, 0.32, 0.2, ctx.P(0x222226), 0, 0.32, z, 8); w.rotation.z = Math.PI / 2; g.add(w); }
  return g;
}
function umbrella(ctx, x, z, c) {
  const g = new THREE.Group();
  g.add(cyl(0.06, 0.06, 2.6, ctx.P(0xdddddd), 0, 1.3, 0, 4));
  g.add(cone(1.9, 0.8, ctx.P(c), 0, 2.7, 0, 8));
  g.add(cyl(0.6, 0.6, 0.08, ctx.P(0xffffff), 0, 0.95, 0, 8));
  g.position.set(x, 0, z);
  return g;
}
// Fachada de igreja: corpo, frontão, (cúpula) e duas torres.
function church(ctx, W = 22, H = 15, dome = true, col = 0xf0e4c8) {
  const g = new THREE.Group();
  const stone = ctx.P(col);
  g.add(box(W, H, 9, stone, 0, H / 2, 0));
  g.add(box(W + 1, 1, 10, ctx.P(0xe0d2b4), 0, H + 0.5, 0));
  g.add(geo(gableGeo(2, W * 0.6, 4.5).rotateY(Math.PI / 2), stone, 0, H + 1, 4.2));
  for (let k = 0; k < 4; k++) g.add(cyl(0.6, 0.6, H - 1, ctx.P(0xfaf2e0, 'smooth'), -W * 0.3 + k * W * 0.2, (H - 1) / 2, 4.9, 6));
  g.add(box(3.2, 5.5, 0.3, ctx.P(0x4a3428), 0, 2.75, 4.6));
  g.add(box(2.6, 2.6, 0.2, ctx.P(0xffe0a0, 'lit'), 0, H - 3.5, 4.6));
  for (const s of [-1, 1]) {
    g.add(box(4, 8, 4, stone, s * (W / 2 - 2), H + 4, 1));
    g.add(box(2.4, 2.6, 4.2, ctx.P(0x3a3030), s * (W / 2 - 2), H + 5, 1));
    g.add(geo(frustumGeo(4.6, 4.6, 3, 0.05), ctx.P(0xb04a28), s * (W / 2 - 2), H + 9.5, 1));
  }
  if (dome) {
    g.add(cyl(5.5, 5.5, 4, stone, 0, H + 3, -2.5, 10));
    g.add(geo(lathe([[6, 0], [5.6, 2.5], [4, 5], [1.5, 6.5], [0.8, 6.8], [0, 6.8]], 10), ctx.P(0x8ea4ac, 'smooth'), 0, H + 5, -2.5));
    g.add(cyl(0.7, 0.7, 2.2, stone, 0, H + 12.6, -2.5, 6));
  }
  return g;
}

// ---------- Onde cabe um bairro ----------
export function findZone(ctx, len, depth, used, straight) {
  const tr = ctx.track, N = ctx.N, e = ctx.e, sp = tr.spacing;
  const half = Math.round(len / 2 / sp);
  const stepK = Math.max(1, Math.round(6 / sp));
  let best = null;
  for (let i = 0; i < N; i += Math.max(1, Math.round(8 / sp))) {
    const t = i / N;
    if (t < 0.07 || t > 0.94) continue;
    const a = tr.wrap(i - half), b = tr.wrap(i + half);
    const dot = tr.tx[a] * tr.tx[b] + tr.tz[a] * tr.tz[b];
    if (dot < straight) continue;
    let dmin = 1;
    for (const u of used) { let d = Math.abs(u - i); d = Math.min(d, N - d) / N; dmin = Math.min(dmin, d); }
    if (dmin < 0.07) continue;
    for (const side of [-1, 1]) {
      let ok = true;
      for (let k = -half; k <= half && ok; k += stepK) {
        const j = tr.wrap(i + k);
        for (const l of [9, 9 + depth * 0.5, 9 + depth]) {
          const L = e + l;
          const x = tr.px[j] + tr.rx[j] * side * L, z = tr.pz[j] + tr.rz[j] * side * L;
          if (ctx.near(x, z).d < L - 2.5 || !ctx.isFree(x, z, 2.5) || ctx.shoreS(x, z) > -10) { ok = false; break; }
        }
      }
      if (!ok) continue;
      const score = dmin + (dot - straight) * 0.15 + ctx.rand() * 0.04;
      if (!best || score > best.score) best = { i, side, score, len, depth };
    }
  }
  return best;
}
export function reserveZone(ctx, z) {
  for (let a = -z.len / 2; a <= z.len / 2; a += 6) for (let l = 6; l <= 9 + z.depth; l += 6) {
    const f = F(ctx, z, a, l);
    ctx.reserve(f.x, f.z, 4.5);
  }
}

// ---------- Os bairros ----------
const ZONES = {
  // Ruínas do Fórum: colunas em pé e quebradas, templo, arco, pinheiros e ciprestes
  foro: { len: 130, depth: 46, straight: 0.6, build(ctx, z) {
    strip(ctx, z, -65, 65, 7, 55, GRASS);
    strip(ctx, z, -20, 20, 7, 12, COBBLE, 0.1);
    // templo: pódio + colunas com a viga
    const T = new THREE.Group();
    T.add(box(18, 3, 11, ctx.P(TRAV), 0, 1.5, 0));
    T.add(box(5, 3, 3, ctx.P(TRAV), 0, 0.7, 6.5)).children.at(-1).scale.y = 0.5;
    for (let k = 0; k < 6; k++) { const c = column(ctx, -7.5 + k * 3, 4, k < 4 ? 11 : 4 + k, 0.7, k < 4); c.position.y = 3; T.add(c); }
    T.add(box(11.5, 1.6, 2.2, ctx.P(TRAV), -3, 15.6, 4));
    T.add(box(11.5, 0.6, 2.6, ctx.P(0xd8ccb0), -3, 16.7, 4));
    put(ctx, T, F(ctx, z, -28, 34), 0);
    // fileira de colunas da basílica (algumas quebradas)
    for (let k = 0; k < 9; k++) {
      const h = [9, 3, 9, 6, 2, 9, 4, 9, 1.5][k];
      put(ctx, column(ctx, 0, 0, h, 0.65, h > 8), F(ctx, z, 5 + k * 5.5, 19));
    }
    // coluna caída e blocos
    const fall = new THREE.Group();
    const c = cyl(0.7, 0.7, 7, ctx.P(MARBLE, 'smooth'), 0, 0.7, 0, 8); c.rotation.z = Math.PI / 2; fall.add(c);
    fall.add(box(1.6, 1, 1.4, ctx.P(TRAV), 4.5, 0.5, 0.8));
    fall.add(box(2.2, 0.8, 1.2, ctx.P(0xd8ccb0), -4, 0.4, -1.2));
    put(ctx, fall, F(ctx, z, 22, 31), 0.4);
    // arco de três vãos
    const A = new THREE.Group();
    A.add(geo(archWallGeo(16, 13, 4, 2.6, 6), ctx.P(TRAV)));
    for (const s of [-1, 1]) A.add(box(3.4, 5.5, 4.2, ctx.P(0xd6c8a8), s * 6.3, 2.75, 0));
    A.add(box(17, 2.4, 4.6, ctx.P(0xd8ccb0), 0, 14.2, 0));
    for (const s of [-1, 1]) for (const k of [0, 1]) A.add(cyl(0.45, 0.45, 9.5, ctx.P(MARBLE, 'smooth'), s * (3.4 + k * 4.4), 4.75, 2.4, 6));
    put(ctx, A, F(ctx, z, 42, 40), 0);
    for (const [a, l] of [[-55, 12], [-48, 44], [-10, 50], [30, 50], [56, 22], [58, 46]]) { const f = F(ctx, z, a, l); ctx.tree(f.x, f.z, 0.95 + ctx.rand() * 0.35, 'pine'); }
    for (let k = 0; k < 7; k++) { const f = F(ctx, z, -60 + k * 5, 48); ctx.tree(f.x, f.z, 0.9 + ctx.rand() * 0.2, 'cypress'); }
    for (let k = 0; k < 4; k++) put(ctx, lowPerson(ctx, 0, 0, SHIRTS[k], SKINS[k]), F(ctx, z, -8 + k * 3.5, 9.5 + (k % 2)), k);
  } },

  // Praça comprida com três fontes (a do meio com obelisco), igreja de cúpula, cafés e pombos
  piazza: { len: 120, depth: 50, straight: 0.75, build(ctx, z) {
    strip(ctx, z, -60, 60, 7, 47, COBBLE);
    strip(ctx, z, -50, 50, 18, 36, 0xc4b8a2, 0.1);
    put(ctx, fountain(ctx, 7.5, 'obelisk'), F(ctx, z, 0, 27));
    put(ctx, fountain(ctx, 4.2, 'statue'), F(ctx, z, -36, 27));
    put(ctx, fountain(ctx, 4.2, 'statue'), F(ctx, z, 36, 27));
    put(ctx, church(ctx, 24, 15, true), F(ctx, z, 0, 52));
    const cols = [0xc8202a, 0x1f8a4a, 0xf2e6c8, 0x2f6ad0];
    for (let k = 0; k < 6; k++) put(ctx, umbrella(ctx, 0, 0, cols[k % 4]), F(ctx, z, -52 + k * 7 + (k > 2 ? 62 : 0), 41));
    for (let k = 0; k < 10; k++) put(ctx, lowPerson(ctx, 0, 0, SHIRTS[k % 6], SKINS[k % 4], 0.95), F(ctx, z, -44 + k * 9.5, 15 + (k * 7) % 22), k);
    for (let k = 0; k < 18; k++) put(ctx, pigeon(ctx, 0, 0, k), F(ctx, z, -14 + (k % 6) * 1.6 + Math.floor(k / 6) * 9, 14 + (k * 5) % 6));
    // pintor com cavalete
    const easel = new THREE.Group();
    easel.add(box(1.4, 1.1, 0.1, ctx.P(0xfff8e8), 0, 1.6, 0));
    easel.add(box(0.1, 2, 0.1, ctx.P(0x7a5a3a), 0, 1, -0.1));
    easel.add(lowPerson(ctx, 0, -1.2, 0x2a2a3a, SKINS[2]));
    put(ctx, easel, F(ctx, z, 20, 16), 2.4);
  } },

  // Fonte dos desejos: palácio com nicho, estátuas, cascata e tanque grande
  fonte: { len: 70, depth: 40, straight: 0.7, build(ctx, z) {
    strip(ctx, z, -35, 35, 7, 46, COBBLE);
    const g = new THREE.Group();
    const stone = ctx.P(0xfaf2e2);
    g.add(box(42, 22, 6, stone, 0, 11, -12));
    for (let k = 0; k < 4; k++) g.add(statue(ctx, -7.5 + k * 5, -10, 0.9, 0.8)).children.at(-1).position.y = 29;
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) g.add(box(1.6, 21, 0.6, ctx.P(0xf0e6d0), s * (13 + k * 3.4), 10.5, -8.8));
    g.add(box(43, 2, 7, ctx.P(0xdccfae), 0, 23, -12));
    g.add(box(24, 5, 6, stone, 0, 26.5, -12));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) if (k !== 2 && k !== 3) g.add(box(2, 3.2, 0.2, ctx.P(0x4a4a58), -18 + k * 7.2, 5 + r * 6, -8.9));
    g.add(geo(archWallGeo(12, 19, 3, 3.4, 9), ctx.P(0xf6eedc), 0, 0, -7.5));
    g.add(box(6.8, 12.4, 0.4, ctx.P(0x8a7a62), 0, 6.2, -8.9));
    for (const s of [-1, 1]) {
      for (const k of [0, 1]) g.add(cyl(0.9, 0.9, 19, ctx.P(0xfaf2e0, 'smooth'), s * (7 + k * 9), 9.5, -8.4, 8));
      g.add(statue(ctx, s * 11.5, -7.5, 1.1, 6.5));
    }
    const nep = statue(ctx, 0, -6.6, 2, 3.2); g.add(nep);
    // rochas e cascatas
    for (let k = 0; k < 7; k++) g.add(geo(new THREE.IcosahedronGeometry(1.6 + (k % 3) * 0.6, 0), ctx.P(0xd8ccb0), -9 + k * 3, 1.3, -4.5 - (k % 2) * 1.5));
    for (const x of [-5, 0, 5]) g.add(box(2.2, 3.2, 0.4, ctx.P(0xbfe8ff, 'smooth'), x, 1.8, -3.2));
    // tanque em meia-lua
    const rim = new THREE.CylinderGeometry(15, 15, 1.2, 14, 1, true, -Math.PI / 2, Math.PI);
    g.add(geo(rim, ctx.P(TRAV), 0, 0.6, -3));
    g.add(geo(new THREE.CircleGeometry(14.6, 14, Math.PI, Math.PI).rotateX(-Math.PI / 2), ctx.P(WATER, 'smooth'), 0, 0.5, -3));
    // turistas jogando moedas
    for (let k = 0; k < 9; k++) { const a = 0.35 + k * 0.3; g.add(lowPerson(ctx, Math.cos(a) * 16.5 * (k % 2 ? 1 : -1), -3 + Math.sin(a) * 16.5, SHIRTS[k % 6], SKINS[k % 4])); }
    put(ctx, g, F(ctx, z, 0, 28));
  } },

  // Aqueduto antigo atravessando um parque de pinheiros
  aqueduto: { len: 130, depth: 30, straight: 0.8, build(ctx, z) {
    strip(ctx, z, -65, 65, 7, 38, GRASS);
    const step = 8.5;
    for (let a = -59.5; a <= 60; a += step) {
      const g = new THREE.Group();
      const broken = a > 45;
      g.add(geo(archWallGeo(step, broken ? 11 : 17, 2.8, 2.7, 8.5), ctx.P(a % 17 ? 0xd8b48a : 0xd0aa80)));
      if (!broken) g.add(box(step, 1.6, 3.4, ctx.P(0xc8a07a), 0, 17.6, 0));
      put(ctx, g, F(ctx, z, a, 26));
    }
    for (let a = -60; a <= 60; a += 16) { const f = F(ctx, z, a + 4, 12 + (a % 32 ? 0 : 3)); ctx.tree(f.x, f.z, 1 + ctx.rand() * 0.3, 'pine'); }
    for (let a = -57; a <= 57; a += 19) { const f = F(ctx, z, a, 36); ctx.tree(f.x, f.z, 1.1, 'pine'); }
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Group();
      b.add(box(3, 0.2, 0.9, ctx.P(0x7a5a3a), 0, 0.9, 0));
      for (const x of [-1.2, 1.2]) b.add(box(0.2, 0.9, 0.8, ctx.P(0x4a4a4a), x, 0.45, 0));
      put(ctx, b, F(ctx, z, -40 + k * 40, 10));
    }
  } },

  // Feira de rua: barracas de toldo listrado, caixotes de frutas, estátua e fregueses
  mercado: { len: 80, depth: 30, straight: 0.6, build(ctx, z) {
    strip(ctx, z, -40, 40, 7, 38, COBBLE);
    const aw = [[0xe8262a, 0xffffff], [0x1f8a4a, 0xffffff], [0xffc81a, 0xe8262a], [0x2f6ad0, 0xffffff], [0xff7a1a, 0xfff2c0]];
    const fruit = [0xe8262a, 0xffa020, 0xffe040, 0x6ac040, 0x8a3aa0, 0xff6a8a];
    for (let k = 0; k < 10; k++) {
      const g = new THREE.Group();
      const [c1, c2] = aw[k % aw.length];
      g.add(box(4.2, 0.9, 2, ctx.P(0x8a6a4a), 0, 0.45, 0));
      for (let f = 0; f < 4; f++) g.add(box(0.9, 0.35, 1.6, ctx.P(fruit[(k + f) % fruit.length]), -1.5 + f * 1, 1.05, 0));
      for (const x of [-2, 2]) g.add(box(0.12, 2.8, 0.12, ctx.P(0x5a4a3a), x, 1.4, -0.9));
      for (let i = 0; i < 6; i++) { const a = box(0.75, 0.1, 2.8, ctx.P(i % 2 ? c2 : c1), -1.9 + i * 0.75, 2.75, 0.3); a.rotation.x = 0.28; g.add(a); }
      g.add(lowPerson(ctx, 0.6, -1.6, SHIRTS[k % 6], SKINS[k % 4]));
      const row = k < 5 ? 0 : 1;
      put(ctx, g, F(ctx, z, -32 + (k % 5) * 16 + row * 8, row ? 30 : 16), row ? Math.PI : 0);
    }
    put(ctx, statue(ctx, 0, 0, 1.5, 3.5, 0x4a4a52), F(ctx, z, 4, 23));
    for (let k = 0; k < 8; k++) put(ctx, lowPerson(ctx, 0, 0, SHIRTS[(k + 3) % 6], SKINS[(k + 1) % 4], 0.95), F(ctx, z, -34 + k * 9, 20 + (k * 5) % 7), k);
    for (let k = 0; k < 6; k++) put(ctx, pigeon(ctx, 0, 0, k), F(ctx, z, 10 + k * 1.3, 21 + (k % 3)));
  } },

  // Escadaria florida subindo até uma igreja de duas torres, com a fonte do barquinho
  escadaria: { len: 64, depth: 56, straight: 0.7, build(ctx, z) {
    strip(ctx, z, -32, 32, 7, 18, COBBLE);
    const g = new THREE.Group();
    const n = 11, sd = 2.8, sh = 0.75;
    for (let k = 0; k < n; k++) {
      const top = (k + 1) * sh, w = 26 - k * 0.9;
      g.add(box(w, top, sd, ctx.P(k % 2 ? 0xeee4cc : 0xe4d8bc), 0, top / 2, -k * sd));
      if (k % 2 === 0) for (const s of [-1, 1]) g.add(box(1.4, 0.9, 1, ctx.P(0xff7ab8), s * (w / 2 - 1), top + 0.45, -k * sd + 0.6));
    }
    const H = n * sh;
    g.add(box(30, H, 14, ctx.P(0xe4d8bc), 0, H / 2, -n * sd - 6));
    const ch = church(ctx, 20, 13, false, 0xf2e2d0); ch.position.set(0, H, -n * sd - 9); g.add(ch);
    const ob = obelisk(ctx, 0, -n * sd - 2, 11); ob.position.y = H; g.add(ob);
    // fonte do barquinho
    const boat = new THREE.Group();
    boat.add(cyl(4.5, 4.5, 0.8, ctx.P(TRAV), 0, 0.4, 0, 12));
    boat.add(cyl(4.1, 4.1, 0.2, ctx.P(WATER, 'smooth'), 0, 0.75, 0, 12));
    boat.add(box(5, 1.2, 1.8, ctx.P(0xd8ccb0), 0, 1.2, 0));
    boat.add(cone(0.4, 1.6, ctx.P(0xcfeeff, 'smooth'), 0, 2.4, 0, 5));
    boat.position.set(0, 0, 9); g.add(boat);
    for (let k = 0; k < 8; k++) g.add(lowPerson(ctx, -9 + k * 2.6, -2 - (k % 3) * sd, SHIRTS[k % 6], SKINS[k % 4]).translateY((1 + (k % 3)) * sh));
    put(ctx, g, F(ctx, z, 0, 20));
    for (const s of [-1, 1]) { const f = F(ctx, z, s * 24, 40); ctx.tree(f.x, f.z, 1.1, 'pine'); }
  } },
};

// ---------- Colinas com pinheiros (instâncias, sem sombra) ----------
function hillPines(ctx) {
  const tr = ctx.track, e = ctx.e;
  const H = ctx.th.hills;
  if (!H) return;
  const spots = [];
  for (let k = 0; k < 900 && spots.length < 150; k++) {
    const s = tr._randomSpot(e + H[0] + 20, e + H[1] + 60, 6);
    if (!s || s.y < ctx.gl + 6) continue;
    if (!ctx.isFree(s.x, s.z, 4)) continue;
    spots.push(s);
  }
  if (!spots.length) return;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const parts = [
    { geo: new THREE.CylinderGeometry(0.35, 0.5, 8, 4).translate(0, 4, 0), color: '#6a4a32' },
    { geo: new THREE.IcosahedronGeometry(3.2, 0).scale(1.6, 0.5, 1.6).translate(0, 9, 0), colors: ['#3f6a34', '#4a7a3a', '#365e2e', '#55803f'] },
  ];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const col = new THREE.Color();
  for (const p of parts) {
    const im = new THREE.InstancedMesh(p.geo, mat, spots.length);
    spots.forEach((s, k) => {
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, k * 2.4);
      m.compose(v.set(s.x, s.y - 0.5, s.z), q, sc.setScalar(1 + (k % 5) * 0.12));
      im.setMatrixAt(k, m);
      im.setColorAt(k, col.set(p.colors ? p.colors[k % p.colors.length] : p.color));
    });
    im.receiveShadow = true;
    ctx.group.add(im);
  }
}

export const ROMA_PROPS = {
  // Antes dos prédios: reserva o chão dos bairros e monta os grandes conjuntos
  romaBairros(ctx) {
    const used = [0, ...ctx.placed.filter(p => p.i !== undefined).map(p => p.i)];
    for (const id of ['piazza', 'foro', 'fonte', 'aqueduto', 'escadaria', 'mercado']) {
      const Z = ZONES[id];
      const z = findZone(ctx, Z.len, Z.depth, used, Z.straight);
      if (!z) continue; // não coube nesta pista: tudo bem, os outros bairros aparecem
      used.push(z.i);
      reserveZone(ctx, z);
      Z.build(ctx, z);
      (ctx.track.romaZones = ctx.track.romaZones || []).push({ id, i: z.i, side: z.side });
    }
    if (ctx.zoneSkipped) ctx.warn.push(`${ctx.zoneSkipped} peças de Roma perto demais da pista (não colocadas)`);
    hillPines(ctx);
  },
  // Depois dos prédios: a vida da rua na calçada
  romaRua(ctx) {
    const spots = ctx.propSpots(30, 10, 14, 48, 3);
    spots.forEach((s, k) => {
      const g = new THREE.Group();
      const kind = k % 5;
      if (kind === 0 || kind === 3) {
        // lambretas estacionadas
        for (let n = 0; n < 2 + (k % 2); n++) { const v = vespa(ctx, k + n); v.position.set(-1.5 + n * 1.4, 0, 0); v.rotation.y = 0.3; g.add(v); }
        g.add(lowPerson(ctx, 2.4, 0.8, SHIRTS[k % 6], SKINS[k % 4]));
      } else if (kind === 1) {
        // carrinho de gelato
        g.add(box(2.4, 1.1, 1.2, ctx.P(0xf2e6c8), 0, 1.0, 0));
        for (let c = 0; c < 4; c++) g.add(box(0.45, 0.2, 0.45, ctx.P([0xffc8e0, 0xfff2b0, 0x9a5a3a, 0xb8f0c8][c]), -0.8 + c * 0.53, 1.65, 0));
        const st = [0xff7ab8, 0xffffff];
        for (let i = 0; i < 6; i++) { const a = box(0.5, 0.1, 1.6, ctx.P(st[i % 2]), -1.25 + i * 0.5, 2.6, 0); g.add(a); }
        for (const x of [-1, 1]) { const w = cyl(0.35, 0.35, 0.15, ctx.P(0x333333), x, 0.35, 0.65, 8); w.rotation.x = Math.PI / 2; g.add(w); }
        g.add(cyl(0.05, 0.05, 1.2, ctx.P(0xdddddd), 0, 2.0, 0, 4));
        g.add(lowPerson(ctx, 0, -1.2, 0xffffff, SKINS[(k + 1) % 4]));
        g.add(lowPerson(ctx, 1.4, 1.4, SHIRTS[(k + 2) % 6], SKINS[k % 4], 0.7));
      } else if (kind === 2) {
        // bebedouro de rua e vasos de flores
        g.add(cyl(0.25, 0.3, 1.2, ctx.P(0x3a3e44, 'metal'), 0, 0.6, 0, 6));
        g.add(box(0.5, 0.2, 0.7, ctx.P(0x3a3e44, 'metal'), 0, 0.1, 0.25));
        for (const x of [-1.8, 1.8]) {
          g.add(cyl(0.55, 0.4, 0.8, ctx.P(0xb8562e), x, 0.4, 0, 6));
          g.add(geo(new THREE.IcosahedronGeometry(0.75, 0), ctx.P(0x4a8a3a), x, 1.2, 0));
          g.add(box(0.3, 0.3, 0.3, ctx.P(0xff4a6a), x + 0.3, 1.7, 0.3));
        }
      } else {
        // conversa na calçada e pombos
        for (let n = 0; n < 3; n++) g.add(lowPerson(ctx, -1 + n * 1.1, (n % 2) * 0.8, SHIRTS[(k + n) % 6], SKINS[(k + n) % 4]));
        for (let n = 0; n < 4; n++) g.add(pigeon(ctx, -1.5 + n * 0.9, 2 + (n % 2) * 0.6, n));
      }
      g.position.set(s.x, ctx.track.groundHeight(s.x, s.z), s.z);
      g.rotation.y = s.rot;
      ctx.bag.add(g);
    });
  },
};
