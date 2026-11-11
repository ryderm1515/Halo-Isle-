"""Phase 1 pipeline test build: phase6 HTML + GLB loader hook + js/90-pipeline-test.js + embedded GLBs.
python3 build_p1.py <phase6.html> <assets_dir> <out.html>"""
import sys, os, base64, json
src, assets, out = sys.argv[1:4]
here = os.path.dirname(os.path.abspath(__file__))
h = open(src).read()
old = 'return t.parseAsync(i.buffer,``)}'
assert h.count(old) == 1, h.count(old)
h = h.replace(old, old + 'window.__loadGLB=jh;', 1)
glbs = {'hero': 'characters/hero/hero.glb', 'palmA': 'environment/foliage/palm_a.glb', 'palmB': 'environment/foliage/palm_b.glb',
        'pathStraight': 'environment/terrain/path_straight_4m.glb', 'pathCurve': 'environment/terrain/path_curve_30deg.glb'}
data = {k: 'data:model/gltf-binary;base64,' + base64.b64encode(open(os.path.join(assets, v), 'rb').read()).decode() for k, v in glbs.items()}
js = open(os.path.join(here, '..', 'js', '90-pipeline-test.js')).read()
k = h.rindex('</body>')
h = h[:k] + '<script>window.__PIPE=' + json.dumps(data) + ';\n' + js + '\n</script>\n' + h[k:]
open(out, 'w').write(h); print('ok', len(h))
