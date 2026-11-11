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

const BONES = ['root', 'hips', 'chest', 'head', 'armL', 'handL', 'armR', 'handR', 'footL', 'footR', 'leaf1', 'leaf2', 'leaf3'];
const TAU = Math.PI * 2;
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
  const B = {}, rest = {}, q = new T.Quaternion(), e = new T.Euler(), D = new T.Quaternion(), v3 = new T.Vector3();
  for (const n of BONES) { const b = model.getObjectByName(n); B[n] = b; const P = new T.Quaternion(); b.parent.getWorldQuaternion(P); rest[n] = { q: b.quaternion.clone(), p: b.position.clone(), P, Pi: P.clone().invert() }; }
  // rotate a bone by a model-space euler (x: pitch fwd+, y: yaw, z: roll) relative to its rest pose
  const rot = (n, x, y, z) => { const r = rest[n]; D.setFromEuler(e.set(x, y, z, 'YXZ')); B[n].quaternion.copy(r.Pi).multiply(D).multiply(r.P).multiply(r.q); };
  const pos = (n, x, y, z) => { const r = rest[n]; B[n].position.copy(r.p).add(v3.set(x, y, z).applyQuaternion(r.Pi)); };
  // every upper-body channel rides a soft spring, so nothing snaps: arms overshoot, hands lag the arms, the head settles after the body
  const SPR = {}; const spring = (key, target, k, d, dt) => { const s = SPR[key] ||= { x: target, v: 0 }; s.v += ((target - s.x) * k - s.v * d) * dt; s.x += s.v * dt; return s.x; };

  const A = { t: 0, phase: 0, move: 0, run: 0, sprint: 0, air: 0, sq: 0, sqV: 0, leafY: 0, leafYV: 0, leafZ: 0, leafZV: 0, lookY: 0, lookX: 0, lookTY: 0, lookTX: 0, lookT: 2, tilt: 0, tiltT: 0,
    blinkT: 2.5, blink: 0, idle: 0, emote: null, emoteT: 0, expr: 'neutral', sit: 0, sleep: 0, wob: 0, wobV: 0, roll: 0, land: 0, acc: 0, lastSp: 0, spinT: 0, slide: 0, skid: 0, glide: 0, swim: 0, hang: 0, drive: 0, fidT: 4, whole: 0, shift: Math.random() * 9 };
  const EM = { wave: 2.2, celebrate: 1.9, surprised: 0.9, confused: 2.2, happy: 1.6, love: 2.2, laugh: 1.8, sad: 2.2, think: 2.6, determined: 1.6, stretch: 2.4, hop: 0.9, swing: 1.0 };
  const P = {}; const CH = ['hx', 'hy', 'hz', 'hpx', 'hpy', 'cx', 'cy', 'cz', 'nx', 'ny', 'nz', 'aLx', 'aLz', 'aRx', 'aRz', 'eLx', 'eLz', 'eRx', 'eRz', 'fLx', 'fLy', 'fLz', 'fLr', 'fRx', 'fRy', 'fRz', 'fRr'];
  const to = (o, k) => { if (k < 0.002) return; for (const c in o) P[c] += (o[c] - P[c]) * k; }, add = (o, k) => { for (const c in o) P[c] += o[c] * k; };
  const api = {
    group, bones: B, anim: A, jelly, force: null,
    setTint(k) { const t = TINTS[k] || TINTS.sky; jelly.color.set(t[0]); jelly.emissive.set(t[1]); },
    setHat(k) { if (api.hat) { B.head.remove(api.hat); api.hat = null; } if (k && k !== 'none' && HATS[k]) { api.hat = buildHat(k); B.head.add(api.hat); } },
    setLeaf(k) { const L = LEAVES[k] || LEAVES.green; model.traverse((o) => { if (o.isMesh && o.material.vertexColors && o.material !== jelly) o.material.color.setRGB(...L[2]); }); },
    emote(name) { if (!EM[name]) return; A.emote = name; A.emoteT = 0; A.idle = 0; if (name === 'surprised' || name === 'celebrate' || name === 'hop') A.sqV += 4; },
    setExpression(n) { A.expr = n; },
    get emoting() { return A.emote; },
    update(dt, s) {
      dt = Math.min(dt, 1 / 30); if (api.force) s = { ...s, ...api.force };
      A.t += dt; const t = A.t, sp = s.speed;
      const moving = s.grounded && sp > 0.35 && !s.sliding && !s.swim;
      A.move = damp(A.move, moving ? sm(0.2, 1.4, sp) : 0, 12, dt); A.run = damp(A.run, moving ? sm(3.2, 7.2, sp) : 0, 8, dt); A.sprint = damp(A.sprint, moving ? sm(8, 10.4, sp) : 0, 6, dt);
      A.air = damp(A.air, s.grounded || s.swim ? 0 : 1, 16, dt);
      if (!api.freeze) A.phase += dt * TAU * clamp(1.2 + sp * 0.2, 0, 3.3) * (moving ? 1 : 0);
      A.acc = damp(A.acc, clamp((sp - A.lastSp) / Math.max(dt, 1e-3), -40, 40), 9, dt); A.lastSp = sp;
      A.slide = damp(A.slide, s.sliding ? 1 : 0, 12, dt); A.skid = damp(A.skid, s.skid ? 1 : 0, 14, dt); A.glide = damp(A.glide, s.gliding ? 1 : 0, 10, dt);
      A.swim = damp(A.swim, s.swim ? 1 : 0, 8, dt); A.hang = damp(A.hang, s.hang ? 1 : 0, 7, dt); A.drive = damp(A.drive, s.driving ? 1 : 0, 9, dt);
      A.roll = damp(A.roll, clamp(-s.turn * 0.06, -0.28, 0.28) * A.move, 8, dt);
      if (s.sitting) A.idle = Math.min(A.idle, 30); if ((moving || !s.grounded || s.input) && !s.sitting) { if (A.sleep > 0.5) api.emote('surprised'); A.idle = 0; } else A.idle += dt;
      // squash & stretch spring: stretch on take-off, squash on landing, a wobble that rings out
      if (s.justJumped) { A.sqV += 3.4; if (A.air > 0.4 && !s.flip) A.spinT = 0.0001; }
      if (s.justLanded) { const hit = clamp(s.landSpeed / 16, 0.2, 1); A.land = hit; A.sqV -= 1.0 + hit * 3.0; A.leafZV -= 9; A.wobV += 2 + hit * 2; A.spinT = 0; }
      A.land = damp(A.land, 0, 6.5, dt);
      A.sqV += (-A.sq * 230 - A.sqV * 14) * dt; A.sq = clamp(A.sq + A.sqV * dt, -0.2, 0.24);
      A.wobV += (-A.wob * 130 - A.wobV * 7.5) * dt; A.wob += A.wobV * dt;
      if (A.spinT > 0) { A.spinT += dt / 0.46; if (A.spinT >= 1) A.spinT = 0; }
      // emotes / idle behaviour
      let em = A.emote, k = 0;
      if (em) { A.emoteT += dt; k = Math.sin(Math.min(1, A.emoteT / 0.2) * Math.PI / 2) * sm(EM[em], EM[em] - 0.3, A.emoteT); if (A.emoteT > EM[em] || (moving && em !== 'celebrate' && A.emoteT > 0.25)) { A.emote = null; } }
      const wantSit = (A.idle > 22 && !em) || s.sitting, wantSleep = A.idle > 40 && !em && !s.sitting;
      A.sit = damp(A.sit, wantSit ? 1 : 0, wantSit ? 5 : 10, dt); A.sleep = damp(A.sleep, wantSleep ? 1 : 0, 3, dt);
      if (!em && A.idle > 6 && A.idle < 20 && !s.sitting && Math.random() < dt * 0.11) api.emote(['wave', 'think', 'happy', 'confused', 'stretch', 'hop', 'stretch'][(Math.random() * 7) | 0]), A.idle = 7;
      // small fidgets while standing: a breath of a bounce, a leaf flick
      A.fidT -= dt; if (A.fidT < 0) { A.fidT = 2.5 + Math.random() * 4; if (!moving && s.grounded && !em) { if (Math.random() < 0.5) A.sqV += 1.1; else A.leafYV += 5 * (Math.random() - 0.5); } }
      // look-around + head tilt while idle; looks at whatever is interesting nearby
      A.lookT -= dt; if (A.lookT < 0) { A.lookT = 1.4 + Math.random() * 2.6; const idle = !moving && s.grounded; A.lookTY = idle ? (Math.random() - 0.5) * 1.1 : 0; A.lookTX = idle ? (Math.random() - 0.5) * 0.3 : 0; A.tiltT = idle && Math.random() < 0.35 ? (Math.random() - 0.5) * 0.4 : 0; }
      if (moving) { A.lookTY = clamp(s.turn * 0.12, -0.5, 0.5); A.lookTX = 0; A.tiltT = 0; }
      if (s.lookYaw != null && !em) { A.lookTY = clamp(s.lookYaw, -1.0, 1.0); A.lookTX = s.lookPitch || 0; A.lookT = 0.6; }
      A.lookY = damp(A.lookY, A.lookTY, 6, dt); A.lookX = damp(A.lookX, A.lookTX, 6, dt); A.tilt = damp(A.tilt, A.tiltT, 5, dt);
      A.blinkT -= dt; if (A.blinkT < 0) { A.blink = 0.13; A.blinkT = 1.8 + Math.random() * 3.6; if (Math.random() < 0.2) A.blinkT = 0.28; } A.blink -= dt;

      // ------------------------------------------------------------ build the pose
      for (const c of CH) P[c] = 0;
      const ph = A.phase, M = A.move, R = A.run, SPT = A.sprint, cs = Math.cos(ph), sn = Math.sin(ph);
      const breathe = Math.sin(t * (2.1 - A.sleep * 0.9)), still = 1 - M;
      // idle: breathing through the chest and arms, slow weight shift from foot to foot
      const sh = Math.sin(t * 0.55 + A.shift) * still * (1 - A.sit);
      add({ cx: breathe * 0.022, aLz: 0.05 + breathe * 0.035, aRz: 0.05 + breathe * 0.035, eLx: -0.1, eRx: -0.1, hz: sh * 0.045, hpx: sh * 0.014, cz: -sh * 0.06, nz: sh * 0.025, hpy: breathe * 0.006 }, 1);
      // locomotion: hips lead, chest counter-rotates, arms swing against the legs with the hands trailing
      const lean = M * (0.05 + 0.15 * R + 0.1 * SPT) + (s.grounded ? clamp(A.acc * 0.011, -0.2, 0.22) : 0);
      const hipYaw = -cs * (0.1 + 0.1 * R) * M, swing = (0.42 + 0.5 * R + 0.15 * SPT) * M, bend = (0.12 + 0.85 * R) * M;
      add({ hx: lean * 0.45, cx: lean * 0.7, nx: -lean * 0.75 + Math.sin(2 * ph - 1.3) * 0.035 * M, hy: hipYaw, cy: -hipYaw * 1.9, ny: hipYaw * 0.8,
        hz: A.roll + sn * (0.055 - 0.02 * R) * M, hpx: sn * 0.012 * M, cz: -sn * 0.05 * M + A.roll * 0.5, nz: -A.roll * 0.6,
        hpy: (-Math.cos(2 * ph - 0.6) * (0.016 + 0.03 * R) - 0.012 * R) * M,
        aLx: cs * swing, aRx: -cs * swing, aLz: 0.2 * R * M, aRz: 0.2 * R * M,
        eLx: -bend + Math.cos(ph - 0.7) * 0.28 * M, eRx: -bend - Math.cos(ph - 0.7) * 0.28 * M }, 1);
      const stance = lerp(0.62, 0.4, R), Az = (0.06 + 0.085 * R + 0.03 * SPT), H = 0.04 + 0.075 * R + 0.03 * SPT;
      for (const [f, o] of [['fL', 0], ['fR', 0.5]]) { let p = (ph / TAU + o) % 1, y, z, r;
        if (p < stance) { const u = p / stance; y = 0; z = lerp(Az, -Az, u); r = u < 0.22 ? lerp(-0.32, 0, u / 0.22) : 0.5 * sm(0.55, 1, u); }
        else { const u = (p - stance) / (1 - stance), ee = u * u * (3 - 2 * u); y = Math.sin(u * Math.PI) * H; z = lerp(-Az, Az, ee); r = lerp(0.5, -0.32, ee) + Math.sin(u * Math.PI) * 0.35 * R; }
        P[f + 'y'] = y * M; P[f + 'z'] = z * M; P[f + 'r'] = r * M; }
      // jump: reach up on the way up, open out and tuck the feet on the way down, sink into the landing
      const up = A.air * clamp(s.vy / 9, 0, 1), dn = A.air * clamp(-s.vy / 11, 0, 1), flut = Math.sin(t * 21) * 0.05 * dn;
      to({ aLx: -0.85, aRx: -0.85, aLz: 0.5, aRz: 0.5, eLx: -0.45, eRx: -0.45, cx: -0.1, nx: -0.2, fLy: -0.015, fRy: -0.015, fLz: -0.05, fRz: -0.03, fLr: 0.65, fRr: 0.5 }, up);
      to({ aLx: 0.1, aRx: 0.1, aLz: 0.9 + flut, aRz: 0.9 - flut, eLx: -0.1, eRx: -0.1, eLz: 0.3, eRz: 0.3, cx: 0.1, nx: 0.14, fLy: 0.06, fRy: 0.045, fLz: 0.035, fRz: 0.0, fLr: -0.3, fRr: -0.15, fLx: 0.02, fRx: 0.02 }, dn);
      const air0 = A.air * (1 - up) * (1 - dn); add({ aLz: 0.35, aRz: 0.35, fLy: 0.03, fRy: 0.03 }, air0);
      add({ hpy: -0.075, cx: 0.22, nx: -0.12, aLz: 0.55, aRz: 0.55, aLx: 0.25, aRx: 0.25, eLz: 0.3, eRz: 0.3, fLx: 0.022, fRx: 0.022 }, A.land);
      // sitting (benches, long idles, the cart seat)
      to({ hx: -0.1, hpy: -0.03, aLx: -0.45, aRx: -0.45, aLz: 0.02, aRz: 0.02, eLx: -0.55, eRx: -0.55, fLy: 0.03, fRy: 0.03, fLz: 0.15, fRz: 0.15, fLr: -0.5, fRr: -0.5 }, A.sit * (1 - A.drive));
      const steer = s.steer || 0;
      to({ hx: -0.08, cx: 0.1, cz: -steer * 0.14, ny: -steer * 0.35, nz: steer * 0.08, aLx: -1.2 + steer * 0.35, aRx: -1.2 - steer * 0.35, aLz: 0.22, aRz: 0.22, eLx: -0.25, eRx: -0.25, eLz: -0.25, eRz: -0.25, fLy: 0.03, fRy: 0.03, fLz: 0.16, fRz: 0.16, fLr: -0.45, fRr: -0.45 }, A.drive);
      // slide on your bottom, skid on your heels
      to({ cx: 0.18, nx: 0.38, aLz: 0.95, aRz: 0.95, aLx: -0.25, aRx: -0.25, eLz: 0.35, eRz: 0.35, fLy: 0.02, fRy: 0.02, fLz: 0.17, fRz: 0.14, fLr: -0.55, fRr: -0.45, hpy: -0.05 }, A.slide);
      to({ hx: -0.2, cx: -0.12, nx: 0.25, aLz: 0.85, aRz: 0.85, aLx: -0.5, aRx: -0.5, eLz: 0.2, eRz: 0.2, fLz: 0.12, fRz: 0.07, fLr: -0.42, fRr: -0.42, hpy: -0.03 }, A.skid);
      // leaf glide: spread out flat; hang glider: stretched out under the wing holding the bar
      to({ cx: 0.1, nx: -0.45, aLz: 1.05 + Math.sin(t * 9) * 0.04, aRz: 1.05 - Math.sin(t * 9) * 0.04, aLx: 0.15, aRx: 0.15, eLz: 0.25, eRz: 0.25, fLz: -0.05, fRz: -0.07, fLr: 0.55, fRr: 0.55, fLy: 0.02, fRy: 0.03 }, A.glide * (1 - A.hang));
      to({ cx: 0.05, nx: -0.95, aLx: -1.9, aRx: -1.9, aLz: 0.25, aRz: 0.25, eLx: -0.35, eRx: -0.35, fLz: -0.06, fRz: -0.06, fLr: 0.7, fRr: 0.7, fLy: 0.01 + Math.sin(t * 3) * 0.012, fRy: 0.01 - Math.sin(t * 3) * 0.012 }, A.hang);
      // swimming: front crawl with a flutter kick
      if (A.swim > 0.02) { const w = t * (4.2 + sp * 0.8), go = Math.min(1, 0.3 + sp * 0.3); to({ aLx: -1.5 + Math.sin(w) * 1.15, aRx: -1.5 - Math.sin(w) * 1.15, aLz: 0.45 + Math.cos(w) * 0.25, aRz: 0.45 - Math.cos(w) * 0.25, eLx: -0.2, eRx: -0.2, nx: -0.55 * go, cy: Math.sin(w) * 0.18 * go, fLy: Math.sin(w * 2) * 0.03, fRy: -Math.sin(w * 2) * 0.03, fLr: 0.5, fRr: 0.5 }, A.swim); }
      // emotes
      let expr = A.expr; const et = A.emoteT;
      if (em === 'wave') { to({ aLz: 1.55, aLx: -0.25, eLz: 0.35 + Math.sin(et * 13) * 0.5, eLx: 0, nz: 0.16, cz: -0.07, hz: 0.04 }, k); expr = 'happy'; }
      else if (em === 'celebrate') { to({ aLz: 1.5, aRz: 1.5, aLx: -0.35, aRx: -0.35, eLz: 0.4 + Math.sin(et * 16) * 0.3, eRz: 0.4 - Math.sin(et * 16) * 0.3, nx: -0.28, cx: -0.1 }, k); expr = 'happy'; }
      else if (em === 'hop') { to({ aLz: 0.7, aRz: 0.7, nx: -0.1 }, k); expr = 'happy'; }
      else if (em === 'surprised') { to({ aLz: 1.0, aRz: 1.0, eLz: 0.4, eRz: 0.4, nx: -0.18, cx: -0.12, hpy: 0.02 }, k); expr = 'surprised'; }
      else if (em === 'confused') { to({ nz: 0.38, ny: Math.sin(et * 2.5) * 0.2, aRz: 1.5, aRx: -0.9, eRx: -1.2, cz: 0.06 }, k); expr = 'half'; }
      else if (em === 'think') { to({ nz: -0.2, nx: -0.12, aLz: 1.25, aLx: -1.0, eLx: -1.35, aRx: -0.5, eRx: -0.9, aRz: -0.05 }, k); expr = et % 1.3 < 0.65 ? 'look_l' : 'look_r'; }
      else if (em === 'happy') { to({ nz: Math.sin(et * 9) * 0.15, aLz: 0.8, aRz: 0.8, eLz: 0.3, eRz: 0.3, hz: Math.sin(et * 9) * 0.05 }, k); expr = 'happy'; }
      else if (em === 'laugh') { to({ nx: -0.22 + Math.sin(et * 20) * 0.05, cx: -0.1 + Math.sin(et * 20) * 0.04, aLx: -0.9, aRx: -0.9, aLz: 0.3, aRz: 0.3, eLx: -1.1, eRx: -1.1 }, k); expr = 'wink'; }
      else if (em === 'love') { to({ nz: 0.18, aLx: -1.0, aRx: -1.0, aLz: 0.15, aRz: 0.15, eLx: -1.0, eRx: -1.0, hz: Math.sin(et * 4) * 0.05 }, k); expr = 'heart'; }
      else if (em === 'sad') { to({ nx: 0.45, cx: 0.2, hx: 0.05, aLz: -0.05, aRz: -0.05, eLx: -0.15, eRx: -0.15 }, k); expr = 'sad'; }
      else if (em === 'determined') { to({ cx: 0.1, aLz: 0.55, aRz: 0.55, aLx: -0.7, aRx: -0.7, eLx: -1.3, eRx: -1.3, nx: -0.05 }, k); expr = 'angry'; }
      else if (em === 'swing') { const u = clamp(et / 0.9, 0, 1), a = u < 0.3 ? lerp(0, 1.25, sm(0, 0.3, u)) : lerp(1.25, -2.3, sm(0.3, 0.52, u)); to({ aLx: a, aRx: a, aLz: 0.3, aRz: 0.3, eLx: -0.2, eRx: -0.2, cy: a * 0.4, hy: a * 0.15, nx: 0.12, ny: -a * 0.35, cx: 0.12 }, Math.min(1, et / 0.08) * sm(1.0, 0.8, et)); expr = 'angry'; }
      else if (em === 'stretch') { const s2 = Math.sin(Math.min(1, et / EM.stretch) * Math.PI); to({ aLz: 1.55, aRz: 1.55, aLx: -0.3, aRx: -0.3, eLz: 0.45, eRz: 0.45, cx: -0.18 * s2, nx: -0.25 * s2, cz: Math.sin(et * 2.6) * 0.12, hpy: 0.02 * s2 }, k); expr = 'happy'; }
      add({ nx: A.lookX + A.sleep * 0.42, ny: A.lookY, nz: A.tilt }, 1);
      if (s.sliding || s.gliding || s.hang) expr = 'happy'; if (s.excited && !em) expr = 'star';
      if (A.sleep > 0.4) expr = 'sleepy'; else if (A.blink > 0 && (expr === 'neutral' || expr.startsWith('look'))) expr = 'blink';
      else if (expr === 'neutral' && Math.abs(A.lookY) > 0.3) expr = A.lookY > 0 ? 'look_l' : 'look_r';
      if (!s.grounded && !em && s.vy < -11 && !s.gliding && !s.hang) expr = 'surprised';
      eyes.setL(expr); eyes.setR(expr === 'wink' ? 'happy' : expr);

      // ------------------------------------------------------------ whole-body: squash, hop, big pitches about the belly
      const hop = em === 'celebrate' ? Math.abs(Math.sin(et * 7.5)) * 0.3 * k : em === 'hop' ? Math.abs(Math.sin(et * 7)) * 0.2 * k : em === 'happy' || em === 'laugh' ? Math.abs(Math.sin(et * 11)) * 0.06 * k : 0;
      const st = 1 + A.sq + A.air * clamp(Math.abs(s.vy) * 0.012, 0, 0.12) + breathe * (0.012 + A.sleep * 0.03) * still - A.sit * 0.06 - A.slide * 0.1;
      const wide = 1 / Math.sqrt(Math.max(0.4, st));
      squash.scale.set(wide * (1 + A.wob * 0.045), st, wide * (1 - A.wob * 0.045));
      const swimGo = Math.min(1, 0.3 + sp * 0.3);
      A.whole = spring('whole', A.hang * 1.15 + A.glide * (1 - A.hang) * 0.5 + A.swim * (0.75 + (s.under ? 0.45 : 0)) * swimGo - A.slide * 0.5 - A.skid * 0.22 - up * 0.06 + dn * 0.05, 90, 13, dt);
      const W = A.whole + (s.flip ? s.flip * TAU : 0), pv = 0.34;
      squash.rotation.set(W, A.spinT > 0 ? (1 - (1 - A.spinT) ** 3) * TAU : em === 'celebrate' ? sm(0.5, 1.5, et) * TAU : 0, 0);
      squash.position.set(0, hop + pv * (1 - Math.cos(W)) * (s.flip ? 1.6 : 1) + (s.swim ? Math.sin(t * 2.4) * 0.04 - 0.38 : 0), -pv * Math.sin(W) * (s.flip ? 0 : 1));
      // ------------------------------------------------------------ apply (springs give the follow-through)
      const S1 = (c, kk, dd) => spring(c, P[c], kk, dd, dt);
      rot('hips', S1('hx', 200, 22), S1('hy', 260, 24), S1('hz', 200, 22)); pos('hips', P.hpx, P.hpy, 0);
      rot('chest', S1('cx', 170, 19), S1('cy', 240, 24), S1('cz', 170, 19));
      rot('head', S1('nx', 130, 15), S1('ny', 150, 17), S1('nz', 120, 14));
      const hs = 1 + A.wob * 0.03; B.head.scale.set(hs, 1 / hs, hs);
      rot('armL', S1('aLx', 190, 16), 0, S1('aLz', 190, 16)); rot('armR', S1('aRx', 190, 16), 0, -S1('aRz', 190, 16));
      rot('handL', S1('eLx', 120, 11), 0, S1('eLz', 120, 11)); rot('handR', S1('eRx', 120, 11), 0, -S1('eRz', 120, 11));
      pos('footL', P.fLx, P.fLy, P.fLz); rot('footL', P.fLr, 0, 0); pos('footR', -P.fRx, P.fRy, P.fRz); rot('footR', P.fRr, 0, 0);
      // leaf: damped spring dragged by motion
      const tY = clamp(sp * 0.085, 0, 0.75) * (s.grounded ? 1 : 0.6), tZ = clamp(-s.vy * 0.05, -0.7, 0.8) - A.sleep * 0.5 + (em === 'sad' ? -0.5 * k : 0) + (em === 'surprised' || em === 'celebrate' ? 0.35 * k : 0);
      A.leafYV += ((tY - A.leafY) * 90 - A.leafYV * 7) * dt; A.leafY += A.leafYV * dt;
      A.leafZV += ((tZ - A.leafZ) * 110 - A.leafZV * 6.5) * dt; A.leafZ += A.leafZV * dt;
      const sw = Math.sin(t * 1.7) * 0.05 + Math.sin(ph * 2) * 0.07 * M;
      A.spin = (A.spin || 0) + dt * 26 * A.glide * (1 - A.hang);
      rot('leaf1', 0, A.leafY * 0.35 + A.spin, A.leafZ * 0.3 + sw * 0.5 + A.glide * 0.25); rot('leaf2', 0, A.leafY * 0.45, A.leafZ * 0.45 + sw); rot('leaf3', 0, A.leafY * 0.5, A.leafZ * 0.55 + sw * 1.3);
    },
  };
  return api;
}
