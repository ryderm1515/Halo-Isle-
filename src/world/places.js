import * as T from 'three';
import { S, save } from '../game/state.js';
import { audio } from '../game/audio.js';
import { heightAt, grassAt } from './terrain.js';
import { groundAt, addCircle } from './colliders.js';
import { models, loadModels } from './world.js';
import { rng } from '../util/noise.js';
// More places worth walking to: Whisper Jungle (thick canopy and a mossy idol), the Tide Pools at the east end of the beach,
// and Sunset Lookout on the west coast path.
export async function initPlaces(G, loader) {
  await loadModels(loader, { glyph_pedestal: 'props', starfish: 'props' });
  const root = G.world, hud = G.hud, ctl = G.ctl, R = rng(555), d = new T.Object3D();
  const scatter = (name, items) => { const m = models[name]; if (!m || !items.length) return; m.updateMatrixWorld(true); m.traverse((o) => { if (!o.isMesh) return; const im = new T.InstancedMesh(o.geometry, o.material, items.length); im.castShadow = true; im.receiveShadow = true; items.forEach(([x, z, s, ry], i) => { d.position.set(x, heightAt(x, z) - 0.03, z); d.rotation.set(0, ry, 0); d.scale.setScalar(s); d.updateMatrix(); im.setMatrixAt(i, d.matrix.clone().multiply(o.matrixWorld)); }); im.computeBoundingSphere(); root.add(im); }); };
  const put = (name, x, z, ry = 0, s = 1) => { const m = models[name]; if (!m) return null; const o = m.clone(); o.position.set(x, heightAt(x, z), z); o.rotation.y = ry; o.scale.setScalar(s); root.add(o); return o; };
  // ---------------------------------------------- Whisper Jungle
  const J = { x: 118, z: 66, r: 30 }, lists = { palm_a: [], palm_b: [], palm_c: [], tree_a: [], tree_b: [], plant_broadleaf_b: [], plant_broadleaf_a: [], fern_a: [], hibiscus: [], rock_b: [] };
  for (let i = 0; i < 900; i++) { const a = R() * 6.283, rr = Math.sqrt(R()) * J.r, x = J.x + Math.cos(a) * rr, z = J.z + Math.sin(a) * rr, h = heightAt(x, z); if (h < 3 || grassAt(x, z, h) < 0.3) continue; const k = R(), clear = Math.hypot(x - J.x, z - J.z) < 4.5 || Math.abs((x - J.x) * 0.5 + (z - J.z) * 0.87) < 1.6 && rr > 4;   // a clearing in the middle and a trail through
    if (clear) continue; const ry = R() * 6.283;
    if (k < 0.1 && lists.palm_a.length + lists.palm_b.length + lists.palm_c.length < 46) { lists[['palm_a', 'palm_b', 'palm_c'][(R() * 3) | 0]].push([x, z, 1.1 + R() * 0.8, ry]); addCircle(x, z, 0.38); }
    else if (k < 0.17 && lists.tree_a.length + lists.tree_b.length < 30) { lists[R() < 0.5 ? 'tree_a' : 'tree_b'].push([x, z, 1.2 + R() * 0.9, ry]); addCircle(x, z, 0.45); }
    else if (k < 0.45) lists[R() < 0.6 ? 'plant_broadleaf_b' : 'plant_broadleaf_a'].push([x, z, 1.4 + R() * 1.6, ry]); else if (k < 0.8) lists.fern_a.push([x, z, 1.3 + R() * 1.4, ry]); else if (k < 0.86) lists.hibiscus.push([x, z, 1 + R() * 0.6, ry]); else if (k < 0.89) lists.rock_b.push([x, z, 0.7 + R() * 1.2, ry]); }
  for (const n in lists) scatter(n, lists[n]);
  // green light motes drifting under the canopy
  const NM = 90, mg = new T.BufferGeometry(), mp = new Float32Array(NM * 3), mo = []; for (let i = 0; i < NM; i++) mo.push([(R() - 0.5) * 2 * J.r * 0.8, 0.5 + R() * 5, (R() - 0.5) * 2 * J.r * 0.8, R() * 6.28]); mg.setAttribute('position', new T.BufferAttribute(mp, 3));
  const motes = new T.Points(mg, new T.PointsMaterial({ size: 0.14, color: '#c8ff8a', transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })); motes.frustumCulled = false; root.add(motes);
  const idol = put('glyph_pedestal', J.x, J.z, 0.6, 1.3); const glow = new T.PointLight('#7fffd0', 0, 12, 1.5); glow.position.set(J.x, heightAt(J.x, J.z) + 1.6, J.z); root.add(glow); addCircle(J.x, J.z, 0.8, heightAt(J.x, J.z) + 1.4);
  G.thing({ x: J.x + 1.2, z: J.z + 1.2, r: 2.4, marker: '#3fbf6a', icon: 'shard', kind: 'activity', name: 'Jungle idol', label: () => S.flags.idol ? 'The idol hums quietly' : 'Touch the mossy idol', act: () => { if (S.flags.idol) { audio.ui(); G.hero.emote('think'); return; } S.flags.idol = 1; S.coins += 40; save(); hud.setCoins(S.coins); audio.fanfare(); hud.flash(); G.hero.emote('celebrate'); G.sparkle(J.x, heightAt(J.x, J.z) + 1.5, J.z, 50, 5); hud.result('Jungle Idol', '🗿', ['Something old is pleased you came', '+40 coins'], 3600); } });
  // ---------------------------------------------- Tide Pools: rocks, shallow basins and things that live in them
  const TP = { x: 132, z: 221 }; { const rocks = { rock_a: [], rock_b: [], rock_c: [] }; for (let i = 0; i < 26; i++) { const a = R() * 6.283, rr = 3 + R() * 9, x = TP.x + Math.cos(a) * rr, z = TP.z + Math.sin(a) * rr * 0.7; if (heightAt(x, z) < -0.6) continue; rocks[['rock_a', 'rock_b', 'rock_c'][i % 3]].push([x, z, 0.5 + R() * 0.9, R() * 6]); if (i % 3 === 0) addCircle(x, z, 0.55, heightAt(x, z) + 0.9); } for (const n in rocks) scatter(n, rocks[n]);
    const pm = new T.MeshPhysicalMaterial({ color: '#6fe0ee', roughness: 0.05, transparent: true, opacity: 0.72, envMapIntensity: 5 }); for (let i = 0; i < 5; i++) { const a = i * 1.3, x = TP.x + Math.cos(a) * (2 + i), z = TP.z + Math.sin(a) * (1.5 + i * 0.6), y = heightAt(x, z); if (y < 0.1) continue; const p = new T.Mesh(new T.CircleGeometry(0.9 + (i % 3) * 0.35, 20).rotateX(-Math.PI / 2), pm); p.position.set(x, y + 0.03, z); p.scale.z = 0.7; root.add(p); if (i % 2 === 0) { const s = models.starfish?.clone(); if (s) { s.position.set(x + 0.2, y + 0.04, z); s.scale.setScalar(0.9); root.add(s); } } } }
  // ---------------------------------------------- Sunset Lookout on the west coast path
  const L = { x: -146, z: 128 }; { const ry = Math.atan2(-L.x, -L.z) + Math.PI, bx = L.x, bz = L.z, b = put('bench', bx, bz, ry); for (const s of [-1, 1]) put('lamp_post', bx + Math.cos(ry) * 2.6 * s, bz - Math.sin(ry) * 2.6 * s, ry); for (let i = -2; i <= 2; i++) put('fence', bx + Math.sin(ry) * 2.4 + Math.cos(ry) * i * 2, bz + Math.cos(ry) * 2.4 - Math.sin(ry) * i * 2, ry);
    put('signpost', bx - Math.sin(ry) * 2 + 3, bz - Math.cos(ry) * 2, ry + 0.5); for (const [dx, dz, s] of [[4.5, 1, 1.4], [-4.8, 0.5, 1.2], [5.5, -2.5, 1.7]]) put('plant_broadleaf_b', bx + dx, bz + dz, dx, s);
    G.thing({ x: bx, z: bz, r: 1.9, label: 'Sit and watch the sea', act: () => { ctl.sitAt(bx + Math.sin(ry) * 0.12, heightAt(bx, bz) + 0.5, bz + Math.cos(ry) * 0.12, ry); audio.ui(); if (!S.flags.lookout) { S.flags.lookout = 1; S.coins += 15; save(); hud.setCoins(S.coins); hud.toast('Sunset Lookout', 'A good seat is its own reward. +15 coins'); } } }); }
  if (G.areas) { G.areas.push(['Whisper Jungle', 'Green light and old stone', J.x, J.z, J.r], ['Tide Pools', 'Little worlds in the rocks', TP.x, TP.z, 13], ['Sunset Lookout', 'Best seat on the west coast', L.x, L.z, 12]); G.areaTotal = G.areas.length; }
  let t = 0; G.systems.push((dt) => { t += dt; const hp = ctl.pos, near = Math.hypot(hp.x - J.x, hp.z - J.z) < J.r + 40; motes.visible = near; if (!near) return; for (let i = 0; i < NM; i++) { const o = mo[i], x = J.x + o[0] + Math.sin(t * 0.3 + o[3]) * 1.5, z = J.z + o[2] + Math.cos(t * 0.25 + o[3]) * 1.5; mp[i * 3] = x; mp[i * 3 + 1] = heightAt(x, z) + o[1] + Math.sin(t * 0.7 + o[3] * 2) * 0.4; mp[i * 3 + 2] = z; } mg.attributes.position.needsUpdate = true; glow.intensity = (S.flags.idol ? 10 : 4) + Math.sin(t * 2) * 2; });
}
