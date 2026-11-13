# Cristo Redentor (Rio) para o Race Cities, feito 100% por script do Blender.
#
# Uso (Mac, Blender 4.x ou mais novo), na pasta do projeto:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/cristo.py
# Opções (depois de "--"):
#   --saida caminho/arquivo.glb   (padrão: assets/models/cristo.glb)
#   --salvar-blend                também salva um .blend ao lado do .glb, para abrir e mexer no Blender
#
# Como o modelo casa com o jogo:
#   * Mesma escala do grupo "st" do Cristo procedural (js/cities/lm-west.js): origem no chão do
#     pedestal, ~27 unidades de altura, ~27 de braço a braço. No jogo o grupo é escalado 1.5x.
#   * Frente virada para +Z do jogo (o glTF já sai com Y para cima).
#   * Uma malha só. Cores por vértice (COLOR_0, sem texturas) e 3 materiais com o NOME das
#     classes de pintura do jogo: "solid" (pedestal), "smooth" (estátua) e "neon" (luz dos pés).
#     Assim o jogo pode trocar esses materiais pelos compartilhados dele (ctx.mats[nome]).
#
# A geometria é montada em Python puro (listas de vértices/faces); o Blender só cria a malha,
# as cores, os materiais, as normais (quinas duras por ângulo) e exporta o .glb.

import math
import os
import sys

import bpy
import bmesh

# ---------------------------------------------------------------- opções
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def _script_dir():
    try:
        return os.path.dirname(os.path.abspath(__file__))
    except NameError:  # alguns jeitos de rodar não definem __file__
        if '--python' in sys.argv:
            return os.path.dirname(os.path.abspath(sys.argv[sys.argv.index('--python') + 1]))
        return os.getcwd()


