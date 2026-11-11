import * as T from 'three';
import { noise, fbm, ridged, sm, lerp } from '../util/noise.js';
import { PEAK, HIGH, SPOTS, PATHS } from './layout.js';
import { tex, avg } from './materials.js';

const adiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const gauss = (d, w) => Math.exp(-(d * d) / (w * w));
export function shoreDist(x, z) {   // +inside the island, metres from the waterline (approx.)
  const a = Math.atan2(z, x), r = Math.hypot(x, z);
  let R = 268 + 24 * Math.sin(a * 2 + 0.6) + 16 * Math.sin(a * 3 - 1.2) + 9 * Math.sin(a * 5 + 2.1) + noise(x * 0.006, z * 0.006) * 20;
  R -= 46 * gauss(adiff(a, 1.42), 0.36);          // south cove (resort beach)
  R += 62 * gauss(adiff(a, 3.02), 0.17);          // west cape (lighthouse)
  R += 30 * gauss(adiff(a, -0.75), 0.3);          // north-east shoulder (observatory)
  return R - r;
}
const flats = [];   // {x,z,r,h,soft}
export function addFlat(x, z, r, h, soft = 14) { flats.push({ x, z, r, h, soft }); }
addFlat(SPOTS.plaza.x, SPOTS.plaza.z, SPOTS.plaza.r, SPOTS.plaza.h, 20);

