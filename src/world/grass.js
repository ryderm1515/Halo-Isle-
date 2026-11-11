import * as T from 'three';
import { rng } from '../util/noise.js';
// Meadow grass + wildflowers. One static buffer of blades/flowers that wraps around the camera on the GPU (no per-frame CPU work);
// height and coverage come from the terrain map, and everything bends away from the hero as he runs through.
const VERT = `
uniform sampler2D tmap;uniform float tsize,tile,time;uniform vec3 cam,hero;uniform vec2 heroVel;
attribute vec3 offset;attribute vec4 info;   // info: x=along blade 0..1, y=random, z=kind(0 grass,1 flower), w=yaw
varying vec3 vCol;varying float vFade;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec2 base=mod(offset.xz-cam.xz+tile*.5,tile)-tile*.5+cam.xz;
  vec4 tm=texture2D(tmap,base/tsize+.5);
  float d=length(base-cam.xz), fade=smoothstep(tile*.5,tile*.34,d)*smoothstep(.25,.6,tm.g+info.y*.25-.12);
  float c=cos(info.w),s=sin(info.w); vec3 p=position; p.xz=mat2(c,-s,s,c)*p.xz; p*=mix(.75,1.25,info.y); p.y*=fade;
  float h=info.x;
  float w=sin(time*1.6+base.x*.35+base.y*.28)*.5+sin(time*2.7+base.x*.9)*.25;
  p.xz+=vec2(.07,.045)*w*h*h*(1.+info.z);
  vec2 away=base-hero.xz; float hd=length(away); float push=smoothstep(.95,.15,hd)*smoothstep(1.4,.0,abs(hero.y-tm.r));
  p.xz+=normalize(away+1e-4)*push*.22*h; p.y*=1.-push*.45*h;
  vec3 wp=vec3(base.x+p.x,tm.r+p.y,base.y+p.z);
  vCol=color; vFade=fade;
  vec4 mvPosition=viewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG = `
varying vec3 vCol;varying float vFade;
#include <common>
#include <fog_pars_fragment>
void main(){ if(vFade<.02) discard; gl_FragColor=vec4(vCol,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
export function buildGrass(depthTex, depthSize) {
  const TILE = 52, r = rng(99), pos = [], col = [], off = [], info = [], idx = [];
  const c1 = new T.Color(), cA = new T.Color('#2f9a22'), cB = new T.Color('#8fe03a'), cC = new T.Color('#c6ee5c');
  const vert = (x, y, z, c, o, i) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); off.push(o[0], 0, o[1]); info.push(...i); return pos.length / 3 - 1; };
  // --- grass tufts: 3 tapered blades each
  const NT = 64000;
  for (let n = 0; n < NT; n++) {
    const o = [r() * TILE, r() * TILE], rnd = r(), yaw = r() * 6.283, tint = r();
    for (let b = 0; b < 3; b++) {
      const a = b * 2.1 + r(), lean = 0.04 + r() * 0.07, hgt = (0.1 + r() * 0.09) * (b === 0 ? 1.15 : 0.85), w = 0.036 + r() * 0.02, dx = Math.cos(a), dz = Math.sin(a), px = -dz * w, pz = dx * w, bx = dx * 0.03, bz = dz * 0.03;
      const base = c1.copy(cA).lerp(cB, 0.15 + tint * 0.25).clone(), mid = c1.copy(cA).lerp(cB, 0.6 + tint * 0.3).clone(), tip = c1.copy(cB).lerp(cC, 0.3 + tint * 0.6).clone();
      const i0 = vert(bx - px, 0, bz - pz, base, o, [0, rnd, 0, yaw]), i1 = vert(bx + px, 0, bz + pz, base, o, [0, rnd, 0, yaw]);
      const i2 = vert(bx + dx * lean * 0.4 - px * 0.75, hgt * 0.5, bz + dz * lean * 0.4 - pz * 0.75, mid, o, [0.5, rnd, 0, yaw]), i3 = vert(bx + dx * lean * 0.4 + px * 0.75, hgt * 0.5, bz + dz * lean * 0.4 + pz * 0.75, mid, o, [0.5, rnd, 0, yaw]);
      const i4 = vert(bx + dx * lean, hgt, bz + dz * lean, tip, o, [1, rnd, 0, yaw]);
      idx.push(i0, i1, i2, i1, i3, i2, i2, i3, i4);
    }
  }
  // --- wildflowers in drifts: white / yellow / pink daisies and little blue ones
  const PAL = [['#ffffff', '#ffd83d'], ['#ffe14a', '#ff9f1c'], ['#ff9ec4', '#ffe66b'], ['#ffffff', '#ffd83d'], ['#9fd2ff', '#fff3a8']], stemC = new T.Color('#3aa52a');
  for (let cI = 0; cI < 190; cI++) {
    const cx = r() * TILE, cz = r() * TILE, pal = PAL[(r() * PAL.length) | 0], pc = new T.Color(pal[0]), cc = new T.Color(pal[1]), cnt = 6 + ((r() * 16) | 0), spread = 0.8 + r() * 1.8;
    for (let f = 0; f < cnt; f++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * spread, o = [(cx + Math.cos(a) * d + TILE) % TILE, (cz + Math.sin(a) * d + TILE) % TILE], rnd = r(), yaw = r() * 6.283, H = 0.13 + r() * 0.1, R = 0.075 + r() * 0.035, tilt = 0.25;
      const s0 = vert(-0.008, 0, 0, stemC, o, [0, rnd, 1, yaw]), s1 = vert(0.008, 0, 0, stemC, o, [0, rnd, 1, yaw]), s2 = vert(0, H, 0, stemC, o, [1, rnd, 1, yaw]); idx.push(s0, s1, s2);
      const ctr = vert(0, H + 0.012, 0, cc, o, [1, rnd, 1, yaw]); const ring = [];
      for (let k = 0; k < 12; k++) { const an = k / 12 * 6.283, rr = k % 2 ? R : R * 0.45; ring.push(vert(Math.cos(an) * rr, H + (k % 2 ? R * tilt : 0.004), Math.sin(an) * rr, k % 2 ? pc : pc.clone().lerp(cc, 0.25), o, [1, rnd, 1, yaw])); }
      for (let k = 0; k < 12; k++) idx.push(ctr, ring[(k + 1) % 12], ring[k]);
      const c2 = vert(0, H + 0.03, 0, cc, o, [1, rnd, 1, yaw]), rc = []; for (let k = 0; k < 6; k++) { const an = k / 6 * 6.283; rc.push(vert(Math.cos(an) * R * 0.36, H + 0.014, Math.sin(an) * R * 0.36, cc.clone().multiplyScalar(0.85), o, [1, rnd, 1, yaw])); }
      for (let k = 0; k < 6; k++) idx.push(c2, rc[(k + 1) % 6], rc[k]);
    }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setAttribute('offset', new T.Float32BufferAttribute(off, 3)); geo.setAttribute('info', new T.Float32BufferAttribute(info, 4)); geo.setIndex(idx);
  const U = T.UniformsUtils.merge([T.UniformsLib.fog, { tmap: { value: null }, tsize: { value: depthSize }, tile: { value: TILE }, time: { value: 0 }, cam: { value: new T.Vector3() }, hero: { value: new T.Vector3() }, heroVel: { value: new T.Vector2() } }]); U.tmap.value = depthTex;
  const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, vertexColors: true, side: T.DoubleSide, fog: true });
  const mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'Meadow';
  return { mesh, update(dt, camPos, heroPos) { U.time.value += dt; U.cam.value.copy(camPos); U.hero.value.copy(heroPos); } };
}