ROOT = os.path.normpath(os.path.join(_script_dir(), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'models', 'cristo.glb')
if '--saida' in argv:
    OUT = os.path.abspath(argv[argv.index('--saida') + 1])
SAVE_BLEND = '--salvar-blend' in argv

# ---------------------------------------------------------------- cores (as mesmas do jogo)


def lin(hexc):
    """Cor hex sRGB (como no jogo) -> RGBA linear (o que o glTF guarda em COLOR_0)."""
    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (ch((hexc >> 16) & 255), ch((hexc >> 8) & 255), ch(hexc & 255), 1.0)


STONE = 0xf1ece2     # pedra-sabão clarinha (mesma do procedural)
MANTLE = 0xe8e1d3    # manto, um tom abaixo para dar leitura
BELT = 0xddd5c4
HAIR = 0xd2c9b6
EYES = 0x8a8070
HEART = 0xf0cfc0
PEDESTAL = 0xd8d2c4  # mesma do procedural
PLINTH = 0xe4ddd0
DOOR = 0x8f8170
NEON = 0xfff0c8      # luz dos pés (de noite acende)

MATS = {  # nome = classe de pintura do jogo (js/cities/common.js -> makeMaterials)
    'solid': dict(rough=0.8, metal=0.0),
    'smooth': dict(rough=0.5, metal=0.0),
    'neon': dict(rough=0.35, metal=0.2),
}
MAT_ORDER = list(MATS)

# ---------------------------------------------------------------- geometria (coordenadas do jogo:
# x direita, y para cima, +z = frente). Faces em sentido anti-horário vistas de fora.


class Part:
    def __init__(self, verts, faces):
        self.v = [tuple(p) for p in verts]
        self.f = [tuple(f) for f in faces]

    def moved(self, dx=0.0, dy=0.0, dz=0.0):
        return Part([(x + dx, y + dy, z + dz) for x, y, z in self.v], self.f)

    def rot_x(self, ang, cy=0.0, cz=0.0):
        c, s = math.cos(ang), math.sin(ang)
        return Part([(x, cy + (y - cy) * c - (z - cz) * s, cz + (y - cy) * s + (z - cz) * c) for x, y, z in self.v], self.f)

    def rot_z(self, ang, cx=0.0, cy=0.0):
        c, s = math.cos(ang), math.sin(ang)
        return Part([(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c, z) for x, y, z in self.v], self.f)

    def scaled(self, k, c):
        return Part([tuple(c[i] + (p[i] - c[i]) * k for i in range(3)) for p in self.v], self.f)

    def mirror_x(self):
        # espelhar inverte o sentido das faces: desvira para continuar "para fora"
        return Part([(-x, y, z) for x, y, z in self.v], [tuple(reversed(f)) for f in self.f])


def hexa(p):
    """Bloco de 8 cantos quaisquer. p[ix + 2*iy + 4*iz], 0 = lado menor do eixo."""
    return Part(p, [(0, 4, 6, 2), (1, 3, 7, 5), (0, 1, 5, 4), (2, 6, 7, 3), (0, 2, 3, 1), (4, 5, 7, 6)])


def box(cx, cy, cz, w, h, d):
    return hexa([(cx + (i & 1 and 0.5 or -0.5) * w, cy + (i & 2 and 0.5 or -0.5) * h, cz + (i & 4 and 0.5 or -0.5) * d) for i in range(8)])


def frustum(cx, y0, cz, wb, db, wt, dt, h):
    """Tronco de pirâmide de base retangular (pedestal)."""
    p = []
    for i in range(8):
        top = bool(i & 2)
        w, d = (wt, dt) if top else (wb, db)
        p.append((cx + (0.5 if i & 1 else -0.5) * w, y0 + (h if top else 0.0), cz + (0.5 if i & 4 else -0.5) * d))
    return hexa(p)


def lathe(profile, seg, sx=1.0, sz=1.0, a0=0.0, a1=2 * math.pi, rmod=None, cap0=True, cap1=True):
    """Superfície de revolução em volta do eixo y. profile = [(y, r), ...] de baixo para cima.
    sx/sz achatam (elipse). rmod(k, y) multiplica o raio (dobras). Ângulo 0 = frente (+z)."""
    full = abs(a1 - a0 - 2 * math.pi) < 1e-9
    n = seg if full else seg + 1
    v, f = [], []
    for (y, r) in profile:
        for k in range(n):
            a = a0 + (a1 - a0) * k / seg
            m = rmod(k, y) if rmod else 1.0
            v.append((math.sin(a) * r * m * sx, y, math.cos(a) * r * m * sz))
    for j in range(len(profile) - 1):
        for k in range(seg):
            k1 = (k + 1) % n
            a, b = j * n + k, j * n + k1
            f.append((a, b, b + n, a + n))
    if full and cap0:
        f.append(tuple(reversed(range(n))))
    if full and cap1:
        last = (len(profile) - 1) * n
        f.append(tuple(range(last, last + n)))
    return Part(v, f)


def ellipsoid(c, r, ws=12, hs=8):
    cx, cy, cz = c
    rx, ry, rz = r
    v = [(cx, cy + ry, cz)]
    for j in range(1, hs):
        ph = math.pi * j / hs
        for k in range(ws):
            th = 2 * math.pi * k / ws
            v.append((cx + rx * math.sin(ph) * math.sin(th), cy + ry * math.cos(ph), cz + rz * math.sin(ph) * math.cos(th)))
    v.append((cx, cy - ry, cz))
    bot = len(v) - 1
    f = []
    ring = lambda j, k: 1 + (j - 1) * ws + (k % ws)
    for k in range(ws):
        f.append((0, ring(1, k), ring(1, k + 1)))
    for j in range(1, hs - 1):  # j = anel de cima, j+1 = anel de baixo
        for k in range(ws):
            f.append((ring(j + 1, k), ring(j + 1, k + 1), ring(j, k + 1), ring(j, k)))
    for k in range(ws):
        f.append((bot, ring(hs - 1, k + 1), ring(hs - 1, k)))
    return Part(v, f)


def tube(p0, p1, r0, r1, n=8, roll=0.0):
    """Cilindro/cone tampado entre dois pontos."""
    ax = [p1[i] - p0[i] for i in range(3)]
    L = math.sqrt(sum(a * a for a in ax))
    a = [x / L for x in ax]
    ref = (0.0, 1.0, 0.0) if abs(a[1]) < 0.9 else (1.0, 0.0, 0.0)
    u = [ref[1] * a[2] - ref[2] * a[1], ref[2] * a[0] - ref[0] * a[2], ref[0] * a[1] - ref[1] * a[0]]
    lu = math.sqrt(sum(x * x for x in u))
    u = [x / lu for x in u]
    w = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]]  # w = a x u
    v = []
    for (p, r) in ((p0, r0), (p1, r1)):
        for k in range(n):
            t = roll + 2 * math.pi * k / n
            v.append(tuple(p[i] + r * (math.cos(t) * u[i] + math.sin(t) * w[i]) for i in range(3)))
    f = [(k, (k + 1) % n, n + (k + 1) % n, n + k) for k in range(n)]
    f.append(tuple(reversed(range(n))))
    f.append(tuple(range(n, 2 * n)))
    return Part(v, f)


