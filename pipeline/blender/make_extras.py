"""Life + travel + plants for Halo Isle: market stall, golf cart, hang glider, cat, songbird, tropical plants. Run: python make_extras.py <public/assets dir>"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, noise
from kit import *
OUT = sys.argv[-1]; reset(); pi = math.pi
P, V, A, F = os.path.join(OUT, 'props'), os.path.join(OUT, 'vehicles'), os.path.join(OUT, 'animals'), os.path.join(OUT, 'environment', 'foliage')

def stall(name, c1, c2):
    p = [box((2.6, 1.1, .95), (0, 0, .475), 'M_Wood', .04), box((2.8, 1.3, .1), (0, 0, 1.0), 'M_WoodDark', .03), box((2.6, .05, .5), (0, -.56, .55), c1, .0)]
    for sx in (-1.25, 1.25):
        for sy in (-.55, .55): p.append(cyl(.05, 2.5, (sx, sy, 0), 'M_White', 8))
    n = 8
    for i in range(n):
        x = (i - (n - 1) / 2) * (3.0 / n); m = c1 if i % 2 == 0 else c2
        p += [box((3.0 / n, 1.9, .05), (x, -.15, 2.62), m, 0, rot=(-.28, 0, 0)), box((3.0 / n, .04, .26), (x, -1.07, 2.25), m, 0)]
    random.seed(len(name))
    for cx, m in ((-.85, 'M_FabricOrange'), (0, 'M_Red'), (.85, 'M_Yellow')):
        p.append(box((.62, .62, .18), (cx, .0, 1.13), 'M_Wood', .02))
        for k in range(9): p.append(sphere(.1, (cx - .2 + (k % 3) * .2, -.2 + (k // 3) * .2, 1.28 + random.uniform(0, .03)), m, segs=8, rings=6))
    p.append(plane(1.3, .42, (0, -1.1, 2.72), 'M_ShopSign'))
    return finish(name, p, P)

def golf_cart():
    p = [box((1.5, 2.7, .34), (0, 0, .5), 'M_White', .1, segs=3), box((1.42, .7, .5), (0, -1.0, .8), 'M_White', .16, segs=3), box((1.3, .55, .16), (0, .25, .82), 'M_FabricBlue', .07, segs=3), box((1.3, .16, .6), (0, .56, 1.15), 'M_FabricBlue', .07, rot=(-.15, 0, 0), segs=3),
         box((1.4, 1.0, .12), (0, 1.0, .72), 'M_Wood', .03), box((1.62, 2.5, .09), (0, .05, 2.08), 'M_FabricBlue', .04), box((1.5, 2.4, .05), (0, .05, 2.14), 'M_White', .03)]
    for sx in (-.7, .7):
        for sy in (-.95, 1.15): p.append(cyl(.035, 1.42, (sx, sy, .66), 'M_Metal', 8))
        for sy in (-.95, 1.0): p += [cyl(.32, .22, (sx * 1.07 - .11 * (1 if sx > 0 else -1), sy, .32), 'M_Tyre', 18, rot=(0, pi / 2, 0)), cyl(.15, .24, (sx * 1.07 - .12 * (1 if sx > 0 else -1), sy, .32), 'M_White', 12, rot=(0, pi / 2, 0))]
        p.append(sphere(.11, (sx * .8, -1.37, .82), 'M_Lamp', (1, .5, 1), 10, 6))
    p += [tube([(-.3, -.7, 1.0), (-.3, -.5, 1.32)], .025, 'M_Metal', 6), lathe([(.17, -.02), (.2, -.02), (.2, .02), (.17, .02)], 'M_Tyre', 16), plane(.5, .3, (0, -1.36, .78), 'M_Emblem')]
    p[-2].rotation_euler = (1.1, 0, 0); p[-2].location = (-.3, -.47, 1.34)
    return finish('golf_cart', p, V)

def glider():
    bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); span, chord = 3.4, 1.9; NS = 12; rows = []
    for i in range(NS + 1):
        t = i / NS * 2 - 1; x = t * span / 2; back = abs(t) * 1.1; c = chord * (1 - abs(t) * .72); z = .12 * (1 - t * t) + abs(t) * .1
        rows.append([(bm.verts.new((x, back - .35, z + .02)), i), (bm.verts.new((x, back - .35 + c * .5, z + .09 * (1 - abs(t)))), i), (bm.verts.new((x, back - .35 + c, z)), i)])
    for a, b in zip(rows, rows[1:]):
        for j in range(2):
            f = bm.faces.new((a[j][0], b[j][0], b[j + 1][0], a[j + 1][0])); c = hexc('#3f9ff2') if (a[0][1] // 2) % 2 == 0 else hexc('#ffd23f')
            if 5 <= a[0][1] <= 6: c = hexc('#ffffff')
            for lp in f.loops: lp[col] = (*c, 1)
    wing = obj('Wing', bm, 'M_VcolCloth'); sol = wing.modifiers.new('t', 'SOLIDIFY'); sol.thickness = .02; C.view_layer.objects.active = wing; bpy.ops.object.modifier_apply(modifier='t'); wing.location.z = 1.62
    p = [wing, tube([(0, -.35, 1.66), (0, 1.5, 1.6)], .03, 'M_Metal', 6), tube([(-1.7, .75, 1.72), (0, -.35, 1.68), (1.7, .75, 1.72)], .028, 'M_Metal', 6),
         tube([(0, .25, 1.62), (-.48, .1, .78)], .022, 'M_Metal', 6), tube([(0, .25, 1.62), (.48, .1, .78)], .022, 'M_Metal', 6), tube([(-.52, .1, .78), (.52, .1, .78)], .026, 'M_NavyBlue', 8)]
    return finish('glider', p, V)

def cat():
    p = [sphere(.16, (0, 0, .2), 'M_Tint', (1, 1.75, .95), 16, 10), sphere(.135, (0, -.27, .33), 'M_Tint', (1.05, .95, .92), 16, 10), sphere(.07, (0, -.36, .29), 'M_White', (1.1, .8, .7), 10, 6), sphere(.016, (0, -.415, .305), 'M_Pink', segs=6, rings=4)]
    for sx in (-1, 1):
        p += [lathe([(.05, 0), (.0, .1)], 'M_Tint', 4, loc=(sx * .075, -.25, .43)), sphere(.02, (sx * .055, -.385, .35), 'M_Eye', (1, .5, 1.4), 8, 6)]
        for sy in (-.17, .15): p += [cyl(.036, .16, (sx * .085, sy, 0), 'M_Tint', 8), sphere(.04, (sx * .085, sy - .01, .03), 'M_White', (1, 1.2, .7), 8, 5)]
    p.append(tube([(0, .25, .24), (0, .36, .3), (.02, .42, .42), (.05, .42, .53)], .03, 'M_Tint', 8, r_end=.022))
    return finish('cat', p, A)

def bird():
    p = [sphere(.085, (0, 0, .11), 'M_Tint', (1, 1.25, 1), 14, 9), sphere(.06, (0, -.075, .2), 'M_Tint', segs=12, rings=8), sphere(.055, (0, -.02, .09), 'M_White', (1, 1.1, .9), 10, 6),
         lathe([(.02, 0), (0, .05)], 'M_Yellow', 5), prism([(-.03, 0), (.03, 0), (.04, .12), (-.04, .12)], .01, 'M_Tint', (0, .12, .1), rot=(-1.2, 0, 0), bevel=0)]
    p[3].rotation_euler = (pi / 2, 0, 0); p[3].location = (0, -.125, .195)
    for sx in (-1, 1): p += [sphere(.011, (sx * .033, -.115, .215), 'M_Eye', segs=6, rings=4), sphere(.05, (sx * .08, .01, .12), 'M_Tint', (.35, 1.3, .8), 8, 6), cyl(.006, .05, (sx * .03, 0, 0), 'M_Yellow', 4)]
    return finish('bird', p, A)

def plant_broadleaf(name, seed, n=7, L=1.1):
    random.seed(seed); bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); c0, c1 = hexc('#2f9a2a'), hexc('#9be23a')
    for k in range(n):
        az = 2 * pi * k / n + random.uniform(-.25, .25); el = random.uniform(.75, 1.25); ll = L * random.uniform(.75, 1.1); d = Vector((math.cos(az), math.sin(az), 0)); side = Vector((-d.y, d.x, 0))
        def fn(u, d=d, side=side, el=el, ll=ll):
            ang = el - u * 1.5; r = ll * (u * math.cos(el * .6) * .9); z = ll * (math.sin(el) * u - .55 * u * u); return (d * r + Vector((0, 0, z + .03)), side, Vector((-d.x * math.sin(ang), -d.y * math.sin(ang), math.cos(ang))))
        blade(ll, .2 * ll, fn, c0, c1, bm=bm, col=col, NU=10, NV=4, fold=.3)
    o = obj('Leaves', bm, 'M_Leaf'); return finish(name, [o], F)

def fern(name, seed):
    random.seed(seed); bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); c0, c1 = hexc('#2a8f2c'), hexc('#7fd03a')
    for k in range(11):
        az = 2 * pi * k / 11 + random.uniform(-.2, .2); el = random.uniform(.55, 1.1); ll = random.uniform(.55, .85); d = Vector((math.cos(az), math.sin(az), 0)); side = Vector((-d.y, d.x, 0))
        for i in range(9):                                        # pinnae pairs along the frond
            u = (i + 1) / 10; r = ll * u * .85; z = ll * (math.sin(el) * u - .6 * u * u) + .02; c = d * r + Vector((0, 0, z)); w = .16 * math.sin(pi * min(1, u * .9 + .1)) * ll
            for sgn in (-1, 1):
                a, b2, t = c, c + side * (sgn * w) + d * (w * .25) - Vector((0, 0, w * .25)), c + d * (ll * .085)
                f = bm.faces.new((bm.verts.new(a), bm.verts.new(b2), bm.verts.new(t)))
                for lp in f.loops: lp[col] = (*lerp3(c0, c1, u), 1)
    o = obj('Fern', bm, 'M_Leaf', smooth=False); return finish(name, [o], F)

def tulips(name, cols):
    p = []; random.seed(len(name) * 7); bm = bmesh.new(); col = bm.loops.layers.color.new('Col')
    for k in range(5):
        x, y, h = random.uniform(-.16, .16), random.uniform(-.16, .16), random.uniform(.26, .4); cc = hexc(cols[k % len(cols)]); cd = tuple(v * .72 for v in cc)
        p.append(tube([(x, y, 0), (x + .01, y, h * .5), (x, y, h)], .009, 'M_Grass', 5))
        for q in range(5):
            az = 2 * pi * q / 5; d = Vector((math.cos(az), math.sin(az), 0)); side = Vector((-d.y, d.x, 0))
            def fn(u, d=d, side=side, x=x, y=y, h=h): r = .035 * math.sin(u * pi * .62); return (Vector((x, y, h)) + d * r + Vector((0, 0, u * .085)), side, d)
            blade(.085, .03, fn, cd, cc, bm=bm, col=col, NU=5, NV=2, fold=-.5)
        d = Vector((math.cos(k * 2.1), math.sin(k * 2.1), 0)); side = Vector((-d.y, d.x, 0))
        def lf(u, d=d, side=side, x=x, y=y): return (Vector((x, y, 0)) + d * (u * .1) + Vector((0, 0, u * .22 - u * u * .06)), side, d * -1)
        blade(.22, .028, lf, hexc('#2f9a2a'), hexc('#6fc93a'), bm=bm, col=col, NU=5, NV=2, fold=.2)
    p.append(obj('Tulips', bm, 'M_Leaf')); return finish(name, p, F)

stall('stall_fruit', 'M_FabricOrange', 'M_FabricWhite'); stall('stall_tint', 'M_FabricPink', 'M_FabricWhite'); stall('stall_hats', 'M_FabricBlue', 'M_FabricWhite')
golf_cart(); glider(); cat(); bird()
plant_broadleaf('plant_broadleaf_a', 1); plant_broadleaf('plant_broadleaf_b', 6, 9, 1.5); fern('fern_a', 2); tulips('tulips_red', ['#f0483e', '#ff7a5c']); tulips('tulips_mix', ['#ffd23f', '#ff8fb5', '#ffffff', '#b79bff'])
