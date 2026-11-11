import * as T from 'three';
import { S, save, emit } from './state.js';
import { audio } from './audio.js';
import { groundAt } from '../world/colliders.js';
import { heightAt, grassAt } from '../world/terrain.js';
import { PATHS, SPOTS, PONDS } from '../world/layout.js';
import { rng } from '../util/noise.js';
// Halo Coins (everywhere, lead you along routes) and Sun Stars (hidden rewards for poking around).
export function initCollect(G) {
  const R = rng(2024), P = SPOTS.plaza, coins = [];
  const add = (x, z, dy = 0.75, y = null) => { const gy = y ?? groundAt(x, z); if (gy < -0.3 && y == null) return; coins.push({ x, z, y: Math.max(gy, 0) + dy, id: 'c' + coins.length }); };
  for (const p of PATHS) for (let i = 0; i < p.pts.length - 1; i++) { const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / 4.2); for (let k = 1; k < n; k++) add(ax + (bx - ax) * k / n, az + (bz - az) * k / n); }
  for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; add(P.x + Math.cos(a) * 11.2, P.z + Math.sin(a) * 11.2); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; add(P.x + Math.cos(a) * 3.2, P.z + Math.sin(a) * 3.2, 0.9, P.h + 0.62); }           // in the fountain bowl
  for (let x = 34; x < 104; x += 3.4) { let z = 200; while (z < 250 && heightAt(x, z) > 0.9) z += 0.5; add(x, z - 1.5); }                       // along the tide line
  if (G.pier) for (let k = 0; k < 9; k++) add(G.pier.x - Math.sin(0.12) * k * 4.2, G.pier.z - Math.cos(0.12) * k * 4.2, 0.8, 1.0);
  for (const K of PONDS) for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; add(K.x + Math.cos(a) * (K.r + 3) * K.sx, K.z + Math.sin(a) * (K.r + 3)); }
  for (let c = 0; c < 70; c++) { const x = (R() - 0.5) * 600, z = (R() - 0.5) * 600; if (grassAt(x, z) < 0.6) continue; const a = R() * 6.283, arc = R() < 0.5; for (let k = 0; k < 5; k++) add(x + Math.cos(a) * k * 1.8, z + Math.sin(a) * k * 1.8, arc ? 0.75 + Math.sin(k / 4 * Math.PI) * 1.5 : 0.75); }
  const geo = new T.CylinderGeometry(0.24, 0.24, 0.06, 20).rotateX(Math.PI / 2);
  const mat = new T.MeshPhysicalMaterial({ color: '#ffc928', emissive: '#ff9d00', emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.22, clearcoat: 1, envMapIntensity: 4 });
  // optional look: water droplets instead of coins (journal setting)
  const dropGeo = new T.LatheGeometry([[0, -0.26], [0.13, -0.24], [0.21, -0.14], [0.22, -0.02], [0.16, 0.12], [0.07, 0.26], [0, 0.36]].map(([x, y]) => new T.Vector2(x, y)), 18);
  const dropMat = new T.MeshPhysicalMaterial({ color: '#5fd0ff', emissive: '#1f9cf0', emissiveIntensity: 0.55, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9, envMapIntensity: 5 });
  G.setCoinStyle = (st) => { S.coinStyle = st; mesh.geometry = st === 'drops' ? dropGeo : geo; mesh.material = st === 'drops' ? dropMat : mat; document.getElementById('hud').classList.toggle('drops', st === 'drops'); save(); };
  const mesh = new T.InstancedMesh(geo, mat, coins.length); mesh.castShadow = true; mesh.frustumCulled = false; G.world.add(mesh); const d = new T.Object3D();
  // Sun Stars: hand-placed where curiosity takes you
  const starSpots = [[P.x, P.z, 4.4, 'On the fountain statue'], [P.x - 39, P.z + 6, 5.6, 'Atop the old arch'], [G.hall.x, G.hall.z, 17, 'Crown of the Town Hall dome'], [P.x + 30, P.z + 24, 9.0, 'Shop rooftop'], [P.x - 18, P.z - 34, 8.6, 'Pink shop roof'],
    [G.pier?.x ?? 90, G.pier?.z ?? 270, 2.2, 'End of the pier'], [40, 222, 1.2, 'Tide line'], [100, 232, 1.2, 'Far end of the beach'], [66, 245, 1.0, 'Out in the cove'], [32, 198, 1.2, 'Behind the volleyball net'],
    [40.5, 60, 1.2, 'In the plunge pool'], [34, 42, 1.2, 'Middle of the lake'], [20, 30, 1.5, 'Lake shore'], [SPOTS.ruins.x, SPOTS.ruins.z, 9.2, 'Top of the ruin gate'], [SPOTS.ruins.x + 14, SPOTS.ruins.z - 10, 1.3, 'Behind the ruins'],
    [SPOTS.lighthouse.x, SPOTS.lighthouse.z + 9, 1.4, 'Lighthouse garden'], [SPOTS.lighthouse.x - 14, SPOTS.lighthouse.z - 6, 1.4, 'Cape lookout'], [SPOTS.observatory.x + 11, SPOTS.observatory.z, 1.4, 'Beside the observatory'], [SPOTS.windRidge.x, SPOTS.windRidge.z + 5, 1.4, 'Under the turbine'],
    [-60, 170, 1.3, 'West meadow'], [-140, 132, 1.3, 'Coast path bend'], [150, 128, 1.3, 'East path'], [-80, 60, 1.4, 'Under the western cliffs'], [120, 60, 1.4, 'Eastern lowlands'], [0, 150, 1.3, 'Meadow south of the cliffs'],
    [-10, -10, 1.5, 'Highland meadow'], [60, -40, 1.5, 'Highland east'], [-90, -70, 1.5, 'Highland west'], [-20, -40, 1.5, 'Foot of Halo Peak'], [-20, -95, 3, 'Summit of Halo Peak']];
  const sShape = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 - Math.PI / 2, r = k % 2 ? 0.2 : 0.46; sShape[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } sShape.closePath();
  const sGeo = new T.ExtrudeGeometry(sShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 }).translate(0, 0, -0.06);
  const sMat = new T.MeshPhysicalMaterial({ color: '#ffd84a', emissive: '#ffb100', emissiveIntensity: 0.7, roughness: 0.2, clearcoat: 1, envMapIntensity: 4 });
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,170,.9)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const stars = starSpots.map(([x, z, dy, hint], i) => { const m = new T.Mesh(sGeo, sMat); m.castShadow = true; const y = Math.max(groundAt(x, z), i === 10 ? 5.9 : i === 11 ? 36.3 : 0) + dy; m.position.set(x, y, z); const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); sp.scale.setScalar(2.2); m.add(sp); G.world.add(m); const id = 's' + i; m.visible = !S.stars[id]; return { m, x, y, z, id, hint }; });
  G.starTotal = stars.length; G.starSpots = stars;
  // sparkle burst pool
  const NB = 160, bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(new Float32Array(NB * 3).fill(-999), 3)); const burst = new T.Points(bg, new T.PointsMaterial({ map: glowTex, size: 0.34, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: '#fff3b0' })); burst.frustumCulled = false; G.world.add(burst);
  const bv = new Float32Array(NB * 3), bl = new Float32Array(NB); let bi = 0;
  G.sparkle = (x, y, z, n = 10, sp = 3) => { for (let k = 0; k < n; k++) { const i = bi++ % NB, a = Math.random() * 6.283, u = Math.random() * 2 - 1, q = Math.sqrt(1 - u * u), p = bg.attributes.position.array; p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; bv[i * 3] = Math.cos(a) * q * sp; bv[i * 3 + 1] = u * sp + 2; bv[i * 3 + 2] = Math.sin(a) * q * sp; bl[i] = 0.5 + Math.random() * 0.3; } };
  let combo = 0, comboT = 0, t = 0;
  G.systems.push((dt) => {
    t += dt; comboT -= dt; if (comboT < 0) combo = 0; const hp = G.ctl.pos, hy = hp.y + 0.5;
    for (let i = 0; i < coins.length; i++) { const c = coins[i]; if (S.got[c.id]) { if (!c.hid) { d.position.set(0, -500, 0); d.scale.setScalar(0.001); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix); c.hid = true; mesh.instanceMatrix.needsUpdate = true; } continue; }
      const dx = c.x - hp.x, dz = c.z - hp.z, d2 = dx * dx + dz * dz; if (d2 > 8000) continue;
      if (d2 < 0.85 && Math.abs(c.y - hy) < 1.25) { S.got[c.id] = 1; S.coins++; save(); audio.coin(combo++); comboT = 1.2; G.sparkle(c.x, c.y, c.z, 7, 2.2); G.hud.setCoins(S.coins); continue; }
      d.position.set(c.x, c.y + Math.sin(t * 2.4 + i) * 0.08, c.z); d.rotation.set(0, S.coinStyle === 'drops' ? 0 : t * 2.6 + i * 0.7, 0); d.scale.setScalar(1); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix); }
    mesh.instanceMatrix.needsUpdate = true;
    for (const s of stars) { if (!s.m.visible) continue; s.m.rotation.y = t * 1.6; s.m.position.y = s.y + Math.sin(t * 1.8 + s.x) * 0.14; if (Math.hypot(s.x - hp.x, s.z - hp.z) < 1.15 && Math.abs(s.m.position.y - hy) < 1.5) { s.m.visible = false; S.stars[s.id] = 1; S.coins += 5; save(); audio.star(); G.sparkle(s.x, s.m.position.y, s.z, 30, 4.5); G.hud.setCoins(S.coins); G.hud.setStars(Object.keys(S.stars).length, stars.length); G.hud.toast('★ Sun Star found!', s.hint + ' · +5 coins'); G.hero.emote('celebrate'); emit('star'); } }
    const p = bg.attributes.position.array; for (let i = 0; i < NB; i++) { if (bl[i] <= 0) continue; bl[i] -= dt; bv[i * 3 + 1] -= 9 * dt; p[i * 3] += bv[i * 3] * dt; p[i * 3 + 1] += bv[i * 3 + 1] * dt; p[i * 3 + 2] += bv[i * 3 + 2] * dt; if (bl[i] <= 0) p[i * 3 + 1] = -999; } bg.attributes.position.needsUpdate = true;
  });
  G.hud.setCoins(S.coins); G.hud.setStars(Object.keys(S.stars).length, stars.length); G.coinTotal = coins.length; if (S.coinStyle === 'drops') G.setCoinStyle('drops');
}
