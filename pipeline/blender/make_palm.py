"""Halo Isle palms v2, modelled on the key art: thick ringed trunk with a lazy curve, broad glossy fronds with split leaflets, coconuts.
Run: python make_palm.py <public/assets dir>"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Matrix, noise
from kit import *
OUT = os.path.join(sys.argv[-1], 'environment', 'foliage'); reset(); pi = math.pi

def palm(name, seed, H=6.4, lean=1.3, nf=12):
    random.seed(seed); la = random.uniform(0, 2 * pi); lx, ly = math.cos(la) * lean, math.sin(la) * lean
    def spine(t): return Vector((lx * t * t, ly * t * t, H * t - .25 * lean * t * t))
    # trunk: stacked ring segments that bulge, like the art
    bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); NS, NR = 26, 16; rings = []; cols = []
    c_lo, c_hi, c_ln = hexc('#b8894e'), hexc('#e2bb78'), hexc('#8a6234')
    for i in range(NS * 4 + 1):
        t = i / (NS * 4); p = spine(t); tg = (spine(min(1, t + .01)) - spine(max(0, t - .01))).normalized(); e1 = tg.cross(Vector((0, 1, 0))).normalized(); e2 = tg.cross(e1)
        ph = (i % 4) / 4; r = (.3 - .12 * t + .1 * (1 - t) ** 6) * (1 + .1 * math.sin(ph * pi) ** .6 - (.07 if i % 4 == 0 else 0))
        rings.append([bm.verts.new(p + (e1 * math.cos(a) + e2 * math.sin(a)) * r) for a in (2 * pi * k / NR for k in range(NR))]); cols.append(c_ln if i % 4 == 0 else lerp3(c_lo, c_hi, .3 + .7 * math.sin(ph * pi)))
    for i, (a, b) in enumerate(zip(rings, rings[1:])):
        for k in range(NR):
            f = bm.faces.new((a[k], a[(k + 1) % NR], b[(k + 1) % NR], b[k]))
            for lp, c in zip(f.loops, (cols[i], cols[i], cols[i + 1], cols[i + 1])): lp[col] = (*c, 1)
    bm.faces.new(rings[-1]); trunk = obj('Trunk', bm, 'M_Vcol')
    top = spine(1); parts = [trunk]
    # crown: fronds arch out and droop; each is a folded blade whose edge is cut into leaflets
    bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); g_in, g_mid, g_tip = hexc('#2f9a26'), hexc('#6fd032'), hexc('#c4ee4a')
    for k in range(nf):
        az = 2 * pi * k / nf + random.uniform(-.2, .2); tier = k % 3; el = (.75, .28, -.18)[tier] + random.uniform(-.1, .1); L = (2.5, 3.1, 2.8)[tier] * random.uniform(.9, 1.1); W = .62 * random.uniform(.9, 1.1)
        d = Vector((math.cos(az), math.sin(az), 0)); side = Vector((-d.y, d.x, 0)); NU = 16; rows = []
        for i in range(NU + 1):
            u = i / NU; ang = el - u * u * (1.5 + .3 * tier); 
            # integrate the arc
            if i == 0: c = top + Vector((0, 0, .05)); 
            else: c = prev + (d * math.cos(pang) + Vector((0, 0, 1)) * math.sin(pang)) * (L / NU)
            prev, pang = c, ang
            w = W * (math.sin(pi * min(1, u * .9 + .1)) ** .55) * (1 - .35 * u); cut = (.55 if i % 2 else 1.0) if 1 < i < NU else 1.0     # zig-zag edge = leaflets
            up = Vector((-d.x * math.sin(ang), -d.y * math.sin(ang), math.cos(ang))); fold = .42
            rows.append([(c + side * (-w * cut) - up * (w * cut * fold), u, 1), (c + side * (-w * .5) - up * (w * .5 * fold * .8), u, .5), (c, u, 0), (c + side * (w * .5) - up * (w * .5 * fold * .8), u, .5), (c + side * (w * cut) - up * (w * cut * fold), u, 1)])
        vr = [[(bm.verts.new(p), u, e) for p, u, e in row] for row in rows]
        for a, b in zip(vr, vr[1:]):
            for j in range(4):
                f = bm.faces.new((a[j][0], a[j + 1][0], b[j + 1][0], b[j][0]))
                for lp, (v, u, e) in zip(f.loops, (a[j], a[j + 1], b[j + 1], b[j])): c = lerp3(lerp3(g_in, g_mid, min(1, u * 2 + e * .4)), g_tip, max(0, u * 1.2 - .45) + e * .22); lp[col] = (*c, 1)
    crown = obj('Crown', bm, 'M_Leaf'); sol = crown.modifiers.new('t', 'SOLIDIFY'); sol.thickness = .02; C.view_layer.objects.active = crown; bpy.ops.object.modifier_apply(modifier='t'); parts.append(crown)
    for k in range(3): a = 2 * pi * k / 3 + seed; parts.append(sphere(.17, top + Vector((math.cos(a) * .22, math.sin(a) * .22, -.2)), 'M_Coconut', (1, 1, 1.12), 12, 8))
    parts.append(sphere(.3, top + Vector((0, 0, -.02)), 'M_Coconut', (1, 1, .7), 12, 8))
    return finish(name, parts, OUT)
palm('palm_a', 3, 6.4, 1.3, 12); palm('palm_b', 11, 7.6, 2.0, 13); palm('palm_c', 5, 5.0, .6, 11)
