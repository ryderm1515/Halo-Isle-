import * as T from 'three';
import { SPOTS } from './layout.js';
import { heightAt, grassAt } from './terrain.js';
import { addCircle, addBox, addPlatform, groundAt } from './colliders.js';
import { applyLib } from './materials.js';
import { rng } from '../util/noise.js';

const FILES = { lamp_post: 'props', bench: 'props', signpost: 'props', notice_board: 'props', planter_small: 'props', planter_large: 'props', fountain: 'structures', town_hall: 'structures',
  shop_pink: 'structures', shop_blue: 'structures', shop_yellow: 'structures', shop_white: 'structures', bush_a: 'environment/foliage', bush_b: 'environment/foliage', tree_a: 'environment/foliage', tree_b: 'environment/foliage',
  palm_a: 'environment/foliage', palm_b: 'environment/foliage', hibiscus: 'environment/foliage', daisy_white: 'environment/foliage', daisy_yellow: 'environment/foliage', daisy_pink: 'environment/foliage',
  rock_a: 'environment/rocks', rock_b: 'environment/rocks', rock_c: 'environment/rocks' };
export const models = {};
export async function loadModels(loader, extra = {}) {
  const all = { ...FILES, ...extra };
  await Promise.all(Object.entries(all).map(async ([n, dir]) => { if (models[n]) return; try { const g = await loader.loadAsync(`./assets/${dir}/${n}.glb`); models[n] = applyLib(g.scene); } catch (e) { console.warn('missing model', n); } }));
}
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
export async function initWorld(G, loader) {
  await loadModels(loader);
  const root = new T.Group(); root.name = 'World'; G.scene.add(root); G.world = root; G.wobblers = [];
  const put = (name, x, z, rotY = 0, s = 1, y = null) => { const m = models[name]; if (!m) return null; const o = m.clone(); o.position.set(x, y ?? heightAt(x, z), z); o.rotation.y = rotY; o.scale.setScalar(s); root.add(o); return o; };
  const P = SPOTS.plaza, H = P.h, R = rng(4242), pol = (a, r) => [P.x + Math.cos(a) * r, P.z + Math.sin(a) * r], D = Math.PI / 180;

  // ---- fountain (centre)
  put('fountain', P.x, P.z, 0, 1, H); addCircle(P.x, P.z, 4.5, H + 0.8); addPlatform({ x: P.x, z: P.z, r: 4.56, y: H + 0.3 }); addCircle(P.x, P.z, 2.35, H + 1.3); addPlatform({ x: P.x, z: P.z, r: 2.4, y: H + 1.25 }); addCircle(P.x, P.z, 1.45, H + 3.7);
  // ---- town hall (north-east), entrance toward the fountain
  { const [x, z] = pol(-40 * D, 30), ry = face(x, z, P.x, P.z); put('town_hall', x, z, ry, 1, H); addCircle(x, z, 9.5); for (let i = 0; i < 4; i++) addPlatform({ x, z, r: 11.6 - i * 0.5, y: H + 0.2 * (i + 1) }); G.hall = { x, z, ry }; }
  // ---- shops around the rim
  for (const [n, a, w] of [['shop_pink', -116, 9], ['shop_blue', -150, 10], ['shop_white', 150, 11], ['shop_yellow', 36, 8]]) { const [x, z] = pol(a * D, 37.5), ry = face(x, z, P.x, P.z); put(n, x, z, ry, 1, H); addBox(x, z, w / 2 + 0.3, 3.9, ry); }
  // ---- lamps, benches, planters
  for (let i = 0; i < 6; i++) { const [x, z] = pol((i * 60 + 30) * D, 13.5); put('lamp_post', x, z, face(x, z, P.x, P.z) + Math.PI / 2, 1, H); addCircle(x, z, 0.24); }
  for (let i = 0; i < 6; i++) { if (i === 1) continue; const [x, z] = pol(i * 60 * D, 8.6), ry = face(x, z, P.x, P.z) + Math.PI; put('bench', x, z, ry, 1, H); addBox(x, z, 0.95, 0.36, ry, H + 0.52); addPlatform({ x, z, hw: 0.95, hd: 0.36, rotY: ry, y: H + 0.5 }); }
  const beds = [];
  for (const [a, r, big] of [[-78, 22, 1], [-8, 21, 0], [70, 23, 1], [118, 19, 0], [176, 21, 1], [-128, 23, 0], [8, 33, 1], [96, 34, 0]]) { const [x, z] = pol(a * D, r), rr = big ? 3.0 : 1.6; put(big ? 'planter_large' : 'planter_small', x, z, 0, 1, H); addCircle(x, z, rr, H + 0.5); addPlatform({ x, z, r: rr, y: H + 0.5 }); beds.push({ x, z, r: rr - 0.45, big }); }
  for (const b of beds) {
    if (b.big) { put(R() < 0.5 ? 'palm_a' : 'palm_b', b.x, b.z, R() * 6.3, 1.05 + R() * 0.25, H + 0.4); addCircle(b.x, b.z, 0.32); } else put(R() < 0.5 ? 'bush_a' : 'bush_b', b.x, b.z, R() * 6.3, 0.8, H + 0.45);
    const n = b.big ? 16 : 7; for (let i = 0; i < n; i++) { const a = R() * 6.3, r = (0.5 + R() * 0.5) * b.r; const o = put(R() < 0.45 ? 'hibiscus' : ['daisy_white', 'daisy_yellow', 'daisy_pink'][(R() * 3) | 0], b.x + Math.cos(a) * r, b.z + Math.sin(a) * r, R() * 6.3, R() < 0.45 ? 1.3 + R() * 0.6 : 2.2 + R(), H + 0.5); }
  }
  { const [x, z] = pol(106 * D, 30); put('signpost', x, z, 0.4, 1, H); addCircle(x, z, 0.22); const [x2, z2] = pol(64 * D, 28); put('notice_board', x2, z2, face(x2, z2, P.x, P.z), 1, H); addBox(x2, z2, 1.0, 0.2, face(x2, z2, P.x, P.z)); }
  // ---- palms + trees + bushes + rocks around the rim and out into the meadow
  let k = 0;
  for (let i = 0; i < 260 && k < 120; i++) {
    const a = R() * 6.3, r = P.r + 2 + R() * 70, x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r, h = heightAt(x, z), g = grassAt(x, z, h);
    if (g < 0.5 && !(h > 1.4 && h < 3.2)) continue; k++;
    const t = R(); let n, s, rad;
    if (h < 4.2 || t < 0.34) { n = R() < 0.5 ? 'palm_a' : 'palm_b'; s = 1 + R() * 0.5; rad = 0.3; } else if (t < 0.55) { n = R() < 0.5 ? 'tree_a' : 'tree_b'; s = 0.9 + R() * 0.5; rad = 0.34; } else if (t < 0.9) { n = R() < 0.5 ? 'bush_a' : 'bush_b'; s = 0.7 + R() * 0.7; rad = 0; } else { n = ['rock_a', 'rock_b', 'rock_c'][(R() * 3) | 0]; s = 0.6 + R() * 0.9; rad = 0; }
    put(n, x, z, R() * 6.3, s, h - 0.05); if (rad) addCircle(x, z, rad * s);
  }
}
