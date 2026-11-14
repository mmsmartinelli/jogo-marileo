// Pequim: bairros temáticos ao longo da pista (beco de casas com pátio, lago com ponte de
// mármore e pagode branco, praça do tai chi com a torre do tambor, mercado noturno,
// jardim do pagode com portão-lua e bambus) e a vida da rua (bicicletas, triciclos,
// carrinho de bolinhos no vapor, leões de pedra, xadrez chinês na calçada).
// Tudo vai para o "saco" da cidade (vira poucas malhas). Nomes e placas são inventados.
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, frustumGeo, UP, SKINS, SHIRTS } from './common.js';
import { F, put, strip, findZone, reserveZone, lowPerson } from './roma.js';

const GRAY = 0x8c8e92; // tijolo cinza dos becos
const GRAY_ROOF = 0x4a4f58;
const RED = 0xc42a2a;
const RED_D = 0x8e1c1c;
const GOLD = 0xe8b830;
const GREEN_T = 0x2a7a4a; // telha verde esmaltada
const YELLOW_T = 0xe0a020; // telha amarela (palácio)
const BLUE_B = 0x1f6a8a; // viga pintada
const MARBLE = 0xf2efe6;
const STONE = 0xb8b4aa;
const WATER = 0x4a9cc4;
const PAVE = 0xb4aea2;
const GRASS = 0x86a85a;

