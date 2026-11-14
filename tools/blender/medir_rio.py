# Mede o Rio inteiro com o Cristo de hoje (procedural) e com o Cristo do Blender (.glb).
#
# NÃO muda o jogo: o Cristo do Blender é trocado só dentro desta página de teste.
# Precisa do Google Chrome instalado e do Playwright para Python (pip install playwright).
#
# Uso, na pasta do projeto (não precisa de servidor: o próprio teste entrega os arquivos):
#   python3 tools/blender/medir_rio.py   (mede e salva as capturas em tools/blender/capturas/)
#
# Para cada versão, mede draw calls e triângulos em pontos fixos da pista (mesma câmera nas
# duas), soma o peso da cena inteira e simula 40 s de corrida com a IA para ver se dá erro.

import json
import os
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
HOST = 'http://jogo.test'
URL = HOST + '/index.html'
TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
         '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json'}


def serve(route):
    rel = route.request.url[len(HOST):].split('?')[0].lstrip('/') or 'index.html'
    f = os.path.normpath(os.path.join(ROOT, rel))
    if not f.startswith(ROOT) or not os.path.isfile(f):
        return route.fulfill(status=404, body='')
    route.fulfill(status=200, path=f, content_type=TYPES.get(os.path.splitext(f)[1], 'application/octet-stream'))
OUT = os.environ.get('CAPTURAS') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'capturas')

# Código que roda dentro da página: troca a estátua, monta o Rio, mede e posiciona câmeras.
SETUP_JS = r"""
async ([mode, hora]) => {
  const THREE = await import('three');
  const { LANDMARKS } = await import('./js/cities/landmarks.js');
  const { Race } = await import('./js/race.js');
  const app = window.app;
  const L = LANDMARKS.cristo;
  if (mode === 'blender') {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync('./assets/models/cristo.glb');
    gltf.scene.updateMatrixWorld(true);
    // Uma peça por (material, cor): o jogo junta tudo por material e põe a cor da peça em
    // cada vértice, então o resultado fica igual às cores por vértice do .glb.
    const parts = [];
    gltf.scene.traverse(m => {
      if (!m.isMesh) return;
      const cls = m.material.name.replace(/\.\d+$/, '');
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld);
      const pos = g.attributes.position, nor = g.attributes.normal, col = g.attributes.color;
      const by = new Map();
      for (let t = 0; t < pos.count; t += 3) {
        const c = col ? [col.getX(t), col.getY(t), col.getZ(t)] : [1, 1, 1];
        const key = c.map(v => Math.round(v * 1000)).join(',');
        if (!by.has(key)) by.set(key, { c, p: [], n: [] });
        const b = by.get(key);
        for (let k = 0; k < 3; k++) {
          b.p.push(pos.getX(t + k), pos.getY(t + k), pos.getZ(t + k));
          if (nor) b.n.push(nor.getX(t + k), nor.getY(t + k), nor.getZ(t + k));
        }
      }
      for (const b of by.values()) {
        const bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
        if (b.n.length) bg.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
        parts.push({ geo: bg, cls, color: new THREE.Color().setRGB(b.c[0], b.c[1], b.c[2]) });
      }
    });
    window.__glbParts = parts.length;
    const orig = L.__orig || L.build;
    L.__orig = orig;
    L.build = function (ctx, g, ...rest) {
      orig.call(this, ctx, g, ...rest);
      // a estátua procedural é o grupo "st" (y = 88, escala 1.5): troca o conteúdo pelo .glb
      const st = g.children.find(c => c.isGroup && Math.abs(c.position.y - 88) < 0.01);
      for (const c of [...st.children]) { st.remove(c); c.geometry && c.geometry.dispose(); }
      for (const p of parts) {
        const m = new THREE.Mesh(p.geo.clone(), ctx.mats[p.cls] || ctx.mats.solid);
        m.userData.color = p.color;
        st.add(m);
      }
    };
  }
  if (hora !== 'dia') {
    const { getTrack } = await import('./js/tracks.js');
    const { kitTheme } = await import('./js/cities/kits.js');
    getTrack('rio').theme = kitTheme('rio', hora);
  }
  if (app.race) app.race.dispose();
  const errors = [];
  window.addEventListener('error', e => errors.push(String(e.message)));
  app.race = new Race(app, { mode: 'demo', trackId: 'rio', laps: 99, difficulty: 1, players: [] });
  app.paused = true;
  window.__errors = errors;
  const race = app.race, tr = race.track, N = tr.px.length;
  const cristo = tr.cityInfo.landmarkInfo.find(l => l.id === 'cristo');
  // peso da cena inteira (tudo o que existe, visível ou não)
  let tris = 0, meshes = 0, ctris = 0;
  const triOf = m => {
    const g = m.geometry; if (!g || !g.attributes.position) return 0;
    const n = (g.index ? g.index.count : g.attributes.position.count) / 3;
    return n * (m.isInstancedMesh ? m.count : 1);
  };
  race.scene.traverse(m => { if (m.isMesh) { meshes++; tris += triOf(m); } });
  // triângulos do marco do Cristo (morro + estátua), achados pela posição
  race.scene.traverse(m => {
    if (!m.isMesh || !m.geometry.boundingSphere) { if (m.isMesh) m.geometry.computeBoundingSphere(); }
  });
  window.__race = race;
  window.__cam = (kind, f) => {
    const v = race.views[0], cam = v.cam;
    if (kind === 'chase') {
      const i = Math.floor(f * N) % N, b = (i - 6 + N) % N, a = (i + 12) % N;
      cam.position.set(tr.px[b], tr.py[b] + 4.5, tr.pz[b]);
      cam.lookAt(tr.px[a], tr.py[a] + 2, tr.pz[a]);
    } else if (kind === 'cristo') {
      // do ponto da pista mais perto do Cristo, olhando para a estátua
      let bi = 0, bd = 1e18;
      for (let i = 0; i < N; i++) { const d = (tr.px[i] - cristo.x) ** 2 + (tr.pz[i] - cristo.z) ** 2; if (d < bd) { bd = d; bi = i; } }
      cam.position.set(tr.px[bi], tr.py[bi] + 6, tr.pz[bi]);
      cam.lookAt(cristo.x, 88 * cristo.scale + 18 * cristo.scale, cristo.z);
      return Math.round(Math.sqrt(bd));
    } else if (kind === 'zoom') {
      // perto da estátua, de frente (+z local do marco)
      const s = cristo.scale, r = cristo.rot;
      const fx = Math.sin(r), fz = Math.cos(r);
      const mid = (88 + 13.5 * 1.5) * s;  // meio da estátua (o grupo dela é escalado 1.5x)
      cam.position.set(cristo.x + fx * 95 * s, mid + 4 * s, cristo.z + fz * 95 * s);
      cam.lookAt(cristo.x, mid, cristo.z);
    }
    cam.fov = kind === 'zoom' ? 40 : 70;
  };
  window.__measure = () => {
    const r = app.renderer;
    race.render(r);
    return { calls: r.info.render.calls, tris: r.info.render.triangles };
  };
  return { glbParts: window.__glbParts || 0, sceneTris: tris, sceneMeshes: meshes, cristo, warn: tr.cityInfo.warn,
           geom: r_info(app.renderer) };
  function r_info(r) { return { geometries: r.info.memory.geometries, textures: r.info.memory.textures }; }
}
"""


