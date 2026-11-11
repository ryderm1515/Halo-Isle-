import * as T from 'three';
import { rng } from '../util/noise.js';
import { heightAt } from '../world/terrain.js';
// Small things that make the island feel alive: fountain jets, waterfall mist, drifting pollen, butterflies, gulls.
function softSprite() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); }
export function initAmbient(G) {
  const R = rng(31), spr = softSprite(), P = G.SPOTS.plaza, root = G.world;
  const pts = (n, size, color, opacity, blend = T.NormalBlending) => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); const m = new T.Points(geo, new T.PointsMaterial({ map: spr, size, color, transparent: true, opacity, depthWrite: false, blending: blend, sizeAttenuation: true })); m.frustumCulled = false; root.add(m); return m; };
  // ---- fountain: arcing jets from the upper bowl + a crown spray on the statue's pedestal
  const NJ = 520, jets = pts(NJ, 0.22, '#dff6ff', 0.85), jp = jets.geometry.attributes.position.array, jv = new Float32Array(NJ * 3), jl = new Float32Array(NJ);
  const spawn = (i) => { const k = i % 12, a = k / 12 * 6.283 + (R() - 0.5) * 0.08, inner = i % 3 === 0; const r0 = inner ? 1.5 : 2.2, sp = inner ? 1.2 : 2.6; jp[i * 3] = P.x + Math.cos(a) * r0; jp[i * 3 + 1] = P.h + (inner ? 1.65 : 1.25); jp[i * 3 + 2] = P.z + Math.sin(a) * r0; jv[i * 3] = Math.cos(a) * sp * (0.9 + R() * 0.2); jv[i * 3 + 1] = (inner ? 2.4 : 3.6) * (0.9 + R() * 0.2); jv[i * 3 + 2] = Math.sin(a) * sp * (0.9 + R() * 0.2); jl[i] = 0; };
  for (let i = 0; i < NJ; i++) { spawn(i); jl[i] = -R() * 1.4; }
  // ---- waterfall mist
  const NM = 160, mist = pts(NM, 2.6, '#ffffff', 0.32), mp = mist.geometry.attributes.position.array, ml = new Float32Array(NM), fb = G.fallsBase;
  const mspawn = (i) => { mp[i * 3] = fb.x + (R() - 0.5) * 6; mp[i * 3 + 1] = fb.y + R() * 1.2; mp[i * 3 + 2] = fb.z + (R() - 0.5) * 4; ml[i] = R() * 2.5; };
  for (let i = 0; i < NM; i++) mspawn(i);
  // ---- golden pollen / light motes drifting around the camera
  const NP = 220, pol = pts(NP, 0.09, '#fff2b8', 0.8, T.AdditiveBlending), pp = pol.geometry.attributes.position.array, po = new Float32Array(NP * 4);
  for (let i = 0; i < NP; i++) { po[i * 4] = (R() - 0.5) * 44; po[i * 4 + 1] = R() * 7 + 0.3; po[i * 4 + 2] = (R() - 0.5) * 44; po[i * 4 + 3] = R() * 6.28; }
  // ---- butterflies: two wings that flap, wandering near the ground around the plaza and meadow
  const flies = [], wingGeo = new T.BufferGeometry(); wingGeo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0.06, 0.16, 0, 0.11, 0.13, 0, -0.08, 0, 0, -0.05], 3)); wingGeo.setIndex([0, 1, 2, 0, 2, 3]); wingGeo.computeVertexNormals();
  for (let i = 0; i < 22; i++) { const g = new T.Group(), m = new T.MeshBasicMaterial({ color: ['#ffd23f', '#ffffff', '#ff9ec4', '#8fd3ff', '#ffb04a'][i % 5], side: T.DoubleSide }), a = new T.Mesh(wingGeo, m), b = new T.Mesh(wingGeo, m); b.scale.x = -1; g.add(a, b); root.add(g);
    flies.push({ g, a, b, cx: P.x + (R() - 0.5) * 120, cz: P.z + (R() - 0.5) * 110, r: 2 + R() * 5, sp: 0.4 + R() * 0.5, ph: R() * 6.28, h: 0.7 + R() * 1.3 }); }
  // ---- gulls gliding in wide circles
  const gulls = [], gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0.35, 1.5, 0.15, 0.1, 0.9, 0.1, -0.25, 0, 0, -0.3, 0, 0, 0.35, -1.5, 0.15, 0.1, -0.9, 0.1, -0.25], 3)); gg.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 3, 6]);
  for (let i = 0; i < 9; i++) { const m = new T.Mesh(gg, new T.MeshBasicMaterial({ color: '#ffffff', side: T.DoubleSide, fog: false })); root.add(m); gulls.push({ m, cx: (R() - 0.5) * 420, cz: (R() - 0.5) * 420 + 120, r: 40 + R() * 90, h: 38 + R() * 60, sp: (0.08 + R() * 0.08) * (R() < 0.5 ? 1 : -1), ph: R() * 6.28 }); }
  let t = 0;
  G.systems.push((dt, g) => {
    t += dt;
    for (let i = 0; i < NJ; i++) { jl[i] += dt; if (jl[i] < 0) continue; jv[i * 3 + 1] -= 9.5 * dt; jp[i * 3] += jv[i * 3] * dt; jp[i * 3 + 1] += jv[i * 3 + 1] * dt; jp[i * 3 + 2] += jv[i * 3 + 2] * dt; if (jp[i * 3 + 1] < P.h + 0.6) spawn(i); }
    jets.geometry.attributes.position.needsUpdate = true;
    for (let i = 0; i < NM; i++) { ml[i] += dt; mp[i * 3 + 1] += dt * 1.3; mp[i * 3] += Math.sin(t + i) * dt * 0.4; if (ml[i] > 3) mspawn(i), ml[i] = 0; } mist.geometry.attributes.position.needsUpdate = true;
    const c = g.camera.position;
    for (let i = 0; i < NP; i++) { const ox = po[i * 4], oz = po[i * 4 + 2], ph = po[i * 4 + 3]; const x = c.x + ((ox + t * 0.5 - c.x) % 44 + 66) % 44 - 22, z = c.z + ((oz + t * 0.25 - c.z) % 44 + 66) % 44 - 22; pp[i * 3] = x + Math.sin(t * 0.7 + ph) * 0.6; pp[i * 3 + 1] = Math.max(heightAt(x, z), 0) + po[i * 4 + 1] + Math.sin(t * 0.5 + ph * 2) * 0.5; pp[i * 3 + 2] = z + Math.cos(t * 0.6 + ph) * 0.6; }
    pol.geometry.attributes.position.needsUpdate = true;
    for (const f of flies) { const a = t * f.sp + f.ph, x = f.cx + Math.cos(a) * f.r + Math.sin(a * 2.3) * 1.2, z = f.cz + Math.sin(a * 1.3) * f.r; f.g.position.set(x, Math.max(heightAt(x, z), 0) + f.h + Math.sin(t * 3 + f.ph) * 0.25, z); f.g.rotation.y = -a * 1.3; const w = Math.sin(t * 22 + f.ph) * 1.0; f.a.rotation.z = w; f.b.rotation.z = -w; }
    for (const u of gulls) { const a = t * u.sp + u.ph; u.m.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(a * 2) * 3, u.cz + Math.sin(a) * u.r); u.m.rotation.y = -a + (u.sp > 0 ? 0 : Math.PI); u.m.rotation.z = Math.sin(t * 2 + u.ph) * 0.12 + (u.sp > 0 ? 0.25 : -0.25); u.m.scale.setScalar(0.8); }
  });
}
