import * as T from 'three';
import { S, save } from './state.js';
import { audio } from './audio.js';
import { groundAt } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { SPOTS } from '../world/layout.js';
import { models, loadModels } from '../world/world.js';
import { rng, clamp } from '../util/noise.js';
// The island's animals, built in the same soft toy style as the islanders: cats that watch you and follow after a pet,
// songbirds in loose flocks, gulls that stand about on the sand and wheel overhead, crabs that scuttle and wave, fish that jump.
export async function initAnimals(G, loader) {
  await loadModels(loader, { cat: 'animals', bird: 'animals', gull: 'animals', crab: 'animals' });
  const hud = G.hud, ctl = G.ctl, hero = G.hero, P = SPOTS.plaza, root = G.world, R = rng(909);
  const wrap = (d) => { while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return d; };
  const gloss = {}; const tintMat = (c) => (gloss[c] ||= new T.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2, sheen: 0.5, sheenColor: '#ffffff', sheenRoughness: 0.5 }));
  const mk = (name, color, scale) => { const o = models[name].clone(); const parts = {}; o.traverse((m) => { if (m.isMesh) { m.castShadow = true; if (m.material.name === 'M_Tint') m.material = tintMat(color); } if (m.name) parts[m.name.replace(/_\d+$/, '')] = m; });
    for (const k of ['body', 'head', 'tail', 'wingL', 'wingR', 'clawL', 'clawR']) { let n = o.getObjectByName(k); if (n) { while (n.parent && n.parent !== o && n.parent.name !== name && !n.parent.isScene && n.parent.type !== 'Group') n = n.parent; parts[k] = o.getObjectByName(k); } }
    o.scale.setScalar(scale); const g = new T.Group(); g.add(o); root.add(g); return { g, o, p: parts }; };
  const night = () => G.time?.night || 0;
  // ------------------------------------------------ cats
  const cats = [], catTints = ['#f6a85c', '#4a4a58', '#fbf7ee', '#a9a9b8', '#d49a5c', '#f6a85c', '#f2c98a'], catNames = ['Mango', 'Soot', 'Pearl', 'Ash', 'Biscuit', 'Tangerine', 'Sandy'];
  [[P.x + 12, P.z + 4], [P.x - 16, P.z + 12], [P.x + 4, P.z - 18], [60, 214], [SPOTS.lighthouse.x + 6, SPOTS.lighthouse.z + 8], [SPOTS.ruins.x - 6, SPOTS.ruins.z + 12], [P.x + 24, P.z + 30]].forEach(([x, z], i) => {
    const m = mk('cat', catTints[i], 1.25), c = { ...m, x, z, hx: x, hz: z, state: 'sit', t: R() * 5, tx: x, tz: z, yaw: R() * 6, ph: R() * 6, name: catNames[i], sp: 0, follow: 0, purr: 0, hy: 0, hxr: 0, sit: 1 }; cats.push(c);
    c.thing = G.thing({ x, z, r: 1.6, label: () => (c.purr > 0 ? `${c.name} is purring` : `Pet ${c.name}`), act: () => { audio.purr?.(); G.sparkle(c.x, groundAt(c.x, c.z) + 0.6, c.z, 8, 1.5); hero.emote('love'); c.state = 'sit'; c.t = 4; c.purr = 3; c.follow = 28; S.flags.pets = (S.flags.pets || 0) + 1; save(); if (S.flags.pets === 1) hud.toast('Made a friend', `${c.name} will tag along for a bit`); } }); });
  // ------------------------------------------------ songbirds in loose flocks
  const birds = [], birdCols = ['#ffffff', '#ffd84a', '#6fc3ff', '#ff9a6b', '#ff8fb5', '#9be05a'];
  for (const [cx, cz, n] of [[P.x - 14, P.z - 8, 5], [P.x + 18, P.z + 16, 4], [46, 210, 4], [0, 160, 4], [SPOTS.ruins.x - 12, SPOTS.ruins.z + 14, 4], [-60, 168, 4], [SPOTS.observatory.x - 14, SPOTS.observatory.z + 12, 3]]) for (let k = 0; k < n; k++) {
    const x = cx + (R() - 0.5) * 6, z = cz + (R() - 0.5) * 6, m = mk('bird', birdCols[(R() * birdCols.length) | 0], 1.5); birds.push({ ...m, x, z, y: 0, cx, cz, state: 'peck', t: R() * 3, yaw: R() * 6, ph: R() * 6, fly: 0, hopT: 0, wing: 0 }); }
  // ------------------------------------------------ gulls: some stand on the sand, some are always up riding the wind
  const gulls = [];
  for (let i = 0; i < 12; i++) { const m = mk('gull', '#ffffff', 1.25), air = i >= 5; let x = 30 + R() * 90, z = 222 + R() * 14; for (let k = 0; k < 20 && (heightAt(x, z) < 0.5 || heightAt(x, z) > 2.4); k++) { x = 20 + R() * 110; z = 214 + R() * 26; }
    gulls.push({ ...m, x, z, y: 0, hx: x, hz: z, state: air ? 'air' : 'stand', home: !air, t: R() * 5, yaw: R() * 6, ph: R() * 6, cx: air ? (R() - 0.5) * 420 : x, cz: air ? (R() - 0.5) * 380 + 120 : z, r: 36 + R() * 80, h: 26 + R() * 50, dir: R() < 0.5 ? 1 : -1, sp: 0.1 + R() * 0.07, k: air ? 1 : 0, lookT: 0, hy: 0 }); }
  // ------------------------------------------------ crabs on the wet sand
  const crabs = [];
  for (let i = 0, n = 0; i < 300 && n < 9; i++) { const x = 10 + R() * 130, z = 216 + R() * 30, h = heightAt(x, z); if (h < 0.25 || h > 1.5) continue; n++; const m = mk('crab', ['#ff6b4a', '#ff8a3d', '#f0524a'][n % 3], 1.3); crabs.push({ ...m, x, z, yaw: R() * 6, t: R() * 3, dir: 1, v: 0, ph: R() * 6, up: 0 }); }
  // ------------------------------------------------ fish that leap out past the breakers
  const fish = [], fGeo = new T.SphereGeometry(0.2, 12, 8).scale(0.45, 0.8, 1.6), tGeo = new T.ConeGeometry(0.16, 0.26, 4).rotateX(-Math.PI / 2).scale(0.3, 1.2, 1).translate(0, 0, -0.4);
  for (let i = 0; i < 5; i++) { const m = new T.Mesh(fGeo, tintMat(['#ffb04a', '#6fc3ff', '#ff8fb5', '#ffd84a', '#8fe0c0'][i])); m.add(new T.Mesh(tGeo, m.material)); m.visible = false; root.add(m); fish.push({ m, t: 2 + R() * 8, k: 1, x: 0, z: 0, yaw: 0 }); }
  let chirpT = 3, T0 = 0;
  G.systems.push((dt) => {
    T0 += dt; const hp = ctl.pos, t = T0, nt = night(), moving = ctl.state.speed > 1;
    // ---- cats
    for (const c of cats) { const dx = hp.x - c.x, dz = hp.z - c.z, d = Math.hypot(dx, dz); if (d > 80) { c.g.visible = false; continue; } c.g.visible = true; c.t -= dt; c.purr = Math.max(0, c.purr - dt); c.follow = Math.max(0, c.follow - dt); let want = 0;
      const sleepy = nt > 0.7 && !c.follow && d > 3;
      if (c.follow && d > 2.2 && !G.indoors && !G.busy) { c.state = 'walk'; c.tx = hp.x - dx / d * 1.5; c.tz = hp.z - dz / d * 1.5; c.t = 2; want = d > 7 ? 5.2 : 2.6; }
      else if (c.state === 'sit') { if (c.t < 0 && !sleepy && !c.purr) { const a = R() * 6.283, r = 2 + R() * 7; c.tx = c.hx + Math.cos(a) * r; c.tz = c.hz + Math.sin(a) * r; if (heightAt(c.tx, c.tz) > 0.5) { c.state = 'walk'; c.t = 8; } else c.t = 1; } }
      if (c.state === 'walk') { const tx = c.tx - c.x, tz = c.tz - c.z, td = Math.hypot(tx, tz); if (td < 0.3 || c.t < 0) { c.state = 'sit'; c.t = 3 + R() * 7; } else { want ||= 1.5; c.yaw += wrap(Math.atan2(tx, tz) - c.yaw) * Math.min(1, dt * 7); } }
      c.sp += (want - c.sp) * Math.min(1, dt * 6); if (c.sp > 0.05) { c.x += Math.sin(c.yaw) * c.sp * dt; c.z += Math.cos(c.yaw) * c.sp * dt; }
      const walk = Math.min(1, c.sp / 1.2), gait = t * (8 + c.sp * 2.2) + c.ph, y = groundAt(c.x, c.z, 50); c.sit += ((c.state === 'sit' ? 1 : 0) - c.sit) * Math.min(1, dt * 6); const sl = sleepy && c.state === 'sit' ? 1 : 0; c.sl = (c.sl || 0) + (sl - (c.sl || 0)) * Math.min(1, dt * 2);
      c.g.position.set(c.x, y + Math.abs(Math.sin(gait)) * 0.05 * walk, c.z); c.g.rotation.y = c.yaw;
      const b = c.p.body, h = c.p.head, tl = c.p.tail; if (b) { b.rotation.set(-c.sit * 0.28 + c.sl * 0.2, 0, Math.sin(gait) * 0.07 * walk); b.scale.set(1 + c.sl * 0.08, 1 + Math.sin(t * 2 + c.ph) * 0.025 + (c.purr ? Math.sin(t * 34) * 0.012 : 0) - c.sl * 0.2, 1); }
      // the head keeps an eye on you when you are close
      const rel = wrap(Math.atan2(dx, dz) - c.yaw), watch = d < 7 && Math.abs(rel) < 1.9 && !c.sl ? 1 : 0; c.hy += ((watch ? clamp(rel, -1.1, 1.1) : Math.sin(t * 0.5 + c.ph) * 0.3 * c.sit) - c.hy) * Math.min(1, dt * 5); c.hxr += ((watch ? -clamp((hp.y + 0.8 - y) * 0.2 / Math.max(d, 1), -0.2, 0.5) : 0) - c.hxr) * Math.min(1, dt * 5);
      if (h) { h.rotation.set(c.hxr + c.sit * 0.2 + c.sl * 0.55 - Math.sin(gait * 2) * 0.04 * walk, c.hy, (c.purr ? Math.sin(t * 3) * 0.2 : 0) + c.hy * 0.15); h.position.y = h.userData.y0 ??= h.position.y; h.position.y = h.userData.y0 - c.sl * 0.06; }
      if (tl) tl.rotation.set(-walk * 0.5 + Math.sin(t * 1.4 + c.ph) * 0.12 + c.sl * 0.9, 0, Math.sin(t * (c.purr ? 5 : 2.2) + c.ph) * (0.35 + walk * 0.2) * (1 - c.sl * 0.8));
      c.thing.x = c.x; c.thing.z = c.z; }
    // ---- songbirds
    chirpT -= dt;
    for (const b of birds) { const dx = b.x - hp.x, dz = b.z - hp.z, d = Math.hypot(dx, dz); if (d > 90) { b.g.visible = false; continue; } b.g.visible = true; const gy = Math.max(groundAt(b.x, b.z, 50), 0); let pitch = 0, yb = 0, flap = 0;
      if (b.state === 'peck') { b.t -= dt; if (d < 3.8 && moving || d < 1.6) { b.state = 'fly'; b.fly = 0; const a = Math.atan2(dz, dx) + (R() - 0.5), r = 14 + R() * 12; b.tx = b.cx + Math.cos(a) * r * 0.6 + (R() - 0.5) * 8; b.tz = b.cz + Math.sin(a) * r * 0.6 + (R() - 0.5) * 8; if (heightAt(b.tx, b.tz) < 0.4) { b.tx = b.cx; b.tz = b.cz; } b.sx = b.x; b.sz = b.z; b.sy = gy; if (chirpT < 0) { audio.chirp?.(); chirpT = 0.6; } }
        else if (b.t < 0) { b.t = 0.5 + R() * 2.4; const k = R(); if (k < 0.5) { b.yawT = b.yaw + (R() - 0.5) * 2.6; b.hopT = 0.24; } else if (k < 0.7) b.shake = 0.5; }
        if (b.yawT != null) b.yaw += wrap(b.yawT - b.yaw) * Math.min(1, dt * 12);
        if (b.hopT > 0) { b.hopT -= dt; b.x += Math.sin(b.yaw) * dt * 1.3; b.z += Math.cos(b.yaw) * dt * 1.3; yb = Math.sin((0.24 - b.hopT) / 0.24 * Math.PI) * 0.09; flap = 0.3; }
        b.shake = Math.max(0, (b.shake || 0) - dt); pitch = Math.max(0, Math.sin(t * 4.6 + b.ph)) ** 8 * 0.9; if (b.shake) flap = Math.abs(Math.sin(t * 40)) * 0.8; b.y = gy + yb; }
      else { b.fly += dt / 2.3; const k = Math.min(1, b.fly), e = k * k * (3 - 2 * k); b.x = b.sx + (b.tx - b.sx) * e; b.z = b.sz + (b.tz - b.sz) * e; const ty = Math.max(groundAt(b.tx, b.tz, 50), 0); b.y = b.sy + (ty - b.sy) * e + Math.sin(k * Math.PI) * 4.8; b.yaw = Math.atan2(b.tx - b.sx, b.tz - b.sz); flap = 0.25 + Math.abs(Math.sin(t * 30 + b.ph)) * 1.25; pitch = -0.35 + k * 0.3; if (k >= 1) { b.state = 'peck'; b.t = 1; b.cx = b.tx; b.cz = b.tz; b.yawT = null; } }
      b.wing += (flap - b.wing) * Math.min(1, dt * 30); b.g.position.set(b.x, b.y, b.z); b.g.rotation.set(0, b.yaw, 0); b.o.rotation.x = pitch; if (b.p.wingL) { b.p.wingL.rotation.z = b.wing; b.p.wingR.rotation.z = -b.wing; } }
    if (chirpT < -6 && nt < 0.5 && birds.some((b) => Math.hypot(b.x - hp.x, b.z - hp.z) < 25)) { audio.chirp?.(); chirpT = 2 + Math.random() * 5; }
    // ---- gulls
    for (const u of gulls) { let flap = 0, bank = 0, pitch = 0;
      if (u.state === 'stand') { const d = Math.hypot(u.x - hp.x, u.z - hp.z); u.y = groundAt(u.x, u.z, 50); u.lookT -= dt; if (u.lookT < 0) { u.lookT = 1 + R() * 3; u.yawT = u.yaw + (R() - 0.5) * 2.2; } u.yaw += wrap((u.yawT ?? u.yaw) - u.yaw) * Math.min(1, dt * 4); pitch = Math.max(0, Math.sin(t * 0.9 + u.ph)) ** 20 * 0.6;
        if (d < 4.5 && moving || d < 2) { u.state = 'up'; u.k = 0; u.t = 10 + R() * 8; u.cx = u.x + (R() - 0.5) * 20; u.cz = u.z + 20 + R() * 20; u.a = Math.atan2(u.z - u.cz, u.x - u.cx); u.r = Math.hypot(u.x - u.cx, u.z - u.cz); u.h = 9 + R() * 8; if (Math.random() < 0.5) audio.ambience && 0; } }
      else { if (u.state === 'up') { u.k = Math.min(1, u.k + dt * 0.45); u.t -= dt; if (u.t < 0 && u.home) u.state = 'down'; } else if (u.state === 'down') { u.k -= dt * 0.35; if (u.k <= 0) { u.k = 0; u.state = 'stand'; u.x = u.hx; u.z = u.hz; } }
        const a = u.state === 'air' ? t * u.sp * u.dir + u.ph : (u.a += dt * 8 / Math.max(u.r, 6) * u.dir), e = u.k * u.k * (3 - 2 * u.k);
        const px = u.cx + Math.cos(a) * u.r, pz = u.cz + Math.sin(a) * u.r; if (u.state === 'air') { u.x = px; u.z = pz; u.y = u.h + Math.sin(a * 2 + u.ph) * 3; } else { u.x = u.hx + (px - u.hx) * e; u.z = u.hz + (pz - u.hz) * e; u.y = groundAt(u.hx, u.hz, 50) + u.h * e; }
        u.yaw = Math.atan2(-Math.sin(a) * u.dir, Math.cos(a) * u.dir) ; const glide = Math.sin(t * 0.33 + u.ph * 3) > 0.2 && u.state === 'air'; flap = glide ? 0.12 + Math.sin(t * 1.3 + u.ph) * 0.05 : 0.2 + Math.sin(t * (u.state === 'air' ? 7 : 12) + u.ph) * 0.75; bank = -0.3 * u.dir; pitch = -0.1; }
      u.hy += (flap - u.hy) * Math.min(1, dt * 20); u.g.position.set(u.x, u.y, u.z); u.g.rotation.set(0, u.yaw, 0); u.o.rotation.set(pitch, 0, bank); if (u.p.wingL) { u.p.wingL.rotation.z = u.hy; u.p.wingR.rotation.z = -u.hy; const open = u.state === 'stand' ? 1 : 2.3; u.p.wingL.scale.x = u.p.wingR.scale.x = open; } }
    // ---- crabs: scuttle sideways, claws up when you come close
    for (const c of crabs) { const dx = c.x - hp.x, dz = c.z - hp.z, d = Math.hypot(dx, dz); if (d > 70) { c.g.visible = false; continue; } c.g.visible = true; c.t -= dt; const near = d < 3.2;
      if (near) { const away = Math.atan2(dx, dz); c.dir = Math.sin(wrap(away - c.yaw)) > 0 ? 1 : -1; c.v = 2.6; } else if (c.t < 0) { c.t = 0.8 + R() * 2.5; c.v = R() < 0.6 ? (0.6 + R()) : 0; c.dir = R() < 0.5 ? 1 : -1; if (R() < 0.3) c.yaw += (R() - 0.5) * 1.5; }
      const nx = c.x + Math.cos(c.yaw) * c.dir * c.v * dt, nz = c.z - Math.sin(c.yaw) * c.dir * c.v * dt, h = heightAt(nx, nz); if (h > 0.1 && h < 2.2) { c.x = nx; c.z = nz; } else c.dir *= -1;
      c.up += ((near ? 1 : 0) - c.up) * Math.min(1, dt * 8); c.g.position.set(c.x, groundAt(c.x, c.z, 50) + Math.abs(Math.sin(t * 16 + c.ph)) * 0.015 * Math.min(1, c.v), c.z); c.g.rotation.y = c.yaw; c.o.rotation.z = Math.sin(t * 16 + c.ph) * 0.06 * Math.min(1, c.v);
      if (c.p.clawL) { const w = Math.sin(t * (near ? 9 : 2) + c.ph); c.p.clawL.rotation.set(-c.up * 0.9 - 0.1 + w * 0.12, 0, c.up * 0.3 + w * 0.1); c.p.clawR.rotation.set(-c.up * 0.9 - 0.1 - w * 0.12, 0, -c.up * 0.3 + w * 0.1); } }
    // ---- fish
    for (const f of fish) { if (f.k >= 1) { f.t -= dt; f.m.visible = false; if (f.t < 0) { const a = Math.random() * 6.283, r = 14 + Math.random() * 40, x = hp.x + Math.cos(a) * r, z = hp.z + Math.sin(a) * r; f.t = 3 + Math.random() * 9; if (heightAt(x, z) < -1.6 && nt < 0.8) { f.x = x; f.z = z; f.yaw = Math.random() * 6.283; f.k = 0; G.puff?.(x, 0, z, 6, '#ffffff', 1, 1.4); if (r < 26) audio.splash?.(); } } continue; }
      f.k += dt / 1.1; const k = f.k, d = k * 3.2; f.m.visible = true; f.m.position.set(f.x + Math.sin(f.yaw) * d, Math.sin(k * Math.PI) * 1.5 - 0.1, f.z + Math.cos(f.yaw) * d); f.m.rotation.set(-Math.cos(k * Math.PI) * 1.0, f.yaw, Math.sin(k * 20) * 0.2, 'YXZ'); if (f.k >= 1) G.puff?.(f.m.position.x, 0, f.m.position.z, 5, '#ffffff', 0.8, 1.1); }
  });
  G.cats = cats; G.birds = birds; G.gulls = gulls; G.crabs = crabs;
}
