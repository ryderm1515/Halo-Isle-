import * as T from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { makeEyeAtlas } from './eyes.js';
import { sm, damp, clamp, lerp } from '../util/noise.js';

export const TINTS = { sky: ['#5fc4fb', '#2f9cf5', 'Sky Blue', 0], mint: ['#63e6b4', '#1fbf88', 'Mint', 60], peach: ['#ffb38a', '#ff8a5c', 'Peach', 60], grape: ['#b79bff', '#8a63f0', 'Grape', 90], lemon: ['#ffe566', '#f5c518', 'Lemon', 90], rose: ['#ff9cc0', '#f76a9c', 'Rose', 120], pearl: ['#f2f7ff', '#bcd4f5', 'Pearl', 200], tide: ['#4fe0e6', '#16b3c4', 'Tide', 120] };
// Wardrobe: hats sit on the head bone, leaf styles recolour the sprout.
export const HATS = { none: ['No hat', 0], straw: ['Straw Hat', 40], cap: ['Sun Cap', 40], flower: ['Flower Crown', 60], crown: ['Tiny Crown', 150], shades: ['Shades', 80], headphones: ['Headphones', 90] };
export const LEAVES = { green: ['Fresh Green', 0, [1, 1, 1], '#7fd03a'], gold: ['Golden', 80, [2.3, 1.15, 0.5], '#f2c230'], pink: ['Blossom', 60, [2.5, 0.72, 3.6], '#ff8fc0'], autumn: ['Autumn', 60, [2.5, 0.62, 0.3], '#f08a2c'], frost: ['Frost', 100, [1.3, 1.12, 5.2], '#a8ecdf'] };
function buildHat(kind) {
  const g = new T.Group(), M = (c, o = {}) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.6, ...o }), add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const lathe = (pts, seg = 28) => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), seg);
  if (kind === 'straw') { add(lathe([[0.4, 0.0], [0.39, 0.02], [0.2, 0.035], [0.19, 0.12], [0.15, 0.17], [0, 0.185]]), M('#e9c77b', { side: T.DoubleSide })); add(lathe([[0.2, 0.04], [0.205, 0.04], [0.2, 0.09], [0.195, 0.09]]), M('#3f9ff2')); g.position.set(0.03, 0.345, 0); g.rotation.z = -0.08; }
  else if (kind === 'cap') { add(new T.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#ff6b5c')); const b = add(new T.CylinderGeometry(0.19, 0.19, 0.015, 24, 1, false, -1.1, 2.2), M('#ffffff')); b.position.set(0, 0.01, 0.13); b.scale.z = 1.3; add(new T.SphereGeometry(0.025, 8, 6), M('#ffffff'), 0, 0.2, 0); g.position.set(0, 0.33, 0.02); g.rotation.x = -0.12; }
  else if (kind === 'flower') { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, c = ['#ff8fb5', '#ffd23f', '#ffffff'][i % 3]; const f = add(new T.SphereGeometry(0.05, 10, 8), M(c), Math.cos(a) * 0.235, 0, Math.sin(a) * 0.22); f.scale.y = 0.6; add(new T.SphereGeometry(0.02, 6, 5), M('#ffb21f'), Math.cos(a) * 0.235, 0.025, Math.sin(a) * 0.22); } add(new T.TorusGeometry(0.228, 0.014, 6, 30).rotateX(Math.PI / 2), M('#4fae2e')); g.position.set(0, 0.27, 0); g.rotation.x = -0.1; }
  else if (kind === 'crown') { const m = M('#ffd23f', { metalness: 0.8, roughness: 0.25 }); add(new T.CylinderGeometry(0.11, 0.1, 0.07, 16, 1, true), m).material.side = T.DoubleSide; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(new T.ConeGeometry(0.03, 0.08, 6), m, Math.cos(a) * 0.105, 0.07, Math.sin(a) * 0.105); add(new T.SphereGeometry(0.014, 6, 5), M(i % 2 ? '#ff5c8a' : '#5fd0ff', { emissive: i % 2 ? '#ff5c8a' : '#5fd0ff', emissiveIntensity: 0.4 }), Math.cos(a) * 0.11, 0.0, Math.sin(a) * 0.11); } g.position.set(-0.07, 0.4, 0); g.rotation.z = 0.2; }
  else if (kind === 'shades') { const m = M('#1b2340', { roughness: 0.1, clearcoat: 1 }); for (const sx of [-1, 1]) add(new T.CylinderGeometry(0.075, 0.075, 0.02, 20).rotateX(Math.PI / 2), m, sx * 0.09, 0, 0); add(new T.BoxGeometry(0.06, 0.012, 0.012), m, 0, 0.01, 0); for (const sx of [-1, 1]) { const arm = add(new T.BoxGeometry(0.012, 0.012, 0.22), m, sx * 0.165, 0.01, -0.1); arm.rotation.y = sx * -0.25; } g.position.set(0, 0.21, 0.262); }
  else if (kind === 'headphones') { const m = M('#ffffff', { roughness: 0.3, clearcoat: 0.6 }), c = M('#3f9ff2'); add(new T.TorusGeometry(0.3, 0.02, 8, 30, Math.PI), m); for (const sx of [-1, 1]) { add(new T.CylinderGeometry(0.08, 0.08, 0.06, 18).rotateZ(Math.PI / 2), c, sx * 0.31, -0.02, 0); add(new T.CylinderGeometry(0.06, 0.06, 0.065, 18).rotateZ(Math.PI / 2), m, sx * 0.31, -0.02, 0); } g.position.set(0, 0.2, 0); }
  return g;
}
export function jellyMaterial() {
  const m = new T.MeshPhysicalMaterial({ color: '#5fc4fb', roughness: 0.13, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, emissive: '#2f9cf5', emissiveIntensity: 0.5, envMapIntensity: 4.2, sheen: 0.4, sheenColor: '#bfeaff', sheenRoughness: 0.4 });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      { vec3 V=normalize(vViewPosition); float f=1.-clamp(dot(normalize(vNormal),V),0.,1.);
        float rim=pow(f,2.4); float core=pow(1.-f,3.);
        gl_FragColor.rgb=mix(gl_FragColor.rgb, gl_FragColor.rgb*vec3(.80,.93,1.06), core*.35);      // deeper, wetter centre
        gl_FragColor.rgb+=vec3(.62,.88,1.)*rim*.4;                                                   // soft light wrapping the edge (jelly rim)
        float up=clamp(normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz).y*0.+.5+.5*dot(normalize(vNormal),normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz)),0.,1.);
        gl_FragColor.rgb*=mix(.86,1.08,up); }`);
  };
  return m;
}

const BONES = ['root', 'body', 'head', 'armL', 'armR', 'footL', 'footR', 'leaf1', 'leaf2', 'leaf3'];
let heroGltf = null;
export async function createHero(loader, opts = {}) {
  heroGltf ||= await loader.loadAsync('./assets/characters/hero/hero.glb');
  const model = SkeletonUtils.clone(heroGltf.scene), eyes = makeEyeAtlas(), jelly = jellyMaterial();
  model.traverse((o) => {
    if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
    const n = o.material.name;
    if (n === 'Hero_Jelly') o.material = jelly;
    else if (n === 'Hero_Leaf') o.material = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.12, side: T.DoubleSide, emissive: '#2e7d12', emissiveIntensity: 0.25 });
    else if (n.startsWith('Hero_Eye')) { o.material = new T.MeshBasicMaterial({ map: n.endsWith('L') ? eyes.L : eyes.R, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }); o.castShadow = false; o.renderOrder = 2; }
  });
  const group = new T.Group(), squash = new T.Group(); squash.add(model); group.add(squash); group.name = 'Hero';
  group.updateMatrixWorld(true);
  const B = {}, rest = {}, q = new T.Quaternion(), e = new T.Euler(), D = new T.Quaternion();
  for (const n of BONES) { const b = model.getObjectByName(n); B[n] = b; const P = new T.Quaternion(); b.parent.getWorldQuaternion(P); rest[n] = { q: b.quaternion.clone(), p: b.position.clone(), P, Pi: P.clone().invert() }; }
  // rotate a bone by a model-space euler (x: pitch fwd+, y: yaw, z: roll) relative to its rest pose
  const rot = (n, x, y, z) => { const r = rest[n]; D.setFromEuler(e.set(x, y, z, 'YXZ')); B[n].quaternion.copy(r.Pi).multiply(D).multiply(r.P).multiply(r.q); };
  const pos = (n, x, y, z) => { const r = rest[n]; q.copy(r.Pi); B[n].position.copy(r.p).add(new T.Vector3(x, y, z).applyQuaternion(q)); };

  const A = { t: 0, phase: 0, move: 0, air: 0, sq: 0, sqV: 0, leafY: 0, leafYV: 0, leafZ: 0, leafZV: 0, lookY: 0, lookX: 0, lookTY: 0, lookTX: 0, lookT: 2, tilt: 0, tiltT: 0,
    blinkT: 2.5, blink: 0, idle: 0, emote: null, emoteT: 0, expr: 'neutral', sit: 0, sleep: 0, wob: 0, wobV: 0, lean: 0, roll: 0, hop: 0 };
  const EM = { wave: 2.2, celebrate: 1.9, surprised: 0.9, confused: 2.2, happy: 1.6, love: 2.2, laugh: 1.8, sad: 2.2, think: 2.6, determined: 1.6 };
  const api = {
    group, bones: B, anim: A, jelly,
    setTint(k) { const t = TINTS[k] || TINTS.sky; jelly.color.set(t[0]); jelly.emissive.set(t[1]); },
    setHat(k) { if (api.hat) { B.head.remove(api.hat); api.hat = null; } if (k && k !== 'none' && HATS[k]) { api.hat = buildHat(k); B.head.add(api.hat); } },
    setLeaf(k) { const L = LEAVES[k] || LEAVES.green; model.traverse((o) => { if (o.isMesh && o.material.vertexColors && o.material !== jelly) o.material.color.setRGB(...L[2]); }); },
    emote(name) { if (!EM[name]) return; A.emote = name; A.emoteT = 0; A.idle = 0; if (name === 'surprised' || name === 'celebrate') A.sqV += 4; },
    setExpression(n) { A.expr = n; },
    get emoting() { return A.emote; },
    update(dt, s) {
      A.t += dt; const t = A.t, sp = s.speed, run = sm(2.5, 7, sp);
      const moving = s.grounded && sp > 0.4;
      A.phase += dt * (moving ? 6.2 + sp * 1.55 : 0);
      A.move = damp(A.move, moving ? 1 : 0, 11, dt); A.air = damp(A.air, s.grounded ? 0 : 1, 14, dt);
      A.slide = damp(A.slide || 0, s.sliding ? 1 : 0, 12, dt); A.skid = damp(A.skid || 0, s.skid ? 1 : 0, 14, dt);
      A.lean = damp(A.lean, (moving ? 0.1 + run * 0.2 + (s.sprint ? 0.12 : 0) : 0) - A.skid * 0.4 - A.slide * 0.75, 9, dt); A.roll = damp(A.roll, clamp(-s.turn * 0.07, -0.3, 0.3) * A.move, 8, dt);
      if (s.sitting) A.idle = Math.min(A.idle, 30); if ((moving || !s.grounded || s.input) && !s.sitting) { if (A.sleep > 0.5) api.emote('surprised'); A.idle = 0; } else A.idle += dt;
      // squash & stretch spring
      if (s.justJumped) A.sqV += 5.2;
      if (s.justLanded) { A.sqV -= clamp(s.landSpeed * 0.42, 1.6, 6.5); A.leafZV -= 9; A.wobV += 3; }
      A.sqV += (-A.sq * 210 - A.sqV * 13) * dt; A.sq = clamp(A.sq + A.sqV * dt, -0.42, 0.5);
      A.wobV += (-A.wob * 120 - A.wobV * 7) * dt; A.wob += A.wobV * dt;
      // emotes / idle behaviour
      let em = A.emote, k = 0;
      if (em) { A.emoteT += dt; k = Math.sin(Math.min(1, A.emoteT / 0.18) * Math.PI / 2) * sm(EM[em], EM[em] - 0.25, A.emoteT); if (A.emoteT > EM[em] || (moving && em !== 'celebrate' && A.emoteT > 0.25)) { A.emote = null; } }
      const wantSit = (A.idle > 22 && !em) || s.sitting, wantSleep = A.idle > 40 && !em && !s.sitting;
      A.sit = damp(A.sit, wantSit ? 1 : 0, wantSit ? 5 : 10, dt); A.sleep = damp(A.sleep, wantSleep ? 1 : 0, 3, dt);
      if (!em && A.idle > 7 && A.idle < 20 && Math.random() < dt * 0.09) api.emote(['wave', 'think', 'happy', 'confused'][(Math.random() * 4) | 0]), A.idle = 8;
      // look-around + head tilt while idle
      A.lookT -= dt; if (A.lookT < 0) { A.lookT = 1.4 + Math.random() * 2.6; const idle = !moving && s.grounded; A.lookTY = idle ? (Math.random() - 0.5) * 1.1 : 0; A.lookTX = idle ? (Math.random() - 0.5) * 0.3 : 0; A.tiltT = idle && Math.random() < 0.35 ? (Math.random() - 0.5) * 0.4 : 0; }
      if (moving) { A.lookTY = clamp(s.turn * 0.12, -0.5, 0.5); A.lookTX = 0; A.tiltT = 0; }
      A.lookY = damp(A.lookY, A.lookTY, 6, dt); A.lookX = damp(A.lookX, A.lookTX, 6, dt); A.tilt = damp(A.tilt, A.tiltT, 5, dt);
      // blink
      A.blinkT -= dt; if (A.blinkT < 0) { A.blink = 0.13; A.blinkT = 1.8 + Math.random() * 3.6; if (Math.random() < 0.2) A.blinkT = 0.28; } A.blink -= dt;
      // ---- pose
      const ph = A.phase, bob = Math.abs(Math.sin(ph)), breathe = Math.sin(t * (2.1 - A.sleep * 0.9)) * (0.016 + A.sleep * 0.03);
      const hop = em === 'celebrate' ? Math.abs(Math.sin(A.emoteT * 7.5)) * 0.32 * k : em === 'happy' || em === 'laugh' ? Math.abs(Math.sin(A.emoteT * 11)) * 0.07 * k : 0;
      const st = 1 + A.sq + A.air * clamp(Math.abs(s.vy) * 0.014, 0, 0.14) + breathe - A.move * (1 - bob) * 0.07 - A.sit * 0.1 - A.slide * 0.16;
      const wide = 1 / Math.sqrt(Math.max(0.3, st));
      squash.scale.set(wide * (1 + A.wob * 0.05), st, wide * (1 - A.wob * 0.05)); squash.position.y = hop + A.move * bob * 0.07 - A.sit * 0.02;
      squash.rotation.set(s.flip ? s.flip * Math.PI * 2 : 0, 0, 0); if (s.flip) squash.position.y += 0.5 * Math.sin(s.flip * Math.PI);
      if (s.swim) { squash.position.y += Math.sin(t * 2.4) * 0.04 - 0.38; }
      let bx = A.lean + A.sit * -0.12, bz = A.roll + Math.sin(ph) * 0.085 * A.move, by = Math.sin(ph) * 0.1 * A.move;
      let hx = -A.lean * 0.55 + A.lookX + A.sleep * 0.42 - A.air * clamp(s.vy * 0.02, -0.25, 0.25), hy = A.lookY, hz = A.tilt - bz * 0.6;
      let aLx = Math.sin(ph + Math.PI) * (0.55 + run * 0.6) * A.move, aRx = Math.sin(ph) * (0.55 + run * 0.6) * A.move, aLz = 0.03 * Math.sin(t * 2.1) + run * 0.25 * A.move, aRz = aLz;
      { const rise = clamp(s.vy * 0.05, -0.25, 0.5); aLz += A.air * (0.32 + rise * 0.5); aRz += A.air * (0.32 + rise * 0.5); aLx -= A.air * (0.35 + rise); aRx -= A.air * (0.35 + rise); }   // arms trail the jump instead of flapping out
      aLz -= A.sit * 0.12; aRz -= A.sit * 0.12; aLx -= A.sit * 0.5; aRx -= A.sit * 0.5;
      let expr = A.expr;
      if (em === 'wave') { aLz = lerp(aLz, 2.25 + Math.sin(A.emoteT * 15) * 0.38, k); aLx = lerp(aLx, -0.2, k); hz += 0.16 * k; bz -= 0.06 * k; expr = 'happy'; }
      else if (em === 'celebrate') { aLz = lerp(aLz, 2.5 + Math.sin(A.emoteT * 18) * 0.15, k); aRz = lerp(aRz, 2.5 - Math.sin(A.emoteT * 18) * 0.15, k); hx -= 0.25 * k; expr = 'happy'; squash.rotation.y = sm(0.5, 1.5, A.emoteT) * Math.PI * 2; }
      else if (em === 'surprised') { aLz = lerp(aLz, 1.3, k); aRz = lerp(aRz, 1.3, k); hx -= 0.15 * k; expr = 'surprised'; }
      else if (em === 'confused') { hz += 0.38 * k; hy += Math.sin(A.emoteT * 2.5) * 0.2 * k; aRz = lerp(aRz, 1.9, k); aRx = lerp(aRx, -0.9, k); expr = 'half'; }
      else if (em === 'think') { hz -= 0.22 * k; hx -= 0.12 * k; aLz = lerp(aLz, 1.75, k); aLx = lerp(aLx, -1.1, k); expr = A.emoteT % 1.3 < 0.65 ? 'look_l' : 'look_r'; }
      else if (em === 'happy') { hz += Math.sin(A.emoteT * 9) * 0.14 * k; aLz += 0.7 * k; aRz += 0.7 * k; expr = 'happy'; }
      else if (em === 'laugh') { hx -= 0.2 * k; aLz += 0.5 * k; aRz += 0.5 * k; aLx -= 0.9 * k; aRx -= 0.9 * k; expr = 'wink'; }
      else if (em === 'love') { hz += 0.18 * k; aLx -= 1.0 * k; aRx -= 1.0 * k; aLz += 0.3 * k; aRz += 0.3 * k; expr = 'heart'; }
      else if (em === 'sad') { hx += 0.45 * k; bx += 0.12 * k; aLz -= 0.1 * k; expr = 'sad'; }
      else if (em === 'determined') { bx += 0.1 * k; aLz += 0.5 * k; aRz += 0.5 * k; aLx -= 0.7 * k; aRx -= 0.7 * k; expr = 'angry'; }
      A.swim = damp(A.swim || 0, s.swim ? 1 : 0, 8, dt); if (A.swim > 0.02) { const sw2 = t * (4 + sp * 0.8); aLx = lerp(aLx, -1.3 + Math.sin(sw2) * 1.1, A.swim); aRx = lerp(aRx, -1.3 + Math.sin(sw2 + Math.PI) * 1.1, A.swim); aLz = lerp(aLz, 0.5, A.swim); aRz = lerp(aRz, 0.5, A.swim); bx += (0.55 + (s.under ? 0.5 : 0)) * A.swim * Math.min(1, 0.3 + sp * 0.3); hx -= 0.45 * A.swim * Math.min(1, 0.3 + sp * 0.3); }
      if (s.hang) { aLz = 2.2; aRz = 2.2; aLx = -0.3; aRx = -0.3; bx += 0.9; hx -= 0.7; expr = 'happy'; }
      if (A.slide > 0.02) { aLx = lerp(aLx, 0.9, A.slide); aRx = lerp(aRx, 0.9, A.slide); aLz = lerp(aLz, 0.5, A.slide); aRz = lerp(aRz, 0.5, A.slide); hx += 0.5 * A.slide; if (s.sliding) expr = 'happy'; }
      if (A.skid > 0.02) { aLz = lerp(aLz, 0.9, A.skid); aRz = lerp(aRz, 0.9, A.skid); hx += 0.2 * A.skid; }
      A.glide = damp(A.glide || 0, s.gliding ? 1 : 0, 12, dt); if (A.glide > 0.02) { aLz = lerp(aLz, 1.45, A.glide); aRz = lerp(aRz, 1.45, A.glide); aLx = lerp(aLx, 0.2, A.glide); aRx = lerp(aRx, 0.2, A.glide); bx += 0.3 * A.glide; hx -= 0.25 * A.glide; if (s.gliding) expr = 'happy'; }
      if (s.excited && !em) expr = 'star';
      if (A.sleep > 0.4) expr = 'sleepy'; else if (A.blink > 0 && (expr === 'neutral' || expr.startsWith('look'))) expr = 'blink';
      else if (expr === 'neutral' && Math.abs(A.lookY) > 0.3) expr = A.lookY > 0 ? 'look_l' : 'look_r';
      if (!s.grounded && !em && s.vy < -9) expr = 'surprised';
      eyes.setL(expr); eyes.setR(expr === 'wink' ? 'happy' : expr);
      rot('body', bx, by, bz); pos('body', 0, -A.sit * 0.06, 0);
      rot('head', hx, hy, hz);
      const hs = 1 + A.wob * 0.03; B.head.scale.set(hs, 1 / hs, hs);
      rot('armL', aLx, 0, aLz); rot('armR', aRx, 0, -aRz);
      // feet: step cycle, tuck in the air, slide forward when sitting
      for (const [n, o] of [['footL', 0], ['footR', Math.PI]]) {
        const p = ph + o, lift = Math.max(0, Math.cos(p)) * 0.085 * A.move, fwd = Math.sin(p) * (0.1 + run * 0.07) * A.move;
        pos(n, 0, lift * (1 - A.slide) + A.air * 0.05, fwd * (1 - A.slide) + A.sit * 0.13 - A.air * 0.03 + A.slide * 0.16 + A.skid * 0.08);
        rot(n, -Math.cos(p) * 0.55 * A.move * (1 - A.slide) + A.air * 0.5 - A.sit * 0.55 - A.slide * 0.7 - A.skid * 0.35, 0, 0);
      }
      // leaf: damped spring dragged by motion
      const tY = clamp(sp * 0.085, 0, 0.75) * (s.grounded ? 1 : 0.6), tZ = clamp(-s.vy * 0.05, -0.7, 0.8) - A.sleep * 0.5 + (em === 'sad' ? -0.5 * k : 0) + (em === 'surprised' || em === 'celebrate' ? 0.35 * k : 0);
      A.leafYV += ((tY - A.leafY) * 90 - A.leafYV * 7) * dt; A.leafY += A.leafYV * dt;
      A.leafZV += ((tZ - A.leafZ) * 110 - A.leafZV * 6.5) * dt; A.leafZ += A.leafZV * dt;
      const sw = Math.sin(t * 1.7) * 0.05 + Math.sin(ph * 2) * 0.07 * A.move;
      A.spin = (A.spin || 0) + dt * 26 * A.glide;
      rot('leaf1', 0, A.leafY * 0.35 + A.spin, A.leafZ * 0.3 + sw * 0.5 + A.glide * 0.25); rot('leaf2', 0, A.leafY * 0.45, A.leafZ * 0.45 + sw); rot('leaf3', 0, A.leafY * 0.5, A.leafZ * 0.55 + sw * 1.3);
    },
  };
  return api;
}
