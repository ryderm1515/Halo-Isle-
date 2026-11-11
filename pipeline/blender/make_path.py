"""Halo Isle modular stone path (straight 4 m + 30 degree curve) with the Poly Haven CC0 'Stone Pathway' texture.
Runs inside a live Blender (it was run through the Blender MCP execute_code on Ryder's Mac, Blender 5.2.2) or headless:
    blender -b -P make_path.py -- <assets_dir>
Steps: download maps from the Poly Haven API + record license -> grade & bake a stylised base colour (Cycles EMIT bake)
-> build terrain-conforming-ready strips with a soft lip -> export GLB (JPEG textures) -> save path.blend.
Works in its own scene so an open file is left untouched."""
import bpy, os, sys, json, math, bmesh, urllib.request, datetime
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
base = argv[0] if argv else os.path.expanduser('~/coding/halo-isle-pipeline/assets')
AID = 'stone_pathway'; tdir = os.path.join(base, 'textures/stone', AID); odir = os.path.join(base, 'environment/terrain')
os.makedirs(tdir, exist_ok=True); os.makedirs(odir, exist_ok=True)
H = {'User-Agent': 'halo-isle-pipeline'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60).read()
# 1) download + license record
info = json.loads(get(f'https://api.polyhaven.com/info/{AID}')); files = json.loads(get(f'https://api.polyhaven.com/files/{AID}'))
maps = {}
for key, ph in (('diff', 'Diffuse'), ('nor_gl', 'nor_gl'), ('rough', 'Rough'), ('ao', 'AO')):
    url = (files.get(ph) or files[key])['1k']['jpg']['url']; p = os.path.join(tdir, os.path.basename(url)); open(p, 'wb').write(get(url)); maps[key] = os.path.basename(p)
json.dump({'asset': AID, 'name': info['name'], 'source': f'https://polyhaven.com/a/{AID}', 'authors': info.get('authors'),
           'license': 'CC0 1.0', 'license_url': 'https://polyhaven.com/license', 'downloaded': datetime.date.today().isoformat(), 'maps': maps},
          open(os.path.join(tdir, 'LICENSE.json'), 'w'), indent=1)
win = bpy.context.window; prev = win.scene if win else None
sc = bpy.data.scenes.new('HaloPath')
if win: win.scene = sc
sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'
def img(name, cs='sRGB'):
    i = bpy.data.images.load(os.path.join(tdir, name), check_existing=False); i.colorspace_settings.name = cs; return i
