#!/usr/bin/env python3
"""Monta ios/www sem Node: faz o mesmo que ios/build-web.mjs.
Copia o jogo e BAIXA three.js, PeerJS e as fontes (para funcionar sem internet).
Uso: python3 ios/build-web.py [pasta-de-saída-terminada-em-www]"""
import os, re, shutil, subprocess, sys
from pathlib import Path
from urllib.parse import urlparse

ios = Path(__file__).resolve().parent
root = ios.parent
www = Path(sys.argv[1] if len(sys.argv) > 1 else ios / 'www').resolve()
if www.name != 'www' or str(root).startswith(str(www)):
    sys.exit(f'pasta de saída inválida: {www} (precisa terminar em /www)')
THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/'
PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Lilita+One&display=swap'
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

def get(url, out=None):
    cmd = ['curl', '-sSfL', '--retry', '5', '--retry-all-errors', '-A', UA, url]
    if out:
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(cmd + ['-o', str(out)], check=True)
        return None
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout

def read(f): return (www / f).read_text(encoding='utf8')
def write(f, s): (www / f).write_text(s, encoding='utf8')
def replace_once(f, a, b):
    s = read(f)
    if a not in s: sys.exit(f'não achei em {f}: {a}')
    write(f, s.replace(a, b, 1))

shutil.rmtree(www, ignore_errors=True)
www.mkdir(parents=True)
for item in ['index.html', 'css', 'js', 'icons', 'audio']:
    src = root / item
    if src.is_dir(): shutil.copytree(src, www / item)
    else: shutil.copy2(src, www / item)

addons = set()
for f in (www / 'js').rglob('*.js'):
    addons.update(re.findall(r'three/addons/([\w/.-]+\.js)', f.read_text(encoding='utf8')))
get(THREE + 'build/three.module.js', www / 'vendor/three/build/three.module.js')
for a in sorted(addons):
    get(THREE + 'examples/jsm/' + a, www / 'vendor/three/examples/jsm' / a)
    for m in re.findall(r"from '(\.\.?/[^']+)'", read(f'vendor/three/examples/jsm/{a}')):
        dep = os.path.normpath(os.path.join(os.path.dirname(a), m))
        get(THREE + 'examples/jsm/' + dep, www / 'vendor/three/examples/jsm' / dep)
replace_once('index.html', f'"three": "{THREE}build/three.module.js"', '"three": "./vendor/three/build/three.module.js"')
replace_once('index.html', f'"three/addons/": "{THREE}examples/jsm/"', '"three/addons/": "./vendor/three/examples/jsm/"')

get(PEERJS, www / 'vendor/peerjs.min.js')
replace_once('js/net.js', f"'{PEERJS}'", "'vendor/peerjs.min.js'")

css = get(FONTS)
n = 0
def fonte(m):
    global n
    u = m.group(1)
    name = f"f{n}{os.path.splitext(urlparse(u).path)[1] or '.woff2'}"
    n += 1
    get(u, www / 'vendor/fonts' / name)
    return f'url({name})'
css = re.sub(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', fonte, css)
(www / 'vendor/fonts').mkdir(parents=True, exist_ok=True)
(www / 'vendor/fonts/fonts.css').write_text(css, encoding='utf8')
html = read('index.html')
html = re.sub(r'\s*<link rel="preconnect"[^>]*>', '', html)
html = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>', '<link href="vendor/fonts/fonts.css" rel="stylesheet">', html, count=1)
html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html, count=1)
write('index.html', html)

left = subprocess.run(['grep', '-rln', r'https://cdn.jsdelivr.net\|fonts.googleapis', str(www)], capture_output=True, text=True).stdout.split()
left = [f for f in left if '/vendor/' not in f]
if left: print('Ainda há endereços externos em:', ', '.join(left))
kb = int(subprocess.run(['du', '-sk', str(www)], capture_output=True, text=True).stdout.split()[0])
print(f'Jogo copiado para {www} ({kb/1024:.1f} MB, {len(addons)} complementos do three.js, {n} fontes).')
