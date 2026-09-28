// Sala online: criar/entrar com código, lista de jogadores e início da corrida para todos.
import { Net, normalizeCode } from './net.js';
import { CHARACTERS } from './characters.js';
import { TRACKS, getTrack } from './tracks.js';
import { audio } from './audio.js';

export const MAX_PLAYERS = 8;
const $ = s => document.querySelector(s);

function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch (e) { return def; }
}
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } }

const errorText = e => {
  const t = e && (e.type || e.message);
  if (t === 'peer-unavailable') return 'Sala não encontrada. Confira o código.';
  if (t === 'timeout') return 'A sala não respondeu. Confira o código e a internet.';
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'sem-internet') return 'Sem conexão. Confira a internet e tente de novo.';
  if (t === 'browser-incompatible') return 'Este navegador não permite jogar online.';
  return 'Não deu para conectar. Tente de novo.';
};

export class Online {
  constructor(app) {
    this.app = app;
    this.net = null;
    this.members = [];
    this.settings = { trackId: 'vale', laps: 3, difficulty: 1 };
    this.inRace = false;
    this.busy = false;
    const saved = load('marileo_online', {});
    this.me = { name: saved.name || '', char: saved.char ?? 0 };
    this._bind();
  }

  get isHost() { return !!(this.net && this.net.isHost); }
  get connected() { return !!this.net; }
  get myName() { return (this.me.name || '').trim() || CHARACTERS[this.me.char].name; }

  _bind() {
    $('#onPrev').addEventListener('click', () => this.changeChar(-1));
    $('#onNext').addEventListener('click', () => this.changeChar(1));
    $('#onName').addEventListener('input', e => { this.me.name = e.target.value.slice(0, 12); this._saveMe(); });
    $('#onCode').addEventListener('input', e => { e.target.value = normalizeCode(e.target.value); });
    $('#onCode').addEventListener('keydown', e => { if (e.key === 'Enter') this.join(); });
    $('#onCreate').addEventListener('click', () => this.create());
    $('#onJoin').addEventListener('click', () => this.join());
    $('#onBack').addEventListener('click', () => { audio.play('back'); this.app.show('title'); });
    // botão do alto: dentro da sala sai da sala; fora dela volta ao menu
    $('#onTopBack').addEventListener('click', () => {
      if (this.connected) { this.leave(); return; }
      audio.play('back');
      this.app.show('title');
    });
    $('#onLeave').addEventListener('click', () => this.leave());
    $('#onGo').addEventListener('click', () => this.start());
    $('#onShare').addEventListener('click', () => this.share());
    document.querySelectorAll('#onLaps button').forEach(b => b.addEventListener('click', () => { this.settings.laps = +b.dataset.n; this._settingsChanged(); }));
    document.querySelectorAll('#onDiff button').forEach(b => b.addEventListener('click', () => { this.settings.difficulty = +b.dataset.n; this._settingsChanged(); }));
  }

  _saveMe() { save('marileo_online', this.me); }

  // Abre a tela online (com o código já preenchido quando veio de um convite).
  open(code = '') {
    this.app.show('online');
    if (code) $('#onCode').value = normalizeCode(code);
    this.render();
  }

  changeChar(d) {
    this.me.char = (this.me.char + d + CHARACTERS.length) % CHARACTERS.length;
    this._saveMe();
    audio.play('select');
    if (this.net) {
      if (this.isHost) { const m = this.members.find(m => m.id === this.net.id); if (m) m.char = this.me.char; this.broadcastLobby(); }
      else this.net.send({ t: 'me', char: this.me.char, name: this.myName });
    }
    this.render();
  }

  // ---------- criar / entrar ----------
  async create() {
    if (this.busy) return;
    audio.init(); audio.play('confirm');
    this._setBusy(true, 'Criando a sala...');
    const net = new Net();
    try {
      await net.host();
    } catch (e) {
      net.close();
      this._setBusy(false);
      this.app.toast(errorText(e));
      return;
    }
    this.net = net;
    this._hook();
    this.members = [{ id: net.id, name: this.myName, char: this.me.char, host: true }];
    this._setBusy(false);
    this.render();
  }

  async join() {
    if (this.busy) return;
    audio.init();
    const code = normalizeCode($('#onCode').value);
    if (code.length !== 4) { this.app.toast('Digite o código de 4 letras da sala.'); $('#onCode').focus(); return; }
    audio.play('confirm');
    this._setBusy(true, 'Entrando na sala...');
    const net = new Net();
    try {
      await net.join(code);
    } catch (e) {
      net.close();
      this._setBusy(false);
      this.app.toast(errorText(e));
      return;
    }
    this.net = net;
    this._hook();
    this.members = [];
    net.send({ t: 'hello', name: this.myName, char: this.me.char });
    // espera a lista da sala chegar
    this._joinTimer = setTimeout(() => {
      if (!this.members.length) { this.app.toast('A sala não respondeu. Tente de novo.'); this.leave(true); }
    }, 10000);
    this._setBusy(false);
    this.render();
  }

