// Marcos das Américas e da Europa: Rio, Nova York, Londres, Paris e Roma.
// Tudo procedural e estilizado (poucos polígonos, cores alegres).
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, bar, beam, lathe, archWallGeo, frustumGeo, gableGeo, remapUV, latticeTower, crenellate, person, SKINS, SHIRTS } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const flag = (ctx, g, x, y, z, cols, w = 6, h = 4, vertical = true) => {
  cols.forEach((c, k) => {
    const n = cols.length;
    g.add(vertical ? box(w / n, h, 0.1, ctx.P(c, 'smooth'), x - w / 2 + w / n * (k + 0.5), y, z) : box(w, h / n, 0.1, ctx.P(c, 'smooth'), x, y + h / 2 - h / n * (k + 0.5), z));
  });
};

export const LANDMARKS_A = {
  // ======================= RIO DE JANEIRO =======================
  cristo: {
    kind: 'far', w: 130, d: 120,
    build(ctx, g) {
      const rock = ctx.P(0x7a7a6e), green = ctx.P(0x3f8a46), green2 = ctx.P(0x2f7a3c);
      const hill = geo(new THREE.IcosahedronGeometry(1, 2), green, 0, 0, 0); hill.scale.set(62, 92, 52); g.add(hill);
      const h2 = geo(new THREE.IcosahedronGeometry(1, 1), green2, -34, 0, 14); h2.scale.set(40, 56, 34); g.add(h2);
      const face = geo(new THREE.IcosahedronGeometry(1, 1), rock, 12, 30, 22); face.scale.set(30, 40, 22); g.add(face);
      // estátua de braços abertos no topo
      const st = new THREE.Group(); st.position.set(0, 88, 0); st.scale.setScalar(1.5); g.add(st);
      const stone = ctx.P(0xf1ece2, 'smooth');
      st.add(box(5, 6, 5, ctx.P(0xd8d2c4), 0, 3, 0));
      st.add(cyl(1.9, 3.1, 15, stone, 0, 13.5, 0, 10));
      st.add(cyl(2.2, 1.9, 3, stone, 0, 22, 0, 10));
      st.add(box(24, 2.2, 2.2, stone, 0, 21.6, 0));
      for (const s of [-1, 1]) st.add(box(2.6, 1.6, 1.8, stone, s * 12.6, 21.5, 0));
      st.add(sphere(1.6, stone, 0, 25.2, 0.2, 10, 8));
      // luz nos pés (de noite fica iluminado)
      st.add(cyl(3, 3, 0.4, ctx.P(0xfff0c8, 'neon'), 0, 6.2, 0, 10));
    },
  },
  paoDeAcucar: {
    kind: 'far', water: 'in', w: 170, d: 90, offs: [40, 80, 120, 170, 230],
    build(ctx, g) {
      const prof = (r, h) => lathe([[r * 1.05, 0], [r, h * 0.25], [r * 0.9, h * 0.55], [r * 0.65, h * 0.8], [r * 0.35, h * 0.95], [0, h]], 14);
      const rock = ctx.P(0x8a8478, 'smooth'), green = ctx.P(0x3f8a46);
      const big = geo(prof(30, 82), rock, 38, 0, 0); big.scale.z = 0.85; g.add(big);
      const capB = geo(prof(22, 30), green, 38, 46, 0); capB.scale.set(1.05, 1, 0.9); g.add(capB);
      const small = geo(prof(24, 46), rock, -48, 0, 8); small.scale.z = 0.9; g.add(small);
      g.add(geo(prof(20, 14), green, -48, 26, 8));
      g.add(geo(new THREE.CylinderGeometry(70, 80, 4, 16), ctx.P(0x6a7a5a), -5, 1, 4));
      const A = V(-48, 47, 8), B = V(38, 83, 0);
      g.add(beam(A, B, 0.15, ctx.P(0x333333), 4));
      g.add(beam(A.clone().setZ(10), B.clone().setZ(2), 0.15, ctx.P(0x333333), 4));
      g.add(box(6, 4, 6, ctx.P(0xf2f2f2), A.x, A.y + 1, A.z)); g.add(box(6, 4, 6, ctx.P(0xf2f2f2), B.x, B.y + 1, B.z));
      // bondinho (cabine) indo e voltando
      const cab = new THREE.Group();
      cab.add(box(4, 3, 3, ctx.P(0xffd23f, 'smooth'), 0, -2.4, 0));
      cab.add(box(4.1, 1, 3.1, ctx.P(0x3a6ea8, 'lit'), 0, -2.0, 0));
      cab.add(cyl(0.12, 0.12, 2, ctx.P(0x333333), 0, -0.6, 0, 4));
      g.add(cab);
      const dyn = ctx.dynamic(cab);
      const wa = ctx.world(g, A.x, A.y, A.z + 1), wb = ctx.world(g, B.x, B.y, B.z + 1);
      ctx.anim((dt, t) => { const u = 0.5 - 0.5 * Math.cos(t * 0.12); dyn.position.lerpVectors(wa, wb, u); dyn.position.y -= Math.sin(u * Math.PI) * 6; });
    },
  },
  arcosLapa: {
    kind: 'span', w: 130, d: 7, pillar: 5,
    build(ctx, g) {
      const e = ctx.e, a = e + 1.6, W = 130, D = 7, top = 24;
      const white = ctx.P(0xf6f3ea);
      // arco grande por cima da pista
      g.add(geo(archWallGeo(2 * a + 10, top, D, a, top - a - 2.4), white));
      // arcos menores dos dois lados (dois andares)
      for (const s of [-1, 1]) {
        const x0 = a + 5, x1 = W / 2;
        for (let x = x0; x < x1; x += 9) {
          const cx = s * (x + 4.5);
          g.add(geo(archWallGeo(9, 12, D, 3.2, 6.5), white, cx, 0, 0));
          g.add(geo(archWallGeo(9, top - 12, D, 2.6, 4.5), white, cx, 12, 0));
        }
      }
      g.add(box(W, 1.2, D + 1, ctx.P(0xd8d2c4), 0, top + 0.6, 0));
      // bondinho amarelo passando lá em cima
      const tram = new THREE.Group();
      tram.add(box(3, 3, 8, ctx.P(0xffd23f, 'smooth'), 0, 1.5, 0));
      tram.add(box(3.1, 1.2, 7, ctx.P(0x3a6ea8, 'lit'), 0, 2.2, 0));
      tram.add(box(2.6, 0.3, 7.5, ctx.P(0x2a6a3a), 0, 3.2, 0));
      tram.position.set(0, top + 1.2, 0); tram.rotation.y = Math.PI / 2;
      g.add(tram);
      const dyn = ctx.dynamic(tram);
      const p0 = ctx.world(g, -W / 2 + 6, top + 1.2, 0), p1 = ctx.world(g, W / 2 - 6, top + 1.2, 0);
      ctx.anim((dt, t) => { const u = 0.5 - 0.5 * Math.cos(t * 0.15); dyn.position.lerpVectors(p0, p1, u); });
    },
  },

  // ======================= NOVA YORK =======================
  arranhaCeu: {
    w: 36, d: 36,
    build(ctx, g) {
      const steel = ctx.P(0xc8ccd2, 'metal'), lit = ctx.P(0xfff0b0, 'lit');
      const c0 = ctx.world(g, 0, 0, 0);
      ctx.addBuilding({ x: c0.x, y: ctx.gl, z: c0.z, w: 22, h: 72, d: 22, rot: g.rotation.y, type: 'office' });
      g.add(box(16, 18, 16, ctx.P(0xd8d4cc), 0, 81, 0));
      g.add(box(12, 10, 12, ctx.P(0xcfcac2), 0, 95, 0));
      // coroa em degraus com janelinhas triangulares (acende de noite)
      for (let k = 0; k < 6; k++) {
        const s = 11 - k * 1.7, y = 100 + k * 4.2;
        g.add(geo(frustumGeo(s, s, 4.2, 0.82), steel, 0, y + 2.1, 0));
        for (let f = 0; f < 4; f++) {
          const a = f * Math.PI / 2;
          const tri = geo(new THREE.ConeGeometry(0.9, 2.2, 3), lit, Math.sin(a) * (s / 2 - 0.2), y + 2, Math.cos(a) * (s / 2 - 0.2));
          g.add(tri);
        }
      }
      g.add(cone(1.4, 26, steel, 0, 138, 0, 6));
      // gárgulas de águia nos cantos
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(box(1.2, 1.2, 3, steel, x * 6.5, 100, z * 6.5));
    },
  },
  liberdade: {
    kind: 'far', water: 'in', w: 70, d: 70, offs: [30, 60, 100, 150, 210],
    build(ctx, g) {
      const green = ctx.P(0x7fbfa8, 'smooth'), stoneP = ctx.P(0xc8b896), rock = ctx.P(0x6f7a5a);
      g.add(cyl(32, 36, 4, rock, 0, 1.5, 0, 16));
      // forte em estrela
      for (const r of [0, Math.PI / 4]) { const s = box(30, 6, 30, ctx.P(0xb8a888), 0, 6, 0); s.rotation.y = r; g.add(s); }
      g.add(geo(frustumGeo(16, 16, 10, 0.8), stoneP, 0, 14, 0));
      g.add(box(11, 14, 11, stoneP, 0, 26, 0));
      g.add(box(13, 1.5, 13, ctx.P(0xd6c8a6), 0, 33.5, 0));
      const S = new THREE.Group(); S.position.set(0, 34, 0); S.scale.setScalar(1.3); g.add(S);
      S.add(cyl(2.6, 4.2, 18, green, 0, 9, 0, 10));
      S.add(cyl(2.2, 2.6, 3, green, 0, 19.5, 0, 10));
      S.add(sphere(1.7, green, 0, 22.6, 0.3, 10, 8));
      for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.4; const sp = cone(0.35, 2.2, green, Math.sin(a) * 1.6, 24.4 + Math.cos(a) * 0.6, 0.6 + Math.cos(a) * 0.3, 4); sp.rotation.z = -a * 0.7; S.add(sp); }
      // braço com a tocha
      const arm = bar(V(2.2, 19.5, 0), V(4.2, 30, 0.6), 1.3, green); S.add(arm);
      S.add(cyl(0.9, 0.6, 2.4, ctx.P(0xd8b04a, 'metal'), 4.3, 31.2, 0.6, 8));
      S.add(geo(new THREE.ConeGeometry(1.1, 2.6, 8), ctx.P(0xffb020, 'neon'), 4.3, 33.6, 0.6));
      // tabuleta
      const tab = box(2.6, 3.6, 0.8, green, -3, 15, 1.4); tab.rotation.z = 0.3; S.add(tab);
    },
  },
  letreiros: {
    w: 56, d: 34,
    build(ctx, g) {
      const ads = [
        ['SUCO DO LEÃO', '#ff7a1a', '#fff8d0'], ['PIPOCA DA MARI', '#ff5fb0', '#ffffff'], ['TURBO BURGER', '#d6202a', '#ffd23f'],
        ['SORVETE ESTRELA', '#2f7bff', '#ffffff'], ['CINEMA DO PIPO', '#20b86a', '#ffffff'], ['TEATRO DO REX', '#8b5cf6', '#b6f03a'],
        ['RACE CITIES', '#111122', '#ffd23f'], ['PIZZA DO TUTI', '#ffc21a', '#d6202a'],
      ];
      g.add(geo(new THREE.PlaneGeometry(56, 34).rotateX(-Math.PI / 2), ctx.P(0x4a4a52, 'flat'), 0, 0.1, 0));
      const dark = ctx.P(0x2a2c36);
      const towers = [[-18, -6, 14, 52], [0, -10, 16, 66], [18, -6, 14, 48]];
      let k = 0;
      for (const [x, z, w, h] of towers) {
        g.add(box(w, h, 14, dark, x, h / 2, z));
        for (let y = 10; y < h - 6; y += 13) {
          const [t, bg, fg] = ads[k++ % ads.length];
          const s = ctx.sign(t, w - 1, 9, { bg, fg, frame: 0x111111, border: fg });
          s.position.set(x, y, z + 7.2);
          g.add(s);
        }
      }
      // letreiro corrido largo e escada vermelha brilhante no meio da praça
      const t = ctx.sign('★ RACE CITIES ★ VOLTA AO MUNDO ★', 30, 3, { bg: '#111122', fg: '#4be38f' });
      t.position.set(0, 6, 4); g.add(t);
      for (let s = 0; s < 6; s++) g.add(box(10, 0.6, 1.4, ctx.P(0xff2a3a, 'neon'), 0, 0.3 + s * 0.6, 12 - s * 1.4));
      for (let p = 0; p < 8; p++) g.add(person(ctx.mats, -20 + p * 5.5, 13 + (p % 2) * 2, SHIRTS[p % 6], SKINS[p % 4]));
    },
  },
  ponteCabos: {
    kind: 'span', w: 130, d: 16, pillar: 14,
    build(ctx, g) {
      const e = ctx.e, px = e + 1.6 + 7, stone = ctx.P(0xb89a7a), dark = ctx.P(0x2a2a30);
      const cable = ctx.P(0x7a7a80, 'metal');
      for (const s of [-1, 1]) {
        g.add(geo(archWallGeo(14, 52, 12, 2.4, 30, true), stone, s * px, 0, 0));
        g.add(box(14.6, 3, 12.6, ctx.P(0xa88a6a), s * px, 52, 0));
      }
      // tabuleiro alto por cima da pista
      g.add(box(2 * px + 14, 2, 10, dark, 0, 30, 0));
      g.add(box(2 * px + 14, 0.6, 10.4, ctx.P(0x8a5a3a), 0, 31.2, 0));
      // cabos principais e pendurais
      for (const z of [-4.5, 4.5]) {
        const curve = [];
        for (let k = 0; k <= 16; k++) { const u = k / 16, x = -px + 2 * px * u; curve.push(V(x, 31 + 22 * Math.pow(2 * u - 1, 2), z)); }
        for (let k = 0; k < 16; k++) g.add(beam(curve[k], curve[k + 1], 0.35, cable, 4));
        for (let k = 1; k < 16; k++) g.add(beam(curve[k], V(curve[k].x, 31, z), 0.08, cable, 3));
        for (const s of [-1, 1]) { g.add(beam(V(s * px, 52, z), V(s * 64, 1, z), 0.35, cable, 4)); g.add(beam(V(s * px, 52, z), V(0, 31.5, z), 0.1, cable, 3)); }
      }
      for (const s of [-1, 1]) g.add(box(6, 4, 14, stone, s * 64, 1.5, 0));
      // bandeira listrada pendurada (sem marcas, só cores)
      flag(ctx, g, 0, 26.5, 5.2, [0xd62d2d, 0xffffff, 0xd62d2d, 0xffffff, 0x2f4fa0], 8, 4, false);
    },
  },

  // ======================= LONDRES =======================
  bigBen: {
    w: 80, d: 26, scale: 1.25,
    build(ctx, g) {
      const stone = ctx.P(0xd9c08a), stoneD = ctx.P(0xc4a872), roofP = ctx.P(0x3f5a52);
      const tx = 30;
      g.add(box(11, 56, 11, stone, tx, 28, 0));
      for (let y = 6; y < 54; y += 6) g.add(box(11.6, 0.6, 11.6, stoneD, tx, y, 0));
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(box(1, 56, 1, stoneD, tx + x * 5.3, 28, z * 5.3));
      g.add(box(13, 11, 13, stoneD, tx, 61.5, 0));
      // relógios nos quatro lados
      for (let f = 0; f < 4; f++) {
        const a = f * Math.PI / 2, sx = Math.sin(a), sz = Math.cos(a);
        const face = geo(new THREE.CircleGeometry(4.4, 24), ctx.P(0xfff6dc, 'lit'), tx + sx * 6.55, 61.5, sz * 6.55);
        face.rotation.y = a; g.add(face);
        const ring = geo(new THREE.TorusGeometry(4.5, 0.35, 4, 24), ctx.P(0xd8b04a, 'metal'), tx + sx * 6.6, 61.5, sz * 6.6); ring.rotation.y = a; g.add(ring);
        const h1 = box(0.4, 3.2, 0.2, ctx.P(0x111111, 'glow'), tx + sx * 6.75, 62.8, sz * 6.75); h1.rotation.y = a; g.add(h1);
        const h2 = box(2.4, 0.4, 0.2, ctx.P(0x111111, 'glow'), tx + sx * 6.75 + Math.cos(a) * 1.1, 61.5, sz * 6.75 - Math.sin(a) * 1.1); h2.rotation.y = a; g.add(h2);
      }
      g.add(box(10, 7, 10, stone, tx, 70.5, 0));
      g.add(box(10.4, 4, 10.4, ctx.P(0x2a2620), tx, 70.5, 0));
      g.add(geo(new THREE.ConeGeometry(7.4, 20, 4).rotateY(Math.PI / 4), roofP, tx, 84, 0));
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(cone(0.9, 6, roofP, tx + x * 4.8, 77, z * 4.8, 4));
      g.add(cone(0.4, 6, ctx.P(0xd8b04a, 'metal'), tx, 96, 0, 4));
      // Parlamento (prédio comprido em estilo gótico)
      g.add(box(56, 18, 16, stone, -10, 9, -2));
      for (let x = -37; x <= 17; x += 3) g.add(box(0.8, 19, 0.8, stoneD, x, 9.5, 6.2));
      for (let x = -36; x <= 16; x += 6) g.add(cone(0.8, 5, roofP, x, 20.5, 6, 4));
      g.add(geo(gableGeo(56, 16, 5).rotateY(0), roofP, -10, 18, -2));
      g.add(box(52, 8, 0.4, ctx.P(0xfff0c0, 'lit'), -10, 10, 6.1));
      for (let x = -36; x <= 16; x += 3) g.add(box(1.6, 9, 0.5, stoneD, x + 1.5, 10, 6.3));
    },
  },
  rodaGigante: {
    w: 96, d: 30,
    build(ctx, g) {
      const R = 40, hubY = 46, white = ctx.P(0xf4f6f8, 'metal');
      g.add(box(30, 2, 14, ctx.P(0xb8b4ac), 0, 1, 0));
      // pernas em A (atrás)
      for (const s of [-1, 1]) g.add(bar(V(s * 14, 0, -16), V(0, hubY, -1.5), 1.6, white));
      g.add(bar(V(-14, 0, -16), V(14, 0, -16), 1.2, white));
      g.add(cyl(2.2, 2.2, 5, white, 0, hubY, -1, 10).rotateX(Math.PI / 2));
      // roda que gira devagar
      const wheel = new THREE.Group();
      wheel.position.set(0, hubY, 0);
      for (const z of [-1.4, 1.4]) wheel.add(geo(new THREE.TorusGeometry(R, 0.55, 5, 48), white, 0, 0, z));
      const n = 24;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, x = Math.cos(a) * R, y = Math.sin(a) * R;
        wheel.add(bar(V(0, 0, 0), V(x, y, 0), 0.25, white));
        wheel.add(bar(V(x, y, -1.4), V(x, y, 1.4), 0.3, white));
        const cap = sphere(1.7, ctx.P(k % 6 === 0 ? 0xff5fb0 : 0xdff4ff, 'glass'), Math.cos(a) * (R + 1.8), Math.sin(a) * (R + 1.8), 0, 8, 6);
        cap.scale.set(1.5, 1, 1); wheel.add(cap);
      }
      wheel.add(geo(new THREE.TorusGeometry(R * 0.35, 0.3, 4, 24), white));
      g.add(wheel);
      const dyn = ctx.dynamic(wheel);
      ctx.anim(dt => { dyn.rotateZ(dt * 0.06); });
    },
  },
  ponteTorres: {
    kind: 'span', w: 130, d: 18, pillar: 13,
    build(ctx, g) {
      const e = ctx.e, px = e + 1.6 + 6.5, stone = ctx.P(0xd8c8a6), stoneD = ctx.P(0xbcaa86);
      const blue = ctx.P(0x6fa8d6, 'smooth'), roofP = ctx.P(0x4a5a5a);
      for (const s of [-1, 1]) {
        const x = s * px;
        g.add(geo(archWallGeo(13, 46, 13, 3, 18, true), stone, x, 0, 0));
        for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          g.add(cyl(1.4, 1.4, 52, stoneD, x + cx * 6, 26, cz * 6, 8));
          g.add(cone(1.6, 5, roofP, x + cx * 6, 54.5, cz * 6, 8));
        }
        g.add(geo(new THREE.ConeGeometry(8.6, 12, 4).rotateY(Math.PI / 4), roofP, x, 52, 0));
        g.add(cone(0.4, 5, ctx.P(0xd8b04a, 'metal'), x, 60, 0, 4));
        g.add(box(13.4, 1, 13.4, stoneD, x, 46, 0));
        g.add(box(5, 6, 0.4, ctx.P(0xfff0c0, 'lit'), x, 34, 6.7));
        // correntes azuis descendo para os lados
        for (const z of [-5, 5]) {
          const pts = [];
          for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(V(x + s * u * 48, 40 - 34 * Math.sin(u * Math.PI / 2) + 4 * Math.sin(u * Math.PI), z)); }
          for (let k = 0; k < 8; k++) g.add(bar(pts[k], pts[k + 1], 1.1, blue));
        }
        g.add(box(4, 4, 13, stoneD, s * (px + 48), 2, 0));
      }
      // passarelas altas (azuis) ligando as torres
      for (const z of [-4.5, 4.5]) {
        g.add(box(2 * px, 3.5, 3, blue, 0, 40, z));
        g.add(box(2 * px, 0.5, 3.4, ctx.P(0xf4f4f4), 0, 41.9, z));
      }
    },
  },

  // ======================= PARIS =======================
  eiffel: {
    w: 56, d: 56,
    build(ctx, g) {
      const bronze = 0x8a6a4a;
      g.add(geo(new THREE.PlaneGeometry(56, 56).rotateX(-Math.PI / 2), ctx.P(0x7ab85a, 'flat'), 0, 0.08, 0));
      const T = new THREE.Group(); g.add(T);
      const hw = latticeTower(ctx, T, { base: 19, top: 1.2, h: 104, colors: bronze, thick: 2.6, curve: 1.9, seg: 16, decks: [[26, 3, bronze], [55, 2, bronze], [92, 1.2, bronze]] });
      // arcos da base
      for (let f = 0; f < 4; f++) {
        const a = f * Math.PI / 2;
        const arc = geo(new THREE.TorusGeometry(12.5, 0.9, 4, 14, Math.PI), ctx.P(bronze, 'metal'), Math.sin(a) * hw(10), 12, Math.cos(a) * hw(10));
        arc.rotation.y = a; arc.scale.y = 1.1; g.add(arc);
      }
      g.add(cone(0.35, 10, ctx.P(0xd8d8d8, 'metal'), 0, 108, 0, 4));
      g.add(sphere(0.9, ctx.P(0xffe8a0, 'neon'), 0, 113, 0, 6, 4));
      // luzinhas douradas nas pernas (brilham à noite)
      for (let y = 4; y < 100; y += 6) for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) g.add(sphere(0.35, ctx.P(0xffd27a, 'neon'), sx * (hw(y) + 0.4), y, sz * (hw(y) + 0.4), 4, 3));
    },
  },
  arcoTriunfo: {
    kind: 'span', w: 72, d: 22, pillar: 13,
    build(ctx, g) {
      const e = ctx.e, a = e + 1.6, W = 2 * a + 26, H = 52, D = 22;
      const stone = ctx.P(0xeadfc4), stoneD = ctx.P(0xd2c4a2);
      g.add(geo(archWallGeo(W, H, D, a, 21), stone));
      g.add(box(W + 1.4, 2, D + 1.4, stoneD, 0, H - 9, 0));
      g.add(box(W + 0.8, 1.2, D + 0.8, stoneD, 0, H - 0.6, 0));
      g.add(box(W + 1.2, 1.4, D + 1.2, stoneD, 0, 30, 0));
      // relevos nos pilares (dos dois lados)
      for (const s of [-1, 1]) for (const fz of [-1, 1]) {
        g.add(box(8, 11, 0.6, ctx.P(0xc8b890), s * (a + 6.5), 17, fz * (D / 2 + 0.3)));
        g.add(box(8, 4, 0.6, ctx.P(0xc8b890), s * (a + 6.5), 37, fz * (D / 2 + 0.3)));
      }
      // bandeira azul, branca e vermelha pendurada no arco
      const fl = new THREE.Group(); g.add(fl);
      flag(ctx, fl, 0, 36, 0, [0x2050c0, 0xffffff, 0xe02030], 12, 9);
      fl.add(cyl(0.1, 0.1, 13, ctx.P(0x888888), 0, 40.5, 0, 4).rotateZ(Math.PI / 2));
    },
  },
  piramideVidro: {
    w: 76, d: 60,
    build(ctx, g) {
      g.add(geo(new THREE.PlaneGeometry(76, 60).rotateX(-Math.PI / 2), ctx.P(0xd6cfc2, 'flat'), 0, 0.1, 0));
      const glass = ctx.P(0x9fd0f0, 'glass'), frame = ctx.P(0x4a5058, 'metal');
      const H = 22, B = 17;
      g.add(geo(new THREE.ConeGeometry(B * Math.SQRT2, H, 4).rotateY(Math.PI / 4), glass, 0, H / 2, 6));
      const top = V(0, H, 6);
      for (const [x, z] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) g.add(beam(V(x * B, 0, 6 + z * B), top, 0.25, frame, 4));
      for (let k = 1; k < 5; k++) {
        const f = k / 5, y = H * f, s = B * (1 - f);
        for (const [a, b] of [[[1, 1], [1, -1]], [[1, -1], [-1, -1]], [[-1, -1], [-1, 1]], [[-1, 1], [1, 1]]]) g.add(beam(V(a[0] * s, y, 6 + a[1] * s), V(b[0] * s, y, 6 + b[1] * s), 0.12, frame, 3));
      }
      for (const [x, z] of [[-24, 18], [24, 18], [0, -14]]) g.add(geo(new THREE.ConeGeometry(4.2, 4.5, 4).rotateY(Math.PI / 4), glass, x, 2.25, z));
      for (const [x, z] of [[-22, 6], [22, 6]]) g.add(geo(new THREE.PlaneGeometry(14, 10).rotateX(-Math.PI / 2), ctx.P(0x4ab0e8, 'glow'), x, 0.25, z));
      // palácio em U atrás
      const add = (x, z, w, d) => { const c = ctx.world(g, x, 0, z); ctx.addBuilding({ x: c.x, y: ctx.gl, z: c.z, w, h: 20, d, rot: g.rotation.y, type: 'haussmann' }); };
      add(0, -24, 70, 12);
      g.add(geo(frustumGeo(71, 13, 5, 0.6), ctx.P(0x5f6a7a), 0, 22.5, -24));
    },
  },
  basilicaMorro: {
    kind: 'far', w: 110, d: 100,
    build(ctx, g) {
      const hill = geo(new THREE.IcosahedronGeometry(1, 2), ctx.P(0x5f9a4a), 0, 0, 0); hill.scale.set(56, 30, 48); g.add(hill);
      const white = ctx.P(0xf6f3ec, 'smooth');
      const B = new THREE.Group(); B.position.set(0, 26, 0); g.add(B);
      B.add(box(30, 14, 22, white, 0, 7, 0));
      B.add(cyl(7, 7, 10, white, 0, 19, 0, 14));
      B.add(geo(lathe([[7.2, 0], [7, 4], [5.5, 9], [3, 12.5], [0.8, 14], [0.6, 16], [0, 17]], 14), white, 0, 24, 0));
      for (const [x, z] of [[-10, 8], [10, 8], [-10, -8], [10, -8]]) {
        B.add(cyl(2.6, 2.6, 5, white, x, 16.5, z, 10));
        B.add(geo(lathe([[2.8, 0], [2.4, 2.4], [1.2, 4.2], [0, 5.5]], 10), white, x, 19, z));
      }
      B.add(box(6, 26, 6, white, 0, 13, -12));
      B.add(geo(lathe([[3.2, 0], [2.6, 3], [1, 5.5], [0, 7]], 10), white, 0, 26, -12));
      for (let k = 0; k < 3; k++) B.add(box(5, 7, 0.4, ctx.P(0x3a3a48), -8 + k * 8, 5, 11.2));
    },
  },

  // ======================= ROMA =======================
  colunaTriunfal: {
    w: 16, d: 16,
    build(ctx, g) {
      const marble = ctx.P(0xe8e0cc, 'smooth');
      g.add(box(9, 8, 9, marble, 0, 4, 0));
      g.add(box(10, 1, 10, ctx.P(0xd6ccb4), 0, 8.5, 0));
      g.add(cyl(2.4, 2.6, 34, marble, 0, 26, 0, 14));
      const helix = [];
      for (let k = 0; k <= 90; k++) { const a = k * 0.42, y = 9.5 + k * 0.36; helix.push(V(Math.cos(a) * 2.6, y, Math.sin(a) * 2.6)); }
      g.add(geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 120, 0.35, 4, false), ctx.P(0xc8bc9c)));
      g.add(box(6, 1.6, 6, marble, 0, 43.8, 0));
      g.add(cyl(1, 1.2, 2, marble, 0, 45.6, 0, 8));
      g.add(cyl(0.6, 0.9, 4, ctx.P(0x5a7a6a, 'metal'), 0, 48.6, 0, 8));
      g.add(sphere(0.7, ctx.P(0x5a7a6a, 'metal'), 0, 51.2, 0, 8, 6));
    },
  },
  arcoRomano: {
    kind: 'span', w: 70, d: 12, pillar: 11,
    build(ctx, g) {
      const e = ctx.e, a = e + 1.6, W = 2 * a + 22, H = 38, D = 12;
      const marble = ctx.P(0xeae2cc);
      g.add(geo(archWallGeo(W, H, D, a, 13), marble));
      for (const fz of [-1, 1]) for (const s of [-1, 1]) for (const k of [0, 1]) {
        const x = s * (a + 2 + k * 6.5);
        g.add(cyl(0.9, 0.9, 22, ctx.P(0xf2ead8, 'smooth'), x, 13, fz * (D / 2 + 1), 10));
        g.add(box(2.4, 1.4, 2.4, ctx.P(0xd8ccb0), x, 24.6, fz * (D / 2 + 1)));
      }
      g.add(box(W + 1, 1.6, D + 3, ctx.P(0xd8ccb0), 0, 25.6, 0));
      for (const fz of [-1, 1]) {
        const s = ctx.sign('ROMA', 16, 4.5, { bg: '#e8dcc0', fg: '#6a5a40', stroke: false, frame: false, font: 'Georgia, serif' });
        s.position.set(0, 31, fz * (D / 2 + 0.25)); s.rotation.y = fz > 0 ? 0 : Math.PI; g.add(s);
      }
      for (const s of [-1, 1]) { const st = person(ctx.mats, 0, 0, 0xf2ead8, 0xf2ead8, 1.6); st.position.set(s * (a + 8), H, 0); g.add(st); }
    },
  },
  domo: {
    kind: 'far', w: 90, d: 70,
    build(ctx, g) {
      const stone = ctx.P(0xeae2cc), dome = ctx.P(0x8ea4ac, 'smooth');
      g.add(box(60, 26, 22, stone, 0, 13, 18));
      for (let k = 0; k < 8; k++) g.add(cyl(1.4, 1.4, 22, ctx.P(0xf4eedc), -21 + k * 6, 11, 29.5, 8));
      g.add(geo(gableGeo(40, 6, 6), stone, 0, 26, 28));
      g.add(cyl(18, 18, 14, stone, 0, 33, -8, 24));
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.add(cyl(0.9, 0.9, 12, ctx.P(0xf4eedc), Math.cos(a) * 18.6, 33, -8 + Math.sin(a) * 18.6, 6)); }
      g.add(geo(lathe([[18.5, 0], [18, 6], [15, 15], [9, 22], [3, 25], [3, 27], [0, 27]], 24), dome, 0, 40, -8));
      g.add(cyl(2.6, 2.6, 6, stone, 0, 70, -8, 10));
      g.add(cone(2.8, 5, dome, 0, 75.5, -8, 10));
      g.add(sphere(0.9, ctx.P(0xd8b04a, 'metal'), 0, 78.6, -8, 6, 4));
      g.add(geo(new THREE.PlaneGeometry(90, 40).rotateX(-Math.PI / 2), ctx.P(0xd6cdb8, 'flat'), 0, 0.12, 30));
    },
  },
};
