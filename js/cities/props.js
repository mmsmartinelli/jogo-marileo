// Enfeites de rua de cada cidade (bancas, cafés, cabines vermelhas, neons...).
// Tudo vai para o "saco" da cidade e vira poucas malhas no fim.
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, bar, frustumGeo, person, SKINS, SHIRTS } from './common.js';

function put(ctx, obj, s) {
  obj.position.set(s.x, ctx.track.groundHeight(s.x, s.z), s.z);
  obj.rotation.y = s.rot;
  ctx.bag.add(obj);
}

const NEON_NAMES = ['LÁMEN DA MARI', 'KARAOKÊ DO LEO', 'SUSHI DO PINGO', 'JOGOS TURBO', 'MANGÁ DO PIPO', 'CAFÉ DA FIFI', 'DOCES DO BENTO', 'TEMPURÁ DO REX', 'PIPOCA NEKO', 'ARCADE TUTI'];
const NEON_COLS = [['#ff2a8a', '#ffffff'], ['#2ad8ff', '#10102a'], ['#ffd23f', '#d6202a'], ['#7cff4a', '#10102a'], ['#b06bff', '#ffffff'], ['#ff7a1a', '#ffffff']];

export const PROPS = {
  // bancas de jornal / barraquinhas de feira
  bancas(ctx) {
    const cols = [0x2f7bff, 0xff7a1a, 0x1fae5c, 0xe8262a, 0xffc81a];
    ctx.propSpots(14, 11, 15, 70, 4).forEach((s, k) => {
      const g = new THREE.Group();
      g.add(box(4, 2.8, 2.6, ctx.P(0xe8e2d6), 0, 1.4, 0));
      const aw = box(4.6, 0.15, 1.6, ctx.P(cols[k % cols.length]), 0, 2.9, 1.6); aw.rotation.x = 0.3; g.add(aw);
      g.add(box(3.6, 1.2, 0.2, ctx.P(0xfff2c0, 'lit'), 0, 1.7, 1.32));
      g.add(person(ctx.mats, 2.6, 1.2, SHIRTS[k % 6], SKINS[k % 4]));
      put(ctx, g, s);
    });
  },
  // praia do Rio: guarda-sóis coloridos e barraquinhas na areia
  guardasois(ctx) {
    const tr = ctx.track, sh = tr.shore;
    if (!sh) return;
    const cols = [0xff4a4a, 0xffd23f, 0x2f7bff, 0x1fae5c, 0xff7ab8, 0xffffff];
    let n = 0;
    const step = Math.max(1, Math.round(9 / tr.spacing));
    for (let i = 0; i < ctx.N && n < 70; i += step) {
      const s0 = ctx.shoreS(tr.px[i], tr.pz[i]);
      if (s0 < -170) continue;
      const u = sh.beachW * (0.15 + 0.7 * ctx.rand());
      const x = tr.px[i] + sh.nx * (-s0 - u), z = tr.pz[i] + sh.nz * (-s0 - u);
      if (ctx.near(x, z).d < ctx.e + 10 || !ctx.isFree(x, z, 2.5)) continue;
      const g = new THREE.Group();
      g.add(cyl(0.08, 0.08, 3.2, ctx.P(0xeeeeee), 0, 1.6, 0, 4));
      g.add(cone(2.2, 1, ctx.P(cols[n % cols.length]), 0, 3.2, 0, 8));
      const towel = box(1.2, 0.05, 2.2, ctx.P(cols[(n + 2) % cols.length], 'flat'), 1.8, 0.05, 0.4); towel.rotation.y = n; g.add(towel);
      g.position.set(x, ctx.gl, z);
      g.rotation.y = n * 1.3;
      ctx.bag.add(g);
      ctx.reserve(x, z, 2.5);
      n++;
    }
  },
  quiosques(ctx) {
    ctx.propSpots(8, 12, 16, 120, 5).forEach((s, k) => {
      const g = new THREE.Group();
      g.add(cyl(2.4, 2.4, 2.4, ctx.P(0xf2efe6), 0, 1.2, 0, 8));
      g.add(cone(3.6, 2.2, ctx.P(0xd8b060), 0, 3.5, 0, 8));
      g.add(cyl(2.45, 2.45, 0.6, ctx.P([0x1fae5c, 0xffd23f, 0x2f7bff][k % 3]), 0, 1.9, 0, 8));
      for (let c = 0; c < 3; c++) g.add(sphere(0.4, ctx.P(0x7a4a2a, 'smooth'), Math.cos(c * 2) * 3.2, 0.4, Math.sin(c * 2) * 3.2, 6, 4));
      put(ctx, g, s);
    });
  },
  // cafés com toldo listrado (Paris, Roma)
  cafes(ctx) {
    const paris = ctx.kitId === 'paris';
    const cols = paris ? [0xc8202a, 0x1f6a4a, 0x1f3a8a] : [0x1f8a4a, 0xff7a1a, 0xc8202a];
    ctx.propSpots(16, 11, 14, 55, 5).forEach((s, k) => {
      const g = new THREE.Group();
      const c = cols[k % cols.length];
      for (let i = 0; i < 6; i++) { const a = box(6 / 6, 0.12, 2.6, ctx.P(i % 2 ? 0xffffff : c), -2.5 + i, 3.1, 0.4); a.rotation.x = 0.35; g.add(a); }
      for (const x of [-2.9, 2.9]) g.add(cyl(0.06, 0.06, 3.1, ctx.P(0x333333), x, 1.55, 1.5, 4));
      for (let t = 0; t < 3; t++) {
        const x = -2 + t * 2;
        g.add(cyl(0.5, 0.5, 0.08, ctx.P(0xffffff), x, 1.05, 0.8, 8));
        g.add(cyl(0.05, 0.05, 1, ctx.P(0x333333), x, 0.5, 0.8, 4));
        for (const dz of [-0.7, 0.7]) g.add(box(0.45, 0.8, 0.45, ctx.P(paris ? 0x8a5a2a : 0xd8d2c4), x, 0.4, 0.8 + dz));
      }
      g.add(person(ctx.mats, -1, 1.5, SHIRTS[k % 6], SKINS[(k + 1) % 4], 0.9));
      g.add(box(6.4, 2.6, 0.3, ctx.P(0xfff0c8, 'lit'), 0, 1.3, -1.4));
      put(ctx, g, s);
    });
  },
  // cabines de telefone vermelhas e caixas de correio (Londres)
  cabines(ctx) {
    ctx.propSpots(26, 11, 14, 45, 2.5).forEach((s, k) => {
      const g = new THREE.Group();
      if (k % 3 === 2) {
        g.add(cyl(0.45, 0.45, 1.6, ctx.P(0xd6202a, 'smooth'), 0, 0.8, 0, 10));
        g.add(sphere(0.47, ctx.P(0xd6202a, 'smooth'), 0, 1.6, 0, 10, 6, Math.PI / 2));
      } else {
        g.add(box(1.3, 2.8, 1.3, ctx.P(0xd6202a), 0, 1.4, 0));
        g.add(box(1.36, 1.6, 1.1, ctx.P(0xfff4c8, 'lit'), 0, 1.5, 0));
        g.add(box(1.1, 1.6, 1.36, ctx.P(0xfff4c8, 'lit'), 0, 1.5, 0));
        g.add(box(1.5, 0.3, 1.5, ctx.P(0xd6202a), 0, 2.95, 0));
        g.add(box(1.2, 0.25, 1.38, ctx.P(0x111111), 0, 2.6, 0));
      }
      put(ctx, g, s);
    });
  },
  // hidrantes e bancas de NY
  hidrantes(ctx) {
    ctx.propSpots(24, 11, 13, 40, 2).forEach(s => {
      const g = new THREE.Group();
      g.add(cyl(0.3, 0.35, 1, ctx.P(0xd6202a, 'smooth'), 0, 0.5, 0, 8));
      g.add(sphere(0.32, ctx.P(0xd6202a, 'smooth'), 0, 1, 0, 8, 6, Math.PI / 2));
      g.add(cyl(0.12, 0.12, 0.9, ctx.P(0xd6202a), 0, 0.65, 0, 6).rotateZ(Math.PI / 2));
      put(ctx, g, s);
    });
    PROPS.bancas(ctx);
  },
  // placas de neon verticais (Tóquio)
  neon(ctx) {
    ctx.propSpots(22, 11, 14, 40, 3).forEach((s, k) => {
      const g = new THREE.Group();
      const name = NEON_NAMES[k % NEON_NAMES.length];
      const [bg, fg] = NEON_COLS[k % NEON_COLS.length];
      g.add(box(0.4, 9, 0.4, ctx.P(0x333338), 0, 4.5, -0.6));
      const words = name.split(' ');
      const panel = ctx.signPlane('', 3, 9, {
        bg: '#10101a', ph: 256,
        draw: (c, w, h) => {
          c.fillStyle = bg; c.fillRect(6, 6, w - 12, h - 12);
          c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
          const letters = words[0].length > 7 ? words[0].slice(0, 7).split('') : words[0].split('');
          const sz = Math.min(w * 0.7, (h - 20) / letters.length);
          c.font = `900 ${sz}px Arial Black, Arial, sans-serif`;
          letters.forEach((l, i) => c.fillText(l, w / 2, 14 + sz * (i + 0.5)));
        },
      });
      panel.position.set(0, 7, -0.35);
      g.add(panel);
      const back = panel.clone(); back.rotation.y = Math.PI; back.position.z = -0.85; g.add(back);
      g.add(box(3.2, 9.2, 0.4, ctx.P(0x222228), 0, 7, -0.6));
      put(ctx, g, s);
    });
  },
  maquinas(ctx) {
    const cols = [0xe8262a, 0x2f7bff, 0xffffff, 0x1fae5c];
    ctx.propSpots(16, 11, 13, 60, 3).forEach((s, k) => {
      const g = new THREE.Group();
      for (let m = 0; m < 3; m++) {
        g.add(box(1.2, 2.2, 0.9, ctx.P(cols[(k + m) % cols.length]), -1.3 + m * 1.3, 1.1, 0));
        g.add(box(1.0, 1.1, 0.1, ctx.P(0xeaf6ff, 'lit'), -1.3 + m * 1.3, 1.45, 0.46));
      }
      put(ctx, g, s);
    });
  },
  // lanternas vermelhas (Pequim)
  lanternas(ctx) {
    ctx.propSpots(28, 11, 14, 36, 2.5).forEach(s => {
      const g = new THREE.Group();
      g.add(cyl(0.12, 0.15, 5, ctx.P(0x3a2a20), 0, 2.5, 0, 5));
      g.add(box(2.6, 0.15, 0.15, ctx.P(0x3a2a20), 0, 5, 0));
      for (const x of [-1, 1]) {
        g.add(sphere(0.6, ctx.P(0xff2a1a, 'neon'), x, 4.1, 0, 8, 6)).children.at(-1).scale.set(1, 1.2, 1);
        g.add(cyl(0.35, 0.35, 0.15, ctx.P(0xffc81a), x, 4.85, 0, 6));
        g.add(cyl(0.35, 0.35, 0.15, ctx.P(0xffc81a), x, 3.35, 0, 6));
      }
      put(ctx, g, s);
    });
  },
  // canteiros de flores (Agra)
  flores(ctx) {
    const fl = [0xff5e9c, 0xffd23f, 0xff7b3b, 0xffffff, 0xb98cff];
    ctx.propSpots(16, 11, 15, 50, 4).forEach((s, k) => {
      const g = new THREE.Group();
      g.add(cyl(3, 3.2, 0.5, ctx.P(0xd8c0a0), 0, 0.25, 0, 12));
      g.add(cyl(2.8, 2.8, 0.2, ctx.P(0x4a8a3a), 0, 0.55, 0, 12));
      for (let f = 0; f < 14; f++) { const a = f * 2.4, r = 0.6 + (f % 3) * 0.8; g.add(sphere(0.35, ctx.P(fl[(f + k) % fl.length], 'smooth'), Math.cos(a) * r, 0.8, Math.sin(a) * r, 5, 4)); }
      put(ctx, g, s);
    });
  },
  // mercado de Agra: barracas com toldo listrado, montes de temperos, frutas, vendedor;
  // às vezes um tuk-tuk estacionado ou uma vaca deitada do lado
  bazar(ctx) {
    const AW = [[0xe8262a, 0xffd23f], [0x1fae9c, 0xffffff], [0xff5e9c, 0xffd23f], [0xff8a1a, 0xffffff], [0x7a3fb8, 0xffc81a], [0x2f7bff, 0xff8a1a]];
    const SP = [0xd8382a, 0xffc81a, 0xe8781a, 0x8a4a2a, 0x3fae4a, 0xf2e6c0];
    const bulbs = ctx.glow > 0.6;
    ctx.propSpots(18, 11, 15, 42, 6).forEach((s, k) => {
      const g = new THREE.Group();
      const n = 2 + (k % 2);
      for (let m = 0; m < n; m++) {
        const x = (m - (n - 1) / 2) * 3.6;
        const [c1, c2] = AW[(k + m) % AW.length];
        g.add(box(3.2, 1, 1.8, ctx.P(0x8a5a32), x, 0.5, 0.6));
        for (const px of [-1.55, 1.55]) g.add(box(0.14, 2.8, 0.14, ctx.P(0x6a4a2a), x + px, 1.4, -0.2));
        for (let i = 0; i < 4; i++) { const a = box(0.8, 0.1, 2.6, ctx.P(i % 2 ? c2 : c1), x - 1.2 + i * 0.8, 2.85, 0.7); a.rotation.x = 0.28; g.add(a); }
        for (let i = 0; i < 3; i++) g.add(cone(0.42, 0.6, ctx.P(SP[(k + m * 2 + i) % SP.length]), x - 1 + i, 1.3, 0.9, 6));
        g.add(box(3, 1.8, 0.2, ctx.P(0xe8d8b8), x, 1.9, -0.25));
        if (bulbs) for (let i = 0; i < 4; i++) g.add(sphere(0.12, ctx.P([0xffe08a, 0xff8ac8, 0x8ae0ff][i % 3], 'neon'), x - 1.2 + i * 0.8, 2.55, 1.9, 4, 3));
      }
      g.add(person(ctx.mats, -0.4, -0.9, SHIRTS[k % 6], SKINS[(k + 2) % 4], 0.9));
      if (k % 3 === 0) g.add(person(ctx.mats, 1.6, 2.6, SHIRTS[(k + 3) % 6], SKINS[(k + 1) % 4], 0.85));
      if (k % 4 === 1) g.add(tukTuk(ctx, n * 1.8 + 2.2, 1.5, k));
      else if (k % 4 === 3) g.add(cow(ctx, -n * 1.8 - 2.2, 1.6, k, true));
      put(ctx, g, s);
    });
  },
  // bandeirinhas coloridas por cima da pista (com lâmpadas acesas à noite)
  bandeirinhas(ctx) {
    const tr = ctx.track, e = ctx.e, N = ctx.N;
    const FL = [0xe8262a, 0xffc81a, 0x1fae5c, 0xff5e9c, 0x2f7bff, 0xff8a1a, 0xffffff];
    const avoid = (ctx.def.features || []).filter(f => f.type === 'ramp').map(f => f.t);
    for (const p of ctx.placed) if (p.span) avoid.push(p.i / N);
    const bulbs = ctx.glow > 0.6;
    const flagGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0, 0, 0.55, 0, 0, 0, -1.2, 0], 3)); g.computeVertexNormals(); return g; };
    const n = 9;
    for (let q = 0; q < n; q++) {
      const t = 0.06 + (q + ctx.rand() * 0.5) * 0.9 / n;
      if (avoid.some(u => Math.abs(((t - u + 1.5) % 1) - 0.5) < 0.04)) continue;
      const i = tr.wrap(Math.floor(t * N));
      const lat = e + 2.2;
      const pts = [-1, 1].map(sd => ({ x: tr.px[i] + tr.rx[i] * sd * lat, z: tr.pz[i] + tr.rz[i] * sd * lat }));
      if (pts.some(p => ctx.near(p.x, p.z).d < lat - 1 || !ctx.isFree(p.x, p.z, 1))) continue;
      const y0 = ctx.track.groundHeight(pts[0].x, pts[0].z), y1 = ctx.track.groundHeight(pts[1].x, pts[1].z);
      const H = 11.5, sag = 2.2;
      const g = new THREE.Group();
      for (const [p, y] of [[pts[0], y0], [pts[1], y1]]) g.add(cyl(0.16, 0.22, H + 0.8, ctx.P(0x6a5a4a), p.x, y + (H + 0.8) / 2, p.z, 5));
      const at = u => {
        const x = pts[0].x + (pts[1].x - pts[0].x) * u, z = pts[0].z + (pts[1].z - pts[0].z) * u;
        return new THREE.Vector3(x, y0 + (y1 - y0) * u + H - sag * 4 * u * (1 - u), z);
      };
      const segs = 8;
      for (let a = 0; a < segs; a++) g.add(bar(at(a / segs), at((a + 1) / segs), 0.08, ctx.P(0x333333)));
      const heading = Math.atan2(-(pts[1].z - pts[0].z), pts[1].x - pts[0].x);
      const nf = 22;
      for (let f = 1; f < nf; f++) {
        const p = at(f / nf);
        const m = geo(flagGeo(), ctx.P(FL[(f + q) % FL.length], 'twoSided'), p.x, p.y, p.z);
        m.rotation.y = heading;
        g.add(m);
        if (bulbs && f % 2) g.add(sphere(0.16, ctx.P(0xffe8a0, 'neon'), p.x, p.y + 0.1, p.z, 4, 3));
      }
      ctx.reserve(pts[0].x, pts[0].z, 1.2); ctx.reserve(pts[1].x, pts[1].z, 1.2);
      ctx.bag.add(g);
    }
  },
  // bichos de Agra na calçada: vacas, pavões e macaquinhos
  bichos(ctx) {
    ctx.propSpots(16, 8, 13, 48, 2.5).forEach((s, k) => {
      const g = new THREE.Group();
      if (k % 3 === 0) g.add(cow(ctx, 0, 0, k, k % 2 === 0));
      else if (k % 3 === 1) {
        // pavão com a cauda aberta
        const blue = ctx.P(0x1f4ab8, 'smooth');
        g.add(sphere(0.45, blue, 0, 0.9, 0, 6, 4)).children.at(-1).scale.set(1, 1, 1.4);
        g.add(cyl(0.1, 0.16, 0.9, blue, 0, 1.4, 0.35, 5));
        g.add(sphere(0.16, blue, 0, 1.9, 0.42, 5, 3));
        g.add(cone(0.06, 0.25, ctx.P(0x1f4ab8), 0, 2.15, 0.42, 3));
        for (const x of [-0.12, 0.12]) g.add(cyl(0.04, 0.04, 0.6, ctx.P(0x8a7a5a), x, 0.3, 0, 3));
        const fan = geo(new THREE.CircleGeometry(1.7, 9, 0, Math.PI), ctx.P(0x2a8a4a, 'twoSided'), 0, 1.0, -0.5);
        fan.rotation.x = -0.25; g.add(fan);
        for (let i = 0; i < 7; i++) {
          const a = (i + 0.5) / 7 * Math.PI;
          const d = geo(new THREE.CircleGeometry(0.18, 5), ctx.P(0x1f4ab8, 'twoSided'), Math.cos(a) * 1.35, 1.0 + Math.sin(a) * 1.35 * 0.97, -0.5 + Math.sin(a) * 0.33 + 0.02);
          d.rotation.x = -0.25; g.add(d);
        }
      } else {
        // muretinha com macacos
        g.add(box(4, 1, 1, ctx.P(0xc8644a), 0, 0.5, 0));
        for (let m = 0; m < 3; m++) {
          const x = -1.3 + m * 1.3, fur = ctx.P(m === 1 ? 0x8a6a4a : 0xa07a54, 'smooth');
          g.add(sphere(0.35, fur, x, 1.35, 0, 6, 4));
          g.add(sphere(0.25, fur, x, 1.85, 0.1, 6, 4));
          g.add(sphere(0.16, ctx.P(0xe8b8a0, 'smooth'), x, 1.8, 0.3, 5, 3));
          const tail = cyl(0.05, 0.05, 1, fur, x + 0.2, 0.75, -0.45, 3); tail.rotation.x = 0.3; g.add(tail);
        }
      }
      put(ctx, g, s);
    });
  },
  // templozinhos hindus com torre (shikhara) cor de açafrão e bandeira
  templos(ctx) {
    ctx.propSpots(7, 17, 26, 110, 6).forEach((s, k) => {
      const g = new THREE.Group();
      const sh = k % 2 ? 0xf08a2a : 0xf6efe2, trim = k % 2 ? 0xffffff : 0xe8782a;
      g.add(box(9, 1.2, 9, ctx.P(0xd8c8b0), 0, 0.6, 0));
      g.add(box(5.6, 5, 5.6, ctx.P(0xf6efe2), 0, 3.7, -0.6));
      g.add(box(3.4, 3.6, 3, ctx.P(sh), 0, 3, 2.6));
      g.add(box(1.6, 2.4, 0.2, ctx.P(0x3a2018), 0, 2.4, 4.12));
      let y = 6.2, w = 5;
      for (let i = 0; i < 4; i++) { g.add(geo(frustumGeo(w, w, 2.4, 0.8), ctx.P(i % 2 ? trim : sh), 0, y + 1.2, -0.6)); y += 2.4; w *= 0.8; }
      g.add(cyl(1.3, 1.3, 0.6, ctx.P(trim), 0, y + 0.3, -0.6, 8));
      g.add(sphere(0.45, ctx.P(0xe8b830, 'metal'), 0, y + 0.9, -0.6, 6, 4));
      g.add(cyl(0.06, 0.06, 3, ctx.P(0x8a7a5a), 0, y + 2, -0.6, 3));
      g.add(box(1.6, 0.9, 0.05, ctx.P(0xff7a1a, 'twoSided'), 0.8, y + 3, -0.6));
      g.add(person(ctx.mats, 2.4, 3.4, 0xffc81a, SKINS[k % 4], 0.85));
      put(ctx, g, s);
    });
  },
};

