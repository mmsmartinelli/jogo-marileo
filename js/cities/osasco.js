// Osasco: a cidade "de casa" do Race Cities. Ponte Metálica com arcos rosa, estação com
// trem, praça dos pombos, Dogão do Leo gigante e prédios inventados (Shopping da Gatinha,
// Condomínio das Flores, Banco do Leão...). Todos os nomes de lojas são de brincadeira.
import * as THREE from 'three';
import { lerp } from '../utils.js';
import { box, cyl, sphere, beam, geo, person, SKINS, SHIRTS, UP } from './common.js';

// Grupo interno com a origem na frente do terreno (lado da pista), que se estende para -z.
function front(g, d) { const inner = new THREE.Group(); inner.position.z = d / 2; g.add(inner); inner.updateMatrixWorld(true); return inner; }

// Cachorro-quente gigante (usado no Dogão).
function hotDog(ctx, rand) {
  const hd = new THREE.Group();
  const bun = ctx.P(0xe0a050, 'smooth');
  for (const z of [-1.1, 1.1]) { const bb = geo(new THREE.CapsuleGeometry(1.35, 9, 4, 10).rotateZ(Math.PI / 2), bun, 0, 0, z); bb.scale.set(1, 0.85, 1); hd.add(bb); }
  hd.add(geo(new THREE.CapsuleGeometry(1.05, 11.5, 4, 12).rotateZ(Math.PI / 2), ctx.P(0xc0462a, 'smooth'), 0, 0.75, 0));
  const zig = [];
  for (let k = 0; k <= 16; k++) zig.push(new THREE.Vector3(-5 + k * 0.625, 1.75, (k % 2 ? 0.45 : -0.45)));
  hd.add(geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zig), 48, 0.2, 5, false), ctx.P(0xffd21a, 'smooth')));
  // purê e batata palha (vem caprichado!)
  for (let k = 0; k < 5; k++) { const pb = sphere(0.7, ctx.P(0xfff0b0, 'smooth'), -4 + k * 2, 1.4, 0.95, 8, 6); pb.scale.set(1.4, 0.6, 0.6); hd.add(pb); }
  for (let k = 0; k < 30; k++) { const st = box(0.12, 0.12, 0.9, ctx.P(0xf0b030), -5 + rand() * 10, 1.95 + rand() * 0.4, (rand() - 0.5) * 1.6); st.rotation.set(rand() * 3, rand() * 3, rand() * 3); hd.add(st); }
  // carinha simpática na ponta da salsicha
  for (const z of [-0.45, 0.45]) { hd.add(sphere(0.32, ctx.P(0xffffff, 'glow'), 6.3, 1.15, z, 8, 6)); hd.add(sphere(0.16, ctx.P(0x111111, 'glow'), 6.58, 1.15, z, 6, 4)); }
  const smile = geo(new THREE.TorusGeometry(0.35, 0.07, 5, 10, Math.PI), ctx.P(0x111111, 'glow'), 6.62, 0.6, 0);
  smile.rotation.set(0, Math.PI / 2, Math.PI); hd.add(smile);
  return hd;
}