// ---------- Peças ----------
// Pontas levantadas nos cantos de um telhado.
function tips(ctx, g, w, d, y, p, x = 0, z = 0, s = 1) {
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const t = cone(0.35 * s, 2 * s, p, x + sx * w / 2, y + 0.5 * s, z + sz * d / 2, 4);
    t.rotation.set(sz * 0.9, 0, -sx * 0.9);
    g.add(t);
  }
}
// Telhado chinês: tronco de pirâmide baixo, cumeeira com enfeites e pontas levantadas.
function roof(ctx, g, w, d, h, y, color, x = 0, z = 0) {
  const p = ctx.P(color);
  g.add(geo(frustumGeo(w, d, h, 0.38), p, x, y + h / 2, z));
  g.add(box(w * 0.38 + 1, 0.55, 0.6, p, x, y + h + 0.2, z));
  for (const s of [-1, 1]) g.add(box(0.5, 1.2, 0.7, p, x + s * (w * 0.19 + 0.5), y + h + 0.55, z));
  tips(ctx, g, w, d, y, p, x, z);
}
// Lanterna vermelha com tampas douradas e franja.
// (Leve: as pequenas, que aparecem às dezenas, nem têm tampa.)
function lantern(ctx, g, x, y, z, s = 1) {
  const l = sphere(0.8 * s, ctx.P(0xff2a1a, 'neon'), x, y, z, 6, 4); l.scale.y = 1.2; g.add(l);
  if (s >= 0.6) {
    g.add(cyl(0.45 * s, 0.45 * s, 0.18 * s, ctx.P(GOLD), x, y + 0.95 * s, z, 5));
    g.add(cyl(0.45 * s, 0.45 * s, 0.18 * s, ctx.P(GOLD), x, y - 0.95 * s, z, 5));
  }
  g.add(cyl(0.06 * s, 0.14 * s, 0.9 * s, ctx.P(0xff2a1a), x, y - 1.45 * s, z, 3));
}
// Fio de lanternas entre dois postes (ao longo de x).
function lanternLine(ctx, g, x0, x1, y, z, n) {
  g.add(box(x1 - x0, 0.06, 0.06, ctx.P(0x2a2220), (x0 + x1) / 2, y, z));
  for (let k = 0; k < n; k++) lantern(ctx, g, x0 + (x1 - x0) * (k + 0.5) / n, y - 0.9 - (k % 2) * 0.25, z, 0.45);
}
// Portão vermelho de casa com pátio: porta dupla, tambores de pedra e lanternas.
function door(ctx, g, x, y, z, lan = true) {
  g.add(box(2.4, 3, 0.25, ctx.P(RED_D), x, y + 1.5, z));
  g.add(box(0.08, 3, 0.3, ctx.P(GOLD), x, y + 1.5, z));
  g.add(box(3, 0.45, 0.4, ctx.P(BLUE_B), x, y + 3.2, z));
  for (const s of [-1, 1]) {
    const dr = cyl(0.45, 0.45, 0.4, ctx.P(STONE), x + s * 1.55, y + 0.45, z + 0.3, 8); dr.rotation.x = Math.PI / 2; g.add(dr);
    if (lan) lantern(ctx, g, x + s * 1.8, y + 3.2, z + 0.6, 0.55);
  }
}
// Salão tradicional: base de pedra, paredes, colunas vermelhas, viga pintada e telhado.
function hall(ctx, w, d, h, o = {}) {
  const g = new THREE.Group();
  g.add(box(w + 1.2, 0.8, d + 1.2, ctx.P(o.base ?? STONE), 0, 0.4, 0));
  g.add(box(w, h, d, ctx.P(o.wall ?? RED), 0, 0.8 + h / 2, 0));
  if (o.cols !== false) {
    const n = Math.max(2, Math.round(w / 3.2));
    for (let k = 0; k <= n; k++) g.add(cyl(0.28, 0.3, h, ctx.P(RED), -w / 2 + k * w / n, 0.8 + h / 2, d / 2 + 0.7, 6));
  }
  g.add(box(w + 0.4, 0.7, 0.3, ctx.P(o.beam ?? BLUE_B), 0, 0.45 + h, d / 2 + 0.85));
  roof(ctx, g, w + 3, d + 3.2, Math.min(3.6, d * 0.42), 0.8 + h, o.roof ?? GRAY_ROOF);
  if (o.door !== false) door(ctx, g, 0, 0.8, d / 2 + 0.05, o.lan !== false);
  return g;
}
// Muro de tijolo cinza com telhadinho.
function wall(ctx, len, h = 3.4, col = GRAY) {
  const g = new THREE.Group();
  g.add(box(len, h, 0.8, ctx.P(col), 0, h / 2, 0));
  g.add(geo(frustumGeo(len + 0.4, 1.8, 0.7, 0.3), ctx.P(GRAY_ROOF), 0, h + 0.35, 0));
  return g;
}
// Pavilhão de oito colunas com telhado de um ou dois andares.
function pavilion(ctx, r, h, roofC, tiers = 1) {
  const g = new THREE.Group();
  g.add(cyl(r + 0.8, r + 1.1, 0.8, ctx.P(MARBLE), 0, 0.4, 0, 8));
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.add(cyl(0.22, 0.26, h, ctx.P(RED), Math.cos(a) * r, 0.8 + h / 2, Math.sin(a) * r, 6)); }
  g.add(cyl(r + 0.3, r + 0.3, 0.6, ctx.P(BLUE_B), 0, 0.5 + h, 0, 8));
  let y = 0.8 + h;
  for (let t = 0; t < tiers; t++) {
    const R = (r + 2.4) * (1 - t * 0.32), p = ctx.P(roofC);
    g.add(cone(R, 2.6, p, 0, y + 1.3, 0, 8));
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, t2 = cone(0.25, 1.5, p, Math.cos(a) * R, y + 0.4, Math.sin(a) * R, 4);
      t2.quaternion.setFromUnitVectors(UP, new THREE.Vector3(Math.cos(a), 1.1, Math.sin(a)).normalize());
      g.add(t2);
    }
    if (t < tiers - 1) g.add(cyl(R * 0.45, R * 0.45, 1.6, ctx.P(RED), 0, y + 2.4, 0, 8));
    y += 2.2;
  }
  g.add(sphere(0.5, ctx.P(GOLD), 0, y + 0.9, 0, 6, 4));
  return g;
}
// Pagode de vários andares (octogonal, telhados verdes).
function pagoda(ctx, floors = 7, r0 = 4.4) {
  const g = new THREE.Group();
  g.add(cyl(r0 + 2.6, r0 + 3.2, 1.4, ctx.P(MARBLE), 0, 0.7, 0, 8));
  let y = 1.4;
  for (let f = 0; f < floors; f++) {
    const r = r0 * (1 - f * 0.075), h = f === 0 ? 5 : 3.2;
    g.add(cyl(r, r, h, ctx.P(f % 2 ? 0xb83a2a : 0xc8462e), 0, y + h / 2, 0, 8));
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 8; const w = box(1, h * 0.5, 0.2, ctx.P(0x3a1a12), Math.cos(a) * r * 0.97, y + h * 0.5, Math.sin(a) * r * 0.97); w.rotation.y = -a + Math.PI / 2; g.add(w); }
    const R = r + 2.2, p = ctx.P(f % 2 ? GREEN_T : 0x237050);
    g.add(cone(R, 2, p, 0, y + h + 0.6, 0, 8));
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, t = cone(0.22, 1.3, p, Math.cos(a) * R, y + h - 0.2, Math.sin(a) * R, 4);
      t.quaternion.setFromUnitVectors(UP, new THREE.Vector3(Math.cos(a), 1.1, Math.sin(a)).normalize());
      g.add(t);
    }
    y += h + 1.1;
  }
  g.add(cyl(0.3, 0.5, 5, ctx.P(GOLD), 0, y + 2.5, 0, 6));
  for (let k = 0; k < 4; k++) g.add(cyl(0.9 - k * 0.15, 0.9 - k * 0.15, 0.25, ctx.P(GOLD), 0, y + 1 + k * 0.9, 0, 8));
  g.add(sphere(0.6, ctx.P(GOLD), 0, y + 5.3, 0, 8, 6));
  return g;
}
// Pagode branco (estupa) de cima da ilha.
function dagoba(ctx) {
  const g = new THREE.Group();
  const w = ctx.P(0xfaf8f2, 'smooth');
  g.add(box(13, 3.4, 13, ctx.P(MARBLE), 0, 1.7, 0));
  g.add(box(10.5, 1.2, 10.5, ctx.P(0xe6e2d8), 0, 4, 0));
  const b = sphere(5, w, 0, 8.6, 0, 14, 9); b.scale.y = 1.08; g.add(b);
  g.add(box(2.4, 3, 0.6, ctx.P(RED_D), 0, 8.4, 4.8));
  g.add(cyl(1.8, 2.3, 1.6, w, 0, 14, 0, 10));
  g.add(cyl(0.7, 1.6, 6.4, w, 0, 18, 0, 10));
  for (let k = 0; k < 5; k++) g.add(cyl(1.55 - k * 0.18, 1.55 - k * 0.18, 0.22, ctx.P(0xe8e4da), 0, 15.6 + k * 1.15, 0, 10));
  g.add(cyl(2.4, 2.6, 0.45, ctx.P(GOLD), 0, 21.4, 0, 12));
  g.add(sphere(0.9, ctx.P(GOLD), 0, 22.6, 0, 8, 6));
  return g;
}
// Ponte de mármore em arco (atravessa ao longo de x).
function humpBridge(ctx, L = 20, W = 4.4, H = 4) {
  const g = new THREE.Group();
  const n = 10, m = ctx.P(MARBLE), rail = ctx.P(0xe8e4da);
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n;
    const x0 = -L / 2 + L * t0, x1 = -L / 2 + L * t1;
    const y0 = H * Math.sin(Math.PI * t0), y1 = H * Math.sin(Math.PI * t1);
    const len = Math.hypot(x1 - x0, y1 - y0) + 0.12, ang = Math.atan2(y1 - y0, x1 - x0);
    const s = box(len, 0.7, W, m, (x0 + x1) / 2, (y0 + y1) / 2, 0); s.rotation.z = ang; g.add(s);
    for (const sd of [-1, 1]) { const r = box(len, 0.9, 0.3, rail, (x0 + x1) / 2, (y0 + y1) / 2 + 0.75, sd * (W / 2 - 0.15)); r.rotation.z = ang; g.add(r); }
    if (k % 2 === 0) for (const sd of [-1, 1]) g.add(box(0.45, 1.5, 0.45, rail, x0, y0 + 1.0, sd * (W / 2 - 0.15)));
  }
  for (const sd of [-1, 1]) g.add(geo(new THREE.TorusGeometry(H * 0.8, 0.45, 4, 12, Math.PI), m, 0, -0.3, sd * (W / 2 - 0.2)));
  return g;
}
// Muro branco com portão-lua (abertura redonda).
function moonWall(ctx, W = 18, H = 6.6, R = 2.7) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0);
  const hole = new THREE.Path(); hole.absarc(0, R + 0.25, R, 0, Math.PI * 2, true); s.holes.push(hole);
  const eg = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false, curveSegments: 14 });
  eg.translate(0, 0, -0.4);
  g.add(geo(eg, ctx.P(0xf4f0e8)));
  g.add(geo(new THREE.TorusGeometry(R, 0.28, 4, 20), ctx.P(0x6a6c70), 0, R + 0.25, 0));
  g.add(geo(frustumGeo(W + 0.6, 2, 0.8, 0.3), ctx.P(GRAY_ROOF), 0, H + 0.4, 0));
  return g;
}
// Moita de bambu.
function bamboo(ctx, g, x, z, n, k0 = 0) {
  for (let k = 0; k < n; k++) {
    const a = (k0 + k) * 2.39996, rr = 0.3 + (k % 4) * 0.4;
    const h = 6 + ((k * 7 + k0) % 5);
    const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
    const c = cyl(0.12, 0.15, h, ctx.P(k % 3 ? 0x6aa040 : 0x82b84e), px, h / 2, pz, 5);
    c.rotation.z = ((k % 3) - 1) * 0.07;
    g.add(c);
    if (k % 2 === 0) { const l = geo(new THREE.IcosahedronGeometry(1, 0), ctx.P(k % 4 ? 0x4f9a3a : 0x5aa844), px, h - 0.4, pz); l.scale.set(1, 1.7, 1); g.add(l); }
  }
}
// Bicicleta (as compartilhadas são amarelas e laranja).
function bike(ctx, k) {
  const g = new THREE.Group();
  const frame = ctx.P([0xffc81a, 0xff7a1a, 0x2f7bff, 0x35b07f, 0x333338][k % 5]);
  for (const z of [-0.55, 0.55]) { const w = geo(new THREE.TorusGeometry(0.36, 0.05, 3, 8), ctx.P(0x222226), 0, 0.4, z); w.rotation.y = Math.PI / 2; g.add(w); }
  g.add(box(0.07, 0.07, 1.1, frame, 0, 0.62, 0));
  const t = box(0.07, 0.6, 0.07, frame, 0, 0.72, -0.18); t.rotation.x = 0.3; g.add(t);
  g.add(box(0.2, 0.06, 0.3, ctx.P(0x222226), 0, 1.02, -0.25));
  g.add(box(0.6, 0.06, 0.06, ctx.P(0x888888), 0, 1.06, 0.48));
  g.add(box(0.36, 0.26, 0.3, frame, 0, 0.88, 0.7));
  return g;
}
// Fileira de bicicletas estacionadas.
function bikeRow(ctx, n, k0 = 0) {
  const g = new THREE.Group();
  for (let k = 0; k < n; k++) { const b = bike(ctx, k0 + k); b.position.x = -((n - 1) * 0.7) / 2 + k * 0.7; b.rotation.y = 0.15; g.add(b); }
  return g;
}
// Triciclo de carga com caixotes (ou com passageiro e capota).
function tricycle(ctx, k) {
  const g = new THREE.Group();
  const c = ctx.P([0x2f7bff, 0xc42a2a, 0x35b07f][k % 3]);
  for (const x of [-0.7, 0.7]) { const w = geo(new THREE.TorusGeometry(0.38, 0.06, 3, 8), ctx.P(0x222226), x, 0.42, 0.7); w.rotation.y = Math.PI / 2; g.add(w); }
  const fw = geo(new THREE.TorusGeometry(0.38, 0.06, 3, 8), ctx.P(0x222226), 0, 0.42, -1.1); fw.rotation.y = Math.PI / 2; g.add(fw);
  g.add(box(0.08, 0.08, 1.8, c, 0, 0.7, -0.2));
  g.add(box(1.7, 0.5, 1.4, c, 0, 0.95, 0.7));
  if (k % 2) {
    g.add(box(1.6, 0.2, 1.2, ctx.P(0x8a2a20), 0, 1.3, 0.7));
    g.add(box(1.7, 0.12, 1.5, ctx.P(0xc42a2a), 0, 2.6, 0.8));
    for (const x of [-0.8, 0.8]) g.add(box(0.06, 1.3, 0.06, ctx.P(0x333333), x, 1.95, 0.2));
    g.add(lowPerson(ctx, 0, 0.8, SHIRTS[k % 6], SKINS[k % 4], 0.75).translateY(1.1));
  } else {
    for (let n = 0; n < 4; n++) g.add(box(0.6, 0.5, 0.55, ctx.P([0xc89a5a, 0xff8a2a, 0x7ac04a][n % 3]), -0.35 + (n % 2) * 0.7, 1.45 + Math.floor(n / 2) * 0.5, 0.7));
  }
  g.add(lowPerson(ctx, 0, -0.6, SHIRTS[(k + 2) % 6], SKINS[(k + 1) % 4], 0.85));
  return g;
}
// Leão de pedra guardião (um par, um de cada lado de uma porta).
function lion(ctx, x, z) {
  const g = new THREE.Group();
  const p = ctx.P(0x9a968c);
  g.add(box(1.4, 1.1, 1.8, p, 0, 0.55, 0));
  g.add(box(0.9, 1.2, 1.1, p, 0, 1.6, -0.1));
  g.add(geo(new THREE.IcosahedronGeometry(0.62, 0), p, 0, 2.5, 0.25));
  g.add(box(0.5, 0.5, 0.4, p, 0, 2.3, 0.65));
  g.add(sphere(0.32, p, 0.35, 1.3, 0.75, 6, 4));
  g.position.set(x, 0, z);
  return g;
}
// Mesa de xadrez chinês com dois jogadores sentados e um curioso.
function xiangqi(ctx, k) {
  const g = new THREE.Group();
  g.add(cyl(0.7, 0.5, 0.8, ctx.P(STONE), 0, 0.4, 0, 8));
  g.add(box(1.1, 0.05, 1.1, ctx.P(0xe8c890), 0, 0.83, 0));
  for (let n = 0; n < 6; n++) g.add(cyl(0.08, 0.08, 0.06, ctx.P(n % 2 ? 0xc42a2a : 0x222222), -0.3 + (n % 3) * 0.3, 0.88, -0.2 + Math.floor(n / 3) * 0.4, 6));
  for (const s of [-1, 1]) {
    g.add(cyl(0.3, 0.3, 0.5, ctx.P(STONE), s * 1.2, 0.25, 0, 6));
    g.add(lowPerson(ctx, s * 1.2, 0, [0xffffff, 0x2a4a8a, 0x5a5a5a][(k + (s > 0)) % 3], SKINS[(k + 2) % 4], 0.75).translateY(0.35));
  }
  g.add(lowPerson(ctx, 0.4, -1.3, SHIRTS[(k + 3) % 6], SKINS[k % 4]));
  return g;
}
// Pessoa fazendo tai chi (braços abertos).
function taichi(ctx, x, z, k) {
  const g = lowPerson(ctx, x, z, [0xffffff, 0xf2f2f2, 0xc42a2a][k % 3], SKINS[k % 4]);
  const a = box(2, 0.16, 0.16, ctx.P(SKINS[k % 4]), 0, 1.3, 0.2); a.rotation.z = ((k % 3) - 1) * 0.5; a.rotation.y = (k % 2) * 0.6; g.add(a);
  return g;
}
// Carrinho de bolinhos no vapor (cestos de bambu empilhados).
function steamCart(ctx, k) {
  const g = new THREE.Group();
  g.add(box(2.2, 1, 1.1, ctx.P(0xd8d4cc), 0, 0.9, 0));
  for (const x of [-0.75, 0.75]) { const w = cyl(0.3, 0.3, 0.12, ctx.P(0x333333), x, 0.3, 0.6, 8); w.rotation.x = Math.PI / 2; g.add(w); }
  for (let n = 0; n < 2; n++) for (let h = 0; h < 3 - n; h++) g.add(cyl(0.42, 0.42, 0.24, ctx.P(h % 2 ? 0xd8b070 : 0xc89c5a), -0.45 + n * 0.9, 1.52 + h * 0.25, 0, 10));
  g.add(cone(0.35, 1.2, ctx.P(0xf6f6f6), -0.45, 2.6, 0, 6));
  g.add(box(2.4, 0.1, 1.3, ctx.P(k % 2 ? 0xc42a2a : 0xe8b830), 0, 2.9, 0));
  for (const x of [-1.1, 1.1]) g.add(box(0.06, 1.5, 0.06, ctx.P(0x555555), x, 2.15, -0.55));
  g.add(lowPerson(ctx, 0, -1, 0xffffff, SKINS[k % 4]));
  return g;
}
// Barraca do mercado noturno: balcão, toldo, placa e lanternas.
const STALLS = ['BOLINHOS LIN', 'CHÁ DA LUA', 'ESPETINHO DRAGÃO', 'PATO DOURADO', 'MACARRÃO MEI', 'DOCES DA SORTE'];
function stall(ctx, k) {
  const g = new THREE.Group();
  const aw = [0xc42a2a, 0xe8b830, 0xff7a1a, 0x2a7a4a][k % 4];
  g.add(box(3.6, 1.1, 1.4, ctx.P(0x8a5a3a), 0, 0.55, 0));
  g.add(box(3.8, 0.1, 1.6, ctx.P(0xd8c8a8), 0, 1.15, 0));
  for (const x of [-1.8, 1.8]) for (const z of [-0.8, 0.8]) g.add(box(0.1, 2.8, 0.1, ctx.P(0x3a2a20), x, 1.4, z));
  const t = box(4.2, 0.12, 2.4, ctx.P(aw), 0, 2.9, 0.3); t.rotation.x = 0.22; g.add(t);
  const sg = ctx.sign(STALLS[k % STALLS.length], 3.4, 0.7, { bg: '#7a1010', fg: '#ffd23f' });
  sg.position.set(0, 3.4, 0.9); g.add(sg);
  if (k % 3 === 0) for (let h = 0; h < 3; h++) g.add(cyl(0.4, 0.4, 0.22, ctx.P(0xd8b070), -1 + h * 0.05, 1.32 + h * 0.23, 0, 10));
  else if (k % 3 === 1) for (let n = 0; n < 6; n++) g.add(box(0.06, 0.06, 0.9, ctx.P(0x9a4a2a), -1.2 + n * 0.25, 1.28, 0.2));
  else for (let n = 0; n < 5; n++) g.add(sphere(0.22, ctx.P([0xff7a1a, 0xffd23f, 0xff4a6a][n % 3]), -1.2 + n * 0.5, 1.4, 0.1, 6, 4));
  lantern(ctx, g, -1.6, 2.3, 1.2, 0.4); lantern(ctx, g, 1.6, 2.3, 1.2, 0.4);
  g.add(lowPerson(ctx, 0.4, -0.5, 0xffffff, SKINS[k % 4]));
  return g;
}

