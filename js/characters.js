// Personagens e construção procedural dos karts 3D.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { blobShadowTexture } from './textures.js';

export const CHARACTERS = [
  { id: 'leo', name: 'Leo', species: 'Leão', color: '#ff3b3b', accent: '#ffd23f', shirt: '#ffffff', stats: { speed: 3, accel: 3, handling: 3, weight: 3 } },
  { id: 'mari', name: 'Mari', species: 'Gatinha', color: '#ff5fb0', accent: '#ffffff', shirt: '#b04dff', stats: { speed: 3, accel: 4, handling: 4, weight: 2 } },
  { id: 'pipo', name: 'Pipo', species: 'Panda', color: '#20b86a', accent: '#f2f2f2', shirt: '#ff7a1a', stats: { speed: 4, accel: 2, handling: 3, weight: 5 } },
  { id: 'tuti', name: 'Tuti', species: 'Sapo', color: '#ffc21a', accent: '#6bd12a', shirt: '#2f7bff', stats: { speed: 2, accel: 5, handling: 5, weight: 1 } },
  { id: 'fifi', name: 'Fifi', species: 'Raposa', color: '#ff7b1c', accent: '#2a2a3a', shirt: '#2fd0c0', stats: { speed: 4, accel: 3, handling: 3, weight: 3 } },
  { id: 'bento', name: 'Bento', species: 'Coelho', color: '#3f9dff', accent: '#ffffff', shirt: '#ff4d6d', stats: { speed: 3, accel: 5, handling: 4, weight: 1 } },
  { id: 'pingo', name: 'Pingo', species: 'Pinguim', color: '#20d5ec', accent: '#1e293b', shirt: '#ffd23f', stats: { speed: 4, accel: 3, handling: 4, weight: 2 } },
  { id: 'rex', name: 'Rex', species: 'Dino', color: '#8b5cf6', accent: '#b6f03a', shirt: '#ff3b3b', stats: { speed: 5, accel: 2, handling: 2, weight: 5 } },
];

const geoCache = new Map();
function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}
const rbox = (w, h, d, r) => geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 4, r));
const sphere = (r, ws = 20, hs = 14) => geo(`s${r},${ws}`, () => new THREE.SphereGeometry(r, ws, hs));
const cyl = (rt, rb, h, s = 16) => geo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const cone = (r, h, s = 12) => geo(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));

function M(g, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  return m;
}

const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