function baseHeight(x, z) {
  const d = shoreDist(x, z);
  let h;
  if (d < 0) h = Math.max(-16, d * 0.13 - 0.0009 * d * d);
  else h = 2.6 * sm(0, 36, d) + 5.2 * sm(30, 115, d) + fbm(x * 0.012, z * 0.012, 3) * 1.6 * sm(26, 80, d);
  const coast = sm(6, 34, d);
  const e = Math.hypot(x - HIGH.x, z - HIGH.z) + fbm(x * 0.009, z * 0.009, 3) * 34;      // highland plateaus with cliff edges
  h += 30 * sm(178, 163, e) * coast; h += 30 * sm(112, 98, e) * coast;
  h += fbm(x * 0.02 + 7, z * 0.02, 3) * 2.2 * sm(170, 150, e);
  const dm = Math.hypot(x - PEAK.x, z - PEAK.z), k = Math.max(0, 1 - dm / 108);          // Halo Peak
  h += 128 * Math.pow(k, 1.45) + (ridged(x * 0.022, z * 0.022, 4) - 0.6) * 22 * sm(0, 0.5, k) - 16 * sm(15, 0, dm);
  const L = SPOTS.lighthouse, dl = Math.hypot(x - L.x, z - L.z);
  h = lerp(h, Math.max(h, L.h), sm(64, 44, dl) * sm(2, 12, d));
  h += 14 * gauss(Math.hypot(x - SPOTS.windRidge.x, z - SPOTS.windRidge.z), 60) * coast;
  h += 16 * gauss(Math.hypot(x - SPOTS.observatory.x, z - SPOTS.observatory.z), 42) * coast;
  const K = SPOTS.lake, dk = Math.hypot((x - K.x) / 1.25, z - K.z);
  h -= 5.5 * sm(30, 12, dk);
  for (const f of flats) { const t = sm(f.r + f.soft, f.r, Math.hypot(x - f.x, z - f.z)); if (t > 0) h = lerp(h, f.h, t); }
  return h;
}
// footpaths: [dist to nearest path centre line, that path's height, width]
let roads = null;
function initRoads() { roads = PATHS.map((p) => ({ w: p.w, pts: p.pts.map(([x, z]) => ({ x, z, h: baseHeight(x, z) })) })); }
const _pi = { d: 1e9, h: 0, w: 0 };
export function pathInfo(x, z) {
  if (!roads) initRoads(); _pi.d = 1e9;
  for (const r of roads) for (let i = 0; i < r.pts.length - 1; i++) {
    const a = r.pts[i], b = r.pts[i + 1], abx = b.x - a.x, abz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz)));
    const d = Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)); if (d < _pi.d) { _pi.d = d; _pi.h = a.h + (b.h - a.h) * t; _pi.w = r.w; }
  }
  return _pi;
}
export function heightAt(x, z) {
  let h = baseHeight(x, z); const p = pathInfo(x, z);
  if (p.d < p.w + 5) h = lerp(h, p.h, sm(p.w + 5, p.w * 0.7, p.d));
  return h;
}
export function normalAt(x, z, out = new T.Vector3()) { const e = 0.6; return out.set(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(); }
export const inPlaza = (x, z) => Math.hypot(x - SPOTS.plaza.x, z - SPOTS.plaza.z) < SPOTS.plaza.r - 1;
// how much meadow grass grows here (0..1): not on sand, cliffs, paths, the plaza or the bare upper mountain
export function grassAt(x, z, h = heightAt(x, z)) {
  if (h < 2.7 || h > 118) return 0; const e = 0.8, sl = Math.hypot(heightAt(x + e, z) - h, heightAt(x, z + e) - h) / e; if (sl > 0.62) return 0;
  const p = pathInfo(x, z); if (p.d < p.w + 0.5) return 0; if (Math.hypot(x - SPOTS.plaza.x, z - SPOTS.plaza.z) < SPOTS.plaza.r + 1.5) return 0;
  return sm(2.7, 3.6, h) * sm(0.62, 0.4, sl) * sm(p.w + 0.5, p.w + 1.6, p.d);
}

export const WORLD = 840, RES = 420;
const SAND = new T.Color('#f7e2a8'), SANDW = new T.Color('#d8b77c'), G1 = new T.Color('#69c531'), G2 = new T.Color('#4aad2c'), G3 = new T.Color('#93d83e'),
  ROCK = new T.Color('#b0a086'), ROCK2 = new T.Color('#93866f'), PEAKC = new T.Color('#bca987'), SEAB = new T.Color('#e2d6a4'), PATHC = new T.Color('#c9bca8');

export function buildTerrain() {
  const n = RES + 1, geo = new T.BufferGeometry(), pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), spl = new Float32Array(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = (i / RES - 0.5) * WORLD, z = (j / RES - 0.5) * WORLD, k = j * n + i; pos[k * 3] = x; pos[k * 3 + 1] = heightAt(x, z); pos[k * 3 + 2] = z; }
  const idx = new Uint32Array(RES * RES * 6); let q = 0;
  for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(new T.BufferAttribute(idx, 1)); geo.computeVertexNormals();
  const nor = geo.attributes.normal.array, c = new T.Color();
  for (let k = 0; k < n * n; k++) {
    const x = pos[k * 3], h = pos[k * 3 + 1], z = pos[k * 3 + 2], ny = nor[k * 3 + 1], nz = noise(x * 0.03, z * 0.03), n2 = noise(x * 0.11 + 9, z * 0.11);
    let sand = sm(3.3 + nz * 0.5, 2.3 + nz * 0.4, h), cliff = sm(0.8, 0.64, ny) * sm(2.5, 5, h);
    const bare = Math.min(1, sm(92, 122, h + nz * 8) * 0.85 + sm(120, 150, h) * 0.6); cliff = Math.max(cliff, bare * 0.9);
    const p = pathInfo(x, z); let path = sm(p.w + 0.9, p.w - 0.2, p.d + n2 * 0.35); const dp = Math.hypot(x - SPOTS.plaza.x, z - SPOTS.plaza.z); path = Math.max(path, sm(SPOTS.plaza.r + 1.5, SPOTS.plaza.r - 0.5, dp));
    path *= 1 - cliff; sand *= (1 - cliff) * (1 - path); const grass = Math.max(0, 1 - sand - cliff - path);
    c.copy(G1).lerp(G2, sm(-0.5, 0.6, nz)).lerp(G3, sm(0.3, 0.9, n2) * 0.55).multiplyScalar(grass);
    const sc = SAND.clone().lerp(SANDW, sm(0.9, 0.0, h) * 0.75); if (h < -0.2) sc.lerp(SEAB, sm(-0.2, -3, h));
    c.r += sc.r * sand; c.g += sc.g * sand; c.b += sc.b * sand;
    const rc = (n2 > 0 ? ROCK : ROCK2).clone().lerp(PEAKC, bare); c.r += rc.r * cliff + PATHC.r * path; c.g += rc.g * cliff + PATHC.g * path; c.b += rc.b * cliff + PATHC.b * path;
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; spl[k * 4] = sand; spl[k * 4 + 1] = grass; spl[k * 4 + 2] = cliff; spl[k * 4 + 3] = path;
  }
  geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setAttribute('splat', new T.BufferAttribute(spl, 4));
  const U = { tS: { value: tex('coast_sand_01') }, tG: { value: tex('leafy_grass') }, tC: { value: tex('cliff_side') }, tP: { value: tex('rectangular_paving') }, nG: { value: tex('leafy_grass', 'nor_gl') }, nC: { value: tex('cliff_side', 'nor_gl') },
    aS: { value: avg('coast_sand_01') }, aG: { value: avg('leafy_grass') }, aC: { value: avg('cliff_side') }, aP: { value: avg('rectangular_paving') } };
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 splat;varying vec4 vSp;varying vec3 vWp;varying vec3 vWn;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSp=splat;vWp=(modelMatrix*vec4(position,1.)).xyz;vWn=normal;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D tS,tG,tC,tP,nG,nC;uniform vec3 aS,aG,aC,aP;varying vec4 vSp;varying vec3 vWp;varying vec3 vWn;
      vec3 det(sampler2D t,vec3 a,vec2 uv){vec3 c=texture2D(t,uv).rgb;return mix(vec3(1.),c/a,.85);}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec4 w=vSp/max(vSp.x+vSp.y+vSp.z+vSp.w,1e-3);
        vec2 uv=vWp.xz; vec3 an=abs(normalize(vWn)); vec2 uvc=an.x>an.z?vec2(vWp.z,vWp.y):vec2(vWp.x,vWp.y);
        vec3 dG=det(tG,aG,uv*.42)*mix(vec3(1.),det(tG,aG,uv*.061),.6);
        vec3 dS=det(tS,aS,uv*.3)*mix(vec3(1.),det(tS,aS,uv*.043),.4);
        vec3 dC=mix(det(tC,aC,uvc*.085),det(tC,aC,uv*.085),smoothstep(.55,.8,an.y))*mix(vec3(1.),det(tC,aC,uvc*.017),.5);
        vec3 dP=det(tP,aP,uv*.34);
        vec3 d=dS*w.x+dG*w.y+dC*w.z+dP*w.w;
        diffuseColor.rgb*=clamp(d,0.,1.7);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec4 w2=vSp/max(vSp.x+vSp.y+vSp.z+vSp.w,1e-3); vec3 an2=abs(normalize(vWn)); vec2 uvc2=an2.x>an2.z?vec2(vWp.z,vWp.y):vec2(vWp.x,vWp.y);
          vec3 tn=(texture2D(nG,vWp.xz*.42).xyz*2.-1.)*w2.y+(texture2D(nC,mix(uvc2,vWp.xz,smoothstep(.55,.8,an2.y))*.085).xyz*2.-1.)*(w2.z*1.6)+vec3(0.,0.,1.)*(w2.x+w2.w);
          vec3 wn=normalize(vWn+vec3(tn.x,0.,-tn.y)*.55); normal=normalize((viewMatrix*vec4(wn,0.)).xyz); }`);
  };
  const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; mesh.castShadow = true; mesh.name = 'Terrain';
  // terrain map for shaders: R = height, G = meadow-grass amount
  const D = 1024, size = WORLD * 1.15, dd = new Float32Array(D * D * 4);
  for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) { const x = (i / (D - 1) - 0.5) * size, z = (j / (D - 1) - 0.5) * size, h = heightAt(x, z), k = (j * D + i) * 4; dd[k] = h; dd[k + 1] = h > 2.6 && h < 120 && Math.hypot(x, z) < 400 ? grassAt(x, z, h) : 0; }
  const depthTex = new T.DataTexture(dd, D, D, T.RGBAFormat, T.FloatType); depthTex.magFilter = depthTex.minFilter = T.LinearFilter; depthTex.needsUpdate = true;
  return { mesh, depthTex, depthSize: size };
}
