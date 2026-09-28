// Sincroniza uma corrida online entre os aparelhos.
// Regra: cada aparelho manda nos karts que controla (o seu; o anfitrião também controla os do computador).
// Os outros karts são "espelhos" que seguem as posições recebidas.
import { AIDriver } from './ai.js';

const SEND_EVERY = 0.05; // 20 mensagens por segundo

export class NetSync {
  constructor(race, online) {
    this.race = race;
    this.net = online.net;
    this.isHost = online.role === 'host';
    this.myId = online.myId;
    this.sendTimer = 0;
    this.seq = 0;
    this.clientStates = new Map(); // anfitrião: último estado de cada kart dos convidados
    this.ready = new Set();
    this.expected = new Set(online.peers || []);
    this.waitTimer = 0;
    this.onMsg = (msg, from) => this.handle(msg, from);
    this.onGone = id => this.peerLeft(id);
    this.net.on('message', this.onMsg);
    this.net.on('disconnect', this.onGone);
    if (!this.isHost) this.net.send({ t: 'ready' });
  }

  newId() { return `${this.myId}:${++this.seq}`; }

  // ---------- envio ----------
  update(dt) {
    const race = this.race;
    // o anfitrião espera todos terminarem de montar a pista antes da apresentação
    if (this.isHost && race.phase === 'waiting') {
      this.waitTimer += dt;
      const allReady = [...this.expected].every(id => this.ready.has(id) || !this.net.conns.has(id));
      if (allReady || this.waitTimer > 12) { race.phase = 'intro'; race.phaseTime = 0; }
    }
    // o convidado repete "estou pronto" até o anfitrião começar (a mensagem pode chegar cedo demais)
    if (!this.isHost && race.phase === 'waiting') {
      this.waitTimer += dt;
      if (this.waitTimer > 1) { this.waitTimer = 0; this.net.send({ t: 'ready' }); }
    }
    this.sendTimer -= dt;
    if (this.sendTimer > 0) return;
    this.sendTimer = SEND_EVERY;
    const mine = race.karts.filter(k => !k.remote).map(k => k.netState());
    if (this.isHost) {
      this.net.send({ t: 'snap', time: race.time, rt: race.raceTime, ph: race.phase, pt: race.phaseTime, k: mine.concat([...this.clientStates.values()]) });
    } else {
      this.net.send({ t: 'st', k: mine });
    }
  }

  // Evento de jogo (itens): convidado → anfitrião → todos.
  event(e) { this.net.send({ t: 'ev', e }); }

  // ---------- recebimento ----------
  handle(msg, from) {
    const race = this.race;
    const now = performance.now();
    switch (msg.t) {
      case 'ready':
        if (this.isHost) this.ready.add(from);
        break;
      case 'st': // anfitrião recebe o kart de um convidado
        if (!this.isHost) return;
        for (const s of msg.k) {
          const k = race.karts[s[0]];
          if (!k || !k.remote) continue;
          this.clientStates.set(s[0], s);
          k.applyNetState(s, now);
        }
        break;
      case 'snap': { // convidado recebe tudo do anfitrião
        if (this.isHost) return;
        // sincroniza o relógio da corrida (obstáculos dependem dele)
        const lat = 0.04;
        if (Math.abs(race.time - (msg.time + lat)) > 0.25) race.time = msg.time + lat;
        else race.time += (msg.time + lat - race.time) * 0.1;
        if (race.phase !== 'done') {
          if (race.phase !== msg.ph && ['waiting', 'intro', 'countdown', 'racing'].includes(msg.ph)) {
            // entra na mesma fase do anfitrião (a contagem fica igual para todos)
            if (!(race.phase === 'racing' && msg.ph === 'countdown')) { race.phase = msg.ph; race.phaseTime = msg.pt; }
          } else if (race.phase === 'intro' || race.phase === 'countdown') {
            if (Math.abs(race.phaseTime - msg.pt) > 0.3) race.phaseTime = msg.pt + lat;
          }
          if (race.phase === 'racing' && Math.abs(race.raceTime - msg.rt) > 0.5) race.raceTime = msg.rt + lat;
        }
        for (const s of msg.k) {
          const k = race.karts[s[0]];
          if (k && k.remote) k.applyNetState(s, now);
        }
        break;
      }
      case 'ev':
        this.applyEvent(msg.e);
        if (this.isHost) this.net.send(msg, from); // repassa para os outros
        break;
    }
  }

  applyEvent(e) {
    const items = this.race.items;
    switch (e.e) {
      case 'haz': items.addHazard(e.type, e.x, e.y, e.z, this.race.karts[e.owner], e.id); break;
      case 'hazX': items.removeHazard(e.id); break;
      case 'mis': items.spawnMissile(e, false); break;
      case 'misX': items.removeMissile(e.id, e.x, e.y, e.z); break;
      case 'ink': items.applyInk(this.race.karts[e.owner], false); break;
      case 'box': items.takeBox(e.i); break;
    }
  }

  // Um amigo saiu no meio da corrida: o computador assume o kart dele.
  peerLeft(id) {
    const race = this.race;
    if (!this.isHost) return;
    for (const k of race.karts) {
      if (k.netOwner !== id || !k.remote) continue;
      k.remote = false;
      k.netOwner = null;
      this.clientStates.delete(k.id);
      race.drivers.set(k, new AIDriver(k, race, 0.6));
    }
  }

  dispose() {
    this.net.off('message', this.onMsg);
    this.net.off('disconnect', this.onGone);
  }
}
