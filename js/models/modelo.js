// Lê os modelos feitos no Blender (js/models/*.js, gerados pelos scripts de tools/blender/).
// Cada peça vira uma malha com a pintura do jogo (ctx.P), então ela entra no mesmo "pacote"
// das outras peças da cidade e não gasta draw call a mais.
import * as THREE from 'three';
import { geo } from '../cities/common.js';

const bytes = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0)).buffer;
const cache = new Map();

// Devolve as malhas do modelo (posição em milésimos, normal de -127 a 127).
export function modelMeshes(parts, ctx) {
  let geos = cache.get(parts);
  if (!geos) {
    geos = parts.map(pt => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(new Int16Array(bytes(pt.p)), v => v / 1000), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(new Int8Array(bytes(pt.n)), v => v / 127), 3));
      g.setIndex(new THREE.BufferAttribute(new Uint16Array(bytes(pt.i)), 1));
      g.computeBoundingSphere();
      return g;
    });
    cache.set(parts, geos);
  }
  // cada cidade junta e depois descarta as peças: entrega cópias
  return parts.map((pt, k) => geo(geos[k].clone(), ctx.P(pt.c, pt.m)));
}
