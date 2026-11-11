"""Halo Isle GLB validator (pipeline step 8, static half; the render half is pipeline/shoot.mjs + the in-game harness).
python3 validate_glb.py assets/   -> checks every GLB listed in RULES; exit 1 on any failure."""
import sys, os, json, struct
ROOT = sys.argv[1] if len(sys.argv) > 1 else 'assets'
ALLOWED_EXT = {'KHR_materials_clearcoat', 'KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_specular',
               'KHR_materials_sheen', 'KHR_materials_emissive_strength', 'KHR_texture_transform', 'EXT_meshopt_compression', 'KHR_mesh_quantization'}
# path: (size range in metres [min,max] for the largest dimension, required clips, max triangles[, allowed sink below origin])
# Trees may sink up to 15 cm: the trunk base is buried on purpose so it never floats on sloped terrain.
RULES = {
    'characters/hero/hero.glb': ((0.9, 1.4), ['Idle', 'Walk', 'Run', 'JumpStart', 'Air', 'Land', 'Wave'], 30000),
    'environment/foliage/palm_a.glb': ((4.0, 8.0), [], 6000, 0.15),
    'environment/foliage/palm_b.glb': ((3.5, 8.0), [], 6000, 0.15),
    'environment/terrain/path_straight_4m.glb': ((3.9, 4.6), [], 2000),
    'environment/terrain/path_curve_30deg.glb': ((3.9, 4.8), [], 2000),
}
def read(p):
    b = open(p, 'rb').read()
    assert b[:4] == b'glTF', 'not a GLB'
    n = struct.unpack('<I', b[12:16])[0]; return json.loads(b[20:20 + n]), b
ok_all = True
for rel, rule in RULES.items():
    rng, clips, maxtri = rule[:3]; sink = rule[3] if len(rule) > 3 else 0.05
    p = os.path.join(ROOT, rel); errs = []; info = {}
    if not os.path.exists(p): print('FAIL', rel, 'missing'); ok_all = False; continue
    try:
        j, b = read(p)
        meshes = j.get('meshes', []); prims = [pr for m in meshes for pr in m['primitives']]
        if not prims: errs.append('no geometry')
        if any('material' not in pr for pr in prims): errs.append('primitive without material')
        mats = j.get('materials', []); info['materials'] = [m.get('name') for m in mats]
        for im in j.get('images', []):
            if 'uri' in im and not im['uri'].startswith('data:'): errs.append('external image ' + im['uri'])
        for bf in j.get('buffers', []):
            if 'uri' in bf: errs.append('external buffer ' + bf['uri'])
        for t in j.get('textures', []):
            if t.get('source') is None or t['source'] >= len(j.get('images', [])): errs.append('texture without image')
        bad = set(j.get('extensionsRequired', []) + j.get('extensionsUsed', [])) - ALLOWED_EXT
        if bad: errs.append('unsupported extensions ' + ','.join(sorted(bad)))
        names = [a.get('name') for a in j.get('animations', [])]; info['clips'] = names
        miss = [c for c in clips if c not in names]
        if miss: errs.append('missing clips ' + ','.join(miss))
        tri = 0; lo = [1e9] * 3; hi = [-1e9] * 3
        for pr in prims:
            acc = j['accessors'][pr['attributes']['POSITION']]
            lo = [min(a, c) for a, c in zip(lo, acc['min'])]; hi = [max(a, c) for a, c in zip(hi, acc['max'])]
            tri += (j['accessors'][pr['indices']]['count'] if 'indices' in pr else acc['count']) // 3
        size = [round(h - l, 3) for l, h in zip(lo, hi)]; info['size_m'] = size; info['tris'] = tri
        if not (rng[0] <= max(size) <= rng[1]): errs.append(f'size {max(size)} m outside {rng}')
        if tri > maxtri: errs.append(f'{tri} tris > budget {maxtri}')
        if lo[1] < -sink: errs.append(f'geometry {lo[1]:.3f} m below origin (pivot should sit on the ground)')
        info['kb'] = round(len(b) / 1024)
    except Exception as e: errs.append('parse error ' + repr(e))
    print(('PASS' if not errs else 'FAIL'), rel, json.dumps(info), '; '.join(errs)); ok_all &= not errs
sys.exit(0 if ok_all else 1)
