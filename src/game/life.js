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
  await loadModels(loader, { stall_fruit: 'props', stall_tint: 'props', stall_hats: 'props' });
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
  const react = (em, radius = 7) => { for (const n of G.npcs) if (n.ai && Math.hypot(n.x - ctl.pos.x, n.z - ctl.pos.z) < radius && !n.talking) { n.h.emote(em); n.ai.react = 1.5; } };
  let lastEm = null; on('land', (v) => { if (v > 13) react('surprised', 6); }); on('star', () => react('celebrate', 12));
  G.systems.push((dt) => {
    const hp = ctl.pos; const em = hero.emoting; if (em && em !== lastEm) { const back = { wave: 'wave', celebrate: 'celebrate', happy: 'happy', love: 'love', laugh: 'laugh', sad: 'sad', confused: 'think', think: 'think', determined: 'surprised' }[em]; if (back) setTimeout(() => react(back, 6), 350); } lastEm = em;
    if (ctl.state.sliding && ctl.state.speed > 9) for (const n of G.npcs) if (n.ai && !n.ai.react && Math.hypot(n.x - hp.x, n.z - hp.z) < 3.2) { n.h.emote('surprised'); n.ai.react = 2; }
    for (const n of G.npcs) { if (!n.ai) continue; const a = n.ai, dx = hp.x - n.x, dz = hp.z - n.z, d = Math.hypot(dx, dz); if (d > 90) continue; a.react = Math.max(0, a.react - dt);
      const near = d < 3.4 || n.talking; let sp = 0;
      if (near) { let dy = Math.atan2(dx, dz) - n.h.group.rotation.y; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; n.h.group.rotation.y += dy * Math.min(1, dt * 6); if (performance.now() / 1000 - (n.waved || 0) > 25 && !n.talking) { n.h.emote('wave'); n.waved = performance.now() / 1000; } }
      else if (a.state === 'idle') { a.t -= dt; if (a.t < 0 && n.wander > 0) { const an = R() * 6.283, rr = R() * n.wander; a.tx = n.home.x + Math.cos(an) * rr; a.tz = n.home.z + Math.sin(an) * rr; if (heightAt(a.tx, a.tz) > 0.6) a.state = 'walk'; a.t = 7; } else if (a.t < 0) { a.t = 4 + R() * 6; if (R() < 0.4) n.h.emote(['think', 'happy', 'wave'][(R() * 3) | 0]); } }
      else { const tx = a.tx - n.x, tz = a.tz - n.z, td = Math.hypot(tx, tz); a.t -= dt; if (td < 0.3 || a.t < 0) { a.state = 'idle'; a.t = 2 + R() * 6; if (R() < 0.25) n.h.emote(['think', 'happy'][(R() * 2) | 0]); } else { sp = 1.9; tmp.set(n.x + tx / td * sp * dt, n.y, n.z + tz / td * sp * dt); n.col.off = true; resolve(tmp, 0.3); n.col.off = false; n.x = tmp.x; n.z = tmp.z; n.y = groundAt(n.x, n.z, n.y + 0.5); let dy = Math.atan2(tx, tz) - n.h.group.rotation.y; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; n.h.group.rotation.y += dy * Math.min(1, dt * 7); n.h.group.position.set(n.x, n.y, n.z); n.col.x = n.x; n.col.z = n.z; n.thing.x = n.x; n.thing.z = n.z; n.thing.y = n.y; } }
      n.st.speed = sp; n.st.input = true; if (d < 70) { n.h.update(dt, n.st); n.h.anim.idle = Math.min(n.h.anim.idle, 5); } }
  });

}
