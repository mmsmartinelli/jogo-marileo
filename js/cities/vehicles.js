// Veículos e bichos que atravessam a rua nas cidades (obstáculos "rolantes").
// Todos olham para +z (frente) e são juntados em poucas malhas.
import * as THREE from 'three';
import { makeMaterials, box, cyl, cone, sphere, geo, bakeObject, person } from './common.js';

const wheel = (P, x, y, z, r = 0.45) => { const w = cyl(r, r, 0.3, P(0x222226), x, y, z, 10); w.rotation.z = Math.PI / 2; return w; };

// Cada um devolve { obj, radius, parts: [deslocamentos ao longo do comprimento], hop?: pula, wobble? }
const BUILD = {
  taxi(P, M) {
    const g = new THREE.Group();
    g.add(box(2.1, 1.0, 4.6, P(0xffc81a, 'smooth'), 0, 0.85, 0));
    g.add(box(1.85, 0.8, 2.4, P(0x1d2733, 'metal'), 0, 1.75, -0.2));
    g.add(box(1.9, 0.12, 2.5, P(0xffc81a, 'smooth'), 0, 2.2, -0.2));
    g.add(box(0.9, 0.35, 0.4, P(0xfff4c0, 'neon'), 0, 2.45, -0.2));
    g.add(box(2.12, 0.18, 4.62, P(0x222222), 0, 0.7, 0));
    for (const x of [-0.9, 0.9]) g.add(box(0.4, 0.25, 0.1, P(0xfff4d0, 'glow'), x, 0.95, 2.31));
    for (const x of [-1.05, 1.05]) for (const z of [-1.4, 1.4]) g.add(wheel(P, x, 0.45, z));
    return { obj: g, radius: 1.5, parts: [-1.2, 1.2] };
  },
  supercarro(P, M) {
    const g = new THREE.Group();
    g.add(box(2.2, 0.7, 4.8, P(0xe8b830, 'metal'), 0, 0.6, 0));
    g.add(box(1.8, 0.55, 1.9, P(0x1d2733, 'metal'), 0, 1.2, -0.3));
    g.add(box(2.2, 0.15, 0.6, P(0x111111), 0, 1.15, -2.2));
    for (const x of [-0.85, 0.85]) g.add(box(0.5, 0.18, 0.1, P(0xfff4d0, 'glow'), x, 0.7, 2.41));
    for (const x of [-1.05, 1.05]) for (const z of [-1.5, 1.5]) g.add(wheel(P, x, 0.4, z, 0.4));
    return { obj: g, radius: 1.45, parts: [-1.2, 1.2] };
  },
  bus(P, M) {
    const g = new THREE.Group();
    const red = P(0xd6202a, 'smooth');
    g.add(box(2.5, 2.0, 7.6, red, 0, 1.45, 0));
    g.add(box(2.5, 1.8, 7.6, red, 0, 3.4, 0));
    for (const y of [1.75, 3.55]) g.add(box(2.55, 0.8, 6.8, P(0x2a3444, 'lit'), 0, y, -0.2));
    g.add(box(2.4, 0.2, 7.5, P(0xf2f2f2), 0, 4.35, 0));
    g.add(box(2.55, 0.35, 7.62, P(0xffd23f), 0, 2.5, 0));
    for (const x of [-0.85, 0.85]) g.add(box(0.4, 0.3, 0.1, P(0xfff4d0, 'glow'), x, 0.9, 3.81));
    for (const x of [-1.15, 1.15]) for (const z of [-2.5, 2.4]) g.add(wheel(P, x, 0.5, z, 0.55));
    return { obj: g, radius: 1.7, parts: [-2.4, 0, 2.4] };
  },
  bonde(P, M) {
    const g = new THREE.Group();
    const yel = P(0xffc81a, 'smooth');
    g.add(box(2.6, 0.9, 7, yel, 0, 1.0, 0));
    g.add(box(2.7, 0.3, 7.4, P(0x2a6a3a), 0, 3.4, 0));
    for (const z of [-3.2, -1.1, 1.1, 3.2]) for (const x of [-1.2, 1.2]) g.add(box(0.2, 1.9, 0.2, yel, x, 2.3, z));
    g.add(box(2.2, 0.4, 6.4, P(0x8a5a2a), 0, 1.6, 0));
    for (let k = 0; k < 4; k++) g.add(person(M, (k % 2 - 0.5) * 1.2, -2.4 + k * 1.6, [0x2f7bff, 0xff5fb0, 0x35d07f, 0xffffff][k], 0xc68a5a, 0.7)).children.at(-1).position.y = 1.2;
    g.add(box(0.12, 1.4, 0.12, P(0x333333), 0, 4.3, 0));
    for (const z of [-2.4, 2.4]) for (const x of [-0.9, 0.9]) g.add(wheel(P, x, 0.4, z, 0.4));
    return { obj: g, radius: 1.7, parts: [-2.2, 2.2] };
  },
  crepe(P, M) {
    const g = new THREE.Group();
    g.add(box(1.8, 1.5, 3.2, P(0xf6f2ea), 0, 1.4, 0));
    g.add(box(1.85, 0.3, 3.25, P(0x2050c0), 0, 2.0, 0));
    for (let k = 0; k < 6; k++) { const a = box(2.2, 0.12, 3.6 / 6, P(k % 2 ? 0xffffff : 0xe02030), 0, 3.4, -1.5 + k * 0.6); g.add(a); }
    for (const z of [-1.4, 1.4]) g.add(cyl(0.06, 0.06, 1.4, P(0xcccccc), 0.8, 2.7, z, 4));
    const c = geo(new THREE.ConeGeometry(0.9, 1.6, 10).rotateZ(-Math.PI / 2), P(0xf0b860, 'smooth'), 0, 2.7, 0); g.add(c);
    g.add(sphere(0.35, P(0x6a3a1a, 'smooth'), 0.6, 2.95, 0, 6, 4));
    for (const z of [-1.1, 1.1]) g.add(wheel(P, 0.95, 0.45, z));
    for (const z of [-1.1, 1.1]) g.add(wheel(P, -0.95, 0.45, z));
    return { obj: g, radius: 1.9, parts: [0] };
  },
  ramen(P, M) {
    const g = new THREE.Group();
    g.add(box(1.8, 1.4, 3.4, P(0x8a5a2a), 0, 1.3, 0));
    g.add(box(1.9, 0.2, 3.5, P(0x5a3a1a), 0, 2.1, 0));
    for (const z of [-1.5, 1.5]) g.add(box(0.12, 1.8, 0.12, P(0x5a3a1a), 0.8, 3, z));
    g.add(box(2.4, 0.2, 3.9, P(0x3a2a20), 0.2, 3.9, 0));
    for (let k = 0; k < 4; k++) g.add(box(0.06, 0.9, 0.8, P(0x1f3a8a), 1.0, 3.3, -1.2 + k * 0.8));
    g.add(sphere(0.45, P(0xff3a2a, 'neon'), 1.2, 3.1, 1.6, 8, 6));
    g.add(cyl(0.5, 0.5, 0.5, P(0xf6f2ea), 0, 2.4, -0.6, 10));
    for (const z of [-1.1, 1.1]) g.add(wheel(P, -0.95, 0.5, z, 0.5));
    return { obj: g, radius: 1.9, parts: [0] };
  },
  tuktuk(P, M) {
    const g = new THREE.Group();
    g.add(box(1.7, 1.0, 3, P(0x1fae5c, 'smooth'), 0, 0.9, -0.2));
    g.add(box(1.8, 0.15, 3.1, P(0xffd23f), 0, 2.6, -0.3));
    for (const [x, z] of [[-0.8, -1.6], [0.8, -1.6], [-0.8, 0.8], [0.8, 0.8]]) g.add(box(0.12, 1.6, 0.12, P(0x222222), x, 1.8, z));
    g.add(box(1.7, 1.0, 0.1, P(0x9ad0f0, 'glass'), 0, 1.9, 1.2));
    g.add(box(1.2, 0.8, 0.9, P(0x1fae5c, 'smooth'), 0, 0.8, 1.6));
    g.add(person(M, 0, 0.6, 0xffffff, 0x8a5a3a, 0.75)).children.at(-1).position.y = 0.5;
    g.add(wheel(P, 0, 0.4, 1.9, 0.4));
    for (const x of [-0.85, 0.85]) g.add(wheel(P, x, 0.4, -1.2, 0.4));
    return { obj: g, radius: 1.7, parts: [0] };
  },
  riquixa(P, M) {
    const g = new THREE.Group();
    g.add(box(1.6, 0.9, 1.6, P(0xc8202a, 'smooth'), 0, 1.3, -0.8));
    const hood = geo(new THREE.CylinderGeometry(1, 1, 1.7, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), P(0x222222, 'twoSided'), 0, 2.0, -1.0); g.add(hood);
    for (const x of [-0.95, 0.95]) g.add(wheel(P, x, 0.75, -0.8, 0.75));
    g.add(box(0.1, 0.1, 2.4, P(0xc8202a), 0.5, 1.0, 1.0)); g.add(box(0.1, 0.1, 2.4, P(0xc8202a), -0.5, 1.0, 1.0));
    g.add(wheel(P, 0, 0.4, 2.2, 0.4));
    g.add(person(M, 0, 1.6, 0x2f7bff, 0xf2c29a, 0.8));
    g.add(geo(new THREE.ConeGeometry(0.6, 0.35, 10), P(0xe8c060), 0, 2.15, 1.6));
    return { obj: g, radius: 1.7, parts: [0] };
  },
  vespa(P, M) {
    const g = new THREE.Group();
    const mint = P(0x8fe0c8, 'smooth');
    g.add(box(0.7, 0.7, 1.8, mint, 0, 0.8, -0.2));
    g.add(box(0.7, 1.1, 0.4, mint, 0, 1.0, 0.8));
    g.add(box(0.9, 0.15, 0.2, P(0xcccccc, 'metal'), 0, 1.65, 0.85));
    g.add(box(0.5, 0.3, 1, P(0x6a3a2a), 0, 1.3, -0.5));
    g.add(person(M, 0, -0.3, 0xffffff, 0xf2c29a, 0.8)).children.at(-1).position.y = 0.4;
    g.add(sphere(0.32, P(0xe02030, 'smooth'), 0, 2.6, -0.3, 8, 6, Math.PI / 2));
    for (const z of [-0.9, 0.9]) g.add(wheel(P, 0, 0.35, z, 0.35));
    return { obj: g, radius: 1.3, parts: [0] };
  },
  camel(P, M) {
    const g = new THREE.Group();
    const fur = P(0xc8965a, 'smooth');
    g.add(geo(new THREE.CapsuleGeometry(0.85, 2, 4, 8).rotateX(Math.PI / 2), fur, 0, 2.6, 0));
    g.add(sphere(0.9, fur, 0, 3.4, -0.2, 8, 6));
    g.add(sphere(0.6, P(0xd8382a, 'smooth'), 0, 3.6, -0.2, 8, 6, Math.PI / 2));
    const neck = cyl(0.3, 0.4, 2, fur, 0, 3.4, 1.6, 6); neck.rotation.x = 0.6; g.add(neck);
    g.add(box(0.6, 0.6, 1.2, fur, 0, 4.3, 2.4));
    for (const x of [-0.2, 0.2]) g.add(sphere(0.1, P(0x111111, 'glow'), x, 4.5, 2.95, 4, 3));
    for (const [x, z] of [[-0.5, -1], [0.5, -1], [-0.5, 1], [0.5, 1]]) g.add(cyl(0.18, 0.15, 2.2, fur, x, 1.1, z, 5));
    return { obj: g, radius: 1.5, parts: [-0.9, 0.9], hop: 0.15 };
  },
  canguru(P, M) {
    const g = new THREE.Group();
    const fur = P(0xc87a4a, 'smooth');
    g.add(geo(new THREE.CapsuleGeometry(0.7, 1.2, 4, 8), fur, 0, 1.8, 0)).children.at(-1).rotation.x = 0.35;
    g.add(sphere(0.45, fur, 0, 3.2, 0.5, 8, 6));
    g.add(box(0.35, 0.3, 0.6, fur, 0, 3.1, 0.95));
    for (const x of [-0.25, 0.25]) { const ear = cone(0.15, 0.6, fur, x, 3.7, 0.4, 4); g.add(ear); g.add(sphere(0.07, P(0x111111, 'glow'), x * 0.8, 3.3, 0.85, 4, 3)); }
    for (const x of [-0.4, 0.4]) g.add(box(0.35, 0.3, 1.3, fur, x, 0.2, 0.3));
    const tail = cyl(0.25, 0.08, 1.8, fur, 0, 0.8, -1.1, 5); tail.rotation.x = -1.1; g.add(tail);
    g.add(sphere(0.35, P(0xe0a070, 'smooth'), 0, 1.7, 0.55, 6, 4));
    return { obj: g, radius: 1.3, parts: [0], hop: 1.2 };
  },
};

export const VEHICLE_KINDS = Object.keys(BUILD);

// Monta um veículo já juntado (poucas malhas). mats: materiais compartilhados da corrida.
export function buildVehicle(kind, mats) {
  const P = (c, cls = 'solid') => ({ mat: mats[cls], color: new THREE.Color(c) });
  const v = BUILD[kind](P, mats);
  const obj = bakeObject(v.obj, { local: true });
  obj.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { ...v, obj };
}
export { makeMaterials };