// ---------- Os bairros ----------
const ZONES = {
  // Beco antigo (hutong): casas de pátio de tijolo cinza, portões vermelhos, árvores
  // nos pátios, bicicletas, triciclos e o xadrez na calçada.
  hutong: { len: 120, depth: 46, straight: 0.6, build(ctx, z) {
    strip(ctx, z, -60, 60, 7, 15, 0x9e9a92);
    for (let k = -2; k <= 2; k++) {
      const a = k * 24;
      put(ctx, hall(ctx, 13, 8, 3.6, { wall: GRAY, cols: false, beam: 0x6a6c70, base: 0x8a8a86 }), F(ctx, z, a, 20));
      if (k < 2) { const w = wall(ctx, 9); put(ctx, w, F(ctx, z, a + 12, 17.5)); }
      // fundos: salões laterais e principal em volta do pátio
      const back = hall(ctx, 12, 7, 3.8, { wall: k % 2 ? RED : GRAY, door: false, roof: GRAY_ROOF });
      put(ctx, back, F(ctx, z, a, 40));
      const f = F(ctx, z, a + (k % 2 ? 5 : -5), 30);
      ctx.tree(f.x, f.z, 1.15, k % 2 ? 'willow' : 'broadleaf');
    }
    // portal de madeira na entrada do beco, com placa
    const gate = new THREE.Group();
    for (const s of [-1, 1]) gate.add(cyl(0.4, 0.45, 6, ctx.P(RED), s * 3.4, 3, 0, 8));
    gate.add(box(8.4, 0.9, 0.7, ctx.P(BLUE_B), 0, 5.6, 0));
    roof(ctx, gate, 10, 2.6, 1.2, 6, GRAY_ROOF);
    const sg = ctx.sign('BECO DAS LANTERNAS', 5.4, 0.9, { bg: '#1f3a6a', fg: '#ffd23f', frame: 0xe8b830 });
    sg.position.set(0, 5.6, 0.45); gate.add(sg);
    put(ctx, gate, F(ctx, z, 12, 12), Math.PI / 2);
    const lines = new THREE.Group();
    lanternLine(ctx, lines, -30, 30, 5.2, 0, 14);
    for (const x of [-30, 30]) lines.add(cyl(0.1, 0.12, 5.4, ctx.P(0x3a2a20), x, 2.7, 0, 5));
    put(ctx, lines, F(ctx, z, -20, 14.5));
    put(ctx, bikeRow(ctx, 6, 0), F(ctx, z, -30, 15.5));
    put(ctx, bikeRow(ctx, 5, 3), F(ctx, z, 34, 15.5));
    put(ctx, tricycle(ctx, 0), F(ctx, z, 4, 15), 0.4);
    put(ctx, xiangqi(ctx, 1), F(ctx, z, -46, 13));
    const ln = new THREE.Group(); ln.add(lion(ctx, -2.2, 0)); ln.add(lion(ctx, 2.2, 0)); put(ctx, ln, F(ctx, z, 24, 16));
  } },

  // Lago com salgueiros, ilha com o pagode branco, ponte de mármore, pavilhão,
  // flores de lótus e barco-dragão.
  lago: { len: 150, depth: 62, straight: 0.55, build(ctx, z) {
    strip(ctx, z, -75, 75, 7, 13.5, PAVE);
    strip(ctx, z, -72, 72, 13.5, 14.5, 0xe8e4da, 0.1);
    strip(ctx, z, -72, 72, 14.5, 64, WATER, 0.02);
    for (let a = -66; a <= 66; a += 16) { const f = F(ctx, z, a, 10.5); ctx.tree(f.x, f.z, 1.05, 'willow'); }
    // ilha com o pagode branco
    const isl = new THREE.Group();
    isl.add(cyl(12, 13, 1.2, ctx.P(STONE), 0, 0.2, 0, 14));
    isl.add(cyl(11.2, 12, 1.6, ctx.P(GRASS), 0, 1.2, 0, 14));
    const dg = dagoba(ctx); dg.position.y = 2; isl.add(dg);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.4; isl.add(geo(new THREE.IcosahedronGeometry(1.8, 0), ctx.P(0x3f7a3a), Math.cos(a) * 9, 3.2, Math.sin(a) * 9)); }
    put(ctx, isl, F(ctx, z, 18, 44));
    put(ctx, humpBridge(ctx, 18, 4.2, 3.6), F(ctx, z, 18, 23), Math.PI / 2);
    // pavilhão na água com passarela
    const pv = pavilion(ctx, 3.2, 3.4, YELLOW_T, 2);
    put(ctx, pv, F(ctx, z, -42, 30));
    const walk = new THREE.Group();
    walk.add(box(2.2, 0.5, 11, ctx.P(MARBLE), 0, 0.25, 0));
    for (const s of [-1, 1]) walk.add(box(0.2, 0.7, 11, ctx.P(RED), s * 1.0, 0.85, 0));
    put(ctx, walk, F(ctx, z, -42, 15.5));
    // lótus
    for (let k = 0; k < 26; k++) {
      const a = -66 + ((k * 37) % 120), l = 16 + ((k * 13) % 40);
      if (Math.abs(a - 18) < 15 && l > 28) continue;
      const g = new THREE.Group();
      g.add(cyl(0.9, 0.9, 0.08, ctx.P(LOTUS(k)), 0, 0.12, 0, 6));
      if (k % 3 === 0) g.add(cone(0.35, 0.6, ctx.P(0xff8ab8), 0.3, 0.45, 0.2, 5));
      put(ctx, g, F(ctx, z, a, l));
    }
    // barco-dragão com remadores
    const boat = new THREE.Group();
    boat.add(box(1.8, 0.8, 14, ctx.P(RED), 0, 0.3, 0));
    boat.add(box(1.9, 0.25, 14.2, ctx.P(GOLD), 0, 0.75, 0));
    const neck = box(0.7, 2.4, 0.7, ctx.P(0x2a8a4a), 0, 1.5, 7.2); neck.rotation.x = -0.35; boat.add(neck);
    boat.add(box(1.0, 0.9, 1.6, ctx.P(0x2a8a4a), 0, 2.7, 7.9));
    boat.add(box(0.2, 0.2, 0.4, ctx.P(0xffd23f), 0.35, 3, 8.6));
    boat.add(cone(0.5, 2, ctx.P(0x2a8a4a), 0, 1.3, -7.6, 4).rotateX(-1.1));
    for (let k = 0; k < 6; k++) boat.add(lowPerson(ctx, 0, -5 + k * 1.9, k % 2 ? 0xffd23f : 0xc42a2a, SKINS[k % 4], 0.7).translateY(0.4));
    put(ctx, boat, F(ctx, z, -10, 36), 0.25);
    for (let k = 0; k < 3; k++) {
      const duck = new THREE.Group();
      duck.add(box(1.8, 0.8, 2.4, ctx.P(0xffd23f), 0, 0.3, 0));
      duck.add(box(0.8, 1, 0.8, ctx.P(0xffd23f), 0, 1.1, 0.9));
      duck.add(box(0.4, 0.2, 0.5, ctx.P(0xff7a1a), 0, 1.2, 1.4));
      put(ctx, duck, F(ctx, z, 44 + k * 7, 22 + k * 5), k * 1.3);
    }
  } },

  // Praça do tai chi diante da torre do tambor, com pipas no céu.
  taichi: { len: 110, depth: 54, straight: 0.6, build(ctx, z) {
    strip(ctx, z, -55, 55, 7, 44, PAVE);
    const tw = new THREE.Group();
    tw.add(box(30, 10, 16, ctx.P(0x9a3a30), 0, 5, 0));
    tw.add(box(31, 0.8, 17, ctx.P(STONE), 0, 10.2, 0));
    for (const x of [-8, 0, 8]) tw.add(box(4.2, 6, 0.4, ctx.P(0x2a1a14), x, 3, 8));
    for (let x = -14.5; x <= 14.5; x += 1.6) tw.add(box(0.5, 0.9, 0.5, ctx.P(STONE), x, 11, 8.1));
    const top = hall(ctx, 22, 10, 6, { door: false, roof: GRAY_ROOF });
    top.position.y = 10.6; tw.add(top);
    roof(ctx, tw, 22, 11, 3.4, 22.6, GRAY_ROOF);
    tw.add(box(17, 2.4, 7, ctx.P(RED), 0, 22.3, 0));
    const sg = ctx.sign('TORRE DO TAMBOR', 6, 1.2, { bg: '#1f3a6a', fg: '#ffd23f', frame: 0xe8b830 });
    sg.position.set(0, 9, 8.3); tw.add(sg);
    put(ctx, tw, F(ctx, z, 0, 44));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) put(ctx, taichi(ctx, 0, 0, r * 5 + c), F(ctx, z, -10 + c * 4.5, 16 + r * 4), Math.PI);
    put(ctx, lowPerson(ctx, 0, 0, 0xc42a2a, SKINS[1], 1.05), F(ctx, z, 1, 29));
    // pipas no céu, presas por linhas
    for (let k = 0; k < 3; k++) {
      const g = new THREE.Group();
      g.add(lowPerson(ctx, 0, 0, SHIRTS[k + 1], SKINS[k % 4]));
      const kite = box(2.2, 2.2, 0.08, ctx.P([0xff2a1a, 0xffd23f, 0x2f7bff][k]), 0, 16 + k * 3, -6);
      kite.rotation.z = Math.PI / 4; g.add(kite);
      g.add(box(0.12, 4, 0.04, ctx.P([0xffd23f, 0xff2a1a, 0xffffff][k]), 0, 13.5 + k * 3, -6));
      const line = cyl(0.025, 0.025, 17 + k * 3, ctx.P(0xffffff), 0, 9 + k * 1.5, -3, 3); line.rotation.x = -0.36; g.add(line);
      put(ctx, g, F(ctx, z, -40 + k * 34, 22 + (k % 2) * 6));
    }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const f = F(ctx, z, s * (30 + k * 8), 20 + k * 6); ctx.tree(f.x, f.z, 1.1, 'broadleaf'); }
    for (const s of [-1, 1]) { const b = new THREE.Group(); b.add(box(3, 0.4, 0.9, ctx.P(0x8a5a3a), 0, 0.7, 0)); for (const x of [-1.2, 1.2]) b.add(box(0.3, 0.6, 0.8, ctx.P(STONE), x, 0.3, 0)); put(ctx, b, F(ctx, z, s * 22, 11)); }
  } },

  // Mercado noturno: barracas com toldos, lanternas penduradas, mesinhas e fregueses.
  mercado: { len: 100, depth: 30, straight: 0.65, build(ctx, z) {
    strip(ctx, z, -50, 50, 7, 26, 0xa8a094);
    for (let k = 0; k < 8; k++) put(ctx, stall(ctx, k), F(ctx, z, -42 + k * 12, 21));
    const lines = new THREE.Group();
    for (let k = 0; k < 2; k++) lanternLine(ctx, lines, -46, 46, 5.6 + k * 0.5, k * 4, 22);
    for (const x of [-46, 46]) for (const zz of [0, 4]) lines.add(cyl(0.1, 0.12, 6.2, ctx.P(0x3a2a20), x, 3.1, zz, 5));
    put(ctx, lines, F(ctx, z, 0, 14));
    for (let k = 0; k < 5; k++) {
      const t = new THREE.Group();
      t.add(cyl(0.6, 0.6, 0.06, ctx.P(0xf2f2f2), 0, 0.8, 0, 8));
      t.add(cyl(0.08, 0.08, 0.8, ctx.P(0x555555), 0, 0.4, 0, 4));
      for (const s of [-1, 1]) { t.add(cyl(0.22, 0.22, 0.45, ctx.P(0xc42a2a), s * 0.9, 0.22, 0, 6)); if ((k + s) % 2) t.add(lowPerson(ctx, s * 0.9, 0, SHIRTS[(k + 2) % 6], SKINS[k % 4], 0.75).translateY(0.3)); }
      put(ctx, t, F(ctx, z, -36 + k * 18, 14.5));
    }
    for (let k = 0; k < 9; k++) put(ctx, lowPerson(ctx, 0, 0, SHIRTS[k % 6], SKINS[(k + 1) % 4]), F(ctx, z, -44 + k * 11, 17 + (k % 2)));
  } },

  // Jardim do pagode: muro branco com portão-lua, bambus, pedras e lago das carpas.
  jardim: { len: 90, depth: 56, straight: 0.55, build(ctx, z) {
    strip(ctx, z, -45, 45, 7, 58, GRASS);
    strip(ctx, z, -6, 6, 7, 30, PAVE, 0.12);
    put(ctx, moonWall(ctx), F(ctx, z, 0, 15));
    for (const s of [-1, 1]) { const w = wall(ctx, 18, 3.6, 0xf4f0e8); put(ctx, w, F(ctx, z, s * 18, 15)); }
    put(ctx, pagoda(ctx, 7), F(ctx, z, 0, 40));
    const bb = new THREE.Group();
    bamboo(ctx, bb, -14, 0, 12, 1); bamboo(ctx, bb, 14, 0, 12, 5); bamboo(ctx, bb, -24, -4, 10, 9);
    put(ctx, bb, F(ctx, z, 0, 23));
    const bb2 = new THREE.Group(); bamboo(ctx, bb2, 0, 0, 12, 3); put(ctx, bb2, F(ctx, z, -30, 44));
    const pond = new THREE.Group();
    pond.add(cyl(6, 6.4, 0.5, ctx.P(STONE), 0, 0.2, 0, 12));
    pond.add(cyl(5.5, 5.5, 0.12, ctx.P(WATER), 0, 0.5, 0, 12));
    for (let k = 0; k < 7; k++) { const a = k * 0.9; pond.add(box(0.5, 0.12, 0.2, ctx.P(k % 2 ? 0xff7a1a : 0xffffff), Math.cos(a) * 3, 0.6, Math.sin(a) * 2.6)); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const r = geo(new THREE.IcosahedronGeometry(0.7 + (k % 3) * 0.3, 0), ctx.P(0x8a8a86), Math.cos(a) * 6.8, 0.5, Math.sin(a) * 6.8); r.scale.y = 1.4; pond.add(r); }
    put(ctx, pond, F(ctx, z, 26, 30));
    put(ctx, pavilion(ctx, 2.4, 3, GREEN_T, 1), F(ctx, z, -26, 30));
    for (const s of [-1, 1]) { const f = F(ctx, z, s * 16, 50); ctx.tree(f.x, f.z, 1.2, 'pine'); }
    const ln = new THREE.Group(); ln.add(lion(ctx, -4.4, 0)); ln.add(lion(ctx, 4.4, 0)); put(ctx, ln, F(ctx, z, 0, 12.5));
  } },
};
function LOTUS(k) { return [0x4f9a4a, 0x5aa850, 0x468a42][k % 3]; }