export const OSASCO_LANDMARKS = {
  // ---------- Dogão do Leo (trailer de cachorro-quente com um dogão gigante girando) ----------
  dogao: {
    w: 26, d: 14,
    build(ctx, g) {
      const f = front(g, 14), rand = ctx.rand;
      const red = ctx.P(0xe8262a), yellow = ctx.P(0xffc81a);
      f.add(box(12, 4.2, 5.5, red, 0, 2.9, -4));
      f.add(box(12.05, 0.8, 5.55, yellow, 0, 3.4, -4));
      f.add(box(8, 1.8, 0.2, ctx.P(0x2a1a14), 0, 3.3, -1.2));
      f.add(box(8.6, 0.25, 1.2, ctx.P(0xdddddd), 0, 2.2, -0.9));
      for (let k = 0; k < 6; k++) { const a = box(10 / 6, 0.15, 3, ctx.P(k % 2 ? 0xffffff : 0xe8262a), -5 + 10 / 12 + k * 10 / 6, 5.1, -0.4); a.rotation.x = 0.35; f.add(a); }
      for (const x of [-4, 4]) for (const z of [-6, -2]) { const wh = cyl(0.6, 0.6, 0.4, ctx.P(0x222222), x, 0.6, z, 12); wh.rotation.z = Math.PI / 2; f.add(wh); }
      const s = ctx.sign('DOGÃO DO LEO', 10, 3.1, { bg: '#ffc81a', fg: '#d11a2a', border: '#d11a2a' });
      s.position.set(0, 6.8, -1.4); f.add(s);
      // cachorro-quente gigante girando no alto (animado)
      const hd = hotDog(ctx, rand);
      hd.position.set(0, 15, -4);
      f.add(hd);
      f.add(cyl(0.35, 0.35, 10, ctx.P(0xcccccc, 'metal'), 0, 9.5, -4));
      const dyn = ctx.dynamic(hd);
      ctx.anim((dt, t) => { dyn.rotation.y += dt * 0.45; dyn.position.y = g.position.y + 15 + Math.sin(t * 1.5) * 0.4; });
      // mesinhas com guarda-sol
      for (const [x, z, col] of [[-9, -1, 0xffc81a], [9, -1, 0xe8262a], [-9, -8, 0xe8262a], [9, -8, 0xffc81a]]) {
        f.add(cyl(1.1, 1.1, 0.12, ctx.P(0xffffff), x, 1.1, z, 12));
        f.add(cyl(0.08, 0.08, 1.1, ctx.P(0xdddddd), x, 0.55, z, 5));
        f.add(cyl(0.06, 0.06, 3.2, ctx.P(0xdddddd), x, 1.6, z, 5));
        f.add(geo(new THREE.ConeGeometry(2, 0.9, 10), ctx.P(col), x, 3.3, z));
        for (const a of [0, 2.1, 4.2]) f.add(cyl(0.3, 0.3, 0.6, ctx.P(0xe8262a), x + Math.cos(a) * 1.6, 0.3, z + Math.sin(a) * 1.6, 7));
      }
      // fila de clientes
      for (let k = 0; k < 5; k++) f.add(person(ctx.mats, -3 + k * 1.5, 0.8 + (k % 2) * 0.4, SHIRTS[k % SHIRTS.length], SKINS[k % SKINS.length]));
      // cordão de lâmpadas
      for (const side of [-1, 1]) {
        f.add(cyl(0.12, 0.12, 5, ctx.P(0x555555), side * 11.5, 2.5, 1.5, 5));
        for (let k = 0; k <= 8; k++) f.add(sphere(0.16, ctx.P(0xffe08a, 'glow'), side * (6 + k * 5.5 / 8), 5 - Math.sin(k / 8 * Math.PI) * 0.8, 1.5, 6, 4));
      }
    },
  },

  // ---------- Shopping (nome inventado) ----------
  shopping: {
    w: 80, d: 66,
    build(ctx, g, o) {
      const L = { name: 'SHOPPING DA GATINHA', wall: 0xe9e2d6, accent: 0x1f5fbf, signBg: '#1f5fbf', signFg: '#ffffff', ...o };
      const f = front(g, 66), rand = ctx.rand;
      const lotD = 22, bw = 74, bh = 17, bd = 44;
      const lot = geo(new THREE.PlaneGeometry(bw + 6, lotD).rotateX(-Math.PI / 2), ctx.P(0x4a4b52, 'flat'), 0, 0.1, -lotD / 2); f.add(lot);
      for (let x = -bw / 2 + 3; x < bw / 2; x += 3) for (const z of [-5, -16]) f.add(box(0.15, 0.02, 4.6, ctx.P(0xf2f2f2, 'flat'), x, 0.13, z));
      const carCols = [0xd62d2d, 0xf2f2f2, 0x2b2b30, 0x2f6fd6, 0xc9c9cf, 0xf0c419, 0x1e8a5a, 0x8a8f99];
      let n = 0;
      for (let x = -bw / 2 + 4.5; x < bw / 2 - 2; x += 3) for (const z of [-5, -16]) if (rand() < 0.72) {
        const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rand() < 0.5 ? 0 : Math.PI;
        c.add(box(1.9, 1.0, 4.2, ctx.P(carCols[n++ % carCols.length], 'smooth'), 0, 0.75, 0));
        c.add(box(1.7, 0.8, 2.2, ctx.P(0x1d2733, 'metal'), 0, 1.6, -0.3));
        f.add(c);
      }
      const zb = -lotD - bd / 2;
      f.add(box(bw, bh, bd, ctx.P(L.wall), 0, bh / 2, zb));
      f.add(box(bw + 0.5, 1.4, bd + 0.5, ctx.P(L.accent), 0, bh + 0.3, zb));
      const glass = ctx.P(0x4f86b0, 'glass');
      f.add(box(34, 12, 0.6, glass, 0, 7, -lotD + 0.2));
      for (let x = -16; x <= 16; x += 4) f.add(box(0.3, 12, 0.8, ctx.P(0xdddddd), x, 7, -lotD + 0.4));
      f.add(box(14, 0.6, 6, ctx.P(L.accent), 0, 5, -lotD + 2.6));
      f.add(cyl(0.25, 0.25, 5, ctx.P(0xdddddd), -6, 2.5, -lotD + 5, 6));
      f.add(cyl(0.25, 0.25, 5, ctx.P(0xdddddd), 6, 2.5, -lotD + 5, 6));
      f.add(cyl(7, 7, 22, glass, bw / 2 - 8, 11, -lotD - 6, 16));
      const s = ctx.sign(L.name, 44, 7.7, { bg: L.signBg, fg: L.signFg });
      s.position.set(0, bh + 4.6, -lotD - 0.2); f.add(s);
      // totem
      f.add(box(3, 22, 3, ctx.P(L.accent), -bw / 2 + 4, 11, -2));
      const tt = ctx.sign('SHOPPING', 9, 1.8, { bg: L.signBg, fg: L.signFg });
      tt.position.set(-bw / 2 + 4, 23.5, -1.2); f.add(tt);
    },
  },

  // ---------- Condomínio das Flores ----------
  condominio: {
    w: 96, d: 92,
    build(ctx, g) {
      const W = 96, D = 92, f = front(g, D), rand = ctx.rand;
      f.add(geo(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), ctx.P(0x6fbf52, 'flat'), 0, 0.08, -D / 2));
      const cream = ctx.P(0xf1e6cf);
      for (const [w, d, x, z] of [[W, 1, 0, -D], [1, D, -W / 2, -D / 2], [1, D, W / 2, -D / 2], [W / 2 - 7, 1, -W / 4 - 3.5, 0], [W / 2 - 7, 1, W / 4 + 3.5, 0]]) f.add(box(w, 2.6, d, cream, x, 1.3, z));
      for (const x of [-6.5, 6.5]) f.add(box(2.2, 9, 2.2, ctx.P(0xd9c8a4), x, 4.5, 0));
      f.add(box(15.4, 2, 2.4, ctx.P(0xd04a8a), 0, 9.6, 0));
      const s = ctx.sign('CONDOMÍNIO DAS FLORES', 14, 2.3, { bg: '#d04a8a', fg: '#fff3a0' });
      s.position.set(0, 9.6, 1.2); f.add(s);
      f.add(box(4, 3, 3, ctx.P(0xd9c8a4), 9.5, 1.5, -3.5));
      f.add(geo(new THREE.PlaneGeometry(18, 9).rotateX(-Math.PI / 2), ctx.P(0x3fc2ff, 'glow'), 0, 0.25, -46));
      f.add(box(20, 0.3, 11, ctx.P(0xe6ddca), 0, 0.1, -46));
      f.add(box(0.3, 4, 0.3, ctx.P(0xff4d4d), -10, 2, -34)); f.add(box(0.3, 4, 0.3, ctx.P(0xff4d4d), -5, 2, -34));
      f.add(box(5.3, 0.3, 0.3, ctx.P(0xffd23f), -7.5, 4, -34));
      const slide = box(1.2, 0.2, 6, ctx.P(0x2f7bff), -16, 1.6, -34); slide.rotation.x = 0.5; f.add(slide);
      // canteiros de flores
      const fl = [0xff5e9c, 0xffd23f, 0xffffff, 0xb98cff, 0xff7b3b];
      for (let k = 0; k < 60; k++) f.add(sphere(0.45, ctx.P(fl[k % fl.length], 'smooth'), (rand() - 0.5) * (W - 10), 0.3, -4 - rand() * 14, 6, 4));
      // torres residenciais com o topo colorido
      const crowns = [0xd04a8a, 0xffd23f, 0x2f9fd0, 0x7acb4a, 0xd04a8a, 0xffd23f];
      let k = 0;
      for (const zl of [-24, -68]) for (const xl of [-33, -11, 11, 33]) {
        if (zl === -24 && Math.abs(xl) === 11) continue;
        const h = 48 + ((k * 7) % 4) * 6;
        const c = ctx.world(f, xl, 0, zl);
        ctx.addBuilding({ x: c.x, y: ctx.gl, z: c.z, w: 15, h, d: 15, rot: g.rotation.y, type: 'res' });
        f.add(box(15.6, 3, 15.6, ctx.P(crowns[k % crowns.length]), xl, h + 1.5, zl));
        k++;
      }
      for (let n = 0; n < 16; n++) { const c = ctx.world(f, (rand() - 0.5) * (W - 8), 0, -4 - rand() * (D - 8)); ctx.tree(c.x, c.z, 0.7 + rand() * 0.5); }
    },
  },

  // ---------- Banco do Leão (sede de um banco inventado, azul-marinho e dourado) ----------
  bancoLeao: {
    w: 110, d: 80,
    build(ctx, g) {
      const f = front(g, 80), rand = ctx.rand;
      const navy = 0x1d2b6b, gold = 0xf2b01e;
      f.add(geo(new THREE.PlaneGeometry(110, 80).rotateX(-Math.PI / 2), ctx.P(0x5fae48, 'flat'), 0, 0.08, -40));
      // patinha do leão nas placas
      const paw = (c, w, h) => {
        const r = h * 0.16, cx = h * 0.55, cy = h * 0.55;
        c.fillStyle = '#f2b01e';
        c.beginPath(); c.ellipse(cx, cy + r * 0.6, r * 1.3, r, 0, 0, 7); c.fill();
        for (const [dx, dy] of [[-1.3, -1], [-0.45, -1.6], [0.45, -1.6], [1.3, -1]]) { c.beginPath(); c.arc(cx + dx * r, cy + dy * r, r * 0.45, 0, 7); c.fill(); }
      };
      f.add(box(24, 4.5, 2, ctx.P(navy), 0, 2.25, -3));
      const s1 = ctx.sign('   CENTRO DO LEÃO', 22, 3.6, { bg: '#1d2b6b', fg: '#ffd56a', frame: navy, draw: paw });
      s1.position.set(0, 2.4, -1.8); f.add(s1);
      for (const x of [-18, -14, 14, 18]) {
        f.add(cyl(0.12, 0.12, 12, ctx.P(0xdddddd), x, 6, -6, 5));
        f.add(box(3, 1.8, 0.05, ctx.P(x < 0 ? navy : gold), x + 1.6, 11, -6));
      }
      const add = (xl, zl, w, h, d, type) => { const c = ctx.world(f, xl, 0, zl); ctx.addBuilding({ x: c.x, y: ctx.gl, z: c.z, w, h, d, rot: g.rotation.y, type }); return c; };
      add(-26, -36, 44, 16, 26, 'office');
      const s3 = ctx.sign('   BANCO DO LEÃO', 26, 4.6, { bg: '#1d2b6b', fg: '#ffd56a', frame: navy, draw: paw });
      s3.position.set(-26, 12, -22.6); f.add(s3);
      add(28, -60, 36, 13, 22, 'office');
      add(22, -30, 20, 52, 20, 'glass');
      f.add(box(20.6, 5, 20.6, ctx.P(navy), 22, 52 + 2.5, -30));
      f.add(box(20.8, 0.8, 20.8, ctx.P(gold, 'metal'), 22, 55.4, -30));
      const s2 = ctx.sign('   BANCO DO LEÃO', 19, 4, { bg: '#1d2b6b', fg: '#ffd56a', frame: navy, draw: paw });
      s2.position.set(22, 52 + 8.5, -19.6); f.add(s2);
      f.add(box(19, 6.5, 0.4, ctx.P(navy), 22, 60.5, -19.9));
      for (let n = 0; n < 20; n++) { const c = ctx.world(f, (rand() - 0.5) * 100, 0, -14 - rand() * 64); ctx.tree(c.x, c.z, 0.8 + rand() * 0.6); }
    },
  },

  // ---------- Praça dos Pombos (com o pombo gigante de estátua) ----------
  pracaPombos: {
    w: 50, d: 50,
    build(ctx, g) {
      const f = front(g, 50), rand = ctx.rand, gl = ctx.gl;
      f.add(geo(new THREE.CircleGeometry(24, 32).rotateX(-Math.PI / 2), ctx.P(0x62b24a, 'flat'), 0, 0.09, -26));
      f.add(geo(new THREE.RingGeometry(9, 12.5, 32).rotateX(-Math.PI / 2), ctx.P(0xd9cdb0, 'flat'), 0, 0.14, -26));
      f.add(geo(new THREE.CircleGeometry(9, 24).rotateX(-Math.PI / 2), ctx.P(0xd9cdb0, 'flat'), 0, 0.14, -26));
      f.add(cyl(3, 3.6, 3.5, ctx.P(0xbdb6a6), 0, 1.75, -26, 14));
      const pl = ctx.sign('PRAÇA DOS POMBOS', 5.2, 1.0, { bg: '#2c3e50', fg: '#ffffff' });
      pl.position.set(0, 1.9, -22.3); f.add(pl);
      for (const a of [0.6, 2.2, 3.8, 5.4]) {
        const bench = box(4, 0.3, 1.2, ctx.P(0x8a5a2a), Math.cos(a) * 15, 0.9, -26 + Math.sin(a) * 15); bench.rotation.y = -a + Math.PI / 2; f.add(bench);
        const t = ctx.world(f, Math.cos(a + 0.4) * 19, 0, -26 + Math.sin(a + 0.4) * 19);
        ctx.trees.push({ x: t.x, z: t.z, s: 1.1 });
      }
      const c = ctx.world(f, 0, 0, -26);
      const statue = ctx.pigeons(1, 7);
      statue.set(0, c.x, gl + 3.5, c.z, g.rotation.y + Math.PI, {});
      statue.commit();
      const deco = ctx.pigeons(36, 1);
      const walkers = [];
      for (let k = 0; k < 14; k++) walkers.push({ a: rand() * 6.28, r: 5 + rand() * 4, sp: (rand() < 0.5 ? -1 : 1) * (0.05 + rand() * 0.08), ph: rand() * 6 });
      const tc = ctx.track.center;
      const flocks = [{ x: c.x, z: c.z, R: 22, H: 26, n: 10, sp: 0.35 }, { x: tc.x, z: tc.z, R: 60, H: 45, n: 12, sp: 0.22 }];
      ctx.anim((dt, t) => {
        let k = 0;
        for (const w of walkers) {
          w.a += w.sp * dt * (Math.sin(t * 0.7 + w.ph) > 0 ? 1 : 0.2);
          const x = c.x + Math.cos(w.a) * w.r, z = c.z + Math.sin(w.a) * w.r;
          deco.set(k++, x, gl + 0.12, z, Math.atan2(-Math.sin(w.a) * w.sp, Math.cos(w.a) * w.sp), { peck: Math.max(0, Math.sin(t * 5 + w.ph)) ** 6 });
        }
        for (const fl of flocks) for (let n = 0; n < fl.n; n++) {
          const a = t * fl.sp + n * 0.35 + Math.sin(n * 7.1) * 0.2;
          const rr = fl.R + Math.sin(n * 3.3) * 5;
          deco.set(k++, fl.x + Math.cos(a) * rr, gl + fl.H + Math.sin(t * 1.3 + n) * 2 + (n % 3) * 1.5, fl.z + Math.sin(a) * rr, Math.atan2(-Math.sin(a), Math.cos(a)), { fly: true, flap: Math.sin(t * 18 + n * 1.7) * 0.9 });
        }
        deco.commit();
      });
    },
  },

  // ---------- Estação de trem (com trem prateado passando) ----------
  estacao: {
    w: 200, d: 30,
    build(ctx, g) {
      const len = 180, rz = -4;
      g.add(geo(new THREE.PlaneGeometry(len, 7).rotateX(-Math.PI / 2), ctx.P(0x6a625a, 'flat'), 0, 0.1, rz));
      for (const dz of [-0.8, 0.8]) g.add(box(len, 0.25, 0.15, ctx.P(0xb8bcc4, 'metal'), 0, 0.35, rz + dz));
      for (let x = -len / 2; x < len / 2; x += 1.6) g.add(box(0.3, 0.15, 2.6, ctx.P(0x5a4030), x, 0.2, rz));
      for (const x of [-len / 2, len / 2]) {
        g.add(box(14, 9, 12, ctx.P(0x6b665e), x, 4.5, rz));
        g.add(box(14.2, 6, 5.2, ctx.P(0x0a0a0c, 'glow'), x, 3, rz));
        g.add(box(16, 1, 13, ctx.P(0x4f8a3f), x, 9.5, rz));
      }
      g.add(box(64, 1.2, 4.5, ctx.P(0xbdb8ae), 0, 0.6, rz + 3.9));
      g.add(box(64, 0.05, 0.3, ctx.P(0xffd23f, 'flat'), 0, 1.23, rz + 1.9));
      for (let x = -28; x <= 28; x += 8) g.add(cyl(0.2, 0.2, 5, ctx.P(0x888888, 'metal'), x, 3.6, rz + 4.6, 6));
      const roof = box(66, 0.4, 7, ctx.P(0xcc2a2a), 0, 6.2, rz + 3.5); roof.rotation.x = 0.08; g.add(roof);
      const s = ctx.sign('ESTAÇÃO OSASCO', 16, 2.7, { bg: '#cc2a2a', fg: '#ffffff' });
      s.position.set(0, 7.9, rz + 6.4); g.add(s);
      for (let k = 0; k < 6; k++) g.add(person(ctx.mats, -20 + k * 7 + ctx.rand() * 3, rz + 4 + ctx.rand(), SHIRTS[k % 6], SKINS[k % 4]));
      // trem: 4 vagões que entram por um túnel e saem pelo outro
      const cars = [];
      for (let c = 0; c < 4; c++) {
        const car = new THREE.Group();
        car.add(box(20, 3.6, 3.2, ctx.P(0xd2d6dc, 'metal'), 0, 2.6, 0));
        car.add(box(20.05, 0.5, 3.25, ctx.P(0xcc2a2a), 0, 1.6, 0));
        car.add(box(17, 1.0, 3.25, ctx.P(0x223044, 'lit'), 0, 3.3, 0));
        if (c === 0) for (const z of [-1, 1]) car.add(box(0.1, 0.3, 0.5, ctx.P(0xfff4d0, 'glow'), 10.06, 1.8, z));
        car.position.set(0, 0.3, rz);
        g.add(car);
        cars.push(ctx.dynamic(car));
      }
      const dir = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
      const base = g.position.clone();
      const rzw = new THREE.Vector3(0, 0, rz).applyQuaternion(g.quaternion);
      ctx.anim((dt, t) => {
        const cycle = len + 84 + 160;
        const s0 = ((t * 20 + 40) % cycle) - len / 2 - 84;
        cars.forEach((car, c) => {
          const s = s0 - c * 21;
          car.visible = s > -len / 2 + 8 && s < len / 2 - 8;
          car.position.set(base.x + rzw.x + dir.x * s, base.y + 0.3, base.z + rzw.z + dir.z * s);
        });
      });
    },
  },

  // ---------- Arcos rosa da Ponte Metálica (por cima da pista) ----------
  ponteRosa: {
    kind: 'span', w: 52, d: 54, pillar: 4.4,
    build(ctx, g) {
      const e = ctx.e;
      const pink = ctx.P(0xff5ad8, 'neon'), pinkThin = ctx.P(0xff8ae4, 'neon');
      // a parte baixa dos arcos fica fora da mureta; só lá no alto eles se inclinam por cima da pista
      const H = 20, lean = 0.2, baseLat = e + 3.4, span = 25;
      const archPt = (side, u) => {
        const along = lerp(-span, span, u);
        const h = H * (1 - (2 * u - 1) ** 2);
        return new THREE.Vector3(side * (baseLat - h * Math.sin(lean)), 1.4 + 0.6 + h * Math.cos(lean), along);
      };
      for (const side of [-1, 1]) {
        const pts = [];
        for (let k = 0; k <= 30; k++) pts.push(archPt(side, k / 30));
        g.add(geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.95, 8, false), pink));
        for (let k = 2; k <= 28; k += 2) {
          const u = k / 30, top = archPt(side, u);
          if (top.y < 4.5) continue;
          for (const dAl of [-4, 4]) {
            const al = lerp(-span, span, u) + dAl;
            if (Math.abs(al) > span) continue;
            g.add(beam(top, new THREE.Vector3(side * (baseLat - 0.2), 2.3, al), 0.12, pinkThin, 4));
          }
        }
        for (const u of [0, 1]) { const ft = archPt(side, u); g.add(box(3, 3.4, 3, ctx.P(0xa7a39b), ft.x, 1.2, ft.z)); }
      }
      for (let k = 6; k <= 24; k += 3) {
        const a1 = archPt(-1, k / 30), a2 = archPt(1, k / 30), b1 = archPt(-1, (k + 3) / 30), b2 = archPt(1, (k + 3) / 30);
        g.add(beam(a1, a2, 0.32, pink, 5));
        if (k + 3 <= 24) { g.add(beam(a1, b2, 0.2, pinkThin, 4)); g.add(beam(a2, b1, 0.2, pinkThin, 4)); }
      }
      const s = ctx.sign('PONTE METÁLICA', 11, 1.9, { bg: '#1c1c28', fg: '#ff8ae4' });
      s.position.set(-(e + 8.5), 4.6, -span - 6); s.rotation.y = Math.PI; g.add(s);
      g.add(cyl(0.2, 0.2, 3.5, ctx.P(0x555555), -(e + 8.5), 2.2, -span - 5.8, 5));
    },
  },
};