  _setBusy(b, text) {
    this.busy = b;
    $('#onCreate').disabled = b;
    $('#onJoin').disabled = b;
    if (b && text) this.app.toast(text);
  }

  _hook() {
    this.net.on('message', (m, from) => this.onMessage(m, from));
    this.net.on('disconnect', id => this.onDisconnect(id));
    this.net.on('error', e => { if (e && e.type === 'network') this.app.toast('Conexão instável...'); });
  }

  // ---------- mensagens ----------
  onMessage(m, from) {
    if (this.isHost) {
      if (m.t === 'hello') {
        if (this.members.length >= MAX_PLAYERS) {
          this.net.sendTo(from, { t: 'full' });
          this.net.kick(from);
          return;
        }
        this.members.push({ id: from, name: String(m.name || 'Amigo').slice(0, 12), char: (m.char | 0) % CHARACTERS.length, waiting: this.inRace });
        audio.play('coin');
        this.app.toast(`${String(m.name || 'Um amigo').slice(0, 12)} entrou na sala!`);
        this.broadcastLobby();
      } else if (m.t === 'me') {
        const mem = this.members.find(x => x.id === from);
        if (mem) { mem.char = (m.char | 0) % CHARACTERS.length; mem.name = String(m.name || mem.name).slice(0, 12); this.broadcastLobby(); }
      }
      return;
    }
    switch (m.t) {
      case 'lobby':
        clearTimeout(this._joinTimer);
        this.members = m.members;
        this.settings = m.settings;
        this.inRace = m.inRace;
        if (this.app.screen === 'online') this.render();
        break;
      case 'full':
        this.app.toast('Essa sala já está cheia (8 jogadores).');
        this.leave(true);
        break;
      case 'start':
        this.startRace(m.cfg);
        break;
      case 'lobbyBack':
        this.backToLobby(false);
        break;
    }
  }

  onDisconnect(id) {
    if (this.isHost) {
      const mem = this.members.find(m => m.id === id);
      this.members = this.members.filter(m => m.id !== id);
      if (mem) this.app.toast(`${mem.name} saiu da sala.`);
      this.broadcastLobby();
    } else {
      this.app.toast('O anfitrião fechou a sala.');
      this.leave(true);
    }
  }

  broadcastLobby() {
    if (!this.isHost) return;
    this.net.send({ t: 'lobby', members: this.members, settings: this.settings, inRace: this.inRace });
    if (this.app.screen === 'online') this.render();
  }

  _settingsChanged() {
    if (!this.isHost) return;
    audio.play('select');
    this.broadcastLobby();
  }

