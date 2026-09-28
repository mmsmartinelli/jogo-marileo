// Rede para o modo online: conexão direta entre aparelhos (WebRTC) usando PeerJS.
// Topologia em estrela: o anfitrião recebe todos e repassa as mensagens.

const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const PREFIX = 'marileo-kart-v1-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem letras confusas (I, O, 0, 1)

let loading = null;
function loadPeerJS() {
  if (window.Peer) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEERJS_URL;
      s.onload = () => resolve();
      s.onerror = () => { loading = null; reject(new Error('sem-internet')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export function randomCode() {
  let c = '';
  for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

export function normalizeCode(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

// Opções extras (ex.: servidor próprio para testes) via ?peerhost=host:porta
function peerOptions() {
  const opts = { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };
  try {
    const q = new URLSearchParams(location.search).get('peerhost');
    if (q) {
      const [host, port] = q.split(':');
      Object.assign(opts, { host, port: +port || 9000, path: '/', secure: false });
    }
  } catch (e) { /* ignore */ }
  return opts;
}

export class Net {
  constructor() {
    this.peer = null;
    this.conns = new Map(); // peerId -> conexão (no anfitrião: todos; no convidado: só o anfitrião)
    this.isHost = false;
    this.code = null;
    this.handlers = {};
    this.closed = false;
  }

  get id() { return this.peer ? this.peer.id : null; }

  on(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); }
  off(type, fn) { this.handlers[type] = (this.handlers[type] || []).filter(f => f !== fn); }
  emit(type, ...args) { for (const fn of this.handlers[type] || []) fn(...args); }

  // Cria a sala. Tenta outro código se o sorteado já estiver em uso.
  async host() {
    await loadPeerJS();
    for (let tries = 0; tries < 5; tries++) {
      const code = randomCode();
      try {
        await this._open(PREFIX + code);
        this.isHost = true;
        this.code = code;
        this.peer.on('connection', conn => this._setup(conn));
        return code;
      } catch (e) {
        if (e.type !== 'unavailable-id') throw e;
      }
    }
    throw new Error('sem-codigo');
  }

  // Entra na sala de outro jogador.
  async join(code) {
    await loadPeerJS();
    await this._open(undefined);
    this.code = code;
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      const fail = err => { clearTimeout(timer); reject(err); };
      const timer = setTimeout(() => fail(Object.assign(new Error('tempo'), { type: 'timeout' })), 15000);
      this.peer.once('error', fail);
      conn.on('open', () => { clearTimeout(timer); this.peer.off('error', fail); resolve(); });
      this._setup(conn);
    });
  }

  _open(id) {
    return new Promise((resolve, reject) => {
      const peer = id ? new window.Peer(id, peerOptions()) : new window.Peer(peerOptions());
      const onErr = err => { peer.destroy(); reject(err); };
      peer.once('open', () => {
        peer.off('error', onErr);
        this.peer = peer;
        peer.on('error', err => this.emit('error', err));
        peer.on('disconnected', () => { if (!this.closed) try { peer.reconnect(); } catch (e) { /* ignore */ } });
        resolve();
      });
      peer.once('error', onErr);
    });
  }

  _setup(conn) {
    conn.on('open', () => {
      this.conns.set(conn.peer, conn);
      this.emit('connect', conn.peer);
    });
    conn.on('data', data => this.emit('message', data, conn.peer));
    const gone = () => {
      if (!this.conns.has(conn.peer)) return;
      this.conns.delete(conn.peer);
      this.emit('disconnect', conn.peer);
    };
    conn.on('close', gone);
    conn.on('error', gone);
  }

  // Convidado → anfitrião; anfitrião → todos (menos `except`).
  send(msg, except = null) {
    for (const [id, c] of this.conns) {
      if (id === except || !c.open) continue;
      try { c.send(msg); } catch (e) { /* ignore */ }
    }
  }

  sendTo(id, msg) {
    const c = this.conns.get(id);
    if (c && c.open) try { c.send(msg); } catch (e) { /* ignore */ }
  }

  kick(id) {
    const c = this.conns.get(id);
    if (c) setTimeout(() => c.close(), 300);
  }

  close() {
    this.closed = true;
    for (const c of this.conns.values()) try { c.close(); } catch (e) { /* ignore */ }
    this.conns.clear();
    if (this.peer) try { this.peer.destroy(); } catch (e) { /* ignore */ }
    this.peer = null;
  }
}
