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
  await loadModels(loader, { golf_cart: 'vehicles', glider: 'vehicles', jetski: 'vehicles' });
  const hud = G.hud, ctl = G.ctl, hero = G.hero, P = SPOTS.plaza, root = G.world;
  // ------------------------------------------------ rides: anything you sit on and steer. E gets on, E gets off.
  let ride = null, camKeep = 0; const seat = new T.Vector3(), wrap = (d) => { while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return d; };
  function mount(v) { if (ride || G.act.A.cur) return audio.bad(); ride = v; ctl.driving = true; ctl.state.driving = true; if (v.col) v.col.off = true; G.busy = true; G.ride = { label: v.exitLabel, exit: dismount }; camKeep = ctl.cam.tDist; ctl.cam.tDist = Math.max(camKeep, v.camDist); audio.good(); hud.toast(v.name, v.help); hero.emote('happy'); }
  function dismount() { const v = ride; if (!v) return; input.interact = false; ride = null; G.ride = null; G.busy = false; ctl.driving = false; ctl.state.driving = false; ctl.state.steer = 0; ctl.cam.tDist = camKeep || 6.2; v.v = 0;
    if (v.col) { v.col.off = false; v.col.x = v.x; v.col.z = v.z; v.col.top = v.y + 1.4; } v.thing.x = v.x; v.thing.z = v.z;
    const [sx, sz] = v.exitSpot(); seat.set(sx, v.y, sz); resolve(seat, 0.4); ctl.teleport(seat.x, seat.z); ctl.yaw = v.yaw; audio.ui(); }
  G.dismount = dismount;
  // ---- golf carts
  for (const [x, z, yaw] of [[P.x + 12, P.z + 38, 2.2], [P.x - 30, P.z - 22, 0.6], [58, 206, 1.0], [SPOTS.lighthouse.x + 14, SPOTS.lighthouse.z + 10, 1.5], [-96, 150, 1.2]]) {
    const o = models.golf_cart.clone(), g = new T.Group(); g.add(o); root.add(g);
    const c = { kind: 'cart', name: 'Golf cart', help: 'W/S drive · A/D steer · Space honk · E hop out', exitLabel: 'Hop out', camDist: 7.5, g, o, x, z, y: groundAt(x, z), yaw, v: 0, bounce: 0, bv: 0, col: addCircle(x, z, 1.25, 1e9) };
    c.col.top = c.y + 1.4; g.position.set(x, c.y, z); g.rotation.y = yaw;
    c.exitSpot = () => [c.x + Math.cos(c.yaw) * 1.7, c.z - Math.sin(c.yaw) * 1.7];
    c.thing = G.thing({ x, z, r: 2.6, marker: '#ffffff', kind: 'cart', name: 'Golf cart', label: 'Drive the golf cart', act: () => mount(c) });
    c.update = (dt) => { const thr = -input.mz, top = thr > 0 ? 13 : 5; c.v += (thr * top - c.v) * Math.min(1, dt * (Math.abs(thr) > 0.1 ? 1.6 : 2.4)); const st = input.mx * Math.min(1, Math.abs(c.v) / 3) * Math.sign(c.v || 1); c.yaw -= st * dt * 1.9; ctl.state.steer = input.mx;
      const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw); seat.set(c.x + fx * c.v * dt, c.y, c.z + fz * c.v * dt); resolve(seat, 1.1);
      if (heightAt(seat.x, seat.z) < 0.25 || Math.abs(groundAt(seat.x, seat.z, c.y + 1) - c.y) > 1.3) { if (Math.abs(c.v) > 4) { c.bv += 2; audio.bounce(); } c.v *= -0.25; } else { c.x = seat.x; c.z = seat.z; }
      const ny = groundAt(c.x, c.z, c.y + 1); c.bv += (ny - c.y) * 6; c.y = ny; c.bv += (-c.bounce * 160 - c.bv * 11) * dt; c.bounce += c.bv * dt;
      const e = 1.1, pitch = Math.atan2(groundAt(c.x + fx * e, c.z + fz * e, c.y + 1) - groundAt(c.x - fx * e, c.z - fz * e, c.y + 1), 2 * e), roll = Math.atan2(groundAt(c.x + fz * 0.7, c.z - fx * 0.7, c.y + 1) - groundAt(c.x - fz * 0.7, c.z + fx * 0.7, c.y + 1), 1.4);
      c.g.position.set(c.x, c.y, c.z); c.g.rotation.set(0, c.yaw, 0); c.o.rotation.set(-pitch + c.bounce * 0.3, 0, roll * 0.8 + st * Math.abs(c.v) * 0.012); c.o.position.y = Math.max(-0.05, c.bounce * 0.12);
      ctl.sitAt(c.x - Math.cos(c.yaw) * 0.3 - fx * 0.14, c.y + 0.84 + c.o.position.y, c.z + Math.sin(c.yaw) * 0.3 - fz * 0.14, c.yaw);
      if (input.jump) { input.jump = false; audio.honk?.(); } if (Math.abs(c.v) > 6 && Math.random() < dt * 14) G.puff?.(c.x - fx * 1.2, c.y, c.z - fz * 1.2, 1, '#e6ddd0', 0.8, 0.6); return Math.abs(c.v); }; }
  // ---- jet skis: moored along the beach and the pier. They only run on water; run one up the sand and it just stops.
  const skis = []; let tw = 0;
  const waterSpot = (x, z) => { for (let k = 0; k < 40; k++) { if (heightAt(x, z) < -1.3) break; const d = Math.hypot(x, z) || 1; x += x / d * 1.5; z += z / d * 1.5; } return [x, z]; };
  if (models.jetski) for (const [x0, z0, yaw] of [[30, 246, 2.6], [44, 252, 3.0], [96, 250, 3.4], [SPOTS.lighthouse.x - 20, SPOTS.lighthouse.z + 40, 4.2], [150, 214, 2.4]]) {
    const [x, z] = waterSpot(x0, z0), o = models.jetski.clone(), g = new T.Group(); g.add(o); root.add(g);
    const k = { kind: 'ski', name: 'Jet ski', help: 'W throttle · S reverse · A/D lean · Space hop · E hop off', exitLabel: 'Hop off', camDist: 8, g, o, x, z, y: -0.18, yaw, v: 0, lean: 0, hop: 0, hv: 0, ph: Math.random() * 6 };
    k.exitSpot = () => [k.x + Math.cos(k.yaw) * 1.5, k.z - Math.sin(k.yaw) * 1.5];
    k.thing = G.thing({ x, z, r: 3.4, marker: '#59d7f5', kind: 'ski', name: 'Jet ski', label: 'Ride the jet ski', act: () => mount(k) });
    k.update = (dt) => { const thr = -input.mz, top = thr > 0 ? 19 : 5; k.v += (thr * top - k.v) * Math.min(1, dt * (Math.abs(thr) > 0.1 ? 1.1 : 0.8)); const st = input.mx * Math.min(1, 0.25 + Math.abs(k.v) / 8); k.yaw -= st * dt * 1.7 * Math.sign(k.v || 1); k.lean += (st * Math.min(1, Math.abs(k.v) / 12) - k.lean) * Math.min(1, dt * 5); ctl.state.steer = input.mx;
      const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), nx = k.x + fx * k.v * dt, nz = k.z + fz * k.v * dt; seat.set(nx, 0, nz); resolve(seat, 1.0);
      if (heightAt(seat.x, seat.z) > -0.55) { if (Math.abs(k.v) > 6) audio.splash?.(); k.v *= -0.2; } else { k.x = seat.x; k.z = seat.z; }
      if (input.jump && k.hop <= 0.01) { k.hv = 4.2 + Math.abs(k.v) * 0.12; audio.jump(); } input.jump = false;
      k.hv -= 14 * dt; k.hop += k.hv * dt; if (k.hop < 0) { if (k.hv < -3) { audio.splash?.(); G.puff?.(k.x, 0, k.z, 14, '#ffffff', 2.4, 2.2); } k.hop = 0; k.hv = 0; }
      const sp = Math.abs(k.v); if (sp > 3 && k.hop < 0.05 && Math.random() < dt * (10 + sp * 2)) { G.puff?.(k.x - fx * 1.3 + fz * (Math.random() - 0.5), 0, k.z - fz * 1.3 - fx * (Math.random() - 0.5), 2, '#ffffff', 1.2 + sp * 0.08, 0.8 + sp * 0.09); }
      ctl.sitAt(k.x + fx * 0.05, k.g.position.y + 0.62, k.z + fz * 0.05, k.yaw); return sp; };
    skis.push(k); }
  G.systems.push((dt) => { tw += dt;
    for (const k of skis) { if (Math.hypot(k.x - ctl.pos.x, k.z - ctl.pos.z) > 160) continue; const sp = Math.abs(k.v), bob = Math.sin(tw * 1.6 + k.ph) * 0.06 + Math.sin(tw * 2.7 + k.ph * 2) * 0.03; k.g.position.set(k.x, k.y + bob * (1 - Math.min(1, sp / 10) * 0.6) + k.hop + Math.min(0.14, sp * 0.008), k.z); k.g.rotation.set(0, k.yaw, 0);
      k.o.rotation.set(-Math.min(0.2, sp * 0.011) - k.hv * 0.03 + Math.sin(tw * 1.9 + k.ph) * 0.03, 0, -k.lean * 0.5 + Math.sin(tw * 1.3 + k.ph) * 0.04); if (ride !== k) { k.v *= Math.exp(-dt * 1.2); k.thing.x = k.x; k.thing.z = k.z; } }
    if (!ride) return; const sp = ride.update(dt); let d = wrap((ride.yaw + Math.PI) - ctl.cam.yaw); if (sp > 1) ctl.cam.yaw += d * Math.min(1, dt * 1.6); });
  // ------------------------------------------------ hang glider: pick one up once and it is yours. Press Space in mid-air (after your air hop) to open it.
  // W dives for speed, S pulls up and trades speed for height, A/D bank. Space folds it away; so does landing.
  const gl = models.glider.clone(), glPivot = new T.Group(); glPivot.add(gl); glPivot.visible = false; hero.group.add(glPivot); gl.position.set(0, -0.2, 0.42); let fv = 0, pitch = 0, roll = 0, head = 0, openK = 0, flying = false;
  const stands = [[SPOTS.windRidge.x + 9, SPOTS.windRidge.z + 12], [SPOTS.observatory.x - 12, SPOTS.observatory.z + 9], [PEAK.x + 18, PEAK.z + 12], [SPOTS.lighthouse.x - 6, SPOTS.lighthouse.z + 10], [-8, -22], [P.x + 30, P.z - 30]];
  for (const [x, z] of stands) { const y = groundAt(x, z), st = models.glider.clone(); st.position.set(x, y + 0.1, z); st.rotation.set(-0.35, 0.6, 0); st.scale.setScalar(0.9); root.add(st); const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 1.6, 8), new T.MeshStandardMaterial({ color: '#c98a4b' })); post.position.set(x + 0.9, y + 0.8, z); root.add(post);
    G.thing({ x, z, r: 2.6, marker: '#ffb04a', kind: 'glider', name: 'Hang glider', label: () => S.flags.glider ? 'Hang glider (you have one)' : 'Take a hang glider', act: () => { if (!S.flags.glider) { S.flags.glider = 1; save(); audio.fanfare(); hero.emote('celebrate'); G.addItem?.('glider', 1, true); } else audio.good(); hud.toast('Hang glider', 'Jump, hop again, then press Space in the air to open it'); } }); }
  const fold = () => { if (!flying) return; flying = false; ctl.flight = null; ctl.state.hang = false; audio.glide?.(false); };
  on('flightdrop', fold);
  ctl.onAirPress = () => { if (!S.flags.glider || flying || ctl.state.swim || G.busy) return; flying = true; head = ctl.yaw; fv = Math.max(10.5, ctl.state.speed + 2.5); pitch = -0.06; roll = 0; ctl.state.hang = true; audio.glide?.(true); audio.ui(); if (ctl.vel.y < -6) ctl.vel.y = -6;
    ctl.flight = (d, inp, vel) => { pitch += (inp.mz * 0.5 - pitch) * Math.min(1, d * 2.4); roll += (inp.mx * 0.75 - roll) * Math.min(1, d * 3.5); head -= roll * 1.75 * d;
      fv += (-Math.sin(pitch) * 17 - 0.22 * (fv - 11.5)) * d; fv = Math.max(4.5, Math.min(30, fv)); const stall = fv < 7.5 ? (7.5 - fv) * 1.7 : 0, sink = 1.25 + stall, cp = Math.cos(pitch);
      const ty = fv * Math.sin(pitch) - sink; vel.x = Math.sin(head) * fv * cp; vel.z = Math.cos(head) * fv * cp; vel.y += (ty - vel.y) * Math.min(1, d * 6); }; };
  G.systems.push((dt) => { openK += ((flying ? 1 : 0) - openK) * Math.min(1, dt * (flying ? 9 : 14)); glPivot.visible = openK > 0.03; const e = openK * openK * (3 - 2 * openK); glPivot.scale.set(0.25 + e * 0.75, e, e);
    const g = hero.group; if (flying) { g.rotation.z = -roll * 0.75; g.rotation.x = -pitch * 0.55; glPivot.rotation.set(0.12 + pitch * 0.2, 0, roll * 0.1 + Math.sin(tw * 5) * 0.012); if (Math.random() < dt * 9) G.puff?.(ctl.pos.x - Math.sin(head) * 1.2 + (Math.random() - 0.5) * 3, ctl.pos.y + 1.3, ctl.pos.z - Math.cos(head) * 1.2 + (Math.random() - 0.5) * 3, 1, '#ffffff', 0.2, 0.1); }
    else if (g.rotation.z || g.rotation.x) { g.rotation.z *= Math.exp(-dt * 12); g.rotation.x *= Math.exp(-dt * 12); if (Math.abs(g.rotation.z) + Math.abs(g.rotation.x) < 0.002) g.rotation.z = g.rotation.x = 0; } });
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
