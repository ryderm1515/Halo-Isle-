// Builds one self-contained "Halo Isle.html" (code, models, textures, audio all inline) so it opens by double-click.
import { execSync } from 'child_process'; import fs from 'fs'; import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), out = process.argv[2] || path.join(root, 'dist', 'Halo Isle.html');
execSync(`npx vite build -c ${path.join(root, 'tools/vite.single.mjs')}`, { cwd: root, stdio: 'inherit' });
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const A = path.join(root, 'public/assets'), b64 = (f) => fs.readFileSync(f).toString('base64');
const GLB = {}, TEX = {}, AUD = {};
for (const f of walk(A)) { const rel = path.relative(A, f);
  if (f.endsWith('.glb')) GLB[rel] = b64(f);
  else if (f.endsWith('.jpg')) TEX[path.relative(path.join(A, 'textures'), f)] = 'data:image/jpeg;base64,' + b64(f);
  else if (f.endsWith('.mp3')) AUD[path.basename(f, '.mp3')] = 'data:audio/mpeg;base64,' + b64(f); }
let html = fs.readFileSync('/tmp/single/index.html', 'utf8');
const js = fs.readFileSync(path.join('/tmp/single', html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1]), 'utf8'), css = fs.readFileSync(path.join('/tmp/single', html.match(/href="\.\/(assets\/[^"]+\.css)"/)[1]), 'utf8');
html = html.replace(/<script type="module"[^>]*><\/script>/, '').replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`);
const data = `<script>window.__GLB=${JSON.stringify(GLB)};window.__TEX=${JSON.stringify(TEX)};window.__AUD=${JSON.stringify(AUD)};</script>`;
html = html.replace('</body>', () => `${data}\n<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>\n</body>`);
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html); console.log('wrote', out, (html.length / 1e6).toFixed(1) + ' MB', Object.keys(GLB).length, 'models', Object.keys(TEX).length, 'textures', Object.keys(AUD).length, 'sounds');
