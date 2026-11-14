"""Prepara a trilha do Suno para o jogo: acha o trecho que repete sem emenda, corta e converte para .m4a.

Uso (no Mac, sem instalar nada):
  python3 tools/audio/preparar_trilha.py ORIGINAL.mp3 SAIDA.m4a --bpm 150 [--jingle 7]

- Música com repetição: procura um início depois da introdução e um fim antes do final da música,
  separados por um número inteiro de compassos, onde o som de um lado se parece com o do outro.
  Imprime  loop: [início, fim]  para colar em MUSIC_FILES (js/audio.js).
- --jingle N: vinheta que toca uma vez só; corta perto de N segundos, num tempo forte, com fade curto.
Converte com o afconvert do macOS para AAC 96 kbps estéreo.
"""
import argparse, array, math, os, subprocess, sys, tempfile, wave

def decode(src, rate, ch):
    fd, out = tempfile.mkstemp(suffix='.wav'); os.close(fd)
    subprocess.run(['afconvert', '-f', 'WAVE', '-d', f'LEI16@{rate}', '-c', str(ch), src, out], check=True)
    w = wave.open(out); n = w.getnframes(); data = array.array('h', w.readframes(n)); w.close(); os.remove(out)
    return data

def envelope(mono, hop):
    env = []
    for i in range(0, len(mono) - hop, hop):
        s = 0
        for v in mono[i:i + hop:4]: s += v * v
        env.append(math.sqrt(s / (hop / 4)) + 1.0)
    return env

def bands(mono, hop, R):
    # graves (< ~180 Hz) e agudos (> ~2,5 kHz) com filtros simples de 1 polo
    al = 1 - math.exp(-2 * math.pi * 180 / R); ah = 1 - math.exp(-2 * math.pi * 2500 / R)
    lo = hi_lp = 0.0; el, eh = [], []; sl = sh = 0.0; c = 0
    for v in mono:
        lo += al * (v - lo); hi_lp += ah * (v - hi_lp); h = v - hi_lp
        sl += lo * lo; sh += h * h; c += 1
        if c == hop:
            el.append(math.log(math.sqrt(sl / hop) + 1)); eh.append(math.log(math.sqrt(sh / hop) + 1)); sl = sh = 0.0; c = 0
    return el, eh

def onset(env):
    lg = [math.log(e) for e in env]
    return [max(0.0, lg[i] - lg[i - 1]) for i in range(1, len(lg))] + [0.0]

def corr(a, b):
    n = min(len(a), len(b))
    if n < 4: return -1
    ma = sum(a[:n]) / n; mb = sum(b[:n]) / n
    num = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    da = math.sqrt(sum((a[i] - ma) ** 2 for i in range(n))); db = math.sqrt(sum((b[i] - mb) ** 2 for i in range(n)))
    return num / (da * db) if da and db else -1

def beat_period(on, fps, bpm):
    # autocorrelação do "ataque" perto do bpm pedido (a IA nem sempre obedece exatamente)
    best, bl = -1, None
    for b10 in range(int(bpm * 0.9 * 10), int(bpm * 1.1 * 10) + 1, 2):
        lag = fps * 60 / (b10 / 10)
        l0 = int(lag); fr = lag - l0
        s = 0.0
        for i in range(len(on) - l0 - 1):
            s += on[i] * (on[i + l0] * (1 - fr) + on[i + l0 + 1] * fr)
        if s > best: best, bl = s, lag
    return bl  # em quadros

