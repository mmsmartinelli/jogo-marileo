// Marcos da África, da Ásia e da Oceania: Cairo, Dubai, Agra, Pequim, Tóquio e Sydney.
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, bar, beam, lathe, onionGeo, archWallGeo, frustumGeo, latticeTower, crenellate, person, SKINS, SHIRTS } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Telhado oriental com as pontas levantadas (pagodes, templos, portais).
function eastRoof(ctx, g, w, d, h, y, color, x = 0, z = 0) {
  g.add(geo(frustumGeo(w, d, h, 0.42), ctx.P(color), x, y + h / 2, z));
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const tip = cone(0.45, 2.4, ctx.P(color), x + sx * w / 2, y + 0.6, z + sz * d / 2, 4);
    tip.rotation.set(sz * 0.9, 0, -sx * 0.9);
    g.add(tip);
  }
}
// Pavilhão com cúpula (chhatri) da Índia.
function chhatri(ctx, g, x, y, z, s, col = 0xf6f2ea) {
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(cyl(0.25 * s, 0.25 * s, 2.4 * s, ctx.P(col), x + a * s, y + 1.2 * s, z + b * s, 5));
  g.add(box(2.8 * s, 0.4 * s, 2.8 * s, ctx.P(col), x, y + 2.6 * s, z));
  g.add(geo(onionGeo(1.3 * s, 2.4 * s, 8), ctx.P(col, 'smooth'), x, y + 2.8 * s, z));
}
// Minarete com sacadas.
function minaret(ctx, g, x, z, h, r, col, top = 'onion') {
  g.add(cyl(r * 0.8, r, h, ctx.P(col, 'smooth'), x, h / 2, z, 10));
  for (const f of [0.35, 0.65, 0.95]) g.add(cyl(r * 1.35, r * 1.2, 0.8, ctx.P(col), x, h * f, z, 10));
  if (top === 'onion') g.add(geo(onionGeo(r * 1.1, r * 2.4, 10), ctx.P(col, 'smooth'), x, h, z));
  else g.add(cone(r * 0.9, r * 3, ctx.P(col, 'smooth'), x, h + r * 1.5, z, 10));
}

