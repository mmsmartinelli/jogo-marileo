// Gerador de pistas infinitas: cria uma fase completa (traçado, tema, obstáculos,
// desafios e música) a partir de um número (semente). A mesma semente gera sempre
// a mesma pista em qualquer aparelho — por isso aqui só se usa o sorteio com semente
// (nunca Math.random) e o arquivo não depende do three.js.
//
// Ids das pistas geradas: 'gen-<semente>'. O nível (1..10) vem do último dígito da
// semente, então o id sozinho já define tudo (importante para o modo online).
import { TRACKS } from './tracks.js'; // usado só dentro das funções (import circular seguro)
import { rng } from './utils.js';

export const GEN_PREFIX = 'gen-';
export const MAX_LEVEL = 10;

// ---------- Regras de segurança do traçado ----------
export const RULES = {
  minLen: 1100, maxLen: 1900,
  minSep: 75,        // distância mínima entre trechos que não são vizinhos
  sepArc: 160,       // "vizinhos" = até 160 unidades de distância ao longo da pista
  minRadius: 24,     // raio mínimo das curvas
  lavaMinRadius: 42, // pistas de lava (sem muros) têm curvas mais abertas
  bound: 450,        // tudo dentro de ±450
  minStraight: 220,  // reta de largada
  maxY: 12, maxSlope: 0.09,
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// Mistura números inteiros num novo número (sub-sementes determinísticas).
export function hashInts(...ns) {
  let h = 0x811c9dc5;
  for (const n of ns) {
    h = Math.imul(h ^ (n >>> 0), 0x01000193);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

export const isGenId = id => typeof id === 'string' && /^gen-[1-9]\d{0,9}$/.test(id);
export const seedOf = id => (isGenId(id) ? +id.slice(GEN_PREFIX.length) : 0);
export const levelOfSeed = seed => 1 + (seed % MAX_LEVEL);
// Semente com o nível escolhido "embutido" no último dígito.
export const makeSeed = (base, level) => (base % 100000000) * MAX_LEVEL + (clamp(level | 0, 1, MAX_LEVEL) - 1) || MAX_LEVEL;

// Semente aleatória para a "Pista Surpresa" (Math.random só escolhe o número).
export function randomSeed(level) {
  const base = 1 + Math.floor(Math.random() * 99999999);
  return makeSeed(base, level || 1 + Math.floor(Math.random() * 6));
}

// ---------- Catmull-Rom centrípeta (igual à CatmullRomCurve3 do three.js, fechada) ----------
function crPoint(P, t, out) {
  const l = P.length;
  const p = l * t;
  let ip = Math.floor(p);
  const w = p - ip;
  ip += ip > 0 ? 0 : (Math.floor(Math.abs(ip) / l) + 1) * l;
  const p0 = P[(ip - 1) % l], p1 = P[ip % l], p2 = P[(ip + 1) % l], p3 = P[(ip + 2) % l];
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  let dt0 = Math.pow(d2(p0, p1), 0.25), dt1 = Math.pow(d2(p1, p2), 0.25), dt2 = Math.pow(d2(p2, p3), 0.25);
  if (dt1 < 1e-4) dt1 = 1.0;
  if (dt0 < 1e-4) dt0 = dt1;
  if (dt2 < 1e-4) dt2 = dt1;
  for (let c = 0; c < 3; c++) {
    const x0 = p0[c], x1 = p1[c], x2 = p2[c], x3 = p3[c];
    let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
    let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
    t1 *= dt1; t2 *= dt1;
    const c2 = -3 * x1 + 3 * x2 - 2 * t1 - t2, c3 = 2 * x1 - 2 * x2 + t1 + t2;
    out[c] = x1 + t1 * w + c2 * w * w + c3 * w * w * w;
  }
  return out;
}

// Amostra a curva fechada a cada ~ds unidades (por comprimento de arco),
// começando no ponto de controle 1 (a linha de largada, como em track.js).
export function sampleClosed(points, ds = 2) {
  const n = points.length;
  const M = n * 160;
  const fx = new Float64Array(M + 1), fy = new Float64Array(M + 1), fz = new Float64Array(M + 1), acc = new Float64Array(M + 1);
  const o = [0, 0, 0];
  for (let i = 0; i <= M; i++) {
    crPoint(points, (i % M) / M, o);
    fx[i] = o[0]; fy[i] = o[1]; fz[i] = o[2];
    if (i) acc[i] = acc[i - 1] + Math.hypot(fx[i] - fx[i - 1], fy[i] - fy[i - 1], fz[i] - fz[i - 1]);
  }
  const L = acc[M];
  const N = Math.max(100, Math.round(L / ds));
  const step = L / N;
  // parâmetro do ponto 1 = 1/n → arco correspondente
  const s0 = acc[Math.round(M / n)];
  const x = new Float64Array(N), y = new Float64Array(N), z = new Float64Array(N);
  let j = 0;
  for (let i = 0; i < N; i++) {
    const s = (s0 + i * step) % L;
    if (s < acc[j]) j = 0;
    while (j < M - 1 && acc[j + 1] < s) j++;
    const f = (s - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
    x[i] = lerp(fx[j], fx[j + 1], f); y[i] = lerp(fy[j], fy[j + 1], f); z[i] = lerp(fz[j], fz[j + 1], f);
  }
  return { x, y, z, N, L, step };
}

// Curvatura (1/raio) no plano XZ em cada amostra (círculo por 3 pontos a ±k amostras).
function curvature(S, k = 2) {
  const { x, z, N } = S;
  const kap = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const a = (i - k + N) % N, b = (i + k) % N;
    const ax = x[a], az = z[a], bx = x[i], bz = z[i], cx = x[b], cz = z[b];
    const ab = Math.hypot(bx - ax, bz - az), bc = Math.hypot(cx - bx, cz - bz), ca = Math.hypot(ax - cx, az - cz);
    const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    kap[i] = ab * bc * ca > 1e-9 ? (2 * Math.abs(cross)) / (ab * bc * ca) : 0;
  }
  return kap;
}

// Confere todas as regras de segurança. Devolve as medidas (para testes e para os enfeites).
export function measure(points, lava = false) {
  const S = sampleClosed(points, 2);
  const { x, y, z, N, L, step } = S;
  const kap = curvature(S);
  let maxK = 0;
  for (let i = 0; i < N; i++) maxK = Math.max(maxK, kap[i]);
  // distância mínima entre trechos não vizinhos (amostras a cada ~4 unidades)
  const st = 2, arcN = Math.ceil(RULES.sepArc / step);
  let minSep = Infinity;
  for (let i = 0; i < N; i += st) {
    for (let j = i + arcN; j < N; j += st) {
      if (N - (j - i) < arcN) break;
      const d = (x[i] - x[j]) ** 2 + (z[i] - z[j]) ** 2;
      if (d < minSep) minSep = d;
    }
  }
  minSep = Math.sqrt(minSep);
  // limites, altura e inclinação
  let bound = 0, minY = Infinity, maxY = -Infinity, maxSlope = 0;
  const w = Math.max(1, Math.round(10 / step));
  for (let i = 0; i < N; i++) {
    bound = Math.max(bound, Math.abs(x[i]), Math.abs(z[i]));
    minY = Math.min(minY, y[i]); maxY = Math.max(maxY, y[i]);
    const b = (i + w) % N;
    maxSlope = Math.max(maxSlope, Math.abs(y[b] - y[i]) / (w * step));
  }
  // reta de largada: trecho contínuo em volta do ponto 1 sobre a reta p0→p2
  const p0 = points[0], p2 = points[2];
  let dx = p2[0] - p0[0], dz = p2[2] - p0[2];
  const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
  const onLine = i => {
    const ox = x[i] - p0[0], oz = z[i] - p0[2];
    const lat = Math.abs(ox * dz - oz * dx);
    const a = (i + 1) % N, b = (i - 1 + N) % N;
    const tx = x[a] - x[b], tz = z[a] - z[b];
    const cosA = (tx * dx + tz * dz) / (Math.hypot(tx, tz) || 1);
    return lat < 3 && cosA > 0.99; // até 3 unidades de desvio e ~8°
  };
  let fw = 0, bw = 0;
  while (fw < N / 2 && onLine(fw)) fw++;
  while (bw < N / 2 && onLine((N - 1 - bw) % N)) bw++;
  const straight = (fw + bw) * step;
  const minRadius = 1 / Math.max(maxK, 1e-9);
  const reasons = [];
  if (L < RULES.minLen || L > RULES.maxLen) reasons.push('length');
  if (minSep < RULES.minSep) reasons.push('sep');
  // margem de 6% porque o three.js amostra a curva um pouco diferente
  if (minRadius < (lava ? RULES.lavaMinRadius : RULES.minRadius) * 1.06) reasons.push('radius');
  if (bound > RULES.bound) reasons.push('bound');
  if (straight < RULES.minStraight) reasons.push('straight');
  if (minY < -1.5 || maxY > RULES.maxY + 0.01 || maxSlope > RULES.maxSlope) reasons.push('height');
  return { ok: reasons.length === 0, reasons, L, minSep, minRadius, bound, straight, minY, maxY, maxSlope, S, kap };
}

// ---------- Traçado ----------
function makeShape(r, level, lava) {
  const tight = clamp((level - 1) / (MAX_LEVEL - 1), 0, 1); // pistas de nível alto: mais sinuosas
  const R = lerp(165, 245, r());
  const aspect = lerp(0.72, 1.35, r());
  const a = lerp(105, 140, r()), b = lerp(120, 160, r());
  const g3 = lerp(40, 65, r()), a3 = lerp(0.08, 0.2, r());
  const gL = lerp(40, 65, r()), aL = lerp(0.08, 0.2, r());
  const Rx = R * Math.sqrt(aspect);
  // a elipse precisa ser bem mais comprida que a reta, senão a curva logo depois dela fica fechada demais
  const Rz = Math.max(R / Math.sqrt(aspect), Math.max(a + gL, b + g3) / lerp(0.62, 0.74, r()));
  const n = 12 + Math.floor(r() * 9);
  const m = n - 5; // pontos da volta (fora a reta e os 2 pontos-guia)
  const side = r() < 0.5 ? 1 : -1;
  // centro da elipse um pouco para dentro: a reta de largada fica no lado x = 0
  const cx = Rx * lerp(0.92, 1.0, r());
  // pontos-guia logo depois e logo antes da reta, quase alinhados com ela:
  // assim o trecho p0→p1→p2 sai realmente reto e a curva começa depois
  const P3 = [g3 * Math.sin(a3), b + g3 * Math.cos(a3)];
  const PL = [gL * Math.sin(aL), -a - gL * Math.cos(aL)];
  const ph2 = Math.atan2(P3[1] / Rz, (P3[0] - cx) / Rx), ph0 = Math.atan2(PL[1] / Rz, (PL[0] - cx) / Rx);
  const span = ph2 - ph0;
  const stepA = span / (m + 1);
  const amp = lava ? lerp(0.08, 0.2, r()) : lerp(0.16, 0.3 + 0.14 * tight, r());
  // ruído suave do raio
  const raw = Array.from({ length: m }, () => r() * 2 - 1);
  const u = raw.map((v, k) => 0.2 * (raw[k - 1] ?? v) + 0.6 * v + 0.2 * (raw[k + 1] ?? v));
  if (!lava && m > 6) {
    // "dentes" para dentro (curvas em S e grampos) e "barrigas" para fora
    const dents = r() < 0.3 + 0.45 * tight ? (r() < 0.35 + 0.3 * tight ? 2 : 1) : 0;
    for (let d = 0; d < dents; d++) u[1 + Math.floor(r() * (m - 2))] = -lerp(1.4, 2.0, r());
    if (r() < 0.3) u[1 + Math.floor(r() * (m - 2))] = lerp(1.2, 1.6, r());
  }
  const H = lava ? lerp(4, 12, r()) : lerp(1.5, 12, r());
  const hk = r() < 0.5 ? 1 : 2;
  const hph = r() * 0.6;
  const pts = [[0, 0, -a], [0, 0, 0], [0, 0, b], [side * P3[0], 0, P3[1]]];
  for (let k = 0; k < m; k++) {
    const f = (k + 1) / (m + 1);
    const env = Math.sqrt(Math.sin(Math.PI * f));
    const phi = ph2 - stepA * (k + 1) + (r() - 0.5) * 0.5 * stepA;
    const rad = 1 + amp * env * u[k];
    const px = cx + Rx * rad * Math.cos(phi);
    const pz = Rz * rad * Math.sin(phi);
    let py = H * (0.5 - 0.5 * Math.cos(2 * Math.PI * hk * clamp(f + hph * f * (1 - f), 0, 1)));
    py = clamp(py, 0, RULES.maxY);
    pts.push([side * px, py, pz]);
  }
  pts.push([side * PL[0], 0, PL[1]]);
  return pts;
}

function round1(pts) { return pts.map(p => p.map(v => Math.round(v * 10) / 10)); }

// Ajusta o tamanho para caber na faixa de comprimento, gira e centraliza no (0,0).
function fitAndCenter(pts, r, rotate = true) {
  let S = sampleClosed(pts, 4);
  const target = clamp(S.L, 1200 + r() * 100, 1700 + r() * 100);
  const f = target / S.L;
  const ang = rotate ? r() * Math.PI * 2 : 0, ca = Math.cos(ang), sa = Math.sin(ang);
  pts = pts.map(p => [(p[0] * ca - p[2] * sa) * f, p[1], (p[0] * sa + p[2] * ca) * f]);
  S = sampleClosed(pts, 4);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < S.N; i++) {
    minX = Math.min(minX, S.x[i]); maxX = Math.max(maxX, S.x[i]);
    minZ = Math.min(minZ, S.z[i]); maxZ = Math.max(maxZ, S.z[i]);
  }
  const ox = (minX + maxX) / 2, oz = (minZ + maxZ) / 2;
  return round1(pts.map(p => [p[0] - ox, p[1], p[2] - oz]));
}

// Último recurso: oval sem ruído (todos os sorteios no meio da faixa). O teste
// em Node confere que ele passa nas regras, com e sem lava.
export function fallbackLayout(lava = false) {
  const half = () => 0.5;
  const pts = fitAndCenter(makeShape(half, 1, true), half, false);
  // na lava as curvas precisam ser mais abertas: aumenta tudo 18%
  return lava ? round1(pts.map(p => [p[0] * 1.18, p[1], p[2] * 1.18])) : pts;
}

export function generateLayout(seed, level, lava) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const r = rng(hashInts(seed, attempt, 7919));
    const pts = fitAndCenter(makeShape(r, level, lava), r);
    const m = measure(pts, lava);
    if (m.ok) return { points: pts, m, attempt };
  }
  const pts = fallbackLayout(lava);
  return { points: pts, m: measure(pts, lava), attempt: -1 };
}