# 2) grade toward the concept art (warm sandstone, light, low noise) and bake
baked = bpy.data.images.new('stone_pathway_halo_basecolor', 1024, 1024)
gm = bpy.data.materials.new('Grade'); gm.use_nodes = True; N = gm.node_tree.nodes; L = gm.node_tree.links
for n in list(N): N.remove(n)
tc = N.new('ShaderNodeTexCoord'); d = N.new('ShaderNodeTexImage'); d.image = img(maps['diff']); ao = N.new('ShaderNodeTexImage'); ao.image = img(maps['ao'], 'Non-Color')
L.new(tc.outputs['UV'], d.inputs['Vector']); L.new(tc.outputs['UV'], ao.inputs['Vector'])
hs = N.new('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value = .45; hs.inputs['Value'].default_value = 1.45
bc = N.new('ShaderNodeBrightContrast'); bc.inputs['Bright'].default_value = .03; bc.inputs['Contrast'].default_value = -.3
tint = N.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs['Factor'].default_value = 1; tint.inputs['B'].default_value = (1.0, .80, .64, 1)
aom = N.new('ShaderNodeMix'); aom.data_type = 'RGBA'; aom.blend_type = 'MULTIPLY'; aom.inputs['Factor'].default_value = .4
em = N.new('ShaderNodeEmission'); out = N.new('ShaderNodeOutputMaterial'); bt = N.new('ShaderNodeTexImage'); bt.image = baked
L.new(d.outputs['Color'], hs.inputs['Color']); L.new(hs.outputs['Color'], bc.inputs['Color']); L.new(bc.outputs['Color'], tint.inputs['A'])
L.new(tint.outputs['Result'], aom.inputs['A']); L.new(ao.outputs['Color'], aom.inputs['B']); L.new(aom.outputs['Result'], em.inputs['Color']); L.new(em.outputs['Emission'], out.inputs['Surface']); N.active = bt
me = bpy.data.meshes.new('BakePlane'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1, calc_uvs=True); bm.to_mesh(me); bm.free()
bp = bpy.data.objects.new('BakePlane', me); sc.collection.objects.link(bp); me.materials.append(gm)
for o in sc.objects: o.select_set(o == bp)
bpy.context.view_layer.objects.active = bp; bpy.ops.object.bake(type='EMIT', margin=4)
baked.filepath_raw = os.path.join(tdir, 'stone_pathway_halo_basecolor.jpg'); baked.file_format = 'JPEG'; baked.save(); bpy.data.objects.remove(bp, do_unlink=True)
# 3) export material: baked colour x vertex colour, CC0 roughness + normal (strength 0.6)
m = bpy.data.materials.new('Path_Stone'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
for n in list(N): N.remove(n)
bs = N.new('ShaderNodeBsdfPrincipled'); out = N.new('ShaderNodeOutputMaterial'); L.new(bs.outputs['BSDF'], out.inputs['Surface'])
c = N.new('ShaderNodeTexImage'); c.image = img('stone_pathway_halo_basecolor.jpg')
r = N.new('ShaderNodeTexImage'); r.image = img(maps['rough'], 'Non-Color'); L.new(r.outputs['Color'], bs.inputs['Roughness'])
n = N.new('ShaderNodeTexImage'); n.image = img(maps['nor_gl'], 'Non-Color'); nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = .6
L.new(n.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], bs.inputs['Normal'])
vc = N.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
L.new(c.outputs['Color'], mix.inputs['A']); L.new(vc.outputs['Color'], mix.inputs['B']); L.new(mix.outputs['Result'], bs.inputs['Base Color'])
TILE = 3.2  # stones read 0.4-0.6 m next to the 1 m hero, as in the concept art
def segment(name, length=4.0, width=2.4, angle=0.0, nl=20, nw=14):
    """Strip along +Y (= -Z in three.js). angle>0 makes an arc piece. Soft rounded lip into the ground; lip darkened via vertex colour."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); col = bm.loops.layers.color.new('Col')
    hw = width / 2; lip = .22; top = .06; xs = [-hw - lip + (width + 2 * lip) * j / nw for j in range(nw + 1)]; R = length / angle if angle else None; grid = []
    for i in range(nl + 1):
        s = i / nl * length; row = []
        for x in xs:
            ax = abs(x); z = top + .012 * (1 - (ax / hw) ** 2) if ax <= hw else top * math.cos((ax - hw) / lip * math.pi / 2) ** 1.4
            p = Vector((R - (R - x) * math.cos(s / R), (R - x) * math.sin(s / R), z)) if R else Vector((x, s, z))
            row.append((bm.verts.new(p), x, s, ax))
        grid.append(row)
    for i in range(nl):
        for j in range(nw):
            q = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]]; f = bm.faces.new([e[0] for e in q]); f.smooth = True
            for lp, e in zip(f.loops, q):
                lp[uv].uv = (e[1] / TILE + .5, e[2] / TILE); k = 1.0 if e[3] <= hw else max(.82, 1 - (e[3] - hw) / lip * .25); lp[col] = (k, k, k, 1)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob
straight = segment('Path_Straight_4m'); curve = segment('Path_Curve_30deg', angle=math.radians(30))
for ob in (straight, curve):
    for o in sc.objects: o.select_set(o == ob)
    bpy.ops.export_scene.gltf(filepath=os.path.join(odir, ob.name.lower() + '.glb'), export_format='GLB', use_selection=True,
                              export_image_format='JPEG', export_jpeg_quality=88, export_vertex_color='ACTIVE')
curve.location.x = 4
bpy.data.libraries.write(os.path.join(odir, 'path.blend'), {straight, curve, sc}, path_remap='RELATIVE_ALL')
if win and prev: win.scene = prev
print('PATH_OK')
