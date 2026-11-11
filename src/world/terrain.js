import * as T from 'three';
import { noise, fbm, ridged, sm, lerp } from '../util/noise.js';
import { PEAK, HIGH, SPOTS } from './layout.js';

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

export function heightAt(x, z) {
  const d = shoreDist(x, z);
  let h;
  if (d < 0) h = Math.max(-16, d * 0.13 - 0.0009 * d * d);
  else h = 2.6 * sm(0, 36, d) + 5.2 * sm(30, 115, d) + fbm(x * 0.012, z * 0.012, 3) * 1.6 * sm(26, 80, d);
  const coast = sm(6, 34, d);
  // highland plateaus with cliff edges
  const e = Math.hypot(x - HIGH.x, z - HIGH.z) + fbm(x * 0.009, z * 0.009, 3) * 34;
  h += 30 * sm(178, 163, e) * coast;
  h += 30 * sm(112, 98, e) * coast;
  h += fbm(x * 0.02 + 7, z * 0.02, 3) * 2.2 * sm(170, 150, e);
  // Halo Peak
  const dm = Math.hypot(x - PEAK.x, z - PEAK.z), k = Math.max(0, 1 - dm / 108);
  h += 128 * Math.pow(k, 1.45) + (ridged(x * 0.022, z * 0.022, 4) - 0.6) * 22 * sm(0, 0.5, k) - 16 * sm(15, 0, dm);
  // west cape table, wind ridge and observatory hills
  const L = SPOTS.lighthouse, dl = Math.hypot(x - L.x, z - L.z);
  h = lerp(h, Math.max(h, L.h), sm(64, 44, dl) * sm(2, 12, d));
  h += 14 * gauss(Math.hypot(x - SPOTS.windRidge.x, z - SPOTS.windRidge.z), 60) * coast;
  h += 16 * gauss(Math.hypot(x - SPOTS.observatory.x, z - SPOTS.observatory.z), 42) * coast;
  // lake basin on the first plateau
  const K = SPOTS.lake, dk = Math.hypot((x - K.x) / 1.25, z - K.z);
  h -= 5.5 * sm(30, 12, dk);
  for (const f of flats) { const t = sm(f.r + f.soft, f.r, Math.hypot(x - f.x, z - f.z)); if (t > 0) h = lerp(h, f.h, t); }
  return h;
}
export function normalAt(x, z, out = new T.Vector3()) {
  const e = 0.6; return out.set(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize();
}

export const WORLD = 840, RES = 420;   // terrain covers WORLD m with RES cells per side
const SAND = new T.Color('#f3dca0'), SANDW = new T.Color('#d9b97a'), G1 = new T.Color('#62cc2c'), G2 = new T.Color('#3fa82a'), G3 = new T.Color('#8fdc3c'),
  ROCK = new T.Color('#a08f73'), ROCK2 = new T.Color('#7f745f'), PEAKC = new T.Color('#b39f7c'), SEAB = new T.Color('#d9d2a8');

function detailTex() {   // tiling grayscale detail (soft mottling + fine grain) so nothing reads as flat colour
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'), im = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const u = x / s * Math.PI * 2, v = y / s * Math.PI * 2;   // torus-mapped noise = seamless
    const n1 = fbm(Math.cos(u) * 1.6 + 5, Math.sin(u) * 1.6 + Math.cos(v) * 1.6, 4), n2 = noise(Math.cos(u) * 9 + Math.sin(v) * 9, Math.sin(u) * 9 + Math.cos(v) * 9);
    const val = 200 + n1 * 70 + n2 * 22, i = (y * s + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.max(0, Math.min(255, val)); im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t;
}

export function buildTerrain() {
  const n = RES + 1, geo = new T.BufferGeometry(), pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), H = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i / RES - 0.5) * WORLD, z = (j / RES - 0.5) * WORLD, h = heightAt(x, z), k = j * n + i;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; H[k] = h;
  }
  const idx = new Uint32Array(RES * RES * 6); let q = 0;
  for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(new T.BufferAttribute(idx, 1)); geo.computeVertexNormals();
  const nor = geo.attributes.normal.array, c = new T.Color(), cs = WORLD / RES;
  for (let k = 0; k < n * n; k++) {
    const x = pos[k * 3], h = pos[k * 3 + 1], z = pos[k * 3 + 2], ny = nor[k * 3 + 1], nz = noise(x * 0.03, z * 0.03), n2 = noise(x * 0.11 + 9, z * 0.11);
    const dm = Math.hypot(x - PEAK.x, z - PEAK.z);
    c.copy(G1).lerp(G2, sm(-0.5, 0.6, nz)).lerp(G3, sm(0.3, 0.9, n2) * 0.5);                      // meadow
    const beach = sm(3.2 + nz * 0.5, 2.1 + nz * 0.4, h); c.lerp(SAND, beach); c.lerp(SANDW, sm(0.7, 0.05, h) * beach * 0.7);
    if (h < -0.2) c.lerp(SEAB, sm(-0.2, -3, h));
    const steep = sm(0.80, 0.62, ny); c.lerp(n2 > 0 ? ROCK : ROCK2, steep * sm(3, 6, h));     // cliffs
    c.lerp(PEAKC, sm(92, 122, h + nz * 8) * sm(0.97, 0.9, ny + 0.0) * 0.9 + sm(120, 150, h) * 0.6);   // bare upper mountain
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const det = detailTex();
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uDet = { value: det };
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp=(modelMatrix*vec4(position,1.)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uDet;varying vec3 vWp;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float dA=texture2D(uDet,vWp.xz*.11).r, dB=texture2D(uDet,vWp.xz*.017+.3).r, dC=texture2D(uDet,vec2(vWp.x+vWp.z,vWp.y*2.2)*.06).r;
        float steepF=smoothstep(.82,.6,normalize(vNormal).y);
        diffuseColor.rgb*=mix(mix(.86,1.1,dA)*mix(.9,1.08,dB), mix(.7,1.15,dC), steepF);`);
  };
  const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; mesh.castShadow = true; mesh.name = 'Terrain';
  // depth texture for the water shader (R = terrain height)
  const D = 512, dd = new Float32Array(D * D * 4);
  for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) { const x = (i / (D - 1) - 0.5) * WORLD * 1.15, z = (j / (D - 1) - 0.5) * WORLD * 1.15; dd[(j * D + i) * 4] = heightAt(x, z); }
  const depthTex = new T.DataTexture(dd, D, D, T.RGBAFormat, T.FloatType); depthTex.magFilter = depthTex.minFilter = T.LinearFilter; depthTex.needsUpdate = true;
  return { mesh, depthTex, depthSize: WORLD * 1.15, cell: cs };
}
