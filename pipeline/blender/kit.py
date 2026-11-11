"""Halo Isle modelling kit (bpy 5.x headless). Small bmesh helpers; every part gets a library material NAME (M_*) that the
game swaps for its shared textured material, and metre-scaled box UVs so textures tile consistently across props."""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix, Euler
from common import reset, srgb, hexc, export_glb, smooth_profile
C = bpy.context
PREVIEW = {'M_Wood': '#c98a4b', 'M_WoodDark': '#8a5a34', 'M_Plaster': '#f6f3ea', 'M_PlasterPink': '#f6c9d4', 'M_PlasterBlue': '#bfdcf5', 'M_PlasterYellow': '#f8e3a4', 'M_Stone': '#cfc8b8',
           'M_StoneRuin': '#aeb39a', 'M_Marble': '#f1f0ee', 'M_Paving': '#d9d2c6', 'M_PavingPink': '#e3b9ae', 'M_Rock': '#a59a88', 'M_RoofTile': '#e8826a', 'M_Navy': '#1c3f86', 'M_Metal': '#c9d2dc',
           'M_White': '#fbfcff', 'M_Glass': '#9fd6f7', 'M_GlassBlue': '#4fb4f2', 'M_Lamp': '#fffdf2', 'M_Glow': '#59f0ff', 'M_FabricBlue': '#3f9ff2', 'M_FabricWhite': '#fdfdfd', 'M_FabricOrange': '#ff9a45',
           'M_FabricPink': '#ff8fb5', 'M_FabricPurple': '#9a7be0', 'M_FabricGreen': '#8cd64a', 'M_FabricRed': '#f0524a', 'M_Jelly': '#50bafa', 'M_Water': '#59d7f5', 'M_Vcol': '#ffffff', 'M_Leaf': '#ffffff',
           'M_Trunk': '#c59a5e', 'M_Banner': '#3f9ff2', 'M_SignA': '#3f9ff2', 'M_SignB': '#8cd64a', 'M_SignC': '#9a7be0', 'M_Eye': '#16296a', 'M_Sand': '#f7e2a8', 'M_Grass': '#69c531', 'M_Yellow': '#ffd23f', 'M_Red': '#f0524a', 'M_Black': '#22262e', 'M_Grey': '#6f7884', 'M_Soil': '#7a5a3c', 'M_Paper': '#fbf6e6'}
def M(name):
    m = bpy.data.materials.get(name)
    if not m:
        m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*srgb(PREVIEW.get(name, '#ff00ff')), 1)
        if name in ('M_Vcol', 'M_Leaf'):
            vc = m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; m.node_tree.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    return m
def obj(name, bm, mat, smooth=True):
    me = bpy.data.meshes.new(name); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); C.collection.objects.link(o); me.materials.append(M(mat))
    for p in me.polygons: p.use_smooth = smooth
    return o
def box(size, loc=(0, 0, 0), mat='M_Wood', bevel=0.02, rot=(0, 0, 0), name='Box', segs=2):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    if bevel > 0: bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * .45), segments=segs, affect='EDGES', profile=.5)
    o = obj(name, bm, mat); o.location = loc; o.rotation_euler = rot; return o
def cyl(r, h, loc=(0, 0, 0), mat='M_Navy', segs=24, r2=None, rot=(0, 0, 0), name='Cyl', cap=True):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for v in bm.verts: v.co.z += h / 2
    o = obj(name, bm, mat); o.location = loc; o.rotation_euler = rot; return o
def sphere(r, loc=(0, 0, 0), mat='M_Lamp', scale=(1, 1, 1), segs=24, rings=14, name='Sphere'):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    o = obj(name, bm, mat); o.location = loc; return o
def ico(r, loc=(0, 0, 0), mat='M_Vcol', sub=2, scale=(1, 1, 1), name='Ico'):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    o = obj(name, bm, mat); o.location = loc; return o
def lathe(profile, mat='M_Stone', segs=32, loc=(0, 0, 0), name='Lathe', smooth=True, arc=2 * math.pi):
    bm = bmesh.new(); rings = []; full = arc >= 2 * math.pi - 1e-6; n = segs if full else segs + 1
    for r, z in profile:
        rings.append([bm.verts.new((0, 0, z))] if r < 1e-6 else [bm.verts.new((r * math.cos(arc * i / segs), r * math.sin(arc * i / segs), z)) for i in range(n)])
    for a, b in zip(rings, rings[1:]):
        m = segs if full else segs
        for i in range(m):
            j = (i + 1) % n if full else i + 1
            if len(a) == 1 and len(b) == 1: break
            if len(a) == 1: bm.faces.new((a[0], b[i], b[j]))
            elif len(b) == 1: bm.faces.new((a[i], b[0], a[j]))
            else: bm.faces.new((a[i], b[i], b[j], a[j]))
    o = obj(name, bm, mat, smooth); o.location = loc; return o
