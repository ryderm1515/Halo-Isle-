"""Shared helpers for Halo Isle Blender asset scripts (bpy 5.x, headless or live)."""
import bpy, bmesh, math
from mathutils import Vector, Matrix

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'

def mat(name, color, rough=0.5, metal=0.0, clearcoat=0.0, cc_rough=0.1, emission=None, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = clearcoat
    b.inputs['Coat Roughness'].default_value = cc_rough
    if emission:
        b.inputs['Emission Color'].default_value = (*emission, 1); b.inputs['Emission Strength'].default_value = 1.0
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def lathe(name, profile, segs=32):
    """profile: list of (r, z). Returns mesh object revolved around Z (closed caps when r==0)."""
    bm = bmesh.new(); rings = []
    for r, z in profile:
        if r < 1e-5:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for a in (2 * math.pi * i / segs for i in range(segs))])
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1 and len(b) == 1: continue
        if len(a) == 1:
            for i in range(segs): bm.faces.new((a[0], b[i], b[(i + 1) % segs]))
        elif len(b) == 1:
            for i in range(segs): bm.faces.new((a[i], b[0], a[(i + 1) % segs]))
        else:
            for i in range(segs): bm.faces.new((a[i], b[i], b[(i + 1) % segs], a[(i + 1) % segs]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    return ob

def ellipsoid(name, center, radii, segs=32, rings=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2])) + Vector(center)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    return ob

def smooth_profile(points, n=6):
    """Catmull-Rom resample of a 2D polyline for smoother lathe profiles."""
    out = []
    P = [points[0]] + points + [points[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector(P[j]) for j in (i - 1, i, i + 1, i + 2))
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)))
    out.append(points[-1]); return out

def auto_uv(ob, angle=66):
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects: o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

def export_glb(path, objects=None, anim=False, anim_mode='ACTIONS'):
    for o in bpy.context.scene.objects: o.select_set(objects is None or o in objects)
    kw = dict(filepath=path, export_format='GLB', use_selection=objects is not None, export_yup=True,
              export_apply=True, export_animations=anim, export_texcoords=True, export_normals=True,
              export_materials='EXPORT', export_image_format='AUTO')
    if anim:
        kw.update(export_animation_mode=anim_mode, export_force_sampling=True, export_frame_step=1, export_def_bones=True, export_optimize_animation_size=True)
    bpy.ops.export_scene.gltf(**kw)

def hexc(h):
    """Raw sRGB 0-1 triple for byte vertex-colour layers (Blender stores those as sRGB)."""
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