def prism_down(cx, ytop, cz, w, h, d):
    """Prisma triangular com a ponta para baixo (ponta do coração)."""
    zb, zf = cz - d / 2, cz + d / 2
    v = [(cx - w / 2, ytop, zf), (cx, ytop - h, zf), (cx + w / 2, ytop, zf),
         (cx - w / 2, ytop, zb), (cx, ytop - h, zb), (cx + w / 2, ytop, zb)]
    f = [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    return Part(v, f)


# ---------------------------------------------------------------- o Cristo
ROBE = [(6.3, 2.6), (7.0, 2.55), (9.0, 2.35), (11.5, 2.15), (13.8, 2.05), (15.5, 2.15),
        (17.5, 2.35), (19.2, 2.45), (20.2, 2.2), (20.85, 1.5), (21.15, 0.8)]
DEPTH = 0.74  # o corpo é mais fino de frente para trás


def robe_r(y):
    for (y0, r0), (y1, r1) in zip(ROBE, ROBE[1:]):
        if y0 <= y <= y1:
            return r0 + (r1 - r0) * (y - y0) / (y1 - y0)
    return ROBE[0][1] if y < ROBE[0][0] else ROBE[-1][1]


def folds(amp, top):
    """Dobras verticais da roupa: raio alterna para dentro/fora, somem perto de y=top."""
    def f(k, y):
        t = max(0.0, min(1.0, (top - y) / (top - 6.0)))
        return 1.0 + amp * t * (1 if k % 2 == 0 else -1)
    return f


parts = []  # (Part, cor, material, plano?)


def add(part, color, mat='smooth', flat=False):
    parts.append((part, color, mat, flat))


def add_sym(part, color, mat='smooth', flat=False):
    add(part, color, mat, flat)
    add(part.mirror_x(), color, mat, flat)


# pedestal (capela) -- "solid" = facetado, como no jogo
add(frustum(0, 0.0, 0, 5.6, 5.6, 5.0, 5.0, 5.0), PEDESTAL, 'solid', True)
add(box(0, 5.25, 0, 5.8, 0.5, 5.8), PLINTH, 'solid', True)
add(box(0, 5.8, 0, 4.6, 0.6, 4.6), PEDESTAL, 'solid', True)
add(box(0, 1.1, 2.72, 1.3, 2.2, 0.3), DOOR, 'solid', True)  # portinha da capela
# luz nos pés (de noite fica iluminado)
add(lathe([(6.1, 2.55), (6.32, 2.55)], 12), NEON, 'neon', True)

# túnica com dobras + cordão na cintura
add(lathe(ROBE, 16, 1.0, DEPTH, rmod=folds(0.07, 14.0)), STONE)
add(lathe([(13.75, 2.16), (14.3, 2.18)], 16, 1.0, DEPTH + 0.02), BELT)
add(box(0.45, 13.15, 2.05 * DEPTH + 0.08, 0.22, 1.3, 0.16), BELT, flat=True)  # ponta do cordão
# pezinhos aparecendo embaixo da barra
add_sym(box(0.75, 6.45, 1.75, 0.7, 0.35, 0.9), STONE, flat=True)

# manto: casca grossa nas costas, aberta na frente, caindo dos ombros até abaixo do joelho
MY = [9.0, 11.5, 13.8, 15.5, 17.5, 19.2, 20.2, 20.75]
A0, A1, MSEG = math.radians(48), math.radians(312), 12
inner = [(y, robe_r(y) * 1.08 + 0.06) for y in MY]
outer = [(y, r + 0.24) for y, r in inner]
mfold = folds(0.045, 17.0)
o = lathe(outer, MSEG, 1.0, DEPTH, A0, A1, rmod=lambda k, y: mfold(k + 1, y))
i_ = lathe(inner, MSEG, 1.0, DEPTH, A0, A1)
n = MSEG + 1
rows = len(MY)
mv = o.v + i_.v
mf = list(o.f) + [tuple(x + len(o.v) for x in reversed(fc)) for fc in i_.f]
off = len(o.v)
for k in range(MSEG):  # barra de baixo e gola de cima
    mf.append((off + k, off + k + 1, k + 1, k))
    t = (rows - 1) * n
    mf.append((t + k, t + k + 1, off + t + k + 1, off + t + k))
for j in range(rows - 1):  # as duas bordas da abertura da frente
    a, b = j * n, (j + 1) * n
    mf.append((a, a + n, off + a + n, off + a))
    a2, b2 = j * n + MSEG, (j + 1) * n + MSEG
    mf.append((off + a2, off + b2, b2, a2))
add(Part(mv, mf), MANTLE)

# braços abertos: braço + punho largo + mão com palma para frente + manga caída
SH = (1.7, 19.85, 0.0)
WR = (11.2, 20.15, 0.0)
add_sym(tube(SH, WR, 0.98, 0.7, 8), STONE)
add_sym(tube((10.9, 20.13, 0.0), (11.95, 20.18, 0.0), 0.78, 0.98, 8), MANTLE)
add_sym(box(12.8, 20.12, 0.08, 1.75, 1.05, 0.42).rot_z(-0.05, 12.0, 20.15), STONE, flat=True)
add_sym(box(12.15, 20.72, 0.18, 0.34, 0.62, 0.3), STONE, flat=True)  # polegar para cima
# manga: "asa" de pano do sovaco até o punho
add_sym(hexa([
    (2.2, 15.7, -0.75), (11.0, 19.25, -0.42), (2.0, 19.5, -0.8), (11.0, 20.2, -0.5),
    (2.2, 15.7, 0.75), (11.0, 19.25, 0.42), (2.0, 19.5, 0.8), (11.0, 20.2, 0.5),
]), MANTLE)

# pescoço e cabeça (levemente inclinada para baixo), cabelo, barba e rostinho estilizado
add(tube((0, 20.7, 0), (0, 22.4, 0.05), 0.66, 0.6, 8), STONE)
HC = (0.0, 23.35, 0.15)
TILT = math.radians(10)
head = [
    (ellipsoid(HC, (1.25, 1.55, 1.35), 12, 9), STONE, False),
    (ellipsoid((0.0, 23.62, -0.2), (1.34, 1.6, 1.38), 12, 8), HAIR, False),           # cabelo (touca)
    (ellipsoid((0.0, 22.25, -0.45), (1.22, 1.35, 0.78), 10, 6), HAIR, False),          # cabelo até o ombro
    (ellipsoid((0.0, 22.32, 0.88), (0.86, 0.78, 0.62), 10, 6), HAIR, False),           # barba
    (box(0.0, 23.25, 1.58, 0.28, 0.6, 0.42), STONE, True),                              # nariz
    (ellipsoid((0.45, 23.68, 1.34), (0.24, 0.07, 0.08), 6, 4), EYES, False),          # olhos fechados
    (ellipsoid((-0.45, 23.68, 1.34), (0.24, 0.07, 0.08), 6, 4), EYES, False),
]
HEAD_K = 1.12  # cabeça um pouco maior que a real: lê melhor de longe (estilo desenho)
for p, c, fl in head:
    add(p.rot_x(TILT, HC[1], HC[2]).scaled(HEAD_K, (0.0, 21.4, 0.0)), c, flat=fl)

# coração no peito
zf = 2.36 * DEPTH + 0.06
add_sym(ellipsoid((0.24, 18.45, zf), (0.3, 0.27, 0.12), 8, 5), HEART)
add(prism_down(0.0, 18.42, zf, 1.04, 0.62, 0.22), HEART, flat=True)


def check(part, idx):
    """Conferência: toda peça tem de ser fechada (cada aresta usada 2x, em sentidos opostos)
    e com as faces para fora (volume com sinal positivo)."""
    edges = {}
    for fc in part.f:
        for a, b in zip(fc, fc[1:] + fc[:1]):
            edges[(a, b)] = edges.get((a, b), 0) + 1
    bad = [e for e, c in edges.items() if c != 1 or edges.get((e[1], e[0])) != 1]
    vol = 0.0
    for fc in part.f:
        p0 = part.v[fc[0]]
        for i in range(1, len(fc) - 1):
            a, b = part.v[fc[i]], part.v[fc[i + 1]]
            vol += (p0[0] * (a[1] * b[2] - a[2] * b[1]) - p0[1] * (a[0] * b[2] - a[2] * b[0]) + p0[2] * (a[0] * b[1] - a[1] * b[0])) / 6
    if bad or vol <= 0:
        print(f'[cristo] AVISO peça {idx}: {len(bad)} arestas abertas/erradas, volume {vol:.3f}')
    return not bad and vol > 0


ok = all([check(p, i) for i, (p, *_rest) in enumerate(parts)])
print('[cristo] conferência das peças:', 'tudo fechado e virado para fora' if ok else 'COM AVISOS')

# ---------------------------------------------------------------- monta a malha no Blender


def to_blender(p):
    """Jogo/glTF (Y para cima, +Z frente) -> Blender (Z para cima, -Y frente).
    O exportador glTF desfaz isso (export_yup) e o arquivo sai igual ao jogo."""
    x, y, z = p
    return (x, -z, y)


bpy.ops.wm.read_factory_settings(use_empty=True)

verts, faces, fcol, fmat, fflat = [], [], [], [], []
for part, color, mat, flat in parts:
    base = len(verts)
    verts += [to_blender(p) for p in part.v]
    for fc in part.f:
        faces.append(tuple(base + i for i in fc))
        fcol.append(lin(color))
        fmat.append(MAT_ORDER.index(mat))
        fflat.append(flat)

me = bpy.data.meshes.new('Cristo')
me.from_pydata(verts, [], faces)
me.validate(clean_customdata=False)
me.update()
assert len(me.polygons) == len(faces), 'o Blender descartou faces inválidas'

for name in MAT_ORDER:
    cfg = MATS[name]
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True  # no Blender 5 é sempre ligado (e o campo pode sumir)
    except AttributeError:
        pass
    nt = m.node_tree
    bsdf = next(nd for nd in nt.nodes if nd.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = cfg['rough']
    bsdf.inputs['Metallic'].default_value = cfg['metal']
    vc = nt.nodes.new('ShaderNodeVertexColor')  # "Color Attribute": base color = cor do vértice
    vc.layer_name = 'Col'
    vc.location = (bsdf.location.x - 300, bsdf.location.y)
    nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    m.diffuse_color = (0.9, 0.88, 0.84, 1.0)
    me.materials.append(m)

me.polygons.foreach_set('material_index', fmat)

col = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='CORNER')
loopcols = [0.0] * (len(me.loops) * 4)
for p in me.polygons:
    c = fcol[p.index]
    for li in p.loop_indices:
        loopcols[li * 4:li * 4 + 4] = c
col.data.foreach_set('color', loopcols)
try:
    me.color_attributes.active_color = col
    me.color_attributes.render_color_index = me.color_attributes.find('Col')
except (AttributeError, TypeError):
    pass

# sombreamento: peças "planas" facetadas; nas outras, quina dura acima de ~40 graus
SHARP = math.radians(40)
bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()
for f in bm.faces:
    f.smooth = not fflat[f.index]
for e in bm.edges:
    ang = e.calc_face_angle(None)
    e.smooth = ang is not None and ang < SHARP
bm.to_mesh(me)
bm.free()
if hasattr(me, 'use_auto_smooth'):  # Blender 4.0 ainda precisa disso para respeitar as quinas
    me.use_auto_smooth = True
    me.auto_smooth_angle = math.pi
me.update()

obj = bpy.data.objects.new('Cristo', me)
bpy.context.scene.collection.objects.link(obj)

tris = sum(len(p.vertices) - 2 for p in me.polygons)
print(f'[cristo] {len(parts)} peças, {len(me.vertices)} vértices, {len(me.polygons)} faces, {tris} triângulos')

# ---------------------------------------------------------------- exporta
os.makedirs(os.path.dirname(OUT), exist_ok=True)
props = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
want = dict(
    filepath=OUT, export_format='GLB', use_selection=False, export_yup=True, export_apply=True,
    export_normals=True, export_texcoords=False, export_tangents=False, export_materials='EXPORT',
    export_cameras=False, export_lights=False, export_animations=False, export_skins=False,
    export_morph=False, export_extras=False, export_draco_mesh_compression_enable=False,
    export_vertex_color='ACTIVE',  # Blender 4.2+
    export_colors=True,            # Blender 4.0/4.1
)
kw = {k: v for k, v in want.items() if k == 'filepath' or k in props}
if 'export_vertex_color' in kw:
    items = {i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_vertex_color'].enum_items}
    if 'ACTIVE' not in items:
        kw['export_vertex_color'] = 'MATERIAL'
res = bpy.ops.export_scene.gltf(**kw)
if 'FINISHED' not in res or not os.path.exists(OUT):
    raise SystemExit('[cristo] falhou ao exportar')
print(f'[cristo] salvo {OUT} ({os.path.getsize(OUT) / 1024:.1f} KB) com Blender {bpy.app.version_string}')

if SAVE_BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + '.blend')
