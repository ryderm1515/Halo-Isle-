"""Town plaza kit for Halo Isle, modelled from the plaza key art + asset sheets. Run: python make_plaza.py <public/assets dir>"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, noise
from kit import *
OUT = sys.argv[-1]; reset(); pi = math.pi
P, S = os.path.join(OUT, 'props'), os.path.join(OUT, 'structures')
F = os.path.join(OUT, 'environment', 'foliage'); R = os.path.join(OUT, 'environment', 'rocks')

def lamp_post():
    p = [lathe(smooth_profile([(0, 0), (.26, 0), (.27, .1), (.19, .2), (.13, .46), (.1, .72), (.08, .95), (.075, 1.0)], 4), 'M_Navy', 20)]
    p += [cyl(.068, 2.75, (0, 0, 1.0), 'M_Navy', 16), lathe([(.068, 3.7), (.12, 3.74), (.13, 3.8), (.09, 3.86), (.16, 3.95), (.2, 4.02), (.0, 4.02)], 'M_Navy', 20)]
    p += [lathe([(.068, 1.0), (.1, 1.03), (.1, 1.09), (.068, 1.12)], 'M_Navy', 16), lathe([(.068, 3.3), (.1, 3.33), (.1, 3.39), (.068, 3.42)], 'M_Navy', 16)]
    p += [sphere(.34, (0, 0, 4.3), 'M_Lamp', (1, 1, .96)), lathe([(.12, 4.6), (.1, 4.66), (.03, 4.7), (0, 4.76)], 'M_Navy', 14)]
    for z in (3.45, 2.05): p.append(tube([(0, 0, z), (.86, 0, z)], .028, 'M_Navy', 8)); p.append(sphere(.05, (.88, 0, z), 'M_Navy', segs=10, rings=6))
    p.append(plane(.68, 1.3, (.5, 0, 2.75), 'M_Banner', nx=4, ny=6, fn=lambda u, v: Vector((0, .03 * math.sin(u * 5 + v * 3) * (1 - v), 0))))
    return finish('lamp_post', p, P)

def bench():
    p = []
    for i in range(4): p.append(box((1.9, .125, .05), (0, -.24 + i * .15, .5), 'M_Wood', .012))
    for i in range(3): p.append(box((1.9, .05, .13), (0, .3 + i * .035, .68 + i * .155), 'M_Wood', .012, rot=(-.2, 0, 0)))
    for sx in (-.78, .78):
        p += [box((.09, .62, .09), (sx, 0, .42), 'M_Grey', .02), box((.09, .1, .46), (sx, -.24, .21), 'M_Grey', .02), box((.09, .1, 1.05), (sx, .3, .52), 'M_Grey', .02, rot=(-.12, 0, 0)),
              box((.07, .5, .06), (sx, -.02, .66), 'M_Wood', .015), box((.07, .07, .2), (sx, -.24, .55), 'M_Grey', .015)]
    return finish('bench', p, P)

def signpost():
    p = [cyl(.075, 2.75, (0, 0, 0), 'M_Wood', 14), sphere(.11, (0, 0, 2.78), 'M_Wood', (1, 1, .8), 12, 8), lathe([(.2, 0), (.2, .08), (.1, .16), (.075, .2)], 'M_Stone', 14)]
    arrow = [(-.62, -.19), (.4, -.19), (.68, 0), (.4, .19), (-.62, .19)]
    for i, (m, z, rz) in enumerate((('M_SignA', 2.35, .12), ('M_SignB', 1.9, pi - .18), ('M_SignC', 1.45, .3))):
        p.append(prism(arrow, .06, m, (.0, -.09, z), (0, 0, 0))); apply(p[-1]); p[-1].data.transform(Matrix.Translation((.22, 0, 0))); p[-1].data.transform(Matrix.Rotation(rz, 4, 'Z'))
    return finish('signpost', p, P)

def notice_board():
    p = [box((.11, .11, 2.2), (-.85, 0, 1.1), 'M_Wood', .02), box((.11, .11, 2.2), (.85, 0, 1.1), 'M_Wood', .02), box((1.62, .07, 1.1), (0, 0, 1.45), 'M_Wood', .02),
         plane(1.4, .9, (0, -.045, 1.45), 'M_Board'), box((2.2, .75, .06), (0, -.3, 2.36), 'M_WoodDark', .02, rot=(.5, 0, 0)), box((2.2, .75, .06), (0, .3, 2.36), 'M_WoodDark', .02, rot=(-.5, 0, 0)),
         box((2.25, .08, .08), (0, 0, 2.54), 'M_WoodDark', .02)]
    return finish('notice_board', p, P)

def fountain():
    p = [lathe(smooth_profile([(4.3, 0), (4.5, 0), (4.56, .12), (4.5, .5), (4.52, .66), (4.4, .78), (4.05, .78), (3.96, .68), (3.94, .3), (3.9, .22), (0, .22)], 3), 'M_Marble', 64)]
    p.append(lathe([(0, .6), (3.95, .6)], 'M_Water', 48))
    p.append(lathe(smooth_profile([(1.5, .22), (1.75, .5), (2.3, .98), (2.42, 1.16), (2.3, 1.26), (2.05, 1.26), (2.0, 1.16), (0, 1.1)], 3), 'M_Marble', 48))
    p.append(lathe([(0, 1.2), (2.02, 1.2)], 'M_Water', 40))
    p.append(lathe(smooth_profile([(1.2, 1.1), (1.25, 1.4), (1.45, 1.52), (1.4, 1.62), (0, 1.62)], 3), 'M_Marble', 40))
    p.append(lathe(smooth_profile([(1.1, 1.62), (1.05, 1.9), (1.25, 2.0), (1.2, 2.14), (0, 2.14)], 3), 'M_Marble', 40))      # plinth for the hero statue
    return finish('fountain', p, S)

def town_hall():
    R = 9.0; p = []
    p.append(lathe([(R + 2.6, 0), (R + 2.6, .2), (R + 2.1, .2), (R + 2.1, .4), (R + 1.6, .4), (R + 1.6, .6), (R + 1.1, .6), (R + 1.1, .8), (0, .8)], 'M_Marble', 64, smooth=False))
    p.append(cyl(R, 1.0, (0, 0, .8), 'M_Plaster', 64)); p.append(cyl(R - .12, 3.4, (0, 0, 1.8), 'M_GlassBlue', 64, cap=False))
    p.append(cyl(R - .9, 3.4, (0, 0, 1.8), 'M_PlasterBlue', 48))      # inner core you glimpse through the glass
    for z in (1.8, 3.5, 5.2): p.append(lathe([(R - .2, z - .07), (R + .06, z - .07), (R + .06, z + .07), (R - .2, z + .07)], 'M_White', 64))
    def col(a, i):
        if abs(((a + pi / 2 + pi) % (2 * pi)) - pi) < .2: return []           # leave the entrance bay open
        return [cyl(.36, 4.5, (0, 0, .8), 'M_Marble', 16), lathe([(.5, .8), (.5, .95), (.4, 1.05), (.36, 1.1)], 'M_Marble', 16), lathe([(.36, 5.0), (.44, 5.1), (.52, 5.2), (.52, 5.32)], 'M_Marble', 16),
                box((.07, .07, 3.4), (-.42, 0, 3.5), 'M_White', .0)]
    p += ring(18, R + .42, col, start=pi / 18)
    p.append(lathe(smooth_profile([(R - .3, 5.2), (R + 1.0, 5.25), (R + 1.05, 5.75), (R + .8, 5.95), (R + .2, 6.0), (0, 6.0)], 2), 'M_Marble', 64))
    p.append(cyl(R - 1.3, 1.25, (0, 0, 6.0), 'M_Plaster', 64)); p.append(lathe([(R - 1.28, 6.2), (R - 1.24, 6.2), (R - 1.24, 7.05), (R - 1.28, 7.05)], 'M_BandBlue', 64))
    p.append(lathe([(R - 1.5, 7.25), (R - 1.05, 7.25), (R - 1.0, 7.5), (R - 1.4, 7.6), (0, 7.6)], 'M_Marble', 64))
    D = R - 1.55; p.append(lathe([(D * math.cos(t), 7.55 + D * .93 * math.sin(t)) for t in [x / 14 * pi / 2 for x in range(15)]], 'M_Glass', 48))
    for i in range(16):
        a = 2 * pi * i / 16; p.append(tube([(D * math.cos(t) * math.cos(a), D * math.cos(t) * math.sin(a), 7.55 + D * .93 * math.sin(t)) for t in [x / 12 * pi / 2 for x in range(13)]], .075, 'M_White', 6))
    for t in (.36, .78, 1.15): p.append(lathe([(D * math.cos(t) - .06, 7.55 + D * .93 * math.sin(t) - .05), (D * math.cos(t) + .08, 7.55 + D * .93 * math.sin(t)), (D * math.cos(t) - .06, 7.55 + D * .93 * math.sin(t) + .05)], 'M_White', 48))
    p += [lathe([(.9, 7.55 + D * .93 - .1), (.95, 7.55 + D * .93 + .15), (.5, 7.55 + D * .93 + .4), (0, 7.55 + D * .93 + .45)], 'M_White', 20), sphere(.3, (0, 0, 7.55 + D * .93 + .75), 'M_Lamp')]
    # entrance portico (faces -Y)
    p += [box((5.6, 2.2, .35), (0, -R - .3, 5.0), 'M_Marble', .06), box((.6, .6, 4.2), (-2.4, -R - 1.0, 2.9), 'M_Marble', .08), box((.6, .6, 4.2), (2.4, -R - 1.0, 2.9), 'M_Marble', .08),
          box((4.2, .14, 3.5), (0, -R + .1, 2.55), 'M_GlassBlue', .0), box((.12, .2, 3.5), (0, -R + .02, 2.55), 'M_White', .0), box((4.4, .22, .14), (0, -R + .02, 4.3), 'M_White', .0), box((4.4, .22, .14), (0, -R + .02, 3.3), 'M_White', .0),
          plane(3.4, 1.15, (0, -R - 1.42, 4.98), 'M_Emblem')]
    for sx in (-1, 1): p.append(box((.1, .2, 3.5), (sx * 2.1, -R + .02, 2.55), 'M_White', .0))
    return finish('town_hall', p, S)

def shop(name, wall, aw1, aw2, w=9.0, floors=2, roof='flat'):
    d, fh = 7.0, 3.3; H = floors * fh + .4; p = [box((w, d, H), (0, 0, H / 2), wall, .12), box((w + .7, d + .7, .32), (0, 0, H + .1), 'M_White', .08), box((w + .3, d + .3, .25), (0, 0, fh + .12), 'M_White', .06)]
    p.append(box((w + .2, d + .2, .5), (0, 0, .25), 'M_Stone', .05))
    n = 3; bw = (w - 1.2) / n
    for i in range(n):
        x = (i - (n - 1) / 2) * bw
        if i == 1: p += [box((1.7, .16, 2.5), (x, -d / 2, 1.65), 'M_GlassBlue', .0), box((1.9, .2, .12), (x, -d / 2 - .02, 2.95), 'M_White', .02), box((.1, .2, 2.5), (x, -d / 2 - .02, 1.65), 'M_White', 0)]
        else: p += [box((bw - .7, .16, 1.8), (x, -d / 2, 1.9), 'M_GlassBlue', .0), box((bw - .5, .26, .12), (x, -d / 2 - .03, .98), 'M_White', .02), box((bw - .5, .2, .1), (x, -d / 2 - .02, 2.83), 'M_White', .02), box((.08, .2, 1.8), (x, -d / 2 - .02, 1.9), 'M_White', 0)]
    ns = 10; sw = (w + .4) / ns                                                    # striped awning with a scalloped valance
    for i in range(ns):
        x = (i - (ns - 1) / 2) * sw; m = aw1 if i % 2 == 0 else aw2
        p += [box((sw, 1.9, .06), (x, -d / 2 - .85, 3.02), m, .0, rot=(-.33, 0, 0)), box((sw, .05, .34), (x, -d / 2 - 1.74, 2.58), m, .0)]
    for f in range(1, floors):
        z = f * fh
        for i in range(n):
            x = (i - (n - 1) / 2) * bw; p += [box((bw - 1.2, .16, 1.7), (x, -d / 2, z + 1.75), 'M_GlassBlue', 0), box((bw - 1.0, .24, .1), (x, -d / 2 - .03, z + .88), 'M_White', .02), box((bw - 1.0, .22, .1), (x, -d / 2 - .02, z + 2.62), 'M_White', .02), box((.07, .2, 1.7), (x, -d / 2 - .02, z + 1.75), 'M_White', 0)]
        p.append(box((w - .6, 1.1, .14), (0, -d / 2 - .5, z + .5), 'M_White', .04))
        for i in range(int(w / .55)): p.append(cyl(.03, .8, (-w / 2 + .55 + i * .55, -d / 2 - 1.0, z + .55), 'M_White', 6))
        p.append(tube([(-w / 2 + .3, -d / 2 - 1.0, z + 1.36), (w / 2 - .3, -d / 2 - 1.0, z + 1.36)], .045, 'M_White', 8))
    for f in range(floors):
        z = f * fh
        for sy, cnt in ((1, n),):
            for i in range(cnt):
                x = (i - (cnt - 1) / 2) * bw; p += [box((bw - 1.3, .16, 1.6), (x, d / 2, z + 1.8), 'M_GlassBlue', 0), box((bw - 1.1, .24, .1), (x, d / 2 + .03, z + .96), 'M_White', .02), box((bw - 1.1, .22, .1), (x, d / 2 + .02, z + 2.64), 'M_White', .02)]
        for sx in (-1, 1):
            for yy in (-1.7, 1.7): p += [box((.16, 1.5, 1.6), (sx * w / 2, yy, z + 1.8), 'M_GlassBlue', 0), box((.24, 1.7, .1), (sx * (w / 2 + .03), yy, z + .96), 'M_White', .02), box((.22, 1.7, .1), (sx * (w / 2 + .02), yy, z + 2.64), 'M_White', .02)]
    # --- detail pass: corner pilasters, shutters, flower boxes, door frame, sign, string of bunting
    for sx in (-1, 1):
        for sy in (-1, 1): p.append(box((.42, .42, H - .2), (sx * (w / 2 - .02), sy * (d / 2 - .02), H / 2 + .05), 'M_White', .06))
    p += [box((2.2, .3, .16), (0, -d / 2 - .1, 3.06), 'M_White', .04), box((.16, .3, 2.7), (-1.05, -d / 2 - .1, 1.7), 'M_White', .04), box((.16, .3, 2.7), (1.05, -d / 2 - .1, 1.7), 'M_White', .04), box((2.6, .9, .14), (0, -d / 2 - .45, .43), 'M_Stone', .03), plane(1.5, .5, (0, -d / 2 - 1.9, 2.2), 'M_ShopSign')]
    for f in range(1, floors):
        z = f * fh
        for i in range(n):
            x = (i - (n - 1) / 2) * bw; ww = bw - 1.2
            for sx in (-1, 1): p.append(box((.36, .07, 1.7), (x + sx * (ww / 2 + .22), -d / 2 - .05, z + 1.75), 'M_Shutter', .015))
            p.append(box((ww + .3, .34, .26), (x, -d / 2 - 1.18, z + .78), 'M_Wood', .04))
            for k in range(5): p.append(sphere(.13, (x - ww / 2 + .1 + k * (ww - .0) / 4, -d / 2 - 1.18, z + .98), ('M_Pink', 'M_Yellow', 'M_FabricWhite', 'M_Red', 'M_Pink')[k], (1, 1, .8), 8, 6))
            p.append(sphere(.2, (x, -d / 2 - 1.18, z + .9), 'M_Grass', (ww * 2.2, .8, .6), 10, 6))
    nb = 9
    for k in range(nb):
        t = (k + .5) / nb; x = -w / 2 + .4 + t * (w - .8); zz = fh + .05 - .28 * math.sin(t * pi); m = ('M_FabricBlue', 'M_FabricOrange', 'M_FabricPink', 'M_FabricGreen', 'M_FabricWhite')[k % 5]
        p.append(prism([(-.16, 0), (.16, 0), (0, -.34)], .015, m, (x, -d / 2 - 1.9, zz + .5 - fh + 2.9), bevel=0))
    if roof == 'flat':                                              # tiled hip roof instead of a bare slab
        bm = bmesh.new(); hw, hd, hh = w / 2 + .55, d / 2 + .55, 2.1; v = [bm.verts.new(c) for c in ((-hw, -hd, H + .26), (hw, -hd, H + .26), (hw, hd, H + .26), (-hw, hd, H + .26), (-hw * .35, 0, H + .26 + hh), (hw * .35, 0, H + .26 + hh))]
        for f in ((0, 1, 5, 4), (1, 2, 5), (2, 3, 4, 5), (3, 0, 4)): bm.faces.new([v[i] for i in f])
        p.append(obj('Roof', bm, 'M_RoofTile', smooth=False)); p.append(box((.7, .7, 1.5), (w * .25, d * .2, H + 1.3), 'M_Plaster', .05)); p.append(box((.86, .86, .16), (w * .25, d * .2, H + 2.1), 'M_White', .03))
    if roof == 'dome': p += [cyl(1.5, .5, (w * .2, 0, H + .25), 'M_White', 24), sphere(1.4, (w * .2, 0, H + .75), 'M_GlassBlue', (1, 1, .8))]
    elif roof == 'box': p += [box((w * .4, d * .5, 1.5), (-w * .15, .5, H + 1.0), wall, .1), box((w * .4 + .5, d * .5 + .5, .25), (-w * .15, .5, H + 1.8), 'M_White', .06)]
    return finish(name, p, S)

def planter(name, r):
    p = [lathe(smooth_profile([(r - .42, 0), (r, 0), (r + .04, .1), (r + .02, .42), (r - .06, .52), (r - .34, .52), (r - .4, .44), (r - .42, .36)], 3), 'M_Stone', 40), lathe([(r - .4, .4), (r * .5, .5), (0, .54)], 'M_Soil', 32)]
    return finish(name, p, P)

def leafy_puff(c, r, seed, dark, light):
    o = ico(r, c, 'M_Vcol', 3, (1, 1, .82))
    for v in o.data.vertices:
        n = noise.noise(v.co * (2.2 / r) + Vector((seed, 0, 0))); n2 = noise.noise(v.co * (7 / r) + Vector((0, seed, 0))); v.co *= 1 + n * .22 + n2 * .09
    apply(o); return o
def canopy(name, puffs, out, dark='#2f8f25', light='#9fe043', extra=None):
    p = []
    for i, (c, r) in enumerate(puffs): p.append(leafy_puff(c, r, i * 3.7, dark, light))
    for x in C.scene.objects: x.select_set(x in p)
    C.view_layer.objects.active = p[0]; bpy.ops.object.join(); o = C.view_layer.objects.active
    zs = [v.co.z for v in o.data.vertices]; z0, z1 = min(zs), max(zs); d, l = hexc(dark), hexc(light)
    def f(co, n):
        t = max(0, min(1, (co.z - z0) / (z1 - z0) * .75 + n.z * .3 + .1 + noise.noise(co * 3) * .12)); return lerp3(d, l, t)
    vcol(o, f); return finish(name, [o] + (extra or []), out)
def bush(name, seed, s=1.0):
    random.seed(seed); puffs = [((random.uniform(-.7, .7) * s, random.uniform(-.6, .6) * s, random.uniform(.35, .75) * s), random.uniform(.45, .7) * s) for _ in range(7)] + [((0, 0, .5 * s), .75 * s)]
    return canopy(name, puffs, F)
def tree(name, seed, h=5.5):
    random.seed(seed); trunk = tube([(0, 0, 0), (.08, .03, h * .25), (-.05, .08, h * .5), (.1, 0, h * .7)], .3, 'M_Trunk', 12, r_end=.14)
    br = [tube([(.02, .05, h * .55), (.8, .3, h * .72)], .11, 'M_Trunk', 8, r_end=.05), tube([(0, 0, h * .5), (-.75, -.35, h * .7)], .1, 'M_Trunk', 8, r_end=.05)]
    puffs = [((random.uniform(-1.5, 1.5), random.uniform(-1.5, 1.5), h * random.uniform(.72, 1.02)), random.uniform(1.0, 1.55)) for _ in range(9)] + [((0, 0, h * .95), 1.8)]
    return canopy(name, puffs, F, '#278a24', '#8fdb3c', [trunk] + br)

def rock(name, seed, s=1.0, sc=(1, .85, .6)):
    o = ico(s, (0, 0, 0), 'M_Rock', 4, sc)
    for v in o.data.vertices:
        n = noise.noise(v.co * (1.1 / s) + Vector((seed, seed * 2, 0))); n2 = noise.noise(v.co * (3.5 / s) + Vector((0, seed, 7))); v.co *= 1 + n * .32 + n2 * .1
        if v.co.z < -s * sc[2] * .35: v.co.z = -s * sc[2] * .35
    for v in o.data.vertices: v.co.z += s * sc[2] * .3
    return finish(name, [o], R, .35)

def petal_obj(n, L, W, cup, c_in, c_out, tilt, name):
    """Flower head: n petals as cupped quads with vertex colours (double-sided M_Leaf)."""
    bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); NU, NV = 5, 4
    for k in range(n):
        a = 2 * pi * k / n; ca, sa = math.cos(a), math.sin(a); g = []
        for i in range(NU + 1):
            u = i / NU; row = []; w = W * math.sin(pi * min(1, u * .92 + .08)) ** .6
            for j in range(NV + 1):
                v = j / NV * 2 - 1; r = u * L; z = math.sin(u * pi * .5) * L * tilt + cup * (v * w) ** 2 * 3 - .3 * L * u * u * tilt; x, y = r, v * w
                row.append((bm.verts.new((x * ca - y * sa, x * sa + y * ca, z)), u))
            g.append(row)
        for i in range(NU):
            for j in range(NV):
                f = bm.faces.new((g[i][j][0], g[i + 1][j][0], g[i + 1][j + 1][0], g[i][j + 1][0]))
                for lp, uu in zip(f.loops, (g[i][j][1], g[i + 1][j][1], g[i + 1][j + 1][1], g[i][j + 1][1])): lp[col] = (*lerp3(c_in, c_out, min(1, uu * 1.3)), 1)
    return obj(name, bm, 'M_Leaf')
def flowers():
    # hibiscus: big pink bloom (foreground hero flower in the key art)
    p = [petal_obj(5, .2, .2, .35, hexc('#ee2f78'), hexc('#ff9cc4'), .8, 'Petals'), petal_obj(5, .1, .09, .3, hexc('#c3165a'), hexc('#ee2f78'), 1.1, 'Inner')]
    p += [tube([(0, 0, 0), (.01, 0, .07), (.025, .0, .13)], .007, 'M_Yellow', 6), sphere(.016, (.025, 0, .135), 'M_Yellow', segs=8, rings=6)]
    for o in p: o.location.z += .35
    p.append(tube([(0, 0, 0), (0, .02, .2), (0, 0, .35)], .014, 'M_Grass', 6))
    lf = petal_obj(3, .26, .1, .5, hexc('#2d8c28'), hexc('#58c23c'), .15, 'Leaves'); lf.location.z = .12; p.append(lf)
    finish('hibiscus', p, F)
    for nm, cin, cout in (('daisy_white', '#fff6c4', '#ffffff'), ('daisy_yellow', '#ffb21f', '#ffe35a'), ('daisy_pink', '#ff6fa3', '#ffc1d8')):
        p = [petal_obj(6, .075, .04, .4, hexc(cin), hexc(cout), .12, 'P'), sphere(.026, (0, 0, .012), 'M_Yellow', (1, 1, .6), 8, 5)]
        for o in p: o.location.z += .2
        p.append(tube([(0, 0, 0), (.01, 0, .1), (0, 0, .2)], .007, 'M_Grass', 5)); finish(nm, p, F)

lamp_post(); bench(); signpost(); notice_board(); fountain(); town_hall()
shop('shop_pink', 'M_PlasterPink', 'M_FabricPink', 'M_FabricWhite', 9, 2, 'box'); shop('shop_blue', 'M_PlasterBlue', 'M_FabricBlue', 'M_FabricWhite', 10, 3, 'dome')
shop('shop_yellow', 'M_PlasterYellow', 'M_FabricOrange', 'M_FabricWhite', 8, 2, 'flat'); shop('shop_white', 'M_Plaster', 'M_FabricPurple', 'M_FabricWhite', 11, 3, 'box')
planter('planter_small', 1.6); planter('planter_large', 3.0)
bush('bush_a', 1); bush('bush_b', 5, 1.35); tree('tree_a', 2); tree('tree_b', 9, 6.5)
rock('rock_a', 1, 1.0); rock('rock_b', 4, 1.6, (1.2, .9, .7)); rock('rock_c', 8, .5, (1, 1, .7))
flowers()