export const PEQUIM_PROPS = {
  // Antes dos prédios: reserva o chão dos bairros e monta os grandes conjuntos
  pequimBairros(ctx) {
    const used = [0, ...ctx.placed.filter(p => p.i !== undefined).map(p => p.i)];
    for (const id of ['hutong', 'lago', 'taichi', 'jardim', 'mercado']) {
      const Z = ZONES[id];
      const z = findZone(ctx, Z.len, Z.depth, used, Z.straight);
      if (!z) continue; // não coube nesta pista: tudo bem, os outros bairros aparecem
      used.push(z.i);
      reserveZone(ctx, z);
      Z.build(ctx, z);
      (ctx.track.cityZones = ctx.track.cityZones || []).push({ id, i: z.i, side: z.side });
    }
    if (ctx.zoneSkipped) ctx.warn.push(`${ctx.zoneSkipped} peças de Pequim perto demais da pista (não colocadas)`);
  },
  // Depois dos prédios: a vida da rua na calçada
  pequimRua(ctx) {
    const spots = ctx.propSpots(30, 10, 14, 44, 3);
    spots.forEach((s, k) => {
      let g;
      const kind = k % 6;
      if (kind === 0 || kind === 4) g = bikeRow(ctx, 4 + (k % 3), k);
      else if (kind === 1) g = steamCart(ctx, k);
      else if (kind === 2) g = tricycle(ctx, k);
      else if (kind === 3) g = xiangqi(ctx, k);
      else {
        g = new THREE.Group();
        g.add(lion(ctx, -2, 0)); g.add(lion(ctx, 2, 0));
        g.add(cyl(0.1, 0.12, 4.6, ctx.P(0x3a2a20), 0, 2.3, -0.8, 5));
        lantern(ctx, g, 0, 4, -0.8, 0.7);
      }
      g.position.set(s.x, ctx.track.groundHeight(s.x, s.z), s.z);
      g.rotation.y = s.rot;
      ctx.bag.add(g);
    });
  },
};