def run(page, mode, hora='dia'):
    page.goto(URL)
    page.wait_for_function('window.app && window.app.renderer && window.app.race')
    # esconde menus e textos por cima do jogo (só o desenho 3D aparece nas capturas)
    page.add_style_tag(content='body *{visibility:hidden!important} canvas{visibility:visible!important}')
    info = page.evaluate(SETUP_JS, [mode, hora])
    if hora != 'dia':  # de noite só tira as capturas
        for kind, slug in (('cristo', 'rio-cristo'), ('zoom', 'rio-perto')):
            page.evaluate('([k,f]) => window.__cam(k,f)', [kind, 0])
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(OUT, f'{slug}-{mode}-{hora}.png'))
        return None
    res = {'info': info, 'pontos': {}}
    for name, kind, f in [('15%', 'chase', 0.15), ('50%', 'chase', 0.50), ('85%', 'chase', 0.85),
                          ('largada', 'chase', 0.0), ('olhando o Cristo', 'cristo', 0), ('perto da estátua', 'zoom', 0)]:
        d = page.evaluate('([k,f]) => window.__cam(k,f)', [kind, f])
        page.wait_for_timeout(250)  # deixa o jogo desenhar alguns quadros com essa câmera
        m = page.evaluate('window.__measure()')
        if d:
            m['dist'] = d
        res['pontos'][name] = m
        if name in ('olhando o Cristo', 'perto da estátua', 'largada'):
            slug = {'olhando o Cristo': 'rio-cristo', 'perto da estátua': 'rio-perto', 'largada': 'rio-largada'}[name]
            page.screenshot(path=os.path.join(OUT, f'{slug}-{mode}.png'))
    # simula 40 s de corrida com a IA (2400 passos de 1/60 s) para ver se aparece erro
    sim = page.evaluate("""() => { const r = window.__race; const t0 = performance.now(); let err = null;
        try { for (let i = 0; i < 2400; i++) r.update(1/60); } catch (e) { err = String(e); }
        const best = Math.max(...r.karts.map(k => (k.lap ?? 0)));
        return { err, ms: Math.round(performance.now() - t0), jsErrors: window.__errors, lider: best }; }""")
    res['sim'] = sim
    return res


def main():
    os.makedirs(OUT, exist_ok=True)
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True, args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'])
        for mode in ('proc', 'blender'):
            page = b.new_page(viewport={'width': 1280, 'height': 720})
            page.route(HOST + '/**', serve)
            logs = []
            page.on('console', lambda m, logs=logs: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
            page.on('pageerror', lambda e, logs=logs: logs.append(f'pageerror: {e}'))
            out[mode] = run(page, mode)
            run(page, mode, 'noite')
            out[mode]['console'] = logs[:20]
            out[mode]['gl'] = page.evaluate("""() => { const gl = window.app.renderer.getContext();
                const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; }""")
            page.close()
        b.close()
    lado_a_lado()
    print(json.dumps(out, ensure_ascii=False, indent=1))


def lado_a_lado():
    """Junta as capturas: à esquerda o Cristo de hoje, à direita o do Blender (apaga as soltas)."""
    from PIL import Image
    for nome in ('rio-perto', 'rio-cristo', 'rio-perto-noite', 'rio-cristo-noite', 'rio-largada'):
        base, _, hora = nome.partition('-noite')
        suf = '-noite' if nome.endswith('-noite') else ''
        fa = os.path.join(OUT, f'{base}-proc{suf}.png')
        fb = os.path.join(OUT, f'{base}-blender{suf}.png')
        if not (os.path.exists(fa) and os.path.exists(fb)):
            continue
        a, b = Image.open(fa), Image.open(fb)
        w, h = a.size
        c = Image.new('RGB', (w * 2 + 10, h), 'white')
        c.paste(a, (0, 0))
        c.paste(b, (w + 10, 0))
        c.save(os.path.join(OUT, f'lado-a-lado-{nome}.png'))
        os.remove(fa)
        os.remove(fb)


if __name__ == '__main__':
    sys.exit(main())