// ---------- Cores ----------
function hexToHsl(hex) {
  const v = parseInt(hex.slice(1), 16);
  const r = (v >> 16 & 255) / 255, g = (v >> 8 & 255) / 255, b = (v & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  h = ((h % 1) + 1) % 1; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const f = n => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return '#' + [f(0), f(8), f(4)].map(c => c.toString(16).padStart(2, '0')).join('');
}
const shift = (hex, dh, ds = 0, dl = 0) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h + dh, s + ds, l + dl); };

// ---------- Temas ----------
const STYLES = {
  vale: {
    weight: 26, emoji: ['🌳', '🌻', '🌈', '🐞'],
    names: [['Circuito Vale', 'Campos', 'Colinas', 'Trilha', 'Bosque', 'Circuito'], ['do Trovão', 'das Flores', 'do Arco-Íris', 'dos Moinhos', 'do Sabiá', 'da Capivara', 'do Girassol', 'da Joaninha']],
    barrel: 'barrel', puddle: 'mud', obstacles: ['barrel', 'barrel', 'puddle'],
    music: { scales: ['major', 'major', 'minorPent'], root: [57, 64], tempo: [124, 140] },
  },
  deserto: {
    weight: 22, emoji: ['🏜️', '🐪', '🦂', '🌵'],
    names: [['Dunas', 'Oásis', 'Cânion', 'Rally', 'Miragem', 'Trilha'], ['do Escorpião', 'do Faraó', 'da Areia Quente', 'do Camelo', 'do Sol', 'das Caveiras', 'do Cacto', 'da Esfinge']],
    barrel: 'boulder', puddle: 'quicksand', geyser: 'sand', obstacles: ['barrel', 'geyser', 'puddle', 'barrel'],
    music: { scales: ['arabic', 'arabic', 'minor'], root: [55, 60], tempo: [118, 132] },
  },
  neve: {
    weight: 22, emoji: ['❄️', '🐧', '⛄', '🏔️'],
    names: [['Curva', 'Pico', 'Geleira', 'Trilha', 'Montanha', 'Descida'], ['do Pinguim', 'do Iglu', 'da Avalanche', 'do Urso Polar', 'do Floco de Neve', 'do Boneco de Neve', 'da Aurora', 'do Trenó']],
    barrel: 'snowball', puddle: 'ice', obstacles: ['barrel', 'puddle', 'puddle', 'barrel'],
    music: { scales: ['minorPent', 'minorPent', 'major'], root: [60, 66], tempo: [110, 126] },
  },
  doce: {
    weight: 20, emoji: ['🍭', '🍬', '🧁', '🍩'],
    names: [['Reino', 'Pista', 'Circuito', 'Vale', 'Avenida', 'Ladeira'], ['do Chiclete', 'da Jujuba', 'do Pirulito', 'do Brigadeiro', 'da Paçoca', 'do Algodão-Doce', 'do Sorvete', 'do Bombom']],
    barrel: 'gumball', puddle: 'syrup', crusher: 'candy', obstacles: ['crusher', 'crusher', 'barrel', 'puddle'],
    music: { scales: ['major', 'major', 'minorPent'], root: [62, 67], tempo: [132, 148] },
  },
  vulcao: {
    weight: 10, minLevel: 3, emoji: ['🌋', '🔥', '🐉'],
    names: [['Cratera', 'Caldeirão', 'Trilha', 'Abismo', 'Ponte', 'Circuito'], ['do Dragão', 'da Lava', 'do Fogo', 'das Brasas', 'do Magma', 'da Fênix', 'do Meteoro']],
    barrel: 'boulder', geyser: 'fire', crusher: 'rock', obstacles: ['geyser', 'geyser', 'crusher', 'barrel'],
    music: { scales: ['minor', 'minor', 'arabic'], root: [50, 55], tempo: [140, 156] },
  },
};

