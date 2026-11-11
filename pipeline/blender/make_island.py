"""Beach kit, ruins and island landmarks for Halo Isle (from the beach/plaza key art + asset sheets). Run: python make_island.py <public/assets dir>"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, noise
from kit import *
OUT = sys.argv[-1]; reset(); pi = math.pi
P, S, L = os.path.join(OUT, 'props'), os.path.join(OUT, 'structures'), os.path.join(OUT, 'landmarks')

def umbrella(name, c1, c2):
    p = [cyl(.035, 2.5, (0, 0, 0), 'M_Wood', 10), sphere(.07, (0, 0, 2.62), 'M_Wood', segs=10, rings=6)]
    n = 10; R = 1.75
    for i in range(n):                                          # alternating canopy gores with a scalloped rim
        a0, a1 = 2 * pi * i / n, 2 * pi * (i + 1) / n; bm = bmesh.new(); rows = []
        for j in range(7):
            t = j / 6; r = R * math.sin(t * pi / 2 * .98); z = 2.52 - .62 * (1 - math.cos(t * pi / 2)); row = []
            for k in range(5):
                a = a0 + (a1 - a0) * k / 4; sag = .05 * math.sin(k / 4 * pi) * t; row.append(bm.verts.new(((r) * math.cos(a), (r) * math.sin(a), z - sag - (.1 * math.sin(k / 4 * pi) if j == 6 else 0) * -1)))
            rows.append(row)
        for ra, rb in zip(rows, rows[1:]):
            for k in range(4): bm.faces.new((ra[k], ra[k + 1], rb[k + 1], rb[k]))
        o = obj('Gore', bm, c1 if i % 2 == 0 else c2); o.modifiers.new('s', 'SOLIDIFY').thickness = .025; C.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='s'); p.append(o)
        p.append(tube([(0, 0, 2.45), (R * .98 * math.cos(a0), R * .98 * math.sin(a0), 1.9)], .012, 'M_Wood', 5))
    return finish(name, p, P)

def lounger():
    p = []
    for sx in (-.33, .33): p += [box((.07, 1.9, .07), (sx, 0, .3), 'M_Wood', .015), box((.07, .07, .3), (sx, -.8, .15), 'M_Wood', .015), box((.07, .07, .3), (sx, .55, .15), 'M_Wood', .015), box((.07, .8, .07), (sx, .62, .62), 'M_Wood', .015, rot=(.85, 0, 0))]
    for i in range(9): p.append(box((.74, .11, .035), (0, -.85 + i * .145, .355), 'M_Wood', .008))
    for i in range(5): p.append(box((.74, .11, .035), (0, .47 + i * .1, .42 + i * .118), 'M_Wood', .008, rot=(.86, 0, 0)))
    p += [box((.66, 1.2, .09), (0, -.3, .42), 'M_FabricWhite', .04, segs=3), box((.66, .72, .09), (0, .66, .7), 'M_FabricWhite', .04, rot=(.86, 0, 0), segs=3)]
    return finish('lounger', p, P)

def beach_ball():
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=.42)
    col = bm.loops.layers.color.new('Col'); cs = [hexc('#f0483e'), hexc('#ffffff')]
    for f in bm.faces:
        c = f.calc_center_median(); k = int(((math.atan2(c.y, c.x) + pi) / (2 * pi)) * 6) % 2; cc = hexc('#ffffff') if abs(c.z) > .385 else cs[k]
        for lp in f.loops: lp[col] = (*cc, 1)
    o = obj('Ball', bm, 'M_VcolGloss'); o.location.z = .42; return finish('beach_ball', [o], P)

def pier():
    p = []
    for i in range(16): p.append(box((.46, 3.0, .08), (-3.75 + i * .5, 0, 0), 'M_Wood', .012))
    for sx in (-3.6, 0, 3.6):
        for sy in (-1.35, 1.35): p += [cyl(.13, 3.6, (sx, sy, -3.0), 'M_WoodDark', 10), sphere(.15, (sx, sy, .62), 'M_WoodDark', (1, 1, .6), 10, 6)]
        p.append(box((.14, 2.9, .16), (sx, 0, -.12), 'M_WoodDark', .02))
    for sy in (-1.35, 1.35):
        p.append(box((8, .14, .16), (0, sy, -.12), 'M_WoodDark', .02)); p.append(tube([(-3.6, sy, .5), (-1.8, sy, .36), (0, sy, .5), (1.8, sy, .36), (3.6, sy, .5)], .03, 'M_Rope', 6))
    return finish('pier_section', p, S)

def fence():
    p = [box((.15, .15, 1.0), (-1.1, 0, .5), 'M_Wood', .025), box((.15, .15, 1.0), (1.1, 0, .5), 'M_Wood', .025), box((2.3, .07, .14), (0, 0, .78), 'M_Wood', .02), box((2.3, .07, .14), (0, 0, .42), 'M_Wood', .02)]
    return finish('fence', p, P)

def surf_rack():
    p = [box((2.3, .1, .1), (0, 0, 1.25), 'M_Wood', .02), box((.1, .1, 1.5), (-1.1, 0, .75), 'M_Wood', .02), box((.1, .1, 1.5), (1.1, 0, .75), 'M_Wood', .02), box((2.3, .5, .08), (0, -.1, .06), 'M_Wood', .02)]
    for i, m in enumerate(('M_FabricBlue', 'M_FabricGreen', 'M_FabricPink', 'M_Yellow')):
        bm = bmesh.new(); N = 16
        prof = [(0, 0)] + [(.26 * math.sin(pi * (t ** .8)) ** .7, t * 2.1) for t in [k / N for k in range(1, N)]] + [(0, 2.1)]
        front = [bm.verts.new((x, -.03, z)) for x, z in prof] ; back = [bm.verts.new((-x, -.03, z)) for x, z in prof[1:-1]][::-1]
        ring = front + back; ring2 = [bm.verts.new((v.co.x, .03, v.co.z)) for v in ring]; bm.faces.new(ring); bm.faces.new(ring2[::-1]); n = len(ring)
        for k in range(n): bm.faces.new((ring[k], ring[(k + 1) % n], ring2[(k + 1) % n], ring2[k]))
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=.02, segments=2, affect='EDGES')
        o = obj('Board', bm, m); o.location = (-.78 + i * .52, -.12, .1); o.rotation_euler = (-.16, 0, 0); p.append(o)
        p.append(box((.03, .012, 1.7), (-.78 + i * .52, -.19 - .13, 1.05), 'M_White', 0, rot=(-.16, 0, 0)))
    return finish('surf_rack', p, P)

def cooler():
    p = [box((.7, .45, .4), (0, 0, .22), 'M_NavyBlue', .05, segs=3), box((.74, .49, .14), (0, 0, .5), 'M_White', .04, segs=3), tube([(-.25, 0, .57), (-.25, 0, .68), (.25, 0, .68), (.25, 0, .57)], .022, 'M_White', 6)]
    return finish('cooler', p, P)

def sandcastle():
    p = [box((.9, .9, .4), (0, 0, .2), 'M_Sand', .05), cyl(.24, .62, (-.4, -.4, 0), 'M_Sand', 14), cyl(.24, .62, (.4, -.4, 0), 'M_Sand', 14), cyl(.24, .62, (-.4, .4, 0), 'M_Sand', 14), cyl(.24, .62, (.4, .4, 0), 'M_Sand', 14), cyl(.3, .5, (0, 0, .4), 'M_Sand', 16)]
    for x, y, z, r in ((-.4, -.4, .62, .24), (.4, -.4, .62, .24), (-.4, .4, .62, .24), (.4, .4, .62, .24), (0, 0, .9, .3)):
        for k in range(6): a = k * pi / 3; p.append(box((.1, .1, .1), (x + math.cos(a) * r * .8, y + math.sin(a) * r * .8, z + .04), 'M_Sand', .01, rot=(0, 0, a)))
    p += [cyl(.012, .5, (0, 0, .9), 'M_Wood', 6), prism([(0, 0), (.3, .09), (0, .18)], .01, 'M_FabricBlue', (0, 0, 1.22), bevel=0)]
    return finish('sandcastle', p, P)

def life_ring_post():
    p = [cyl(.06, 1.5, (0, 0, 0), 'M_Wood', 10), box((.5, .06, .5), (0, -.06, 1.15), 'M_Wood', .02)]
    bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); R, r, NU, NV = .3, .085, 24, 10; g = [[bm.verts.new(((R + r * math.cos(2 * pi * j / NV)) * math.cos(2 * pi * i / NU), r * math.sin(2 * pi * j / NV), (R + r * math.cos(2 * pi * j / NV)) * math.sin(2 * pi * i / NU))) for j in range(NV)] for i in range(NU)]
    for i in range(NU):
        for j in range(NV):
            f = bm.faces.new((g[i][j], g[(i + 1) % NU][j], g[(i + 1) % NU][(j + 1) % NV], g[i][(j + 1) % NV])); c = hexc('#f0483e') if (i // 3) % 2 == 0 else hexc('#ffffff')
            for lp in f.loops: lp[col] = (*c, 1)
    o = obj('Ring', bm, 'M_VcolGloss'); o.location = (0, -.19, 1.15); p.append(o); return finish('life_ring_post', p, P)

def volleyball_net():
    p = []
    for sx in (-4.3, 4.3): p += [cyl(.07, 2.6, (sx, 0, 0), 'M_Yellow', 12), cyl(.075, .5, (sx, 0, .0), 'M_NavyBlue', 12), sphere(.09, (sx, 0, 2.62), 'M_NavyBlue', segs=10, rings=6)]
    p += [box((8.5, .03, .09), (0, 0, 2.42), 'M_White', 0), box((8.5, .03, .07), (0, 0, 1.45), 'M_White', 0), plane(8.5, .95, (0, 0, 1.94), 'M_Net')]
    return finish('volleyball_net', p, P)

def ruins_gate():
    random.seed(3); p = []
    def blk(sz, loc, rot=0): p.append(box(sz, loc, 'M_StoneRuin', .06, rot=(random.uniform(-.02, .02), random.uniform(-.02, .02), rot)))
    for sx in (-2.6, 2.6):
        z = 0
        for i in range(6): hh = random.uniform(.72, .95); blk((1.5 + random.uniform(-.1, .1), 1.5, hh), (sx + random.uniform(-.05, .05), random.uniform(-.05, .05), z + hh / 2)); z += hh
    for i in range(9):                                           # arch voussoirs
        a = pi * (i + .5) / 9; blk((1.05, 1.5, .95), (math.cos(a) * 2.75, 0, 4.7 + math.sin(a) * 2.05), 0); p[-1].rotation_euler = (0, -(a - pi / 2), 0)
    for i in range(5): blk((1.7, 1.45, .8), (-3.2 + i * 1.6 + random.uniform(-.1, .1), .0, 7.3 + random.uniform(-.06, .06)))
    for sx, n in ((-4.2, 4), (4.3, 2)):
        z = 0
        for i in range(n): hh = random.uniform(.8, 1.0); blk((1.5, 1.4, hh), (sx, random.uniform(-.1, .1), z + hh / 2), random.uniform(-.08, .08)); z += hh
    p.append(box((4.0, .5, 6.2), (0, .35, 3.1), 'M_StoneDoor', .04))                 # sealed door slab
    bm_parts = [lathe([(1.18, -.05), (1.3, -.05), (1.3, .05), (1.18, .05)], 'M_Glow', 48), lathe([(.5, -.05), (.6, -.05), (.6, .05), (.5, .05)], 'M_Glow', 32)]
    for o in bm_parts: o.rotation_euler = (pi / 2, 0, 0); o.location = (0, .06, 3.6); p.append(o)
    for dx, dz, w, h in ((0, 1.55, .09, .9), (0, -1.55, .09, .9), (1.55, 0, .9, .09), (-1.55, 0, .9, .09)): p.append(box((w, .08, h), (dx, .08, 3.6 + dz), 'M_Glow', 0))
    for i in range(4): p.append(box((6.4 - i * .5, 1.0, .28), (0, -1.2 - i * .9 + 1.6, .14 + (3 - i) * .0), 'M_StoneRuin', .04)); p[-1].location.z = .14 + (3 - i) * .28; p[-1].location.y = -1.0 - (3 - i) * -.0 - i * .0
    # steps: four treads descending toward the front (-Y)
    for o in p[-4:]: pass
    for i in range(4): p[-4 + i].location = (0, -1.1 - i * .85, .98 - i * .28 + .0); p[-4 + i].dimensions = p[-4 + i].dimensions
    for i in range(4): p.append(box((6.4, .85 * (i + 1) + .6, .28), (0, -1.1 - i * .85 / 2 + .2, .98 - i * .28 - .28), 'M_StoneRuin', .03))
    return finish('ruins_gate', p, S, .4)

def glyph_block(name, shape):
    p = [box((.95, .95, .95), (0, 0, .475), 'M_StoneRuin', .07)]
    if shape == 'tri': pts = [(-.26, -.2), (.26, -.2), (0, .26)]; inner = [(-.14, -.13), (.14, -.13), (0, .12)]
    p.append(prism(pts, .03, 'M_Glow', (0, -.48, .5), bevel=0)); p.append(prism(inner, .034, 'M_StoneDoor', (0, -.482, .5), bevel=0))
    return finish(name, p, P, .4)

def pedestal():
    p = [box((1.1, .9, .9), (0, 0, .45), 'M_StoneRuin', .08), box((1.0, .08, .75), (0, -.25, 1.05), 'M_StoneDoor', .03, rot=(-.6, 0, 0)), lathe([(.2, -.02), (.26, -.02), (.26, .02), (.2, .02)], 'M_Glow', 24)]
    p[-1].rotation_euler = (pi / 2 - .6, 0, 0); p[-1].location = (0, -.3, 1.07)
    for w, h in ((.03, .5), (.5, .03)): p.append(box((w, .03, h), (0, -.3, 1.07), 'M_Glow', 0, rot=(-.6, 0, 0)))
    return finish('glyph_pedestal', p, P, .4)

def lighthouse():
    p = [lathe(smooth_profile([(4.6, 0), (4.6, 1.2), (4.2, 1.5), (3.5, 1.6)], 2), 'M_Stone', 32), lathe([(3.5, 1.6), (2.45, 19), (2.9, 19.3), (3.3, 19.5), (3.3, 19.9), (0, 19.9)], 'M_Plaster', 32)]
    for z, h in ((6.5, 2.2), (13, 2.0)): r0 = 3.5 - (z - 1.6) / 17.4 * 1.05; p.append(lathe([(r0 + .02, z), (r0 + .02 - h * .06, z + h)], 'M_FabricBlue', 32))
    for k in range(20): a = 2 * pi * k / 20; p.append(cyl(.05, 1.1, (3.2 * math.cos(a), 3.2 * math.sin(a), 19.9), 'M_White', 6))
    p += [lathe([(3.2, 20.95), (3.26, 20.95), (3.26, 21.05), (3.2, 21.05)], 'M_White', 32), cyl(1.9, 2.6, (0, 0, 19.9), 'M_Glass', 16, cap=False), sphere(.8, (0, 0, 21.2), 'M_Lamp'),
          lathe([(2.2, 22.5), (2.25, 22.7), (1.2, 23.6), (.3, 24.1), (0, 24.6)], 'M_FabricBlue', 24), sphere(.25, (0, 0, 24.7), 'M_Metal')]
    for k in range(8): a = 2 * pi * k / 8; p.append(cyl(.07, 2.6, (1.9 * math.cos(a), 1.9 * math.sin(a), 19.9), 'M_White', 6))
    for z in (4, 9.5, 15.5): r0 = 3.5 - (z - 1.6) / 17.4 * 1.05; p.append(box((.7, .3, 1.2), (0, -r0 + .05, z), 'M_GlassBlue', .05))
    p.append(box((1.3, .4, 2.3), (0, -3.6, 2.6), 'M_Wood', .08))
    return finish('lighthouse', p, L)

def turbine():
    p = [lathe([(1.3, 0), (1.3, .5), (.95, .8), (.42, 26), (0, 26)], 'M_White', 20), sphere(.9, (0, -.5, 26.2), 'M_White', (1, 2.1, 1), 16, 10)]
    finish('turbine_tower', p, L)
    p = [sphere(.75, (0, 0, 0), 'M_White', (1, 1.3, 1), 14, 8)]
    for k in range(3):
        a = 2 * pi * k / 3; bm = bmesh.new(); N = 12; rows = []
        for i in range(N + 1):
            t = i / N; r = .6 + t * 12.4; ch = (1.25 * (1 - t) ** .7 + .22) * (math.sin(min(1, t * 6) * pi / 2)); th = .2 * (1 - t) + .04; tw = .5 * (1 - t)
            rows.append([bm.verts.new((x * math.cos(tw) , y + x * math.sin(tw) * .3, r)) for x, y in ((-ch * .35, 0), (0, -th), (ch * .65, 0), (0, th))])
        for ra, rb in zip(rows, rows[1:]):
            for q in range(4): bm.faces.new((ra[q], ra[(q + 1) % 4], rb[(q + 1) % 4], rb[q]))
        bm.faces.new(rows[-1]); o = obj('Blade', bm, 'M_White'); o.rotation_euler = (0, a, 0); p.append(o)
    return finish('turbine_rotor', p, L)

def observatory():
    R = 6.5; p = [lathe([(R + 1.2, 0), (R + 1.2, .5), (R + .5, .5), (R + .5, 1.0), (0, 1.0)], 'M_Marble', 40, smooth=False), cyl(R, 3.6, (0, 0, 1.0), 'M_Plaster', 40), cyl(R + .04, 1.5, (0, 0, 2.2), 'M_GlassBlue', 40, cap=False),
         lathe([(R - .1, 4.6), (R + .5, 4.65), (R + .5, 5.0), (R + .1, 5.1), (0, 5.1)], 'M_Marble', 40)]
    for k in range(14): a = 2 * pi * k / 14; p.append(box((.3, .25, 3.6), ((R + .1) * math.cos(a), (R + .1) * math.sin(a), 2.8), 'M_Marble', .04, rot=(0, 0, a)))
    D = R - .2; p.append(lathe([(D * math.cos(t), 5.05 + D * math.sin(t)) for t in [x / 12 * pi / 2 for x in range(13)]], 'M_Glass', 40, arc=2 * pi * .86))
    for k in range(12): a = 2 * pi * .86 * k / 11; p.append(tube([(D * math.cos(t) * math.cos(a), D * math.cos(t) * math.sin(a), 5.05 + D * math.sin(t)) for t in [x / 10 * pi / 2 for x in range(11)]], .08, 'M_White', 6))
    am = -2 * pi * .07; d = Vector((math.cos(am) * math.cos(.6), math.sin(am) * math.cos(.6), math.sin(.6))); b0 = Vector((0, 0, 6.4))
    p += [tube([b0 - d * 1.5, b0 + d * 7.5], 1.05, 'M_Metal', 20, r_end=1.25), tube([b0 + d * 7.5, b0 + d * 8.3], 1.35, 'M_NavyBlue', 20), tube([b0 - d * 2.3, b0 - d * 1.5], .7, 'M_NavyBlue', 16), cyl(1.6, 1.4, (0, 0, 5.0), 'M_Metal', 20)]
    return finish('observatory', p, L)

def sailboat():
    hull = lathe(smooth_profile([(0, -.5), (.9, -.35), (1.25, .1), (1.3, .5)], 3), 'M_White', 20); hull.scale = (2.4, 1, 1); p = [hull, box((5.2, 2.2, .1), (0, 0, .45), 'M_Wood', .03), cyl(.07, 7.5, (.4, 0, .4), 'M_White', 8), box((1.5, 1.2, .7), (-.9, 0, .8), 'M_White', .12), box((6.2, .05, .22), (0, 0, .0), 'M_FabricBlue', 0)]
    p[-1].scale = (1, 52, 1)
    p.append(prism([(0, 0), (3.6, 0), (0, 6.2)], .03, 'M_FabricWhite', (.55, 0, 1.4), bevel=0)); p.append(prism([(0, 0), (-2.2, 0), (0, 5.2)], .03, 'M_FabricWhite', (.3, 0, 1.6), bevel=0))
    return finish('sailboat', p, L)

umbrella('umbrella_orange', 'M_FabricOrange', 'M_FabricWhite'); umbrella('umbrella_blue', 'M_FabricBlue', 'M_FabricWhite'); lounger(); beach_ball(); pier(); fence(); surf_rack(); cooler(); sandcastle(); life_ring_post(); volleyball_net()
ruins_gate(); glyph_block('glyph_block', 'tri'); pedestal(); lighthouse(); turbine(); observatory(); sailboat()