  async share() {
    const code = this.net && this.net.code;
    if (!code) return;
    const url = `${location.origin}${location.pathname}?sala=${code}`;
    const text = `Vem correr comigo no Marileo Kart! 🏁 Código da sala: ${code}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Marileo Kart', text, url }); return; }
    } catch (e) { return; }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); this.app.toast('Convite copiado! Cole no WhatsApp.'); }
    catch (e) { this.app.toast(`Código da sala: ${code}`); }
  }

  // ---------- corrida ----------
  start() {
    if (!this.isHost) return;
    audio.init(); audio.play('confirm');
    const humans = this.members.slice(0, MAX_PLAYERS);
    for (const m of humans) m.waiting = false;
    // grid: computador na frente, amigos em ordem sorteada atrás
    const shuffled = [...humans].sort(() => Math.random() - 0.5);
    const used = new Set(humans.map(m => m.char));
    const pool = CHARACTERS.map((_, i) => i).filter(i => !used.has(i));
    const ai = [];
    while (ai.length + humans.length < MAX_PLAYERS) ai.push(pool.length ? pool.shift() : Math.floor(Math.random() * CHARACTERS.length));
    const entries = [
      ...ai.map(char => ({ char, owner: 'ai', name: null })),
      ...shuffled.map(m => ({ char: m.char, owner: m.id, name: m.name })),
    ];
    const cfg = { mode: 'online', trackId: this.settings.trackId, laps: this.settings.laps, difficulty: this.settings.difficulty, entries };
    this.inRace = true;
    this.net.send({ t: 'start', cfg });
    this.broadcastLobby();
    this.startRace(cfg);
  }

  startRace(cfg) {
    this.inRace = true;
    // quem entrou no meio de uma corrida espera a próxima
    if (!cfg.entries.some(e => e.owner === this.net.id)) {
      this.app.toast('Corrida em andamento: você entra na próxima!');
      this.render();
      return;
    }
    this.app.startOnlineRace(cfg, {
      net: this.net,
      role: this.isHost ? 'host' : 'client',
      myId: this.net.id,
      peers: this.members.filter(m => m.id !== this.net.id).map(m => m.id),
    });
  }

  // Volta todo mundo para a sala depois da corrida.
  backToLobby(announce) {
    if (announce && this.isHost) this.net.send({ t: 'lobbyBack' });
    this.inRace = false;
    if (this.isHost) this.broadcastLobby();
    this.app.startDemo();
    this.app.show('online');
    this.render();
  }

  leave(silent = false) {
    if (!silent) audio.play('back');
    clearTimeout(this._joinTimer);
    if (this.net) this.net.close();
    this.net = null;
    this.members = [];
    this.inRace = false;
    if (this.app.race && this.app.race.online) this.app.startDemo();
    this.app.show('online');
    this.render();
  }

  // ---------- tela ----------
  render() {
    const inRoom = !!this.net && (this.isHost || this.members.length > 0);
    $('#onStart').hidden = inRoom;
    $('#onTopBack').textContent = inRoom ? '🚪 Sair' : '⬅ Menu';
    $('#onLobby').hidden = !inRoom;
    const ch = CHARACTERS[this.me.char];
    $('#onPortrait').src = this.app.portraits[this.me.char] || '';
    $('#onCharName').textContent = ch.name;
    $('#onSpecies').textContent = ch.species;
    if (document.activeElement !== $('#onName')) $('#onName').value = this.me.name;
    if (!inRoom) return;

    $('#onRoomCode').textContent = this.net.code || '----';
    const list = $('#onPlayers');
    list.innerHTML = '';
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const m = this.members[i];
      const el = document.createElement('div');
      if (!m) {
        el.className = 'on-player empty';
        el.textContent = i === this.members.length ? 'Esperando amigo...' : '';
      } else {
        const me = m.id === this.net.id;
        el.className = 'on-player' + (me ? ' me' : '');
        const c = CHARACTERS[m.char] || CHARACTERS[0];
        el.innerHTML = `<img src="${this.app.portraits[m.char] || ''}" alt=""><div><div class="n"></div><div class="s">${c.name}${m.host ? ' • 👑 anfitrião' : ''}${me ? ' • você' : ''}${m.waiting ? ' • próxima corrida' : ''}</div></div>`;
        el.querySelector('.n').textContent = m.name;
        if (me) {
          const arrows = document.createElement('div');
          arrows.className = 'arrows';
          arrows.innerHTML = '<button aria-label="Personagem anterior">◀</button><button aria-label="Próximo personagem">▶</button>';
          const [p, n] = arrows.querySelectorAll('button');
          p.addEventListener('click', () => this.changeChar(-1));
          n.addEventListener('click', () => this.changeChar(1));
          el.appendChild(arrows);
        }
      }
      list.appendChild(el);
    }

    const host = this.isHost;
    $('#onHostOpts').hidden = !host;
    $('#onGo').hidden = !host;
    $('#onGo').disabled = this.inRace;
    if (host) {
      const tracks = $('#onTracks');
      tracks.innerHTML = '';
      for (const t of TRACKS) {
        const el = document.createElement('div');
        el.className = 'track' + (t.id === this.settings.trackId ? ' on' : '');
        el.appendChild(this.app._thumbCanvas(t.id));
        el.insertAdjacentHTML('beforeend', `<div>${t.name}</div>`);
        el.addEventListener('click', () => { this.settings.trackId = t.id; this._settingsChanged(); });
        tracks.appendChild(el);
      }
      document.querySelectorAll('#onLaps button').forEach(b => b.classList.toggle('on', +b.dataset.n === this.settings.laps));
      document.querySelectorAll('#onDiff button').forEach(b => b.classList.toggle('on', +b.dataset.n === this.settings.difficulty));
      $('#onWait').textContent = this.members.length < 2
        ? 'Mande o código para os amigos. Você também pode correr sozinho contra o computador.'
        : `${this.members.length} jogadores na sala. Quando todos estiverem prontos, aperte CORRER!`;
    } else {
      const t = getTrack(this.settings.trackId);
      $('#onWait').textContent = this.inRace
        ? '🏁 Tem uma corrida acontecendo. Você entra na próxima!'
        : `⏳ Esperando o anfitrião começar... Pista: ${t ? t.name : ''} • ${this.settings.laps} voltas`;
    }
  }
}