function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }

function pickStyle(r, level) {
  const keys = Object.keys(STYLES).filter(k => level >= (STYLES[k].minLevel || 1));
  const total = keys.reduce((a, k) => a + STYLES[k].weight, 0);
  let x = r() * total;
  for (const k of keys) { x -= STYLES[k].weight; if (x < 0) return k; }
  return keys[0];
}

function makeTheme(base, style, r) {
  const th = JSON.parse(JSON.stringify(base.theme));
  const dh = (r() - 0.5) * 0.08;
  th.skyTop = shift(th.skyTop, dh, 0, (r() - 0.5) * 0.08);
  th.skyHorizon = shift(th.skyHorizon, dh * 0.5);
  th.curbA = shift(th.curbA, (r() - 0.5) * 0.12);
  if (th.wallA === base.theme.curbA) th.wallA = th.curbA;
  th.sunDir = [th.sunDir[0] * (r() < 0.5 ? -1 : 1), th.sunDir[1], th.sunDir[2] * (r() < 0.5 ? -1 : 1)];
  let time = 'dia';
  if (style !== 'vulcao') {
    const x = r();
    if (x < 0.18) {
      time = 'tarde';
      Object.assign(th, {
        skyTop: shift('#3b3a8a', dh), skyHorizon: '#ff9e6b', sun: '#ffc48a',
        sunDir: [th.sunDir[0] < 0 ? -0.6 : 0.6, 0.28, th.sunDir[2] < 0 ? -0.55 : 0.55],
        fog: shift(th.fog, -0.04, -0.1, -0.08), hemiSky: '#ffc8a8',
      });
    } else if (x < 0.27) {
      time = 'noite';
      Object.assign(th, {
        skyTop: '#060a24', skyHorizon: '#2c3a72', skyBottom: '#141a3a', sun: '#b8c4ff',
        sunDir: [0.3, 0.75, -0.4], fog: '#1c2448', fogNear: 120, fogFar: 640,
        hemiSky: '#8a9ad8', hemiGround: shift(th.hemiGround, 0, -0.2, -0.2), stars: true, clouds: false,
      });
    }
  }
  return { theme: th, time };
}