const shared = {};
function sharedMats() {
  if (shared.dark) return shared;
  shared.dark = std(0x23232f, 0.75);
  shared.rubber = std(0x1a1a1f, 0.9);
  shared.chrome = std(0xe8e8f0, 0.22, 1);
  shared.metal = std(0x8a8fa0, 0.35, 0.8);
  shared.white = std(0xffffff, 0.4);
  shared.black = std(0x111111, 0.3);
  shared.eyeShine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  shared.light = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffe066, emissiveIntensity: 1.5 });
  shared.tail = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 0.8 });
  shared.pink = std(0xff9ec4, 0.6);
  shared.shadowTex = blobShadowTexture();
  shared.shadow = new THREE.MeshBasicMaterial({ map: shared.shadowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  shared.flame = new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  shared.flameCore = new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  shared.shield = new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  shared.shieldWire = new THREE.MeshBasicMaterial({ color: 0xaaf4ff, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false });
  return shared;
}

function addEyes(g, s, y = 0.08, z = 0.36, spread = 0.16, size = 0.12) {
  for (const sx of [-1, 1]) {
    const w = M(sphere(size), s.white, sx * spread, y, z);
    w.scale.set(1, 1.15, 0.7);
    g.add(w);
    const p = M(sphere(size * 0.55), s.black, sx * spread, y - 0.01, z + size * 0.62);
    g.add(p);
    g.add(M(sphere(size * 0.2, 8, 6), s.eyeShine, sx * spread - size * 0.18, y + size * 0.3, z + size * 0.95, false));
  }
}

// Cabeças dos bichinhos (olhando para +Z).
function buildHead(ch) {
  const s = sharedMats();
  const g = new THREE.Group();
  switch (ch.id) {
    case 'leo': {
      const fur = std(0xf6b93b, 0.7), mane = std(0xb35a17, 0.85), muzzle = std(0xfff0d0, 0.7);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        g.add(M(sphere(0.2, 10, 8), mane, Math.cos(a) * 0.43, Math.sin(a) * 0.43 + 0.02, -0.08));
      }
      g.add(M(sphere(0.42), fur));
      for (const sx of [-1, 1]) g.add(M(sphere(0.12, 10, 8), fur, sx * 0.3, 0.32, 0.02));
      const mz = M(sphere(0.2), muzzle, 0, -0.12, 0.33); mz.scale.set(1.3, 0.85, 0.8); g.add(mz);
      g.add(M(sphere(0.07, 10, 8), std(0x5a2a10), 0, -0.04, 0.5));
      addEyes(g, s, 0.1, 0.33);
      break;
    }
    case 'mari': {
      const fur = std(0xfff3f8, 0.7);
      g.add(M(sphere(0.42), fur));
      for (const sx of [-1, 1]) {
        const e = M(cone(0.15, 0.3, 10), fur, sx * 0.25, 0.38, 0); e.rotation.z = -sx * 0.35; g.add(e);
        const ei = M(cone(0.08, 0.18, 8), s.pink, sx * 0.25, 0.37, 0.05); ei.rotation.z = -sx * 0.35; g.add(ei);
        for (const wy of [-0.1, -0.16]) {
          const w = M(cyl(0.008, 0.008, 0.35, 4), s.dark, sx * 0.3, wy, 0.33); w.rotation.z = Math.PI / 2 + sx * (wy + 0.13) * 1.5; g.add(w);
        }
      }
      g.add(M(sphere(0.05, 8, 6), s.pink, 0, -0.06, 0.42));
      const bow = std(0xff2d8a, 0.5);
      for (const sx of [-1, 1]) { const b = M(cone(0.1, 0.18, 8), bow, 0.18 + sx * 0.1, 0.42, 0.12); b.rotation.z = sx * Math.PI / 2; g.add(b); }
      g.add(M(sphere(0.05, 8, 6), bow, 0.18, 0.42, 0.12));
      addEyes(g, s, 0.08, 0.34);
      break;
    }
    case 'pipo': {
      const fur = std(0xfafafa, 0.8), blk = std(0x1c1c22, 0.8);
      g.add(M(sphere(0.43), fur));
      for (const sx of [-1, 1]) {
        g.add(M(sphere(0.14, 10, 8), blk, sx * 0.3, 0.34, -0.02));
        const patch = M(sphere(0.14, 12, 8), blk, sx * 0.16, 0.06, 0.32); patch.scale.set(0.9, 1.2, 0.6); patch.rotation.z = sx * 0.4; g.add(patch);
      }
      const mz = M(sphere(0.16), fur, 0, -0.14, 0.34); mz.scale.set(1.2, 0.8, 0.8); g.add(mz);
      g.add(M(sphere(0.06, 10, 8), blk, 0, -0.08, 0.46));
      addEyes(g, s, 0.07, 0.4, 0.16, 0.08);
      break;
    }
    case 'tuti': {
      const skin = std(0x5fcf3a, 0.5), belly = std(0xd8f59a, 0.6);
      const h = M(sphere(0.42), skin); h.scale.set(1.15, 0.8, 1); g.add(h);
      for (const sx of [-1, 1]) {
        g.add(M(sphere(0.17), skin, sx * 0.22, 0.3, 0.12));
        const cheek = M(sphere(0.07, 8, 6), s.pink, sx * 0.33, -0.08, 0.3); cheek.scale.z = 0.4; g.add(cheek);
      }
      addEyes(g, s, 0.33, 0.24, 0.22, 0.13);
      const mouth = M(new THREE.TorusGeometry(0.2, 0.025, 6, 20, Math.PI), std(0x8a1a2a), 0, -0.08, 0.38);
      mouth.rotation.z = Math.PI; g.add(mouth);
      const chin = M(sphere(0.25), belly, 0, -0.18, 0.12); chin.scale.set(1.3, 0.5, 1); g.add(chin);
      break;
    }
    case 'fifi': {
      const fur = std(0xff7b1c, 0.7), white = std(0xfff6ea, 0.7), tip = std(0x2a1a14, 0.8);
      g.add(M(sphere(0.42), fur));
      for (const sx of [-1, 1]) {
        const e = M(cone(0.16, 0.42, 10), fur, sx * 0.26, 0.42, -0.02); e.rotation.z = -sx * 0.3; g.add(e);
        const t = M(cone(0.07, 0.14, 8), tip, sx * 0.34, 0.6, -0.02); t.rotation.z = -sx * 0.3; g.add(t);
        const ch = M(sphere(0.17), white, sx * 0.2, -0.15, 0.24); ch.scale.set(1, 0.8, 0.9); g.add(ch);
      }
      const sn = M(cone(0.17, 0.4, 14), white, 0, -0.1, 0.46); sn.rotation.x = Math.PI / 2; g.add(sn);
      g.add(M(sphere(0.06, 8, 6), tip, 0, -0.1, 0.66));
      addEyes(g, s, 0.1, 0.34, 0.17, 0.1);
      break;
    }
    case 'bento': {
      const fur = std(0xe9e6f2, 0.8);
      g.add(M(sphere(0.42), fur));
      for (const sx of [-1, 1]) {
        const e = M(new THREE.CapsuleGeometry(0.09, 0.5, 4, 10), fur, sx * 0.15, 0.7, -0.05); e.rotation.z = -sx * 0.15; g.add(e);
        const ei = M(new THREE.CapsuleGeometry(0.045, 0.42, 4, 8), s.pink, sx * 0.15, 0.7, 0.03); ei.rotation.z = -sx * 0.15; g.add(ei);
        const ch = M(sphere(0.12), fur, sx * 0.1, -0.12, 0.34); ch.scale.set(1, 0.8, 0.8); g.add(ch);
      }
      g.add(M(sphere(0.05, 8, 6), s.pink, 0, -0.04, 0.44));
      g.add(M(new THREE.BoxGeometry(0.1, 0.1, 0.03), s.white, 0, -0.24, 0.39));
      addEyes(g, s, 0.1, 0.33);
      break;
    }
    case 'pingo': {
      const blk = std(0x1f2433, 0.6), face = std(0xffffff, 0.6), beak = std(0xffa41a, 0.5);
      g.add(M(sphere(0.43), blk));
      const f = M(sphere(0.36), face, 0, -0.04, 0.12); f.scale.set(1.05, 0.95, 0.9); g.add(f);
      const b = M(cone(0.1, 0.26, 10), beak, 0, -0.06, 0.52); b.rotation.x = Math.PI / 2; g.add(b);
      for (const sx of [-1, 1]) { const c = M(sphere(0.06, 8, 6), s.pink, sx * 0.24, -0.12, 0.36); c.scale.z = 0.4; g.add(c); }
      addEyes(g, s, 0.1, 0.4, 0.14, 0.09);
      const hat = std(0xff3b3b, 0.7);
      g.add(M(cyl(0.2, 0.34, 0.2, 18), hat, 0, 0.38, 0));
      g.add(M(sphere(0.09, 10, 8), s.white, 0, 0.52, 0));
      break;
    }
    case 'rex': {
      const skin = std(0x3fbf6a, 0.55), belly = std(0xd9f7a0, 0.6), spike = std(0xffb020, 0.5);
      const h = M(sphere(0.42), skin); h.scale.set(1, 0.95, 1.1); g.add(h);
      const sn = M(sphere(0.3), skin, 0, -0.1, 0.36); sn.scale.set(1.1, 0.8, 1.1); g.add(sn);
      const jaw = M(sphere(0.26), belly, 0, -0.22, 0.32); jaw.scale.set(1.1, 0.5, 1.1); g.add(jaw);
      for (let i = 0; i < 4; i++) {
        const k = M(cone(0.09, 0.22, 8), spike, 0, 0.44 - i * 0.05, 0.1 - i * 0.2); k.rotation.x = -0.4 - i * 0.25; g.add(k);
      }
      for (const sx of [-1, 1]) {
        g.add(M(sphere(0.03, 6, 4), s.black, sx * 0.1, -0.02, 0.66));
        const t = M(cone(0.03, 0.08, 6), s.white, sx * 0.14, -0.2, 0.58); t.rotation.x = Math.PI; g.add(t);
      }
      addEyes(g, s, 0.17, 0.3, 0.2, 0.11);
      break;
    }
  }
  return g;
}

