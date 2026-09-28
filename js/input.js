// Entrada: dois jogadores no teclado + até 4 controles (gamepads).

export const SOURCES = [
  { id: 'kb1', label: 'Teclado W A S D' },
  { id: 'kb2', label: 'Teclado Setas' },
  { id: 'gp0', label: 'Controle 1' },
  { id: 'gp1', label: 'Controle 2' },
  { id: 'gp2', label: 'Controle 3' },
  { id: 'gp3', label: 'Controle 4' },
];

const LAYOUTS = {
  kb1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], item: ['Space', 'KeyE', 'KeyF'], drift: ['ShiftLeft', 'KeyQ'] },
  kb2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], item: ['Enter', 'NumpadEnter', 'KeyL'], drift: ['ShiftRight', 'Numpad0', 'Digit0', 'KeyK', 'ControlRight'] },
};

const keys = new Set();
const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
let listeners = [];

window.addEventListener('keydown', e => {
  if (PREVENT.has(e.code) && !(e.target instanceof HTMLSelectElement)) e.preventDefault();
  if (!e.repeat) for (const l of listeners) l(e.code);
  keys.add(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

export function onKey(fn) { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; }

const any = arr => arr.some(k => keys.has(k));

function readGamepad(index) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && pads[index];
  const s = { steer: 0, throttle: 0, brake: 0, drift: false, item: false, pause: false, up: false, down: false, connected: !!gp };
  if (!gp) return s;
  const b = i => gp.buttons[i] ? (typeof gp.buttons[i] === 'object' ? gp.buttons[i].value || (gp.buttons[i].pressed ? 1 : 0) : gp.buttons[i]) : 0;
  let x = gp.axes[0] || 0;
  if (Math.abs(x) < 0.18) x = 0;
  if (b(14)) x = -1;
  if (b(15)) x = 1;
  s.steer = Math.max(-1, Math.min(1, x));
  s.throttle = Math.max(b(0), b(7));
  s.brake = Math.max(b(1), b(6));
  s.item = b(2) > 0.5 || b(4) > 0.5;
  s.drift = b(5) > 0.5 || b(3) > 0.5;
  s.pause = b(9) > 0.5;
  s.back = b(1) > 0.5;
  const y = gp.axes[1] || 0;
  s.up = b(12) > 0.5 || y < -0.6;
  s.down = b(13) > 0.5 || y > 0.6;
  return s;
}

export function readSource(src) {
  if (src.startsWith('gp')) return readGamepad(+src.slice(2));
  const L = LAYOUTS[src];
  const left = any(L.left), right = any(L.right);
  return {
    steer: (right ? 1 : 0) - (left ? 1 : 0),
    throttle: any(L.up) ? 1 : 0,
    brake: any(L.down) ? 1 : 0,
    drift: any(L.drift),
    item: any(L.item),
    pause: false,
    up: any(L.up),
    down: any(L.down),
    connected: true,
  };
}

export function connectedGamepads() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const out = [];
  for (let i = 0; i < 4; i++) if (pads[i]) out.push(i);
  return out;
}

// Controlador por jogador com detecção de "apertou agora".
export class PlayerInput {
  constructor(source) {
    this.source = source;
    this.prev = { item: false, drift: false, left: false, right: false, pause: false, up: false, down: false, throttle: false };
    this.state = null;
  }
  poll() {
    const s = readSource(this.source);
    const p = this.prev;
    const left = s.steer < -0.5, right = s.steer > 0.5, thr = s.throttle > 0.5;
    s.itemPressed = s.item && !p.item;
    s.driftPressed = s.drift && !p.drift;
    s.leftPressed = left && !p.left;
    s.rightPressed = right && !p.right;
    s.pausePressed = s.pause && !p.pause;
    s.upPressed = s.up && !p.up;
    s.downPressed = s.down && !p.down;
    s.confirmPressed = (s.itemPressed) || (thr && !p.throttle && this.source.startsWith('gp'));
    s.backPressed = !!s.back && !p.back;
    this.prev = { item: s.item, drift: s.drift, left, right, pause: s.pause, up: s.up, down: s.down, throttle: thr, back: !!s.back };
    this.state = s;
    return s;
  }
}
