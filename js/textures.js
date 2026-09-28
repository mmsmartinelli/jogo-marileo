// Texturas procedurais desenhadas em canvas (nenhum arquivo de imagem externo).
import * as THREE from 'three';
import { rng } from './utils.js';

let maxAniso = 4;
export function setMaxAnisotropy(a) { maxAniso = a; }

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(c, repeatX = 1, repeatY = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function speckle(ctx, w, h, count, colors, r, sizeMin, sizeMax) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = sizeMin + r() * (sizeMax - sizeMin);
    ctx.globalAlpha = 0.25 + r() * 0.5;
    ctx.fillRect(r() * w, r() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

// Asfalto com faixa central tracejada. u = largura da pista, v = comprimento.
export function roadTexture(theme) {
  const W = 512, H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = rng(7);
  ctx.fillStyle = theme.road;
  ctx.fillRect(0, 0, W, H);
  speckle(ctx, W, H, 9000, theme.roadSpeckle, r, 1, 3);
  // manchas suaves
  for (let i = 0; i < 40; i++) {
    const g = ctx.createRadialGradient(r() * W, r() * H, 0, r() * W, r() * H, 60);
    ctx.fillStyle = g;
    g.addColorStop(0, 'rgba(0,0,0,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillRect(0, 0, W, H);
  }
  // marcas de pneu escurecidas no centro das faixas
  const grd = ctx.createLinearGradient(0, 0, W, 0);
  grd.addColorStop(0, 'rgba(0,0,0,0.15)');
  grd.addColorStop(0.2, 'rgba(0,0,0,0)');
  grd.addColorStop(0.3, 'rgba(0,0,0,0.08)');
  grd.addColorStop(0.4, 'rgba(0,0,0,0)');
  grd.addColorStop(0.6, 'rgba(0,0,0,0)');
  grd.addColorStop(0.7, 'rgba(0,0,0,0.08)');
  grd.addColorStop(0.8, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  // faixa branca lateral
  ctx.fillStyle = theme.lineColor || 'rgba(255,255,255,0.9)';
  ctx.fillRect(10, 0, 8, H);
  ctx.fillRect(W - 18, 0, 8, H);
  // tracejado central
  ctx.fillRect(W / 2 - 5, 0, 10, H * 0.45);
  return toTexture(c);
}

// Zebra das bordas (vermelho/branco ou cores do tema).
export function curbTexture(a, b) {
  const c = canvas(64, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = a; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = b; ctx.fillRect(0, 64, 64, 64);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, 6, 128);
  return toTexture(c);
}

export function groundTexture(colors, seed = 3, blades = true) {
  const S = 512;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  const r = rng(seed);
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const x = r() * S, y = r() * S, rad = 20 + r() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const col = colors[1 + Math.floor(r() * (colors.length - 1))];
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = g;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      ctx.save(); ctx.translate(dx, dy);
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  if (blades) {
    for (let i = 0; i < 7000; i++) {
      const x = r() * S, y = r() * S;
      ctx.strokeStyle = colors[Math.floor(r() * colors.length)];
      ctx.globalAlpha = 0.35 + r() * 0.4;
      ctx.lineWidth = 1 + r();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4); ctx.stroke();
    }
  } else {
    speckle(ctx, S, S, 8000, colors, r, 1, 3);
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

export function checkerTexture(n = 8, m = 2) {
  const c = canvas(n * 32, m * 32);
  const ctx = c.getContext('2d');
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    ctx.fillStyle = (i + j) % 2 ? '#111' : '#fafafa';
    ctx.fillRect(i * 32, j * 32, 32, 32);
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function wallTexture(a, b) {
  const c = canvas(128, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = a; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = b; ctx.fillRect(64, 0, 64, 64);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.15, 'rgba(255,255,255,0)');
  g.addColorStop(0.85, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 64);
  return toTexture(c);
}

// Caixa surpresa com "?" em arco-íris.
export function itemBoxTexture(fake = false) {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, S, S);
  const cols = fake ? ['#ff4d4d', '#ff9a3d', '#ff4d9a'] : ['#ff5ec4', '#ffd23f', '#4de0ff', '#7c5cff'];
  cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 0, S, 18); ctx.fillRect(0, 0, 18, S);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, S - 18, S, 18); ctx.fillRect(S - 18, 0, 18, S);
  ctx.font = 'bold 190px Arial Black, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 14;
  ctx.strokeStyle = 'rgba(40,20,80,0.9)';
  ctx.save();
  ctx.translate(S / 2, S / 2 + 10);
  if (fake) ctx.rotate(Math.PI);
  ctx.strokeText('?', 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillText('?', 0, 0);
  ctx.restore();
  return toTexture(c);
}

export function boostPadTexture() {
  const c = canvas(128, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#ff8a00'); g.addColorStop(1, '#ffd000');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = '#fff7c2';
  for (let i = 0; i < 3; i++) {
    const y = 20 + i * 80;
    ctx.beginPath();
    ctx.moveTo(14, y + 60); ctx.lineTo(64, y); ctx.lineTo(114, y + 60);
    ctx.lineTo(114, y + 84); ctx.lineTo(64, y + 26); ctx.lineTo(14, y + 84);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#b35400'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 120, 248);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function rampTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#2a2a3a' : '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(i * 32 - 64, 0); ctx.lineTo(i * 32 - 32, 0); ctx.lineTo(i * 32 + 32 - 64 + 64, 128); ctx.lineTo(i * 32, 128);
    ctx.closePath(); ctx.fill();
  }
  return toTexture(c);
}

export function lavaTexture() {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  const r = rng(11);
  ctx.fillStyle = '#b81d00'; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const x = r() * S, y = r() * S, rad = 10 + r() * 45;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, r() < 0.5 ? '#ffe45c' : '#ff8a1a');
    g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, rad, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = 'rgba(60,0,0,0.5)'; ctx.lineWidth = 2 + r() * 4;
    ctx.beginPath();
    let x = r() * S, y = r() * S; ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  return toTexture(c);
}

export function cloudTexture() {
  const S = 256;
  const c = canvas(S, S / 2);
  const ctx = c.getContext('2d');
  const r = rng(5);
  for (let i = 0; i < 16; i++) {
    const x = 40 + r() * (S - 80), y = 70 + (r() - 0.5) * 30, rad = 22 + r() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function blobShadowTexture() {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function bannerTexture(text, bg = '#d11a2a', fg = '#fff') {
  const c = canvas(1024, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(0, 0, 1024, 12);
  ctx.font = 'bold 84px Arial Black, Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeText(text, 512, 68);
  ctx.fillStyle = fg; ctx.fillText(text, 512, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}

// Manchas de tinta para a pegadinha da lula (usada no HUD como imagem).
export function inkDataURL(seed) {
  const c = canvas(512, 288);
  const ctx = c.getContext('2d');
  const r = rng(seed);
  for (let i = 0; i < 9; i++) {
    const x = 60 + r() * 392, y = 40 + r() * 208, rad = 40 + r() * 70;
    ctx.fillStyle = 'rgba(20,10,40,0.92)';
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 10; k++) {
      const a = r() * Math.PI * 2, d = rad * (0.9 + r() * 0.8);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 5 + r() * 16, 0, Math.PI * 2); ctx.fill();
    }
  }
  return c.toDataURL();
}
