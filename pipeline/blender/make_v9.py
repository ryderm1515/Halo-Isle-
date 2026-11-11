"""Halo Isle v0.9 models: island animals in the same soft, rounded jelly-toy style as the islanders (cat, songbird, gull, crab),
a shorter market stall, a moulded golf cart, a jet ski, golf range props and things to pick up.
Animals export as several named parts (body / head / tail / wingL / wingR / clawL / clawR) so the game can animate them.
Run: python make_v9.py <public/assets dir>.  Front faces -Y in Blender (= +Z in three.js)."""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from kit import *
OUT = sys.argv[-1]; reset(); pi = math.pi
P, V, A = os.path.join(OUT, 'props'), os.path.join(OUT, 'vehicles'), os.path.join(OUT, 'animals')

def fuse(parts, mat, voxel=.012, smooth=4, tris=2600, name='Fused'):
    """Join overlapping primitives into one soft moulded surface (voxel remesh + smooth + decimate)."""
    for o in parts: apply(o)
    for x in C.scene.objects: x.select_set(x in parts)
    C.view_layer.objects.active = parts[0]
    if len(parts) > 1: bpy.ops.object.join()
    o = C.view_layer.objects.active; o.name = name
    m = o.modifiers.new('f', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.use_smooth_shade = True; bpy.ops.object.modifier_apply(modifier='f')
    if smooth: m = o.modifiers.new('s', 'SMOOTH'); m.factor = .5; m.iterations = smooth; bpy.ops.object.modifier_apply(modifier='s')
    n = sum(len(p.vertices) - 2 for p in o.data.polygons)
    if n > tris: m = o.modifiers.new('d', 'DECIMATE'); m.ratio = tris / n; bpy.ops.object.modifier_apply(modifier='d')
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.clear(); o.data.materials.append(M(mat)); return o

def finish_parts(name, parts, out_dir, uv_scale=.5):
    """parts: {part_name: (objects, pivot)} -> one GLB with a root empty and one mesh per part, origin at its pivot."""
    root = bpy.data.objects.new(name, None); C.collection.objects.link(root); made = []; tris = 0
    for pn, (objs, pivot) in parts.items():
        for o in objs:
            apply(o)
            if not o.get('keep_uv'): box_uv(o, uv_scale)
        for x in C.scene.objects: x.select_set(x in objs)
        C.view_layer.objects.active = objs[0]
        if len(objs) > 1: bpy.ops.object.join()
        o = C.view_layer.objects.active; o.name = pn; o.data.name = name + '_' + pn
        pv = Vector(pivot)
        for v in o.data.vertices: v.co -= pv
        o.location = pv; o.parent = root; made.append(o); tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
    os.makedirs(out_dir, exist_ok=True); export_glb(os.path.join(out_dir, name + '.glb'), [root] + made); print('ASSET', name, 'tris', tris)
    for o in made + [root]: bpy.data.objects.remove(o, do_unlink=True)

def eye(x, y, z, r=.024, tilt=0):
    """Tall glossy oval eye, like the islanders'."""
    return sphere(r, (x, y, z), 'M_Eye', (.72, .42, 1.4), 12, 8)

# ------------------------------------------------------------------ cat: big round head, bean body, stub legs, plump tail
def cat():
    body = fuse([sphere(.125, (0, .03, .165), 'M_Tint', (1, 1.5, .95), 20, 12), sphere(.1, (0, -.09, .19), 'M_Tint', (1, 1, 1), 16, 10)] +
                [sphere(.048, (sx * .07, sy, .065), 'M_Tint', (1, 1.05, 1.5), 12, 8) for sx in (-1, 1) for sy in (-.11, .14)], 'M_Tint', .01, 4, 2200)
    paws = [sphere(.043, (sx * .07, sy - .012, .026), 'M_White', (1, 1.25, .62), 10, 6) for sx in (-1, 1) for sy in (-.11, .14)]
    bib = sphere(.075, (0, -.125, .16), 'M_White', (.95, .6, 1.05), 12, 8)
    hc = Vector((0, -.2, .365))
    ears = []
    for sx in (-1, 1):
        e = lathe([(.062, 0), (.05, .045), (.022, .09), (0, .105)], 'M_Tint', 12); e.rotation_euler = (.12, sx * .32, 0); e.location = (sx * .095, -.185, .455); ears.append(e)
    head = fuse([sphere(.158, tuple(hc), 'M_Tint', (1.1, .95, .9), 24, 14), sphere(.07, (-.085, -.27, .33), 'M_Tint', (1, .8, .8), 12, 8), sphere(.07, (.085, -.27, .33), 'M_Tint', (1, .8, .8), 12, 8)] + ears, 'M_Tint', .01, 4, 2600)
    face = [eye(sx * .062, -.336, .385, .027) for sx in (-1, 1)] + [sphere(.05, (0, -.33, .325), 'M_White', (1.25, .55, .72), 12, 8), sphere(.014, (0, -.362, .343), 'M_Pink', (1.2, .8, .8), 8, 5)]
    inner = []
    for sx in (-1, 1):
        e = lathe([(.036, 0), (.012, .06), (0, .07)], 'M_Pink', 8); e.rotation_euler = (.12, sx * .32, 0); e.location = (sx * .093, -.2, .462); e.scale = (1, .5, 1); inner.append(e)
    tail = [tube([(0, .19, .2), (0, .27, .25), (.015, .32, .34), (.03, .32, .44)], .034, 'M_Tint', 10, r_end=.04), sphere(.045, (.032, .32, .455), 'M_White', segs=12, rings=8)]
    finish_parts('cat', {'body': ([body, bib] + paws, (0, 0, 0)), 'head': ([head] + face + inner, (0, -.14, .29)), 'tail': (tail, (0, .19, .2))}, A)

# ------------------------------------------------------------------ round little birds (songbird + gull share the build)
def bird(name, s=1.0, wing=1.0, beak='M_FabricOrange', belly=True, long_beak=False):
    body = fuse([sphere(.088, (0, .01, .1), 'M_Tint', (1, 1.2, 1), 18, 12), sphere(.074, (0, -.055, .185), 'M_Tint', (1, 1, .98), 16, 10), sphere(.04, (0, .1, .1), 'M_Tint', (.9, 1.3, .6), 10, 6)], 'M_Tint', .007, 4, 2200)
    extra = [eye(sx * .036, -.118, .2, .0135) for sx in (-1, 1)]
    bk = lathe([(.024, 0), (.014, .03 if not long_beak else .05), (0, .05 if not long_beak else .085)], beak, 10); bk.rotation_euler = (pi / 2 + .12, 0, 0); bk.location = (0, -.12, .172); extra.append(bk)
    if belly: extra.append(sphere(.066, (0, -.03, .085), 'M_White', (1, 1.05, .9), 12, 8))
    for sx in (-1, 1):
        extra += [cyl(.007, .05, (sx * .03, .01, 0), beak, 5), sphere(.016, (sx * .03, -.006, .006), beak, (1.2, 1.7, .5), 6, 4), sphere(.012, (sx * .052, -.1, .168), 'M_Pink', (.5, .5, 1), 6, 4)]
    tail = prism([(-.028, 0), (.028, 0), (.045, .11), (0, .125), (-.045, .11)], .012, 'M_Tint', (0, .1, .115), rot=(-1.25, 0, 0), bevel=.004)
    parts = {'body': ([body, tail] + extra, (0, 0, 0))}
    for n, sx in (('wingL', 1), ('wingR', -1)):
        w = sphere(.058, (sx * (.082 + .03 * wing), .02, .118), 'M_Tint', (.9 * wing, 1.25, .3), 12, 8); tip = sphere(.03, (sx * (.082 + .075 * wing), .05, .115), 'M_White' if not belly else 'M_Tint', (.9 * wing, 1.3, .25), 8, 6)
        parts[n] = ([w, tip], (sx * .075, .0, .13))
    if s != 1:
        for objs, _ in parts.values():
            for o in objs: apply(o); o.scale = (s, s, s); apply(o)
        parts = {k: (v[0], tuple(c * s for c in v[1])) for k, v in parts.items()}
    finish_parts(name, parts, A)

# ------------------------------------------------------------------ beach crab: dome shell, eye stalks, two waving claws
def crab():
    shell = fuse([sphere(.11, (0, 0, .085), 'M_Tint', (1.35, 1, .62), 18, 12), sphere(.05, (-.1, -.02, .075), 'M_Tint', segs=10, rings=8), sphere(.05, (.1, -.02, .075), 'M_Tint', segs=10, rings=8)], 'M_Tint', .008, 3, 1800)
    ex = [sphere(.06, (0, -.03, .06), 'M_White', (1.6, .9, .5), 12, 8)]
    for sx in (-1, 1):
        ex += [cyl(.011, .06, (sx * .045, -.07, .12), 'M_Tint', 6), sphere(.024, (sx * .045, -.072, .19), 'M_White', segs=10, rings=8), eye(sx * .045, -.092, .192, .012)]
        for k in range(3):
            a = .5 + k * .55; ex.append(tube([(sx * .12, .02 + k * .03, .07), (sx * (.19 + .01 * k), .03 + k * .05, .09), (sx * (.22 + .01 * k), .04 + k * .06, 0)], .013, 'M_Tint', 6, r_end=.006))
    parts = {'body': ([shell] + ex, (0, 0, 0))}
    for n, sx in (('clawL', 1), ('clawR', -1)):
        parts[n] = ([tube([(sx * .12, -.06, .08), (sx * .17, -.12, .1)], .016, 'M_Tint', 6), sphere(.042, (sx * .19, -.15, .11), 'M_Tint', (.85, 1.25, .8), 10, 8), sphere(.022, (sx * .2, -.19, .125), 'M_Tint', (.6, 1.4, .5), 8, 6)], (sx * .12, -.06, .08))
    finish_parts('crab', parts, A)

# ------------------------------------------------------------------ market stall v2: counter at islander height, scalloped striped awning
def stall(name, c1, c2):
    p = [box((2.3, .95, .56), (0, 0, .28), 'M_Wood', .035), box((2.5, 1.15, .08), (0, 0, .6), 'M_WoodDark', .03), box((2.34, .04, .34), (0, -.49, .3), c1, .012), box((2.5, .06, .06), (0, -.5, .52), 'M_White', .02), box((2.5, .06, .06), (0, -.5, .08), 'M_White', .02)]
    for sx in (-1.14, 1.14):
        for sy in (-.47, .47): p += [cyl(.045, 1.72, (sx, sy, 0), 'M_Wood', 10), sphere(.06, (sx, sy, 1.74), 'M_White', segs=10, rings=8)]
    n = 10; W = 2.7
    for i in range(n):
        x = (i - (n - 1) / 2) * (W / n); m = c1 if i % 2 == 0 else c2
        p.append(box((W / n + .002, 1.62, .045), (x, -.12, 1.82), m, .0, rot=(-.3, 0, 0)))
        sc = lathe([(W / n / 2, 0), (W / n / 2, -.1), (W / n / 2 * .8, -.17), (0, -.2)], m, 10); sc.scale = (1, .12, 1); sc.location = (x, -.9, 1.62); p.append(sc)
    p += [box((W, .05, .05), (0, -.88, 1.6), 'M_White', .015), box((W, .05, .05), (0, .65, 2.05), 'M_White', .015)]
    random.seed(len(name) * 3)
    for cx, m in ((-.74, 'M_FabricOrange'), (0, 'M_Red'), (.74, 'M_Yellow')):
        p.append(box((.6, .56, .16), (cx, -.02, .74), 'M_Wood', .02, rot=(.22, 0, 0)))
        for k in range(12):
            r, c = k // 4, k % 4; p.append(sphere(.078, (cx - .21 + c * .14 + (r % 2) * .03, -.2 + r * .15, .85 + r * .035 + random.uniform(0, .015)), m, (1, 1, .92), 10, 7))
    p += [plane(1.1, .36, (0, -.93, 1.98), 'M_ShopSign'), box((.05, .04, .34), (-.4, -.9, 1.85), 'M_Wood', .01), box((.05, .04, .34), (.4, -.9, 1.85), 'M_Wood', .01)]
    # a little hanging lantern and a coin jar make it feel tended
    p += [cyl(.006, .22, (.95, -.6, 1.42), 'M_Black', 4), sphere(.07, (.95, -.6, 1.36), 'M_Lamp', (1, 1, 1.2), 10, 8), lathe([(.06, 0), (.07, .05), (.07, .13), (.045, .15), (.05, .17)], 'M_Glass', 12, loc=(-.98, -.3, .64)), cyl(.05, .035, (-.98, -.3, .65), 'M_Yellow', 10)]
    return finish(name, p, P)

# ------------------------------------------------------------------ golf cart v2: one moulded body, proper seats, windshield, bag on the back
def wheel(x, y, r=.27, w=.2):
    side = 1 if x > 0 else -1
    t = lathe([(r * .62, -w / 2), (r * .93, -w / 2), (r, -w * .3), (r, w * .3), (r * .93, w / 2), (r * .62, w / 2)], 'M_Tyre', 20); t.rotation_euler = (0, pi / 2, 0); t.location = (x, y, r)
    h = lathe([(0, w * .5), (r * .5, w * .52), (r * .64, w * .38), (r * .64, -w * .4), (0, -w * .4)], 'M_White', 16); h.rotation_euler = (0, side * pi / 2, 0); h.location = (x, y, r)
    c = sphere(r * .2, (x + side * w * .5, y, r), 'M_FabricBlue', (.5, 1, 1), 10, 6); return [t, h, c]
def golf_cart():
    body = fuse([box((1.34, 2.5, .3), (0, 0, .5), 'M_White', .12, segs=4), box((1.3, .78, .46), (0, -.92, .68), 'M_White', .2, segs=5), box((1.34, .95, .34), (0, .78, .62), 'M_White', .12, segs=4)] +
                [sphere(.36, (sx * .58, sy, .34), 'M_White', (.55, 1.05, .9), 16, 10) for sx in (-1, 1) for sy in (-.88, .86)], 'M_White', .022, 5, 5200)
    p = [body, box((1.22, .1, .07), (0, -1.38, .36), 'M_Metal', .03, segs=3), box((1.22, .1, .07), (0, 1.33, .36), 'M_Metal', .03, segs=3), box((1.0, .5, .012), (0, -.6, .46), 'M_Black', 0)]
    for sx in (-.32, .32): p += [box((.56, .52, .15), (sx, .2, .78), 'M_FabricBlue', .07, segs=4), box((.56, .15, .46), (sx, .5, 1.06), 'M_FabricBlue', .07, rot=(-.18, 0, 0), segs=4)]
    p += [box((1.24, .1, .5), (0, .56, .98), 'M_White', .04, rot=(-.18, 0, 0)), box((1.56, 2.2, .08), (0, .02, 1.88), 'M_White', .04, segs=3), box((1.6, 2.24, .05), (0, .02, 1.84), 'M_FabricBlue', .025, segs=3)]
    for sx in (-.66, .66):
        p += [tube([(sx, -.86, .86), (sx, -.98, 1.86)], .03, 'M_Metal', 8), tube([(sx, .98, .74), (sx, 1.02, 1.86)], .03, 'M_Metal', 8), sphere(.1, (sx * .78, -1.3, .7), 'M_Lamp', (1, .45, .9), 12, 8), sphere(.05, (sx * .8, 1.3, .66), 'M_Red', (1, .4, 1), 8, 6)]
        p += wheel(sx * 1.02, -.88) + wheel(sx * 1.02, .86)
    p += [plane(1.26, .92, (0, -.92, 1.37), 'M_Glass', rot=(-.12, 0, 0)), tube([(-.3, -.72, .9), (-.3, -.42, 1.2)], .024, 'M_Metal', 6), plane(.46, .26, (0, -1.335, .58), 'M_Emblem')]
    sw = lathe([(.15, -.018), (.185, -.018), (.185, .018), (.15, .018)], 'M_Black', 18); sw.rotation_euler = (1.0, 0, 0); sw.location = (-.3, -.4, 1.22); p.append(sw)
    # golf bag strapped to the back deck
    p += [lathe([(.14, 0), (.16, .04), (.15, .62), (.17, .7), (.15, .72)], 'M_FabricBlue', 14, loc=(.3, .98, .78)), lathe([(.14, 0), (.16, .04), (.15, .62), (.17, .7), (.15, .72)], 'M_FabricRed', 14, loc=(-.3, .98, .78))]
    for bx in (.3, -.3):
        for k in range(3): p += [cyl(.012, .34, (bx - .06 + k * .06, .96 + (k % 2) * .05, 1.46), 'M_Metal', 5), sphere(.04, (bx - .06 + k * .06, .93 + (k % 2) * .05, 1.82), 'M_Grey', (.7, 1.4, .9), 8, 6)]
    return finish('golf_cart', p, V)

# ------------------------------------------------------------------ jet ski: moulded hull with a blue saddle and a mascot badge
def jetski():
    hull = fuse([sphere(.5, (0, 0, .32), 'M_White', (1.05, 2.9, .62), 28, 16), sphere(.36, (0, -.72, .5), 'M_White', (1.1, 1.9, .75), 20, 12), box((.78, 1.3, .3), (0, .78, .34), 'M_White', .13, segs=4)], 'M_White', .02, 5, 5000)
    # flatten the keel so it sits in the water
    for v in hull.data.vertices:
        if v.co.z < .12: v.co.z = .12 - (.12 - v.co.z) * .35
    p = [hull, box((.46, 1.05, .2), (0, .42, .62), 'M_FabricBlue', .09, segs=4), box((.42, .5, .16), (0, -.12, .7), 'M_FabricBlue', .07, rot=(.25, 0, 0), segs=4),
         sphere(.3, (0, -.62, .7), 'M_FabricBlue', (1.05, 1.5, .5), 16, 10), tube([(0, -.5, .78), (0, -.42, 1.0)], .035, 'M_Black', 8), tube([(-.34, -.36, 1.02), (0, -.42, 1.0), (.34, -.36, 1.02)], .024, 'M_Metal', 8),
         plane(.5, .22, (0, -.98, .72), 'M_Emblem', rot=(-1.1, 0, 0)), box((1.02, 2.6, .05), (0, .1, .3), 'M_FabricBlue', .02, segs=2)]
    for sx in (-.34, .34): p += [cyl(.03, .12, (sx, -.36, 1.02), 'M_Black', 8, rot=(0, pi / 2, 0)), sphere(.05, (sx * .5, -1.38, .5), 'M_Lamp', (1, .5, .8), 8, 6)]
    return finish('jetski', p, V)

# ------------------------------------------------------------------ golf range bits
def golf_tee():
    p = [box((1.5, 2.0, .05), (0, 0, .025), 'M_FabricGreen', .012), box((1.56, 2.06, .03), (0, 0, .012), 'M_White', .01), cyl(.012, .05, (0, -.3, .05), 'M_White', 6),
         lathe([(.14, 0), (.19, .02), (.21, .26), (.2, .28), (.18, .26), (.16, .03)], 'M_Wood', 14, loc=(.55, .5, .05)), box((.08, .08, .9), (-.72, .9, .45), 'M_Wood', .02), plane(.6, .34, (-.44, .87, .86), 'M_ShopSign')]
    random.seed(4)
    for k in range(14): p.append(sphere(.035, (.55 + random.uniform(-.1, .1), .5 + random.uniform(-.1, .1), .2 + random.uniform(0, .1)), 'M_White', segs=8, rings=6))
    return finish('golf_tee', p, P)
def golf_flag():
    p = [cyl(.016, 2.1, (0, 0, 0), 'M_White', 8), prism([(0, 0), (.55, .16), (0, .32)], .012, 'M_FabricRed', (0.02, 0, 1.76), bevel=0), cyl(.16, .02, (0, 0, -.005), 'M_Black', 16), sphere(.03, (0, 0, 2.1), 'M_Yellow', segs=8, rings=6)]
    return finish('golf_flag', p, P)
def golf_club():
    p = [cyl(.012, .82, (0, 0, .06), 'M_Metal', 6), cyl(.018, .24, (0, 0, .68), 'M_Black', 8), sphere(.06, (0, -.05, .04), 'M_Grey', (.6, 1.3, .8), 10, 8)]
    return finish('golf_club', p, P)

# ------------------------------------------------------------------ things to pick up
def seashell():
    bm = bmesh.new(); n, m = 18, 8; rows = []
    for j in range(m + 1):
        v = j / m; row = []
        for i in range(n + 1):
            a = -1.15 + 2.3 * i / n; r = .16 * (v ** .7) * (1 + .09 * math.cos(i * pi)); row.append(bm.verts.new((math.sin(a) * r, -math.cos(a) * r + .02, .012 + .07 * math.sin(v * pi) * (1 - .3 * abs(a)))))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for i in range(n): bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    o = obj('Shell', bm, 'M_Pink'); s = o.modifiers.new('t', 'SOLIDIFY'); s.thickness = .014; C.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='t')
    return finish('seashell', [o], P, .5)
