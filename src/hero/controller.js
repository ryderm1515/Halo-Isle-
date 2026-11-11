import * as T from 'three';
import { groundAt, resolve } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { clamp, damp } from '../util/noise.js';
import { S, emit } from '../game/state.js';
export const lifts = [];      // updraft columns: {x,z,r,top,base,land:[x,z]}
export const bouncers = [];   // springy things (bushes, umbrellas): {x,z,r,y,power}

const keys = new Set(); let lastInput = 0, caps = false;
export const input = { mx: 0, mz: 0, jump: false, jumpHeld: false, walk: false, sprint: false, slide: false, lookX: 0, lookY: 0, emote: null, interact: false, any: false, sitToggle: false };
addEventListener('keydown', (e) => { caps = e.getModifierState?.('CapsLock') || false; if (e.repeat) return; keys.add(e.code); if (e.code === 'Space') { input.jump = true; e.preventDefault(); } if (e.code === 'KeyE') input.interact = true; if (e.code === 'KeyX') input.sitToggle = true;
  const em = { Digit1: 'wave', Digit2: 'celebrate', Digit3: 'happy', Digit4: 'confused', Digit5: 'love', Digit6: 'laugh', Digit7: 'think', Digit8: 'sad', Digit9: 'determined' }[e.code]; if (em) input.emote = em; });
addEventListener('keyup', (e) => { caps = e.getModifierState?.('CapsLock') || false; keys.delete(e.code); }); addEventListener('blur', () => keys.clear());
let drag = false;
export function bindPointer(el) {
  el.addEventListener('pointerdown', (e) => { drag = true; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointerup', () => (drag = false));
  el.addEventListener('pointermove', (e) => { if (drag || document.pointerLockElement === el) { const k = S.settings?.sens ?? 1; input.lookX -= e.movementX * 0.0042 * k; input.lookY -= e.movementY * 0.0034 * k * (S.settings?.invertY ? -1 : 1); lastInput = performance.now(); } });
  el.addEventListener('wheel', (e) => { input.zoom = (input.zoom || 0) + Math.sign(e.deltaY); }, { passive: true });
}
function poll() {
  let x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), z = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  input.jumpHeld = keys.has('Space'); input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight'); input.walk = caps; input.slide = keys.has('KeyC');
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
  if (gp) {
    const dz = (v) => (Math.abs(v) < 0.16 ? 0 : v); x += dz(gp.axes[0]); z += dz(gp.axes[1]);
    input.lookX -= dz(gp.axes[2] || 0) * 0.045; input.lookY -= dz(gp.axes[3] || 0) * 0.03;
    const a = gp.buttons[0]?.pressed; if (a && !poll.a) input.jump = true; poll.a = a; input.jumpHeld = input.jumpHeld || a;
    const xb = gp.buttons[2]?.pressed; if (xb && !poll.x) input.interact = true; poll.x = xb;
    const yb = gp.buttons[3]?.pressed; if (yb && !poll.y) input.emote = 'wave'; poll.y = yb;
    input.sprint = input.sprint || gp.buttons[7]?.pressed || gp.buttons[5]?.pressed; input.slide = input.slide || gp.buttons[1]?.pressed || gp.buttons[6]?.pressed;
  }
  const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; } input.mx = x; input.mz = z; input.any = l > 0.05 || input.jumpHeld;
}

