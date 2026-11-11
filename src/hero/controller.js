import * as T from 'three';
import { groundAt, resolve } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { clamp, damp } from '../util/noise.js';

const keys = new Set(); let lastInput = 0;
export const input = { mx: 0, mz: 0, jump: false, jumpHeld: false, walk: false, lookX: 0, lookY: 0, emote: null, interact: false, any: false };
addEventListener('keydown', (e) => { if (e.repeat) return; keys.add(e.code); if (e.code === 'Space') { input.jump = true; e.preventDefault(); } if (e.code === 'KeyE') input.interact = true;
  const em = { Digit1: 'wave', Digit2: 'celebrate', Digit3: 'happy', Digit4: 'confused', Digit5: 'love', Digit6: 'laugh', Digit7: 'think', Digit8: 'sad', Digit9: 'determined' }[e.code]; if (em) input.emote = em; });
addEventListener('keyup', (e) => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
let drag = false;
export function bindPointer(el) {
  el.addEventListener('pointerdown', (e) => { drag = true; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointerup', () => (drag = false));
  el.addEventListener('pointermove', (e) => { if (drag || document.pointerLockElement === el) { input.lookX -= e.movementX * 0.0042; input.lookY -= e.movementY * 0.0034; lastInput = performance.now(); } });
  el.addEventListener('wheel', (e) => { input.zoom = (input.zoom || 0) + Math.sign(e.deltaY); }, { passive: true });
}
function poll() {
  let x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), z = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  input.jumpHeld = keys.has('Space'); input.walk = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
  if (gp) {
    const dz = (v) => (Math.abs(v) < 0.16 ? 0 : v); x += dz(gp.axes[0]); z += dz(gp.axes[1]);
    input.lookX -= dz(gp.axes[2] || 0) * 0.045; input.lookY -= dz(gp.axes[3] || 0) * 0.03;
    const a = gp.buttons[0]?.pressed; if (a && !poll.a) input.jump = true; poll.a = a; input.jumpHeld = input.jumpHeld || a;
    const xb = gp.buttons[2]?.pressed; if (xb && !poll.x) input.interact = true; poll.x = xb;
    const yb = gp.buttons[3]?.pressed; if (yb && !poll.y) input.emote = 'wave'; poll.y = yb;
  }
  const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; } input.mx = x; input.mz = z; input.any = l > 0.05 || input.jumpHeld;
}

export function createController(hero, camera) {
  const pos = new T.Vector3(), vel = new T.Vector3(); let yaw = 0, grounded = true, coyote = 0, buffer = 0, turn = 0, airJumps = 0;
  const cam = { yaw: Math.PI, pitch: 0.3, dist: 6.2, pos: new T.Vector3(), look: new T.Vector3(), tDist: 6.2 };
  const state = { speed: 0, vy: 0, grounded: true, turn: 0, justJumped: false, justLanded: false, landSpeed: 0, swim: false, input: false, excited: false, wading: 0 };
  const WALK = 3.1, RUN = 7.4, G = 27, JUMP = 10.2, R = 0.3;
  const api = {
    pos, vel, cam, state, locked: false,
    get yaw() { return yaw; }, set yaw(v) { yaw = v; },
    teleport(x, z, y) { pos.set(x, y ?? groundAt(x, z), z); vel.set(0, 0, 0); cam.pos.set(0, 0, 0); },
    update(dt) {
      poll(); state.justJumped = state.justLanded = false; state.input = input.any;
      if (input.emote) { hero.emote(input.emote); input.emote = null; }
      // camera-relative wish direction
      const f = api.locked ? 0 : 1, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
      const wx = (input.mx * cy + input.mz * sy) * f, wz = (-input.mx * sy + input.mz * cy) * f, wl = Math.hypot(wx, wz);
      const water = -heightAt(pos.x, pos.z), swim = water > 0.62 && pos.y <= 0.05; state.swim = swim; state.wading = clamp(water, 0, 1);
      const top = (input.walk ? WALK : RUN) * (swim ? 0.5 : water > 0.15 ? 0.78 : 1), acc = grounded ? (wl > 0.05 ? 34 : 26) : 13;
      const tvx = wx * top, tvz = wz * top, dvx = tvx - vel.x, dvz = tvz - vel.z, dl = Math.hypot(dvx, dvz), step = Math.min(dl, acc * dt);
      if (dl > 1e-5) { vel.x += dvx / dl * step; vel.z += dvz / dl * step; }
      const sp = Math.hypot(vel.x, vel.z);
      if (wl > 0.1) { const want = Math.atan2(wx, wz); let d = want - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const tr = d * Math.min(1, dt * 13); yaw += tr; turn = damp(turn, tr / Math.max(dt, 1e-4), 10, dt); } else turn = damp(turn, 0, 10, dt);
      // jump (buffer + coyote + variable height + one small air flutter)
      buffer = input.jump ? 0.13 : buffer - dt; input.jump = false; coyote = grounded ? 0.11 : coyote - dt;
      if (buffer > 0 && !api.locked) {
        if (coyote > 0) { vel.y = swim ? JUMP * 0.72 : JUMP; grounded = false; coyote = 0; buffer = 0; state.justJumped = true; airJumps = 1; }
        else if (airJumps > 0 && !swim) { vel.y = Math.max(vel.y, JUMP * 0.72); airJumps = 0; buffer = 0; state.justJumped = true; state.flutter = true; }
      }
      if (!grounded) { vel.y -= G * dt * (vel.y > 0 && !input.jumpHeld ? 2.1 : vel.y < 0 ? 1.25 : 1); vel.y = Math.max(vel.y, -38); }
      pos.x += vel.x * dt; pos.z += vel.z * dt; pos.y += vel.y * dt;
      resolve(pos, R);
      // stay on the map
      const lim = 400; pos.x = clamp(pos.x, -lim, lim); pos.z = clamp(pos.z, -lim, lim);
      let g = groundAt(pos.x, pos.z, pos.y); if (g < -0.62 + 0.0) g = Math.max(g, -0.62);   // float at the surface when it gets deep
      if (grounded) {
        if (g < pos.y - 0.5) { grounded = false; } else { pos.y = g; vel.y = 0; }
        // slide off slopes that are too steep to stand on
        const e = 0.4, sxn = groundAt(pos.x + e, pos.z, pos.y + 1) - groundAt(pos.x - e, pos.z, pos.y + 1), szn = groundAt(pos.x, pos.z + e, pos.y + 1) - groundAt(pos.x, pos.z - e, pos.y + 1), slope = Math.hypot(sxn, szn) / (2 * e);
        if (slope > 1.25) { vel.x -= sxn / (2 * e) * 9 * dt; vel.z -= szn / (2 * e) * 9 * dt; }
      } else if (pos.y <= g && vel.y <= 0) { state.landSpeed = -vel.y; pos.y = g; vel.y = 0; grounded = true; state.justLanded = true; airJumps = 0; }
      state.speed = sp; state.vy = vel.y; state.grounded = grounded; state.turn = turn;
      hero.group.position.copy(pos); hero.group.rotation.y = yaw;
      hero.update(dt, state); state.flutter = false;
      // ---- third-person camera: orbit + gentle auto-follow + ground avoidance
      cam.yaw += input.lookX; cam.pitch = clamp(cam.pitch - input.lookY, -0.25, 1.25); input.lookX = input.lookY = 0;
      if (input.zoom) { cam.tDist = clamp(cam.tDist + input.zoom * 0.8, 3, 13); input.zoom = 0; }
      if (performance.now() - lastInput > 1600 && sp > 1.5 && wl > 0.1) { let d = (yaw + Math.PI) - cam.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (Math.abs(d) < 2.6) cam.yaw += d * Math.min(1, dt * 0.9); }
      cam.dist = damp(cam.dist, cam.tDist, 6, dt);
      const tx = pos.x + vel.x * 0.12, tz = pos.z + vel.z * 0.12, ty = pos.y + (cam.lookH ?? 1.0);
      if (cam.look.lengthSq() === 0 || cam.pos.lengthSq() === 0) cam.look.set(tx, ty, tz);
      cam.look.x = damp(cam.look.x, tx, 12, dt); cam.look.z = damp(cam.look.z, tz, 12, dt); cam.look.y = damp(cam.look.y, ty, grounded ? 9 : 5, dt);
      const cp = Math.cos(cam.pitch), want = new T.Vector3(cam.look.x + Math.sin(cam.yaw) * cp * cam.dist, cam.look.y + Math.sin(cam.pitch) * cam.dist, cam.look.z + Math.cos(cam.yaw) * cp * cam.dist);
      const floor = Math.max(heightAt(want.x, want.z), 0) + 0.45; if (want.y < floor) want.y = floor;
      if (cam.pos.lengthSq() === 0) cam.pos.copy(want); else cam.pos.lerp(want, 1 - Math.exp(-14 * dt));
      camera.position.copy(cam.pos); camera.lookAt(cam.look.x, cam.look.y + 0.15, cam.look.z);
    },
  };
  return api;
}