function makeScenery(base, r) {
  const sc = JSON.parse(JSON.stringify(base.scenery));
  for (const k of Object.keys(sc)) if (typeof sc[k] === 'number') sc[k] = Math.round(sc[k] * lerp(0.75, 1.25, r()));
  // a arquibancada fica sempre; os outros enfeites variam
  const others = sc.props.filter(p => p !== 'grandstand' && p !== 'skulls');
  sc.props = ['grandstand', ...others.filter(() => r() < 0.75)];
  return sc;
}

// ---------- Enfeites e obstáculos ----------
function makeFeatures(r, style, level, m) {
  const st = STYLES[style];
  const { kap } = m;
  const { N } = m.S;
  const step = m.S.step;
  const kAt = t => kap[Math.floor(((t % 1) + 1) % 1 * N) % N];
  // maior curvatura num trecho [t - back, t + fwd] (em unidades)
  const kMax = (t, back, fwd) => {
    const i0 = Math.floor(t * N), a = Math.round(back / step), b = Math.round(fwd / step);
    let k = 0;
    for (let d = -a; d <= b; d++) k = Math.max(k, kap[((i0 + d) % N + N) % N]);
    return k;
  };
  const F = [];
  const taken = [];
  const free = (t, gap) => t > 0.06 && t < 0.955 && taken.every(u => Math.abs(u - t) > gap);
  const take = t => { taken.push(t); return t; };
  const r2 = t => Math.round(t * 1000) / 1000;

  // rampas: só em retas compridas (decola e pousa sem curva)
  const nRamps = r() < 0.2 ? 0 : r() < 0.6 ? 1 : 2;
  let ramps = 0;
  for (let tries = 0; tries < 40 && ramps < nRamps; tries++) {
    const t = lerp(0.15, 0.9, r());
    if (!free(t, 0.12)) continue;
    if (kMax(t, 30, 70) > 1 / 160) continue;
    if (style === 'vulcao' && kMax(t, 30, 110) > 1 / 220) continue;
    F.push({ type: 'ramp', t: r2(take(t)), lat: 0 });
    ramps++;
  }
  // caixas surpresa: 3 a 5 fileiras espalhadas
  const nItems = 3 + Math.floor(r() * 3);
  for (let k = 0; k < nItems; k++) {
    let t = 0.1 + (k + r() * 0.5) * (0.82 / nItems);
    for (let g = 0; g < 8 && !free(t, 0.025); g++) t += 0.02;
    F.push({ type: 'items', t: r2(take(t)) });
  }
  // moedas
  const nCoins = 3 + Math.floor(r() * 3);
  for (let k = 0; k < nCoins; k++) {
    let t = 0.05 + (k + 0.3 + r() * 0.4) * (0.88 / nCoins);
    for (let g = 0; g < 8 && !free(t, 0.02); g++) t += 0.015;
    F.push({ type: 'coins', t: r2(take(t)), lat: pick(r, [0, -0.45, 0.45]), count: 5 + Math.floor(r() * 2) });
  }
  // setas de turbo
  const nBoost = 2 + Math.floor(r() * 3);
  for (let k = 0; k < nBoost; k++) {
    let t = 0.08 + (k + r() * 0.6) * (0.86 / nBoost);
    for (let g = 0; g < 10 && (!free(t, 0.02) || kAt(t) > 1 / 50); g++) t += 0.017;
    F.push({ type: 'boost', t: r2(take(t)), lat: style === 'vulcao' ? 0 : pick(r, [0, -0.4, 0.4]) });
  }
  // obstáculos do tema, mais numerosos nos níveis altos
  const nObs = clamp(Math.round(2 + level * 0.7 + r()), 2, 9);
  let crushers = 0, barrels = 0, geysers = 0;
  for (let k = 0; k < nObs; k++) {
    const kind = st.obstacles[(k + Math.floor(r() * st.obstacles.length)) % st.obstacles.length];
    let t = -1;
    for (let tries = 0; tries < 30; tries++) {
      const c = lerp(0.08, 0.94, r());
      if (!free(c, 0.03)) continue;
      // nada logo depois do pouso de uma rampa
      if (F.some(f => f.type === 'ramp' && c > f.t && c - f.t < 0.05)) continue;
      if ((kind === 'crusher' || kind === 'geyser') && kMax(c, 15, 15) > 1 / 45) continue;
      t = c; break;
    }
    if (t < 0) continue;
    take(t);
    const ph = Math.round(r() * 20) / 10;
    if (kind === 'barrel') { F.push({ type: 'barrel', t: r2(t), speed: Math.round(lerp(0.8, 1.0 + level * 0.03, r()) * 100) / 100, kind: st.barrel }); barrels++; }
    else if (kind === 'puddle') F.push({ type: 'puddle', t: r2(t), lat: pick(r, [-0.45, 0.45, 0]), kind: st.puddle });
    else if (kind === 'geyser') {
      const lat = pick(r, [-0.4, 0.4, 0, -0.35, 0.35]);
      F.push({ type: 'geyser', t: r2(t), lat, kind: st.geyser, phase: ph });
      if (level >= 5 && lat !== 0 && r() < 0.5) F.push({ type: 'geyser', t: r2(t), lat: -lat, kind: st.geyser, phase: Math.round((ph + 1.2) * 10) / 10 });
      geysers++;
    } else if (kind === 'crusher') {
      const lat = pick(r, [-0.45, 0.45, 0]);
      F.push({ type: 'crusher', t: r2(t), lat, phase: ph, kind: st.crusher });
      if (level >= 4 && lat !== 0 && r() < 0.5) F.push({ type: 'crusher', t: r2(t), lat: -lat, phase: Math.round((ph + 1.5) * 10) / 10, kind: st.crusher });
      crushers++;
    }
  }
  F.sort((a, b) => a.t - b.t);
  return { features: F, ramps, crushers, barrels, geysers };
}

