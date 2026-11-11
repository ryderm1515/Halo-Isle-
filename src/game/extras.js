import * as T from 'three';
import { S, save, on } from './state.js';
import { audio } from './audio.js';
import { createHero } from '../hero/hero.js';
import { input } from '../hero/controller.js';
import { groundAt, addCircle } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { SPOTS } from '../world/layout.js';
// Feel + quality-of-life: dust and splashes, the plaza statue, benches you can sit on, the twin-arch portal, mouse look, wind streaks.
export async function initExtras(G, loader) {
  const hud = G.hud, ctl = G.ctl, hero = G.hero, P = SPOTS.plaza, root = G.world, canvas = G.renderer.domElement;
  // ------------------------------------------------ puffs: dust, sand, leaf bits, spray
  const NP = 220, pg = new T.BufferGeometry(), pp = new Float32Array(NP * 3).fill(-999), pc = new Float32Array(NP * 3), pv = new Float32Array(NP * 3), pl = new Float32Array(NP); let pi = 0;
  pg.setAttribute('position', new T.BufferAttribute(pp, 3)); pg.setAttribute('color', new T.BufferAttribute(pc, 3));
  const spr = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const puffs = new T.Points(pg, new T.PointsMaterial({ map: spr, size: 0.42, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false })); puffs.frustumCulled = false; root.add(puffs);
  const col = new T.Color();
  G.puff = (x, y, z, n, color, spread = 1.2, up = 1.2) => { col.set(color); for (let k = 0; k < n; k++) { const i = pi++ % NP, a = Math.random() * 6.283; pp[i * 3] = x + Math.cos(a) * 0.15; pp[i * 3 + 1] = y + 0.08; pp[i * 3 + 2] = z + Math.sin(a) * 0.15; pv[i * 3] = Math.cos(a) * spread * (0.4 + Math.random()); pv[i * 3 + 1] = up * (0.4 + Math.random()); pv[i * 3 + 2] = Math.sin(a) * spread * (0.4 + Math.random()); pl[i] = 0.45 + Math.random() * 0.35; pc[i * 3] = col.r; pc[i * 3 + 1] = col.g; pc[i * 3 + 2] = col.b; } pg.attributes.color.needsUpdate = true; };
  const groundKind = (x, z) => { const h = heightAt(x, z); if (h < 0.05) return 'water'; if (h < 2.7) return 'sand'; if (Math.hypot(x - P.x, z - P.z) < P.r) return 'stone'; return 'grass'; };
  const DUST = { sand: '#f3deb0', stone: '#e6ddd0', grass: '#9ad65a', water: '#ffffff' };
  on('step', (p, sp, hard) => { const k = groundKind(p.x, p.z); if (k === 'water') { G.puff(p.x, Math.max(p.y, 0), p.z, 3, DUST.water, 1.5, 2.2); if (Math.random() < 0.4) audio.splash(); return; } if (k === 'sand' || hard || sp > 8) G.puff(p.x, p.y, p.z, hard ? 5 : k === 'sand' ? 3 : 2, DUST[k], hard ? 1.6 : 0.9, hard ? 0.9 : 0.6); });
  on('land', (v, wet) => { const p = ctl.pos; if (!wet && v > 5) G.puff(p.x, p.y, p.z, Math.min(14, 4 + v), DUST[groundKind(p.x, p.z)], 2.4, 0.7); });
  on('bounce', (b) => { audio.bounce(); G.puff(b.x, b.y, b.z, 12, '#7fd03a', 2.5, 2.6); hero.emote('happy'); });
  // ------------------------------------------------ the plaza statue: a big glassy sprout waving from the fountain
  { const st = await createHero(loader, { clone: true }); st.jelly.color.set('#7fdcff'); st.jelly.emissive.set('#2aa8f0'); st.jelly.roughness = 0.08; st.group.scale.setScalar(2.5); st.group.position.set(P.x, P.h + 2.14, P.z); st.group.rotation.y = Math.PI * 0.85; root.add(st.group);
    const idle = { speed: 0, vy: 0, grounded: true, turn: 0, input: true }; st.emote('wave'); for (let i = 0; i < 30; i++) st.update(0.016, idle); st.anim.blinkT = 1e9; G.statue = st; addCircle(P.x, P.z, 0.9, P.h + 4.6); }
  // ------------------------------------------------ benches: E to sit, move to stand up
  for (const b of G.benches || []) G.thing({ x: b.x, z: b.z, y: b.y - 0.5, r: 1.7, label: 'Sit down', act: () => { ctl.sitAt(b.x + Math.sin(b.ry) * 0.12, b.y - 0.04, b.z + Math.cos(b.ry) * 0.12, b.ry); audio.ui(); hud.toast('Sitting', 'Move or jump to get up · X sits anywhere'); } });
  // ------------------------------------------------ the twin arches: once the eastern gate is open, the plaza arch wakes as a portal between them
  { const U = SPOTS.ruins, ry = Math.atan2(-30, 20), f = { x: Math.sin(ry), z: Math.cos(ry) }, ax = P.x - 39, az = P.z + 6, ary = Math.atan2(P.x - ax, P.z - az);
    const pm = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, uniforms: { t: { value: 0 }, on: { value: 0 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform float t,on;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p),a=atan(p.y,p.x);float s=sin(a*5.+r*18.-t*3.)*.5+.5;float m=smoothstep(.5,.42,r);vec3 c=mix(vec3(.1,.7,1.),vec3(.8,1.,1.),s*smoothstep(.5,0.,r));gl_FragColor=vec4(c*1.6,m*(.35+.5*s)*on);}' });
    const mk = (x, z, ryy, s, y) => { const m = new T.Mesh(new T.CircleGeometry(2.0 * s, 40), pm); m.position.set(x, y + 3.3 * s, z); m.rotation.y = ryy; m.renderOrder = 4; root.add(m); return m; };
    mk(ax + Math.sin(ary) * 0.5, az + Math.cos(ary) * 0.5, ary, 0.62, P.h); mk(U.x + f.x * 0.75, U.z + f.z * 0.75, ry, 0.0001, U.h);
    const go = (x, z, yaw) => { hud.flash(); audio.star(); ctl.teleport(x, z); ctl.yaw = yaw; ctl.cam.yaw = yaw + Math.PI; G.sparkle(x, groundAt(x, z) + 1, z, 30, 4); };
    const dormant = () => { ctl.locked = true; hud.dialog('Old Arch', ['The glyph is cold and dark.', 'It looks just like the gate in the <b>eastern ruins</b>. Maybe it wakes when its twin opens.'], () => (ctl.locked = false)); };
    G.thing({ x: ax + Math.sin(ary) * 2.2, z: az + Math.cos(ary) * 2.2, r: 2.6, marker: '#7ff6ff', kind: 'portal', name: 'Old Arch', label: () => S.flags.ruinsOpen ? 'Step through to the ruins' : 'Touch the glyph', act: () => S.flags.ruinsOpen ? go(U.x + f.x * 11, U.z + f.z * 11, ry) : dormant() });
    G.thing({ x: U.x - f.x * 6.5, z: U.z - f.z * 6.5, r: 2.4, label: 'Step through to the plaza', act: () => go(ax + Math.sin(ary) * 5, az + Math.cos(ary) * 5, ary) });
    G.thing({ x: U.x + f.x * 2.6, z: U.z + f.z * 2.6, r: 2.2, label: () => S.flags.ruinsOpen ? 'Step through to the plaza' : 'The gate is sealed', act: () => S.flags.ruinsOpen ? go(ax + Math.sin(ary) * 5, az + Math.cos(ary) * 5, ary) : audio.bad() });
    G.systems.push((dt) => { pm.uniforms.t.value += dt; pm.uniforms.on.value += ((S.flags.ruinsOpen ? 1 : 0) - pm.uniforms.on.value) * Math.min(1, dt * 2); }); }
  // ------------------------------------------------ mouse look: click the game to capture the cursor (Esc frees it); without it, A/D steer the camera
  canvas.addEventListener('click', () => { if (!hud.journalOpen && !hud.mapOpen && !document.pointerLockElement) canvas.requestPointerLock?.()?.catch?.(() => {}); });
  G.freeCursor = () => { if (document.pointerLockElement) document.exitPointerLock(); };
  G.systems.push((dt) => { if (!document.pointerLockElement && !ctl.locked && !ctl.sitting && Math.abs(input.mx) > 0.2) ctl.cam.yaw -= input.mx * dt * 1.35; });
  // ------------------------------------------------ visible wind: pale ribbons that curl past on the breeze
  { const N = 14, geo = new T.PlaneGeometry(1, 1, 24, 1), mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, uniforms: { t: { value: 0 } },
      vertexShader: 'attribute vec4 seed;uniform float t;varying float vA;varying float vU;void main(){float life=fract(t*seed.w+seed.z);float u=uv.x;vec3 p=vec3(0.);float s=life*26.+u*7.;p.x=s-13.;p.y=sin(s*.45+seed.z*6.28)*1.1+(uv.y-.5)*.07;p.z=cos(s*.3+seed.z*9.)*1.6;vA=sin(life*3.14159)*sin(u*3.14159);vU=u;vec4 wp=instanceMatrix*vec4(p,1.);gl_Position=projectionMatrix*viewMatrix*wp;}',
      fragmentShader: 'varying float vA;void main(){gl_FragColor=vec4(1.,1.,1.,vA*.33);}' });
    const im = new T.InstancedMesh(geo, mat, N), seed = new Float32Array(N * 4); for (let i = 0; i < N; i++) { seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = 0.07 + Math.random() * 0.06; } geo.setAttribute('seed', new T.InstancedBufferAttribute(seed, 4)); im.frustumCulled = false; im.renderOrder = 3; root.add(im);
    const d = new T.Object3D(), off = Array.from({ length: N }, () => [(Math.random() - 0.5) * 70, 1.5 + Math.random() * 9, (Math.random() - 0.5) * 70]);
    G.systems.push((dt, g) => { mat.uniforms.t.value += dt; const c = ctl.pos; for (let i = 0; i < N; i++) { const x = c.x + off[i][0], z = c.z + off[i][2]; d.position.set(x, Math.max(heightAt(x, z), 0) + off[i][1], z); d.rotation.y = 0.5; d.updateMatrix(); im.setMatrixAt(i, d.matrix); } im.instanceMatrix.needsUpdate = true; }); }
  // ------------------------------------------------ puffs integrate
  G.systems.push((dt) => { for (let i = 0; i < NP; i++) { if (pl[i] <= 0) continue; pl[i] -= dt; pv[i * 3 + 1] -= 2.2 * dt; pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt; pv[i * 3] *= 0.94; pv[i * 3 + 2] *= 0.94; if (pl[i] <= 0) pp[i * 3 + 1] = -999; } pg.attributes.position.needsUpdate = true; });
}
