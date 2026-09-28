// Cenário da Super Pista Osasco: prédios com janelas acesas, postes, Dogão, shoppings,
// Condomínio Jardins do Brasil, Cidade de Deus (Bradesco), Ponte Metálica com avenida
// embaixo, estação com trem e a praça dos pombos.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lerp, smoothstep } from './utils.js';
import { PigeonMeshes } from './pigeons.js';

const UP = new THREE.Vector3(0, 1, 0);
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true, ...o });
const glow = (c, i = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 });
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}
// Viga cilíndrica ligando dois pontos.
function beam(a, b, r, mat, seg = 6) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return m;
}

// Placa com texto que se ajusta à largura (acesa, para o fim de tarde).
function signTexture(text, bg, fg, w = 1024, h = 256, border = null) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = h * 0.08; ctx.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08); }
  let size = h * 0.62;
  ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
  const mw = ctx.measureText(text).width;
  if (mw > w * 0.88) { size *= (w * 0.88) / mw; ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.1; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeText(text, w / 2, h / 2 + size * 0.05);
  ctx.fillStyle = fg; ctx.fillText(text, w / 2, h / 2 + size * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function sign(text, width, bg, fg, o = {}) {
  const w = o.cw || 1024, h = o.ch || 256;
  const map = signTexture(text, bg, fg, w, h, o.border);
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, width * h / w),
    new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: o.glow ?? 0.6, roughness: 0.5 }));
  face.position.z = 0.16;
  g.add(face);
  g.add(box(width + 0.3, width * h / w + 0.3, 0.3, std(o.frame ?? 0x2a2a33)));
  return g;
}

// Fachadas com janelas (cor + mapa de janelas acesas).
function facadeTextures(kind, seed) {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 256; return c; };
  const cc = mk(), ce = mk();
  const a = cc.getContext('2d'), e = ce.getContext('2d');
  const wall = { office: '#e9e7e2', res: '#f6f1e7', glass: '#c9d3dc' }[kind];
  a.fillStyle = wall; a.fillRect(0, 0, 256, 256);
  e.fillStyle = '#000'; e.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const x = col * 64, y = row * 64;
    let wx = x + 9, wy = y + 12, ww = 46, wh = 38;
    if (kind === 'res') { wx = x + 12; wy = y + 10; ww = 40; wh = 34; }
    if (kind === 'glass') { wx = x + 2; wy = y + 3; ww = 60; wh = 58; }
    a.fillStyle = kind === 'glass' ? (r() < 0.5 ? '#4a6f94' : '#557da3') : '#3a4a60';
    a.fillRect(wx, wy, ww, wh);
    a.fillStyle = 'rgba(255,255,255,0.18)'; a.fillRect(wx, wy, ww, 4);
    if (kind === 'res') {
      // sacada
      a.fillStyle = '#c9c2b4'; a.fillRect(x + 4, y + 46, 56, 8);
      a.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 7; k++) a.fillRect(x + 6 + k * 8, y + 36, 2, 10);
    }
    if (kind === 'glass') {
      // vidro contínuo: reflexo do céu em faixa diagonal e poucas salas acesas
      a.fillStyle = 'rgba(255,190,160,0.18)'; a.fillRect(wx, wy + wh * 0.5, ww, wh * 0.5);
      if (r() < 0.18) { e.fillStyle = '#6a86a8'; e.fillRect(wx, wy, ww, wh); }
    } else if (r() < 0.36) {
      const warm = ['#ffd98a', '#ffe7b0', '#fff2d6', '#ffc870'];
      e.fillStyle = warm[Math.floor(r() * warm.length)];
      e.fillRect(wx, wy, ww, wh);
      a.fillStyle = '#ffe7b0'; a.fillRect(wx, wy, ww, wh);
    }
  }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
  return { map: tex(cc), emissiveMap: tex(ce) };
}

