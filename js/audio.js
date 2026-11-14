// Áudio com Web Audio: efeitos e motores sintetizados; trilha em arquivo (audio/musica/) com a
// música procedural de antes como reserva quando o arquivo falta ou não carrega.
import { rng } from './utils.js';

// ---------- Trilha em arquivo ----------
// Só entram aqui as faixas que JÁ estão na pasta audio/musica/ (faixa que não está na lista não é
// baixada). Faixa que falta ou não carrega: a corrida toca a música sintetizada; menu e pódio ficam
// em silêncio, como era antes.
//   file: nome do arquivo (.m4a AAC ~96 kbps)
//   loop: [início, fim] em segundos — a parte que repete sem emenda (a introdução toca uma vez só).
//         Sem loop: repete o arquivo inteiro. once: true = vinheta que toca uma vez (vitória).
//   vol:  ajuste fino de volume da faixa (1 = normal)
//   final: faixa própria da última volta (opcional); sem ela, a música acelera um pouco
const MUSIC_DIR = 'audio/musica/';
export const MUSIC_FILES = {
  // menu: { file: 'menu.m4a', loop: [3.2, 67.2] },
  // 'corrida-brasil': { file: 'corrida-brasil.m4a', loop: [1.6, 84.8] },
  // vitoria: { file: 'vitoria.m4a', once: true },
};
// Qual faixa de corrida toca em cada cidade (as pistas da Copa Infinita usam a da cidade-base).
export const CITY_MUSIC = {
  osasco: 'corrida-brasil', rio: 'corrida-brasil',
  novayork: 'corrida-metropole', londres: 'corrida-metropole', sydney: 'corrida-metropole',
  paris: 'corrida-europa', roma: 'corrida-europa',
  cairo: 'corrida-deserto', dubai: 'corrida-deserto', agra: 'corrida-deserto',
  pequim: 'corrida-asia', toquio: 'corrida-asia',
  vale: 'corrida-fantasia', deserto: 'corrida-fantasia', neve: 'corrida-fantasia', doce: 'corrida-fantasia', vulcao: 'corrida-fantasia',
};
const FILE_GAIN = 0.42;      // volume base da trilha em arquivo (já vem masterizada, mais alta que a sintetizada)
const FILE_FINAL_RATE = 1.06; // última volta sem faixa própria: ~1 semitom mais rápida
const MAX_DECODED = 3;        // faixas abertas na memória ao mesmo tempo (cada 80 s ≈ 30 MB)

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minorPent: [0, 3, 5, 7, 10],
  arabic: [0, 1, 4, 5, 7, 8, 10],
  majorPent: [0, 2, 4, 7, 9],
  japan: [0, 2, 3, 7, 8],
  blues: [0, 3, 5, 6, 7, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  indian: [0, 1, 4, 5, 7, 8, 11],
};
const PROG = {
  major: [0, 4, 5, 3],
  minor: [0, 5, 2, 6],
  minorPent: [0, 3, 2, 4],
  arabic: [0, 1, 0, 5],
  majorPent: [0, 3, 1, 4],
  japan: [0, 3, 2, 0],
  blues: [0, 2, 0, 4],
  mixolydian: [0, 6, 3, 0],
  harmonic: [0, 3, 4, 0],
  indian: [0, 1, 3, 0],
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
    this.track = null;        // faixa em arquivo tocando agora: { id, src, gain, spec }
    this._want = null;        // última música pedida (para tocar assim que o som for liberado)
    this._req = 0;            // vale só o pedido mais recente
    this._raw = new Map();    // id -> Promise<ArrayBuffer> (arquivo baixado, comprimido)
    this._bufs = new Map();   // id -> AudioBuffer (aberto, pronto para tocar)
    this._failed = new Set(); // faixas que não carregaram nesta sessão
    this._holds = new Set();  // motivos para o som ficar parado (anúncio, app em segundo plano)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.hold('hidden', document.hidden));
    }
  }

  init() {
    if (this.ctx) { if (this.ctx.state !== 'running' && !this._holds.size) this.ctx.resume(); return; }
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
    this.musFile = ctx.createGain(); this.musFile.gain.value = FILE_GAIN; this.musFile.connect(this.master);
    // a música pedida antes do primeiro toque (menu) começa agora
    if (this._want) { const w = this._want; this._want = null; this._play(w); }
  }

  // Para/retoma todo o som por um motivo (ex.: 'ad' durante o anúncio, 'hidden' com o app em segundo plano).
  hold(reason, on) {
    if (on) this._holds.add(reason); else this._holds.delete(reason);
    if (!this.ctx) return;
    if (this._holds.size) this.ctx.suspend();
    else this.ctx.resume();
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
    // com a vinheta em arquivo, a fanfarra sintetizada não toca por cima dela
    if ((name === 'finish' && MUSIC_FILES.vitoria) || (name === 'lose' && MUSIC_FILES.chegada)) return;
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
      case 'pigeons': for (let i = 0; i < 7; i++) this.noise(0.06, 0.22, 1800 + Math.random() * 900, i * 0.055, 'bandpass', 900, 2); this.tone(620, 0.12, 'sine', 0.08, 0.05, 480); this.tone(560, 0.14, 'sine', 0.07, 0.22, 430); break;
      case 'poop': this.noise(0.25, 0.45, 700, 0, 'lowpass', 120, 3); this.tone(900, 0.25, 'sine', 0.15, 0.05, 200); break;
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
    this._stopSynth();
    this.rate = 1;
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

  // ---------- Trilha em arquivo: menu, corrida, última volta e vitória ----------
  // Menu e telas de escolha. Sem arquivo: silêncio (como antes).
  menuMusic() { this._request({ id: 'menu', fade: 1.2 }); }

  // Corrida: faixa da região da cidade; sem arquivo, a música sintetizada da pista.
  raceMusic(def) {
    const id = CITY_MUSIC[def.city] || CITY_MUSIC[def.id] || 'corrida-metropole';
    this._request({ id, fallback: def.music, fade: 1.0 });
  }

  // Fim da corrida: vinheta de vitória (ou de chegada) e depois o tema do pódio.
  // Sem os arquivos, a música da corrida continua, como antes.
  finishMusic(won) {
    const jingle = won ? 'vitoria' : (MUSIC_FILES.chegada ? 'chegada' : null);
    const next = MUSIC_FILES.podio ? { id: 'podio', fade: 1.5 } : null;
    if (jingle && MUSIC_FILES[jingle]) this._request({ id: jingle, fade: 0.25, next });
    else if (next) this._request(next);
  }

  // Pede uma música; se o som ainda não foi liberado (antes do primeiro toque), guarda para depois.
  _request(w) {
    if (!this.ctx) { this._want = w; return; }
    this._play(w);
  }

  _play(w) {
    const req = ++this._req;
    const spec = MUSIC_FILES[w.id];
    const ok = spec && !this._failed.has(w.id);
    if (this.track && this.track.id === w.id && ok && !spec.once) return; // já está tocando
    if (!ok) { this._fallback(w); return; }
    this._load(w.id).then(buf => {
      if (req !== this._req) return; // outro pedido chegou antes de terminar de carregar
      this._startBuffer(w, spec, buf);
    }, () => {
      this._failed.add(w.id);
      if (req === this._req) this._fallback(w);
    });
  }

  // Arquivo indisponível: corrida volta para a música sintetizada; menu/pódio ficam quietos.
  _fallback(w) {
    this._fadeOutTrack(0.4);
    if (w.fallback) { if (!this.music) this.startMusic(w.fallback); }
    else this._stopSynth();
  }

  _load(id) {
    const hit = this._bufs.get(id);
    if (hit) { this._bufs.delete(id); this._bufs.set(id, hit); return Promise.resolve(hit); } // mais recente no fim
    let raw = this._raw.get(id);
    if (!raw) {
      raw = fetch(MUSIC_DIR + MUSIC_FILES[id].file).then(r => {
        if (!r.ok) throw new Error(`música ${id}: HTTP ${r.status}`);
        return r.arrayBuffer();
      });
      this._raw.set(id, raw);
      raw.catch(() => this._raw.delete(id));
    }
    // decodeAudioData "consome" o ArrayBuffer: decodifica uma cópia para poder abrir de novo depois
    return raw.then(ab => new Promise((res, rej) => this.ctx.decodeAudioData(ab.slice(0), res, rej))).then(buf => {
      this._bufs.set(id, buf);
      while (this._bufs.size > MAX_DECODED) {
        const old = [...this._bufs.keys()].find(k => !this.track || k !== this.track.id);
        this._bufs.delete(old);
      }
      return buf;
    });
  }

  // Baixa (sem abrir) faixas que devem tocar logo, para a corrida não começar muda.
  prefetchMusic(ids) {
    for (const id of ids) {
      if (!MUSIC_FILES[id] || this._raw.has(id) || this._failed.has(id)) continue;
      const raw = fetch(MUSIC_DIR + MUSIC_FILES[id].file).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
      this._raw.set(id, raw);
      raw.catch(() => this._raw.delete(id));
    }
  }

  _startBuffer(w, spec, buf) {
    const ctx = this.ctx, t = ctx.currentTime, fade = w.fade ?? 1;
    this._stopSynth();
    this._fadeOutTrack(fade);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (!spec.once) {
      src.loop = true;
      if (spec.loop) { src.loopStart = spec.loop[0]; src.loopEnd = Math.min(spec.loop[1], buf.duration); }
    }
    const gain = ctx.createGain();
    const vol = spec.vol ?? 1;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + Math.max(0.05, fade));
    src.connect(gain); gain.connect(this.musFile);
    src.start(t);
    const track = { id: w.id, src, gain, spec, vol };
    this.track = track;
    if (spec.once) {
      src.onended = () => {
        if (this.track !== track) return;
        this.track = null;
        if (w.next) this._play(w.next);
      };
    }
  }

  _fadeOutTrack(sec) {
    const tr = this.track;
    if (!tr || !this.ctx) return;
    this.track = null;
    const t = this.ctx.currentTime;
    tr.src.onended = null;
    tr.gain.gain.cancelScheduledValues(t);
    tr.gain.gain.setValueAtTime(Math.max(0.0001, tr.gain.gain.value), t);
    tr.gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, sec));
    try { tr.src.stop(t + Math.max(0.05, sec) + 0.05); } catch (e) { /* já parou */ }
  }

  _stopSynth() {
    if (this.music) { clearInterval(this.music.timer); this.music = null; }
  }

  // Última volta: troca para a faixa própria (se houver) ou acelera a música um pouco.
  setMusicRate(r) {
    this.rate = r;
    const tr = this.track;
    if (!tr || !this.ctx) return;
    if (r > 1 && tr.spec.final && MUSIC_FILES[tr.spec.final]) { this._play({ id: tr.spec.final, fade: 0.6 }); return; }
    const target = r > 1 ? FILE_FINAL_RATE : 1;
    tr.src.playbackRate.setTargetAtTime(target, this.ctx.currentTime, 0.4);
  }

  // Fim da corrida/sair: para a sintetizada na hora e apaga a faixa em arquivo devagar.
  stopMusic(fade = 0.5) {
    this._req++;
    this._stopSynth();
    this._fadeOutTrack(fade);
    this.rate = 1;
  }
}

export const audio = new AudioSys();
