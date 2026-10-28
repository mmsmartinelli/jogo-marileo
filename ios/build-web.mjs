// Copia o jogo para ios/www e baixa as bibliotecas e fontes que hoje vêm da internet
// (three.js, PeerJS, Google Fonts), para o app abrir e jogar mesmo sem conexão.
// Uso: node ios/build-web.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ios = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(ios, '..');
const www = path.join(ios, 'www');
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Lilita+One&display=swap';

const get = (url, out) => {
  const args = ['-sSfL', '--retry', '3', '-A', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', url];
  if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); execFileSync('curl', [...args, '-o', out]); return null; }
  return execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
};
const read = f => fs.readFileSync(path.join(www, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(www, f), s);
const replaceOnce = (f, a, b) => {
  const s = read(f);
  if (!s.includes(a)) throw new Error(`não achei em ${f}: ${a}`);
  write(f, s.replace(a, b));
};

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const item of ['index.html', 'css', 'js', 'icons']) fs.cpSync(path.join(root, item), path.join(www, item), { recursive: true });

// three.js e os complementos usados pelo jogo
const addons = new Set();
for (const f of fs.readdirSync(path.join(www, 'js'))) {
  for (const m of read(`js/${f}`).matchAll(/three\/addons\/([\w/.-]+\.js)/g)) addons.add(m[1]);
}
get(THREE + 'build/three.module.js', path.join(www, 'vendor/three/build/three.module.js'));
for (const a of addons) {
  get(THREE + 'examples/jsm/' + a, path.join(www, 'vendor/three/examples/jsm', a));
  // os complementos importam outros arquivos relativos? baixa também
  for (const m of read(`vendor/three/examples/jsm/${a}`).matchAll(/from '(\.\.?\/[^']+)'/g)) {
    const dep = path.posix.join(path.posix.dirname(a), m[1]);
    get(THREE + 'examples/jsm/' + dep, path.join(www, 'vendor/three/examples/jsm', dep));
  }
}
replaceOnce('index.html', `"three": "${THREE}build/three.module.js"`, '"three": "./vendor/three/build/three.module.js"');
replaceOnce('index.html', `"three/addons/": "${THREE}examples/jsm/"`, '"three/addons/": "./vendor/three/examples/jsm/"');

// PeerJS (modo online)
get(PEERJS, path.join(www, 'vendor/peerjs.min.js'));
replaceOnce('js/net.js', `'${PEERJS}'`, "'vendor/peerjs.min.js'");

// fontes
let css = get(FONTS);
let n = 0;
css = css.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (_, u) => {
  const name = `f${n++}${path.extname(new URL(u).pathname) || '.woff2'}`;
  get(u, path.join(www, 'vendor/fonts', name));
  return `url(${name})`;
});
fs.writeFileSync(path.join(www, 'vendor/fonts/fonts.css'), css);
let html = read('index.html');
html = html.replace(/\s*<link rel="preconnect"[^>]*>/g, '');
html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="vendor/fonts/fonts.css" rel="stylesheet">');
// coisas que só fazem sentido no site
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '');
write('index.html', html);

let left = [];
try { left = execFileSync('grep', ['-rln', 'https://cdn.jsdelivr.net\\|fonts.googleapis', www], { encoding: 'utf8' }).trim().split('\n').filter(f => f && !f.includes('/vendor/')); } catch (e) { /* nada encontrado */ }
if (left.length) console.warn('Ainda há endereços externos em:', left.join(', '));
const size = Number(execFileSync('du', ['-sk', www], { encoding: 'utf8' }).split('\t')[0]);
console.log(`Jogo copiado para ios/www (${(size / 1024).toFixed(1)} MB, ${addons.size} complementos do three.js, ${n} fontes).`);
