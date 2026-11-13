// Enfeites de rua de cada cidade (bancas, cafés, cabines vermelhas, neons...).
// Tudo vai para o "saco" da cidade e vira poucas malhas no fim.
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, person, SKINS, SHIRTS } from './common.js';

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
};
