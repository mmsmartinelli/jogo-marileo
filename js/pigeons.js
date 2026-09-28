// Pombos de Osasco: desenhados com InstancedMesh (um desenho só para dezenas de pombos).
// Usado pelos bandos que ficam na pista (obstacles.js) e pelos que voam no céu (track.js).
import * as THREE from 'three';

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const V = new THREE.Vector3();
const S = new THREE.Vector3(1, 1, 1);
const P = new THREE.Matrix4();
const QX = new THREE.Quaternion(), QZ = new THREE.Quaternion();
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);

export class PigeonMeshes {
  constructor(parent, capacity, scale = 1) {
    this.cap = capacity;
    this.scale = scale;
    const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...o });
    const body = new THREE.SphereGeometry(0.42, 10, 8).scale(0.85, 0.8, 1.35);
    const head = new THREE.SphereGeometry(0.22, 10, 8);
    // pescoço com o brilho verde/roxo típico do pombo
    const neck = new THREE.SphereGeometry(0.25, 10, 8).scale(1, 1.1, 0.9);
    const beak = new THREE.ConeGeometry(0.06, 0.2, 6).rotateX(Math.PI / 2);
    const eye = new THREE.SphereGeometry(0.045, 6, 4);
    const tail = new THREE.BoxGeometry(0.34, 0.06, 0.4);
    // asa com o pivô no ombro: sai para o lado +x
    const wing = new THREE.BoxGeometry(0.75, 0.05, 0.42).translate(0.37, 0, 0);
    const feet = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4);
    const defs = {
      body: [body, mat(0x8b93a6)],
      neck: [neck, mat(0x5a8a7a, { metalness: 0.5, roughness: 0.35, emissive: 0x2a1a4a, emissiveIntensity: 0.4 })],
      head: [head, mat(0x6f7890)],
      beak: [beak, mat(0x3a3438)],
      eyeL: [eye, mat(0xff7a1a, { emissive: 0x5a2000 })],
      eyeR: [eye, mat(0xff7a1a, { emissive: 0x5a2000 })],
      tail: [tail, mat(0x4a5063)],
      wingL: [wing, mat(0x9aa2b4)],
      wingR: [wing, mat(0x9aa2b4)],
      feet: [feet, mat(0xd8607a)],
    };
    this.parts = {};
    for (const [k, [g, m]] of Object.entries(defs)) {
      const im = new THREE.InstancedMesh(g, m, capacity);
      im.frustumCulled = false;
      im.castShadow = k === 'body' || k.startsWith('wing');
      im.count = capacity;
      parent.add(im);
      this.parts[k] = im;
    }
    // locais de cada parte no corpo (y para cima, z para frente)
    this.local = {
      body: [0, 0.55, 0], neck: [0, 0.82, 0.3], head: [0, 1.02, 0.42], beak: [0, 0.98, 0.64],
      eyeL: [-0.14, 1.07, 0.52], eyeR: [0.14, 1.07, 0.52], tail: [0, 0.6, -0.62],
      wingL: [-0.2, 0.72, 0], wingR: [0.2, 0.72, 0], feet: [0, 0.15, 0],
    };
    for (let i = 0; i < capacity; i++) this.hide(i);
  }

  hide(i) {
    M.makeScale(0, 0, 0);
    for (const im of Object.values(this.parts)) im.setMatrixAt(i, M);
  }

  // Posiciona o pombo i. peck = 0..1 (cabeça bicando), flap = ângulo das asas, pitch = inclinação do corpo.
  set(i, x, y, z, yaw, { peck = 0, flap = 0, pitch = 0, fly = false } = {}) {
    Q.setFromEuler(E.set(pitch, yaw, 0, 'YXZ'));
    const sc = this.scale;
    P.compose(V.set(x, y, z), Q, S.set(sc, sc, sc));
    const headDrop = peck * 0.35, headFwd = peck * 0.15;
    for (const [k, im] of Object.entries(this.parts)) {
      const l = this.local[k];
      let ly = l[1], lz = l[2];
      if (k === 'head' || k === 'beak' || k === 'eyeL' || k === 'eyeR') { ly -= headDrop; lz += headFwd; }
      if (k === 'neck') { ly -= headDrop * 0.5; lz += headFwd * 0.5; }
      if (k === 'feet' && fly) { M.makeScale(0, 0, 0); im.setMatrixAt(i, M); continue; }
      if (k === 'wingL' || k === 'wingR') {
        const side = k === 'wingL' ? -1 : 1;
        // asa fechada fica encostada ao corpo; voando, abre e bate
        if (fly) {
          E.set(0, side < 0 ? Math.PI : 0, flap);
          Q.setFromEuler(E);
        } else {
          // asa fechada: dobrada para trás, encostada no corpo
          Q.setFromAxisAngle(AY, Math.PI / 2).multiply(QZ.setFromAxisAngle(AZ, -0.18)).multiply(QX.setFromAxisAngle(AX, side * 0.55));
        }
        M.compose(V.set(fly ? l[0] : l[0] * 1.2, ly, fly ? lz : lz + 0.25), Q, S.set(1, 1, 1));
      } else {
        M.makeTranslation(l[0], ly, lz);
      }
      M.premultiply(P);
      im.setMatrixAt(i, M);
    }
  }

  commit() {
    for (const im of Object.values(this.parts)) im.instanceMatrix.needsUpdate = true;
  }
}