export const LANDMARKS_B = {
  // ======================= CAIRO =======================
  mesquita: {
    w: 56, d: 44, scale: 1.3,
    build(ctx, g) {
      const white = 0xf2e6cc;
      g.add(box(36, 14, 26, ctx.P(white), 0, 7, -4));
      g.add(cyl(9, 9, 6, ctx.P(white), 0, 17, -4, 16));
      g.add(geo(lathe([[9.3, 0], [9, 4], [7, 8.5], [3.5, 11], [0.6, 12], [0, 13]], 16), ctx.P(0x5aa8a0, 'smooth'), 0, 20, -4));
      for (const s of [-1, 1]) { g.add(cyl(4, 4, 3, ctx.P(white), s * 12, 15.5, -4, 12)); g.add(geo(lathe([[4.2, 0], [3.6, 2.4], [1.4, 4.4], [0, 5]], 12), ctx.P(0x5aa8a0, 'smooth'), s * 12, 17, -4)); }
      for (const s of [-1, 1]) minaret(ctx, g, s * 22, 6, 40, 1.8, white, 'cone');
      for (let k = 0; k < 5; k++) g.add(geo(archWallGeo(5, 9, 1, 1.5, 4, true), ctx.P(0xe6d6b0), -12 + k * 6, 0, 9.5));
      g.add(box(30, 0.6, 1.2, ctx.P(0x4a3a2a, 'lit'), 0, 5, 9.2));
    },
  },
  obelisco: {
    w: 14, d: 14, scale: 1.5,
    build(ctx, g) {
      g.add(box(8, 3, 8, ctx.P(0xc8a878), 0, 1.5, 0));
      g.add(geo(frustumGeo(3.6, 3.6, 30, 0.62), ctx.P(0xd8b078), 0, 18, 0));
      g.add(geo(new THREE.ConeGeometry(1.6, 3.2, 4).rotateY(Math.PI / 4), ctx.P(0xf2c040, 'metal'), 0, 34.6, 0));
      for (let k = 0; k < 6; k++) g.add(box(0.8, 1.2, 0.3, ctx.P(0x8a6a40), (k % 2 - 0.5) * 0.9, 8 + k * 3.6, 1.6 - k * 0.04));
    },
  },

  // ======================= DUBAI =======================
  moldura: {
    kind: 'span', w: 60, d: 10, pillar: 10,
    build(ctx, g) {
      const e = ctx.e, px = e + 1.6 + 5, H = 74;
      const gold = ctx.P(0xd6a83a, 'metal'), glass = ctx.P(0x9ac8e8, 'glass');
      for (const s of [-1, 1]) {
        g.add(box(10, H, 9, gold, s * px, H / 2, 0));
        for (let y = 8; y < H - 6; y += 9) g.add(box(10.4, 1.2, 9.4, ctx.P(0xb8882a, 'metal'), s * px, y, 0));
        g.add(box(2.2, H - 8, 9.3, glass, s * (px - 3.9), H / 2, 0));
      }
      g.add(box(2 * px + 10, 10, 9, gold, 0, H + 5, 0));
      g.add(box(2 * px - 10, 3, 9.4, glass, 0, H + 5, 0));
      g.add(box(2 * px + 11, 0.8, 10, ctx.P(0xfff0c0, 'neon'), 0, H + 10.4, 0));
    },
  },

  // ======================= AGRA =======================

  // ======================= PEQUIM =======================
  portalChines: {
    kind: 'span', w: 64, d: 6, pillar: 3,
    build(ctx, g) {
      const e = ctx.e, px = e + 1.6 + 1.5, red = ctx.P(0xc8202a, 'smooth'), green = 0x2a7a4a, gold = ctx.P(0xe8b830, 'metal');
      for (const s of [-1, 1]) {
        g.add(cyl(1.4, 1.5, 21, red, s * px, 10.5, 0, 10));
        g.add(box(4.2, 2.4, 4.2, ctx.P(0xd8d2c4), s * px, 1.2, 0));
        for (const z of [-2.2, 2.2]) { const sp = box(0.5, 5, 0.5, red, s * px, 3, z); sp.rotation.x = z > 0 ? 0.4 : -0.4; g.add(sp); }
      }
      g.add(box(2 * px + 6, 2.2, 2.2, red, 0, 17, 0));
      // viga pintada colorida
      const band = ctx.signPlane('', 2 * px + 4, 3.2, { bg: '#1f6a8a', draw: (c, w, h) => { for (let x = 0; x < w; x += 48) { c.fillStyle = ['#2a9a5a', '#e8b830', '#c8202a', '#2a6ad8'][(x / 48) % 4]; c.beginPath(); c.arc(x + 24, h / 2, h * 0.36, 0, 7); c.fill(); } } });
      for (const fz of [-1, 1]) { const b = band.clone(); b.position.set(0, 19.8, fz * 1.25); b.rotation.y = fz > 0 ? 0 : Math.PI; g.add(b); }
      g.add(box(2 * px + 4, 3.4, 2.2, ctx.P(0x1f6a8a), 0, 19.8, 0));
      const plaque = ctx.sign('PEQUIM', 7, 2.6, { bg: '#1f3a8a', fg: '#ffd23f', frame: 0xe8b830 });
      plaque.position.set(0, 19.8, 1.6); g.add(plaque);
      const pb = plaque.clone(); pb.rotation.y = Math.PI; pb.position.z = -1.6; g.add(pb);
      eastRoof(ctx, g, 2 * px + 12, 7, 3.2, 21.4, green);
      g.add(box(2 * px + 4, 1, 1, gold, 0, 24.8, 0));
      for (const s of [-1, 1]) g.add(sphere(0.9, gold, s * (px + 2), 25.5, 0, 8, 6));
      // lanternas vermelhas penduradas bem no alto do vão (sempre acima de 9 m) e nos beirais
      for (let k = -3; k <= 3; k++) {
        const x = (k * (px - 1.4)) / 3;
        g.add(cyl(0.05, 0.05, 2.2, ctx.P(0x3a2a20), x, 16, 0, 4));
        const lan = sphere(1.15, ctx.P(0xff2a1a, 'neon'), x, 14.4, 0, 8, 6); lan.scale.set(1, 1.25, 1); g.add(lan);
        g.add(cyl(0.55, 0.55, 0.25, gold, x, 15.8, 0, 6)); g.add(cyl(0.55, 0.55, 0.25, gold, x, 13, 0, 6));
        g.add(cone(0.2, 1.6, ctx.P(0xff2a1a), x, 12, 0, 4));
      }
      for (const s of [-1, 1]) for (const z of [-3.4, 3.4]) { const lan = sphere(0.8, ctx.P(0xff2a1a, 'neon'), s * (px + 6.2), 21.2, z, 8, 6); lan.scale.y = 1.2; g.add(lan); }
    },
  },

  // ======================= TÓQUIO =======================
  torreTrelica: {
    w: 44, d: 44,
    build(ctx, g) {
      const T = new THREE.Group(); g.add(T);
      const col = y => (Math.floor(y / 11) % 2 ? 0xf6f6f6 : 0xff4a1a);
      latticeTower(ctx, T, { base: 17, top: 1.4, h: 112, colors: col, thick: 2.4, curve: 1.6, seg: 16, decks: [[48, 4, 0xf0f0f0], [82, 2.2, 0xf0f0f0]] });
      g.add(cyl(4.6, 4.6, 7, ctx.P(0xf0f0f0), 0, 52, 0, 8));
      g.add(cyl(2.8, 2.8, 5, ctx.P(0xf0f0f0), 0, 85, 0, 8));
      g.add(cone(0.5, 14, ctx.P(0xff4a1a, 'metal'), 0, 119, 0, 6));
      g.add(sphere(0.8, ctx.P(0xff2020, 'neon'), 0, 126.5, 0, 6, 4));
      g.add(box(30, 8, 30, ctx.P(0xe6e2dc), 0, 4, 0));
      for (let y = 6; y < 110; y += 8) g.add(sphere(0.4, ctx.P(0xffb070, 'neon'), 17 * Math.pow(1 - y / 112, 1.6) + 1.8, y, 0, 4, 3));
    },
  },
  pagode: {
    w: 34, d: 34,
    build(ctx, g) {
      const red = ctx.P(0xc8302a), white = ctx.P(0xf4f0e6), roofC = 0x3a4048;
      g.add(box(22, 2, 22, ctx.P(0xb8b0a0), 0, 1, 0));
      let y = 2, s = 14;
      for (let k = 0; k < 5; k++) {
        const h = 5.4 - k * 0.3;
        g.add(box(s, h, s, white, 0, y + h / 2, 0));
        for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(box(0.8, h, 0.8, red, x * s / 2, y + h / 2, z * s / 2));
        g.add(box(s * 0.3, h * 0.6, 0.3, ctx.P(0x3a2a20, 'lit'), 0, y + h * 0.45, s / 2 + 0.05));
        eastRoof(ctx, g, s + 7, s + 7, 1.8, y + h, roofC);
        y += h + 1.8;
        s *= 0.84;
      }
      g.add(cyl(0.35, 0.35, 12, ctx.P(0xd8b04a, 'metal'), 0, y + 6, 0, 6));
      for (let k = 0; k < 7; k++) g.add(cyl(1.1 - k * 0.08, 1.1 - k * 0.08, 0.3, ctx.P(0xd8b04a, 'metal'), 0, y + 1.5 + k * 1.2, 0, 8));
    },
  },
  torii: {
    kind: 'span', w: 64, d: 6, pillar: 3.4,
    build(ctx, g) {
      const e = ctx.e, px = e + 1.6 + 1.7, red = ctx.P(0xe8322a, 'smooth'), black = ctx.P(0x222226);
      for (const s of [-1, 1]) {
        g.add(cyl(1.5, 1.8, 24, red, s * px, 12, 0, 12));
        g.add(cyl(2.1, 2.1, 2, black, s * px, 1, 0, 12));
      }
      g.add(box(2 * px + 4, 1.8, 1.8, red, 0, 18.5, 0));
      // viga de cima, curvada para cima nas pontas
      const k1 = box(2 * px + 8, 2.2, 2.6, red, 0, 24, 0); g.add(k1);
      g.add(box(2 * px + 10, 1.2, 3, black, 0, 25.6, 0));
      for (const s of [-1, 1]) {
        const tip = box(8, 1.6, 3, black, s * (px + 7.5), 26.6, 0); tip.rotation.z = s * 0.22; g.add(tip);
        const t2 = box(8, 2, 2.6, red, s * (px + 7), 25, 0); t2.rotation.z = s * 0.22; g.add(t2);
      }
      g.add(box(2.2, 4.6, 1.2, red, 0, 21.2, 0));
      const pl = ctx.sign('TÓQUIO', 3.6, 1.6, { bg: '#1a1a1a', fg: '#ffd23f', frame: false, depth: 0.2 });
      pl.position.set(0, 21.2, 0.7); g.add(pl);
      const pb = pl.clone(); pb.rotation.y = Math.PI; pb.position.z = -0.7; g.add(pb);
    },
  },

  // ======================= SYDNEY =======================
  ponteArco: {
    kind: 'far', water: 'in', w: 220, d: 30, offs: [40, 80, 130, 190],
    build(ctx, g) {
      const steel = ctx.P(0x7a8088, 'metal'), granite = ctx.P(0xc8bca4);
      const S = 80, Hs = 58, deck = 22;
      for (const z of [-7, 7]) {
        const up = [], lo = [];
        for (let k = 0; k <= 20; k++) { const u = k / 20, x = -S + 2 * S * u, f = 1 - (2 * u - 1) ** 2; up.push(V(x, deck + 4 + (Hs - deck) * f, z)); lo.push(V(x, deck - 4 + (Hs - 10 - deck) * f * 0.92 + 6 * f, z)); }
        for (let k = 0; k < 20; k++) {
          g.add(bar(up[k], up[k + 1], 1.6, steel));
          g.add(bar(lo[k], lo[k + 1], 2, steel));
          g.add(bar(up[k], lo[k], 0.6, steel));
          g.add(bar(up[k], lo[k + 1], 0.4, steel));
        }
      }
      g.add(box(2 * S + 50, 2, 16, ctx.P(0x5a6068), 0, deck, 0));
      for (const s of [-1, 1]) {
        g.add(box(12, deck + 26, 16, granite, s * (S + 6), (deck + 26) / 2, 0));
        g.add(box(13, 3, 17, ctx.P(0xb0a488), s * (S + 6), deck + 26, 0));
        g.add(box(8, deck, 8, granite, s * (S + 22), deck / 2, 0));
      }
      g.add(box(2 * S + 50, 0.6, 16.4, ctx.P(0xffe0a0, 'neon'), 0, deck - 1.1, 0));
    },
  },
  torreAgulha: {
    w: 24, d: 24,
    build(ctx, g) {
      const steel = ctx.P(0xd8dde4, 'metal'), gold = ctx.P(0xd6a83a, 'metal');
      g.add(box(18, 10, 18, ctx.P(0xc8ccd2), 0, 5, 0));
      g.add(cyl(2.4, 3, 92, steel, 0, 54, 0, 10));
      g.add(cyl(9, 9, 12, gold, 0, 100, 0, 16));
      g.add(cyl(9.3, 9.3, 3, ctx.P(0x8ab8e0, 'glass'), 0, 104, 0, 16));
      g.add(cyl(6, 9, 3, gold, 0, 92.5, 0, 16));
      g.add(cone(0.6, 22, steel, 0, 117, 0, 6));
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.add(beam(V(Math.cos(a) * 2.6, 92, Math.sin(a) * 2.6), V(Math.cos(a) * 8.6, 10, Math.sin(a) * 8.6), 0.08, steel, 3)); }
    },
  },
};