function makeChallenges(r, style, level, info) {
  const place = level <= 3 ? 3 : level <= 6 ? 2 : 1;
  const out = [{ type: 'place', value: place, text: place === 1 ? 'Vença a corrida!' : place === 2 ? 'Termine em 1º ou 2º' : 'Termine entre os 3 primeiros' }];
  const pool = [];
  const coins = Math.min(10, 6 + Math.floor(level / 3) + Math.floor(r() * 2));
  pool.push({ type: 'coins', value: coins, text: `Colete ${coins} moedas` });
  const boosts = 2 + Math.floor(r() * 2);
  pool.push({ type: 'boosts', value: boosts, text: `Faça ${boosts} mini-turbos derrapando` });
  const hits = 2 + (level >= 6 ? 1 : 0);
  pool.push({ type: 'hits', value: hits, text: `Acerte ${hits} adversários com itens` });
  if (info.ramps) pool.push({ type: 'tricks', value: info.ramps, text: info.ramps === 1 ? 'Faça uma manobra na rampa' : `Faça ${info.ramps} manobras nas rampas` });
  if (info.barrels) pool.push({ type: 'nohit', value: 0, text: { boulder: 'Não bata em nenhuma rocha rolante', snowball: 'Não bata em nenhuma bola de neve', gumball: 'Não bata em nenhuma bola de chiclete' }[STYLES[style].barrel] || 'Não bata em nenhum barril' });
  if (info.crushers) pool.push({ type: 'nosquash', value: 0, text: 'Não seja esmagado pelos pilões' });
  if (style === 'vulcao') pool.unshift({ type: 'nofall', value: 0, text: 'Não caia na lava' });
  // escolhe 2 diferentes (no vulcão, "não cair na lava" sempre entra)
  const first = style === 'vulcao' ? pool.shift() : pool.splice(Math.floor(r() * pool.length), 1)[0];
  const second = pool.splice(Math.floor(r() * pool.length), 1)[0];
  out.push(first, second);
  return out;
}

