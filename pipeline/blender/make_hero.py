"""Halo Isle hero v2: ONE fused jelly body (voxel-fused, smoothed), leaf, eye decal patches, 10-bone rig.
Run: python make_hero.py <out_dir>  (bpy 5.x) -> hero.blend, hero.glb
Animation is procedural in the game (src/hero), so the GLB carries mesh + skin only.
Front faces -Y in Blender (= +Z in three.js). 1.0 m to the top of the head."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from common import reset, mat, srgb, hexc, lathe, ellipsoid, smooth_profile, export_glb
out = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
reset(); C = bpy.context
JELLY = mat('Hero_Jelly', srgb('#4db8f8'), rough=0.14, clearcoat=1.0, cc_rough=0.04)
LEAF = mat('Hero_Leaf', srgb('#ffffff'), rough=0.3, clearcoat=0.8, cc_rough=0.08)
_ca = LEAF.node_tree.nodes.new('ShaderNodeVertexColor'); _ca.layer_name = 'Col'
LEAF.node_tree.links.new(_ca.outputs['Color'], LEAF.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
EYEL = mat('Hero_EyeL', srgb('#1b2f6b'), rough=0.1); EYER = mat('Hero_EyeR', srgb('#1b2f6b'), rough=0.1)

def sm(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

# ---------------- body volume pieces (fused below). Units: 1.0 = top of head. Measured off the character sheet turnaround:
# head .44 tall x .57 wide, torso pear .54 wide, arms = big flattened teardrops out to +-.41, feet .27 wide x .38 long x .15 tall.
BPROF = [(0, .125), (.16, .128), (.225, .15), (.258, .195), (.272, .265), (.264, .34), (.238, .425), (.195, .505), (.155, .565), (0, .61)]
prof = smooth_profile(BPROF, 5)
pieces = []
b = lathe('Body', prof, 56); pieces.append(b)
HC, HR = Vector((0, 0, .762)), (.312, .29, .25)
pieces.append(ellipsoid('Head', HC, HR, 56, 32))
SH, HAND = Vector((.16, 0, .56)), Vector((.4, 0, .2))     # arm axis: shoulder (buried) -> tip of the teardrop
def arm_r(t): return (.056 + .064 * sm(0, .62, t)) * (1 if t < .62 else math.sqrt(max(0, 1 - ((t - .62) / .38) ** 2)))
def teardrop(sx):
    bm = bmesh.new(); ax = (HAND - SH); e1 = Vector((ax.z, 0, -ax.x)).normalized(); e2 = Vector((0, 1, 0)); NR, NS = 22, 24; rings = []
    for i in range(NR + 1):
        t = i / NR; t = 1 - (1 - t) ** 1.6 if i else 0; c = SH + ax * t; r = max(arm_r(t), 0)
        if i == NR: rings.append([bm.verts.new((c.x * sx, c.y, c.z))]); continue
        rings.append([bm.verts.new(((c.x + e1.x * r * math.cos(a)) * sx, c.y + r * 1.42 * math.sin(a), c.z + e1.z * r * math.cos(a))) for a in (2 * math.pi * k / NS for k in range(NS))])
    for ra, rb in zip(rings, rings[1:]):
        for k in range(NS):
            if len(rb) == 1: bm.faces.new((ra[k], ra[(k + 1) % NS], rb[0]))
            else: bm.faces.new((ra[k], ra[(k + 1) % NS], rb[(k + 1) % NS], rb[k]))
    bm.faces.new(rings[0][::-1]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('Arm'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('Arm', me); C.collection.objects.link(o); return o
for sx in (1, -1):
    pieces.append(teardrop(sx))
    f = ellipsoid('Foot', (0, 0, 0), (1, 1, 1), 36, 24); P = 2.25
    for v in f.data.vertices:
        n = v.co; k = (abs(n.x) ** P + abs(n.y) ** P + abs(n.z) ** P) ** (-1 / P)
        v.co = Vector((.143 * sx + n.x * k * .134, -.012 + n.y * k * .19, .09 + n.z * k * .096))
    pieces.append(f)
for o in C.scene.objects: o.select_set(o in pieces)
C.view_layer.objects.active = b; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); bpy.ops.object.join()
body = C.view_layer.objects.active; body.name = 'HeroBody'
m = body.modifiers.new('fuse', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = .0085; m.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier='fuse')
m = body.modifiers.new('soft', 'SMOOTH'); m.factor = .5; m.iterations = 4
bpy.ops.object.modifier_apply(modifier='soft')
# keep the soles flat on the ground after smoothing
top = max(v.co.z for v in body.data.vertices)
for v in body.data.vertices: v.co *= 1.0 / top
zmin = min(v.co.z for v in body.data.vertices)
for v in body.data.vertices:
    v.co.z -= zmin
    if v.co.z < .004: v.co.z = 0
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
m = body.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1, 20000 / tris)
bpy.ops.object.modifier_apply(modifier='dec')
for p in body.data.polygons: p.use_smooth = True
body.data.materials.clear(); body.data.materials.append(JELLY)
s = 1.0
print('body tris', sum(len(p.vertices) - 2 for p in body.data.polygons), 'scale', s)

def bodyR(z):
    P = [(r, zz) for r, zz in BPROF]
    for (r0, z0), (r1, z1) in zip(P, P[1:]):
        if z0 <= z <= z1: return r0 + (r1 - r0) * (z - z0) / max(1e-6, z1 - z0)
    return 0.0
def seg_d(p, a, bb):
    ab = bb - a; t = max(0, min(1, (p - a).dot(ab) / ab.length_squared)); return (p - (a + ab * t)).length

G = {n: body.vertex_groups.new(name=n) for n in ('body', 'head', 'armL', 'armR', 'footL', 'footR')}
for v in body.data.vertices:
    p = v.co / s
    wh = sm(.545, .6, p.z)
    side = 'L' if p.x > 0 else 'R'; sx = 1 if p.x > 0 else -1
    d = seg_d(p, Vector((SH.x * sx, SH.y, SH.z)), Vector((HAND.x * sx, HAND.y, HAND.z)))
    outside = math.hypot(p.x, p.y) - bodyR(p.z)
    wa = sm(-.012, .04, outside) * sm(.19, .11, d) * (1 - wh) * sm(.12, .19, p.z)
    wf = sm(.2, .11, p.z) * (1 - wa)
    wb = max(0, 1 - wh - wa - wf)
    tot = wh + wa + wf + wb
    for n, w in (('head', wh), ('arm' + side, wa), ('foot' + side, wf), ('body', wb)):
        if w > 1e-4: G[n].add([v.index], w / tot, 'REPLACE')

# ---------------- leaf: thick stem curving into a plump, glossy almond blade with a centre crease.
# Points to the character's left and a little back, rising ~18 deg; the top face leans toward the front so you read it from the front.
Hd = Vector((math.cos(math.radians(14)), math.sin(math.radians(14)), 0)); EL = math.radians(15)
AX = (Hd * math.cos(EL) + Vector((0, 0, 1)) * math.sin(EL)).normalized(); PERP = Vector((-Hd.y, Hd.x, 0)); N0 = AX.cross(PERP).normalized()
if N0.z < 0: N0 = -N0
ROLL = math.radians(56); WD = PERP * math.cos(ROLL) + N0 * math.sin(ROLL); NN = N0 * math.cos(ROLL) - PERP * math.sin(ROLL)
LB, LLEN = Hd * .03 + Vector((0, 0, 1.105)), .37
def leaf_curve(u): return LB + AX * (LLEN * u) + N0 * (.035 * math.sin(math.pi * u))
bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); LV = {}
stem = [Vector((0, 0, .985)), Vector((-.004, 0, 1.045)), Hd * .008 + Vector((0, 0, 1.085)), LB + AX * .03]
rings = []
for i, p in enumerate(stem):
    r = .031 - .002 * i; tg = (stem[min(i + 1, 3)] - stem[max(i - 1, 0)]).normalized(); e1 = tg.cross(Vector((0, 1, 0))).normalized(); e2 = tg.cross(e1)
    rings.append([bm.verts.new(p + (e1 * math.cos(a) + e2 * math.sin(a)) * r) for a in (2 * math.pi * k / 12 for k in range(12))])
for ra, rb in zip(rings, rings[1:]):
    for k in range(12): bm.faces.new((ra[k], ra[(k + 1) % 12], rb[(k + 1) % 12], rb[k]))
NU, NT = 26, 18; lr = []
for i in range(NU + 1):
    u = i / NU; c = leaf_curve(u); a_ = .1 * (math.sin(math.pi * min(1, u ** .72)) ** .78) * (1 - .12 * u) + .004; b_ = a_ * .62 + .004
    ring = []
    for k in range(NT):
        th = 2 * math.pi * k / NT; cs, sn = math.cos(th), math.sin(th)
        bb = b_ * (1 - .42 * math.exp(-(cs / .22) ** 2)) if sn > 0 else b_ * .8          # crease along the top midrib
        v = bm.verts.new(c + WD * (a_ * cs) + NN * (bb * sn)); LV[v] = (u, sn, abs(cs)); ring.append(v)
    lr.append(ring)
for ra, rb in zip(lr, lr[1:]):
    for k in range(NT): bm.faces.new((ra[k], rb[k], rb[(k + 1) % NT], ra[(k + 1) % NT]))
bm.faces.new(lr[0]); bm.faces.new(lr[-1][::-1])
shade, main, hi = Vector(hexc('#3f9f2a')), Vector(hexc('#86d42a')), Vector(hexc('#c5ee4e'))
for f in bm.faces:
    for lp in f.loops:
        u, top, edge = LV.get(lp.vert, (0, -.2, 1)); c = shade.lerp(main, max(0, min(1, .55 + top * .6))).lerp(hi, max(0, top) * (.25 + .5 * u) * (1 - .5 * math.exp(-(edge / .2) ** 2)))
        lp[col] = (*c, 1)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new('Leaf'); bm_u = {v.index: LV.get(v, (0, 0, 0))[0] for v in bm.verts}; bm.verts.index_update(); bm_u = {v.index: LV.get(v, (0, 0, 0))[0] for v in bm.verts}
bm.to_mesh(me); bm.free()
leaf = bpy.data.objects.new('Leaf', me); C.collection.objects.link(leaf)
for p in me.polygons: p.use_smooth = True
me.materials.append(LEAF)
LG = {n: leaf.vertex_groups.new(name=n) for n in ('leaf1', 'leaf2', 'leaf3')}
for v in me.vertices:
    u = bm_u[v.index]
    w3 = sm(.45, .9, u); w2 = sm(.02, .45, u) * (1 - w3); w1 = 1 - w2 - w3
    for n, w in (('leaf1', w1), ('leaf2', w2), ('leaf3', w3)):
        if w > 1e-4: LG[n].add([v.index], w, 'REPLACE')

# ---------------- eye decal patches (expression atlas is drawn at runtime), shrink-wrapped onto the head
eyes = []
for name, sx, M in (('EyeL', 1, EYEL), ('EyeR', -1, EYER)):
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); N = 10; EW, EH = .15, .2
    vs = [[bm.verts.new((sx * .083 + (i / N - .5) * EW, -.4, .775 + (j / N - .5) * EH)) for i in range(N + 1)] for j in range(N + 1)]
    for j in range(N):
        for i in range(N):
            f = bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
            for lp, (a, bb) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))): lp[uvl].uv = (a / N, bb / N)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    e = bpy.data.objects.new(name, me); C.collection.objects.link(e)
    sw = e.modifiers.new('wrap', 'SHRINKWRAP'); sw.target = body; sw.wrap_method = 'PROJECT'
    sw.use_project_x = False; sw.use_project_y = True; sw.use_project_z = False
    sw.use_positive_direction = True; sw.use_negative_direction = False; sw.offset = .0035
    C.view_layer.objects.active = e; bpy.ops.object.modifier_apply(modifier='wrap')
    for p in me.polygons: p.use_smooth = True
    me.materials.append(M); e.vertex_groups.new(name='head').add([v.index for v in me.vertices], 1, 'REPLACE'); eyes.append(e)

for o in C.scene.objects: o.select_set(o in [body, leaf] + eyes)
C.view_layer.objects.active = body; bpy.ops.object.join(); hero = body; hero.name = 'Hero'
# normals for the fused surface come from smooth shading; eyes inherit the head curvature

# ---------------- rig
arm = bpy.data.armatures.new('HeroRig'); rig = bpy.data.objects.new('HeroRig', arm); C.collection.objects.link(rig)
C.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
def bone(n, h, t, parent=None):
    eb = arm.edit_bones.new(n); eb.head = h; eb.tail = t
    if parent: eb.parent = arm.edit_bones[parent]
    return eb
bone('root', (0, 0, 0), (0, 0, .08))
bone('body', (0, 0, .08), (0, 0, .5), 'root')
bone('head', (0, 0, .575), (0, 0, .95), 'body')
for n, sx in (('L', 1), ('R', -1)):
    bone('arm' + n, (SH.x * sx, 0, SH.z + .012), (HAND.x * sx, HAND.y, HAND.z), 'body')
    bone('foot' + n, (.142 * sx, 0, .14), (.142 * sx, -.17, .03), 'root')
bone('leaf1', (0, 0, .99), tuple(leaf_curve(.04)), 'head')
bone('leaf2', tuple(leaf_curve(.04)), tuple(leaf_curve(.55)), 'leaf1')
bone('leaf3', tuple(leaf_curve(.55)), tuple(leaf_curve(1)), 'leaf2')
bpy.ops.object.mode_set(mode='OBJECT')
hero.parent = rig; md = hero.modifiers.new('Armature', 'ARMATURE'); md.object = rig
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'hero.blend'))
export_glb(os.path.join(out, 'hero.glb'), [rig, hero], anim=False)
print('hero v2 tris', sum(len(p.vertices) - 2 for p in hero.data.polygons))
