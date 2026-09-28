// Controles de toque para celular/tablet: volante virtual à esquerda e botões à direita.

export const touchState = { steer: 0, throttle: 0, brake: 0, drift: false, item: false, pause: false, connected: true };

export const isTouchDevice = () =>
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;

let root = null;
let onPause = null;

function reset() {
  touchState.steer = 0; touchState.throttle = 0; touchState.brake = 0;
  touchState.drift = false; touchState.item = false; touchState.pause = false;
}

// Monta os controles sobre a área de um jogador (rect em frações da tela).
export function mountTouch(rect, pauseFn) {
  unmountTouch();
  onPause = pauseFn;
  root = document.createElement('div');
  root.id = 'touch';
  Object.assign(root.style, { left: rect.x * 100 + '%', top: rect.y * 100 + '%', width: rect.w * 100 + '%', height: rect.h * 100 + '%' });
  root.innerHTML = `
    <div class="t-steer"><div class="t-ring"><div class="t-knob"></div></div><span>Arraste para virar</span></div>
    <button class="t-btn t-gas" data-k="throttle">▲<small>Acelerar</small></button>
    <button class="t-btn t-brake" data-k="brake">▼<small>Frear</small></button>
    <button class="t-btn t-item" data-k="item">🎁<small>Item</small></button>
    <button class="t-btn t-drift" data-k="drift">↯<small>Derrapar</small></button>
    <button class="t-pause" aria-label="Pausar">❚❚</button>`;
  document.body.appendChild(root);
  reset();

  // volante virtual: o ponto onde o dedo encosta vira o centro
  const pad = root.querySelector('.t-steer');
  const ring = root.querySelector('.t-ring');
  const knob = root.querySelector('.t-knob');
  let steerId = null, originX = 0;
  const range = () => Math.max(40, pad.clientWidth * 0.22);
  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    steerId = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    const r = pad.getBoundingClientRect();
    originX = e.clientX;
    ring.style.left = (e.clientX - r.left) + 'px';
    ring.style.top = (e.clientY - r.top) + 'px';
    ring.classList.add('on');
  });
  pad.addEventListener('pointermove', e => {
    if (e.pointerId !== steerId) return;
    const dx = e.clientX - originX;
    const s = Math.max(-1, Math.min(1, dx / range()));
    touchState.steer = Math.abs(s) < 0.08 ? 0 : s;
    knob.style.transform = `translate(${s * 38}px, 0)`;
  });
  const endSteer = e => {
    if (e.pointerId !== steerId) return;
    steerId = null;
    touchState.steer = 0;
    knob.style.transform = '';
    ring.classList.remove('on');
  };
  pad.addEventListener('pointerup', endSteer);
  pad.addEventListener('pointercancel', endSteer);

  // botões (vários dedos ao mesmo tempo)
  for (const b of root.querySelectorAll('.t-btn')) {
    const k = b.dataset.k;
    const set = v => {
      touchState[k] = k === 'throttle' || k === 'brake' ? (v ? 1 : 0) : v;
      b.classList.toggle('down', v);
      if (v && navigator.vibrate) { try { navigator.vibrate(10); } catch (err) { /* ignore */ } }
    };
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); set(true); });
    b.addEventListener('pointerup', () => set(false));
    b.addEventListener('pointercancel', () => set(false));
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  root.querySelector('.t-pause').addEventListener('pointerdown', e => { e.preventDefault(); if (onPause) onPause(); });
}

export function unmountTouch() {
  if (root) root.remove();
  root = null;
  reset();
}

export function setTouchVisible(v) {
  if (root) root.style.display = v ? '' : 'none';
  if (!v) reset();
}