// Monta o kart completo. O grupo `root` fica no chão e aponta para +Z.
export function buildKart(ch) {
  const s = sharedMats();
  const paint = new THREE.MeshPhysicalMaterial({ color: ch.color, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12 });
  const accent = new THREE.MeshPhysicalMaterial({ color: ch.accent, roughness: 0.4, metalness: 0.1, clearcoat: 0.6 });
  const shirt = std(ch.shirt, 0.7);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  body.add(M(rbox(1.9, 0.2, 2.9, 0.08), s.dark, 0, 0.42, 0));
  body.add(M(rbox(1.5, 0.5, 2.2, 0.2), paint, 0, 0.72, -0.1));
  const nose = M(rbox(1.2, 0.36, 1.05, 0.16), paint, 0, 0.64, 1.2); nose.rotation.x = 0.12; body.add(nose);
  const stripe = M(rbox(0.36, 0.38, 1.1, 0.14), accent, 0, 0.67, 1.2); stripe.rotation.x = 0.12; body.add(stripe);
  body.add(M(rbox(1.95, 0.2, 0.32, 0.09), accent, 0, 0.46, 1.65));
  for (const sx of [-1, 1]) {
    body.add(M(rbox(0.36, 0.38, 1.4, 0.15), accent, sx * 0.88, 0.62, -0.1));
    body.add(M(sphere(0.09, 10, 8), s.light, sx * 0.42, 0.72, 1.7, false));
    body.add(M(new THREE.BoxGeometry(0.22, 0.1, 0.05), s.tail, sx * 0.55, 0.78, -1.44, false));
  }
  const seat = M(rbox(0.95, 0.95, 0.28, 0.12), s.dark, 0, 1.12, -0.62); seat.rotation.x = -0.2; body.add(seat);
  body.add(M(rbox(1.0, 0.45, 0.6, 0.1), s.metal, 0, 0.82, -1.12));
  const exhaustTips = [];
  for (const sx of [-1, 1]) {
    const p = M(cyl(0.1, 0.12, 0.6, 12), s.chrome, sx * 0.32, 0.9, -1.5); p.rotation.x = Math.PI / 2 - 0.25; body.add(p);
    exhaustTips.push(new THREE.Vector3(sx * 0.32, 0.98, -1.82));
  }
  // aerofólio
  body.add(M(rbox(1.85, 0.08, 0.42, 0.04), paint, 0, 1.4, -1.35));
  for (const sx of [-1, 1]) body.add(M(new THREE.BoxGeometry(0.08, 0.5, 0.12), s.dark, sx * 0.6, 1.14, -1.32));
  // volante
  const wheelS = M(new THREE.TorusGeometry(0.2, 0.045, 8, 20), s.dark, 0, 1.18, 0.32); wheelS.rotation.x = -1.0; body.add(wheelS);
  const col = M(cyl(0.04, 0.04, 0.4, 6), s.dark, 0, 1.02, 0.45); col.rotation.x = -0.9; body.add(col);

  // rodas
  const wheels = [];
  const spinners = [];
  const steerPivots = [];
  const wheelDefs = [
    { x: 1.0, z: 1.02, r: 0.38, w: 0.34, front: true },
    { x: -1.0, z: 1.02, r: 0.38, w: 0.34, front: true },
    { x: 1.02, z: -0.95, r: 0.47, w: 0.44, front: false },
    { x: -1.02, z: -0.95, r: 0.47, w: 0.44, front: false },
  ];
  for (const wd of wheelDefs) {
    const pivot = new THREE.Group();
    pivot.position.set(wd.x, wd.r, wd.z);
    const spin = new THREE.Group();
    pivot.add(spin);
    const tire = M(geo(`tire${wd.r}`, () => new THREE.CylinderGeometry(wd.r, wd.r, wd.w, 24).rotateZ(Math.PI / 2)), s.rubber);
    spin.add(tire);
    const rim = M(geo(`rim${wd.r}`, () => new THREE.CylinderGeometry(wd.r * 0.62, wd.r * 0.62, wd.w + 0.02, 18).rotateZ(Math.PI / 2)), s.chrome);
    spin.add(rim);
    for (let k = 0; k < 2; k++) {
      const sp = M(new THREE.BoxGeometry(wd.w + 0.04, wd.r * 1.1, 0.09), accent);
      sp.rotation.x = k * Math.PI / 2;
      spin.add(sp);
    }
    body.add(pivot);
    wheels.push(pivot);
    spinners.push({ g: spin, r: wd.r });
    if (wd.front) steerPivots.push(pivot);
  }

  // piloto
  const driver = new THREE.Group();
  driver.position.set(0, 0.95, -0.25);
  const torso = M(sphere(0.36), shirt, 0, 0.35, 0); torso.scale.set(1.05, 1.1, 0.85); driver.add(torso);
  for (const sx of [-1, 1]) {
    const arm = M(new THREE.CapsuleGeometry(0.09, 0.42, 4, 8), shirt, sx * 0.3, 0.42, 0.25);
    arm.rotation.x = -1.15; arm.rotation.z = sx * 0.25; driver.add(arm);
    driver.add(M(sphere(0.1, 10, 8), s.white, sx * 0.2, 0.26, 0.55));
  }
  const head = buildHead(ch);
  head.position.set(0, 0.98, 0.05);
  driver.add(head);
  body.add(driver);

  // sombra de disco
  const shadow = new THREE.Mesh(geo('shadowPlane', () => new THREE.PlaneGeometry(2.8, 3.6).rotateX(-Math.PI / 2)), s.shadow);
  shadow.position.y = 0.04;
  shadow.renderOrder = 1;
  root.add(shadow);

  // fogo do escapamento
  const flames = [];
  for (const tip of exhaustTips) {
    const f = new THREE.Group();
    f.position.copy(tip);
    const outer = new THREE.Mesh(geo('flameO', () => new THREE.ConeGeometry(0.18, 0.9, 10).rotateX(-Math.PI / 2).translate(0, 0, -0.45)), s.flame);
    const inner = new THREE.Mesh(geo('flameI', () => new THREE.ConeGeometry(0.09, 0.5, 8).rotateX(-Math.PI / 2).translate(0, 0, -0.25)), s.flameCore);
    f.add(outer, inner);
    f.visible = false;
    body.add(f);
    flames.push(f);
  }

  // escudo
  const shield = new THREE.Group();
  shield.add(new THREE.Mesh(geo('shieldS', () => new THREE.SphereGeometry(2.0, 24, 16)), s.shield));
  shield.add(new THREE.Mesh(geo('shieldW', () => new THREE.IcosahedronGeometry(2.05, 1)), s.shieldWire));
  shield.position.y = 1.0;
  shield.visible = false;
  root.add(shield);

  root.traverse(o => { if (o.isMesh && o !== shadow) o.receiveShadow = false; });

  return { root, body, driver, head, spinners, steerPivots, flames, shield, shadow, paint, accent, exhaustTips };
}
