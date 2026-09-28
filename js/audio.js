// Áudio 100% sintetizado com Web Audio: efeitos, motores e trilha sonora procedural.
import { rng } from './utils.js';

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minorPent: [0, 3, 5, 7, 10],
  arabic: [0, 1, 4, 5, 7, 8, 10],
};
const PROG = {
  major: [0, 4, 5, 3],
  minor: [0, 5, 2, 6],
  minorPent: [0, 3, 2, 4],
  arabic: [0, 1, 0, 5],
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

export class AudioSys {
  constructor() {
    this.ctx = null;
    let m = false;
    try { m = localStorage.getItem('marileo_mute') === '1'; } catch (e) { /* ignore */ }
    this.muted = m;
    this.music = null;
    this.rate = 1;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(comp);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.master);
    this.mus = ctx.createGain(); this.mus.gain.value = 0.26; this.mus.connect(this.master);
    this.eng = ctx.createGain(); this.eng.gain.value = 0.5; this.eng.connect(this.master);
    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('marileo_mute', this.muted ? '1' : '0'); } catch (e) { /* ignore */ }
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.3, when = 0, slideTo = null, dest = null) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise(dur, vol = 0.3, freq = 1000, when = 0, type = 'bandpass', slideTo = null, q = 1, dest = null) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'coin': this.tone(988, 0.08, 'square', 0.15); this.tone(1319, 0.3, 'square', 0.15, 0.07); break;
      case 'box': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.22, i * 0.04)); break;
      case 'roulette': this.tone(1400 + Math.random() * 400, 0.03, 'square', 0.05); break;
      case 'item': this.tone(880, 0.1, 'triangle', 0.25); this.tone(1320, 0.18, 'triangle', 0.25, 0.08); break;
      case 'boost':
        this.noise(0.7, 0.35, 400, 0, 'bandpass', 3500, 2);
        this.tone(180, 0.6, 'sawtooth', 0.12, 0, 700);
        break;
      case 'miniturbo': this.noise(0.4, 0.3, 600, 0, 'bandpass', 3000, 2); this.tone(300, 0.3, 'sawtooth', 0.1, 0, 800); break;
      case 'hit':
        this.tone(700, 0.5, 'square', 0.2, 0, 90);
        this.noise(0.3, 0.3, 800, 0, 'lowpass', 200);
        break;
      case 'spin': for (let i = 0; i < 4; i++) this.tone(900 - i * 150, 0.14, 'sawtooth', 0.1, i * 0.12, 500 - i * 100); break;
      case 'shield': this.tone(400, 0.4, 'sine', 0.25, 0, 900); this.tone(600, 0.4, 'sine', 0.18, 0.05, 1300); break;
      case 'shieldBreak': this.noise(0.4, 0.3, 3000, 0, 'highpass', 6000); this.tone(1200, 0.3, 'triangle', 0.2, 0, 300); break;
      case 'drop': this.tone(300, 0.12, 'triangle', 0.25, 0, 180); break;
      case 'missile': this.noise(0.8, 0.25, 2000, 0, 'highpass', 800); this.tone(200, 0.6, 'sawtooth', 0.12, 0, 900); break;
      case 'explosion': this.noise(1.0, 0.7, 3000, 0, 'lowpass', 80); this.tone(120, 0.6, 'sine', 0.5, 0, 40); break;
      case 'bump': this.noise(0.15, 0.4, 400, 0, 'lowpass', 100); break;
      case 'count': this.tone(440, 0.35, 'square', 0.22); break;
      case 'go': this.tone(880, 0.7, 'square', 0.22); this.tone(1320, 0.7, 'square', 0.1); break;
      case 'lap': [659, 784, 988].forEach((f, i) => this.tone(f, 0.15, 'square', 0.18, i * 0.1)); break;
      case 'finallap': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.18, 'square', 0.18, i * 0.09)); break;
      case 'finish':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, i === 5 ? 0.9 : 0.16, 'square', 0.2, i * 0.13));
        [262, 330, 392, 523].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.2, 0.39 + i * 0.13));
        break;
      case 'lose': [392, 370, 349, 330].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.2, i * 0.25)); break;
      case 'jump': this.tone(300, 0.25, 'sine', 0.25, 0, 700); break;
      case 'trick': this.tone(700, 0.1, 'square', 0.15); this.tone(1050, 0.2, 'square', 0.15, 0.08); break;
      case 'land': this.noise(0.12, 0.3, 300, 0, 'lowpass', 100); break;
      case 'star': [523, 659, 784, 988, 1175, 1319].forEach((f, i) => this.tone(f, 0.1, 'square', 0.14, i * 0.05)); break;
      case 'ink': this.noise(0.5, 0.4, 900, 0, 'lowpass', 150, 4); this.tone(200, 0.4, 'sine', 0.3, 0, 60); break;
      case 'crush': this.noise(0.5, 0.6, 600, 0, 'lowpass', 60); this.tone(140, 0.5, 'square', 0.25, 0, 40); break;
      case 'geyser': this.noise(1.0, 0.35, 700, 0, 'bandpass', 2000, 1.5); break;
      case 'splash': this.noise(0.5, 0.4, 1500, 0, 'bandpass', 300, 1); break;
      case 'wrong': this.tone(220, 0.15, 'square', 0.15); this.tone(220, 0.15, 'square', 0.15, 0.2); break;
      case 'select': this.tone(660, 0.07, 'square', 0.12); break;
      case 'confirm': this.tone(660, 0.08, 'square', 0.15); this.tone(990, 0.15, 'square', 0.15, 0.07); break;
      case 'back': this.tone(500, 0.08, 'square', 0.12); this.tone(330, 0.12, 'square', 0.12, 0.07); break;
      case 'drift': this.noise(0.25, 0.12, 2500, 0, 'bandpass', 1800, 6); break;
      case 'star1': this.tone(1047, 0.15, 'triangle', 0.2); this.tone(1568, 0.3, 'triangle', 0.2, 0.1); break;
    }
  }

  // Som contínuo de motor para os jogadores humanos.
  createEngine() {
    if (!this.ctx) return null;
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 3;
    const g = ctx.createGain(); g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.eng);
    o1.start(); o2.start();
    return {
      set: (speed, boost, active) => {
        const t = ctx.currentTime;
        const base = 55 + Math.abs(speed) * 3.2 + (boost ? 40 : 0);
        o1.frequency.setTargetAtTime(base, t, 0.05);
        o2.frequency.setTargetAtTime(base * 0.502, t, 0.05);
        f.frequency.setTargetAtTime(400 + Math.abs(speed) * 30 + (boost ? 800 : 0), t, 0.05);
        g.gain.setTargetAtTime(active ? 0.06 + Math.min(Math.abs(speed), 50) * 0.0012 : 0, t, 0.08);
      },
      stop: () => {
        g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        o1.stop(ctx.currentTime + 0.3); o2.stop(ctx.currentTime + 0.3);
      },
    };
  }

  // ---------- Música procedural ----------
  startMusic(cfg) {
    this.stopMusic();
    if (!this.ctx) return;
    const r = rng(cfg.seed || 1);
    const scale = SCALES[cfg.scale] || SCALES.major;
    const prog = PROG[cfg.scale] || PROG.major;
    const root = cfg.root || 60;
    const deg = (d, oct = 0) => {
      const n = scale.length;
      const o = Math.floor(d / n);
      return root + scale[((d % n) + n) % n] + 12 * (o + oct);
    };
    // Frases de melodia: A e B (2 compassos cada) → AABA
    const phrase = () => {
      const notes = [];
      let cur = Math.floor(r() * scale.length);
      for (let s = 0; s < 32; s++) {
        const strong = s % 4 === 0;
        if (strong || r() < 0.45) {
          cur += Math.floor(r() * 5) - 2;
          cur = Math.max(-2, Math.min(scale.length + 4, cur));
          const len = r() < 0.3 ? 2 : 1;
          notes.push({ s, d: cur, len: strong && r() < 0.4 ? 3 : len });
        }
      }
      return notes;
    };
    const A = phrase(), B = phrase();
    const song = [A, A, B, A];
    this.music = { cfg, step: 0, next: this.ctx.currentTime + 0.1, song, prog, deg };
    const tick = () => {
      if (!this.music) return;
      const m = this.music;
      const spb = 60 / (cfg.tempo * this.rate) / 4;
      while (m.next < this.ctx.currentTime + 0.12) {
        this._musicStep(m, m.step, m.next, spb);
        m.step = (m.step + 1) % 128;
        m.next += spb;
      }
    };
    this.music.timer = setInterval(tick, 25);
  }

  _musicStep(m, step, t, spb) {
    const ctx = this.ctx;
    const bar = Math.floor(step / 16), s = step % 16;
    const chord = m.prog[bar % 4];
    const when = t - ctx.currentTime;
    const dest = this.mus;
    // baixo
    const bassPat = [0, null, 7, null, 0, null, 7, 0, 0, null, 7, null, 0, 7, null, 0];
    if (bassPat[s] !== null) this.tone(mtof(m.deg(chord, -2) + (bassPat[s] === 7 ? 12 : 0)), spb * 1.6, 'triangle', 0.5, when, null, dest);
    // arpejo
    if (s % 2 === 0) {
      const arp = [0, 2, 4, 2][(s / 2) % 4];
      this.tone(mtof(m.deg(chord + arp, 0)), spb * 1.2, 'square', 0.06, when, null, dest);
    }
    // melodia
    const phrase = m.song[Math.floor(bar / 2) % 4];
    const local = (bar % 2) * 16 + s;
    for (const n of phrase) if (n.s === local) this.tone(mtof(m.deg(n.d + chord, 1)), spb * n.len * 1.4, 'square', 0.12, when, null, dest);
    // bateria
    if (s === 0 || s === 8 || (s === 10 && bar % 2)) this.tone(150, 0.18, 'sine', 0.9, when, 45, dest);
    if (s === 4 || s === 12) this.noise(0.14, 0.35, 1800, when, 'bandpass', null, 0.8, dest);
    if (s % 2 === 1) this.noise(0.04, 0.12, 8000, when, 'highpass', null, 1, dest);
  }

  setMusicRate(r) { this.rate = r; }

  stopMusic() {
    if (this.music) { clearInterval(this.music.timer); this.music = null; }
    this.rate = 1;
  }
}

export const audio = new AudioSys();
