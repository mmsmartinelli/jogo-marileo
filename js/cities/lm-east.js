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
// Cupulazinha branca (fileira em cima de portões e muralhas).
function miniDome(ctx, g, x, y, z, s, col = 0xf6f2ea) {
  g.add(box(1.6 * s, 0.5 * s, 1.6 * s, ctx.P(col), x, y + 0.25 * s, z));
  g.add(geo(onionGeo(0.75 * s, 1.6 * s, 6), ctx.P(col, 'smooth'), x, y + 0.5 * s, z));
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
  piramides: {
    kind: 'far', w: 240, d: 150,
    build(ctx, g) {
      const sand = 0xe3c27a;
      g.add(geo(new THREE.CircleGeometry(130, 24).rotateX(-Math.PI / 2), ctx.P(0xe8c88a, 'flat'), 0, 0.12, 0));
      const pyr = (x, z, h, rot, cap) => {
        g.add(geo(new THREE.ConeGeometry(h * 1.05, h, 4).rotateY(Math.PI / 4 + rot), ctx.P(sand), x, h / 2, z));
        // degraus (linhas) para dar textura de pedra
        for (let k = 1; k < 6; k++) { const y = h * k / 6, s = h * 1.05 * (1 - k / 6) * Math.SQRT2; g.add(geo(new THREE.BoxGeometry(s + 0.4, 0.5, s + 0.4).rotateY(rot), ctx.P(0xcfa860), x, y, z)); }
        if (cap) g.add(geo(new THREE.ConeGeometry(h * 0.21, h * 0.2, 4).rotateY(Math.PI / 4 + rot), ctx.P(0xf6e2b0), x, h * 0.9, z));
      };
      pyr(-60, -20, 74, 0, true);
      pyr(20, 10, 66, 0.05, true);
      pyr(80, 38, 34, -0.04, false);
      for (let k = 0; k < 3; k++) pyr(110 + k * 14, 58, 11, 0, false);
    },
  },
  esfinge: {
    w: 46, d: 24,
    build(ctx, g) {
      const stone = ctx.P(0xd8b070), dark = ctx.P(0xc49a5a);
      g.add(geo(new THREE.PlaneGeometry(46, 24).rotateX(-Math.PI / 2), ctx.P(0xe8c88a, 'flat'), 0, 0.1, 0));
      g.add(box(10, 2, 20, dark, 0, 1, -2));
      const body = geo(new THREE.CapsuleGeometry(4.6, 16, 4, 10).rotateX(Math.PI / 2), stone, 0, 5.4, -3); body.scale.set(1.2, 1, 1); g.add(body);
      for (const s of [-1, 1]) g.add(box(2.6, 2.2, 10, stone, s * 3.6, 1.6, 7.5));
      // cabeça com o lenço listrado do faraó
      g.add(box(6.4, 7, 5.6, stone, 0, 12.5, 6.2));
      g.add(geo(frustumGeo(9.5, 6.4, 7.5, 0.7), ctx.P(0xe8c070), 0, 12.2, 5.4));
      g.add(box(5.2, 5.2, 0.6, ctx.P(0xe4bc80), 0, 12, 8.8));
      for (const s of [-1, 1]) g.add(box(1, 0.5, 0.3, ctx.P(0x5a3a20), s * 1.3, 13.2, 9.1));
      g.add(box(0.9, 1.6, 0.5, ctx.P(0xc8a060), 0, 12, 9.2));
      g.add(box(1.4, 3, 1, ctx.P(0xc8a060), 0, 8.4, 8.6));
    },
  },
  mesquita: {
    w: 56, d: 44,
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
    w: 14, d: 14,
    build(ctx, g) {
      g.add(box(8, 3, 8, ctx.P(0xc8a878), 0, 1.5, 0));
      g.add(geo(frustumGeo(3.6, 3.6, 30, 0.62), ctx.P(0xd8b078), 0, 18, 0));
      g.add(geo(new THREE.ConeGeometry(1.6, 3.2, 4).rotateY(Math.PI / 4), ctx.P(0xf2c040, 'metal'), 0, 34.6, 0));
      for (let k = 0; k < 6; k++) g.add(box(0.8, 1.2, 0.3, ctx.P(0x8a6a40), (k % 2 - 0.5) * 0.9, 8 + k * 3.6, 1.6 - k * 0.04));
    },
  },

  // ======================= DUBAI =======================
  agulha: {
    w: 56, d: 56,
    build(ctx, g) {
      const glass = ctx.P(0xb8d0e6, 'glass'), steel = ctx.P(0xd8dee6, 'metal');
      g.add(geo(new THREE.CircleGeometry(28, 24).rotateX(-Math.PI / 2), ctx.P(0x3fa8d8, 'glow'), 0, 0.2, 0));
      let h = 0;
      const tiers = [[34, 40], [30, 30], [26, 26], [22, 22], [18, 20], [14, 18], [11, 16], [8, 14], [6, 12]];
      tiers.forEach(([s, th], k) => {
        for (let l = 0; l < 3; l++) {
          const a = l * Math.PI * 2 / 3 + (k % 2) * 0.0;
          const lobe = box(s * 0.42, th, s * 0.62, l === k % 3 ? steel : glass, Math.sin(a) * s * 0.22, h + th / 2, Math.cos(a) * s * 0.22);
          lobe.rotation.y = a; g.add(lobe);
        }
        g.add(cyl(s * 0.2, s * 0.2, th, glass, 0, h + th / 2, 0, 8));
        h += th;
      });
      g.add(cyl(1.6, 3.4, 30, steel, 0, h + 15, 0, 8));
      g.add(cone(1.2, 26, steel, 0, h + 43, 0, 6));
      g.add(sphere(0.8, ctx.P(0xff3030, 'neon'), 0, h + 57, 0, 6, 4));
      // faixas de luz subindo pela torre (acendem à noite)
      for (let y = 6; y < h; y += 10) g.add(cyl(tiers[0][0] * 0.21 * (1 - y / (h * 1.2)) + 0.3, 0, 0.4, ctx.P(0xbfe6ff, 'neon'), 0, y, 0, 8));
    },
  },
  hotelVela: {
    kind: 'far', water: 'shore', w: 56, d: 50, offs: [10, 25, 45, 70, 100, 140],
    build(ctx, g) {
      g.add(cyl(26, 28, 4, ctx.P(0xd8ccb0), 0, 1, 0, 16));
      const H = 92;
      // vela: casca branca curva entre o "mastro" e a borda
      const pos = [], idx = [];
      const n = 24;
      for (let k = 0; k <= n; k++) {
        const t = k / n, y = 4 + t * H;
        const w = 30 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.7) * (1 - t * 0.3);
        const bulge = 9 * Math.sin(Math.PI * t);
        pos.push(-12, y, -10 + t * 6, -12 + w, y, -10 + t * 6 + bulge);
        if (k < n) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const sail = new THREE.BufferGeometry();
      sail.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      sail.setIndex(idx); sail.computeVertexNormals();
      g.add(geo(sail, ctx.P(0xf8f8fa, 'twoSided')));
      // estrutura em "V" e mastro
      g.add(bar(V(-12, 4, -10), V(-12, H + 18, -4), 1.6, ctx.P(0xe8ecf0, 'metal')));
      g.add(bar(V(-12, 4, -10), V(14, 4, 4), 1.4, ctx.P(0xe8ecf0, 'metal')));
      for (let k = 1; k < 6; k++) { const t = k / 6, y = 4 + t * H; g.add(bar(V(-12, y, -10 + t * 6), V(-12 + 28 * Math.pow(Math.sin(Math.PI * t), 0.7) * (1 - t * 0.3), y, -10 + t * 6 + 9 * Math.sin(Math.PI * t)), 0.5, ctx.P(0xdfe4ea, 'metal'))); }
      // heliponto
      g.add(bar(V(-12, H * 0.82, -6), V(-26, H * 0.82, -2), 1, ctx.P(0xdfe4ea, 'metal')));
      g.add(cyl(7, 7, 0.8, ctx.P(0xf2f2f2), -28, H * 0.82, -2, 16));
      g.add(cyl(3, 3, 0.85, ctx.P(0x3fa84a, 'neon'), -28, H * 0.82, -2, 12));
      g.add(box(4, 1, 40, ctx.P(0xd8ccb0), 0, 2.5, 26));
    },
  },
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
  // Complexo do Taj Mahal: portão vermelho de entrada virado para a pista, jardim em
  // quatro partes (charbagh) com o espelho d'água no eixo, chafarizes, ciprestes e
  // canteiros de flores; ao fundo o terraço vermelho com a mesquita, o mausoléu de
  // mármore (bem grande, aparece de longe) e os quatro minaretes.
  tajMahal: {
    w: 170, d: 196,
    build(ctx, g) {
      const W = 170, D = 196, Zf = D / 2 - 6, Zc = 24, Zt = -58, Zg = -28; // portão, cruzamento, mausoléu, fim do jardim
      const marble = 0xf7f3ea, red = 0xb04a2a, redD = 0x8e3a20, white = 0xf6f0e4;
      const water = ctx.P(0x4a9fd8, 'smooth'), rim = ctx.P(0xeee6d6), redP = ctx.P(red), redDP = ctx.P(redD);
      const flat = c => ctx.P(c, 'flat');
      const T = (x, z, s, kind) => { const p = ctx.world(g, x, 0, z); ctx.tree(p.x, p.z, s, kind); };
      // piso de arenito claro e os 16 gramados do charbagh (dois tons, em xadrez)
      g.add(geo(new THREE.PlaneGeometry(W - 4, D - 4).rotateX(-Math.PI / 2), flat(0xdccfb6), 0, 0.05, -2));
      const xs = [[-80, -50], [-46, -16], [16, 46], [50, 80]];
      const zs = [[Zg + 2, (Zc + Zg) / 2 - 2], [(Zc + Zg) / 2 + 2, Zc - 5], [Zc + 5, (Zc + Zf) / 2 - 2], [(Zc + Zf) / 2 + 2, Zf - 8]];
      xs.forEach(([x0, x1], a) => zs.forEach(([z0, z1], b) => {
        g.add(geo(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), flat((a + b) % 2 ? 0x4f9e3c : 0x62b24c), (x0 + x1) / 2, 0.1, (z0 + z1) / 2));
      }));
      // canteiros de flores dos dois lados do eixo
      const fl = [0xff5e9c, 0xffb02e, 0xffe14d, 0xb98cff, 0xff7b3b];
      for (const s of [-1, 1]) for (let k = 0; k < 10; k++) {
        const z0 = Zf - 14 - k * 11;
        if (Math.abs(z0 - Zc) < 10 || z0 < Zg + 4) continue;
        g.add(box(2.2, 0.5, 8, ctx.P(fl[(k + (s > 0 ? 2 : 0)) % fl.length]), s * 12.5, 0.25, z0));
      }
      // espelho d'água no eixo (aponta para a pista) e o canal que cruza o jardim
      const L = Zf - 10 - Zg, zm = (Zf - 10 + Zg) / 2;
      g.add(box(6, 0.3, L, water, 0, 0.2, zm));
      for (const s of [-1, 1]) g.add(box(1.4, 0.7, L, rim, s * 3.7, 0.35, zm));
      g.add(box(W - 12, 0.3, 4.5, water, 0, 0.2, Zc));
      for (const s of [-1, 1]) g.add(box(W - 12, 0.7, 1.2, rim, 0, 0.35, Zc + s * 2.9));
      // tanque central de mármore com chafariz
      g.add(box(18, 1, 18, rim, 0, 0.5, Zc));
      g.add(box(14, 0.4, 14, water, 0, 1.0, Zc));
      g.add(cyl(1.2, 1.6, 2.2, rim, 0, 1.6, Zc, 8));
      g.add(cone(0.5, 4.5, ctx.P(0xe6f6ff, 'smooth'), 0, 4.6, Zc, 6));
      // chafarizes ao longo do espelho d'água
      for (let z = Zf - 18; z > Zg + 4; z -= 10) if (Math.abs(z - Zc) > 10) g.add(cone(0.22, 2.4, ctx.P(0xe6f6ff, 'smooth'), 0, 1.5, z, 5));
      // ciprestes alinhados no eixo e no canal; árvores grandes nos canteiros
      for (let z = Zf - 16; z > Zg + 2; z -= 8) if (Math.abs(z - Zc) > 8) for (const s of [-1, 1]) T(s * 8, z, 0.95, 'cypress');
      for (let x = 14; x < W / 2 - 8; x += 10) for (const s of [-1, 1]) for (const dz of [-6, 6]) T(s * x, Zc + dz, 0.85, 'cypress');
      for (const x of [-48, 48]) for (const z of [Zf - 30, Zc - 26]) T(x, z, 1.25);
      // muro de arenito vermelho em volta do jardim, com pavilhões octogonais nos cantos
      const wallH = 5;
      for (const s of [-1, 1]) {
        g.add(box(W / 2 - 20, 2.2, 2, redP, s * (W / 4 + 10), 1.1, Zf)); // muro baixo na frente: dá para ver o jardim da pista
        g.add(box(W / 2 - 20, 0.6, 2.4, ctx.P(white), s * (W / 4 + 10), 2.5, Zf));
        g.add(box(2, wallH, Zf - Zg, redP, s * (W / 2 - 1), wallH / 2, (Zf + Zg) / 2));
        for (const z of [Zf, Zg]) {
          g.add(cyl(4, 4.4, 9, redP, s * (W / 2 - 1), 4.5, z, 8));
          chhatri(ctx, g, s * (W / 2 - 1), 9, z, 1.4);
        }
      }
      // portão de entrada (darwaza) com arco ogival, moldura branca e cupulazinhas
      const GW = 38, GH = 28;
      g.add(geo(archWallGeo(GW, GH, 12, 5.5, 11, true), redP, 0, 0, Zf));
      for (const fz of [-1, 1]) {
        const z = Zf + fz * 6.1;
        g.add(box(16, 0.9, 0.4, ctx.P(white), 0, 23, z));
        for (const sx of [-1, 1]) g.add(box(0.9, 23, 0.4, ctx.P(white), sx * 8, 11.5, z));
        g.add(box(GW - 4, 1, 0.4, ctx.P(white), 0, GH - 2.5, z));
      }
      for (const sx of [-1, 1]) {
        g.add(cyl(2.4, 2.8, GH + 3, redDP, sx * (GW / 2), (GH + 3) / 2, Zf + 5, 8));
        chhatri(ctx, g, sx * (GW / 2), GH + 3, Zf + 5, 1.2);
      }
      for (let k = 0; k < 9; k++) miniDome(ctx, g, -GW / 2 + 4 + k * (GW - 8) / 8, GH, Zf + 4.5, 1.1);
      // terraço vermelho, plataforma de mármore e o mausoléu
      g.add(box(W - 4, 2.5, 70, redP, 0, 1.25, Zt - 5));
      g.add(box(102, 6, 76, ctx.P(0xf2ece0), 0, 5.5, Zt));
      for (const sx of [-1, 1]) g.add(box(0.6, 4, 76.4, ctx.P(0xd8ccb8), sx * 51, 5.5, Zt));
      const S = 1.6;
      const M = new THREE.Group(); M.position.set(0, 8.5, Zt); M.scale.setScalar(S); g.add(M);
      const marbleS = ctx.P(marble, 'smooth');
      M.add(geo(new THREE.CylinderGeometry(19, 19, 26, 8).rotateY(Math.PI / 8), ctx.P(marble), 0, 13, 0));
      for (let f = 0; f < 8; f++) {
        const a = f * Math.PI / 4, big = f % 2 === 0;
        const r = big ? 17.8 : 16.9;
        const arch = geo(archWallGeo(big ? 14 : 9, big ? 22 : 12, 1.2, big ? 4.2 : 2.4, big ? 9 : 5, true), ctx.P(0xece6d8), Math.sin(a) * r, 0, Math.cos(a) * r);
        arch.rotation.y = a; M.add(arch);
        const inset = geo(new THREE.PlaneGeometry(big ? 8 : 4.6, big ? 15 : 8), ctx.P(0xb8ab96, 'lit'), Math.sin(a) * (r - 0.3), big ? 8 : 4.5, Math.cos(a) * (r - 0.3));
        inset.rotation.y = a; M.add(inset);
        if (!big) { const up = geo(archWallGeo(9, 11, 1.2, 2.4, 4.5, true), ctx.P(0xece6d8), Math.sin(a) * r, 13, Math.cos(a) * r); up.rotation.y = a; M.add(up); }
      }
      M.add(box(16, 1.2, 1, ctx.P(0x9a8a70), 0, 23.4, 18.4)); // faixa de caligrafia (escura)
      M.add(cyl(10, 10, 7, marbleS, 0, 29.5, 0, 16));
      M.add(geo(onionGeo(13, 24, 18), marbleS, 0, 33, 0));
      M.add(cone(0.5, 7, ctx.P(0xd8b04a, 'metal'), 0, 59, 0, 6));
      M.add(sphere(0.9, ctx.P(0xd8b04a, 'metal'), 0, 56.5, 0, 6, 4));
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) chhatri(ctx, M, x * 11, 26, z * 11, 2.1);
      const lights = [M];
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const mg = new THREE.Group(); mg.position.set(x * 45, 8.5, Zt + z * 33); mg.scale.setScalar(S); g.add(mg);
        minaret(ctx, mg, 0, 0, 34, 1.7, marble);
        lights.push(mg);
      }
      // no pôr do sol e à noite o mármore fica iluminado (holofotes)
      if (ctx.glow > 0.6) for (const o of lights) o.traverse(m => { if (m.isMesh && (m.material === ctx.mats.solid || m.material === ctx.mats.smooth)) m.material = ctx.mats.lit; });
      // mesquita e "jawab" de arenito vermelho com três cúpulas brancas, dos dois lados
      for (const s of [-1, 1]) {
        const mq = new THREE.Group(); mq.position.set(s * 68, 2.5, Zt); mq.rotation.y = -s * Math.PI / 2; g.add(mq);
        mq.add(box(36, 13, 22, redP, 0, 6.5, -2));
        for (let k = -1; k <= 1; k++) {
          mq.add(geo(archWallGeo(10, 11, 1, 2.6, 5, true), redDP, k * 11, 0, 9.2));
          mq.add(box(7.5, 1, 0.3, ctx.P(white), k * 11, 11.6, 9.8));
          const dr = k === 0 ? 5 : 3.6;
          mq.add(cyl(dr, dr, 2.4, ctx.P(white), k * 11, 14.2, -2, 10));
          mq.add(geo(onionGeo(dr * 1.1, dr * 2.2, 10), ctx.P(white, 'smooth'), k * 11, 15.4, -2));
        }
        for (const x of [-18, 18]) miniDome(ctx, mq, x, 13, 9, 1.4);
      }
    },
  },
  // Forte Vermelho: muralha de arenito com ameias, bastiões redondos, o portão alto entre
  // duas torres octogonais, pavilhões de mármore aparecendo atrás e o fosso na frente.
  forteVermelho: {
    w: 124, d: 52,
    build(ctx, g) {
      const redP = ctx.P(0xc85a34), redD = ctx.P(0xa84a2a), white = 0xf6f2ea;
      g.add(geo(new THREE.PlaneGeometry(124, 9).rotateX(-Math.PI / 2), ctx.P(0x3f8fc0, 'flat'), 0, 0.12, 20));
      g.add(geo(new THREE.PlaneGeometry(124, 4).rotateX(-Math.PI / 2), ctx.P(0x6aa84a, 'flat'), 0, 0.1, 25.5));
      g.add(box(118, 15, 9, redP, 0, 7.5, 6));
      g.add(box(118.4, 0.8, 9.4, ctx.P(0xd8b49a), 0, 11.5, 6));
      crenellate(ctx, g, -58, 58, 15, 10, redD, 3, 1.5);
      for (const x of [-57, -36, 36, 57]) {
        g.add(cyl(6, 6.8, 17, redP, x, 8.5, 9, 10));
        g.add(cyl(6.3, 6.3, 1.2, redD, x, 17.6, 9, 10));
        if (Math.abs(x) < 40) chhatri(ctx, g, x, 18.2, 9, 1.6, white);
      }
      // portão alto entre duas torres octogonais
      g.add(geo(archWallGeo(30, 25, 14, 4.6, 10, true), redP, 0, 0, 10));
      g.add(box(9.4, 14.6, 0.5, ctx.P(0x3a2018), 0, 7.3, 3.2));
      for (const s of [-1, 1]) {
        g.add(box(0.8, 20, 0.4, ctx.P(white), s * 7.5, 10, 17.1));
        g.add(geo(new THREE.CylinderGeometry(5.2, 5.8, 31, 8).rotateY(Math.PI / 8), redP, s * 16, 15.5, 11));
        chhatri(ctx, g, s * 16, 31, 11, 2.1, white);
      }
      g.add(box(16, 0.8, 0.4, ctx.P(white), 0, 20.4, 17.1));
      for (let k = 0; k < 7; k++) miniDome(ctx, g, -9 + k * 3, 25, 13, 1, white);
      // bandeira laranja em cima do portão
      g.add(cyl(0.12, 0.12, 8, ctx.P(0xdddddd), 0, 29, 8, 5));
      g.add(box(4, 2.4, 0.1, ctx.P(0xff8a1a), 2, 31.6, 8));
      // pavilhões de mármore atrás da muralha
      for (const s of [-1, 1]) {
        g.add(box(26, 22, 14, ctx.P(white), s * 26, 11, -12));
        for (let k = -1; k <= 1; k++) {
          g.add(cyl(2.8, 2.8, 1.6, ctx.P(white), s * 26 + k * 8, 22.8, -12, 8));
          g.add(geo(onionGeo(3, 6, 8), ctx.P(0xfffaf0, 'smooth'), s * 26 + k * 8, 23.6, -12));
        }
      }
    },
  },
  portaoVermelho: {
    kind: 'span', w: 70, d: 14, pillar: 12,
    build(ctx, g) {
      const e = ctx.e, a = e + 1.6, W = 2 * a + 24, H = 46;
      const red = ctx.P(0xb8502e), white = ctx.P(0xf6f2ea);
      g.add(geo(archWallGeo(W, H, 14, a, 18, true), red));
      for (const fz of [-1, 1]) {
        g.add(box(W - 6, 1.2, 0.6, white, 0, H - 6, fz * 7.3));
        for (const s of [-1, 1]) g.add(box(1, H - 8, 0.6, white, s * (a + 1.2), (H - 8) / 2, fz * 7.3));
        // nichos escuros, rosetas brancas e estrela verde nos pilares
        for (const s of [-1, 1]) {
          const x = s * (a + 6.6), z = fz * 7.35;
          g.add(box(4.2, 9, 0.3, ctx.P(0x5a2416), x, 9, z));
          g.add(box(5.4, 0.6, 0.4, white, x, 14, z));
          const ro = cyl(1.8, 1.8, 0.3, white, x, H - 15, z, 8); ro.rotation.x = Math.PI / 2; g.add(ro);
          const st = box(1.7, 1.7, 0.4, ctx.P(0x2f8a7a), x, H - 15, z + fz * 0.12); st.rotation.z = Math.PI / 4; g.add(st);
        }
      }
      for (let k = 0; k < 11; k++) chhatri(ctx, g, -W / 2 + 4 + k * (W - 8) / 10, H, 0, 1.1);
      for (const s of [-1, 1]) { const mg = new THREE.Group(); mg.position.set(s * (W / 2 + 1.5), 0, 0); g.add(mg); minaret(ctx, mg, 0, 0, H + 6, 1.6, 0xb8502e); }
    },
  },

  // ======================= PEQUIM =======================
  muralha: {
    kind: 'far', w: 280, d: 80, scale: 1.5, offs: [40, 70, 105, 145, 190],
    build(ctx, g) {
      const green = ctx.P(0x4a7a3a), green2 = ctx.P(0x5a8a44), stone = ctx.P(0xd2c4a6), stoneD = ctx.P(0xa8987a);
      const H = x => 18 + 16 * Math.sin(x / 38) + 9 * Math.sin(x / 17 + 1);
      const Z = x => 10 * Math.sin(x / 45);
      // morros
      for (let x = -135; x <= 135; x += 30) {
        const h = geo(new THREE.IcosahedronGeometry(1, 1), (x / 30) % 2 ? green : green2, x, 0, Z(x) - 6);
        h.scale.set(30, H(x) + 6, 30); g.add(h);
      }
      // muralha seguindo o topo dos morros, com torres de vigia
      const pts = [];
      for (let x = -130; x <= 130; x += 6) pts.push(V(x, H(x) + 2, Z(x)));
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        const seg = bar(a.clone().setY(a.y - 4), b.clone().setY(b.y - 4), 1, stone);
        seg.scale.set(5, 1, 9); g.add(seg);
        g.add(box(1, 1.2, 1, stoneD, b.x, b.y + 1.4, b.z + 2.6));
        g.add(box(1, 1.2, 1, stoneD, b.x, b.y + 1.4, b.z - 2.6));
      }
      for (let k = 2; k < pts.length - 1; k += 7) {
        const p = pts[k];
        g.add(box(10, 11, 10, stone, p.x, p.y + 1, p.z));
        crenellate(ctx, g, p.x - 4.5, p.x + 4.5, p.y + 6.5, p.z + 4.5, stoneD, 1.8, 1);
        crenellate(ctx, g, p.x - 4.5, p.x + 4.5, p.y + 6.5, p.z - 4.5, stoneD, 1.8, 1);
        g.add(box(3, 4, 0.3, ctx.P(0x2a2018), p.x, p.y, p.z + 5.05));
      }
    },
  },
  temploCeu: {
    w: 56, d: 56,
    build(ctx, g) {
      const marble = ctx.P(0xf2efe8), blue = ctx.P(0x2a4aa8, 'smooth'), red = ctx.P(0xb8282a), gold = ctx.P(0xe8b830, 'metal');
      g.add(cyl(26, 27, 2, marble, 0, 1, 0, 24));
      g.add(cyl(21, 22, 2, marble, 0, 3, 0, 24));
      g.add(cyl(16, 17, 2, marble, 0, 5, 0, 24));
      g.add(box(5, 6, 30, marble, 0, 3, 18));
      let y = 6;
      [[11, 7, 14], [8.5, 5, 11], [6, 4.5, 8]].forEach(([r, h, rr], k) => {
        g.add(cyl(r, r, h, red, 0, y + h / 2, 0, 16));
        g.add(cyl(r + 0.1, r + 0.1, 1, ctx.P(0x2a8a5a), 0, y + h - 0.5, 0, 16));
        g.add(geo(new THREE.ConeGeometry(rr, 4.5, 20), blue, 0, y + h + 2.25, 0));
        g.add(cyl(rr + 0.1, rr + 0.2, 0.6, gold, 0, y + h + 0.2, 0, 20));
        y += h + (k < 2 ? 3 : 4.5);
      });
      g.add(sphere(1.4, gold, 0, y + 0.8, 0, 10, 8));
      g.add(cyl(0.3, 0.3, 3, gold, 0, y - 0.6, 0, 6));
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.add(box(1, 1.6, 1, marble, Math.cos(a) * 26, 2.8, Math.sin(a) * 26)); }
    },
  },
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
  opera: {
    kind: 'near', water: 'shore', w: 96, d: 70, scale: 1.2, offs: [6, 16, 30, 48, 70, 95],
    build(ctx, g) {
      g.add(box(90, 7, 62, ctx.P(0xd8c4a0), 0, 3.5, 0));
      g.add(box(30, 2, 18, ctx.P(0xd0bc98), 0, 7.5, 30));
      const white = ctx.P(0xf6f4ec, 'twoSided');
      // conchas (velas) em duas fileiras
      const shell = (x, z, h, rot, lean = 0) => {
        const s = geo(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI, 0, Math.PI / 2), white, x, 7, z);
        s.scale.set(h * 0.42, h, h * 0.75);
        s.rotation.set(lean, rot, 0);
        g.add(s);
      };
      const rows = [[-14, [[-26, 16], [-12, 22], [4, 27], [18, 20]]], [14, [[-20, 13], [-6, 17], [8, 21]]]];
      for (const [z, list] of rows) for (const [x, h] of list) { shell(x, z, h, Math.PI / 2, -0.12); shell(x + 6, z, h * 0.8, -Math.PI / 2, -0.12); }
      g.add(box(60, 5, 0.6, ctx.P(0xc8a878, 'lit'), -2, 9.5, 31));
    },
  },
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
