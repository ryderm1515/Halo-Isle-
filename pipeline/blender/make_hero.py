"""Halo Isle hero ("Sprout") first-pass model, rig and clips.
Run: python make_hero.py <out_dir>   (bpy 5.x)   -> hero.blend, hero.glb
Built from Ryder's character sheet: round head, pear body, paddle arms, two visible feet,
leaf sprout, dark vertical oval eyes. Front faces -Y in Blender (= +Z in three.js). Height 1.0 m to top of head."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler, Quaternion
from common import reset, mat, srgb, hexc, lathe, ellipsoid, smooth_profile, export_glb
out = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
reset()
C = bpy.context
BLUE = mat('Hero_Jelly', srgb('#7ccdf4'), rough=0.16, clearcoat=1.0, cc_rough=0.04)
EYE = mat('Hero_Eye', srgb('#18305e'), rough=0.08, clearcoat=1.0, cc_rough=0.02)
LEAF = mat('Hero_Leaf', srgb('#ffffff'), rough=0.32, clearcoat=0.7, cc_rough=0.1)
_ca = LEAF.node_tree.nodes.new('ShaderNodeVertexColor'); _ca.layer_name = 'Col'
LEAF.node_tree.links.new(_ca.outputs['Color'], LEAF.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
parts = {}
# ---- body: pear lathe, slightly shallower front-back
prof = smooth_profile([(0, .095), (.15, .10), (.245, .14), (.285, .23), (.282, .33), (.245, .44), (.19, .54), (.14, .615), (0, .64)], 5)
b = lathe('Body', prof, 40); b.scale = (1, .9, 1); parts['body'] = b
# ---- head: soft sphere, a touch wider than tall
h = ellipsoid('Head', (0, 0, .79), (.255, .235, .225), 40, 24); parts['head'] = h
# ---- feet: rounded pebbles, flat soles, toes forward (-Y); clearly visible beneath the body
for side, x in (('L', .118), ('R', -.118)):
    f = ellipsoid('Foot_' + side, (x, -.035, .072), (.112, .158, .082), 28, 16)
    for v in f.data.vertices:
        if v.co.z < .012: v.co.z = .012 - (.012 - v.co.z) * .08
    parts['foot_' + side] = f
# ---- arms: paddles that widen toward the hand
aprof = smooth_profile([(0, .045), (.035, .037), (.055, .015), (.065, -.04), (.07, -.13), (.078, -.21), (.072, -.26), (.05, -.292), (0, -.305)], 5)
for side, sx in (('L', 1), ('R', -1)):
    a = lathe('Arm_' + side, aprof, 24); a.scale = (1, .95, 1)
    a.rotation_euler = (0, math.radians(-14) * sx, 0); a.location = (.2 * sx, .01, .56)
    parts['arm_' + side] = a
# ---- eyes: dark vertical ovals sitting on the head surface
for side, x in (('L', .088), ('R', -.088)):
    e = ellipsoid('Eye_' + side, (0, 0, 0), (.026, .016, .058), 20, 12)
    hc = Vector((0, 0, .79)); p = Vector((x, -.3, .80))
    # project onto head ellipsoid front
    d = (p - hc); d.y = -abs(d.y)
    t = 1 / math.sqrt((d.x / .255) ** 2 + (d.y / .235) ** 2 + (d.z / .225) ** 2)
    pos = hc + d * t
    n = Vector((pos.x / .255 ** 2, (pos.y) / .235 ** 2, (pos.z - .79) / .225 ** 2)).normalized()
    e.location = pos - n * .006
    e.rotation_mode = 'QUATERNION'; e.rotation_quaternion = Vector((0, -1, 0)).rotation_difference(n)
    parts['eye_' + side] = e
# ---- leaf stem + blade
stem_pts = [Vector((0, .005, .995)), Vector((.004, .012, 1.04)), Vector((.018, .02, 1.085))]
bm = bmesh.new(); rings = []
for i, p in enumerate(stem_pts):
    r = .02 - .004 * i
    rings.append([bm.verts.new(p + Vector((r * math.cos(a), r * math.sin(a), 0))) for a in (2 * math.pi * k / 10 for k in range(10))])
for ra, rb in zip(rings, rings[1:]):
    for k in range(10): bm.faces.new((ra[k], ra[(k + 1) % 10], rb[(k + 1) % 10], rb[k]))
bm.faces.new(rings[-1][::-1])
me = bpy.data.meshes.new('Stem'); bm.to_mesh(me); bm.free()
stem = bpy.data.objects.new('Stem', me); C.collection.objects.link(stem); parts['stem'] = stem
NU, NV, L, W = 22, 9, .25, .085
bm = bmesh.new(); grid = []
for i in range(NU + 1):
    u = i / NU; row = []
    w = W * math.sin(math.pi * min(1, u ** .85)) * (1 - .15 * u) + .004
    for j in range(NV):
        v = j / (NV - 1) * 2 - 1
        x = u * L; y = v * w
        z = .045 * math.sin(math.pi * u * .9) - .03 * u * u   # arc up then droop at the tip
        z -= .55 * abs(y) * (.35 + .65 * u) * 0.5              # V fold along the midrib
        row.append(bm.verts.new((x, y, z)))
    grid.append(row)
for i in range(NU):
    for j in range(NV - 1):
        bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
uv = bm.loops.layers.uv.new('UVMap'); col = bm.loops.layers.color.new('Col')
base, tip, rib = Vector(hexc('#56b230')), Vector(hexc('#b2ea58')), Vector(hexc('#d6f68a'))
for f in bm.faces:
    for lp in f.loops:
        u = lp.vert.co.x / L; v = abs(lp.vert.co.y) / (W + 1e-6)
        c = base.lerp(tip, min(1, u * 1.2)); c = c.lerp(rib, max(0, .5 - v * 4) * .9)
        lp[col] = (*c, 1); lp[uv].uv = (u, lp.vert.co.y / (2 * W) + .5)
me = bpy.data.meshes.new('Leaf'); bm.to_mesh(me); bm.free()
blade = bpy.data.objects.new('Leaf', me); C.collection.objects.link(blade)
sol = blade.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = .007; sol.offset = 0
blade.rotation_euler = (math.radians(-6), math.radians(-30), math.radians(-18)); blade.location = (.012, .02, 1.078)
parts['leaf'] = blade
for p in blade.data.polygons: p.use_smooth = True
for p in stem.data.polygons: p.use_smooth = True
# ---- materials + white vertex colour on everything else (so one COLOR_0 multiplier works for all)
for k, ob in parts.items():
    ob.data.materials.append(EYE if k.startswith('eye') else LEAF if k in ('leaf', 'stem') else BLUE)
    if k != 'leaf':
        ca = ob.data.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
        c = hexc('#5cb534') if k == 'stem' else (1, 1, 1)
        for d in ca.data: d.color = (*c, 1)
# subdivide the blobs once for smooth silhouettes
for k in ('body', 'head'):
    m = parts[k].modifiers.new('sub', 'SUBSURF'); m.levels = 1; m.render_levels = 1
# apply transforms/modifiers
for ob in parts.values():
    C.view_layer.objects.active = ob
    for o in C.selected_objects: o.select_set(False)
    ob.select_set(True)
    for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# UVs (smart project) for future texture work
for ob in parts.values():
    if ob.name != 'Leaf':
        C.view_layer.objects.active = ob
        for o in C.selected_objects: o.select_set(False)
        ob.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.02); bpy.ops.object.mode_set(mode='OBJECT')
# ---- armature
arm_d = bpy.data.armatures.new('HeroRig'); rig = bpy.data.objects.new('HeroRig', arm_d); C.collection.objects.link(rig)
C.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
B = {}
def bone(name, head, tail, parent=None, roll=0):
    eb = arm_d.edit_bones.new(name); eb.head = head; eb.tail = tail; eb.roll = roll
    if parent: eb.parent = B[parent]
    B[name] = eb; return eb
bone('root', (0, 0, 0), (0, 0, .1))
bone('body', (0, 0, .1), (0, 0, .5), 'root')
bone('head', (0, 0, .6), (0, 0, .95), 'body')
bone('arm.L', (.205, 0, .565), (.296, 0, .265), 'body')
bone('arm.R', (-.205, 0, .565), (-.296, 0, .265), 'body')
bone('foot.L', (.118, .03, .1), (.118, -.15, .1), 'root')
bone('foot.R', (-.118, .03, .1), (-.118, -.15, .1), 'root')
bone('eye.L', (.088, -.2, .8), (.088, -.28, .8), 'head')
bone('eye.R', (-.088, -.2, .8), (-.088, -.28, .8), 'head')
bone('leaf', (0, .005, .99), (.018, .02, 1.085), 'head')
bone('leaf.tip', (.018, .02, 1.085), (.25, .02, 1.16), 'leaf')
bpy.ops.object.mode_set(mode='OBJECT')
# ---- join meshes and weight
for o in C.selected_objects: o.select_set(False)
groups = {'body': 'body', 'head': 'head', 'foot_L': 'foot.L', 'foot_R': 'foot.R', 'arm_L': 'arm.L', 'arm_R': 'arm.R',
          'eye_L': 'eye.L', 'eye_R': 'eye.R', 'stem': 'leaf'}
for k, ob in parts.items():
    if k == 'leaf':
        gb, gt = ob.vertex_groups.new(name='leaf'), ob.vertex_groups.new(name='leaf.tip')
        for v in ob.data.vertices:
            t = max(0, min(1, (v.co.x - .03) / .16))
            gb.add([v.index], 1 - t, 'REPLACE'); gt.add([v.index], t, 'REPLACE')
    else:
        g = ob.vertex_groups.new(name=groups[k]); g.add(list(range(len(ob.data.vertices))), 1.0, 'REPLACE')
    ob.select_set(True)
C.view_layer.objects.active = parts['body']; bpy.ops.object.join()
hero = C.view_layer.objects.active; hero.name = 'Hero'; hero.data.name = 'Hero'
hero.parent = rig; md = hero.modifiers.new('rig', 'ARMATURE'); md.object = rig
# ---- animation helpers (rotations/offsets given in armature space, converted per bone)
FPS = 30; C.scene.render.fps = FPS
pb = rig.pose.bones
for p in pb: p.rotation_mode = 'QUATERNION'
def rest3(n): return rig.data.bones[n].matrix_local.to_3x3()
def key(n, f, rot=None, loc=None, scl=None):
    p = pb[n]; R = rest3(n)
    p.rotation_quaternion = (R.inverted() @ Euler([math.radians(a) for a in (rot or (0, 0, 0))]).to_matrix() @ R).to_quaternion()
    p.location = R.inverted() @ Vector(loc or (0, 0, 0))
    s = scl or (1, 1, 1)
    p.scale = [sum(abs(R[j][i]) * s[j] for j in range(3)) for i in range(3)]
    for path in ('rotation_quaternion', 'location', 'scale'): p.keyframe_insert(path, frame=f)
BONES = [b.name for b in rig.data.bones]
def clip(name, frames, fn, cyclic=True):
    act = bpy.data.actions.new(name); rig.animation_data_create(); rig.animation_data.action = act
    for f in range(0, frames + 1):
        t = f / frames
        poses = fn(t)
        for n in BONES:
            r, l, s = poses.get(n, ((0, 0, 0), (0, 0, 0), (1, 1, 1)))
            key(n, f, r, l, s)
    act.use_fake_user = True
    tr = rig.animation_data.nla_tracks.new(); tr.name = name
    st = tr.strips.new(name, 1, act); st.name = name
    rig.animation_data.action = None
    return act
S, Cc, TAU = math.sin, math.cos, math.tau
def blink(t, at, dur=.07):
    d = abs(t - at)
    return 1 - .9 * max(0, 1 - d / dur) if d < dur else 1
def idle(t):
    br = S(TAU * t)
    bk = blink(t, .72)
    return {'body': ((0, 0, 0), (0, 0, -.004 * (1 + br)), (1 + .012 * br, 1 + .012 * br, 1 - .02 * br)),
            'head': ((0, 1.5 * S(TAU * t), 2 * S(TAU * t + 1)), (0, 0, .006 * br), (1, 1, 1)),
            'arm.L': ((0, -3 - 2 * br, 0), (0, 0, 0), (1, 1, 1)), 'arm.R': ((0, 3 + 2 * br, 0), (0, 0, 0), (1, 1, 1)),
            'eye.L': ((0, 0, 0), (0, 0, 0), (1, 1, bk)), 'eye.R': ((0, 0, 0), (0, 0, 0), (1, 1, bk)),
            'leaf': ((5 * S(TAU * t + .6), 4 * S(TAU * t), 0), (0, 0, 0), (1, 1, 1)),
            'leaf.tip': ((0, 6 * S(TAU * t - .4), 0), (0, 0, 0), (1, 1, 1))}
def idle_look(t):
    p = idle((t * 2) % 1)
    yaw = 32 * (X(t, .1, .25) - X(t, .45, .6)) - 28 * (X(t, .6, .72) - X(t, .88, .98))
    tilt = 9 * (X(t, .15, .3) - X(t, .45, .55))
    p['head'] = ((0, tilt, yaw), (0, 0, 0), (1, 1, 1))
    p['body'] = ((0, 0, yaw * .2), p['body'][1], p['body'][2])
    bk = min(blink(t, .26), blink(t, .66))
    p['eye.L'] = p['eye.R'] = ((0, 0, 0), (0, 0, 0), (1, 1, bk))
    p['leaf'] = ((4, -yaw * .3, 0), (0, 0, 0), (1, 1, 1))
    return p
def X(t, a, b):
    u = max(0, min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u)
def gait(t, stride, lift, bob, lean, swing, sway, squash):
    ph = TAU * t
    fl, fr = S(ph), S(ph + math.pi)
    ll, lr = max(0, Cc(ph)) * lift, max(0, Cc(ph + math.pi)) * lift
    contact = abs(S(2 * ph))
    return {'root': ((0, 0, 0), (0, 0, 0), (1, 1, 1)),
            'body': ((lean, sway * S(ph), 4 * S(ph)), (0, 0, bob * (contact - .5)), (1 + squash * (1 - contact), 1 + squash * (1 - contact), 1 - squash * (1 - contact))),
            'head': ((-lean * .4 + 3 * S(2 * ph), 0, -3 * S(ph)), (0, 0, 0), (1, 1, 1)),
            'foot.L': ((-25 * Cc(ph) * (lift > .06), 0, 0), (0, -stride * fl, ll), (1, 1, 1)),
            'foot.R': ((-25 * Cc(ph + math.pi) * (lift > .06), 0, 0), (0, -stride * fr, lr), (1, 1, 1)),
            'arm.L': ((-swing * fr, -6, 0), (0, 0, 0), (1, 1, 1)), 'arm.R': ((-swing * fl, 6, 0), (0, 0, 0), (1, 1, 1)),
            'leaf': ((-8 - lean * .6 + 5 * S(2 * ph + 1), 0, 0), (0, 0, 0), (1, 1, 1)),
            'leaf.tip': ((0, 8 * S(2 * ph), 0), (0, 0, 0), (1, 1, 1))}
def walk(t): return gait(t, .085, .055, .03, 3, 22, 3, .03)
def run(t): return gait(t, .14, .1, .055, 13, 50, 4, .06) | {'arm.L': ((-50 * S(TAU * t + math.pi), -28, 0), (0, 0, 0), (1, 1, 1)), 'arm.R': ((-50 * S(TAU * t), 28, 0), (0, 0, 0), (1, 1, 1))}
def jump_start(t):  # anticipation squash -> launch stretch
    sq = S(math.pi * min(1, t / .6)) if t < .6 else 0; st = X(t, .55, 1)
    sy = 1 - .24 * sq + .16 * st; sx = 1 + .14 * sq - .07 * st
    return {'root': ((0, 0, 0), (0, 0, 0), (sx, sx, sy)), 'arm.L': ((0, -10 * sq - 70 * st, 0), (0, 0, 0), (1, 1, 1)),
            'arm.R': ((0, 10 * sq + 70 * st, 0), (0, 0, 0), (1, 1, 1)), 'leaf': ((-8 * sq + 18 * st, 0, 0), (0, 0, 0), (1, 1, 1)),
            'eye.L': ((0, 0, 0), (0, 0, 0), (1, 1, 1 - .5 * sq)), 'eye.R': ((0, 0, 0), (0, 0, 0), (1, 1, 1 - .5 * sq))}
def air(t):
    w = S(TAU * t)
    return {'root': ((0, 0, 0), (0, 0, 0), (.96, .96, 1.06)), 'arm.L': ((0, -75 - 6 * w, 0), (0, 0, 0), (1, 1, 1)),
            'arm.R': ((0, 75 + 6 * w, 0), (0, 0, 0), (1, 1, 1)), 'foot.L': ((-20, 0, 0), (0, .02, .06), (1, 1, 1)),
            'foot.R': ((15, 0, 0), (0, -.03, .03), (1, 1, 1)), 'leaf': ((22 + 4 * w, 0, 0), (0, 0, 0), (1, 1, 1)),
            'leaf.tip': ((0, -10 + 4 * w, 0), (0, 0, 0), (1, 1, 1)), 'head': ((-6, 0, 0), (0, 0, 0), (1, 1, 1))}
def land(t):
    sq = math.exp(-5 * t) * S(math.pi * min(1, t * 3)) if t < 1 else 0
    k = math.exp(-6 * t) * Cc(TAU * 1.5 * t)
    return {'root': ((0, 0, 0), (0, 0, 0), (1 + .18 * sq, 1 + .18 * sq, 1 - .26 * sq + .04 * k * (t > .33))),
            'arm.L': ((0, -40 * (1 - X(t, 0, .7)) + 8 * sq, 0), (0, 0, 0), (1, 1, 1)), 'arm.R': ((0, 40 * (1 - X(t, 0, .7)) - 8 * sq, 0), (0, 0, 0), (1, 1, 1)),
            'leaf': ((-25 * sq + 10 * k, 0, 0), (0, 0, 0), (1, 1, 1)), 'leaf.tip': ((0, 12 * k, 0), (0, 0, 0), (1, 1, 1)),
            'eye.L': ((0, 0, 0), (0, 0, 0), (1, 1, 1 - .6 * sq)), 'eye.R': ((0, 0, 0), (0, 0, 0), (1, 1, 1 - .6 * sq))}
def wave(t):
    up = X(t, 0, .18) - X(t, .85, 1); w = S(TAU * 3 * t) * up
    p = idle(t)
    p['arm.L'] = ((0, -150 * up - 22 * w, 0), (0, 0, 0), (1, 1, 1))
    p['body'] = ((0, 4 * up, 0), (0, 0, 0), (1, 1, 1)); p['head'] = ((0, -7 * up, 6 * up), (0, 0, 0), (1, 1, 1))
    p['leaf'] = ((0, 6 * w, 0), (0, 0, 0), (1, 1, 1))
    return p
def celebrate(t):
    hop = abs(S(TAU * 2 * t)); up = X(t, 0, .12) - X(t, .88, 1)
    sq = 1 - hop
    return {'root': ((0, 0, 0), (0, 0, .09 * hop * up), (1 + .08 * sq * up, 1 + .08 * sq * up, 1 - .1 * sq * up + .06 * hop * up)),
            'arm.L': ((0, (-140 - 15 * hop) * up, 0), (0, 0, 0), (1, 1, 1)), 'arm.R': ((0, (140 + 15 * hop) * up, 0), (0, 0, 0), (1, 1, 1)),
            'foot.L': ((-10 * hop, 0, 0), (0, 0, 0), (1, 1, 1)), 'foot.R': ((-10 * hop, 0, 0), (0, 0, 0), (1, 1, 1)),
            'leaf': ((15 * hop * up, 0, 0), (0, 0, 0), (1, 1, 1)), 'head': ((-5 * up, 0, 0), (0, 0, 0), (1, 1, 1)),
            'eye.L': ((0, 0, 0), (0, 0, 0), (1, 1, 1 - .55 * up)), 'eye.R': ((0, 0, 0), (0, 0, 0), (1, 1, 1 - .55 * up))}
clip('Idle', 60, idle); clip('IdleLook', 120, idle_look); clip('Walk', 24, walk); clip('Run', 16, run)
clip('JumpStart', 8, jump_start, False); clip('Air', 30, air); clip('Land', 14, land, False)
clip('Wave', 48, wave, False); clip('Celebrate', 40, celebrate, False)
os.makedirs(out, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'hero.blend'))
export_glb(os.path.join(out, 'hero.glb'), [hero, rig], anim=True, anim_mode='NLA_TRACKS')
print('HERO_OK', len(hero.data.vertices), 'verts', len(hero.data.polygons), 'faces', [a.name for a in bpy.data.actions])
