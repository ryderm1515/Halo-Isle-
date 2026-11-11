import * as T from 'three';
import { S, save, on } from './state.js';
import { audio } from './audio.js';
import { input } from '../hero/controller.js';
import { groundAt, resolve, addCircle } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { SPOTS, PEAK } from '../world/layout.js';
import { models, loadModels } from '../world/world.js';
// Ways to get around: golf carts you can drive, hang gliders to launch from the high places, and diving under the sea for pearls.
export async function initTravel(G, loader) {
  await loadModels(loader, { golf_cart: 'vehicles', glider: 'vehicles' });
  const hud = G.hud, ctl = G.ctl, hero = G.hero, P = SPOTS.plaza, root = G.world;
  // ------------------------------------------------ golf carts
  const carts = []; let driving = null;
  for (const [x, z, yaw] of [[P.x + 12, P.z + 38, 2.2], [P.x - 30, P.z - 22, 0.6], [58, 206, 1.0], [SPOTS.lighthouse.x + 14, SPOTS.lighthouse.z + 10, 1.5]]) {
    const o = models.golf_cart.clone(), g = new T.Group(); g.add(o); root.add(g); const c = { g, x, z, y: groundAt(x, z), yaw, v: 0, col: addCircle(x, z, 1.25, 1e9) }; c.col.top = c.y + 1.4; g.position.set(x, c.y, z); g.rotation.y = yaw; carts.push(c);
    c.thing = G.thing({ x, z, r: 2.6, marker: '#ffffff', kind: 'cart', name: 'Golf cart', label: 'Drive the golf cart', act: () => { if (driving || G.act.A.cur && 0) return; driving = c; ctl.driving = true; c.col.off = true; audio.good(); hud.toast('Golf cart', 'W/S drive · A/D steer · Space honk · E hop out'); } }); }
  const seat = new T.Vector3();
  G.systems.push((dt) => { if (!driving) return; const c = driving;
    if (input.interact || ctl.locked && !hud.dialogOpen && 0) { input.interact = false; ctl.driving = false; const sx = c.x + Math.cos(c.yaw) * 1.6, sz = c.z - Math.sin(c.yaw) * 1.6; ctl.teleport(sx, sz); ctl.yaw = c.yaw; c.col.off = false; c.col.x = c.x; c.col.z = c.z; c.col.top = c.y + 1.4; c.thing.x = c.x; c.thing.z = c.z; c.v = 0; driving = null; G.busy = false; return; }
    G.busy = true; const thr = -input.mz, top = thr > 0 ? 13 : 5; c.v += (thr * top - c.v) * Math.min(1, dt * (Math.abs(thr) > 0.1 ? 1.6 : 2.4)); c.yaw -= input.mx * dt * 1.9 * Math.min(1, Math.abs(c.v) / 3) * Math.sign(c.v || 1);
    seat.set(c.x + Math.sin(c.yaw) * c.v * dt, c.y, c.z + Math.cos(c.yaw) * c.v * dt); resolve(seat, 1.1); if (heightAt(seat.x, seat.z) < 0.25 || Math.abs(groundAt(seat.x, seat.z, c.y + 1) - c.y) > 1.3) { c.v *= -0.25; } else { c.x = seat.x; c.z = seat.z; }
    c.y = groundAt(c.x, c.z, c.y + 1); const e = 1.1, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), pitch = Math.atan2(groundAt(c.x + fx * e, c.z + fz * e, c.y + 1) - groundAt(c.x - fx * e, c.z - fz * e, c.y + 1), 2 * e), roll = Math.atan2(groundAt(c.x + fz * 0.7, c.z - fx * 0.7, c.y + 1) - groundAt(c.x - fz * 0.7, c.z + fx * 0.7, c.y + 1), 1.4);
    c.g.position.set(c.x, c.y, c.z); c.g.rotation.set(0, c.yaw, 0); c.g.children[0].rotation.set(-pitch, 0, roll * 0.8);
    ctl.sitAt(c.x - Math.cos(c.yaw) * 0.32 + fx * 0.25, c.y + 0.86, c.z + Math.sin(c.yaw) * 0.32 + fz * 0.25, c.yaw); let d = (c.yaw + Math.PI) - ctl.cam.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; if (Math.abs(c.v) > 1) ctl.cam.yaw += d * Math.min(1, dt * 1.6);
    if (input.jump) { input.jump = false; audio.honk?.(); } if (Math.abs(c.v) > 6 && Math.random() < dt * 14) G.puff?.(c.x - fx * 1.2, c.y, c.z - fz * 1.2, 1, '#e6ddd0', 0.8, 0.6); });
  // ------------------------------------------------ hang gliders: take one from a stand, run off the edge, W dives for speed, S pulls up, A/D bank
  const gl = models.glider.clone(); gl.visible = false; hero.group.add(gl); gl.position.set(0, 0.25, -0.15); gl.rotation.y = Math.PI; let hang = false, fv = 0, pitch = 0, roll = 0;
  const stands = [[SPOTS.windRidge.x + 9, SPOTS.windRidge.z + 12], [SPOTS.observatory.x - 12, SPOTS.observatory.z + 9], [PEAK.x + 18, PEAK.z + 12], [SPOTS.lighthouse.x - 6, SPOTS.lighthouse.z + 10], [-8, -22]];
  for (const [x, z] of stands) { const y = groundAt(x, z), st = models.glider.clone(); st.position.set(x, y + 0.2, z); st.rotation.set(-0.5, 0.6, 0); root.add(st); const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 1.9, 8), new T.MeshStandardMaterial({ color: '#c98a4b' })); post.position.set(x + 0.9, y + 0.95, z); root.add(post);
    G.thing({ x, z, r: 2.6, marker: '#ffb04a', kind: 'glider', name: 'Hang glider', label: () => hang ? 'Put the glider back' : 'Take a hang glider', act: () => { hang = !hang; gl.visible = hang; audio.good(); if (hang) hud.toast('Hang glider', 'Run off a ledge · W dive · S pull up · A/D bank · Space lets go'); } }); }
  const drop = () => { ctl.flight = null; ctl.state.hang = false; roll = 0; gl.rotation.set(0, Math.PI, 0); };
  on('flightdrop', () => { drop(); hang = false; gl.visible = false; });
  G.systems.push((dt) => { if (!hang) return; const st = ctl.state;
    if (!ctl.flight && !st.grounded && ctl.vel.y < -1.5 && !st.swim) { fv = Math.max(11, st.speed + 3); pitch = -0.1; audio.glide?.(true);
      ctl.flight = (d, inp, vel) => { pitch += (inp.mz * 0.5 - pitch) * Math.min(1, d * 2.2); roll += (inp.mx * 0.6 - roll) * Math.min(1, d * 4);
        fv += (-Math.sin(pitch) * 16 - 0.2 * (fv - 11)) * d; fv = Math.max(4.5, Math.min(30, fv)); const yaw = Math.atan2(vel.x, vel.z) - inp.mx * 1.35 * d, stall = fv < 8 ? (8 - fv) * 1.4 : 0;
        vel.x = Math.sin(yaw) * fv * Math.cos(pitch); vel.z = Math.cos(yaw) * fv * Math.cos(pitch); vel.y = fv * Math.sin(pitch) - 1.5 - stall; }; }
    st.hang = !!ctl.flight; if (ctl.flight) { gl.rotation.set(-pitch * 0.5, Math.PI, -roll); hero.group.rotation.z = -roll * 0.6; hero.group.rotation.x = -pitch * 0.4; } else { hero.group.rotation.z = 0; hero.group.rotation.x = 0; } });
  // ------------------------------------------------ under the sea: hold C in deep water to dive; pearls wait on the seabed
  const tint = document.createElement('div'); tint.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(60,190,230,.25),rgba(10,70,150,.6));opacity:0;transition:opacity .35s;pointer-events:none'; hud.root.prepend(tint);
  const pearlGeo = new T.SphereGeometry(0.2, 16, 12), pearlMat = new T.MeshPhysicalMaterial({ color: '#fff6fb', emissive: '#ffb7e0', emissiveIntensity: 0.5, roughness: 0.12, clearcoat: 1, iridescence: 1, envMapIntensity: 5 }), shellMat = new T.MeshStandardMaterial({ color: '#ffd1b8', roughness: 0.6, side: T.DoubleSide });
  const pearls = []; let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 400 && pearls.length < 18; i++) { const x = 20 + rnd() * 150 - 30, z = 232 + rnd() * 70, h = heightAt(x, z); if (h > -1.6 || h < -5.5) continue; const m = new T.Mesh(pearlGeo, pearlMat); m.position.set(x, h + 0.3, z); const sh = new T.Mesh(new T.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shellMat); sh.position.y = -0.08; sh.scale.y = 0.5; m.add(sh); const id = 'p' + pearls.length; m.visible = !S.got[id]; root.add(m); pearls.push({ m, id, x, z, y: h + 0.3 }); }
  G.pearlTotal = pearls.length; let bub = 0;
  G.systems.push((dt) => { const st = ctl.state, hp = ctl.pos; const camUnder = G.camera.position.y < (st.surf ?? 0) - 0.05 && st.under; tint.style.opacity = camUnder || st.under ? 1 : 0; audio.setMuffle?.(st.under ? 1 : G.indoors ? 0.6 : 0);
    if (st.under) { bub -= dt; if (bub < 0) { bub = 0.25; G.puff?.(hp.x, hp.y + 0.9, hp.z, 2, '#dff6ff', 0.3, 2.4); } }
    for (const p of pearls) { if (!p.m.visible) continue; if (Math.hypot(p.x - hp.x, p.z - hp.z) < 1.1 && Math.abs(p.y - hp.y - 0.4) < 1.4) { p.m.visible = false; S.got[p.id] = 1; S.coins += 8; S.flags.pearls = (S.flags.pearls || 0) + 1; save(); hud.setCoins(S.coins); audio.star(); G.sparkle(p.x, p.y, p.z, 18, 3); hud.toast(`Pearl ${S.flags.pearls} of ${pearls.length}`, '+8 coins'); } } });
  if (!S.flags.diveHint) on('land', (v, wet) => { if (wet && !S.flags.diveHint && ctl.state.swim) { S.flags.diveHint = 1; save(); hud.toast('Swimming', 'Hold C to dive · pearls rest on the seabed'); } });
}
