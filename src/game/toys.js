import * as T from 'three';
import { groundAt, resolve } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { waveAt } from '../world/water.js';
import { models } from '../world/world.js';
import { audio } from './audio.js';
import { initKit } from './kit.js';
// Beach balls with proper weight: they roll down slopes, bounce off posts, float and drift back in, and never get lost.
export async function initToys(G) {
  initKit(G); const ctl = G.ctl, root = G.world, B = G.SPOTS.beach, R = 0.42, tmp = new T.Vector3(), axis = new T.Vector3(), q = new T.Quaternion(); G.balls = [];
  if (models.beach_ball) for (const [dx, dz] of [[-12, 4], [6, 6], [20, 7], [-30, 2]]) { const x = B.x + dx, z = B.z + dz, o = models.beach_ball.clone(); o.position.set(x, groundAt(x, z), z); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); root.add(o); o.userData.ball = { v: new T.Vector3(), r: R, home: [x, z], cd: 0, lost: 0 }; G.balls.push(o); }
  let wake = 0;
  G.systems.push((dt) => { const hp = ctl.pos, sp = ctl.state.speed;
    for (const o of G.balls) { const b = o.userData.ball, p = o.position; if (Math.hypot(p.x - hp.x, p.z - hp.z) > 120) continue; b.cd -= dt;
      b.v.y -= 17 * dt; p.addScaledVector(b.v, dt); const land = heightAt(p.x, p.z), g = groundAt(p.x, p.z, p.y + 0.8);
      if (land < -0.35 && p.y < 0.4) {   // afloat: bob on the swell, lose speed, drift back toward the sand
        const surf = waveAt(p.x, p.z) - 0.02; b.v.y += (surf - p.y) * 30 * dt + 17 * dt; b.v.y *= Math.exp(-4 * dt); const k = Math.exp(-0.9 * dt); b.v.x *= k; b.v.z *= k; const hx = b.home[0] - p.x, hz = b.home[1] - p.z, hl = Math.hypot(hx, hz) || 1; b.v.x += hx / hl * 0.9 * dt; b.v.z += hz / hl * 0.9 * dt;
      } else if (p.y <= g) { p.y = g; if (b.v.y < -2.2) { if (b.v.y < -3.5) audio.bounce(); b.v.y = -b.v.y * 0.58; } else b.v.y = 0;
        const e = 0.4, gx = (groundAt(p.x + e, p.z, p.y + 0.8) - groundAt(p.x - e, p.z, p.y + 0.8)) / (2 * e), gz = (groundAt(p.x, p.z + e, p.y + 0.8) - groundAt(p.x, p.z - e, p.y + 0.8)) / (2 * e);
        if (Math.abs(gx) < 2 && Math.abs(gz) < 2) { b.v.x -= gx * 9 * dt; b.v.z -= gz * 9 * dt; } const k = Math.exp(-0.85 * dt); b.v.x *= k; b.v.z *= k; if (Math.hypot(b.v.x, b.v.z) < 0.06) b.v.x = b.v.z = 0; }
      tmp.copy(p); resolve(tmp, R); if (tmp.x !== p.x || tmp.z !== p.z) { const nx = tmp.x - p.x, nz = tmp.z - p.z, nl = Math.hypot(nx, nz) || 1, vn = (b.v.x * nx + b.v.z * nz) / nl; if (vn < 0) { b.v.x -= 1.6 * vn * nx / nl; b.v.z -= 1.6 * vn * nz / nl; } p.x = tmp.x; p.z = tmp.z; }
      for (const o2 of G.balls) { if (o2 === o) continue; const dx = p.x - o2.position.x, dz = p.z - o2.position.z, dy = p.y - o2.position.y, d = Math.hypot(dx, dy, dz); if (d < R * 2 && d > 0.01) { const k = (R * 2 - d) / d * 0.5; p.x += dx * k; p.z += dz * k; b.v.x += dx / d * 1.5; b.v.z += dz / d * 1.5; } }
      const dx = p.x - hp.x, dz = p.z - hp.z, dy = p.y + R - (hp.y + 0.5), d = Math.hypot(dx, dz, dy);
      if (d < R + 0.46 && d > 0.01 && b.cd <= 0 && !ctl.driving) { const k = 3.6 + sp * 1.05, hl = Math.hypot(dx, dz) || 1; b.v.set(dx / hl * k + ctl.vel.x * 0.35, 3.4 + sp * 0.28 + Math.max(0, ctl.vel.y) * 0.5, dz / hl * k + ctl.vel.z * 0.35); b.cd = 0.22; audio.bounce(); G.puff?.(p.x, p.y + 0.1, p.z, 3, '#f7e2a8', 0.5, 0.6); }
      const hv = Math.hypot(b.v.x, b.v.z); if (hv > 0.05) { axis.set(b.v.z, 0, -b.v.x).normalize(); q.setFromAxisAngle(axis, hv * dt / R); o.quaternion.premultiply(q); }
      // strayed too far or stuck out at sea: pop back home
      if (Math.hypot(p.x - b.home[0], p.z - b.home[1]) > 75 || p.y < -3) { b.lost += dt; if (b.lost > 5) { b.lost = 0; G.puff?.(p.x, p.y + 0.3, p.z, 8, '#ffffff', 1, 1); p.set(b.home[0], groundAt(b.home[0], b.home[1]) + 2.5, b.home[1]); b.v.set(0, 0, 0); } } else b.lost = 0; }
    // swimmers leave a wake
    if (ctl.state.swim && !ctl.state.under) { wake -= dt * (0.6 + sp); if (wake < 0) { wake = 0.5; G.puff?.(hp.x - Math.sin(ctl.yaw) * 0.4, (ctl.state.surf ?? 0.15) - 0.12, hp.z - Math.cos(ctl.yaw) * 0.4, sp > 2 ? 3 : 1, '#ffffff', 0.5 + sp * 0.12, 0.25); } } });
}