def starfish():
    pts = []
    for i in range(10): a = i / 10 * 2 * pi + pi / 2; r = .17 if i % 2 == 0 else .07; pts.append((math.cos(a) * r, math.sin(a) * r))
    o = prism(pts, .05, 'M_FabricOrange', bevel=.022); o.rotation_euler = (pi / 2, 0, 0); o.location = (0, 0, .03)
    return finish('starfish', [o], P)
def coconut():
    p = [sphere(.13, (0, 0, .12), 'M_WoodDark', (1, 1, .95), 14, 10), sphere(.02, (.03, -.115, .16), 'M_Black', segs=6, rings=4), sphere(.02, (-.035, -.115, .15), 'M_Black', segs=6, rings=4), sphere(.02, (0, -.12, .11), 'M_Black', segs=6, rings=4)]
    return finish('coconut', p, P)
def mango():
    b = fuse([sphere(.085, (0, 0, .09), 'M_FabricOrange', (1, .9, 1.15), 14, 10), sphere(.06, (.03, 0, .13), 'M_FabricOrange', segs=10, rings=8)], 'M_FabricOrange', .008, 3, 900)
    p = [b, cyl(.008, .03, (.03, 0, .18), 'M_WoodDark', 5), sphere(.04, (.07, 0, .21), 'M_FabricGreen', (1.6, .7, .25), 8, 6)]
    return finish('mango', p, P)
def lantern():
    p = [lathe([(.07, 0), (.085, .015), (.085, .03), (.06, .04)], 'M_Navy', 12), lathe([(.058, .04), (.07, .1), (.058, .19)], 'M_Lamp', 12), lathe([(.065, .19), (.085, .2), (.03, .25), (0, .26)], 'M_Navy', 12), tube([(-.06, 0, .2), (-.05, 0, .31), (0, 0, .34), (.05, 0, .31), (.06, 0, .2)], .006, 'M_Navy', 5)]
    return finish('lantern', p, P)

cat(); bird('bird'); bird('gull', 1.7, 1.5, 'M_Yellow', False, True); crab()
stall('stall_fruit', 'M_FabricOrange', 'M_FabricWhite'); stall('stall_tint', 'M_FabricPink', 'M_FabricWhite'); stall('stall_hats', 'M_FabricBlue', 'M_FabricWhite')
golf_cart(); jetski(); golf_tee(); golf_flag(); golf_club(); seashell(); starfish(); coconut(); mango(); lantern()
