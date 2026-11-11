"""Halo Isle stylized palm trees (asset library 'Foliage & Nature').
Run: python make_palm.py <out_dir> -> palm.blend, palm_a.glb, palm_b.glb, palm.json (collision + metadata).
Ringed, gently curved trunk; arched fronds with angled leaflets; coconut cluster. Vertex-coloured, two materials."""
import sys, os, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix, Quaternion
from common import reset, mat, srgb, hexc, export_glb
out = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else '.'
reset(); C = bpy.context
def vc_mat(name, rough, cc=0.0, sheen=0.0):
    m = mat(name, (1, 1, 1), rough=rough, clearcoat=cc)
    n = m.node_tree.nodes.new('ShaderNodeVertexColor'); n.layer_name = 'Col'
    m.node_tree.links.new(n.outputs['Color'], m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    return m
BARK, FROND = vc_mat('Palm_Bark', 0.85), vc_mat('Palm_Frond', 0.55, cc=0.15)
FROND.use_backface_culling = False

def build(name, seed, H, lean, nfr):
    rnd = random.Random(seed)
    bm = bmesh.new(); col = bm.loops.layers.color.new('Col'); uvl = bm.loops.layers.uv.new('UVMap')
    fcol = {}  # face -> colour fn
    def ring_pts(c, fwd, r, n=12):
        up = Vector((0, 0, 1)); side = fwd.cross(up if abs(fwd.z) < .99 else Vector((1, 0, 0))).normalized(); up2 = side.cross(fwd).normalized()
        return [c + (side * math.cos(a) + up2 * math.sin(a)) * r for a in (2 * math.pi * k / n for k in range(n))]
    def curve(t):  # trunk spine: lean out then curve back up
        return Vector((lean * (1.6 * t - .6 * t * t), 0, H * t))
    segs = 13; mats = {}
    bark_a, bark_b, bark_top = Vector(hexc('#c9a274')), Vector(hexc('#b08a5e')), Vector(hexc('#d8b98a'))
    for s in range(segs):
        t0, t1 = s / segs, (s + 1) / segs
        p0, p1 = curve(t0), curve(t1); fwd = (p1 - p0).normalized()
        r0 = .3 * (1 - .5 * t0) + .05 + .12 * max(0, .12 - t0); r1 = .3 * (1 - .5 * t1) + .05 + .12 * max(0, .12 - t1)
        A = [bm.verts.new(v) for v in ring_pts(p0, fwd, r0 * .93)]
        Bm = [bm.verts.new(v) for v in ring_pts(p0.lerp(p1, .82), fwd, r1 * 1.1)]
        Bt = [bm.verts.new(v) for v in ring_pts(p1, fwd, r1 * .93)]
        cc = bark_a.lerp(bark_top, t0 * .6) if s % 2 == 0 else bark_b.lerp(bark_top, t0 * .5)
        for ra, rb, shade in ((A, Bm, 1.0), (Bm, Bt, .86)):
            for k in range(12):
                f = bm.faces.new((ra[k], ra[(k + 1) % 12], rb[(k + 1) % 12], rb[k])); f.material_index = 0; f.smooth = True
                for i, lp in enumerate(f.loops):
                    lp[col] = (*(cc * shade), 1); lp[uvl].uv = ((k + (i in (1, 2))) / 12, t0 + (i >= 2) / segs)
    top = curve(1); topdir = (curve(1) - curve(.95)).normalized()
    # crown bulb
    cb = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=.24)
    for v in cb['verts']: v.co = Vector((v.co.x, v.co.y, v.co.z * .8)) + top + Vector((0, 0, .05))
    crown_faces = list({f for v in cb['verts'] for f in v.link_faces})
    for f in crown_faces:
        f.material_index = 0; f.smooth = True
        for lp in f.loops: lp[col] = (*Vector(hexc('#7d9a3c')), 1)
    # coconuts
    for k in range(rnd.choice((3, 4))):
        a = 2 * math.pi * k / 3.5 + rnd.random() * .4
        c = top + Vector((math.cos(a) * .2, math.sin(a) * .2, -.16 - rnd.random() * .05))
        cn = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=.13)
        tint = Vector(hexc('#8fae3c')).lerp(Vector(hexc('#a8783e')), rnd.random())
        for v in cn['verts']: v.co = Vector((v.co.x, v.co.y, v.co.z * 1.08)) + c
        for f in {f for v in cn['verts'] for f in v.link_faces}:
            f.smooth = True
            for lp in f.loops: lp[col] = (*tint, 1)
    # fronds
    g_dark, g_mid, g_light = Vector(hexc('#3c9e34')), Vector(hexc('#6ccf3c')), Vector(hexc('#b8ec62'))
    for fi in range(nfr):
        yaw = 2 * math.pi * fi / nfr + rnd.uniform(-.2, .2)
        tier = fi % 2
        Lf = rnd.uniform(2.3, 2.8) * (0.85 if tier else 1)
        rise = rnd.uniform(.55, .95) * (1.3 if tier else 1); droop = rnd.uniform(1.3, 1.8)
        d = Vector((math.cos(yaw), math.sin(yaw), 0))
        side = Vector((-d.y, d.x, 0))
        def rib(s):
            return top + Vector((0, 0, .08)) + d * (s * Lf) + Vector((0, 0, rise * s - droop * s * s))
        # midrib strip
        N = 10
        for i in range(N):
            s0, s1 = i / N, (i + 1) / N
            a0, a1 = rib(s0), rib(s1); w0, w1 = .035 * (1 - s0) + .008, .035 * (1 - s1) + .008
            vs = [bm.verts.new(a0 - side * w0), bm.verts.new(a0 + side * w0), bm.verts.new(a1 + side * w1), bm.verts.new(a1 - side * w1)]
            f = bm.faces.new(vs); f.material_index = 1
            for lp in f.loops: lp[col] = (*Vector(hexc('#8fcf4a')), 1)
        # leaflets
        NL = 15
        for li in range(NL):
            s = .1 + .88 * li / NL
            base = rib(s); tang = (rib(min(1, s + .02)) - rib(max(0, s - .02))).normalized()
            ln = .7 * math.sin(math.pi * min(1, s * 1.05)) ** .6 + .08
            for sg in (-1, 1):
                out_dir = (side * sg * .8 + tang * .55 + Vector((0, 0, -.35))).normalized()
                tip = base + out_dir * ln + Vector((0, 0, -.12 * ln))
                mid = base.lerp(tip, .5) + Vector((0, 0, .04))
                wv = tang * .13
                v0, v1 = bm.verts.new(base - wv * .5), bm.verts.new(base + wv * .5)
                v2, v3 = bm.verts.new(mid + wv * .5), bm.verts.new(mid - wv * .5)
                v4 = bm.verts.new(tip)
                f1 = bm.faces.new((v0, v1, v2, v3)); f2 = bm.faces.new((v3, v2, v4))
                for f in (f1, f2):
                    f.material_index = 1; f.smooth = True
                    for lp in f.loops:
                        u = (lp.vert.co - base).length / ln
                        c = g_dark.lerp(g_mid, min(1, u * 1.4)).lerp(g_light, max(0, u - .55) * 1.6 * (.6 + .4 * s))
                        lp[col] = (*c, 1)
    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces if f.material_index == 0])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(BARK); me.materials.append(FROND)
    ob = bpy.data.objects.new(name, me); C.collection.objects.link(ob)
    return ob, {'height': round(H + .3, 2), 'collider': {'type': 'capsule', 'radius': .26, 'height': H, 'offset': [0, 0, 0]}, 'tris': sum(len(p.vertices) - 2 for p in me.polygons)}
os.makedirs(out, exist_ok=True); meta = {}
a, meta['palm_a'] = build('Palm_A', 3, 5.6, .9, 9)
b, meta['palm_b'] = build('Palm_B', 11, 4.4, 1.1, 8); b.location.x = 4
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'palm.blend'))
b.location.x = 0
export_glb(os.path.join(out, 'palm_a.glb'), [a]); export_glb(os.path.join(out, 'palm_b.glb'), [b])
json.dump(meta, open(os.path.join(out, 'palm.json'), 'w'), indent=1)
print('PALM_OK', meta)