def tube(points, r, mat='M_Navy', segs=10, name='Tube', r_end=None):
    bm = bmesh.new(); rings = []; P = [Vector(p) for p in points]
    for i, p in enumerate(P):
        tg = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized(); up = Vector((0, 0, 1)) if abs(tg.z) < .95 else Vector((1, 0, 0))
        e1 = tg.cross(up).normalized(); e2 = tg.cross(e1); rr = r if r_end is None else r + (r_end - r) * i / (len(P) - 1)
        rings.append([bm.verts.new(p + (e1 * math.cos(a) + e2 * math.sin(a)) * rr) for a in (2 * math.pi * k / segs for k in range(segs))])
    for a, b in zip(rings, rings[1:]):
        for k in range(segs): bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1]); return obj(name, bm, mat)
def plane(w, h, loc=(0, 0, 0), mat='M_Banner', rot=(0, 0, 0), name='Plane', nx=1, ny=1, fn=None):
    """Vertical plane in XZ (faces -Y), UV 0..1. fn(u,v)->offset Vector for cloth-like shaping."""
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); g = [[bm.verts.new(Vector(((i / nx - .5) * w, 0, (j / ny - .5) * h)) + (fn(i / nx, j / ny) if fn else Vector())) for i in range(nx + 1)] for j in range(ny + 1)]
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new((g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]))
            for lp, (a, b) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))): lp[uvl].uv = (a / nx, b / ny)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); C.collection.objects.link(o); me.materials.append(M(mat)); o.location = loc; o.rotation_euler = rot
    for p in me.polygons: p.use_smooth = True
    o['keep_uv'] = 1; return o
def box_uv(o, scale=.5):
    """Metre-scaled tri-planar box UVs (world space after transforms are applied)."""
    me = o.data; uv = me.uv_layers.get('UVMap') or me.uv_layers.new(name='UVMap')
    for p in me.polygons:
        n = p.normal; a = (abs(n.x), abs(n.y), abs(n.z)); ax = a.index(max(a))
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = ((co.y, co.z) if ax == 0 else (co.x, co.z) if ax == 1 else (co.x, co.y)); uv.data[li].uv = (uv.data[li].uv[0] * scale, uv.data[li].uv[1] * scale)
def vcol(o, fn):
    """fn(co, normal) -> (r,g,b) raw sRGB 0..1 per vertex."""
    me = o.data; cl = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    for li, lp in enumerate(me.loops):
        v = me.vertices[lp.vertex_index]; c = fn(v.co, v.normal); cl.data[li].color_srgb = (*c, 1)
def apply(o):
    for x in C.scene.objects: x.select_set(x is o)
    C.view_layer.objects.active = o; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
def finish(name, parts, out_dir, uv_scale=.5, origin=(0, 0, 0)):
    """Apply transforms, box-UV everything without authored UVs, join per asset and export <name>.glb."""
    for o in parts:
        apply(o)
        if not o.get('keep_uv'): box_uv(o, uv_scale)
        if not o.data.color_attributes.get('Col'): pass
    for x in C.scene.objects: x.select_set(x in parts)
    C.view_layer.objects.active = parts[0]
    if len(parts) > 1: bpy.ops.object.join()
    o = C.view_layer.objects.active; o.name = name; o.data.name = name
    os.makedirs(out_dir, exist_ok=True); export_glb(os.path.join(out_dir, name + '.glb'), [o])
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons); print('ASSET', name, 'tris', tris, 'size', tuple(round(d, 2) for d in o.dimensions))
    bpy.data.objects.remove(o, do_unlink=True); return tris
def lerp3(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def prism(pts, depth, mat='M_SignA', loc=(0, 0, 0), rot=(0, 0, 0), name='Prism', bevel=.012):
    """Extrude a 2D outline (x,z) along Y by depth; front (-Y) face gets 0..1 UVs (for sign icons)."""
    bm = bmesh.new(); f0 = [bm.verts.new((x, -depth / 2, z)) for x, z in pts]; f1 = [bm.verts.new((x, depth / 2, z)) for x, z in pts]; n = len(pts)
    bm.faces.new(f0); bm.faces.new(f1[::-1])
    for i in range(n): bm.faces.new((f0[i], f0[(i + 1) % n], f1[(i + 1) % n], f1[i]))
    if bevel: bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect='EDGES')
    uvl = bm.loops.layers.uv.new('UVMap'); xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
    for f in bm.faces:
        for lp in f.loops: lp[uvl].uv = ((lp.vert.co.x - min(xs)) / (max(xs) - min(xs)), (lp.vert.co.z - min(zs)) / (max(zs) - min(zs)))
    o = obj(name, bm, mat, smooth=False); o.location = loc; o.rotation_euler = rot; o['keep_uv'] = 1; return o
def ring(n, radius, fn, start=0):
    """Place fn(angle) objects around a circle; fn returns an object or list positioned at +X then we rotate about Z."""
    out = []
    for i in range(n):
        a = start + 2 * math.pi * i / n; res = fn(a, i); res = res if isinstance(res, list) else [res]
        for o in res:
            apply(o); o.data.transform(Matrix.Translation((radius, 0, 0))); o.data.transform(Matrix.Rotation(a, 4, 'Z')); out.append(o)
    return out
