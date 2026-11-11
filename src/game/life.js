import * as T from 'three';
import { S, save, on } from './state.js';
import { audio } from './audio.js';
import { groundAt, resolve, addCircle, addBox } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { SPOTS } from '../world/layout.js';
import { models, loadModels } from '../world/world.js';
import { rng } from '../util/noise.js';
// The island's inhabitants have minds of their own: islanders wander their patch, stop to chat, react to what you do;
// cats pad about and like being petted; little birds peck around and scatter when you run at them.
export async function initLife(G, loader) {
  await loadModels(loader, { cat: 'animals', bird: 'animals', stall_fruit: 'props', stall_tint: 'props', stall_hats: 'props' });
  const hud = G.hud, ctl = G.ctl, hero = G.hero, P = SPOTS.plaza, root = G.world, R = rng(909), D = Math.PI / 180;
  const pol = (a, r) => [P.x + Math.cos(a * D) * r, P.z + Math.sin(a * D) * r], face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  // ---- market stalls with their keepers
  const stalls = [['stall_fruit', 128, 24, 'Papaya', 'lemon', ['Fresh from the terraces! Well, they would be, if I ever sold any.', 'Take a look around the plaza. The <b>checkered flags</b> are races, and the old arch by the west side has a story.']],
    ['stall_tint', 30, 26, null, null, null], ['stall_hats', -62, 25, 'Brim', 'tide', ['Hats! Finest on the island. Only on the island, really.', 'Open your <b>Journal</b> (Tab) and look under <b>Wardrobe</b>. Coins welcome.']]];
  for (const [name, a, r, who, tint, lines] of stalls) { const [x, z] = pol(a, r), ry = face(x, z, P.x, P.z); const o = models[name].clone(); o.position.set(x, P.h, z); o.rotation.y = ry; root.add(o); addBox(x, z, 1.45, 0.7, ry, P.h + 1.05);
    if (who) await G.npc(who, tint, x - Math.sin(ry) * 1.35, z - Math.cos(ry) * 1.35, 0.95, lines, { yaw: ry, wander: 0 }); }
  { const jo = G.npcs.find((n) => n.name === 'Jelly Jo'), [x, z] = pol(30, 26), ry = face(x, z, P.x, P.z); if (jo) { jo.x = jo.home.x = x - Math.sin(ry) * 1.35; jo.z = jo.home.z = z - Math.cos(ry) * 1.35; jo.yaw = ry; jo.wander = 0; jo.h.group.position.set(jo.x, P.h, jo.z); jo.h.group.rotation.y = ry; jo.col.x = jo.x; jo.col.z = jo.z; jo.thing.x = jo.x; jo.thing.z = jo.z; } }
  // ---- more townsfolk, each with a line or two
  const folk = [['Dot', 'rose', 12, 20, ['I walk the plaza ring every day. Forty laps is my record.']], ['Finn', 'sky', 200, 24, ['Have you tried sliding? Hold <b>C</b> on a hill. Best feeling on the island.']], ['Olive', 'mint', -30, 30, ['The halo used to light the whole town at night. You could read by it.']],
    ['Sunny', 'lemon', 250, 18, ['If you jump three times in a row while running, the third one goes really high. Try it!']], ['Plum', 'grape', 95, 30, ['The bushes are bouncy. Don\'t tell the gardener I told you.']], ['Reef', 'tide', 160, 30, ['Stay out after dark at least once. The sky does something special.']]];
  for (const [n, t, a, r, l] of folk) { const [x, z] = pol(a, r); await G.npc(n, t, x, z, 0.82 + R() * 0.25, l, { wander: 9 }); }
  for (const [n, t, x, z, l] of [['Sandy', 'peach', 52, 216, ['The tide line is full of coins in the morning. No idea who drops them.']], ['Marina', 'sky', 88, 224, ['You can swim, you know. Hold <b>C</b> in deep water to dive.']]]) await G.npc(n, t, x, z, 0.9, l, { wander: 7 });
  // ---- wandering brains
  const tmp = new T.Vector3();
  for (const n of G.npcs) { n.ai = { state: 'idle', t: R() * 4, tx: n.x, tz: n.z, react: 0 }; if (n.wander == null) n.wander = n.name === 'Mayor Dew' ? 0 : 4.5; }
  const react = (em, radius = 7) => { for (const n of G.npcs) if (Math.hypot(n.x - ctl.pos.x, n.z - ctl.pos.z) < radius && !n.talking) { n.h.emote(em); n.ai.react = 1.5; } };
  let lastEm = null; on('land', (v) => { if (v > 13) react('surprised', 6); }); on('star', () => react('celebrate', 12));
  G.systems.push((dt) => {
    const hp = ctl.pos; const em = hero.emoting; if (em && em !== lastEm) { const back = { wave: 'wave', celebrate: 'celebrate', happy: 'happy', love: 'love', laugh: 'laugh', sad: 'sad', confused: 'think', think: 'think', determined: 'surprised' }[em]; if (back) setTimeout(() => react(back, 6), 350); } lastEm = em;
    if (ctl.state.sliding && ctl.state.speed > 9) for (const n of G.npcs) if (!n.ai.react && Math.hypot(n.x - hp.x, n.z - hp.z) < 3.2) { n.h.emote('surprised'); n.ai.react = 2; }
    for (const n of G.npcs) { const a = n.ai, dx = hp.x - n.x, dz = hp.z - n.z, d = Math.hypot(dx, dz); if (d > 90) continue; a.react = Math.max(0, a.react - dt);
      const near = d < 3.4 || n.talking; let sp = 0;
      if (near) { let dy = Math.atan2(dx, dz) - n.h.group.rotation.y; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; n.h.group.rotation.y += dy * Math.min(1, dt * 6); if (performance.now() / 1000 - (n.waved || 0) > 25 && !n.talking) { n.h.emote('wave'); n.waved = performance.now() / 1000; } }
      else if (a.state === 'idle') { a.t -= dt; if (a.t < 0 && n.wander > 0) { const an = R() * 6.283, rr = R() * n.wander; a.tx = n.home.x + Math.cos(an) * rr; a.tz = n.home.z + Math.sin(an) * rr; if (heightAt(a.tx, a.tz) > 0.6) a.state = 'walk'; a.t = 7; } else if (a.t < 0) { a.t = 4 + R() * 6; if (R() < 0.4) n.h.emote(['think', 'happy', 'wave'][(R() * 3) | 0]); } }
      else { const tx = a.tx - n.x, tz = a.tz - n.z, td = Math.hypot(tx, tz); a.t -= dt; if (td < 0.3 || a.t < 0) { a.state = 'idle'; a.t = 2 + R() * 6; if (R() < 0.25) n.h.emote(['think', 'happy'][(R() * 2) | 0]); } else { sp = 1.9; tmp.set(n.x + tx / td * sp * dt, n.y, n.z + tz / td * sp * dt); n.col.off = true; resolve(tmp, 0.3); n.col.off = false; n.x = tmp.x; n.z = tmp.z; n.y = groundAt(n.x, n.z, n.y + 0.5); let dy = Math.atan2(tx, tz) - n.h.group.rotation.y; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; n.h.group.rotation.y += dy * Math.min(1, dt * 7); n.h.group.position.set(n.x, n.y, n.z); n.col.x = n.x; n.col.z = n.z; n.thing.x = n.x; n.thing.z = n.z; n.thing.y = n.y; } }
      n.st.speed = sp; n.st.input = true; if (d < 70) { n.h.update(dt, n.st); n.h.anim.idle = Math.min(n.h.anim.idle, 5); } }
  });
  // ---- cats
  const cats = [], catTints = ['#f2a65a', '#3a3a44', '#f4f1ea', '#9a9aa6', '#c98a4b', '#f2a65a'];
  const mkTinted = (name, color, scale) => { const o = models[name].clone(); o.traverse((m) => { if (m.isMesh && m.material.name === 'M_Tint') { m.material = m.material.clone(); m.material.color.set(color); m.material.name = 'tinted'; } }); o.scale.setScalar(scale); const g = new T.Group(); g.add(o); root.add(g); return g; };
  for (const [x, z, i] of [[P.x + 12, P.z + 4, 0], [P.x - 16, P.z + 12, 1], [P.x + 4, P.z - 18, 2], [60, 214, 3], [SPOTS.lighthouse.x + 6, SPOTS.lighthouse.z + 8, 4], [SPOTS.ruins.x - 6, SPOTS.ruins.z + 12, 5]]) {
    const g = mkTinted('cat', catTints[i], 1.15), c = { g, x, z, hx: x, hz: z, state: 'sit', t: R() * 5, tx: x, tz: z, yaw: R() * 6, ph: R() * 6, name: ['Mango', 'Soot', 'Pearl', 'Ash', 'Biscuit', 'Tangerine'][i] }; cats.push(c);
    c.thing = G.thing({ x, z, r: 1.5, label: `Pet ${c.name}`, act: () => { audio.purr?.(); audio.talk(); G.sparkle(c.x, groundAt(c.x, c.z) + 0.6, c.z, 8, 1.5); hero.emote('love'); c.state = 'sit'; c.t = 5; c.purr = 2; S.flags.pets = (S.flags.pets || 0) + 1; save(); if (S.flags.pets === 1) hud.toast('Made a friend', `${c.name} likes you`); } }); }
  // ---- little birds in loose flocks
  const birds = []; const birdCols = ['#ffffff', '#ffd23f', '#6fc3ff', '#ff9a6b', '#f4f1ea'];
  for (const [cx, cz, n] of [[P.x - 14, P.z - 8, 5], [P.x + 18, P.z + 16, 4], [46, 210, 5], [0, 160, 4], [SPOTS.ruins.x - 12, SPOTS.ruins.z + 14, 4], [-60, 168, 4]]) for (let k = 0; k < n; k++) { const x = cx + (R() - 0.5) * 6, z = cz + (R() - 0.5) * 6, g = mkTinted('bird', birdCols[(R() * birdCols.length) | 0], 1.3); birds.push({ g, x, z, y: 0, cx, cz, state: 'peck', t: R() * 3, yaw: R() * 6, ph: R() * 6, vx: 0, vz: 0, fly: 0 }); }
  let chirpT = 3;
  G.systems.push((dt) => {
    const hp = ctl.pos, t = performance.now() / 1000;
    for (const c of cats) { const d = Math.hypot(hp.x - c.x, hp.z - c.z); if (d > 80) continue; c.t -= dt; let moving = false;
      if (c.state === 'sit') { if (c.t < 0) { const a = R() * 6.283, r = 2 + R() * 7; c.tx = c.hx + Math.cos(a) * r; c.tz = c.hz + Math.sin(a) * r; if (heightAt(c.tx, c.tz) > 0.5) { c.state = 'walk'; c.t = 8; } else c.t = 1; } if (d < 4 && d > 1.2 && !c.purr) { let dy = Math.atan2(hp.x - c.x, hp.z - c.z) - c.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; c.yaw += dy * Math.min(1, dt * 3); } }
      else { const tx = c.tx - c.x, tz = c.tz - c.z, td = Math.hypot(tx, tz); if (td < 0.25 || c.t < 0) { c.state = 'sit'; c.t = 3 + R() * 7; } else { const sp = 1.5; c.x += tx / td * sp * dt; c.z += tz / td * sp * dt; let dy = Math.atan2(tx, tz) - c.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; c.yaw += dy * Math.min(1, dt * 6); moving = true; } }
      c.purr = Math.max(0, (c.purr || 0) - dt); const y = groundAt(c.x, c.z, 50), hop = moving ? Math.abs(Math.sin(t * 9 + c.ph)) * 0.07 : 0; c.g.position.set(c.x, y + hop, c.z); c.g.rotation.y = c.yaw + Math.PI; c.g.rotation.x = moving ? Math.sin(t * 9 + c.ph) * 0.06 : 0; const sq = c.state === 'sit' ? 1 + Math.sin(t * 2 + c.ph) * 0.02 + (c.purr ? Math.sin(t * 30) * 0.015 : 0) : 1; c.g.scale.set(1, sq, 1); c.thing.x = c.x; c.thing.z = c.z; }
    chirpT -= dt;
    for (const b of birds) { const dx = b.x - hp.x, dz = b.z - hp.z, d = Math.hypot(dx, dz); if (d > 90) continue; const gy = Math.max(groundAt(b.x, b.z, 50), 0);
      if (b.state === 'peck') { b.t -= dt; if (d < 3.6 && ctl.state.speed > 1 || d < 1.6) { b.state = 'fly'; b.fly = 0; const a = Math.atan2(dz, dx) + (R() - 0.5), r = 14 + R() * 12; b.tx = b.cx + Math.cos(a) * r * 0.6 + (R() - 0.5) * 8; b.tz = b.cz + Math.sin(a) * r * 0.6 + (R() - 0.5) * 8; if (heightAt(b.tx, b.tz) < 0.4) { b.tx = b.cx; b.tz = b.cz; } b.sx = b.x; b.sz = b.z; b.sy = gy; if (chirpT < 0) { audio.chirp?.(); chirpT = 0.6; } }
        else if (b.t < 0) { b.t = 0.6 + R() * 2.5; if (R() < 0.5) { b.yaw += (R() - 0.5) * 2.5; b.hopT = 0.25; } }
        if (b.hopT > 0) { b.hopT -= dt; b.x += Math.sin(b.yaw) * dt * 1.2; b.z += Math.cos(b.yaw) * dt * 1.2; }
        const peck = Math.max(0, Math.sin(t * 5 + b.ph)) ** 6; b.g.position.set(b.x, gy + (b.hopT > 0 ? Math.sin((0.25 - b.hopT) / 0.25 * Math.PI) * 0.08 : 0), b.z); b.g.rotation.set(peck * 0.7, b.yaw + Math.PI, 0); b.g.scale.set(1, 1, 1); }
      else { b.fly += dt / 2.2; const k = Math.min(1, b.fly), e = k * k * (3 - 2 * k); b.x = b.sx + (b.tx - b.sx) * e; b.z = b.sz + (b.tz - b.sz) * e; const ty = Math.max(groundAt(b.tx, b.tz, 50), 0), y = b.sy + (ty - b.sy) * e + Math.sin(k * Math.PI) * 4.5; b.yaw = Math.atan2(b.tx - b.sx, b.tz - b.sz); const flap = Math.sin(t * 34 + b.ph); b.g.position.set(b.x, y, b.z); b.g.rotation.set(-0.3, b.yaw + Math.PI, 0); b.g.scale.set(1 + flap * 0.5, 1 - flap * 0.15, 1); if (k >= 1) { b.state = 'peck'; b.t = 1; b.cx = b.tx; b.cz = b.tz; } } }
    if (chirpT < -6 && birds.some((b) => Math.hypot(b.x - hp.x, b.z - hp.z) < 25)) { audio.chirp?.(); chirpT = 2 + Math.random() * 5; }
  });
  G.cats = cats; G.birds = birds;
}
