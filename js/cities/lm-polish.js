// Marcos "de lançamento": Coliseu (Roma), Taj Mahal e Forte Vermelho (Agra), Muralha e Templo do Céu (Pequim),
// Pirâmides e Esfinge (Cairo), Hotel-Vela e Torres (Dubai) e Ópera (Sydney).
// Tudo procedural e juntado em poucas malhas por marco (uma por material).
import * as THREE from 'three';
import { box, cyl, cone, sphere, geo, bar, beam, lathe, onionGeo, archWallGeo as archRaw, frustumGeo } from './common.js';
import { TAU, ell, gridGeo, ellipseBand, outward, inward, quadGeo, lcg, Batch } from './shapes.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// arcos iguais se repetem muito (extrusão é cara): guarda o primeiro e entrega cópias
const ARCH = new Map();
const archWallGeo = (...a) => { const k = a.join('|'); if (!ARCH.has(k)) ARCH.set(k, archRaw(...a)); return ARCH.get(k).clone(); };
const UPN = V(0, 1, 0);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Lona/casca branca fina (vista dos dois lados) com um brilho próprio, para ficar clara mesmo na sombra.
const sailMat = ctx => ctx.mats.sail || (ctx.mats.sail = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.16 + ctx.glow * 0.5 }));
// Telhas da ópera: textura do atlas, dos dois lados, com brilho próprio.
const tileMat = ctx => ctx.mats.tile || (ctx.mats.tile = new THREE.MeshStandardMaterial({ map: ctx.atlas.tex, emissiveMap: ctx.atlas.tex, emissive: 0xffffff, emissiveIntensity: 0.62 + ctx.glow * 0.4, roughness: 0.45, side: THREE.DoubleSide }));

// Adiciona ao marco a malha juntada de um Batch (se tiver peças), pintada com p.
const flush = (g, batch, p) => { const gm = batch.geom(); if (gm) g.add(geo(gm, p)); };

// Árvore em coordenadas locais do marco (vai para as árvores instanciadas da cidade).
const treeAt = (ctx, g, x, z, s, kind) => { const p = ctx.world(g, x, 0, z); ctx.tree(p.x, p.z, s, kind); };


// Pirâmide de faces lisas (cada andar de pedra é uma faixa): a cor de cada face depende de onde está o sol,
// então as faces iluminadas ficam douradas e as da sombra ficam bem mais escuras.
function pyramid(ctx, g, cx, cz, half, h, rot, opts = {}) {
  const sd = ctx.track.sunDir, rY = g.rotation.y;
  const C = opts.courses || Math.max(4, Math.round(h / 8));
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const corner = (sx, sz) => [cx + (sx * cr + sz * sr) * half, 0, cz + (-sx * sr + sz * cr) * half];
  const cs = [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)];
  const apex = [cx, h, cz];
  const lit = new THREE.Color(opts.lit || 0xeaae48), dark = new THREE.Color(opts.dark || 0x9a6a34), capC = new THREE.Color(opts.cap || 0xfbe9b4);
  for (let f = 0; f < 4; f++) {
    const A = cs[f], B = cs[(f + 1) % 4];
    const mx = (A[0] + B[0]) / 2 - cx, mz = (A[2] + B[2]) / 2 - cz, ml = Math.hypot(mx, mz);
    const nl = V(mx / ml, 0.62, mz / ml).normalize();
    const nwx = nl.x * Math.cos(rY) + nl.z * Math.sin(rY), nwz = -nl.x * Math.sin(rY) + nl.z * Math.cos(rY);
    const L = Math.max(0, Math.min(1, nwx * sd.x + nl.y * sd.y + nwz * sd.z));
    const base = dark.clone().lerp(lit, Math.pow(L, 0.55));
    const par = [new Batch(), new Batch(), new Batch()]; // fiadas pares, ímpares e topo claro
    for (let j = 0; j < C; j++) {
      const t0 = j / C, t1 = (j + 1) / C;
      const P = (p, t) => [p[0] + (apex[0] - p[0]) * t, p[1] + (apex[1] - p[1]) * t, p[2] + (apex[2] - p[2]) * t];
      const top = opts.capFrom !== undefined && t0 >= opts.capFrom - 1e-6;
      par[top ? 2 : j % 2].add(quadGeo(P(A, t0), P(B, t0), P(B, t1), P(A, t1), nl));
    }
    flush(g, par[0], { mat: ctx.mats.solid, color: base.clone().multiplyScalar(1.03) });
    flush(g, par[1], { mat: ctx.mats.solid, color: base.clone().multiplyScalar(0.94) });
    flush(g, par[2], { mat: ctx.mats.solid, color: base.clone().lerp(capC, 0.55) });
  }
  // base de pedra
  const plat = box(half * 2 + 6, 1.6, half * 2 + 6, ctx.P(0xc9a05a), cx, 0.8, cz);
  plat.rotation.y = rot;
  g.add(plat);
}


// Pavilhão com cúpula (chhatri) da Índia: quatro pilares, laje e cúpula de cebola.
// As formas são montadas uma vez só e copiadas (são dezenas por cidade).
let CHH = null;
function chhatri(ctx, g, x, y, z, s, col = 0xfbf3e4, dome) {
  if (!CHH) {
    const b = new Batch(), I = new THREE.Quaternion();
    for (const [a, c] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.add(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 6), new THREE.Matrix4().compose(V(a, 1.2, c), I, V(1, 1, 1)));
    b.box(2.9, 0.4, 2.9, 0, 2.6, 0);
    CHH = { pil: b.geom(), dome: onionGeo(1.4, 2.6, 10).translate(0, 2.8, 0), fin: new THREE.ConeGeometry(0.12, 0.9, 4).translate(0, 5.8, 0) };
  }
  const M = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(s, s, s));
  g.add(geo(CHH.pil.clone().applyMatrix4(M), ctx.P(col)));
  g.add(geo(CHH.dome.clone().applyMatrix4(M), ctx.P(dome ?? col, 'smooth')));
  if (s > 1.2) g.add(geo(CHH.fin.clone().applyMatrix4(M), ctx.P(0xe8b830, 'metal')));
}
// Minarete esbelto com sacadas e pavilhão no topo (Taj Mahal, portões).
function minaretTall(ctx, g, x, y, z, h, r, col = 0xfbf3e4) {
  const P = ctx.P(col, 'smooth'), W = ctx.P(col);
  g.add(cyl(r * 2.1, r * 2.3, 2, W, x, y + 1, z, 10));
  g.add(cyl(r * 1.7, r * 2.0, 3, W, x, y + 3.5, z, 10));
  g.add(cyl(r * 0.85, r * 1.15, h, P, x, y + 5 + h / 2, z, 12));
  for (const f of [0.3, 0.6, 0.88]) {
    g.add(cyl(r * 1.75, r * 1.5, 0.7, W, x, y + 5 + h * f, z, 12));
    g.add(cyl(r * 1.6, r * 1.6, 0.2, ctx.P(0xd8c8a8), x, y + 5 + h * f + 0.45, z, 12));
  }
  chhatri(ctx, g, x, y + 5 + h, z, r * 0.95, col);
}