// Tuk-tuk estacionado (enfeite do mercado).
function tukTuk(ctx, x, z, k) {
  const g = new THREE.Group();
  const c = [0x1fae5c, 0xffc81a, 0x2f7bff][k % 3];
  g.add(box(1.6, 0.9, 2.6, ctx.P(c), 0, 0.8, -0.2));
  g.add(box(1.7, 0.12, 2.8, ctx.P(0x222222), 0, 2.3, -0.3));
  for (const [px, pz] of [[-0.75, -1.5], [0.75, -1.5], [-0.75, 0.9], [0.75, 0.9]]) g.add(box(0.1, 1.4, 0.1, ctx.P(0x222222), px, 1.6, pz));
  g.add(box(1.1, 0.7, 0.8, ctx.P(c), 0, 0.7, 1.4));
  for (const [px, pz] of [[0, 1.7], [-0.8, -1.1], [0.8, -1.1]]) g.add(cyl(0.35, 0.35, 0.25, ctx.P(0x222226), px, 0.35, pz, 6)).children.at(-1).rotation.z = Math.PI / 2;
  g.position.set(x, 0, z);
  g.rotation.y = 1.4;
  return g;
}

// Vaca branca (deitada ou em pé) com colar de flores laranja.
export function cow(ctx, x, z, k, lying) {
  const g = new THREE.Group();
  const fur = ctx.P(k % 4 === 1 ? 0xd8c8b0 : 0xf2eee6, 'smooth');
  const y = lying ? -0.7 : 0;
  g.add(box(1.1, 1.0, 2.2, fur, 0, 1.4 + y, 0));
  g.add(box(0.6, 0.5, 0.6, fur, 0, 2.0 + y, 0.55));
  g.add(box(0.55, 0.6, 0.9, fur, 0, 1.75 + y * 0.6, 1.45));
  g.add(box(0.4, 0.3, 0.2, ctx.P(0xe8b8a8), 0, 1.6 + y * 0.6, 1.92));
  for (const s of [-1, 1]) { const h = cone(0.06, 0.45, ctx.P(0x8a7a6a), s * 0.25, 2.25 + y * 0.6, 1.3, 4); h.rotation.z = -s * 0.5; g.add(h); }
  g.add(box(0.7, 0.18, 0.18, ctx.P(0xff8a1a), 0, 1.45 + y * 0.6, 1.1));
  if (!lying) for (const [px, pz] of [[-0.4, -0.8], [0.4, -0.8], [-0.4, 0.8], [0.4, 0.8]]) g.add(box(0.22, 0.9, 0.22, fur, px, 0.45, pz));
  g.position.set(x, 0, z);
  g.rotation.y = k * 1.7;
  return g;
}