// ---------- Osasco feita à mão: Ponte Metálica com avenida e trânsito embaixo ----------
export function buildOsascoBridge(ctx) {
  const track = ctx.track, def = ctx.def, e = ctx.e, gl = ctx.gl;
  const bi = track.bridgeIdx;
  const b = def.bridge;
  const tx = track.tx[bi], tz = track.tz[bi], rx = track.rx[bi], rz = track.rz[bi];
  const cx = track.px[bi], cz = track.pz[bi];
  const deckAt = along => track.py[track.wrap(bi + Math.round(along / track.spacing))];
  const P = (along, lat, y) => new THREE.Vector3(cx + tx * along + rx * lat, y, cz + tz * along + rz * lat);
  let seed = 7;
  const lcg = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // avenida que passa embaixo da ponte
  const avLen = 220, avW = 22;
  const roadC = document.createElement('canvas'); roadC.width = 256; roadC.height = 256;
  const g2 = roadC.getContext('2d');
  g2.fillStyle = '#3c3d44'; g2.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 900; k++) { g2.fillStyle = lcg() < 0.5 ? '#46474f' : '#33343a'; g2.fillRect(lcg() * 256, lcg() * 256, 2, 2); }
  g2.fillStyle = '#ffd23f'; g2.fillRect(124, 0, 3, 256); g2.fillRect(130, 0, 3, 256);
  g2.fillStyle = '#eeeeee'; for (const x of [64, 192]) g2.fillRect(x - 2, 0, 4, 120);
  g2.fillRect(8, 0, 4, 256); g2.fillRect(244, 0, 4, 256);
  const roadT = new THREE.CanvasTexture(roadC); roadT.colorSpace = THREE.SRGBColorSpace; roadT.wrapT = THREE.RepeatWrapping; roadT.repeat.set(1, avLen / 24); roadT.anisotropy = 4;
  const av = new THREE.Mesh(new THREE.PlaneGeometry(avW, avLen).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: roadT, roughness: 0.85 }));
  av.position.set(cx, gl + 0.12, cz);
  av.rotation.y = Math.atan2(rx, rz);
  av.receiveShadow = true;
  ctx.group.add(av);
  const statics = new THREE.Group();
  for (const s of [-1, 1]) {
    const w = box(4, 0.3, avLen, ctx.P(0xb9b4aa), cx + tx * s * (avW / 2 + 2), gl + 0.15, cz + tz * s * (avW / 2 + 2));
    w.rotation.y = av.rotation.y;
    statics.add(w);
  }
  for (let s = -avLen / 2; s <= avLen / 2; s += 18) ctx.reserve(cx + rx * s, cz + rz * s, 18);
  // trânsito na avenida (faróis acesos)
  const nCars = 12;
  const carCols = [0xd62d2d, 0xf2f2f2, 0x2b2b30, 0x2f6fd6, 0xc9c9cf, 0xf0c419, 0x1e8a5a];
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true, ...o });
  const bodyIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.3), std(0xffffff, { roughness: 0.35, metalness: 0.4, flatShading: false }), nCars);
  const cabIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.8, 2.3), std(0x1d2733, { roughness: 0.2, metalness: 0.5 }), nCars);
  const headIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff4d0 }), nCars);
  const tailIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0xff2020 }), nCars);
  const cars = [];
  for (let k = 0; k < nCars; k++) {
    const dir = k % 2 ? 1 : -1;
    cars.push({ dir, lane: dir * (k % 4 < 2 ? 2.8 : 7.8), s: ctx.rand() * avLen, v: 11 + ctx.rand() * 7 });
    bodyIM.setColorAt(k, new THREE.Color(carCols[k % carCols.length]));
  }
  for (const im of [bodyIM, cabIM, headIM, tailIM]) { im.castShadow = im === bodyIM; im.frustumCulled = false; ctx.group.add(im); }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), loc = new THREE.Matrix4(), w = new THREE.Matrix4();
  const baseYaw = Math.atan2(rx, rz);
  ctx.anim(dt => {
    for (let k = 0; k < nCars; k++) {
      const c = cars[k];
      c.s = (c.s + c.v * dt) % avLen;
      const s = (c.s - avLen / 2) * c.dir;
      q.setFromAxisAngle(UP, baseYaw + (c.dir > 0 ? 0 : Math.PI));
      m.compose(v.set(cx + rx * s + tx * c.lane, gl + 0.75, cz + rz * s + tz * c.lane), q, one);
      bodyIM.setMatrixAt(k, m);
      cabIM.setMatrixAt(k, w.multiplyMatrices(m, loc.makeTranslation(0, 0.85, -0.3)));
      headIM.setMatrixAt(k, w.multiplyMatrices(m, loc.makeTranslation(0, 0.05, 2.16)));
      tailIM.setMatrixAt(k, w.multiplyMatrices(m, loc.makeTranslation(0, 0.1, -2.16)));
    }
    for (const im of [bodyIM, cabIM, headIM, tailIM]) im.instanceMatrix.needsUpdate = true;
  });
  // cabeceiras de concreto
  const conc = ctx.P(0xa7a39b);
  const half = b.span;
  for (const s of [-1, 1]) {
    const y0 = deckAt(s * half);
    const a = box(2 * (e + 10), y0 - gl, 6, conc);
    a.position.copy(P(s * (half + 3), 0, (y0 + gl) / 2 - 0.2));
    a.rotation.y = Math.atan2(tx, tz);
    statics.add(a);
  }
  // parte de baixo do tabuleiro (vista da avenida)
  const deckW = 2 * (e + 9);
  const nSeg = Math.round((2 * half + 6) / track.spacing);
  const pos = [], idx = [];
  for (let k = 0; k <= nSeg; k++) {
    const i = track.wrap(bi - Math.round((half + 3) / track.spacing) + k);
    for (const s of [-1, 1]) pos.push(track.px[i] + track.rx[i] * s * deckW / 2, track.py[i] - 1.35, track.pz[i] + track.rz[i] * s * deckW / 2);
    if (k < nSeg) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const ug = new THREE.BufferGeometry();
  ug.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ug.setIndex(idx); ug.computeVertexNormals();
  ctx.group.add(new THREE.Mesh(ug, new THREE.MeshStandardMaterial({ color: 0x77736d, roughness: 0.9, side: THREE.DoubleSide })));
  // arcos rosa (como a Ponte Metálica iluminada à noite)
  const pink = ctx.P(0xff5ad8, 'glow'), pinkThin = ctx.P(0xff8ae4, 'glow');
  const H = b.archHeight, lean = 0.2, baseLat = e + 1.2, span = half - 1;
  const archPt = (side, u) => {
    const along = lerp(-span, span, u);
    const h = H * (1 - (2 * u - 1) ** 2);
    const y = deckAt(along) + 0.6;
    return P(along, side * (baseLat - h * Math.sin(lean)), y + h * Math.cos(lean));
  };
  for (const side of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= 40; k++) pts.push(archPt(side, k / 40));
    statics.add(geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.95, 10, false), pink));
    for (let k = 2; k <= 38; k += 2) {
      const u = k / 40, top = archPt(side, u);
      if (top.y - deckAt(lerp(-span, span, u)) < 2.5) continue;
      for (const dAl of [-4, 4]) {
        const al = lerp(-span, span, u) + dAl;
        if (Math.abs(al) > span) continue;
        statics.add(beam(top, P(al, side * (baseLat - 0.2), deckAt(al) + 0.9), 0.12, pinkThin, 5));
      }
    }
    for (const u of [0, 1]) { const f = archPt(side, u); const foot = box(3, 2.4, 3, conc); foot.position.copy(f).setY(f.y - 0.6); statics.add(foot); }
  }
  for (let k = 8; k <= 32; k += 3) {
    const a1 = archPt(-1, k / 40), a2 = archPt(1, k / 40), b1 = archPt(-1, (k + 3) / 40), b2 = archPt(1, (k + 3) / 40);
    statics.add(beam(a1, a2, 0.32, pink, 6));
    if (k + 3 <= 32) { statics.add(beam(a1, b2, 0.2, pinkThin, 5)); statics.add(beam(a2, b1, 0.2, pinkThin, 5)); }
  }
  const light = new THREE.PointLight(0xff3ad0, 60, 90, 1.4);
  light.position.copy(P(0, 0, deckAt(0) + H * 0.6));
  ctx.group.add(light);
  const sg = ctx.sign('PONTE METÁLICA', 11, 1.9, { bg: '#1c1c28', fg: '#ff8ae4' });
  sg.position.copy(P(-half - 10, -(e + 3), deckAt(-half - 10) + 3.2));
  sg.rotation.y = Math.atan2(-tx, -tz);
  sg.add(cyl(0.2, 0.2, 3, ctx.P(0x555555), 0, -1.6, -0.2, 5));
  statics.add(sg);
  ctx.bake(statics);
}