const cache = new Map();

// Gera a definição completa da pista 'gen-<seed>'.
export function generateTrack(seed) {
  seed = Math.max(1, Math.floor(Math.abs(+seed) || 1));
  const id = GEN_PREFIX + seed;
  if (cache.has(id)) return cache.get(id);
  const level = levelOfSeed(seed);
  const r = rng(hashInts(seed, 1013));
  const style = pickStyle(r, level);
  const base = TRACKS.find(t => t.id === style);
  const lava = style === 'vulcao';
  const lay = generateLayout(seed, level, lava);
  const st = STYLES[style];
  const { theme, time } = makeTheme(base, style, r);
  const fx = makeFeatures(r, style, level, lay.m);
  const scales = st.music.scales;
  const def = {
    id,
    name: `${pick(r, st.names[0])} ${pick(r, st.names[1])}`,
    emoji: pick(r, st.emoji),
    difficulty: level <= 3 ? 1 : level <= 6 ? 2 : 3,
    level,
    generated: true,
    style,
    timeOfDay: time,
    sceneSeed: hashInts(seed, 4242),
    halfWidth: lava ? 12.5 : pick(r, [12, 12.5, 13]),
    shoulder: lava ? 2.5 : 7,
    walls: !lava,
    points: lay.points,
    theme,
    scenery: makeScenery(base, r),
    music: { tempo: Math.round(lerp(st.music.tempo[0], st.music.tempo[1], r())), root: Math.round(lerp(st.music.root[0], st.music.root[1], r())), scale: pick(r, scales), seed: 1 + (hashInts(seed, 77) % 9999) },
    features: fx.features,
    challenges: null,
    genInfo: { attempt: lay.attempt, length: Math.round(lay.m.L), minSep: Math.round(lay.m.minSep), minRadius: Math.round(lay.m.minRadius), straight: Math.round(lay.m.straight) },
  };
  if (style === 'neve') def.icy = true;
  if (lava) def.lava = true;
  def.challenges = makeChallenges(r, style, level, fx);
  cache.set(id, def);
  return def;
}

// ---------- Copa Infinita ----------
// Copa n (1, 2, 3...): 4 pistas geradas a partir do número da copa; o nível sobe com a copa.
export const INFINITE_CUP_SIZE = 4;
export function cupLevel(n, k = 0) { return clamp(n + (k >= 2 ? 1 : 0), 1, MAX_LEVEL); }
export function infiniteCup(n) {
  n = Math.max(1, n | 0);
  const tracks = [];
  for (let k = 0; k < INFINITE_CUP_SIZE; k++) tracks.push(GEN_PREFIX + makeSeed(1 + (hashInts(n, k, 31337) % 99999999), cupLevel(n, k)));
  // dificuldade do computador (0 = fácil ... 2 = difícil), sobe aos poucos
  const aiDifficulty = Math.min(2, (n - 1) * 0.25);
  return { name: `Copa Infinita ${n}`, number: n, infinite: true, tracks, aiDifficulty };
}
