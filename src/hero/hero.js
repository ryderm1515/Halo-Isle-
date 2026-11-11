import * as T from 'three';
import { makeEyeAtlas } from './eyes.js';
import { sm, damp, clamp, lerp } from '../util/noise.js';

export function jellyMaterial() {
  const m = new T.MeshPhysicalMaterial({ color: '#44b2f9', roughness: 0.13, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, emissive: '#1e86ee', emissiveIntensity: 0.32, envMapIntensity: 1.5, sheen: 0.4, sheenColor: '#bfeaff', sheenRoughness: 0.4 });
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
export async function createHero(loader, envMap) {
  const gltf = await loader.loadAsync('./assets/characters/hero/hero.glb');
  const model = gltf.scene, eyes = makeEyeAtlas(), jelly = jellyMaterial();
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
    group, bones: B, anim: A,
    emote(name) { if (!EM[name]) return; A.emote = name; A.emoteT = 0; A.idle = 0; if (name === 'surprised' || name === 'celebrate') A.sqV += 4; },
    setExpression(n) { A.expr = n; },
    get emoting() { return A.emote; },
    update(dt, s) {
      A.t += dt; const t = A.t, sp = s.speed, run = sm(2.5, 7, sp);
      const moving = s.grounded && sp > 0.4;
      A.phase += dt * (moving ? 6.2 + sp * 1.55 : 0);
      A.move = damp(A.move, moving ? 1 : 0, 11, dt); A.air = damp(A.air, s.grounded ? 0 : 1, 14, dt);
      A.lean = damp(A.lean, moving ? 0.1 + run * 0.2 : 0, 8, dt); A.roll = damp(A.roll, clamp(-s.turn * 0.07, -0.3, 0.3) * A.move, 8, dt);
      if (moving || !s.grounded || s.input) { if (A.sleep > 0.5) api.emote('surprised'); A.idle = 0; } else A.idle += dt;
      // squash & stretch spring
      if (s.justJumped) A.sqV += 5.2;
      if (s.justLanded) { A.sqV -= clamp(s.landSpeed * 0.42, 1.6, 6.5); A.leafZV -= 9; A.wobV += 3; }
      A.sqV += (-A.sq * 210 - A.sqV * 13) * dt; A.sq = clamp(A.sq + A.sqV * dt, -0.42, 0.5);
      A.wobV += (-A.wob * 120 - A.wobV * 7) * dt; A.wob += A.wobV * dt;
      // emotes / idle behaviour
      let em = A.emote, k = 0;
      if (em) { A.emoteT += dt; k = Math.sin(Math.min(1, A.emoteT / 0.18) * Math.PI / 2) * sm(EM[em], EM[em] - 0.25, A.emoteT); if (A.emoteT > EM[em] || (moving && em !== 'celebrate' && A.emoteT > 0.25)) { A.emote = null; } }
      const wantSit = A.idle > 22 && !em, wantSleep = A.idle > 40 && !em;
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
      const st = 1 + A.sq + A.air * clamp(Math.abs(s.vy) * 0.014, 0, 0.14) + breathe - A.move * (1 - bob) * 0.07 - A.sit * 0.1;
      const wide = 1 / Math.sqrt(Math.max(0.3, st));
      squash.scale.set(wide * (1 + A.wob * 0.05), st, wide * (1 - A.wob * 0.05)); squash.position.y = hop + A.move * bob * 0.07 - A.sit * 0.02;
      squash.rotation.set(0, 0, 0);
      if (s.swim) { squash.position.y += Math.sin(t * 2.4) * 0.04 - 0.38; }
      let bx = A.lean + A.sit * -0.12, bz = A.roll + Math.sin(ph) * 0.085 * A.move, by = Math.sin(ph) * 0.1 * A.move;
      let hx = -A.lean * 0.55 + A.lookX + A.sleep * 0.42 - A.air * clamp(s.vy * 0.02, -0.25, 0.25), hy = A.lookY, hz = A.tilt - bz * 0.6;
      let aLx = Math.sin(ph + Math.PI) * (0.55 + run * 0.6) * A.move, aRx = Math.sin(ph) * (0.55 + run * 0.6) * A.move, aLz = 0.03 * Math.sin(t * 2.1) + run * 0.25 * A.move, aRz = aLz;
      aLz += A.air * 1.25; aRz += A.air * 1.25; aLx -= A.air * 0.3; aRx -= A.air * 0.3;
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
        pos(n, 0, lift + A.air * 0.05 + A.sit * 0.0, fwd + A.sit * 0.13 - A.air * 0.03);
        rot(n, -Math.cos(p) * 0.55 * A.move + A.air * 0.5 - A.sit * 0.55, 0, 0);
      }
      // leaf: damped spring dragged by motion
      const tY = clamp(sp * 0.085, 0, 0.75) * (s.grounded ? 1 : 0.6), tZ = clamp(-s.vy * 0.05, -0.7, 0.8) - A.sleep * 0.5 + (em === 'sad' ? -0.5 * k : 0) + (em === 'surprised' || em === 'celebrate' ? 0.35 * k : 0);
      A.leafYV += ((tY - A.leafY) * 90 - A.leafYV * 7) * dt; A.leafY += A.leafYV * dt;
      A.leafZV += ((tZ - A.leafZ) * 110 - A.leafZV * 6.5) * dt; A.leafZ += A.leafZV * dt;
      const sw = Math.sin(t * 1.7) * 0.05 + Math.sin(ph * 2) * 0.07 * A.move;
      rot('leaf1', 0, A.leafY * 0.35, A.leafZ * 0.3 + sw * 0.5); rot('leaf2', 0, A.leafY * 0.45, A.leafZ * 0.45 + sw); rot('leaf3', 0, A.leafY * 0.5, A.leafZ * 0.55 + sw * 1.3);
    },
  };
  return api;
}