// ---------- Osasco feita à mão: linha do trem, Estação Osasco e trem ----------
export function buildOsascoRail(ctx) {
  const R = ctx.def.rail, gl = ctx.gl;
  const len = R.z1 - R.z0, zc = (R.z0 + R.z1) / 2;
  const st = new THREE.Group();
  st.add(geo(new THREE.PlaneGeometry(7, len).rotateX(-Math.PI / 2), ctx.P(0x6a625a, 'flat'), R.x, gl + 0.1, zc));
  for (const dx of [-0.8, 0.8]) st.add(box(0.15, 0.25, len, ctx.P(0xb8bcc4, 'metal'), R.x + dx, gl + 0.35, zc));
  const nSl = Math.floor(len / 1.4);
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.8 }), nSl);
  const m = new THREE.Matrix4();
  for (let k = 0; k < nSl; k++) { m.makeTranslation(R.x, gl + 0.2, R.z0 + k * 1.4); sl.setMatrixAt(k, m); }
  ctx.group.add(sl);
  for (let z = R.z0; z <= R.z1; z += 22) ctx.reserve(R.x, z, 14);
  for (const z of [R.z0, R.z1]) {
    st.add(box(12, 9, 14, ctx.P(0x6b665e), R.x, gl + 4.5, z));
    st.add(box(5.2, 6, 14.2, ctx.P(0x0a0a0c, 'glow'), R.x, gl + 3, z));
  }
  const S = new THREE.Group();
  S.add(box(4.5, 1.2, 64, ctx.P(0xbdb8ae), 3.9, 0.6, 0));
  S.add(box(0.3, 0.05, 64, ctx.P(0xffd23f, 'flat'), 1.9, 1.23, 0));
  for (let z = -28; z <= 28; z += 8) S.add(cyl(0.2, 0.2, 5, ctx.P(0x888888, 'metal'), 4.6, 3.6, z, 6));
  const roof = box(7, 0.4, 66, ctx.P(0xcc2a2a), 3.5, 6.2, 0); roof.rotation.z = -0.08; S.add(roof);
  const s = ctx.sign('ESTAÇÃO OSASCO', 16, 2.7, { bg: '#cc2a2a', fg: '#ffffff' });
  s.position.set(6.3, 7.8, 0); s.rotation.y = Math.PI / 2; S.add(s);
  S.position.set(R.x, gl, R.station);
  st.add(S);
  ctx.reserve(R.x + 4, R.station, 36);
  ctx.bake(st);
  // trem prateado com faixa vermelha
  const cars = [];
  for (let c = 0; c < 4; c++) {
    const car = new THREE.Group();
    car.add(box(3.2, 3.6, 20, ctx.P(0xd2d6dc, 'metal'), 0, 2.6, 0));
    car.add(box(3.25, 0.5, 20.05, ctx.P(0xcc2a2a), 0, 1.6, 0));
    car.add(box(3.25, 1.0, 17, ctx.P(0x223044, 'lit'), 0, 3.3, 0));
    if (c === 0) {
      car.add(box(3.0, 1.6, 0.2, ctx.P(0x335577, 'lit'), 0, 3.4, 10.05));
      for (const x of [-1, 1]) car.add(box(0.5, 0.3, 0.1, ctx.P(0xfff4d0, 'glow'), x, 1.8, 10.06));
    }
    car.position.set(R.x, gl + 0.3, R.z0);
    ctx.group.add(car);
    cars.push(ctx.dynamic(car));
  }
  ctx.anim((dt, t) => {
    const cycle = len + 84 + 200;
    const s0 = (t * 20 + 60) % cycle;
    cars.forEach((car, c) => {
      const z = R.z0 - 10 + s0 - c * 21;
      car.position.z = z;
      car.visible = z > R.z0 - 2 && z < R.z1 + 2;
    });
  });
}
