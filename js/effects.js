// Partículas (faíscas, poeira, fumaça, confete, explosões) e clima (neve, poeira, brasas).
import * as THREE from 'three';

const VERT = `
  attribute float size;
  attribute vec4 pcolor;
  varying vec4 vColor;
  uniform float scale;
  void main() {
    vColor = pcolor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * scale / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = `
  varying vec4 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = vColor.a * smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vColor.rgb, a);
    #include <colorspace_fragment>
  }`;

class ParticlePool {
  constructor(scene, max, additive) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.startSize = new Float32Array(max);
    this.endSize = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.alpha0 = new Float32Array(max);
    this.cursor = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.uniforms = { scale: { value: 400 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.geo = g;
    scene.add(this.points);
  }

  emit(x, y, z, vx, vy, vz, life, s0, s1, color, alpha = 1, grav = 0, drag = 0) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.maxLife[i] = life;
    this.startSize[i] = s0; this.endSize[i] = s1;
    this.col[i * 4] = color.r; this.col[i * 4 + 1] = color.g; this.col[i * 4 + 2] = color.b;
    this.alpha0[i] = alpha;
    this.grav[i] = grav; this.drag[i] = drag;
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.size[i] = 0; this.col[i * 4 + 3] = 0; continue; }
      this.life[i] -= dt;
      const k = 1 - this.life[i] / this.maxLife[i];
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 2] *= dr;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.startSize[i] + (this.endSize[i] - this.startSize[i]) * k;
      this.col[i * 4 + 3] = this.alpha0[i] * (k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.pcolor.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }

  setScale(s) { this.uniforms.scale.value = s; }

  dispose(scene) {
    scene.remove(this.points);
    this.geo.dispose();
    this.points.material.dispose();
  }
}

const C = (hex) => new THREE.Color(hex);
const COLORS = {
  spark1: C(0x5cd6ff), spark2: C(0xffa030), spark3: C(0xd66bff),
  fire: C(0xff8a20), fireCore: C(0xfff0a0), smoke: C(0x555566), dust: C(0xc8b08a),
  white: C(0xffffff), gold: C(0xffd23f), ink: C(0x201030), leaf: C(0x4caf50),
};
export { COLORS };

export class Effects {
  constructor(scene, theme) {
    this.scene = scene;
    this.add = new ParticlePool(scene, 2500, true);
    this.norm = new ParticlePool(scene, 2500, false);
    this.tmp = new THREE.Color();
    this.weather = null;
    this.dustColor = C(theme.shoulder ? theme.shoulder[0] : '#c8b08a');
    if (theme.weather) this._buildWeather(theme.weather);
  }

  _buildWeather(type) {
    const n = type === 'snow' ? 2200 : 700;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = Math.random() * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const cfg = {
      snow: { color: 0xffffff, size: 0.55, fall: 5, sway: 1.5, additive: false, alpha: 0.95 },
      dust: { color: 0xffe0b0, size: 0.35, fall: -0.5, sway: 6, additive: false, alpha: 0.5 },
      embers: { color: 0xff7a20, size: 0.4, fall: -4, sway: 2, additive: true, alpha: 1 },
      sparkles: { color: 0xfff0ff, size: 0.35, fall: 1.2, sway: 1, additive: true, alpha: 0.9 },
    }[type];
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, scale: { value: 400 }, color: { value: new THREE.Color(cfg.color) }, size: { value: cfg.size }, fall: { value: cfg.fall }, sway: { value: cfg.sway }, alpha: { value: cfg.alpha }, origin: { value: new THREE.Vector3() } },
      vertexShader: `
        attribute float seed; uniform float time, scale, size, fall, sway; uniform vec3 origin; varying float vA;
        void main(){
          vec3 p = position;
          p.y = mod(p.y - time * fall * (0.6 + seed * 0.8), 60.0);
          p.x += sin(time * 0.7 + seed * 40.0) * sway;
          p.z += cos(time * 0.5 + seed * 30.0) * sway;
          // mantém as partículas em volta da câmera (volume infinito)
          p.x = mod(p.x - origin.x + 60.0, 120.0) - 60.0 + origin.x;
          p.z = mod(p.z - origin.z + 60.0, 120.0) - 60.0 + origin.z;
          p.y += origin.y - 20.0;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          vA = smoothstep(90.0, 15.0, -mv.z) * (0.75 + 0.25 * sin(time * 3.0 + seed * 20.0));
          gl_PointSize = size * scale / max(-mv.z, 0.1);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 color; uniform float alpha; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(color, alpha * vA * smoothstep(0.5, 0.1, d));
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false,
      blending: cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 6;
    this.scene.add(pts);
    this.weather = pts;
  }

  // Chamado antes de renderizar cada tela dividida.
  prepareView(camera, viewportHeight) {
    const s = viewportHeight * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    this.add.setScale(s);
    this.norm.setScale(s);
    if (this.weather) {
      this.weather.material.uniforms.scale.value = s;
      this.weather.material.uniforms.origin.value.copy(camera.position);
    }
  }

  update(dt, t) {
    this.add.update(dt);
    this.norm.update(dt);
    if (this.weather) this.weather.material.uniforms.time.value = t;
  }

  // ---------- Emissores ----------
  sparks(p, color, n = 2) {
    for (let i = 0; i < n; i++) {
      this.add.emit(p.x, p.y + 0.2, p.z, (Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6,
        0.25 + Math.random() * 0.2, 0.5, 0.1, color, 1, 20, 1);
    }
  }

  dust(p, n = 1, color = this.dustColor) {
    for (let i = 0; i < n; i++) {
      this.norm.emit(p.x + (Math.random() - 0.5), p.y + 0.3, p.z + (Math.random() - 0.5), (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3,
        0.6 + Math.random() * 0.4, 0.8, 2.4, color, 0.55, 0, 2);
    }
  }

  smoke(p, n = 1) {
    for (let i = 0; i < n; i++) {
      this.norm.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 1.5, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5,
        0.8 + Math.random() * 0.6, 0.6, 2.2, COLORS.smoke, 0.45, -0.5, 1);
    }
  }

  boostFlame(p, dir, n = 2) {
    for (let i = 0; i < n; i++) {
      const c = Math.random() < 0.5 ? COLORS.fire : COLORS.fireCore;
      this.add.emit(p.x, p.y, p.z, dir.x * 8 + (Math.random() - 0.5) * 2, 1 + Math.random(), dir.z * 8 + (Math.random() - 0.5) * 2,
        0.18 + Math.random() * 0.12, 0.9, 0.2, c, 1, 0, 3);
    }
  }

  burst(p, color, n = 30, speed = 10, size = 0.8, life = 0.8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.add.emit(p.x, p.y, p.z, Math.cos(a) * Math.cos(b) * s, Math.abs(Math.sin(b)) * s + 2, Math.sin(a) * Math.cos(b) * s,
        life * (0.6 + Math.random() * 0.6), size, 0.1, color, 1, 12, 1.5);
    }
  }

  explosion(p) {
    this.burst(p, COLORS.fireCore, 30, 14, 1.4, 0.6);
    this.burst(p, COLORS.fire, 40, 10, 1.8, 0.9);
    for (let i = 0; i < 18; i++) {
      this.norm.emit(p.x, p.y + 1, p.z, (Math.random() - 0.5) * 8, 3 + Math.random() * 4, (Math.random() - 0.5) * 8,
        1.2 + Math.random(), 2, 5, COLORS.smoke, 0.6, -1, 1.5);
    }
  }

  confetti(p, n = 60) {
    const cols = [0xff3b3b, 0xffd23f, 0x2f7bff, 0x35d07f, 0xff5fb0, 0xffffff];
    for (let i = 0; i < n; i++) {
      this.tmp.set(cols[i % cols.length]);
      this.norm.emit(p.x + (Math.random() - 0.5) * 6, p.y + 6 + Math.random() * 4, p.z + (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 10, 4 + Math.random() * 8, (Math.random() - 0.5) * 10, 2 + Math.random() * 1.5, 0.5, 0.4, this.tmp.clone(), 1, 6, 1.5);
    }
  }

  coinSparkle(p) {
    this.burst(p, COLORS.gold, 12, 6, 0.6, 0.5);
  }

  splash(p, color, n = 20) {
    for (let i = 0; i < n; i++) {
      this.norm.emit(p.x, p.y + 0.5, p.z, (Math.random() - 0.5) * 8, 4 + Math.random() * 6, (Math.random() - 0.5) * 8,
        0.7 + Math.random() * 0.4, 0.8, 0.4, color, 0.9, 20, 0.5);
    }
  }

  dispose() {
    this.add.dispose(this.scene);
    this.norm.dispose(this.scene);
    if (this.weather) {
      this.scene.remove(this.weather);
      this.weather.geometry.dispose();
      this.weather.material.dispose();
    }
  }
}