export function createController(hero, camera) {
  const pos = new T.Vector3(), vel = new T.Vector3(); let yaw = 0, grounded = true, coyote = 0, buffer = 0, turn = 0, airJumps = 0, chain = 0, sinceLand = 9, carry = null, carryT = 0, stepDist = 0, flipT = 0;
  const cam = { yaw: Math.PI, pitch: 0.3, dist: 6.2, pos: new T.Vector3(), look: new T.Vector3(), tDist: 6.2 };
  const state = { speed: 0, vy: 0, grounded: true, turn: 0, justJumped: false, justLanded: false, landSpeed: 0, swim: false, input: false, excited: false, wading: 0, sliding: false, skid: false, sprint: false, sitting: false, flip: 0, gliding: false };
  const WALK = 2.6, JOG = 6.6, SPRINT = 10.4, G = 27, JUMPS = [10.2, 11.6, 13.8], R = 0.32; let sit = null;
  const grad = (x, z, y) => { const e = 0.45; return [(groundAt(x + e, z, y + 1) - groundAt(x - e, z, y + 1)) / (2 * e), (groundAt(x, z + e, y + 1) - groundAt(x, z - e, y + 1)) / (2 * e)]; };
  const api = {
    pos, vel, cam, state, locked: false, waters: [],
    get yaw() { return yaw; }, set yaw(v) { yaw = v; },
    teleport(x, z, y) { pos.set(x, y ?? groundAt(x, z), z); vel.set(0, 0, 0); cam.pos.set(0, 0, 0); sit = null; state.sitting = false; },
    sitAt(x, y, z, ry) { sit = { x, y, z, ry, free: false }; vel.set(0, 0, 0); },
    get sitting() { return !!sit; },
    update(dt) {
      poll(); state.justJumped = state.justLanded = false; state.input = input.any; sinceLand += dt;
      if (input.emote) { hero.emote(input.emote); input.emote = null; }
      if (input.sitToggle) { input.sitToggle = false; if (sit) sit = null; else if (grounded && !api.locked) sit = { x: pos.x, y: pos.y, z: pos.z, ry: yaw, free: true }; }
      if (sit && !api.driving && (Math.hypot(input.mx, input.mz) > 0.3 || input.jump)) { if (!sit.free) { pos.x += Math.sin(sit.ry) * 0.5; pos.z += Math.cos(sit.ry) * 0.5; } sit = null; input.jump = false; }
      state.sitting = !!sit;
      const f = api.locked || sit ? 0 : 1, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
      const wx = (input.mx * cy + input.mz * sy) * f, wz = (-input.mx * sy + input.mz * cy) * f, wl = Math.hypot(wx, wz);
      let water = api.floor != null ? -5 : -heightAt(pos.x, pos.z), swim = water > 0.62 && pos.y <= 0.05; state.wading = clamp(water, 0, 1);
      let sp = Math.hypot(vel.x, vel.z);
      const [gx, gz] = grounded && api.floor == null ? grad(pos.x, pos.z, pos.y) : [0, 0], slope = Math.hypot(gx, gz);
      // ---- slide: hold C on the ground (or stand on something too steep) and gravity does the rest
      const wantSlide = grounded && !swim && !state.swim && api.floor == null && !sit && !api.locked && ((input.slide && (sp > 2.2 || slope > 0.18)) || slope > 1.15);
      if (wantSlide && !state.sliding && input.slide && sp < 7.5) { const k = Math.max(sp, 7.5) / Math.max(sp, 0.01); if (sp > 0.5) { vel.x *= k; vel.z *= k; } else { vel.x = Math.sin(yaw) * 7.5; vel.z = Math.cos(yaw) * 7.5; } }
      state.sliding = wantSlide; state.sprint = input.sprint && !swim && wl > 0.1; state.skid = false;
      if (api.flight && !grounded) { api.flight(dt, input, vel); yaw = Math.atan2(vel.x, vel.z); }
      else if (state.sliding) {
        vel.x -= gx * 21 * dt; vel.z -= gz * 21 * dt; const fr = Math.exp(-(slope > 0.25 ? 0.25 : 1.5) * dt); vel.x *= fr; vel.z *= fr;
        if (wl > 0.1) { vel.x += wx * 7 * dt; vel.z += wz * 7 * dt; }
        const s2 = Math.hypot(vel.x, vel.z); if (s2 > 22) { vel.x *= 22 / s2; vel.z *= 22 / s2; } if (s2 > 1) yaw = Math.atan2(vel.x, vel.z);
        if (s2 < 1.3 && slope < 0.25) state.sliding = false;
      } else {
        const top = (api.speedMul || 1) * (input.walk ? WALK : input.sprint ? SPRINT : JOG) * (swim || state.swim ? (input.sprint ? 0.5 : 0.62) : water > 0.15 ? 0.78 : 1) * (state.gliding ? 1.2 : 1);
        const tvx = wx * top, tvz = wz * top;
        // inertia: quick to get going, a skid when you let go or reverse at speed
        const against = sp > 5.5 && wl > 0.1 && (vel.x * wx + vel.z * wz) / (sp * wl) < -0.35, coast = wl < 0.05;
        let acc = grounded ? (coast ? (sp > 6 ? 15 : 24) : against ? 26 : 30) : state.gliding ? 20 : 12; if (grounded && (coast || against) && sp > 5) state.skid = true;
        const dvx = tvx - vel.x, dvz = tvz - vel.z, dl = Math.hypot(dvx, dvz), step = Math.min(dl, acc * dt);
        if (dl > 1e-5) { vel.x += dvx / dl * step; vel.z += dvz / dl * step; }
        if (wl > 0.1) { const want = Math.atan2(wx, wz); let d = want - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const tr = d * Math.min(1, dt * (against ? 7 : 13)); yaw += tr; turn = damp(turn, tr / Math.max(dt, 1e-4), 10, dt); } else turn = damp(turn, 0, 10, dt);
      }
      sp = Math.hypot(vel.x, vel.z);
      // ---- jumping: buffer + coyote, variable height, a triple-jump chain, a long jump out of a slide, one air hop
      buffer = input.jump ? 0.13 : buffer - dt; input.jump = false; coyote = grounded ? 0.11 : coyote - dt;
      if (buffer > 0 && api.flight && !grounded) { buffer = 0; emit('flightdrop'); }
      if (buffer > 0 && !api.locked && !sit) {
        if (coyote > 0) {
          if (state.sliding) { const k = Math.min(15.5, Math.max(sp * 1.2, 10)) / Math.max(sp, 0.01); vel.x *= k; vel.z *= k; vel.y = 7.6; chain = 0; emit('jump', false, 'long'); }
          else { chain = sinceLand < 0.3 && sp > 4 && chain < 2 ? chain + 1 : 0; vel.y = (swim ? JUMPS[0] * 0.72 : JUMPS[chain]) * (api.jumpMul || 1); if (chain === 2) flipT = 0.001; emit('jump', false, chain); }
          grounded = false; coyote = 0; buffer = 0; state.justJumped = true; airJumps = 1; state.sliding = false;
        } else if (airJumps > 0 && !swim) { vel.y = Math.max(vel.y, JUMPS[0] * 0.74); airJumps = 0; buffer = 0; state.justJumped = true; emit('jump', true); }
        else if (api.onAirPress && !swim && !api.flight && !grounded) { buffer = 0; api.onAirPress(); }
      }
      if (flipT > 0) { flipT += dt / 0.62; if (flipT >= 1 || grounded) flipT = 0; } state.flip = flipT;
      if (!grounded && !api.flight) { vel.y -= G * dt * (vel.y > 0 && !input.jumpHeld ? 2.1 : vel.y < 0 ? 1.25 : 1); vel.y = Math.max(vel.y, -38); }
      const gl = S.abilities.glide && !grounded && input.jumpHeld && vel.y < -0.5 && !swim && !api.locked; if (gl) vel.y = Math.max(vel.y, -2.1); if (gl !== state.gliding) emit('glide', gl); state.gliding = gl;
      // ---- breeze lifts: ride up, then the wind carries you over to solid ground
      state.lift = false;
      for (const L of lifts) { if (L.off) continue; const d = Math.hypot(pos.x - L.x, pos.z - L.z); if (d < L.r && pos.y < L.top && pos.y > L.base - 1) { vel.y = damp(vel.y, 15, 5, dt); grounded = false; coyote = 0; airJumps = 1; state.lift = true; vel.x += (L.x - pos.x) * dt * 2 - vel.x * dt * 2; vel.z += (L.z - pos.z) * dt * 2 - vel.z * dt * 2; if (pos.y > L.top - 1.2 && L.land) { carry = L; carryT = 0; } } }
      if (carry) { carryT += dt; const dx = carry.land[0] - pos.x, dz = carry.land[1] - pos.z, d = Math.hypot(dx, dz); if (grounded || carryT > 4 || d < 0.8 || wl > 0.5 && carryT > 0.6) carry = null; else { const k = Math.min(9, d * 3) / Math.max(d, 0.01); vel.x = damp(vel.x, dx * k, 6, dt); vel.z = damp(vel.z, dz * k, 6, dt); vel.y = Math.max(vel.y, d > 2 ? 1.5 : -3); state.lift = true; } }
      if (sit) { pos.set(sit.x, sit.y, sit.z); yaw = sit.ry; vel.set(0, 0, 0); grounded = true; }
      else { pos.x += vel.x * dt; pos.z += vel.z * dt; pos.y += vel.y * dt; resolve(pos, R); }
      const lim = 400; if (api.floor == null) { pos.x = clamp(pos.x, -lim, lim); pos.z = clamp(pos.z, -lim, lim); }
      let g = api.floor != null ? api.floor : groundAt(pos.x, pos.z, pos.y); state.swim = false; state.under = false;
      if (api.floor == null) { let surf = null; if (g < -0.62) surf = -0.62; for (const w of api.waters) if (Math.hypot((pos.x - w.x) / w.sx, pos.z - w.z) < w.r + 1 && g < w.level - 0.62) surf = w.level - 0.62;
        if (surf != null) { const tgt = input.slide && !api.locked ? Math.max(g + 0.35, surf - 4.2) : surf; api.swimY = damp(api.swimY ?? surf, tgt, 3.2, dt); state.under = api.swimY < surf - 0.45; g = api.swimY; state.swim = pos.y <= g + 0.12; state.surf = surf + 0.62; } else api.swimY = null; }
      // springy things
      if (!grounded && vel.y < -1) for (const b of bouncers) { if (pos.y <= b.y && pos.y > b.y - 0.9 && Math.hypot(pos.x - b.x, pos.z - b.z) < b.r) { vel.y = b.power || 13.5; airJumps = 1; pos.y = b.y; emit('bounce', b); break; } }
      if (sit) { /* held in place */ }
      else if (grounded) { if (g < pos.y - 0.55 && !state.swim) grounded = false; else { pos.y = g; vel.y = 0; } }
      else if (pos.y <= g && vel.y <= 0) { state.landSpeed = -vel.y; pos.y = g; vel.y = 0; grounded = true; state.justLanded = true; airJumps = 0; sinceLand = 0; emit('land', state.landSpeed, water > 0.1 || state.swim); if (api.flight) emit('flightdrop'); }
      // footsteps
      if (grounded && !sit) { stepDist += sp * dt; const stride = state.sliding ? 0.5 : sp > 8 ? 1.5 : 1.15; if (stepDist > stride && sp > 1.5) { stepDist = 0; emit('step', pos, sp, state.sliding || state.skid); } }
      state.speed = sp; state.vy = vel.y; state.grounded = grounded; state.turn = turn;
      hero.group.position.copy(pos); hero.group.rotation.y = yaw;
      hero.update(dt, state);
      // ---- third-person camera: orbit + gentle auto-follow + ground avoidance, a little wider when you are fast
      cam.yaw += input.lookX; cam.pitch = clamp(cam.pitch - input.lookY, -0.25, 1.25); input.lookX = input.lookY = 0;
      if (input.zoom) { cam.tDist = clamp(cam.tDist + input.zoom * 0.8, 3, 14); input.zoom = 0; }
      if (performance.now() - lastInput > 1600 && sp > 1.5 && (wl > 0.1 || state.sliding)) { let d = (yaw + Math.PI) - cam.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (Math.abs(d) < 2.6) cam.yaw += d * Math.min(1, dt * (state.sliding ? 2.2 : 0.9)); }
      cam.dist = damp(cam.dist, (cam.maxDist ? Math.min(cam.tDist, cam.maxDist) : cam.tDist) + clamp((sp - 7) * 0.22, 0, 2.2), 5, dt);
      camera.fov = damp(camera.fov, 52 + clamp((sp - 7) * 1.1, 0, 12), 4, dt); camera.updateProjectionMatrix();
      const tx = pos.x + vel.x * 0.12, tz = pos.z + vel.z * 0.12, ty = pos.y + (cam.lookH ?? 1.0);
      if (cam.look.lengthSq() === 0 || cam.pos.lengthSq() === 0) cam.look.set(tx, ty, tz);
      cam.look.x = damp(cam.look.x, tx, 12, dt); cam.look.z = damp(cam.look.z, tz, 12, dt); cam.look.y = damp(cam.look.y, ty, grounded ? 9 : 5, dt);
      const cp = Math.cos(cam.pitch), want = new T.Vector3(cam.look.x + Math.sin(cam.yaw) * cp * cam.dist, cam.look.y + Math.sin(cam.pitch) * cam.dist, cam.look.z + Math.cos(cam.yaw) * cp * cam.dist);
      if (!cam.indoor) { const floor = Math.max(heightAt(want.x, want.z), 0) + 0.45; if (want.y < floor) want.y = floor; } else want.y = Math.max(want.y, cam.indoor + 0.4);
      if (cam.pos.lengthSq() === 0) cam.pos.copy(want); else cam.pos.lerp(want, 1 - Math.exp(-14 * dt));
      camera.position.copy(cam.pos); camera.lookAt(cam.look.x, cam.look.y + 0.15, cam.look.z);
    },
  };
  return api;
}
