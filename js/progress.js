// Retenção do Race Cities: medalhas das copas, Desafio do Dia e recordes por pista.
// Só lógica e dados (sem tela e sem three.js), para dar para testar fora do navegador.
// Tudo fica guardado no aparelho (localStorage); nada vai para a internet.
import { GEN_PREFIX, MAX_LEVEL, hashInts, makeSeed } from './trackgen.js';

// ---------- Medalhas ----------
export const MEDALS = ['🥇', '🥈', '🥉'];
export const MEDAL_NAMES = ['ouro', 'prata', 'bronze'];
// colocação final na copa -> índice da medalha (0 ouro, 1 prata, 2 bronze) ou -1
export const medalOf = place => (place >= 1 && place <= 3 ? place - 1 : -1);
export const medalEmoji = place => (medalOf(place) >= 0 ? MEDALS[medalOf(place)] : '');

// Guarda a melhor colocação (menor número). Devolve true se melhorou.
export function improveBest(map, key, place) {
  if (!(place >= 1)) return false;
  if (map[key] && map[key] <= place) return false;
  map[key] = place;
  return true;
}

// Conta as medalhas: { gold, silver, bronze } a partir de mapas { chave: melhor colocação }.
export function countMedals(...maps) {
  const n = [0, 0, 0];
  for (const m of maps) for (const k in m) { const i = medalOf(m[k]); if (i >= 0) n[i]++; }
  return { gold: n[0], silver: n[1], bronze: n[2] };
}

// ---------- Desafio do Dia ----------
// Uma pista gerada por dia, igual em todos os aparelhos (a semente vem da data).
// Meta: ganhar as 3 estrelas da pista do dia (pode ser em várias tentativas no mesmo dia).
// Fazer em dias seguidos aumenta a sequência 🔥.
const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// número do dia (conta dias do calendário, sem depender do fuso)
export function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
export function addDays(key, n) {
  const t = new Date((dayNumber(key) + n) * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// nível da pista do dia: passeia de 2 a 7 (nunca fácil demais nem difícil demais)
export const dailyLevel = key => 2 + (((dayNumber(key) % 6) + 6) % 6);

export function dailyTrackId(key) {
  const [y, m, d] = key.split('-').map(Number);
  const base = 1 + (hashInts(y, m, d, 20261113) % 99999999);
  return GEN_PREFIX + makeSeed(base, Math.min(MAX_LEVEL, dailyLevel(key)));
}

export function dailyInfo(key = dayKey()) {
  return { key, trackId: dailyTrackId(key), level: dailyLevel(key) };
}

// Estado guardado: { last: dia da última vitória, streak, best, total }
export function newDailyState(s) {
  return Object.assign({ last: null, streak: 0, best: 0, total: 0 }, s || {});
}

// Sequência que vale hoje (se pulou um dia, volta a zero).
export function currentStreak(st, today) {
  if (!st.last) return 0;
  if (st.last === today || st.last === addDays(today, -1)) return st.streak;
  return 0;
}

// Marca o desafio de hoje como feito. Devolve true se é a primeira vez hoje.
export function completeDaily(st, today) {
  if (st.last === today) return false;
  st.streak = st.last === addDays(today, -1) ? st.streak + 1 : 1;
  st.best = Math.max(st.best, st.streak);
  st.total++;
  st.last = today;
  return true;
}

// ---------- Recordes por pista ----------
// recs[trackId] = { lap: melhor volta (s), place: melhor colocação }
// Devolve o que melhorou: { lap: bool, place: bool, prevLap, prevPlace }
export function updateTrackRecord(recs, trackId, { lap, place }) {
  const r = recs[trackId] || (recs[trackId] = {});
  const out = { lap: false, place: false, prevLap: r.lap ?? null, prevPlace: r.place ?? null };
  if (lap > 0 && isFinite(lap) && (!r.lap || lap < r.lap)) { r.lap = lap; out.lap = true; }
  if (place >= 1 && (!r.place || place < r.place)) { r.place = place; out.place = true; }
  return out;
}