export const LANDMARKS_C = {
  // ======================= ROMA: COLISEU =======================
  coliseu: {
    w: 216, d: 178, dense: true, fit: [1, 0.85, 0.7], offs: [6, 14, 26, 40], heroAlong: 175,
    build(ctx, g) {
      const a = 97, b = 79, T = 16, H = T * 4, N = 112, TH = 6.5;
      // arcadas (4 andares) desenhadas num pedaço do atlas e coladas na parede
      const rect = ctx.atlas.region(2048, 256, (c, w, h) => {
        const rnd = lcg(11);
        c.fillStyle = '#dcb97e'; c.fillRect(0, 0, w, h);
        for (let k = 0; k < 900; k++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,236,190,0.16)' : 'rgba(120,80,40,0.14)'; c.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 22, 2 + rnd() * 3); }
        const P = 32, row = h / 4;
        for (let r = 0; r < 4; r++) {
          const y0 = r * row;
          for (let k = 0; k < w / P; k++) {
            const x = k * P;
            if (r === 0) { // andar de cima (ático): parede lisa com janelinhas
              c.fillStyle = '#4a3624'; c.fillRect(x + 12, y0 + 22, 8, 14);
              c.fillStyle = '#f0dcae'; c.fillRect(x + 12, y0 + 20, 8, 2);
            } else {
              const cx = x + P / 2, top = y0 + 24, bot = y0 + row - 5;
              c.fillStyle = '#f2e0b4'; // moldura do arco
              c.beginPath(); c.moveTo(x + 5, bot); c.lineTo(x + 5, top); c.arc(cx, top, 11, Math.PI, 0); c.lineTo(x + P - 5, bot); c.fill();
              c.fillStyle = '#3a2818';
              c.beginPath(); c.moveTo(x + 7, bot); c.lineTo(x + 7, top); c.arc(cx, top, 9, Math.PI, 0); c.lineTo(x + P - 7, bot); c.fill();
              c.fillStyle = '#6a4c30'; // fundo mais claro (profundidade)
              c.beginPath(); c.moveTo(x + 11, bot); c.lineTo(x + 11, top + 2); c.arc(cx, top + 2, 5, Math.PI, 0); c.lineTo(x + P - 11, bot); c.fill();
              c.fillStyle = 'rgba(255,240,200,0.55)'; c.fillRect(x - 1, y0 + 12, 3, row - 16); // meia-coluna
              c.fillStyle = 'rgba(80,50,20,0.28)'; c.fillRect(x + 2, y0 + 12, 2, row - 16);
            }
          }
          c.fillStyle = '#f4e4b8'; c.fillRect(0, y0, w, 4); // cornija
          c.fillStyle = 'rgba(70,40,15,0.45)'; c.fillRect(0, y0 + 4, w, 5);
        }
      });
      const mat = ctx.atlas.mat;
      const uvf = (th, y) => [rect.u0 + (th / TAU) * (rect.u1 - rect.u0), rect.v0 + (y / H) * (rect.v1 - rect.v0)];
      const th = k => (k / N) * TAU;
      // altura da parede externa em cada coluna: inteira, com um trecho desmoronado na frente-direita
      const deg = k => (k / N) * 360;
      const rnd = lcg(5);
      const hts = [];
      for (let k = 0; k < N; k++) {
        const d = deg(k);
        let h = H;
        if (d > 12 && d < 112) {
          const f = (d - 12) / 100;
          const dip = Math.sin(Math.PI * Math.pow(f, 0.8));
          h = H - (H - 1.5 * T) * Math.min(1, dip * 1.3);
          h = Math.round((h + (rnd() - 0.5) * 8) / (T / 2)) * (T / 2);
        }
        hts.push(Math.max(1.5 * T, Math.min(H, h)));
      }
      const ledgeP = ctx.P(0xf0dcaa), capP = ctx.P(0xe8cf98), inP = ctx.P(0xc9a468), seatA = ctx.P(0xb88e52), seatB = ctx.P(0xdcbe84);
      // corridas de colunas com a mesma altura
      let k0 = 0;
      const wantUp = () => UPN;
      while (k0 < N) {
        let k1 = k0; while (k1 + 1 < N && hts[k1 + 1] === hts[k0]) k1++;
        const h = hts[k0], t0 = th(k0), t1 = th(k1 + 1), n = k1 - k0 + 1;
        g.add(geo(ellipseBand([[a, b, 0], [a, b, h]], t0, t1, n, outward, uvf), { mat, color: new THREE.Color(1, 1, 1) }));
        g.add(geo(ellipseBand([[a - TH, b - TH * 0.8, 0], [a - TH, b - TH * 0.8, h]], t0, t1, n, inward, uvf), { mat, color: new THREE.Color(1, 1, 1) }));
        g.add(geo(ellipseBand([[a, b, h], [a - TH, b - TH * 0.8, h]], t0, t1, n, wantUp), capP));
        // cornijas salientes no topo de cada andar que existe nesta coluna
        for (let tier = 1; tier <= 3; tier++) {
          const y = tier * T;
          if (y < h - 0.5) {
            g.add(geo(ellipseBand([[a + 1.4, b + 1.2, y], [a, b, y]], t0, t1, n, wantUp), ledgeP));
            g.add(geo(ellipseBand([[a + 1.4, b + 1.2, y - 1.1], [a + 1.4, b + 1.2, y]], t0, t1, n, outward), ledgeP));
          }
        }
        // degrau de ruína entre colunas vizinhas de alturas diferentes
        if (k1 + 1 < N) {
          const hn = hts[k1 + 1], t = th(k1 + 1);
          if (hn !== h) {
            const lo = Math.min(h, hn), hi = Math.max(h, hn);
            const A = ell(a, b, lo, t), B = ell(a, b, hi, t), C = ell(a - TH, b - TH * 0.8, hi, t), D = ell(a - TH, b - TH * 0.8, lo, t);
            const tang = V(Math.cos(t) * a, 0, -Math.sin(t) * b).normalize().multiplyScalar(hn < h ? 1 : -1);
            g.add(geo(quadGeo(A, B, C, D, tang), inP));
          }
        }
        k0 = k1 + 1;
      }
      // trecho do começo (th = 0) encontra o fim (th = TAU): se alturas diferem, fecha a quina
      if (hts[0] !== hts[N - 1]) {
        const lo = Math.min(hts[0], hts[N - 1]), hi = Math.max(hts[0], hts[N - 1]);
        const A = ell(a, b, lo, 0), B = ell(a, b, hi, 0), C = ell(a - TH, b - TH * 0.8, hi, 0), D = ell(a - TH, b - TH * 0.8, lo, 0);
        g.add(geo(quadGeo(A, B, C, D, V(-1, 0, 0).multiplyScalar(hts[0] < hts[N - 1] ? -1 : 1)), inP));
      }
      // anel interno (visto pelo buraco da ruína) e arquibancada em degraus até a arena
      const ia = a - 19, ib = b - 15, IH = 3 * T;
      g.add(geo(ellipseBand([[ia, ib, 0], [ia, ib, IH]], 0, TAU, N, outward, uvf), { mat, color: new THREE.Color(0.86, 0.8, 0.72) }));
      g.add(geo(ellipseBand([[ia, ib, IH], [ia - 3, ib - 2.5, IH]], 0, TAU, N, wantUp), capP));
      const steps = 7, aa = 52, ab = 34;
      for (let s = 0; s < steps; s++) {
        const f0 = s / steps, f1 = (s + 1) / steps;
        const ra = ia - 3 - (ia - 3 - aa) * f0, rb = ib - 2.5 - (ib - 2.5 - ab) * f0, y = IH - (IH - 5) * f0;
        const ra1 = ia - 3 - (ia - 3 - aa) * f1, rb1 = ib - 2.5 - (ib - 2.5 - ab) * f1, y1 = IH - (IH - 5) * f1;
        g.add(geo(ellipseBand([[ra, rb, y], [ra, rb, y1]], 0, TAU, 64, inward), s % 2 ? seatA : inP));
        g.add(geo(ellipseBand([[ra, rb, y1], [ra1, rb1, y1]], 0, TAU, 64, wantUp), seatB));
      }
      // arena de areia com o subsolo (hipogeu) aparecendo
      g.add(geo(ellipseBand([[0.01, 0.01, 5.05], [aa, ab, 5.05]], 0, TAU, 40, wantUp), ctx.P(0xe3c27e, 'flat')));
      for (let x = -34; x <= 34; x += 8.5) g.add(box(0.8, 0.25, 22 * Math.sqrt(Math.max(0.05, 1 - (x / 44) ** 2)), ctx.P(0xa98450), x, 5.2, 0));
      g.add(box(86, 0.25, 0.8, ctx.P(0xa98450), 0, 5.2, 0));
      // praça em volta, de pedra clara, com degraus na frente
      g.add(geo(ellipseBand([[0.01, 0.01, 0.12], [a + 14, b + 12, 0.12]], 0, TAU, 48, wantUp), ctx.P(0xcdbd9c, 'flat')));
      g.add(geo(ellipseBand([[a + 14, b + 12, 0.12], [a + 14, b + 12, 0.9]], 0, TAU, 48, outward), ctx.P(0xd8c8a6)));
      // pinheiros em volta (menos na frente, para não tapar as arcadas)
      for (let k = 0; k < 14; k++) {
        const t = (k / 14) * TAU + 0.2;
        if (Math.abs(Math.sin(t / 2)) < 0.28) continue;
        const [x, , z] = ell(a + 9, b + 8, 0, t);
        treeAt(ctx, g, x, z, 1.15, 'pine');
      }
    },
  },

  // ======================= CAIRO: PIRÂMIDES E ESFINGE =======================
  piramides: {
    kind: 'far', w: 340, d: 230, scale: 1.2, dense: true, fit: [1, 0.85, 0.7],
    build(ctx, g) {
      g.add(geo(ellipseBand([[0.01, 0.01, 0.12], [168, 114, 0.12]], 0, TAU, 40, () => V(0, 1, 0)), ctx.P(0xe9c47c, 'flat')));
      pyramid(ctx, g, -86, -30, 80, 100, 0.03, { capFrom: 0.8 });
      pyramid(ctx, g, 70, -22, 68, 84, -0.02, { capFrom: 0.78 });
      pyramid(ctx, g, 124, 76, 31, 38, 0.04, { courses: 5 });
      for (let k = 0; k < 3; k++) pyramid(ctx, g, -104 + k * 36, 58, 13, 16, 0, { courses: 3 });
      // dunas baixinhas e um oásis na frente
      const dune = ctx.P(0xdcb468);
      for (const [x, z, r, sy] of [[-140, 70, 26, 0.16], [30, 70, 34, 0.14], [-10, -96, 40, 0.15], [150, -70, 30, 0.16], [-30, 96, 22, 0.15]]) {
        const d = geo(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), dune, x, 0, z); d.scale.set(r, r * sy * 2.2, r * 0.7); g.add(d);
      }
      for (const [x, z] of [[-40, 90], [-30, 98], [-52, 96], [-36, 104]]) treeAt(ctx, g, x, z, 1.3, 'palm');
    },
  },
  esfinge: {
    w: 92, d: 52, scale: 1.1,
    build(ctx, g) {
      const stone = ctx.P(0xd9a863), light = ctx.P(0xe6b975), dark = ctx.P(0xb98544), gold = ctx.P(0xefc060), blue = ctx.P(0x3f6fae), floor = ctx.P(0xe4c180, 'flat');
      g.add(geo(ellipseBand([[0.01, 0.01, 0.1], [44, 24, 0.1]], 0, TAU, 28, () => V(0, 1, 0)), floor));
      // plataforma e muretas do recinto
      g.add(box(82, 2.4, 36, dark, 0, 1.2, 0));
      g.add(box(86, 5, 3, ctx.P(0xcfa062), 0, 2.5, -22));
      // corpo de leão deitado: peito, lombo, anca e cauda
      const body = geo(new THREE.CapsuleGeometry(8.2, 30, 5, 12).rotateZ(Math.PI / 2), stone, -10, 10.4, 0); body.scale.set(1, 1, 1.02); g.add(body);
      const haunch = geo(new THREE.SphereGeometry(10, 12, 8), stone, -30, 9.6, 0); haunch.scale.set(1.15, 0.95, 1.05); g.add(haunch);
      for (const s of [-1, 1]) {
        g.add(geo(new THREE.SphereGeometry(5.6, 8, 6), dark, -31, 5.6, s * 7.6));
        // patas dianteiras estendidas para a frente
        g.add(box(24, 4.6, 5, stone, 18, 2.4 + 2.3, s * 6.3));
        g.add(geo(new THREE.CapsuleGeometry(2.7, 4, 3, 8).rotateZ(Math.PI / 2), light, 31.5, 4.8, s * 6.3));
        for (const d of [-1.4, 0, 1.4]) g.add(box(1.4, 1.4, 0.6, dark, 35.2, 4.4, s * 6.3 + d * 1.5));
      }
      // cauda enrolada ao lado
      for (let k = 0; k < 7; k++) g.add(box(2.4, 1.8, 2.4, dark, -40 + k * 1.1, 2.4 + k * 0.1, 9.6 - k * 0.35 + Math.sin(k) * 0.4));
      // peito e pescoço subindo até a cabeça
      g.add(cyl(5.6, 8.6, 14, stone, 14, 16.5, 0, 9));
      g.add(cyl(4.6, 5.8, 9, light, 17.5, 26.5, 0, 9));
      // cabeça: rosto redondo, nariz, olhos, barba e lenço (nemes) listrado
      const hx = 19.5, hy = 32.5;
      const face = geo(new THREE.SphereGeometry(1, 12, 9), light, hx + 1.2, hy, 0); face.scale.set(3.9, 5.2, 4.2); g.add(face);
      g.add(box(2.2, 2.6, 2, light, hx + 5.2, hy - 1.2, 0)); // nariz
      g.add(box(1.6, 3.4, 1.8, ctx.P(0xd29a58), hx + 4.2, hy + 0.6, 0)); // ponte do nariz
      for (const s of [-1, 1]) {
        g.add(box(0.6, 1.2, 1.6, ctx.P(0x4a2e16), hx + 4.7, hy + 0.8, s * 2.1));
        g.add(box(0.7, 0.5, 2.2, ctx.P(0x4a2e16), hx + 4.7, hy + 2.1, s * 2.1));
      }
      g.add(box(0.6, 0.9, 3.2, ctx.P(0xb67a3e), hx + 4.6, hy - 3.6, 0)); // boca
      g.add(box(1.2, 3.8, 2.2, ctx.P(0xc6914e), hx + 4, hy - 6.4, 0)); // barba
      // lenço: calota em discos alternados + abas laterais abertas em leque
      const nem = new THREE.Group(); nem.position.set(hx - 0.8, 0, 0); g.add(nem);
      for (let k = 0; k < 5; k++) nem.add(cyl(6.8 - k * 0.9, 7.2 - k * 0.9, 1.1, k % 2 ? blue : gold, 0, hy + 3.4 + k * 1.05, 0, 10));
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
        const lap = box(8.4 - k * 0.5, 2.2, 2.2 + k * 0.45, k % 2 ? blue : gold, -0.6, hy + 1.2 - k * 2.5, s * (6.2 + k * 0.55));
        lap.rotation.x = s * 0.1; nem.add(lap);
      }
      nem.add(box(5.4, 12, 12.6, gold, -5.6, hy - 2.4, 0));
      nem.add(geo(new THREE.ConeGeometry(0.7, 2.6, 4), ctx.P(0xd23a2a), 6.2, hy + 7.6, 0)); // uraeus
    },
  },

  // ======================= AGRA: TAJ MAHAL =======================
  tajMahal: {
    w: 124, d: 124, scale: 1.25, heroAlong: 215, dense: true, fit: [1, 0.85, 0.7],
    build(ctx, g) {
      const marble = 0xfffaf0, warm = 0xfaf0dc, recess = 0xd9c9b0;
      const mS = ctx.P(marble, 'smooth'), mW = ctx.P(warm), red = ctx.P(0xd87040), redD = ctx.P(0xb85a30), sand = 0xe6d8bc;
      // jardim em quatro quadrantes, com o espelho d'água (brilhante) apontando para a pista
      g.add(geo(new THREE.PlaneGeometry(124, 124).rotateX(-Math.PI / 2), ctx.P(0x66b84c, 'flat'), 0, 0.08, 0));
      g.add(geo(new THREE.PlaneGeometry(12, 60).rotateX(-Math.PI / 2), ctx.P(sand, 'flat'), 0, 0.25, 26));
      g.add(geo(new THREE.PlaneGeometry(100, 7).rotateX(-Math.PI / 2), ctx.P(sand, 'flat'), 0, 0.25, 24));
      // espelho d'água: bacia de mármore com água azul-turquesa brilhante
      g.add(box(11, 0.9, 58, ctx.P(0xf6ead2), 0, 0.45, 26));
      g.add(box(8.4, 0.3, 55.4, ctx.P(0x4fd0ff, 'glow'), 0, 0.95, 26));
      for (let z = 0; z <= 52; z += 6) g.add(sphere(0.6, ctx.P(0xffffff, 'glow'), 0, 1.5, z, 5, 4));
      // reflexo da cúpula e do arco na água (silhueta clara achatada)
      const sh = new THREE.Shape();
      sh.moveTo(-3.6, 0); sh.lineTo(-3.6, 5);
      for (let k = 0; k <= 10; k++) { const t = k / 10; sh.lineTo(-3.4 * Math.sin(t * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) * (1 + 0.14 * Math.sin(t * Math.PI)), 5 + t * 15); }
      sh.lineTo(0, 21.5);
      for (let k = 10; k >= 0; k--) { const t = k / 10; sh.lineTo(3.4 * Math.sin(t * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) * (1 + 0.14 * Math.sin(t * Math.PI)), 5 + t * 15); }
      sh.lineTo(3.6, 5); sh.lineTo(3.6, 0); sh.lineTo(-3.6, 0);
      const refl = geo(new THREE.ShapeGeometry(sh), ctx.P(0xe6f7ff, 'glow'), 0, 1.15, -0.5);
      refl.rotation.x = -Math.PI / 2; refl.scale.set(1, -1.7, 1); g.add(refl);
      // canteiros de flores e sebes em cada quadrante
      const flowers = [0xff5fa8, 0xffd23f, 0xff8a2a, 0xb06bff, 0xff4a4a];
      const hedge = new Batch(), fb = flowers.map(() => new Batch());
      let fk = 0;
      for (const sx of [-1, 1]) for (const sz of [0, 1]) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const x = sx * (15 + i * 9), z = 10 + sz * 24 + j * 8;
        hedge.box(6, 0.7, 4.4, x, 0.45, z);
        fb[fk++ % 5].box(4.6, 0.8, 3.2, x, 0.6, z);
      }
      flush(g, hedge, ctx.P(0x2f8a3a)); fb.forEach((b2, k) => flush(g, b2, ctx.P(flowers[k])));
      // ciprestes em fileiras simétricas ao longo do espelho d'água e dos caminhos
      for (let z = 4; z <= 52; z += 5.6) for (const s of [-1, 1]) treeAt(ctx, g, s * 9.6, z, 1.25, 'cypress');
      for (let z = 8; z <= 50; z += 14) for (const s of [-1, 1]) treeAt(ctx, g, s * 30, z, 1.1, 'cypress');
      for (const s of [-1, 1]) for (let x = 22; x <= 54; x += 10) treeAt(ctx, g, s * x, 60 - 8, 1.0);
      // muro de arenito vermelho em volta, com pavilhões nos cantos
      const merl = new Batch();
      for (const s of [-1, 1]) {
        g.add(box(2, 6, 118, red, s * 61, 3, 0));
        g.add(box(2.6, 0.8, 118, ctx.P(0xf0e2c8), s * 61, 6.3, 0));
        for (let z = -54; z <= 54; z += 5) merl.box(2.2, 1.4, 2.4, s * 61, 7.3, z);
        for (let z = -50; z <= 50; z += 10) g.add(geo(archWallGeo(5, 4.6, 0.5, 1.5, 2.2, true), ctx.P(0x7a3418), s * 59.9, 0.6, z).rotateY(Math.PI / 2));
      }
      flush(g, merl, redD);
      g.add(box(124, 6, 2, red, 0, 3, -61));
      g.add(box(124, 0.8, 2.6, ctx.P(0xf0e2c8), 0, 6.3, -61));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) chhatri(ctx, g, sx * 59, 6, sz * 59, 2.2, 0xf6e9d2);
      // portão baixo na frente (dois pilares de arenito com cúpulas), deixando o Taj à vista
      for (const s of [-1, 1]) {
        g.add(box(8, 10, 5, red, s * 18, 5, 59));
        g.add(box(8.6, 0.8, 5.6, ctx.P(0xf0e2c8), s * 18, 10.4, 59));
        g.add(geo(archWallGeo(7, 7, 0.5, 1.6, 3, true), ctx.P(0xf0e2c8), s * 18, 2.2, 61.8));
        chhatri(ctx, g, s * 18, 10.8, 59, 1.8, 0xfbf3e4);
      }
      for (const s of [-1, 1]) g.add(box(46, 3.2, 2, red, s * 38.5 - (s > 0 ? 0 : 0), 1.6, 60));
      // plataforma de mármore com terraço de arenito embaixo
      const Z = -32;
      g.add(box(78, 4, 62, ctx.P(0xd8a07a), 0, 2, Z));
      g.add(box(70, 6, 54, ctx.P(0xfbf1de), 0, 7, Z));
      g.add(box(71, 0.8, 55, mW, 0, 10.4, Z));
      for (let k = 0; k < 7; k++) g.add(box(16, 0.7 + k * 0.5, 1.2, ctx.P(0xf3e6cc), 0, (0.7 + k * 0.5) / 2 + 3.9, Z + 32 + 7 - k * 1.2));
      // mausoléu octogonal com iwans (arcos grandes) nas quatro faces
      const M = new THREE.Group(); M.position.set(0, 10.8, Z); g.add(M);
      const R = 22;
      M.add(geo(new THREE.CylinderGeometry(R, R, 28, 8).rotateY(Math.PI / 8), ctx.P(warm), 0, 14, 0));
      for (let f = 0; f < 8; f++) {
        const a = f * Math.PI / 4, ap = R * Math.cos(Math.PI / 8);
        if (f % 2 === 0) {
          const arch = geo(archWallGeo(17, 27, 2.6, 5.4, 11, true), ctx.P(marble), Math.sin(a) * (ap + 0.6), 0, Math.cos(a) * (ap + 0.6)); arch.rotation.y = a; M.add(arch);
          const inset = box(10.6, 13.6, 0.4, ctx.P(recess), Math.sin(a) * (ap + 0.1), 8.6, Math.cos(a) * (ap + 0.1)); inset.rotation.y = a; M.add(inset);
          const win = geo(archWallGeo(5.6, 8, 0.3, 1.8, 4.2, true), ctx.P(0x6a7a8a, 'lit'), Math.sin(a) * (ap + 0.4), 14.4, Math.cos(a) * (ap + 0.4)); win.rotation.y = a; M.add(win);
          for (const side of [-1, 1]) {
            const ox = Math.cos(a) * side * 6.6, oz = -Math.sin(a) * side * 6.6;
            const nb = box(2.6, 3.4, 0.3, ctx.P(recess), Math.sin(a) * (ap + 0.9) + ox, 22, Math.cos(a) * (ap + 0.9) + oz); nb.rotation.y = a; M.add(nb);
          }
        } else {
          const niche = box(8.4, 10, 0.3, ctx.P(recess), Math.sin(a) * (ap + 0.15), 8, Math.cos(a) * (ap + 0.15)); niche.rotation.y = a; M.add(niche);
          const niche2 = box(8.4, 8, 0.3, ctx.P(recess), Math.sin(a) * (ap + 0.15), 19.5, Math.cos(a) * (ap + 0.15)); niche2.rotation.y = a; M.add(niche2);
        }
      }
      M.add(box(R * 1.9, 1.2, R * 1.9, ctx.P(0xf3e6cc), 0, 28.4, 0)); // cornija
      M.add(cyl(11.2, 11.8, 9, mS, 0, 33.2, 0, 20));
      M.add(geo(onionGeo(17.5, 31, 22), mS, 0, 37.2, 0));
      M.add(cyl(0.9, 1.3, 5, ctx.P(0xe8b830, 'metal'), 0, 70, 0, 8));
      M.add(sphere(1.1, ctx.P(0xe8b830, 'metal'), 0, 72.6, 0, 8, 6));
      M.add(geo(new THREE.TorusGeometry(1.5, 0.28, 5, 12, Math.PI * 1.5).rotateZ(-Math.PI * 0.75), ctx.P(0xe8b830, 'metal'), 0, 75.2, 0));
      M.add(cone(0.22, 5, ctx.P(0xe8b830, 'metal'), 0, 78.2, 0, 4));
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) chhatri(ctx, M, x * 15, 28.8, z * 15, 2.4, marble);
      // minaretes nos quatro cantos da plataforma
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) minaretTall(ctx, g, x * 31, 10.4, Z + z * 25, 40, 1.9, marble);
      // mesquita e casa de hóspedes de arenito, com três cúpulas brancas cada
      for (const s of [-1, 1]) {
        const bx = s * 51;
        g.add(box(18, 15, 40, red, bx, 7.5, Z));
        g.add(box(18.8, 1, 40.8, ctx.P(0xf0e2c8), bx, 15.4, Z));
        g.add(box(0.5, 10, 36, ctx.P(0xf6efe0), bx - s * 9.1, 7.5, Z));
        for (let k = 0; k < 3; k++) {
          const z = Z - 12 + k * 12;
          g.add(cyl(4.4, 4.8, 3.4, mW, bx, 17.2, z, 14));
          g.add(geo(onionGeo(5, 8.4, 14), mS, bx, 18.9, z));
          g.add(cone(0.2, 2.2, ctx.P(0xe8b830, 'metal'), bx, 28, z, 4));
          g.add(geo(archWallGeo(7, 11, 0.5, 2.4, 6, true), ctx.P(0xf6efe0), bx - s * 9.3, 0, z).rotateY(-s * Math.PI / 2));
          g.add(geo(archWallGeo(4.6, 8.6, 0.4, 1.6, 5.4, true), ctx.P(0x5a2810), bx - s * 9.5, 0.5, z).rotateY(-s * Math.PI / 2));
        }
      }
    },
  },

  // ======================= AGRA: FORTE E PORTÃO VERMELHOS =======================
  forteVermelho: {
    w: 134, d: 50, scale: 1.45, dense: true, fit: [1, 0.85, 0.7],
    build(ctx, g) {
      const red = ctx.P(0xdb7544), redD = ctx.P(0xb85a30), redL = ctx.P(0xe88a58), white = ctx.P(0xfaf1e0), whiteS = ctx.P(0xfaf1e0, 'smooth'), dark = ctx.P(0x4a2010), gold = ctx.P(0xe8b830, 'metal');
      // gramado e fosso azul na frente das muralhas, com a ponte de pedra no portão
      g.add(geo(new THREE.PlaneGeometry(134, 50).rotateX(-Math.PI / 2), ctx.P(0x8fc070, 'flat'), 0, 0.08, 0));
      g.add(box(134, 0.9, 11, ctx.P(0xd9c9a6), 0, 0.45, 16));
      g.add(box(130, 0.4, 7.6, ctx.P(0x3aa6c8, 'glow'), 0, 0.95, 16));
      g.add(box(18, 1.4, 12, ctx.P(0xe6d6b4), 0, 0.9, 16));
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) g.add(box(0.8, 1.6, 0.8, ctx.P(0xf0e2c8), s * (9 + 0), 1.8, 11.5 + k * 4.5));
      // muralha de arenito: base inclinada, parede, cornija de mármore, ameias e nichos em arco
      g.add(geo(frustumGeo(104, 12, 5, 0.9), red, 0, 2.5, -6));
      g.add(box(100, 14, 8, red, 0, 12, -6));
      g.add(box(101, 1, 9, white, 0, 19.4, -6));
      for (let x = -48; x <= 48; x += 3) { g.add(box(1.5, 1.8, 1.4, redD, x, 21, -2.4)); g.add(box(1.5, 1.8, 1.4, redD, x, 21, -9.6)); }
      for (let x = -42; x <= 42; x += 7) { if (Math.abs(x) < 12) continue; g.add(geo(archWallGeo(4.4, 9, 0.5, 1.7, 5, true), ctx.P(0x6a2c14), x, 6, -1.8)); g.add(box(4.8, 0.5, 0.6, white, x, 15.6, -1.7)); }
      // torres de canto e do meio (octogonais, com pavilhões de mármore)
      for (const [x, r, h, cs] of [[-52, 8, 26, 1.9], [52, 8, 26, 1.9], [-30, 5.4, 22, 1.4], [30, 5.4, 22, 1.4]]) {
        g.add(cyl(r * 0.92, r, h, red, x, h / 2, -6, 8));
        g.add(cyl(r * 1.06, r * 1.06, 1, white, x, h - 3.4, -6, 8));
        g.add(cyl(r * 1.1, r * 1.1, 1.2, redD, x, h + 0.2, -6, 8));
        for (const a of [-0.6, 0, 0.6]) g.add(box(0.8, 3.4, 0.5, dark, x + Math.sin(a) * r * 0.99, h * 0.55, -6 + Math.cos(a) * r * 0.99));
        chhatri(ctx, g, x, h + 0.8, -6, cs, 0xfaf1e0);
      }
      // portão principal: arco ogival, torres gêmeas, friso branco e pavilhões no topo
      g.add(geo(archWallGeo(26, 26, 12, 5, 11, true), red, 0, 0, -2));
      g.add(box(9.6, 12, 0.4, dark, 0, 6, -7.8));
      for (const fz of [4.1, -8.1]) {
        g.add(box(27, 1, 0.7, white, 0, 23.4, fz));
        g.add(box(0.9, 18, 0.7, white, -5.8, 9, fz)); g.add(box(0.9, 18, 0.7, white, 5.8, 9, fz));
        g.add(box(11.6, 0.9, 0.7, white, 0, 17.6, fz));
      }
      for (const s of [-1, 1]) {
        g.add(cyl(5.6, 6.4, 32, red, s * 17, 16, -2, 8));
        g.add(cyl(6.1, 6.1, 1, white, s * 17, 29, -2, 8));
        chhatri(ctx, g, s * 17, 32.4, -2, 1.9, 0xfaf1e0);
      }
      for (let k = -2; k <= 2; k++) chhatri(ctx, g, k * 3.6, 26, -2, 0.9, 0xfaf1e0);
      g.add(box(26, 1.2, 12.6, white, 0, 26, -2));
      // palácio interno: bloco vermelho mais alto, com cúpulas de mármore branco aparecendo atrás
      g.add(box(78, 24, 14, red, 0, 12, -19));
      g.add(box(79, 1, 15, white, 0, 24.5, -19));
      g.add(box(66, 6.4, 9, white, 0, 28.2, -19));
      for (let x = -30; x <= 30; x += 6) g.add(geo(archWallGeo(3.6, 5.2, 0.4, 1.2, 3.4, true), ctx.P(0x7a8a9a, 'lit'), x, 25.4, -14.4));
      for (const x of [-22, 0, 22]) {
        g.add(cyl(5.6, 6, 3, white, x, 33, -19, 14));
        g.add(geo(onionGeo(6.2, 10.5, 14), whiteS, x, 34.6, -19));
        g.add(cone(0.2, 3, gold, x, 47, -19, 4));
      }
      // mastro com bandeirola laranja na torre mais alta
      g.add(cyl(0.18, 0.18, 9, ctx.P(0xdddddd), 17, 38, -2, 4));
      const pen = box(3.4, 1.8, 0.12, ctx.P(0xff8a1a, 'smooth'), 18.7, 41.6, -2); g.add(pen);
    },
  },
  portaoVermelho: {
    kind: 'span', w: 76, d: 16, pillar: 12,
    build(ctx, g) {
      const e = ctx.e, a = e + 1.6, W = 2 * a + 26, H = 46, D = 16;
      const red = ctx.P(0xdb7544), redD = ctx.P(0xb85a30), white = ctx.P(0xfaf1e0), whiteS = ctx.P(0xfaf1e0, 'smooth'), gold = ctx.P(0xe8b830, 'metal');
      g.add(geo(archWallGeo(W, H, D, a, 18, true), red));
      for (const fz of [-1, 1]) {
        const z = fz * (D / 2 + 0.35);
        g.add(box(W - 6, 1.4, 0.7, white, 0, H - 6, z));
        g.add(box(W - 6, 0.8, 0.7, white, 0, H - 9.4, z));
        for (const s of [-1, 1]) {
          g.add(box(1, H - 8, 0.7, white, s * (a + 1.4), (H - 8) / 2, z));
          g.add(box(3.2, 8, 0.6, ctx.P(0x7a3418), s * (a + 6.4), 22, z));
          g.add(box(3.8, 0.8, 0.7, white, s * (a + 6.4), 26.4, z));
          g.add(box(3.8, 0.8, 0.7, white, s * (a + 6.4), 17.6, z));
        }
      }
      g.add(box(W + 1, 1.6, D + 1, white, 0, H + 0.8, 0));
      const n = 13;
      for (let k = 0; k < n; k++) chhatri(ctx, g, -W / 2 + 4 + k * (W - 8) / (n - 1), H + 1.6, 0, k === 6 ? 1.7 : 1.05, 0xfaf1e0);
      g.add(cyl(5.2, 5.6, 3, white, 0, H + 3.4, -3.4, 12));
      g.add(geo(onionGeo(6, 10, 14), whiteS, 0, H + 4.6, -3.4));
      g.add(cone(0.22, 3, gold, 0, H + 17.2, -3.4, 4));
      for (const s of [-1, 1]) {
        const x = s * (W / 2 + 1.5);
        g.add(cyl(1.5, 1.8, H + 4, red, x, (H + 4) / 2, 0, 10));
        for (const f of [0.4, 0.7]) g.add(cyl(2.3, 2.1, 0.8, white, x, (H + 4) * f, 0, 10));
        chhatri(ctx, g, x, H + 4, 0, 1.3, 0xfaf1e0);
      }
      // guirlandas de cravos laranja penduradas sobre a pista (bem no alto)
      for (let fz = -1; fz <= 1; fz += 2) for (let r = 0; r < 2; r++) {
        for (let k = 0; k <= 22; k++) {
          const u = k / 22, x = -a + 2 * a * u, y = 33 - r * 5 - 5 * Math.sin(u * Math.PI);
          g.add(sphere(0.55, ctx.P(k % 2 ? 0xff8a1a : 0xffc21a, 'smooth'), x, y, fz * 7.9, 5, 4));
        }
      }
    },
  },

  // ======================= PEQUIM: MURALHA =======================
  muralha: {
    kind: 'far', w: 320, d: 112, scale: 1.9, dense: true, fit: [1, 0.85, 0.7], offs: [40, 70, 105, 145, 190],
    build(ctx, g) {
      const X0 = -148, X1 = 148;
      const H = x => 26 + 15 * Math.sin((x + 30) / 44) + 9 * Math.sin(x / 19 + 1) + 12 * smooth(-150, 150, x);
      const Zc = x => 9 * Math.sin(x / 52);
      const hillW = x => 26 + 5 * Math.sin(x / 31);
      const taper = x => 1 - smooth(120, 152, Math.abs(x)) * 0.92;
      const hillY = (x, z) => { const u = (z - Zc(x)) / hillW(x); return Math.max(-3, (H(x) * Math.exp(-1.15 * u * u) * taper(x)) + 2.2 * Math.sin(x / 6.3 + z / 4.1) * Math.exp(-0.6 * u * u) - 2.5); };
      // morros de grama (facetados) e outro maior ao fundo, mais azulado, para dar profundidade
      g.add(geo(gridGeo(74, 18, (u, v) => { const x = X0 - 12 + (X1 - X0 + 24) * u, z = -52 + 104 * v; return [x, hillY(x, z), z]; }, () => V(0, 1, 0)), ctx.P(0x558f40)));
      for (const [x, z, rx, ry, rz, c] of [[-96, -62, 70, 62, 38, 0x6a9a74], [70, -66, 90, 78, 40, 0x6a9a74], [-10, -76, 70, 44, 30, 0x7aa684]]) {
        const h = geo(new THREE.IcosahedronGeometry(1, 1), ctx.P(c), x, 0, z); h.scale.set(rx, ry, rz); g.add(h);
      }
      // árvores de outono (laranja e verde) e pinheiros nas encostas (peças juntadas por cor)
      const rnd = lcg(77);
      const trunks = new Batch(), pines = new Batch(), crowns = {}, rocks = new Batch();
      const T4 = (x, y, z, sy = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(1, sy, 1));
      for (let k = 0; k < 70; k++) {
        const x = X0 + rnd() * (X1 - X0), side = rnd() < 0.5 ? -1 : 1, z = Zc(x) + side * (hillW(x) * (0.4 + rnd() * 0.6));
        const y = hillY(x, z);
        if (y < 5) continue;
        const r = 2.2 + rnd() * 1.6;
        trunks.add(new THREE.CylinderGeometry(0.35, 0.5, r * 1.2, 5), T4(x, y + r * 0.5, z));
        if (k % 3 === 2) { pines.add(new THREE.ConeGeometry(r * 0.9, r * 3, 6), T4(x, y + r * 2.1, z)); continue; }
        const col = [0xd8692a, 0xe89a30, 0x4a8a3a, 0xc4502a, 0xb8c040][k % 5];
        (crowns[col] = crowns[col] || new Batch()).add(new THREE.IcosahedronGeometry(r, 0), T4(x, y + r * 1.5, z, 0.85));
      }
      for (let k = 0; k < 26; k++) {
        const x = X0 + 6 + rnd() * (X1 - X0 - 12), side = rnd() < 0.5 ? -1 : 1, z = Zc(x) + side * (5.2 + rnd() * 5);
        const r = 1.6 + rnd() * 2;
        rocks.add(new THREE.IcosahedronGeometry(r, 0), T4(x, hillY(x, z) + r * 0.2, z, 0.7));
      }
      flush(g, trunks, ctx.P(0x6a4a2e)); flush(g, pines, ctx.P(0x2f6f38)); flush(g, rocks, ctx.P(0xb9ad98));
      for (const [c, bt] of Object.entries(crowns)) flush(g, bt, ctx.P(+c));
      // a muralha: fita contínua seguindo o topo do morro (seções de 3 m)
      const step = 3, K = Math.round((X1 - X0) / step);
      const prof = [[5.6, -8], [4.9, 1.5], [4.1, 10], [-4.1, 10], [-4.9, 1.5], [-5.6, -8]];
      const secs = [];
      for (let k = 0; k <= K; k++) {
        const x = X0 + k * step, y = H(x) * taper(x) - 0.0, z = Zc(x);
        secs.push(prof.map(([pz, py]) => [x, y + py, z + pz]));
      }
      const band = (a, b, col, want) => g.add(geo(gridGeo(K, 1, (u, v) => secs[Math.round(u * K)][v ? b : a], () => want), ctx.P(col)));
      band(0, 1, 0xa08a6c, V(0, -0.2, 1));
      band(1, 2, 0xc8b18c, V(0, 0.2, 1));
      band(2, 3, 0xf0e4c8, V(0, 1, 0));
      band(3, 4, 0xc8b18c, V(0, 0.2, -1));
      band(4, 5, 0xa08a6c, V(0, -0.2, -1));
      // ameias na frente e parapeito baixo atrás (peças juntadas)
      const q = new THREE.Quaternion(), tan = V();
      const sect = k => { const x = X0 + k * step; return V(x, H(x) * taper(x), Zc(x)); };
      const mer = new Batch(), caps = new Batch(), backs = new Batch();
      for (let k = 0; k < K; k++) {
        const a = sect(k), b = sect(k + 1);
        tan.subVectors(b, a); const len = tan.length(); tan.normalize();
        q.setFromUnitVectors(V(1, 0, 0), tan);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mer.box(1.9, 2.5, 1.1, mid.x, mid.y + 10 + 1.25, mid.z + 3.55, 0, q);
        caps.box(2.1, 0.5, 1.3, mid.x, mid.y + 10 + 2.7, mid.z + 3.55, 0, q);
        backs.box(len + 0.1, 1.3, 0.9, mid.x, mid.y + 10 + 0.65, mid.z - 3.7, 0, q);
      }
      flush(g, mer, ctx.P(0xd2c4a8)); flush(g, caps, ctx.P(0xf2e8d0)); flush(g, backs, ctx.P(0xd6c8ae));
      // torres de vigia (grandes, de dois andares, com janelas, ameias e casinha de telhado)
      const towers = [-142, -100, -58, -16, 26, 68, 110, 142];
      const tBody = new Batch(), tBase = new Batch(), tBand = new Batch(), tWin = new Batch(), tCren = new Batch(), tHut = new Batch(), tRoof = new Batch();
      for (const tx of towers) {
        const y = H(tx) * taper(tx), z = Zc(tx), yaw = -Math.atan((Zc(tx + 1) - Zc(tx - 1)) / 2);
        const R = (lx, ly, lz) => { const c = Math.cos(yaw), sn = Math.sin(yaw); return [tx + lx * c + lz * sn, y + ly, z - lx * sn + lz * c]; };
        const bx = (bt, w, h, d, lx, ly, lz) => bt.box(w, h, d, ...R(lx, ly, lz), yaw);
        bx(tBody, 13, 32, 11.6, 0, 4, 0);
        bx(tBase, 13.8, 4, 12.4, 0, -10, 0);
        bx(tBand, 13.8, 1.2, 12.4, 0, 8.2, 0);
        bx(tBand, 14.4, 1.4, 13, 0, 20.4, 0);
        for (const fz of [-1, 1]) for (const wx of [-3.6, 0, 3.6]) {
          bx(tWin, 2.2, 4, 0.5, wx, 11.6, fz * 5.9);
          bx(tWin, 2.2, 3.4, 0.5, wx, 2.8, fz * 5.9);
        }
        for (const fx of [-1, 1]) bx(tWin, 0.5, 5.6, 5.2, fx * 6.5, 11.6, 0);
        for (let mx = -6; mx <= 6.1; mx += 2.4) for (const mz of [-5.6, 5.6]) bx(tCren, 1.4, 1.9, 1.1, mx, 22.2, mz);
        for (let mz = -3.2; mz <= 3.3; mz += 2.4) for (const mx of [-6.4, 6.4]) bx(tCren, 1.1, 1.9, 1.4, mx, 22.2, mz);
        bx(tHut, 6.4, 3.4, 5, 0, 22.7, 0);
        bx(tWin, 2.4, 2.6, 0.3, 0, 22.4, 2.55);
        const rf = geo(frustumGeo(9.2, 7.6, 4.6, 0.55), ctx.P(0x7a4636), 0, 24.2, 0); rf.position.set(...R(0, 24.2, 0)); rf.rotation.y = yaw; g.add(rf);
      }
      flush(g, tBody, ctx.P(0xc4b496)); flush(g, tBase, ctx.P(0xa08a6c)); flush(g, tBand, ctx.P(0xeee4cc));
      flush(g, tWin, ctx.P(0x33261c)); flush(g, tCren, ctx.P(0xd6c8ac)); flush(g, tHut, ctx.P(0xd6c9b0));
    },
  },

  // ======================= PEQUIM: TEMPLO DO CÉU =======================
  temploCeu: {
    w: 70, d: 70, scale: 1.4, dense: true, fit: [1, 0.85, 0.7],
    build(ctx, g) {
      const marble = ctx.P(0xf4f0e6), marbleD = ctx.P(0xd9d3c4), red = ctx.P(0xc42a2a), redD = ctx.P(0x9a1c1c), gold = ctx.P(0xf0c030, 'metal'), green = ctx.P(0x2a8a5a), floor = ctx.P(0xcfc3a6, 'flat');
      g.add(geo(new THREE.PlaneGeometry(70, 70).rotateX(-Math.PI / 2), ctx.P(0x78b060, 'flat'), 0, 0.08, 0));
      g.add(geo(new THREE.PlaneGeometry(10, 22).rotateX(-Math.PI / 2), floor, 0, 0.14, 24));
      // três terraços redondos de mármore com balaústres e escada na frente
      const tiers = [[28, 3], [23, 3], [18, 3]];
      let y = 0;
      tiers.forEach(([r, h], k) => {
        g.add(cyl(r, r + 0.8, h, marble, 0, y + h / 2, 0, 36));
        g.add(cyl(r + 0.9, r + 0.9, 0.7, marbleD, 0, y + h + 0.35, 0, 36));
        const n = 40 - k * 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          if (Math.abs(Math.sin(a / 2)) < 0.16) continue; // vão da escada (frente = ângulo 0 → +z)
          g.add(box(0.7, 1.6, 0.7, marble, Math.sin(a) * (r - 0.4), y + h + 1.1, Math.cos(a) * (r - 0.4)));
        }
        g.add(geo(new THREE.TorusGeometry(r - 0.4, 0.22, 4, 36).rotateX(Math.PI / 2), marble, 0, y + h + 1.95, 0));
        y += h;
      });
      for (let k = 0; k < 3; k++) { // escadarias com rampa imperial de pedra no meio
        const r = tiers[k][0], y0 = tiers.slice(0, k).reduce((a, t) => a + t[1], 0);
        for (let st = 0; st < 6; st++) g.add(box(9, 0.5 * (st + 1), 1.05, marble, 0, y0 + 0.25 * (st + 1), r + 1.3 + (5 - st) * 1.0));
        const ramp = box(2.8, 0.3, 6.6, marbleD, 0, y0 + 1.6, r + 4.2); ramp.rotation.x = 0.46; g.add(ramp);
      }
      // salão da oração: três andares de telhado redondo azul (faixas de telha) sobre paredes vermelhas
      const base = y;
      g.add(cyl(14, 14, 1, marble, 0, base + 0.5, 0, 28));
      const roofGeo = (R, h, ph0, ph1) => {
        const pts = [[R * 1.0, 0], [R * 1.04, 0.5], [R * 0.9, 1.6], [R * 0.72, 3.0], [R * 0.52, 4.8], [R * 0.3, 6.8], [R * 0.12, h - 0.4], [0.01, h]].map(([r, yy]) => new THREE.Vector2(Math.max(0.01, r), yy * (h / 8)));
        return new THREE.LatheGeometry(pts, 2, ph0, ph1 - ph0);
      };
      let yy = base + 1;
      [[12.6, 8.6, 16.6, 11], [9.6, 6.8, 13.2, 9.4], [7, 6.2, 9.6, 8.6]].forEach(([wr, wh, rr, rh], k) => {
        g.add(cyl(wr, wr, wh, red, 0, yy + wh / 2, 0, 24));
        for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.add(cyl(0.55, 0.55, wh, redD, Math.sin(a) * (wr + 0.5), yy + wh / 2, Math.cos(a) * (wr + 0.5), 6)); }
        g.add(cyl(wr + 0.9, wr + 0.9, 1.1, green, 0, yy + wh - 0.5, 0, 24));
        g.add(cyl(wr + 1.1, wr + 1.1, 0.5, gold, 0, yy + wh - 1.25, 0, 24));
        if (k === 0) for (let i = 0; i < 3; i++) g.add(box(2.6, 5, 0.3, ctx.P(0x4a1810), (i - 1) * 3.4, yy + 3, wr + 0.1)).children;
        const W = 14;
        for (let i = 0; i < W; i++) {
          const wedge = geo(roofGeo(rr, rh, (i / W) * Math.PI * 2, ((i + 1) / W) * Math.PI * 2), ctx.P(i % 2 ? 0x3a70e0 : 0x1c44a8, 'smooth'), 0, yy + wh, 0);
          g.add(wedge);
        }
        g.add(cyl(rr * 1.04, rr * 1.04, 0.5, gold, 0, yy + wh + 0.3, 0, 28));
        yy += wh + rh * 0.62;
      });
      g.add(cyl(0.5, 0.9, 4, gold, 0, yy + 1.4, 0, 8));
      g.add(sphere(1.8, gold, 0, yy + 4.2, 0, 10, 8));
      g.add(cone(0.35, 3.6, gold, 0, yy + 7.2, 0, 6));
      // muro vermelho com telhado verde em volta, portão na frente, pinheiros e lanternas
      const wallP = ctx.P(0xc42a2a);
      for (const s of [-1, 1]) {
        g.add(box(2, 5, 68, wallP, s * 34, 2.5, 0));
        g.add(box(3, 1, 68, ctx.P(0x2a8a5a), s * 34, 5.5, 0));
        g.add(box(68, 5, 2, wallP, 0, 2.5, s * 34 - (s > 0 ? 0 : 0)));
        g.add(box(68, 1, 3, ctx.P(0x2a8a5a), 0, 5.5, s * 34));
      }
      for (const s of [-1, 1]) {
        g.add(box(7, 9, 5, wallP, s * 9, 4.5, 34));
        g.add(geo(frustumGeo(10, 8, 2.4, 0.5), ctx.P(0x2a8a5a), s * 9, 10.2, 34));
      }
      g.add(box(26, 1.6, 4, wallP, 0, 9.6, 34));
      g.add(geo(frustumGeo(26, 8, 2.6, 0.5), ctx.P(0x2a8a5a), 0, 11.6, 34));
      for (const [x, z] of [[-26, 26], [26, 26], [-26, -26], [26, -26], [-30, 0], [30, 0], [0, -30]]) treeAt(ctx, g, x, z, 1.3, 'pine');
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 + 0.3;
        g.add(cyl(0.12, 0.12, 5, ctx.P(0x3a2a20), Math.sin(a) * 31, 2.5, Math.cos(a) * 31 - 0, 5));
        g.add(sphere(0.9, ctx.P(0xff2a1a, 'neon'), Math.sin(a) * 31, 5.4, Math.cos(a) * 31, 8, 6));
      }
    },
  },

  // ======================= DUBAI: HOTEL-VELA =======================
  hotelVela: {
    kind: 'far', water: 'shore', w: 100, d: 112, scale: 1.3, dense: true, fit: [1, 0.85, 0.7], offs: [10, 25, 45, 70, 100, 140],
    build(ctx, g) {
      const OZ = -14, H = 112, XM = -28, WB = 76;
      const sailM = sailMat(ctx);
      const steel = ctx.P(0xe6ebf2, 'metal'), steelD = ctx.P(0xb8c2d0, 'metal'), gold = ctx.P(0xe8b84a, 'metal');
      // ilha artificial redonda e passarela (píer) até a terra, com postes de luz
      const isl = (r0, r1, h, c, y) => { const m = geo(new THREE.CylinderGeometry(r0, r1, h, 32), c, 12, y, OZ); m.scale.x = 1.55; g.add(m); };
      isl(33, 36, 4, ctx.P(0xe6dac0), 0);
      isl(33.2, 33.2, 0.5, ctx.P(0x4fb8d8), 2.1);
      const deck = geo(new THREE.CircleGeometry(31, 32).rotateX(-Math.PI / 2), ctx.P(0xefe6d0, 'flat'), 12, 2.3, OZ); deck.scale.x = 1.55; g.add(deck);
      g.add(box(8, 1.6, 40, ctx.P(0xd8ccb0), 0, 0.8, OZ + 50));
      g.add(box(6, 0.4, 40, ctx.P(0x4a4a54), 0, 1.7, OZ + 50));
      for (let k = 0; k < 6; k++) for (const s of [-1, 1]) {
        g.add(cyl(0.15, 0.15, 3.4, steel, s * 3.4, 3.4, OZ + 34 + k * 7, 5));
        g.add(sphere(0.55, ctx.P(0xffe6a0, 'neon'), s * 3.4, 5.3, OZ + 34 + k * 7, 5, 4));
      }
      // núcleo em forma de triângulo (vidro com faixas douradas), atrás da vela
      const core = geo(new THREE.CylinderGeometry(4, 16, H * 0.92, 3, 1), ctx.P(0xa9cbe0, 'glass'), XM + 12, 4 + H * 0.46, OZ - 4);
      core.rotation.y = Math.PI; g.add(core);
      for (let y = 10; y < H * 0.9; y += 9) { const r = 16 - (12 * (y - 4)) / (H * 0.92); const ring = geo(new THREE.CylinderGeometry(r + 0.5, r + 0.5, 0.9, 3, 1), gold, XM + 12, y, OZ - 4); ring.rotation.y = Math.PI; g.add(ring); }
      g.add(box(WB * 0.8, 9, 30, ctx.P(0xf4f6fa), XM + WB * 0.4 + 2, 8.5, OZ + 2));
      g.add(box(WB * 0.8 + 1, 1, 31, gold, XM + WB * 0.4 + 2, 13.2, OZ + 2));
      // a vela: lona branca curva esticada entre o mastro e a borda inclinada (faixas alternadas)
      const xe = t => XM + WB * Math.pow(1 - t, 1.12);
      const P = (u, t) => {
        const x = XM + (xe(t) - XM) * u;
        const belly = 19 * Math.sin(Math.PI * u) * (1 - 0.5 * t);
        return [x, 4 + t * H, OZ + 6 - 9 * t + belly];
      };
      const NB = 14;
      for (let i = 0; i < NB; i++) {
        const t0 = (i / NB) * 0.985, t1 = ((i + 1) / NB) * 0.985;
        g.add(geo(gridGeo(8, 1, (u, v) => P(u, v ? t1 : t0), () => V(0, 0.15, 1)), { mat: sailM, color: new THREE.Color(i % 2 ? 0xdde9f6 : 0xffffff) }));
      }
      // estrutura de aço triangular: mastro duplo, base e borda curva, mais nervuras
      g.add(bar(V(XM, 4, OZ + 4), V(XM, 4 + H + 8, OZ - 5), 2.6, steel));
      g.add(bar(V(XM, 4, OZ - 6), V(XM, 4 + H + 8, OZ - 5), 2.2, steelD));
      g.add(bar(V(XM, 4, OZ + 6), V(XM + WB, 4, OZ + 6), 1.6, steel));
      for (let i = 0; i < 24; i++) { const a = P(1, (i / 24) * 0.985), b = P(1, ((i + 1) / 24) * 0.985); g.add(bar(V(...a), V(...b), 1.3, steel)); }
      for (let i = 2; i < NB; i += 2) {
        const t = (i / NB) * 0.985; let prev = P(0, t);
        for (let k = 1; k <= 6; k++) { const cur = P(k / 6, t); g.add(bar(V(...prev), V(...cur), 0.38, steelD)); prev = cur; }
      }
      // heliponto saindo da lateral e antena/agulha no topo do mastro
      g.add(bar(V(XM + 8, 4 + H * 0.8, OZ - 6), V(XM + 30, 4 + H * 0.8, OZ - 18), 1.4, steel));
      g.add(cyl(8, 8, 0.8, ctx.P(0xf2f2f2), XM + 32, 4 + H * 0.8 + 0.2, OZ - 19, 20));
      g.add(cyl(5.6, 5.6, 0.9, ctx.P(0x3fa84a, 'neon'), XM + 32, 4 + H * 0.8 + 0.3, OZ - 19, 18));
      for (const s of [-1, 1]) g.add(box(0.8, 0.2, 4.4, ctx.P(0xffffff), XM + 32 + s * 1.3, 4 + H * 0.8 + 0.85, OZ - 19));
      g.add(box(2.6, 0.2, 0.8, ctx.P(0xffffff), XM + 32, 4 + H * 0.8 + 0.85, OZ - 19));
      g.add(cone(1.3, 24, steel, XM, 4 + H + 18, OZ - 5, 6));
      g.add(sphere(0.9, ctx.P(0xff3030, 'neon'), XM, 4 + H + 31, OZ - 5, 6, 4));
      // pequenas palmeiras na entrada da ilha
      for (const [x, z] of [[-8, OZ + 24], [8, OZ + 24], [-14, OZ + 18], [14, OZ + 18]]) treeAt(ctx, g, x, z, 1.1, 'palm');
    },
  },
  // ======================= DUBAI: AGULHA + ARRANHA-CÉUS =======================
  agulha: {
    w: 124, d: 84, dense: true, fit: [1, 0.85, 0.7],
    build(ctx, g) {
      const glass = ctx.P(0xb8d0e6, 'glass'), steel = ctx.P(0xd8dee6, 'metal'), gold = ctx.P(0xe8b84a, 'metal');
      g.add(geo(new THREE.PlaneGeometry(124, 84).rotateX(-Math.PI / 2), ctx.P(0xe2d6b8, 'flat'), 0, 0.08, 0));
      // praça com espelho d'água e mosaico em forma de palmeira (folhas douradas)
      g.add(geo(new THREE.CircleGeometry(24, 28).rotateX(-Math.PI / 2), ctx.P(0x3fa8d8, 'glow'), 0, 0.3, -6));
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2;
        const leaf = box(1.8, 0.25, 12, ctx.P(i % 2 ? 0xe8b84a : 0x2a9ac0), 0, 0.5, 0);
        leaf.geometry.translate(0, 0, 7.5); leaf.rotation.y = a; leaf.position.set(0, 0.5, 22); g.add(leaf);
      }
      g.add(cyl(2.2, 2.2, 0.5, ctx.P(0xe8b84a), 0, 0.5, 22, 12));
      // torre-agulha (como antes, um pouco mais alta e larga na base)
      const T = new THREE.Group(); T.position.set(0, 0, -6); T.scale.setScalar(1.08); g.add(T);
      let h = 0;
      const tiers = [[34, 40], [30, 30], [26, 26], [22, 22], [18, 20], [14, 18], [11, 16], [8, 14], [6, 12]];
      tiers.forEach(([s, th], k) => {
        for (let l = 0; l < 3; l++) {
          const a = (l * Math.PI * 2) / 3;
          const lobe = box(s * 0.42, th, s * 0.62, l === k % 3 ? steel : glass, Math.sin(a) * s * 0.22, h + th / 2, Math.cos(a) * s * 0.22);
          lobe.rotation.y = a; T.add(lobe);
        }
        T.add(cyl(s * 0.2, s * 0.2, th, glass, 0, h + th / 2, 0, 8));
        T.add(cyl(s * 0.3 + 1.2, s * 0.3 + 1.2, 0.8, gold, 0, h + 0.4, 0, 12));
        h += th;
      });
      T.add(cyl(1.6, 3.4, 30, steel, 0, h + 15, 0, 8));
      T.add(cone(1.2, 26, steel, 0, h + 43, 0, 6));
      T.add(sphere(0.8, ctx.P(0xff3030, 'neon'), 0, h + 57, 0, 6, 4));
      for (let y = 6; y < h; y += 10) T.add(cyl(tiers[0][0] * 0.21 * (1 - y / (h * 1.2)) + 0.3, 0, 0.4, ctx.P(0xbfe6ff, 'neon'), 0, y, 0, 8));
      // arranha-céus de vidro com detalhes dourados
      const glassB = ctx.P(0x7fa8c8, 'glass'), glassC = ctx.P(0x8fb6d2, 'glass');
      const slab = (x, z, w, d, hh, rot = 0) => {
        const S = new THREE.Group(); S.position.set(x, 0, z); S.rotation.y = rot; g.add(S);
        S.add(box(w, hh, d, glassB, 0, hh / 2, 0));
        for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) S.add(box(0.9, hh + 0.5, 0.9, gold, cx * w / 2, hh / 2, cz * d / 2));
        for (let y = 12; y < hh - 4; y += 11) S.add(box(w + 0.7, 0.8, d + 0.7, gold, 0, y, 0));
        S.add(box(w + 1.2, 1.4, d + 1.2, steel, 0, hh + 0.7, 0));
        return S;
      };
      // 1) torre com coroa de folhas de palmeira douradas
      const A = slab(-42, -8, 13, 13, 92);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const leaf = cone(1.1, 13, gold, Math.sin(a) * 3.4, 98, Math.cos(a) * 3.4, 4); leaf.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7); A.add(leaf); }
      A.add(cone(0.5, 12, steel, 0, 104, 0, 5));
      // 2) torre mais baixa, com topo inclinado e cantos dourados
      const B = slab(42, -12, 15, 12, 74);
      const cut = geo(new THREE.CylinderGeometry(6.8, 10, 14, 4, 1).rotateY(Math.PI / 4), glassC, 0, 82, 0); cut.scale.set(1, 1, 0.8); B.add(cut);
      B.add(box(0.8, 30, 0.8, gold, 7, 66, 4));
      // 3) torre em espiral (andares girando)
      const C = new THREE.Group(); C.position.set(-24, 0, 20); g.add(C);
      for (let k = 0; k < 10; k++) { const sz = 10.5 - k * 0.45; const f = box(sz, 6.4, sz, k % 2 ? glassC : glassB, 0, 3.2 + k * 6.4, 0); f.rotation.y = k * 0.13; C.add(f); C.add(box(sz + 0.4, 0.5, sz + 0.4, gold, 0, 6.2 + k * 6.4, 0).rotateY(k * 0.13)); }
      C.add(cone(0.4, 10, steel, 0, 74, 0, 5));
      // 4) torre média com domo dourado
      const D = slab(26, 22, 11, 11, 50);
      D.add(geo(new THREE.SphereGeometry(5.6, 12, 8, 0, TAU, 0, Math.PI / 2), gold, 0, 51.4, 0));
      D.add(cone(0.4, 7, steel, 0, 60, 0, 5));
    },
  },

  // ======================= SYDNEY: ÓPERA =======================
  opera: {
    kind: 'near', water: 'shore', w: 176, d: 116, scale: 1.15, heroAlong: 175, dense: true, fit: [1, 0.85, 0.7], offs: [6, 16, 30, 48, 70, 95],
    build(ctx, g) {
      const rect = ctx.atlas.region(512, 256, (c, w, h) => { // telhas brancas em losangos, com faixas
        c.fillStyle = '#fbf8ee'; c.fillRect(0, 0, w, h);
        for (let r = 0; r < h / 16; r++) { c.fillStyle = r % 2 ? 'rgba(210,202,182,0.35)' : 'rgba(255,255,255,0.5)'; c.fillRect(0, r * 16, w, 16); }
        c.strokeStyle = 'rgba(150,140,118,0.55)'; c.lineWidth = 1.2;
        for (let x = -h; x < w + h; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h, h); c.stroke(); c.beginPath(); c.moveTo(x + h, 0); c.lineTo(x, h); c.stroke(); }
        c.strokeStyle = 'rgba(120,110,90,0.6)'; c.lineWidth = 2;
        for (let k = 0; k <= 4; k++) { c.beginPath(); c.moveTo(0, k * h / 4); c.lineTo(w, k * h / 4); c.stroke(); }
      });
      const gran = ctx.P(0xd8c9a6), granD = ctx.P(0xbfae88), granL = ctx.P(0xeadcb8);
      // pódio de granito com escadaria larga na frente e praça de pedra
      g.add(box(150, 8, 70, gran, 0, 4, -6));
      g.add(box(154, 1.2, 74, granL, 0, 8.4, -6));
      for (let st = 0; st < 10; st++) g.add(box(64, 0.9 * (st + 1), 1.8, granL, 6, 0.45 * (st + 1), 32 + 12 - st * 1.8));
      g.add(geo(new THREE.PlaneGeometry(166, 30).rotateX(-Math.PI / 2), ctx.P(0xd6cbb0, 'flat'), 0, 0.1, 40));
      for (let k = 0; k < 8; k++) g.add(box(0.5, 0.2, 28, granD, -70 + k * 20, 0.2, 40));
      // cada vela: casca esférica em losango (lado de fora com telhas, de dentro creme) + vidro fechando o lado aberto
      const uvA = ((u, v) => [rect.u0 + u * (rect.u1 - rect.u0), rect.v0 + v * (rect.v1 - rect.v0)]);
      const PHI = 62 * Math.PI / 180, AL = 30 * Math.PI / 180;
      const shell = (cx, cz, h, dir, y0 = 8.8) => {
        const R = h / Math.sin(PHI);
        const alpha = ph => AL * Math.pow(Math.max(0, 1 - Math.pow(ph / PHI, 1.9)), 0.62);
        const pt = (u, v) => { // u: -1..1 através, v: 0..1 em altura
          const ph = v * PHI, th = u * alpha(ph);
          return [cx + dir * (R * Math.cos(ph) * Math.cos(th) - R * 0.55) + dir * v * v * R * 0.16, y0 + R * Math.sin(ph), cz + R * Math.cos(ph) * Math.sin(th) * 1.15];
        };
        const outW = c => V(c.x - cx, 0.3, c.z - cz).multiplyScalar(dir > 0 ? 1 : 1).setX((c.x - cx) * dir * 1 + 0.001);
        const want = c => V((c.x - (cx - dir * R * 0.55)) , 0.5 * (c.y - y0), (c.z - cz) * 0.4);
        const og = gridGeo(10, 9, (a, b) => pt(a * 2 - 1, b), want, (a, b) => uvA(a, b));
        g.add(geo(og, { mat: tileMat(ctx), color: new THREE.Color(1, 1, 1) }));
        const ig = gridGeo(10, 9, (a, b) => { const p = pt(a * 2 - 1, b * 0.995); return [p[0] - dir * 0.5, p[1] - 0.2, p[2]]; }, c => V(-(c.x - (cx - dir * R * 0.55)), -0.5 * (c.y - y0), -(c.z - cz) * 0.4));
        g.add(geo(ig, { mat: sailMat(ctx), color: new THREE.Color(0xf4ecd8) }));
        // vidro no lado aberto: parede inclinada seguindo a corda da casca (por trás dela)
        const x0 = pt(0, 0)[0], x1 = pt(0, 1)[0];
        const gg = gridGeo(10, 9, (a, b) => { const p = pt(a * 2 - 1, b); return [x0 + (x1 - x0) * b - dir * 0.2, p[1], p[2]]; }, () => V(-dir, 0, 0));
        g.add(geo(gg, { mat: sailMat(ctx), color: new THREE.Color(0xbfdcea) }));
      };
      // sala de concertos (esquerda): velas viradas para a direita em escada; velas opostas atrás
      [[-72, -8, 58], [-57, -8, 46], [-42, -8, 35], [-28, -8, 25]].forEach(([x, z, h]) => shell(x, z, h, 1));
      [[-10, -8, 22], [-2, -8, 32], [6, -8, 43]].forEach(([x, z, h]) => shell(x, z, h, -1));
      // teatro de ópera (direita)
      [[16, -8, 44], [30, -8, 35], [44, -8, 26]].forEach(([x, z, h]) => shell(x, z, h, 1));
      [[58, -8, 19], [64, -8, 28]].forEach(([x, z, h]) => shell(x, z, h, -1));
      // restaurante: velinha na frente, à direita
      shell(48, 24, 15, 1);
      g.add(box(30, 3, 16, ctx.P(0xcfe6f2, 'smooth'), 48, 10.4, 24));
    },
  },
};