def phase(on, period):
    # deslocamento da grade de tempos que mais coincide com os ataques
    best, bp = -1, 0
    for p10 in range(0, int(period * 10)):
        p = p10 / 10; s = 0.0; k = p
        while k < len(on) - 1:
            s += on[int(k)]; k += period
        if s > best: best, bp = s, p
    return bp

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst'); ap.add_argument('--bpm', type=float, required=True)
    ap.add_argument('--jingle', type=float); ap.add_argument('--min-loop', type=float, default=40)
    ap.add_argument('--max-loop', type=float, default=85)  # mais que isso pesa na memória do celular
    a = ap.parse_args()
    R = 22050; hop = 512; fps = R / hop
    mono = decode(a.src, R, 1)
    env = envelope(mono, hop); on = onset(env); el, eh = bands(mono, hop, R)
    dur = len(mono) / R
    per = beat_period(on, fps, a.bpm); ph = phase(on, per)
    bpm = 60 * fps / per
    beats = []; k = ph
    while k < len(env): beats.append(k); k += per
    bar = per * 4
    med = sorted(env)[len(env) // 2]
    # fim útil: antes do fade-out/silêncio do final
    last = len(env) - 1
    while last > 0 and env[last] < med * 0.5: last -= 1
    print(f'{os.path.basename(a.src)}: {dur:.1f} s, ~{bpm:.1f} bpm, fim útil {last / fps:.1f} s')
    if a.jingle:
        # tempo forte mais perto do alvo, onde o volume já começa a cair
        cand = [b for b in beats if abs(b / fps - a.jingle) < 2.5]
        cut = min(cand, key=lambda b: env[int(b)]) if cand else a.jingle * fps
        cut_s = cut / fps; fade = min(1.2, 60 / bpm * 2)
        write(a.src, a.dst, cut_s + fade, fade_out=fade)
        print(f'vinheta: corte em {cut_s + fade:.2f} s (fade de {fade:.2f} s)')
        return
    win = int(fps * 4)  # compara 4 s antes e depois de cada ponto
    best = (-9, None, None)
    starts = [b for b in beats if 1.5 * fps <= b <= 16 * fps]
    for s in starts:
        nb = 1
        while True:
            e = s + bar * nb
            if e > last - fps * 2 or (e - s) / fps > a.max_loop: break
            if (e - s) / fps >= a.min_loop:
                si, ei = int(s), int(e)
                if ei + win < len(env) and si - win // 2 >= 0:
                    w0 = si - win // 2; w1 = ei - win // 2
                    sc = (corr(el[w0:si + win], el[w1:ei + win]) + corr(eh[w0:si + win], eh[w1:ei + win])
                          + 0.5 * corr(on[w0:si + win], on[w1:ei + win])) / 2.5
                    sc += 0.02 * ((e - s) / fps / 10)  # leve preferência por trechos mais longos
                    sc += 0.12 if nb % 4 == 0 else 0.05 if nb % 2 == 0 else 0  # frases de 4/8 compassos
                    if sc > best[0]: best = (sc, s, e)
            nb += 1
    if best[1] is None: sys.exit('não achei trecho de repetição: música curta demais?')
    sc, s, e = best
    s_s, e_s = s / fps, e / fps
    # ajuste fino na amostra: alinha a onda no ponto de emenda (±12 ms)
    full = decode(a.src, R, 1)
    si, ei = int(s_s * R), int(e_s * R); n = 1024; bl, bc = 0, -2
    for lag in range(-260, 261, 2):
        c = corr(full[si:si + n], full[ei + lag:ei + lag + n])
        if c > bc: bc, bl = c, lag
    e_s += bl / R
    # a emenda caindo bem na batida pode estalar depois da compressão AAC: testa a emenda um pouco
    # antes (mesma distância entre início e fim) e fica com a mais limpa, medida no arquivo final
    best_d, best_q = 0.0, None
    for d in [0.0, -0.015, -0.03, -0.045, -0.06, -0.08, -0.1, -0.13] + [x / 100 for x in range(-40, 12, 3)]:
        if best_q is not None and best_q < 0.6: break
        write(a.src, a.dst, e_s + 0.4, seam=(s_s + d, e_s + d), quiet=True)
        q = seam_click(a.dst, s_s + d, e_s + d)
        if best_q is None or q < best_q: best_d, best_q = d, q
    s_s += best_d; e_s += best_d
    write(a.src, a.dst, e_s + 0.4, seam=(s_s, e_s))
    print(f'  emenda: degrau {best_q:.2f}x o normal (abaixo de 1 = sem estalo)')
    print(f'loop: [{s_s:.3f}, {e_s:.3f}]  ({e_s - s_s:.1f} s = {round((e - s) / bar)} compassos; nota {sc:.2f}; emenda {bc:.2f})')

def seam_click(m4a, s_s, e_s, R=44100):
    # junta o fim com o começo do loop, como o jogo faz, e compara o "degrau" na junta com o normal da música
    fd, tmp = tempfile.mkstemp(suffix='.wav'); os.close(fd)
    subprocess.run(['afconvert', '-f', 'WAVE', '-d', f'LEI16@{R}', '-c', '1', m4a, tmp], check=True)
    w = wave.open(tmp); d = array.array('h', w.readframes(w.getnframes())); w.close(); os.remove(tmp)
    s, e, n = int(round(s_s * R)), int(round(e_s * R)), 2048
    x = list(d[e - n:e]) + list(d[s:s + n])
    sd = [abs(x[i + 1] - 2 * x[i] + x[i - 1]) for i in range(1, len(x) - 1)]
    joint = max(sd[n - 2:n + 1]); p99 = sorted(sd)[int(len(sd) * 0.99)] or 1
    return joint / p99

def write(src, dst, end_s, fade_out=0.0, seam=None, xf=0.25, quiet=False):
    R = 44100
    data = decode(src, R, 2)
    n = min(len(data) // 2, int(end_s * R))
    data = data[:n * 2]
    if seam:
        # os últimos xf segundos antes do fim do loop viram, aos poucos, o som de antes do início:
        # quando o jogo pula do fim para o início, a onda continua igual (sem estalo)
        s0, e0 = int(seam[0] * R), int(seam[1] * R); f = int(xf * R)
        for i in range(f):
            g = math.sin(0.5 * math.pi * (i + 1) / f); ga = math.cos(0.5 * math.pi * (i + 1) / f)
            for c in (0, 1):
                a_ = data[2 * (e0 - f + i) + c]; b_ = data[2 * (s0 - f + i) + c]
                data[2 * (e0 - f + i) + c] = max(-32768, min(32767, int(a_ * ga + b_ * g)))
    if fade_out:
        f = int(fade_out * R)
        for i in range(max(0, n - f), n):
            g = (n - i) / f
            data[2 * i] = int(data[2 * i] * g); data[2 * i + 1] = int(data[2 * i + 1] * g)
    fd, tmp = tempfile.mkstemp(suffix='.wav'); os.close(fd)
    w = wave.open(tmp, 'w'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(R); w.writeframes(data.tobytes()); w.close()
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', tmp, dst], check=True)
    os.remove(tmp)
    if not quiet: print(f'  -> {dst}: {os.path.getsize(dst) / 1024:.0f} KB, {n / R:.1f} s')

if __name__ == '__main__':
    main()
