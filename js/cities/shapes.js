// Formas paramétricas para os marcos (grades de pontos, faixas elípticas, quadriláteros).
// Tudo devolve BufferGeometry indexada com o lado de fora virado para onde pedimos.
import * as THREE from 'three';

export const TAU = Math.PI * 2;

// Vira os triângulos se, na média, a normal aponta contra a direção pedida.
export function faceTo(g, want) {
  const pos = g.attributes.position, idx = g.index.array;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), w = new THREE.Vector3();
  let s = 0;
  for (let i = 0; i < idx.length; i += 3) {
    a.fromBufferAttribute(pos, idx[i]); b.fromBufferAttribute(pos, idx[i + 1]); c.fromBufferAttribute(pos, idx[i + 2]);
    n.subVectors(b, a).cross(c.clone().sub(a));
    const cen = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    w.copy(want(cen));
    s += Math.sign(n.dot(w)) * Math.min(1, n.length());
  }
  if (s < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  g.computeVertexNormals();
  return g;
}

// Grade (nu x nv) de pontos fn(u, v) -> [x, y, z]; uv opcional uvf(u, v) -> [u, v].
export function gridGeo(nu, nv, fn, want, uvf) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, v = j / nv;
    pos.push(...fn(u, v));
    uv.push(...(uvf ? uvf(u, v) : [u, v]));
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return want ? faceTo(g, want) : (g.computeVertexNormals(), g);
}

// Ponto da elipse: th = 0 é a frente (+z), cresce para +x.
export const ell = (a, b, y, th) => [a * Math.sin(th), y, b * Math.cos(th)];

// Faixa elíptica entre fileiras [[a, b, y], ...] de th0 a th1 (n colunas).
// want(centro) = direção para onde a frente da faixa deve olhar. uvf(th, y, linha) -> [u, v].
export function ellipseBand(rows, th0, th1, n, want, uvf) {
  const nv = rows.length - 1;
  return gridGeo(n, nv, (u, v) => {
    const r = rows[Math.min(nv, Math.round(v * nv))];
    return ell(r[0], r[1], r[2], th0 + (th1 - th0) * u);
  }, want, uvf ? (u, v) => uvf(th0 + (th1 - th0) * u, rows[Math.min(nv, Math.round(v * nv))][2], Math.round(v * nv)) : null);
}
export const outward = c => new THREE.Vector3(c.x, 0, c.z);
export const inward = c => new THREE.Vector3(-c.x, 0, -c.z);
export const UPV = () => new THREE.Vector3(0, 1, 0);

// Quadrilátero p0 p1 p2 p3 (em ordem em volta), virado para want.
export function quadGeo(p0, p1, p2, p3, want) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...p2, ...p3], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return faceTo(g, () => want);
}

// Gerador pseudo-aleatório pequeno (para detalhes sempre iguais).
export function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
