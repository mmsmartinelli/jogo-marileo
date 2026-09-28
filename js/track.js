// Constrói a pista 3D (asfalto, zebras, muros, terreno, céu, cenário) e
// oferece consultas geométricas rápidas usadas pela física dos karts.
import * as THREE from 'three';
import { rng, makeNoise2D, fbm, smoothstep, lerp, clamp } from './utils.js';
import * as TX from './textures.js';

const UP = new THREE.Vector3(0, 1, 0);

export class Track {
  constructor(def, scene, opts = {}) {
    this.def = def;
    this.theme = def.theme;
    this.scene = scene;
    this.hw = def.halfWidth;
    this.shoulder = def.shoulder;
    this.edge = this.hw + this.shoulder;
    this.group = new THREE.Group();
    this.animated = [];
    this.disposables = [];
    this.noise = makeNoise2D(def.id.length * 131 + 7);
    this.rand = rng(def.id.charCodeAt(0) * 977 + def.id.length);
    this.shadows = opts.shadows !== false;
    scene.add(this.group);

    this._sample();
    this._buildLights();
    this._buildSky();
    this._buildRoad();
    this._buildTerrain();
    this._buildStart();
    this._buildScenery();
  }

  // ---------- Amostragem da curva ----------
  _sample() {
    const pts = this.def.points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
    const len = curve.getLength();
    const N = Math.max(200, Math.round(len / 2));
    const sp = curve.getSpacedPoints(N);
    sp.pop();
    // gira o vetor para que a amostra 0 fique no 2º ponto de controle (meio da reta de largada)
    let best = 0, bd = Infinity;
    for (let i = 0; i < N; i++) {
      const d = sp[i].distanceToSquared(pts[1]);
      if (d < bd) { bd = d; best = i; }
    }
    const P = sp.slice(best).concat(sp.slice(0, best));
    this.N = N;
    this.px = new Float32Array(N); this.py = new Float32Array(N); this.pz = new Float32Array(N);
    this.tx = new Float32Array(N); this.tz = new Float32Array(N);
    this.rx = new Float32Array(N); this.rz = new Float32Array(N);
    this.dist = new Float32Array(N);
    this.slope = new Float32Array(N);
    for (let i = 0; i < N; i++) { this.px[i] = P[i].x; this.py[i] = P[i].y; this.pz[i] = P[i].z; }
    let acc = 0;
    for (let i = 0; i < N; i++) {
      const a = (i - 1 + N) % N, b = (i + 1) % N;
      let dx = this.px[b] - this.px[a], dz = this.pz[b] - this.pz[a];
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      this.tx[i] = dx; this.tz[i] = dz;
      this.rx[i] = -dz; this.rz[i] = dx;
      this.slope[i] = (this.py[b] - this.py[a]) / l;
      this.dist[i] = acc;
      acc += Math.hypot(this.px[b] - this.px[i], this.pz[b] - this.pz[i]);
    }
    this.length = acc;
    this.spacing = acc / N;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < N; i++) {
      minX = Math.min(minX, this.px[i]); maxX = Math.max(maxX, this.px[i]);
      minZ = Math.min(minZ, this.pz[i]); maxZ = Math.max(maxZ, this.pz[i]);
      minY = Math.min(minY, this.py[i]); maxY = Math.max(maxY, this.py[i]);
    }
    this.bounds = { minX, maxX, minZ, maxZ, minY, maxY };
    this.center = new THREE.Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    this.radius = Math.max(maxX - minX, maxZ - minZ) / 2;
    this.lavaLevel = minY - 1.6;
  }

  wrap(i) { const N = this.N; return ((i % N) + N) % N; }

  headingAt(i) { i = this.wrap(Math.round(i)); return Math.atan2(this.tx[i], this.tz[i]); }

  // Ponto em (t, lat) com t em [0,1) e lat relativo à meia-largura.
  pointAt(t, lat = 0) {
    const i = this.wrap(Math.floor(t * this.N));
    const l = lat * this.hw;
    return {
      idx: i,
      x: this.px[i] + this.rx[i] * l,
      y: this.py[i],
      z: this.pz[i] + this.rz[i] * l,
      heading: Math.atan2(this.tx[i], this.tz[i]),
    };
  }

  pointAtIdx(i, latUnits = 0) {
    i = this.wrap(Math.round(i));
    return new THREE.Vector3(this.px[i] + this.rx[i] * latUnits, this.py[i], this.pz[i] + this.rz[i] * latUnits);
  }

  findNearest(x, z, hint = -1, win = 26) {
    const N = this.N;
    let best = 0, bd = Infinity;
    if (hint < 0) {
      for (let i = 0; i < N; i++) {
        const dx = x - this.px[i], dz = z - this.pz[i];
        const d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    for (let k = -win; k <= win; k++) {
      const i = (hint + k + N) % N;
      const dx = x - this.px[i], dz = z - this.pz[i];
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    // se ficou muito longe, faz busca completa
    if (bd > 60 * 60) return this.findNearest(x, z, -1);
    return best;
  }

  // Projeta (x,z) na linha central próxima do índice idx.
  project(x, z, idx, out) {
    const N = this.N;
    const along = (x - this.px[idx]) * this.tx[idx] + (z - this.pz[idx]) * this.tz[idx];
    const i0 = along >= 0 ? idx : (idx - 1 + N) % N;
    const i1 = (i0 + 1) % N;
    const sx = this.px[i1] - this.px[i0], sz = this.pz[i1] - this.pz[i0];
    const L2 = sx * sx + sz * sz || 1;
    const f = clamp(((x - this.px[i0]) * sx + (z - this.pz[i0]) * sz) / L2, 0, 1);
    const cx = this.px[i0] + sx * f, cz = this.pz[i0] + sz * f;
    const rX = lerp(this.rx[i0], this.rx[i1], f), rZ = lerp(this.rz[i0], this.rz[i1], f);
    out.lat = (x - cx) * rX + (z - cz) * rZ;
    out.y = lerp(this.py[i0], this.py[i1], f);
    out.progress = i0 + f;
    out.i0 = i0;
    out.rx = rX; out.rz = rZ;
    out.tx = lerp(this.tx[i0], this.tx[i1], f); out.tz = lerp(this.tz[i0], this.tz[i1], f);
    return out;
  }

  // Distância e altura da pista mais próxima (busca grosseira) — usada na geração.
  _nearestCoarse(x, z) {
    let bd = Infinity, bi = 0;
    for (let i = 0; i < this.N; i += 3) {
      const dx = x - this.px[i], dz = z - this.pz[i];
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; bi = i; }
    }
    for (let k = -3; k <= 3; k++) {
      const i = this.wrap(bi + k);
      const dx = x - this.px[i], dz = z - this.pz[i];
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; bi = i; }
    }
    return { d: Math.sqrt(bd), i: bi, y: this.py[bi] };
  }

  groundHeight(x, z) {
    const n = this._nearestCoarse(x, z);
    return this._heightFrom(x, z, n.d, n.y);
  }

  _heightFrom(x, z, d, ty) {
    const e = this.edge;
    const nz = fbm(this.noise, x * 0.012, z * 0.012, 4);
    if (this.def.lava) {
      const rocky = this.lavaLevel + 1 + nz * 26 * smoothstep(e + 40, e + 160, d) + smoothstep(e + 150, e + 320, d) * 50;
      return lerp(this.lavaLevel - 3, rocky, smoothstep(e + 26, e + 70, d));
    }
    const base = ty - 0.3 + (nz - 0.35) * 16 * smoothstep(e + 8, e + 90, d) + smoothstep(e + 120, e + 330, d) * 70 * (0.4 + nz);
    return lerp(ty - 1.6, base, smoothstep(e + 8, e + 34, d));
  }

  // ---------- Luzes e céu ----------
  _buildLights() {
    const th = this.theme;
    const hemi = new THREE.HemisphereLight(th.hemiSky, th.hemiGround, 1.25);
    this.group.add(hemi);
    const sun = new THREE.DirectionalLight(th.sun, 2.4);
    const sd = new THREE.Vector3(...th.sunDir).normalize();
    this.sunDir = sd;
    sun.position.copy(sd).multiplyScalar(120);
    sun.castShadow = this.shadows;
    if (this.shadows) {
      sun.shadow.mapSize.set(2048, 2048);
      const c = sun.shadow.camera;
      c.left = -70; c.right = 70; c.top = 70; c.bottom = -70; c.near = 1; c.far = 400;
      sun.shadow.bias = -0.0006;
      sun.shadow.normalBias = 0.04;
    }
    this.group.add(sun);
    this.group.add(sun.target);
    this.sun = sun;
    this.scene.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    this.scene.background = new THREE.Color(th.fog);
  }

  // Posiciona a luz do sol (e a sombra) em volta do ponto focado.
  focusSun(pos) {
    const s = this.sun;
    s.target.position.set(pos.x, pos.y, pos.z);
    s.position.set(pos.x + this.sunDir.x * 150, pos.y + this.sunDir.y * 150, pos.z + this.sunDir.z * 150);
    s.target.updateMatrixWorld();
    s.updateMatrixWorld();
  }

  _buildSky() {
    const th = this.theme;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color(th.skyTop) },
        horizon: { value: new THREE.Color(th.skyHorizon) },
        bottom: { value: new THREE.Color(th.skyBottom) },
        sunDir: { value: this.sunDir.clone() },
        sunColor: { value: new THREE.Color(th.sun) },
        stars: { value: th.stars ? 1 : 0 },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top, horizon, bottom, sunDir, sunColor; uniform float stars; varying vec3 vDir;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(horizon, bottom, pow(clamp(-h,0.0,1.0), 0.4));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += sunColor * (pow(s, 12.0) * 0.25 + pow(s, 200.0) * 0.8 + step(0.9993, s) * 1.5);
          if (stars > 0.5 && h > 0.05) {
            vec3 q = floor(d * 260.0);
            float st = step(0.9965, hash(q));
            col += vec3(st) * smoothstep(0.05, 0.4, h) * 0.9;
          }
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), mat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    this.sky = sky;
    this.group.add(sky);

    if (th.clouds) {
      const tex = TX.cloudTexture();
      const r = rng(3);
      for (let i = 0; i < 26; i++) {
        const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 + r() * 0.15, fog: false, depthWrite: false });
        const s = new THREE.Sprite(m);
        const a = r() * Math.PI * 2, d = this.radius * 0.5 + r() * (this.radius + 500);
        s.position.set(this.center.x + Math.cos(a) * d, 150 + r() * 120, this.center.z + Math.sin(a) * d);
        const sc = 120 + r() * 160;
        s.scale.set(sc, sc * 0.45, 1);
        this.group.add(s);
      }
    }
  }

  // ---------- Pista ----------
  _strip(latA, latB, yA, yB, uA, uB, vLen, mat, opts = {}) {
    const N = this.N;
    const n = N + 1;
    const pos = new Float32Array(n * 2 * 3);
    const uv = new Float32Array(n * 2 * 2);
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const d = i === N ? this.length : this.dist[j];
      for (let e = 0; e < 2; e++) {
        const lat = e ? latB : latA, y = e ? yB : yA;
        const k = i * 2 + e;
        pos[k * 3] = this.px[j] + this.rx[j] * lat;
        pos[k * 3 + 1] = this.py[j] + y;
        pos[k * 3 + 2] = this.pz[j] + this.rz[j] * lat;
        uv[k * 2] = e ? uB : uA;
        uv[k * 2 + 1] = d / vLen;
      }
    }
    const idx = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    m.castShadow = !!opts.cast;
    this.group.add(m);
    return m;
  }

  _buildRoad() {
    const th = this.theme, hw = this.hw;
    const roadTex = TX.roadTexture(th);
    const reps = Math.max(1, Math.round(this.length / (hw * 2)));
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.82, metalness: 0.0 });
    this._strip(-hw, hw, 0.02, 0.02, 0, 1, this.length / reps, roadMat);

    const curbTex = TX.curbTexture(th.curbA, th.curbB);
    const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.6 });
    const cReps = Math.round(this.length / 3.2);
    this._strip(-hw - 1.3, -hw + 0.25, 0.07, 0.07, 0, 1, this.length / cReps, curbMat);
    this._strip(hw - 0.25, hw + 1.3, 0.07, 0.07, 1, 0, this.length / cReps, curbMat);

    const shTex = TX.groundTexture(th.shoulder, 9, !this.def.lava && this.def.id !== 'deserto');
    const shMat = new THREE.MeshStandardMaterial({ map: shTex, roughness: 0.95 });
    const sw = this.shoulder + 0.8;
    this._strip(-hw - sw, -hw, -0.01, -0.01, 0, sw / 10, 10, shMat);
    this._strip(hw, hw + sw, -0.01, -0.01, 0, sw / 10, 10, shMat);
    if (!this.def.lava) {
      // barranco suave que liga o acostamento ao terreno
      const ex = hw + sw;
      this._strip(-ex - 9, -ex, -1.3, -0.01, 0, 0.9, 10, shMat);
      this._strip(ex, ex + 9, -0.01, -1.3, 0, 0.9, 10, shMat);
    }

    if (this.def.walls) {
      const wallTex = TX.wallTexture(th.wallA, th.wallB);
      const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.5, side: THREE.DoubleSide });
      const wl = this.edge;
      const wReps = Math.round(this.length / 5);
      this._strip(-wl, -wl, 0, 1.3, 0, 1, this.length / wReps, wallMat, { cast: true });
      this._strip(wl, wl, 1.3, 0, 1, 0, this.length / wReps, wallMat, { cast: true });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      this._strip(-wl - 0.35, -wl, 1.3, 1.3, 0, 1, 10, capMat);
      this._strip(wl, wl + 0.35, 1.3, 1.3, 0, 1, 10, capMat);
    }
    if (this.def.lava) {
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a1e1e, roughness: 1, flatShading: true });
      const e = this.edge + 0.8;
      this._strip(-e - 1.5, -e, -5, -0.01, 0, 1, 6, rockMat);
      this._strip(e, e + 1.5, -0.01, -5, 0, 1, 6, rockMat);
      this.lavaTex = TX.lavaTexture();
      this.lavaTex.repeat.set(60, 60);
      const lavaMat = new THREE.MeshStandardMaterial({ map: this.lavaTex, emissive: 0xff5a10, emissiveMap: this.lavaTex, emissiveIntensity: 1.3, roughness: 0.6 });
      const size = this.radius * 2 + 700;
      const lava = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), lavaMat);
      lava.position.set(this.center.x, this.lavaLevel, this.center.z);
      this.group.add(lava);
      const glow = new THREE.PointLight(0xff5a1a, 2, 0, 0);
      glow.position.set(this.center.x, this.lavaLevel + 30, this.center.z);
      this.group.add(glow);
      this.animated.push(dt => { this.lavaTex.offset.x += dt * 0.004; this.lavaTex.offset.y += dt * 0.002; });
    }
  }

  // ---------- Terreno ----------
  _buildTerrain() {
    const th = this.theme;
    const margin = 420;
    const b = this.bounds;
    const x0 = b.minX - margin, x1 = b.maxX + margin, z0 = b.minZ - margin, z1 = b.maxZ + margin;
    const cell = 7;
    const nx = Math.min(240, Math.ceil((x1 - x0) / cell)), nz = Math.min(240, Math.ceil((z1 - z0) / cell));
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz).rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(th.terrainColor);
    const alt = new THREE.Color(th.mountainColor);
    const tmp = new THREE.Color();
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const n = this._nearestCoarse(x, z);
      const h = this._heightFrom(x, z, n.d, n.y);
      pos.setY(i, h);
      uv.setXY(i, x / 22, z / 22);
      const k = smoothstep(this.edge + 60, this.edge + 320, n.d);
      const nn = this.noise(x * 0.05, z * 0.05);
      tmp.copy(base).lerp(alt, k * 0.8).multiplyScalar(0.85 + nn * 0.3);
      if (th.mountainSnow && h > n.y + 45) tmp.lerp(new THREE.Color(0xffffff), smoothstep(n.y + 45, n.y + 70, h));
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const tex = TX.groundTexture(th.ground, 4, !this.def.lava && this.def.id !== 'deserto' && this.def.id !== 'neve');
    const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.95 });
    const terrain = new THREE.Mesh(g, mat);
    terrain.receiveShadow = true;
    this.group.add(terrain);
  }

  // ---------- Largada ----------
  _buildStart() {
    const hw = this.hw;
    const i = 0;
    const heading = this.headingAt(i);
    const p = this.pointAtIdx(i);
    const chk = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 3).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: TX.checkerTexture(16, 2), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -1 }));
    chk.position.set(p.x, p.y + 0.06, p.z);
    chk.rotation.y = heading;
    chk.receiveShadow = true;
    this.group.add(chk);

    // pórtico
    const gantry = new THREE.Group();
    gantry.position.copy(p);
    gantry.rotation.y = heading;
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x33364a, roughness: 0.4, metalness: 0.6 });
    const span = this.edge + 1.5;
    for (const s of [-1, 1]) {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.2), pillarMat);
      pl.position.set(s * span, 5.5, 0);
      pl.castShadow = true;
      gantry.add(pl);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(span * 2 + 1.2, 2.6, 0.8),
      [pillarMat, pillarMat, pillarMat, pillarMat,
        new THREE.MeshStandardMaterial({ map: TX.bannerTexture('MARILEO KART'), roughness: 0.5, emissive: 0x222222 }),
        new THREE.MeshStandardMaterial({ map: TX.bannerTexture('MARILEO KART'), roughness: 0.5, emissive: 0x222222 })]);
    beam.position.y = 10.4;
    beam.castShadow = true;
    gantry.add(beam);
    // semáforo
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.4 }));
    lightBox.position.set(0, 8.2, -0.2);
    gantry.add(lightBox);
    this.startLamps = [];
    for (let k = 0; k < 3; k++) {
      const m = new THREE.MeshStandardMaterial({ color: 0x331111, emissive: 0x000000, roughness: 0.3 });
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), m);
      l.position.set(-1.6 + k * 1.6, 8.2, -0.65);
      gantry.add(l);
      this.startLamps.push(m);
    }
    this.group.add(gantry);
  }

  setLamps(state) {
    // state: 0 = apagado, 1..3 = vermelhos acesos, 4 = verde
    this.startLamps.forEach((m, k) => {
      if (state === 4) { m.color.set(0x113311); m.emissive.set(0x33ff66); m.emissiveIntensity = 2; }
      else if (k < state) { m.color.set(0x331111); m.emissive.set(0xff2222); m.emissiveIntensity = 2; }
      else { m.color.set(0x331111); m.emissive.set(0x000000); }
    });
  }

  // ---------- Cenário ----------
  _randomSpot(minD, maxD, tries = 40) {
    const b = this.bounds, r = this.rand;
    for (let k = 0; k < tries; k++) {
      const x = lerp(b.minX - maxD, b.maxX + maxD, r());
      const z = lerp(b.minZ - maxD, b.maxZ + maxD, r());
      const n = this._nearestCoarse(x, z);
      if (n.d >= minD && n.d <= maxD) {
        return { x, z, y: this._heightFrom(x, z, n.d, n.y), d: n.d, i: n.i };
      }
    }
    return null;
  }

  // Cria InstancedMeshes a partir de um protótipo (lista de partes).
  _instance(parts, transforms, opts = {}) {
    if (!transforms.length) return;
    const tmp = new THREE.Matrix4();
    for (const part of parts) {
      const im = new THREE.InstancedMesh(part.geo, part.mat, transforms.length);
      transforms.forEach((t, k) => {
        tmp.multiplyMatrices(t.m, part.local || tmp.identity());
        im.setMatrixAt(k, part.local ? tmp : t.m);
        if (part.colors) im.setColorAt(k, new THREE.Color(part.colors[k % part.colors.length]).offsetHSL(0, 0, (t.r - 0.5) * 0.1));
      });
      im.castShadow = opts.cast !== false;
      im.receiveShadow = true;
      im.instanceMatrix.needsUpdate = true;
      this.group.add(im);
    }
  }

  _scatter(count, minD, maxD, scaleMin, scaleMax) {
    const out = [];
    for (let k = 0; k < count; k++) {
      const s = this._randomSpot(minD, maxD);
      if (!s) continue;
      const sc = lerp(scaleMin, scaleMax, this.rand());
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(s.x, s.y, s.z),
        new THREE.Quaternion().setFromAxisAngle(UP, this.rand() * Math.PI * 2),
        new THREE.Vector3(sc, sc, sc));
      out.push({ m, r: this.rand(), pos: s });
    }
    return out;
  }

  _buildScenery() {
    const sc = this.def.scenery || {};
    const e = this.edge + 8;
    const L = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) =>
      new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), new THREE.Vector3(sx, sy, sz));
    const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true, ...o });

    if (sc.trees) {
      const trunk = std(0x7a4a2a);
      const leaf = std(0xffffff);
      const parts = [
        { geo: new THREE.CylinderGeometry(0.35, 0.55, 4, 7), mat: trunk, local: L(0, 2, 0) },
        { geo: new THREE.IcosahedronGeometry(2.8, 0), mat: leaf, local: L(0, 5.6, 0), colors: ['#3f9e3a', '#4cb043', '#2f8a34', '#66c24f'] },
        { geo: new THREE.IcosahedronGeometry(2.1, 0), mat: leaf, local: L(1.2, 7.2, 0.3), colors: ['#52b848', '#3a9a3a', '#73cc55'] },
        { geo: new THREE.IcosahedronGeometry(1.8, 0), mat: leaf, local: L(-1.1, 6.8, -0.6), colors: ['#46a842', '#5fc050'] },
      ];
      this._instance(parts, this._scatter(sc.trees, e, e + 160, 0.8, 1.6));
    }
    if (sc.flowers) {
      const parts = [{ geo: new THREE.IcosahedronGeometry(0.35, 0), mat: std(0xffffff, { roughness: 0.6 }), local: L(0, 0.3, 0), colors: ['#ff5e9c', '#ffd23f', '#ffffff', '#b98cff', '#ff7b3b'] }];
      this._instance(parts, this._scatter(sc.flowers, e + 4, e + 60, 0.7, 1.4), { cast: false });
    }
    if (sc.pines) {
      const trunk = std(0x5a3a22);
      const green = std(0x2e6b4a);
      const snow = std(0xffffff);
      const parts = [
        { geo: new THREE.CylinderGeometry(0.3, 0.45, 2.5, 6), mat: trunk, local: L(0, 1.2, 0) },
        { geo: new THREE.ConeGeometry(3, 4, 7), mat: green, local: L(0, 4, 0) },
        { geo: new THREE.ConeGeometry(2.3, 3.4, 7), mat: green, local: L(0, 6.2, 0) },
        { geo: new THREE.ConeGeometry(1.5, 2.8, 7), mat: green, local: L(0, 8.2, 0) },
        { geo: new THREE.ConeGeometry(0.9, 1.4, 7), mat: snow, local: L(0, 9.2, 0) },
        { geo: new THREE.ConeGeometry(2.4, 1.0, 7), mat: snow, local: L(0, 5.6, 0) },
      ];
      this._instance(parts, this._scatter(sc.pines, e, e + 170, 0.8, 1.7));
    }
    if (sc.snowmen) {
      const w = std(0xffffff, { flatShading: false, roughness: 0.9 });
      const parts = [
        { geo: new THREE.SphereGeometry(1.3, 14, 10), mat: w, local: L(0, 1.1, 0) },
        { geo: new THREE.SphereGeometry(0.95, 14, 10), mat: w, local: L(0, 2.8, 0) },
        { geo: new THREE.SphereGeometry(0.65, 14, 10), mat: w, local: L(0, 4.1, 0) },
        { geo: new THREE.ConeGeometry(0.14, 0.7, 8).rotateX(Math.PI / 2), mat: std(0xff7a1a), local: L(0, 4.1, 0.9) },
        { geo: new THREE.CylinderGeometry(0.45, 0.45, 0.8, 12), mat: std(0x222222), local: L(0, 4.9, 0) },
        { geo: new THREE.CylinderGeometry(0.7, 0.7, 0.08, 16), mat: std(0x222222), local: L(0, 4.5, 0) },
      ];
      this._instance(parts, this._scatter(sc.snowmen, e + 4, e + 40, 0.9, 1.3));
    }
    if (sc.cacti) {
      const c = std(0x3f9a4a);
      const parts = [
        { geo: new THREE.CapsuleGeometry(0.6, 4, 4, 8), mat: c, local: L(0, 2.6, 0) },
        { geo: new THREE.CapsuleGeometry(0.4, 1.4, 4, 8), mat: c, local: L(1.1, 3.2, 0) },
        { geo: new THREE.CapsuleGeometry(0.4, 1.8, 4, 8), mat: c, local: L(-1.1, 2.6, 0) },
        { geo: new THREE.CylinderGeometry(0.35, 0.35, 0.8, 6).rotateZ(Math.PI / 2), mat: c, local: L(0.7, 2.4, 0) },
        { geo: new THREE.CylinderGeometry(0.35, 0.35, 0.8, 6).rotateZ(Math.PI / 2), mat: c, local: L(-0.7, 1.8, 0) },
        { geo: new THREE.SphereGeometry(0.3, 6, 4), mat: std(0xff5e9c), local: L(0, 5.3, 0) },
      ];
      this._instance(parts, this._scatter(sc.cacti, e, e + 150, 0.8, 1.6));
    }
    if (sc.rocks) {
      const parts = [{ geo: new THREE.DodecahedronGeometry(1.6, 0), mat: std(this.def.lava ? 0x2a2020 : 0x8a8580), local: L(0, 0.6, 0, 1.3, 0.8, 1) }];
      this._instance(parts, this._scatter(sc.rocks, e, e + 200, 0.6, 3.2));
    }
    if (sc.crystals) {
      const parts = [
        { geo: new THREE.OctahedronGeometry(1.2, 0), mat: new THREE.MeshStandardMaterial({ color: 0xff7a3a, emissive: 0xff3a00, emissiveIntensity: 1.2, flatShading: true }), local: L(0, 1.6, 0, 0.7, 2, 0.7) },
      ];
      this._instance(parts, this._scatter(sc.crystals, e, e + 80, 0.8, 2.2), { cast: false });
    }
    if (sc.lollipops) {
      const stick = std(0xffffff, { flatShading: false });
      const parts = [
        { geo: new THREE.CylinderGeometry(0.15, 0.15, 6, 6), mat: stick, local: L(0, 3, 0) },
        { geo: new THREE.CylinderGeometry(2, 2, 0.5, 20).rotateX(Math.PI / 2), mat: std(0xffffff, { flatShading: false, roughness: 0.3 }), local: L(0, 7.5, 0), colors: ['#ff4fa3', '#44d7ff', '#ffe14d', '#9b6bff', '#6bff9b'] },
        { geo: new THREE.TorusGeometry(1.3, 0.25, 8, 20), mat: std(0xffffff, { flatShading: false, roughness: 0.3 }), local: L(0, 7.5, 0.28) },
      ];
      this._instance(parts, this._scatter(sc.lollipops, e, e + 150, 0.7, 1.5));
    }
    if (sc.candyCanes) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#ff2d55';
      for (let k = -2; k < 4; k++) { ctx.beginPath(); ctx.moveTo(k * 32, 0); ctx.lineTo(k * 32 + 16, 0); ctx.lineTo(k * 32 + 48, 64); ctx.lineTo(k * 32 + 32, 64); ctx.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 4); t.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.3 });
      const parts = [
        { geo: new THREE.CylinderGeometry(0.45, 0.45, 8, 12), mat, local: L(0, 4, 0) },
        { geo: new THREE.TorusGeometry(1.2, 0.45, 10, 16, Math.PI), mat, local: L(1.2, 8, 0) },
      ];
      this._instance(parts, this._scatter(sc.candyCanes, e, e + 140, 0.7, 1.3));
    }
    if (sc.gumdrops) {
      const parts = [{ geo: new THREE.SphereGeometry(1.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 1 }), local: L(0, 0, 0, 1, 1.3, 1), colors: ['#ff4fa3', '#44d7ff', '#ffe14d', '#9b6bff', '#6bff9b', '#ff8a3d'] }];
      this._instance(parts, this._scatter(sc.gumdrops, e + 4, e + 120, 0.6, 1.8));
    }
    if (sc.props) for (const p of sc.props) this._prop(p);
  }

  _placeProp(obj, minD, maxD) {
    const s = this._randomSpot(minD, maxD, 120);
    if (!s) return null;
    obj.position.set(s.x, s.y, s.z);
    // vira para a pista
    const i = s.i;
    obj.rotation.y = Math.atan2(this.px[i] - s.x, this.pz[i] - s.z);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.group.add(obj);
    return obj;
  }

  _prop(type) {
    const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...o });
    const e = this.edge;
    const r = this.rand;
    switch (type) {
      case 'grandstand': {
        // arquibancadas dos dois lados da largada
        for (const side of [-1, 1]) {
          const g = new THREE.Group();
          const seat = std(0x5a6078);
          for (let row = 0; row < 5; row++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(46, 1, 2.2), seat);
            step.position.set(0, 0.5 + row * 1.1, row * 2.2);
            g.add(step);
          }
          const crowdCols = [0xff4d4d, 0x4db8ff, 0xffd23f, 0x66dd66, 0xff66cc, 0xffffff, 0xff9933];
          const headGeo = new THREE.SphereGeometry(0.35, 8, 6);
          const bodyGeo = new THREE.BoxGeometry(0.8, 0.9, 0.6);
          const crowd = new THREE.InstancedMesh(bodyGeo, std(0xffffff), 5 * 30);
          const heads = new THREE.InstancedMesh(headGeo, std(0xf2c29a), 5 * 30);
          const m = new THREE.Matrix4();
          let k = 0;
          for (let row = 0; row < 5; row++) for (let c = 0; c < 30; c++) {
            const x = -21 + c * 1.45 + (r() - 0.5) * 0.3;
            m.makeTranslation(x, 1.5 + row * 1.1, row * 2.2);
            crowd.setMatrixAt(k, m);
            crowd.setColorAt(k, new THREE.Color(crowdCols[Math.floor(r() * crowdCols.length)]));
            m.makeTranslation(x, 2.25 + row * 1.1, row * 2.2);
            heads.setMatrixAt(k, m);
            k++;
          }
          g.add(crowd, heads);
          this.crowd = this.crowd || [];
          this.crowd.push({ crowd, heads, base: g });
          const roof = new THREE.Mesh(new THREE.BoxGeometry(48, 0.4, 13), std(side < 0 ? 0xff3b3b : 0x2f7bff));
          roof.position.set(0, 9, 5); roof.rotation.x = -0.12;
          g.add(roof);
          for (const px of [-23, 23]) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), std(0xdddddd));
            post.position.set(px, 4.5, 10.5);
            g.add(post);
          }
          const i = this.wrap(-14);
          const lat = side * (this.edge + 5);
          const p = this.pointAtIdx(i, lat);
          g.position.set(p.x, p.y - 0.3, p.z);
          g.rotation.y = this.headingAt(i) + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
          g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
          this.group.add(g);
        }
        // bandeirinhas ao longo da reta
        const flagCols = [0xff3b3b, 0xffd23f, 0x2f7bff, 0x35d07f, 0xff5fb0];
        const fGeo = new THREE.ConeGeometry(0.5, 1.2, 3).rotateZ(Math.PI);
        for (let i = -40; i < 40; i += 3) {
          for (const side of [-1, 1]) {
            const p = this.pointAtIdx(i, side * (this.edge + 0.6));
            const f = new THREE.Mesh(fGeo, std(flagCols[(i + 40 + (side > 0 ? 2 : 0)) % flagCols.length]));
            f.position.set(p.x, p.y + (this.def.walls ? 1.9 : 0.6), p.z);
            this.group.add(f);
          }
        }
        break;
      }
      case 'windmill': {
        const g = new THREE.Group();
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4.5, 18, 8), std(0xf4ead8));
        tower.position.y = 9; g.add(tower);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4, 8), std(0xc0392b));
        roof.position.y = 20; g.add(roof);
        const hub = new THREE.Group(); hub.position.set(0, 16, 3.2); g.add(hub);
        for (let k = 0; k < 4; k++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(1.6, 11, 0.2), std(0xffffff));
          blade.position.y = 5.5;
          const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; arm.add(blade);
          hub.add(arm);
        }
        this.animated.push(dt => { hub.rotation.z += dt * 0.8; });
        this._placeProp(g, e + 25, e + 60);
        const g2 = g.clone();
        const hub2 = g2.children[2];
        this.animated.push(dt => { hub2.rotation.z += dt * 0.6; });
        this._placeProp(g2, e + 30, e + 90);
        break;
      }
      case 'barn': {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 16), std(0xc0392b)); b.position.y = 3.5; g.add(b);
        const roofShape = new THREE.Shape([new THREE.Vector2(-7, 0), new THREE.Vector2(7, 0), new THREE.Vector2(0, 5)]);
        const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 17, bevelEnabled: false }), std(0x5a3a2a));
        roof.position.set(0, 7, -8.5); g.add(roof);
        const door = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.3), std(0xffffff)); door.position.set(0, 2.5, 8.05); g.add(door);
        this._placeProp(g, e + 20, e + 50);
        break;
      }
      case 'balloons': {
        const cols = [0xff3b3b, 0xffd23f, 0x2f7bff, 0xff5fb0, 0x35d07f];
        for (let k = 0; k < 5; k++) {
          const g = new THREE.Group();
          const env = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshStandardMaterial({ color: cols[k], roughness: 0.5 }));
          env.scale.y = 1.2; g.add(env);
          const stripe = new THREE.Mesh(new THREE.TorusGeometry(5.05, 0.5, 6, 24), std(0xffffff));
          stripe.rotation.x = Math.PI / 2; g.add(stripe);
          const basket = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), std(0x8a5a2a)); basket.position.y = -8; g.add(basket);
          const s = this._randomSpot(e + 10, e + 120, 60);
          if (!s) continue;
          const baseY = s.y + 30 + r() * 40;
          g.position.set(s.x, baseY, s.z);
          const ph = r() * 6;
          this.animated.push((dt, t) => { g.position.y = baseY + Math.sin(t * 0.4 + ph) * 3; g.rotation.y += dt * 0.05; });
          this.group.add(g);
        }
        break;
      }
      case 'pyramids': {
        const mat = std(0xe0b060);
        for (let k = 0; k < 3; k++) {
          const h = 40 + k * 18;
          const p = new THREE.Mesh(new THREE.ConeGeometry(h * 0.85, h, 4), mat);
          p.position.y = h / 2 - 2;
          const g = new THREE.Group(); g.add(p);
          this._placeProp(g, e + 90 + k * 20, e + 200);
        }
        break;
      }
      case 'palms': {
        for (let k = 0; k < 24; k++) {
          const g = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 9, 6), std(0x9a6a3a));
          trunk.position.y = 4.5; trunk.rotation.z = 0.12; g.add(trunk);
          for (let l = 0; l < 6; l++) {
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 4), std(0x3aa84a));
            const pivot = new THREE.Group(); pivot.position.set(0.5, 9, 0); pivot.rotation.y = (l / 6) * Math.PI * 2;
            leaf.position.set(0, 0, 2.2); leaf.rotation.x = Math.PI / 2 + 0.4;
            pivot.add(leaf);
            g.add(pivot);
          }
          this._placeProp(g, e + 12, e + 90);
        }
        break;
      }
      case 'cabin': {
        for (let k = 0; k < 3; k++) {
          const g = new THREE.Group();
          const b = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 7), std(0x8a5a3a)); b.position.y = 2.5; g.add(b);
          const roofShape = new THREE.Shape([new THREE.Vector2(-5.5, 0), new THREE.Vector2(5.5, 0), new THREE.Vector2(0, 4)]);
          const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 8, bevelEnabled: false }), std(0xffffff));
          roof.position.set(0, 5, -4); g.add(roof);
          const ch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 1.2), std(0x666666)); ch.position.set(2.5, 7.5, 0); g.add(ch);
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc040, emissiveIntensity: 0.8 }));
          win.position.set(-2, 2.8, 3.51); g.add(win);
          this._placeProp(g, e + 15, e + 70);
        }
        break;
      }
      case 'iceCrystals': {
        const mat = new THREE.MeshPhysicalMaterial({ color: 0xaee8ff, roughness: 0.1, metalness: 0, transmission: 0.5, thickness: 1, emissive: 0x3a7aff, emissiveIntensity: 0.2, flatShading: true });
        for (let k = 0; k < 14; k++) {
          const g = new THREE.Group();
          for (let c = 0; c < 4; c++) {
            const cr = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), mat);
            cr.scale.set(0.6, 2 + r() * 2, 0.6);
            cr.position.set((r() - 0.5) * 3, 2, (r() - 0.5) * 3);
            cr.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6);
            g.add(cr);
          }
          this._placeProp(g, e + 12, e + 60);
        }
        break;
      }
      case 'cake': {
        const g = new THREE.Group();
        const layers = [[16, 6, 0xffb3d9], [12, 5, 0xffffff], [8, 4, 0xff7ab8]];
        let y = 0;
        for (const [rad, h, c] of layers) {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 32), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
          l.position.y = y + h / 2; g.add(l);
          const icing = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.8, 8, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
          icing.rotation.x = Math.PI / 2; icing.position.y = y + h; g.add(icing);
          y += h;
        }
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 8), std([0xff4d4d, 0x4db8ff, 0xffd23f][k % 3]));
          cd.position.set(Math.cos(a) * 5, y + 1.5, Math.sin(a) * 5); g.add(cd);
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffcc33 }));
          fl.scale.y = 1.6; fl.position.set(Math.cos(a) * 5, y + 3.4, Math.sin(a) * 5); g.add(fl);
        }
        const cherry = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xff1030, clearcoat: 1, roughness: 0.2 }));
        cherry.position.y = y + 2; g.add(cherry);
        this._placeProp(g, e + 35, e + 80);
        break;
      }
      case 'donut': {
        for (let k = 0; k < 3; k++) {
          const g = new THREE.Group();
          const d = new THREE.Mesh(new THREE.TorusGeometry(7, 3.5, 16, 32), std(0xd9964a, { flatShading: false }));
          g.add(d);
          const fr = new THREE.Mesh(new THREE.TorusGeometry(7, 3.2, 16, 32, Math.PI * 2), new THREE.MeshPhysicalMaterial({ color: [0xff6fb5, 0x7a4a2a, 0x9be7ff][k], roughness: 0.3, clearcoat: 1 }));
          fr.position.z = 0.6; fr.scale.set(1, 1, 0.75); g.add(fr);
          d.position.y = fr.position.y = 10;
          const holder = new THREE.Group(); holder.add(g); g.rotation.x = -0.3;
          this._placeProp(holder, e + 20, e + 90);
        }
        break;
      }
      case 'volcano': {
        const g = new THREE.Group();
        const v = new THREE.Mesh(new THREE.CylinderGeometry(22, 90, 110, 16, 4, true), std(0x2a1a18));
        v.position.y = 50; g.add(v);
        const crater = new THREE.Mesh(new THREE.CircleGeometry(22, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff6a1a, fog: false }));
        crater.position.y = 104; g.add(crater);
        const glow = new THREE.PointLight(0xff5a1a, 4, 400, 1);
        glow.position.y = 130; g.add(glow);
        const placed = this._placeProp(g, e + 170, e + 260);
        if (placed) this.volcanoTop = new THREE.Vector3(placed.position.x, placed.position.y + 105, placed.position.z);
        break;
      }
    }
  }

  update(dt, t) {
    for (const f of this.animated) f(dt, t);
    if (this.crowd) {
      // torcida pulando
      const m = new THREE.Matrix4();
      for (const c of this.crowd) {
        if (!c._frame) c._frame = 0;
        c._frame += dt;
        if (c._frame < 0.08) continue;
        c._frame = 0;
        const n = c.heads.count;
        for (let k = 0; k < n; k += 1) {
          const row = Math.floor(k / 30), col = k % 30;
          const jump = Math.max(0, Math.sin(t * 7 + k * 1.7)) * 0.35 * (this.cheer || 0.3);
          const x = -21 + col * 1.45;
          m.makeTranslation(x, 1.5 + row * 1.1 + jump, row * 2.2);
          c.crowd.setMatrixAt(k, m);
          m.makeTranslation(x, 2.25 + row * 1.1 + jump, row * 2.2);
          c.heads.setMatrixAt(k, m);
        }
        c.crowd.instanceMatrix.needsUpdate = true;
        c.heads.instanceMatrix.needsUpdate = true;
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          for (const k of ['map', 'emissiveMap']) if (m[k]) m[k].dispose();
          m.dispose();
        }
      }
    });
  }
}
