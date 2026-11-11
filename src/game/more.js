import * as T from 'three';
import { S, save } from './state.js';
import { audio } from './audio.js';
import { groundAt } from '../world/colliders.js';
import { heightAt, grassAt } from '../world/terrain.js';
import { SPOTS } from '../world/layout.js';
import { models, loadModels } from '../world/world.js';
import { bouncers } from '../hero/controller.js';
import { rng } from '../util/noise.js';
// More to do and more to look at: tropical planting, beach-ball keepy-up, a slide course down the highlands, bouncy umbrellas.
export async function initMore(G, loader) {
  await loadModels(loader, { plant_broadleaf_a: 'environment/foliage', plant_broadleaf_b: 'environment/foliage', fern_a: 'environment/foliage', tulips_red: 'environment/foliage', tulips_mix: 'environment/foliage' });
  const hud = G.hud, ctl = G.ctl, P = SPOTS.plaza, root = G.world, R = rng(321), dummy = new T.Object3D();
  // ---- planting: ferns and broad-leaf clumps under trees and along the paths, tulip drifts near town (instanced)
  const want = { plant_broadleaf_a: [], plant_broadleaf_b: [], fern_a: [], tulips_red: [], tulips_mix: [] };
  for (let i = 0; i < 5200; i++) { const x = (R() - 0.5) * 640, z = (R() - 0.5) * 620, h = heightAt(x, z); if (h < 2.8 || h > 100 || grassAt(x, z, h) < 0.6) continue; const town = Math.hypot(x - P.x, z - P.z); if (town < P.r + 1) continue; const t = R();
    if (town < 95 && t < 0.3) want[t < 0.15 ? 'tulips_red' : 'tulips_mix'].push([x, z, h, 1.6 + R() * 1.2]); else if (t < 0.5) want.fern_a.push([x, z, h, 1 + R() * 0.9]); else if (t < 0.72) want[t < 0.62 ? 'plant_broadleaf_a' : 'plant_broadleaf_b'].push([x, z, h, 0.9 + R() * 0.8]); }
  for (const name in want) { const items = want[name].slice(0, name.startsWith('tulips') ? 160 : 260), m = models[name]; if (!m || !items.length) continue; m.updateMatrixWorld(true); const CELL = 130, buckets = {}; for (const it of items) (buckets[Math.floor(it[0] / CELL) + '|' + Math.floor(it[1] / CELL)] ||= []).push(it);
    for (const k in buckets) m.traverse((o) => { if (!o.isMesh) return; const its = buckets[k], im = new T.InstancedMesh(o.geometry, o.material, its.length); im.castShadow = false; im.receiveShadow = false; its.forEach(([x, z, h, sc], i) => { dummy.position.set(x, h - 0.02, z); dummy.rotation.set(0, (x * 3.7 + z * 1.3) % 6.283, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix.clone().multiply(o.matrixWorld)); }); im.computeBoundingSphere(); root.add(im); }); }
  // beach umbrellas are springy too
  root.traverse((o) => { if (o.parent === root && o.children[0]?.material?.name === undefined) return; });
  for (const o of root.children) { if (o.userData.umb) continue; }
  // ---- Keepy-Up: keep a beach ball off the sand
  const { A, finish, startPost, race, edge, fmt } = G.act;
  if (G.volley && G.balls?.length) { const v = G.volley, name = 'Keepy-Up'; startPost(v.x + 7, v.z + 3, name, '#ffb04a'); const ball = G.balls[0];
    G.thing({ x: v.x + 7, z: v.z + 3, r: 2.4, marker: '#ffb04a', name, label: () => `Start ${name}${S.best.keepy ? ` · best ${S.best.keepy}` : ''}`, act: () => { if (A.cur) return audio.bad(); audio.good(); let hits = 0, air = false, t = 0; const b = ball.userData.ball; ball.position.set(v.x + 4, groundAt(v.x + 4, v.z + 3) + 3.2, v.z + 3); b.v.set(0, 2, 0); hud.activity(name);
      A.cur = { update(dt) { t += dt; hud.activityUpdate(String(hits), 'Bump the ball before it lands'); const g = groundAt(ball.position.x, ball.position.z), up = b.v.y > 3.5; if (up && !air) { hits++; air = true; audio.coin(hits); } if (b.v.y < 0) air = false;
          if (ball.position.y <= g + 0.02 && t > 1.2) { if (!S.best.keepy || hits > S.best.keepy) S.best.keepy = hits; finish('keepy', name, hits >= 20 ? 3 : hits >= 12 ? 2 : hits >= 6 ? 1 : 0, [`${hits} bumps in a row`, 'Gold 20 · Silver 12 · Bronze 6']); } }, cancel() {} }; } });
    G.activities.push(['keepy', 'Keepy-Up', 'Volleyball court, resort beach']); }
  // ---- Slide Rush: hold C and ride the grass down from the highlands into town
  { const e = edge(100, 100); if (e) { const sx = e[3], sz = e[4], pts = []; for (let k = 1; k <= 8; k++) { const t = k / 8; pts.push([sx + (P.x - 20 - sx) * t + Math.sin(t * 6) * 10, sz + (P.z - 30 - sz) * t, 1.2]); } race('slide', 'Slide Rush', sx, sz, pts, [30, 22, 17]); G.activities.push(['slide', 'Slide Rush', 'Highland rim above town · hold C']); } }
  G.refreshMarkers?.();
}