export function buildCity(track) {
  const def = track.def, th = def.theme;
  const group = track.group;
  const rand = track.rand;
  const e = track.edge;
  const gl = def.groundY;
  const N = track.N;
  const reserved = [];
  const warn = [];
  const blocks = { office: [], res: [], glass: [] };
  const trees = [], lamps = [], parked = [];
  const placedB = [];
  const reserve = (x, z, r) => reserved.push({ x, z, r });
  const isFree = (x, z, r) => reserved.every(q => (q.x - x) ** 2 + (q.z - z) ** 2 > (q.r + r) ** 2);

  // Coloca um marco virado para a pista. origin = ponto na borda do terreno do marco (lado da pista);
  // o marco se estende para -z local (para longe da pista).
  function place(obj, t, side, off, depth, radius, name, width = radius * 1.6) {
    const i = track.wrap(Math.floor(t * N));
    const p = track.pointAtIdx(i, side * (e + off));
    obj.position.set(p.x, gl, p.z);
    const dx = -side * track.rx[i], dz = -side * track.rz[i];
    obj.rotation.y = Math.atan2(dx, dz);
    group.add(obj);
    obj.updateMatrixWorld(true);
    const c = new THREE.Vector3(0, 0, -depth / 2).applyMatrix4(obj.matrixWorld);
    reserve(c.x, c.z, radius);
    // confere se algum pedaço do terreno do marco invade a pista
    let minD = Infinity;
    for (let a = 0; a <= 4; a++) for (let b2 = 0; b2 <= 4; b2++) {
      const w = new THREE.Vector3(lerp(-width / 2, width / 2, a / 4), 0, -depth * b2 / 4).applyMatrix4(obj.matrixWorld);
      minD = Math.min(minD, track._nearestCoarse(w.x, w.z).d);
    }
    if (minD < e + 1) warn.push(`${name} encosta na pista (${(minD - e).toFixed(1)} m)`);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return obj;
  }
  // Converte um ponto local do marco para o mundo.
  const world = (obj, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(obj.matrixWorld);

  // ---------- Área da largada (arquibancadas) ----------
  for (const side of [-1, 1]) {
    const p = track.pointAtIdx(track.wrap(-14), side * (e + 14));
    reserve(p.x, p.z, 30);
  }

  // ---------- Ponte Metálica ----------
  const bi = track.bridgeIdx;
  if (bi !== undefined) buildBridge();
  function buildBridge() {
    const b = def.bridge;
    const tx = track.tx[bi], tz = track.tz[bi], rx = track.rx[bi], rz = track.rz[bi];
    const cx = track.px[bi], cz = track.pz[bi];
    const deckAt = along => {
      const i = track.wrap(bi + Math.round(along / track.spacing));
      return track.py[i];
    };
    const P = (along, lat, y) => new THREE.Vector3(cx + tx * along + rx * lat, y, cz + tz * along + rz * lat);

    // avenida que passa embaixo da ponte
    const avLen = 220, avW = 22;
    const roadC = document.createElement('canvas'); roadC.width = 256; roadC.height = 256;
    const g2 = roadC.getContext('2d');
    g2.fillStyle = '#3c3d44'; g2.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 900; k++) { g2.fillStyle = Math.random() < 0.5 ? '#46474f' : '#33343a'; g2.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    g2.fillStyle = '#ffd23f'; g2.fillRect(124, 0, 3, 256); g2.fillRect(130, 0, 3, 256);
    g2.fillStyle = '#eeeeee'; for (const x of [64, 192]) g2.fillRect(x - 2, 0, 4, 120);
    g2.fillRect(8, 0, 4, 256); g2.fillRect(244, 0, 4, 256);
    const roadT = new THREE.CanvasTexture(roadC); roadT.colorSpace = THREE.SRGBColorSpace; roadT.wrapT = THREE.RepeatWrapping; roadT.repeat.set(1, avLen / 24); roadT.anisotropy = 4;
    const av = new THREE.Mesh(new THREE.PlaneGeometry(avW, avLen).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: roadT, roughness: 0.85 }));
    av.position.set(cx, gl + 0.12, cz);
    av.rotation.y = Math.atan2(rx, rz);
    av.receiveShadow = true;
    group.add(av);
    const walk = std(0xb9b4aa);
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, avLen), walk);
      w.position.set(cx + tx * s * (avW / 2 + 2), gl + 0.15, cz + tz * s * (avW / 2 + 2));
      w.rotation.y = av.rotation.y;
      w.receiveShadow = true;
      group.add(w);
    }
    for (let s = -avLen / 2; s <= avLen / 2; s += 18) reserve(cx + rx * s, cz + rz * s, 18);

    // trânsito na avenida (faróis acesos)
    const nCars = 12;
    const carCols = [0xd62d2d, 0xf2f2f2, 0x2b2b30, 0x2f6fd6, 0xc9c9cf, 0xf0c419, 0x1e8a5a];
    const bodyIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.3), std(0xffffff, { roughness: 0.35, metalness: 0.4, flatShading: false }), nCars);
    const cabIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.8, 2.3), std(0x1d2733, { roughness: 0.2, metalness: 0.5 }), nCars);
    const headIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.3, 0.1), glow(0xfff4d0, 2.5), nCars);
    const tailIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.3, 0.1), glow(0xff2020, 2), nCars);
    const cars = [];
    for (let k = 0; k < nCars; k++) {
      const dir = k % 2 ? 1 : -1;
      const lane = dir * (k % 4 < 2 ? 2.8 : 7.8);
      cars.push({ dir, lane, s: rand() * avLen, v: 11 + rand() * 7 });
      bodyIM.setColorAt(k, new THREE.Color(carCols[k % carCols.length]));
    }
    for (const im of [bodyIM, cabIM, headIM, tailIM]) { im.castShadow = im === bodyIM; im.frustumCulled = false; group.add(im); }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), loc = new THREE.Matrix4(), w = new THREE.Matrix4();
    const baseYaw = Math.atan2(rx, rz);
    track.animated.push(dt => {
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
    const conc = std(0xa7a39b);
    const half = b.span;
    for (const s of [-1, 1]) {
      const y0 = deckAt(s * half);
      const a = box(2 * (e + 10), y0 - gl, 6, conc);
      const p = P(s * (half + 3), 0, (y0 + gl) / 2 - 0.2);
      a.position.copy(p);
      a.rotation.y = Math.atan2(tx, tz);
      a.receiveShadow = true;
      group.add(a);
    }
    // parte de baixo do tabuleiro (visto da avenida)
    const under = new THREE.MeshStandardMaterial({ color: 0x77736d, roughness: 0.9, side: THREE.DoubleSide });
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
    group.add(new THREE.Mesh(ug, under));

    // arcos rosa (como a Ponte Metálica iluminada à noite)
    const pink = new THREE.MeshStandardMaterial({ color: 0xff5ad8, emissive: 0xff1fc0, emissiveIntensity: 0.85, roughness: 0.35, metalness: 0.3 });
    const pinkThin = new THREE.MeshStandardMaterial({ color: 0xff8ae4, emissive: 0xff2ac8, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0.3 });
    const truss = new THREE.Group();
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
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.95, 10, false), pink);
      tube.castShadow = true;
      group.add(tube);
      // tirantes cruzados ligando o arco ao tabuleiro
      for (let k = 2; k <= 38; k += 2) {
        const u = k / 40;
        const top = archPt(side, u);
        if (top.y - deckAt(lerp(-span, span, u)) < 2.5) continue;
        for (const dAl of [-4, 4]) {
          const al = lerp(-span, span, u) + dAl;
          if (Math.abs(al) > span) continue;
          truss.add(beam(top, P(al, side * (baseLat - 0.2), deckAt(al) + 0.9), 0.12, pinkThin, 5));
        }
      }
      // pés do arco
      for (const u of [0, 1]) {
        const f = archPt(side, u);
        const foot = box(3, 2.4, 3, conc); foot.position.copy(f).setY(f.y - 0.6); group.add(foot);
      }
    }
    // treliça em X entre os dois arcos, lá em cima
    for (let k = 8; k <= 32; k += 3) {
      const a1 = archPt(-1, k / 40), a2 = archPt(1, k / 40);
      const b1 = archPt(-1, (k + 3) / 40), b2 = archPt(1, (k + 3) / 40);
      truss.add(beam(a1, a2, 0.32, pink, 6));
      if (k + 3 <= 32) { truss.add(beam(a1, b2, 0.2, pinkThin, 5)); truss.add(beam(a2, b1, 0.2, pinkThin, 5)); }
    }
    mergeInto(group, truss);
    // luz rosa sobre a ponte
    const light = new THREE.PointLight(0xff3ad0, 60, 90, 1.4);
    light.position.copy(P(0, 0, deckAt(0) + H * 0.6));
    group.add(light);
    const light2 = new THREE.PointLight(0xff3ad0, 40, 60, 1.4);
    light2.position.copy(P(0, 0, gl + 5));
    group.add(light2);
    // placa na entrada da ponte
    const sg = sign('PONTE METÁLICA', 11, '#1c1c28', '#ff8ae4');
    const sp = P(-half - 10, -(e + 3), deckAt(-half - 10) + 3.2);
    sg.position.copy(sp);
    sg.rotation.y = Math.atan2(-tx, -tz);
    const post = cyl(0.2, 0.2, 3, std(0x555555), 0, -1.6, -0.2); sg.add(post);
    group.add(sg);
  }

  // ---------- Dogão de Osasco ----------
  if (def.landmarks.dogao) {
    const L = def.landmarks.dogao;
    const g = new THREE.Group();
    // trailer
    const stripeC = document.createElement('canvas'); stripeC.width = 64; stripeC.height = 64;
    const sc = stripeC.getContext('2d');
    for (let k = 0; k < 8; k++) { sc.fillStyle = k % 2 ? '#ffffff' : '#e8262a'; sc.fillRect(k * 8, 0, 8, 64); }
    const stripe = new THREE.CanvasTexture(stripeC); stripe.colorSpace = THREE.SRGBColorSpace; stripe.wrapS = THREE.RepeatWrapping; stripe.repeat.set(3, 1);
    const red = std(0xe8262a, { roughness: 0.5 }), yellow = std(0xffc81a, { roughness: 0.5 });
    g.add(box(12, 4.2, 5.5, red, 0, 2.9, -4));
    g.add(box(12.05, 0.8, 5.55, yellow, 0, 3.4, -4));
    g.add(box(8, 1.8, 0.2, std(0x2a1a14), 0, 3.3, -1.2));
    g.add(box(8.6, 0.25, 1.2, std(0xdddddd), 0, 2.2, -0.9));
    const awning = new THREE.Mesh(new THREE.BoxGeometry(10, 0.15, 3), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7 }));
    awning.position.set(0, 5.1, -0.4); awning.rotation.x = 0.35; g.add(awning);
    for (const x of [-4, 4]) for (const z of [-6, -2]) { const wh = cyl(0.6, 0.6, 0.4, std(0x222222), x, 0.6, z, 14); wh.rotation.z = Math.PI / 2; g.add(wh); }
    const s = sign('DOGÃO', 9, '#ffc81a', '#d11a2a', { cw: 1024, ch: 320, border: '#d11a2a', glow: 0.7 });
    s.position.set(0, 6.6, -1.4); g.add(s);
    // cachorro-quente gigante girando no alto
    const hd = new THREE.Group(); hd.position.set(0, 15, -4);
    const bun = new THREE.MeshStandardMaterial({ color: 0xe0a050, roughness: 0.8 });
    for (const z of [-1.1, 1.1]) { const bb = new THREE.Mesh(new THREE.CapsuleGeometry(1.35, 9, 6, 14).rotateZ(Math.PI / 2), bun); bb.position.z = z; bb.scale.set(1, 0.85, 1); hd.add(bb); }
    const sausage = new THREE.Mesh(new THREE.CapsuleGeometry(1.05, 11.5, 8, 16).rotateZ(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xc0462a, roughness: 0.35, clearcoat: 0.8 }));
    sausage.position.y = 0.75; hd.add(sausage);
    const zig = [];
    for (let k = 0; k <= 16; k++) zig.push(new THREE.Vector3(-5 + k * 0.625, 1.75, (k % 2 ? 0.45 : -0.45)));
    const mustard = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zig), 64, 0.2, 6, false), new THREE.MeshStandardMaterial({ color: 0xffd21a, roughness: 0.4 }));
    hd.add(mustard);
    // purê e batata palha (o dogão de Osasco vem caprichado!)
    const pure = new THREE.MeshStandardMaterial({ color: 0xfff0b0, roughness: 0.9 });
    for (let k = 0; k < 5; k++) { const pb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), pure); pb.position.set(-4 + k * 2, 1.4, 0.95); pb.scale.set(1.4, 0.6, 0.6); hd.add(pb); }
    const straw = std(0xf0b030);
    const strawG = new THREE.Group();
    for (let k = 0; k < 40; k++) { const st = box(0.12, 0.12, 0.9, straw, -5 + rand() * 10, 1.95 + rand() * 0.4, (rand() - 0.5) * 1.6); st.rotation.set(rand() * 3, rand() * 3, rand() * 3); strawG.add(st); }
    mergeInto(hd, strawG);
    // carinha simpática na ponta da salsicha
    const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff }), eyeB = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (const z of [-0.45, 0.45]) {
      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), eyeW); ew.position.set(6.3, 1.15, z); hd.add(ew);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), eyeB); pu.position.set(6.58, 1.15, z); hd.add(pu);
    }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 6, 12, Math.PI), eyeB);
    smile.position.set(6.62, 0.6, 0); smile.rotation.set(0, Math.PI / 2, Math.PI); hd.add(smile);
    g.add(hd);
    g.add(cyl(0.35, 0.35, 10, std(0xcccccc, { metalness: 0.6 }), 0, 9.5, -4));
    track.animated.push((dt, t) => { hd.rotation.y += dt * 0.45; hd.position.y = 15 + Math.sin(t * 1.5) * 0.4; });
    // mesinhas com guarda-sol
    for (const [x, z, col] of [[-9, -1, 0xffc81a], [9, -1, 0xe8262a], [-9, -8, 0xe8262a], [9, -8, 0xffc81a]]) {
      g.add(cyl(1.1, 1.1, 0.12, std(0xffffff), x, 1.1, z, 16));
      g.add(cyl(0.08, 0.08, 1.1, std(0xdddddd), x, 0.55, z));
      g.add(cyl(0.06, 0.06, 3.2, std(0xdddddd), x, 1.6, z));
      const um = new THREE.Mesh(new THREE.ConeGeometry(2, 0.9, 10), std(col)); um.position.set(x, 3.3, z); g.add(um);
      for (const a of [0, 2.1, 4.2]) g.add(cyl(0.3, 0.3, 0.6, std(0xe8262a), x + Math.cos(a) * 1.6, 0.3, z + Math.sin(a) * 1.6, 8));
    }
    // fila de clientes
    const skin = [0xf2c29a, 0xc68a5a, 0x8a5a3a, 0xf6d2b0];
    const shirt = [0x2f7bff, 0x35d07f, 0xff5fb0, 0xffd23f, 0xffffff];
    for (let k = 0; k < 5; k++) {
      const x = -3 + k * 1.5, z = 0.8 + (k % 2) * 0.4;
      g.add(cyl(0.35, 0.4, 1.3, std(shirt[k % shirt.length]), x, 1.2, z, 8));
      g.add(cyl(0.18, 0.18, 0.6, std(0x333344), x, 0.3, z, 6));
      const hh = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 8), std(skin[k % skin.length])); hh.position.set(x, 2.15, z); g.add(hh);
    }
    // cordão de lâmpadas
    const bulb = glow(0xffe08a, 2);
    for (const side of [-1, 1]) {
      g.add(cyl(0.12, 0.12, 5, std(0x555555), side * 11.5, 2.5, 1.5, 6));
      for (let k = 0; k <= 8; k++) {
        const x = side * (6 + k * 5.5 / 8), y = 5 - Math.sin(k / 8 * Math.PI) * 0.8;
        const bl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), bulb); bl.position.set(x, y, 1.5); g.add(bl);
      }
    }
    place(g, L.t, L.side, L.off, 14, 14, 'Dogão', 26);
  }

  // ---------- Shoppings ----------
  for (const L of def.landmarks.shoppings || []) {
    const g = new THREE.Group();
    const lotD = 22, bw = 74, bh = 17, bd = 44;
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(bw + 6, lotD).rotateX(-Math.PI / 2), std(0x4a4b52, { flatShading: false, roughness: 0.9 }));
    lot.position.set(0, 0.1, -lotD / 2); g.add(lot);
    const line = std(0xf2f2f2);
    for (let x = -bw / 2 + 3; x < bw / 2; x += 3) for (const z of [-5, -16]) { const l = box(0.15, 0.02, 4.6, line, x, 0.13, z); g.add(l); }
    for (let x = -bw / 2 + 4.5; x < bw / 2 - 2; x += 3) for (const z of [-5, -16]) if (rand() < 0.72) parked.push({ obj: g, x, z, rot: rand() < 0.5 ? 0 : Math.PI });
    const zb = -lotD - bd / 2;
    g.add(box(bw, bh, bd, std(L.wall, { roughness: 0.8 }), 0, bh / 2, zb));
    g.add(box(bw + 0.5, 1.4, bd + 0.5, std(L.accent), 0, bh + 0.3, zb));
    const glass = new THREE.MeshStandardMaterial({ color: 0x4f86b0, metalness: 0.7, roughness: 0.12, emissive: 0x2a4870, emissiveIntensity: 0.6 });
    g.add(box(34, 12, 0.6, glass, 0, 7, -lotD + 0.2));
    for (let x = -16; x <= 16; x += 4) g.add(box(0.3, 12, 0.8, std(0xdddddd), x, 7, -lotD + 0.4));
    g.add(box(14, 0.6, 6, std(L.accent), 0, 5, -lotD + 2.6));
    g.add(cyl(0.25, 0.25, 5, std(0xdddddd), -6, 2.5, -lotD + 5));
    g.add(cyl(0.25, 0.25, 5, std(0xdddddd), 6, 2.5, -lotD + 5));
    const atrium = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 22, 20, 1, false), glass);
    atrium.position.set(bw / 2 - 8, 11, -lotD - 6); g.add(atrium);
    const s = sign(L.name, 42, L.signBg, L.signFg, { cw: 1024, ch: 180, glow: 0.8 });
    s.position.set(0, bh + 4.6, -lotD - 0.2); g.add(s);
    // totem
    g.add(box(3, 22, 3, std(L.accent), -bw / 2 + 4, 11, -2));
    const tt = sign('SHOPPING', 9, L.signBg, L.signFg, { cw: 1024, ch: 200 });
    tt.position.set(-bw / 2 + 4, 23.5, -1.2); g.add(tt);
    place(g, L.t, L.side, L.off, lotD + bd, 46, L.name, bw + 6);
  }

  // ---------- Condomínio Jardins do Brasil ----------
  if (def.landmarks.jardins) {
    const L = def.landmarks.jardins;
    const g = new THREE.Group();
    const W = 96, D = 92;
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), std(0x6fbf52, { flatShading: false, roughness: 1 }));
    lawn.position.set(0, 0.08, -D / 2); g.add(lawn);
    const cream = std(0xf1e6cf);
    for (const [w, d, x, z] of [[W, 1, 0, -D], [1, D, -W / 2, -D / 2], [1, D, W / 2, -D / 2], [W / 2 - 7, 1, -W / 4 - 3.5, 0], [W / 2 - 7, 1, W / 4 + 3.5, 0]]) g.add(box(w, 2.6, d, cream, x, 1.3, z));
    // portaria com placa
    for (const x of [-6.5, 6.5]) g.add(box(2.2, 9, 2.2, std(0xd9c8a4), x, 4.5, 0));
    g.add(box(15.4, 2, 2.4, std(0x2a7a3a), 0, 9.6, 0));
    const s = sign('JARDINS DO BRASIL', 14, '#1f8a3a', '#ffe14d', { cw: 1024, ch: 170, glow: 0.8 });
    s.position.set(0, 9.6, 1.2); g.add(s);
    g.add(box(4, 3, 3, std(0xd9c8a4), 9.5, 1.5, -3.5));
    // piscina
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(18, 9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3fc2ff, emissive: 0x1a7ab8, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.2 }));
    pool.position.set(0, 0.2, -46); g.add(pool);
    g.add(box(20, 0.3, 11, std(0xe6ddca), 0, 0.1, -46));
    // playground
    g.add(box(0.3, 4, 0.3, std(0xff4d4d), -10, 2, -34)); g.add(box(0.3, 4, 0.3, std(0xff4d4d), -5, 2, -34));
    g.add(box(5.3, 0.3, 0.3, std(0xffd23f), -7.5, 4, -34));
    const slide = box(1.2, 0.2, 6, std(0x2f7bff), -16, 1.6, -34); slide.rotation.x = 0.5; g.add(slide);
    group.add(g);
    place(g, L.t, L.side, L.off, D, 62, 'Jardins do Brasil', W);
    // torres residenciais (cores do Brasil no topo)
    const crowns = [0x1f8a3a, 0xffd23f, 0x2f5fd0, 0x1f8a3a, 0xffd23f, 0x2f5fd0, 0x1f8a3a, 0xffd23f];
    let k = 0;
    for (const zl of [-24, -68]) for (const xl of [-33, -11, 11, 33]) {
      if (zl === -24 && Math.abs(xl) === 11) continue; // espaço para a piscina/portaria
      const h = 48 + ((k * 7) % 4) * 6;
      const c = world(g, xl, 0, zl);
      blocks.res.push({ x: c.x, y: gl, z: c.z, w: 15, h, d: 15, rot: g.rotation.y, color: 0xffffff });
      placedB.push({ x: c.x, z: c.z, r: 11 });
      const crown = box(15.6, 3, 15.6, std(crowns[k]), 0, 0, 0);
      crown.position.set(c.x, gl + h + 1.5, c.z); crown.rotation.y = g.rotation.y; crown.castShadow = true;
      group.add(crown);
      k++;
    }
    for (let n = 0; n < 16; n++) {
      const c = world(g, (rand() - 0.5) * (W - 8), 0, -4 - rand() * (D - 8));
      trees.push({ x: c.x, z: c.z, s: 0.7 + rand() * 0.5, check: true });
    }
  }

  // ---------- Cidade de Deus (Bradesco) ----------
  if (def.landmarks.bradesco) {
    const L = def.landmarks.bradesco;
    const g = new THREE.Group();
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(110, 80).rotateX(-Math.PI / 2), std(0x5fae48, { flatShading: false, roughness: 1 }));
    lawn.position.set(0, 0.08, -40); g.add(lawn);
    // monumento de entrada
    g.add(box(24, 4.5, 2, std(0xcc092f), 0, 2.25, -3));
    const s1 = sign('CIDADE DE DEUS', 22, '#cc092f', '#ffffff', { cw: 1024, ch: 170, glow: 0.7, frame: 0xcc092f });
    s1.position.set(0, 2.4, -1.8); g.add(s1);
    for (const x of [-18, -14, 14, 18]) {
      g.add(cyl(0.12, 0.12, 12, std(0xdddddd), x, 6, -6));
      const flag = box(3, 1.8, 0.05, std(x < 0 ? 0xcc092f : 0x1f8a3a), x + 1.6, 11, -6); g.add(flag);
    }
    group.add(g);
    place(g, L.t, L.side, L.off, 80, 58, 'Cidade de Deus', 110);
    const add = (xl, zl, w, h, d, kind) => { const c = world(g, xl, 0, zl); blocks[kind].push({ x: c.x, y: gl, z: c.z, w, h, d, rot: g.rotation.y, color: 0xffffff }); placedB.push({ x: c.x, z: c.z, r: Math.max(w, d) * 0.72 }); return c; };
    add(-26, -36, 44, 16, 26, 'office');
    const s3 = sign('BRADESCO', 26, '#cc092f', '#ffffff', { cw: 1024, ch: 200, glow: 0.8, frame: 0xcc092f });
    const s3p = world(g, -26, 0, -22.8);
    s3.position.set(s3p.x, gl + 12, s3p.z); s3.rotation.y = g.rotation.y; group.add(s3);
    add(28, -60, 36, 13, 22, 'office');
    const tc = add(22, -30, 20, 52, 20, 'glass');
    // faixa vermelha e letreiro no alto da torre
    const band = box(20.6, 5, 20.6, std(0xcc092f), 0, 0, 0);
    band.position.set(tc.x, gl + 52 + 2.5, tc.z); band.rotation.y = g.rotation.y; group.add(band);
    const s2 = sign('BRADESCO', 18, '#ffffff', '#cc092f', { cw: 1024, ch: 220, glow: 0.9, frame: 0xcc092f });
    const sp = world(g, 22, 52 + 8.5, -19.6);
    s2.position.set(sp.x, gl + 52 + 8.5, sp.z); s2.rotation.y = g.rotation.y; group.add(s2);
    for (let n = 0; n < 20; n++) {
      const c = world(g, (rand() - 0.5) * 100, 0, -14 - rand() * 64);
      trees.push({ x: c.x, z: c.z, s: 0.8 + rand() * 0.6, check: true });
    }
  }

  // ---------- Praça dos Pombos ----------
  const decoPigeons = new PigeonMeshes(group, 40);
  const statue = new PigeonMeshes(group, 1, 7);
  if (def.landmarks.praca) {
    const L = def.landmarks.praca;
    const g = new THREE.Group();
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(24, 40).rotateX(-Math.PI / 2), std(0x62b24a, { flatShading: false, roughness: 1 }));
    lawn.position.set(0, 0.09, -26); g.add(lawn);
    const path = new THREE.Mesh(new THREE.RingGeometry(9, 12.5, 40).rotateX(-Math.PI / 2), std(0xd9cdb0, { flatShading: false }));
    path.position.set(0, 0.12, -26); g.add(path);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(9, 32).rotateX(-Math.PI / 2), std(0xd9cdb0, { flatShading: false }));
    plaza.position.set(0, 0.12, -26); g.add(plaza);
    g.add(cyl(3, 3.6, 3.5, std(0xbdb6a6), 0, 1.75, -26, 16));
    const pl = sign('PRAÇA DOS POMBOS', 5.2, '#2c3e50', '#ffffff', { cw: 1024, ch: 200, glow: 0.5 });
    pl.position.set(0, 1.9, -22.3); g.add(pl);
    for (const a of [0.6, 2.2, 3.8, 5.4]) {
      const bx = Math.cos(a) * 15, bz = -26 + Math.sin(a) * 15;
      const bench = box(4, 0.3, 1.2, std(0x8a5a2a), bx, 0.9, bz); bench.rotation.y = -a + Math.PI / 2; g.add(bench);
      trees.push({ obj: g, lx: Math.cos(a + 0.4) * 19, lz: -26 + Math.sin(a + 0.4) * 19, s: 1.1 });
    }
    group.add(g);
    place(g, L.t, L.side, L.off, 50, 27, 'Praça', 50);
    const c = world(g, 0, 0, -26);
    // pombo gigante de estátua (o pombo mais famoso de Osasco!)
    statue.set(0, c.x, gl + 3.5, c.z, g.rotation.y + Math.PI, {});
    statue.commit();
    // pombos ciscando em volta
    const walkers = [];
    for (let k = 0; k < 14; k++) walkers.push({ a: rand() * 6.28, r: 5 + rand() * 4, sp: (rand() < 0.5 ? -1 : 1) * (0.05 + rand() * 0.08), ph: rand() * 6 });
    // bandos voando em círculos sobre a cidade
    const flocks = [
      { x: c.x, z: c.z, R: 22, H: 26, n: 10, sp: 0.35 },
      { x: track.center.x, z: track.center.z, R: 60, H: 45, n: 12, sp: 0.22 },
    ];
    track.animated.push((dt, t) => {
      let k = 0;
      for (const w of walkers) {
        w.a += w.sp * dt * (Math.sin(t * 0.7 + w.ph) > 0 ? 1 : 0.2);
        const x = c.x + Math.cos(w.a) * w.r, z = c.z + Math.sin(w.a) * w.r;
        const peck = Math.max(0, Math.sin(t * 5 + w.ph)) ** 6;
        decoPigeons.set(k++, x, gl + 0.12, z, Math.atan2(-Math.sin(w.a) * w.sp, Math.cos(w.a) * w.sp), { peck });
      }
      for (const f of flocks) for (let n = 0; n < f.n; n++) {
        const a = t * f.sp + n * 0.35 + Math.sin(n * 7.1) * 0.2;
        const rr = f.R + Math.sin(n * 3.3) * 5;
        const x = f.x + Math.cos(a) * rr, z = f.z + Math.sin(a) * rr, y = gl + f.H + Math.sin(t * 1.3 + n) * 2 + (n % 3) * 1.5;
        decoPigeons.set(k++, x, y, z, Math.atan2(-Math.sin(a), Math.cos(a)), { fly: true, flap: Math.sin(t * 18 + n * 1.7) * 0.9, pitch: 0 });
      }
      decoPigeons.commit();
    });
  }

  // ---------- Estação Osasco e trem ----------
  if (def.rail) {
    const R = def.rail;
    const len = R.z1 - R.z0, zc = (R.z0 + R.z1) / 2;
    const ballast = new THREE.Mesh(new THREE.PlaneGeometry(7, len).rotateX(-Math.PI / 2), std(0x6a625a, { roughness: 1 }));
    ballast.position.set(R.x, gl + 0.1, zc); ballast.receiveShadow = true; group.add(ballast);
    const steel = std(0xb8bcc4, { metalness: 0.8, roughness: 0.3 });
    for (const dx of [-0.8, 0.8]) group.add(box(0.15, 0.25, len, steel, R.x + dx, gl + 0.35, zc));
    const nSl = Math.floor(len / 1.4);
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.15, 0.3), std(0x5a4030), nSl);
    const m = new THREE.Matrix4();
    for (let k = 0; k < nSl; k++) { m.makeTranslation(R.x, gl + 0.2, R.z0 + k * 1.4); sl.setMatrixAt(k, m); }
    group.add(sl);
    for (let z = R.z0; z <= R.z1; z += 22) reserve(R.x, z, 14);
    // túneis nas pontas
    for (const z of [R.z0, R.z1]) {
      const tn = new THREE.Group();
      tn.add(box(12, 9, 14, std(0x6b665e), 0, 4.5, 0));
      tn.add(box(5.2, 6, 14.2, new THREE.MeshBasicMaterial({ color: 0x0a0a0c }), 0, 3, 0));
      tn.position.set(R.x, gl, z);
      tn.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      group.add(tn);
    }
    // plataforma e cobertura da estação
    const st = new THREE.Group();
    st.add(box(4.5, 1.2, 64, std(0xbdb8ae), 3.9, 0.6, 0));
    st.add(box(0.3, 0.05, 64, std(0xffd23f), 1.9, 1.23, 0));
    for (let z = -28; z <= 28; z += 8) st.add(cyl(0.2, 0.2, 5, std(0x888888, { metalness: 0.6 }), 4.6, 3.6, z, 8));
    const roof = box(7, 0.4, 66, std(0xcc2a2a), 3.5, 6.2, 0); roof.rotation.z = -0.08; st.add(roof);
    const s = sign('ESTAÇÃO OSASCO', 16, '#cc2a2a', '#ffffff', { cw: 1024, ch: 170, glow: 0.7 });
    s.position.set(6.3, 7.8, 0); s.rotation.y = Math.PI / 2; st.add(s);
    st.position.set(R.x, gl, R.station);
    st.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    group.add(st);
    reserve(R.x + 4, R.station, 36);
    // trem prateado com faixa vermelha
    const train = new THREE.Group();
    const silver = std(0xd2d6dc, { metalness: 0.6, roughness: 0.35, flatShading: false });
    const redB = std(0xcc2a2a), win = new THREE.MeshStandardMaterial({ color: 0x223044, emissive: 0xffe6a8, emissiveIntensity: 0.55, roughness: 0.2 });
    const cars = [];
    for (let c = 0; c < 4; c++) {
      const car = new THREE.Group();
      car.position.z = -c * 21;
      car.add(box(3.2, 3.6, 20, silver, 0, 2.6, 0));
      car.add(box(3.25, 0.5, 20.05, redB, 0, 1.6, 0));
      car.add(box(3.25, 1.0, 17, win, 0, 3.3, 0));
      if (c === 0) {
        car.add(box(3.0, 1.6, 0.2, new THREE.MeshStandardMaterial({ color: 0x223044, emissive: 0x335577, emissiveIntensity: 0.4 }), 0, 3.4, 10.05));
        for (const x of [-1, 1]) car.add(box(0.5, 0.3, 0.1, glow(0xfff4d0, 3), x, 1.8, 10.06));
      }
      train.add(car);
      cars.push(car);
    }
    train.traverse(o => { if (o.isMesh) o.castShadow = true; });
    train.position.set(R.x, gl + 0.3, R.z0);
    group.add(train);
    const trainLen = 4 * 21;
    track.animated.push((dt, t) => {
      const cycle = len + trainLen + 200; // passa, entra no túnel e espera um pouco
      const s = (t * 20 + 60) % cycle;
      train.position.z = R.z0 - 10 + s;
      // cada vagão só aparece fora dos túneis
      for (const car of cars) {
        const cz = train.position.z + car.position.z;
        car.visible = cz > R.z0 - 2 && cz < R.z1 + 2;
      }
    });
  }

  // ---------- Prédios ao longo da pista ----------
  const tryBuilding = (x, z, w, d, h, rot, kind) => {
    const r = Math.max(w, d) * 0.72;
    const n = track._nearestCoarse(x, z);
    if (n.d < e + 7 + r) return false;
    if (!isFree(x, z, r)) return false;
    for (const b of placedB) if ((b.x - x) ** 2 + (b.z - z) ** 2 < (b.r + r + 3) ** 2) return false;
    placedB.push({ x, z, r });
    const tints = kind === 'glass' ? [0xffffff, 0xd8e6f5, 0xe6f0ff] : [0xffffff, 0xf5e6d0, 0xe8eef5, 0xf2dcd0, 0xdfe8d8, 0xd0d4dc];
    blocks[kind].push({ x, y: gl, z, w, h, d, rot, color: tints[Math.floor(rand() * tints.length)], tank: rand() < 0.5 });
    return true;
  };
  const step = Math.round(24 / track.spacing);
  for (let i = 0; i < N; i += step) {
    const near = bi !== undefined && Math.abs(((i - bi + N / 2) % N + N) % N - N / 2) * track.spacing < def.bridge.span + 30;
    for (const side of [-1, 1]) {
      for (const [row, dmin, hmin, hmax] of [[0, 16, 10, 26], [1, 46, 18, 42], [2, 80, 26, 64]]) {
        if (near && row === 0) continue;
        if (rand() < 0.18) continue;
        const w = 12 + rand() * 9, d = 12 + rand() * 9;
        const off = e + dmin + d / 2 + rand() * 6;
        const x = track.px[i] + track.rx[i] * side * off, z = track.pz[i] + track.rz[i] * side * off;
        const kind = row === 2 && rand() < 0.4 ? 'glass' : rand() < 0.45 ? 'res' : 'office';
        tryBuilding(x, z, w, d, lerp(hmin, hmax, rand()), Math.atan2(track.tx[i], track.tz[i]), kind);
      }
    }
  }
  // horizonte de prédios mais longe
  for (let k = 0; k < 220; k++) {
    const s = track._randomSpot(e + 110, e + 330, 20);
    if (!s) continue;
    const w = 14 + rand() * 12;
    tryBuilding(s.x, s.z, w, w * (0.8 + rand() * 0.4), 30 + rand() * 60, rand() * Math.PI, rand() < 0.35 ? 'glass' : rand() < 0.5 ? 'res' : 'office');
  }
  // miolo da pista (bairro entre as retas)
  for (let k = 0; k < 160; k++) {
    const s = track._randomSpot(e + 20, e + 110, 20);
    if (!s) continue;
    const w = 12 + rand() * 10;
    tryBuilding(s.x, s.z, w, w * (0.8 + rand() * 0.4), 12 + rand() * 30, Math.atan2(track.tx[s.i], track.tz[s.i]), rand() < 0.5 ? 'res' : 'office');
  }

  for (const [kind, list] of Object.entries(blocks)) {
    if (!list.length) continue;
    const geos = [];
    const col = new THREE.Color();
    for (const b of list) {
      geos.push(buildingGeo(b.w, b.h, b.d, b.x, b.y, b.z, b.rot, col.set(b.color), true, Math.floor(rand() * 4) / 4, Math.floor(rand() * 4) / 4));
      if (b.tank) geos.push(buildingGeo(3, 2.4, 3, b.x + (rand() - 0.5) * b.w * 0.4, b.y + b.h, b.z + (rand() - 0.5) * b.d * 0.4, b.rot, col.set(0xa8a39a), false));
    }
    const merged = mergeGeometries(geos);
    geos.forEach(g => g.dispose());
    const tx = facadeTextures(kind, kind.length * 1031 + 7);
    const mat = new THREE.MeshStandardMaterial({
      map: tx.map, emissiveMap: tx.emissiveMap, emissive: 0xffffff, emissiveIntensity: kind === 'glass' ? 0.6 : 0.9, vertexColors: true,
      roughness: kind === 'glass' ? 0.25 : 0.8, metalness: kind === 'glass' ? 0.4 : 0,
    });
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  }

  // ---------- Postes e árvores de calçada ----------
  const lampStep = Math.round(26 / track.spacing);
  for (let i = 0; i < N; i += lampStep) {
    if (Math.abs(i) < 8 || N - i < 8) continue;
    const nearBridge = bi !== undefined && Math.abs(((i - bi + N / 2) % N + N) % N - N / 2) * track.spacing < def.bridge.span + 4;
    for (const side of [-1, 1]) {
      const lat = side * (e + 1.4);
      if (!nearBridge) lamps.push({ i, side, x: track.px[i] + track.rx[i] * lat, z: track.pz[i] + track.rz[i] * lat, y: track.py[i] + 1.1 });
      const j = track.wrap(i + Math.round(lampStep / 2));
      const tl = side * (e + 6);
      const tx2 = track.px[j] + track.rx[j] * tl, tz2 = track.pz[j] + track.rz[j] * tl;
      if (!nearBridge && track._nearestCoarse(tx2, tz2).d > e + 4) trees.push({ x: tx2, z: tz2, s: 0.75 + rand() * 0.3, check: true, y: track.py[j] - 0.9 });
    }
  }
  if (lamps.length) {
    const pole = std(0x5a5f6a, { metalness: 0.5, roughness: 0.4 });
    const parts = [
      { geo: new THREE.CylinderGeometry(0.14, 0.2, 8, 6).translate(0, 4, 0), mat: pole },
      { geo: new THREE.BoxGeometry(2.6, 0.16, 0.16).translate(1.2, 7.9, 0), mat: pole },
      { geo: new THREE.BoxGeometry(1.1, 0.25, 0.5).translate(2.3, 7.8, 0), mat: glow(0xfff0c8, 2.2) },
    ];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    for (const p of parts) {
      const im = new THREE.InstancedMesh(p.geo, p.mat, lamps.length);
      lamps.forEach((l, k) => {
        const dx = -l.side * track.rx[l.i], dz = -l.side * track.rz[l.i];
        q.setFromAxisAngle(UP, Math.atan2(-dz, dx));
        m.compose(v.set(l.x, l.y - 1.3, l.z), q, s);
        im.setMatrixAt(k, m);
      });
      im.castShadow = p.mat === pole;
      group.add(im);
    }
  }
  const treeList = trees.map(t => {
    if (t.obj) { const w = world(t.obj, t.lx, 0, t.lz); return { x: w.x, z: w.z, s: t.s, y: gl }; }
    return t;
  }).filter(t => !t.check || placedB.every(b => (b.x - t.x) ** 2 + (b.z - t.z) ** 2 > (b.r + 2) ** 2));
  if (treeList.length) {
    const leaf = std(0xffffff);
    const parts = [
      { geo: new THREE.CylinderGeometry(0.25, 0.4, 3.4, 6).translate(0, 1.7, 0), mat: std(0x6a4a2a) },
      { geo: new THREE.IcosahedronGeometry(2.3, 0).translate(0, 4.6, 0), mat: leaf, colors: ['#3f9e3a', '#4cb043', '#2f8a34', '#5aa83f'] },
      { geo: new THREE.IcosahedronGeometry(1.6, 0).translate(0.9, 5.8, 0.3), mat: leaf, colors: ['#52b848', '#3a9a3a'] },
    ];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    for (const p of parts) {
      const im = new THREE.InstancedMesh(p.geo, p.mat, treeList.length);
      treeList.forEach((t, k) => {
        q.setFromAxisAngle(UP, k * 2.4);
        m.compose(v.set(t.x, t.y ?? gl, t.z), q, s.setScalar(t.s));
        im.setMatrixAt(k, m);
        if (p.colors) im.setColorAt(k, new THREE.Color(p.colors[k % p.colors.length]));
      });
      im.castShadow = true;
      group.add(im);
    }
  }
  // carros estacionados
  if (parked.length) {
    const carCols = [0xd62d2d, 0xf2f2f2, 0x2b2b30, 0x2f6fd6, 0xc9c9cf, 0xf0c419, 0x1e8a5a, 0x8a8f99];
    const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.0, 4.2).translate(0, 0.75, 0), std(0xffffff, { roughness: 0.35, metalness: 0.4, flatShading: false }), parked.length);
    const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.8, 2.2).translate(0, 1.6, -0.3), std(0x1d2733, { roughness: 0.2, metalness: 0.5 }), parked.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    parked.forEach((p, k) => {
      const w = world(p.obj, p.x, 0, p.z);
      q.setFromAxisAngle(UP, p.obj.rotation.y + p.rot);
      m.compose(w, q, s);
      body.setMatrixAt(k, m); cab.setMatrixAt(k, m);
      body.setColorAt(k, new THREE.Color(carCols[k % carCols.length]));
    });
    body.castShadow = true;
    group.add(body, cab);
  }

  if (warn.length) console.warn('[Osasco] ' + warn.join(' | '));
  track.cityInfo = { buildings: Object.values(blocks).reduce((a, l) => a + l.length, 0), trees: treeList.length, lamps: lamps.length, warn };
}

// Junta as peças soltas de um grupo (mesmo material) numa malha só: bem menos trabalho para o celular.
function mergeInto(parent, g) {
  const byMat = new Map();
  for (const m of g.children) {
    if (!m.isMesh) continue;
    m.updateMatrix();
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    geo.applyMatrix4(m.matrix);
    if (!byMat.has(m.material)) byMat.set(m.material, []);
    byMat.get(m.material).push(geo);
  }
  for (const [mat, geos] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
    mesh.castShadow = true;
    parent.add(mesh);
    geos.forEach(x => x.dispose());
  }
}

// Caixa de prédio com UV em metros (janelas do mesmo tamanho em qualquer prédio).
function buildingGeo(w, h, d, x, y, z, rot, color, windows, ou = 0, ov = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (!windows || f === 2 || f === 3) { uv.setXY(i, 0.004, 0.004); continue; }
      const fw = f < 2 ? d : w;
      uv.setXY(i, ou + uv.getX(i) * Math.max(1, Math.round(fw / 4)) / 4, ov + uv.getY(i) * Math.max(1, Math.round(h / 3.5)) / 4);
    }
  }
  g.translate(0, h / 2, 0);
  g.rotateY(rot);
  g.translate(x, y, z);
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
