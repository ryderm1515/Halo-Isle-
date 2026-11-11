import * as T from 'three';
import { S, save } from './state.js';
import { audio } from './audio.js';
import { el } from '../ui/hud.js';
import { input } from '../hero/controller.js';
import { groundAt, addCircle } from '../world/colliders.js';
import { heightAt } from '../world/terrain.js';
import { models, loadModels } from '../world/world.js';
// The driving range in the meadow west of town. Six balls: A/D to aim, hold Space to wind up, let go to swing.
// Land near a flag for points; the closer the pin, the more you score. The wind has a say.
export async function initGolf(G, loader) {
  await loadModels(loader, { golf_tee: 'props', golf_flag: 'props', golf_club: 'props' });
  const hud = G.hud, ctl = G.ctl, hero = G.hero, root = G.world, TX = 30, TZ = 126, BASE = Math.PI * 1.5;   // yaw 1.5π faces west (-x)
  const fwd = (a) => [Math.sin(a), Math.cos(a)];
  for (const dz of [-4.5, 0, 4.5]) { const o = models.golf_tee?.clone(); if (!o) break; o.position.set(TX, heightAt(TX, TZ + dz), TZ + dz); o.rotation.y = BASE + Math.PI; root.add(o); }
  { const sign = new T.Mesh(new T.BoxGeometry(2.6, 0.7, 0.08), new T.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 138; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 138); gr.addColorStop(0, '#7fd85a'); gr.addColorStop(1, '#3fae3a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 138); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, 512, 40); g.fillStyle = '#fff'; g.font = 'italic 700 62px "Trebuchet MS"'; g.textAlign = 'center'; g.fillText('Driving Range', 256, 92); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })(), roughness: 0.6 })); const y = heightAt(TX + 4, TZ); sign.position.set(TX + 4.5, y + 2.5, TZ); sign.rotation.y = Math.PI / 2; root.add(sign);
    for (const dz of [-1.1, 1.1]) { const p = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 2.9, 8), new T.MeshStandardMaterial({ color: '#c98a4b' })); p.position.set(TX + 4.5, y + 1.45, TZ + dz); root.add(p); addCircle(TX + 4.5, TZ + dz, 0.12); } }
  const targets = [[28, -5, '#ff6b5c'], [52, 6, '#ffd23f'], [78, -7, '#59d7f5'], [104, 4, '#b79bff']].map(([d, off, col]) => { const x = TX - d, z = TZ + off, y = heightAt(x, z), g = new T.Group(); g.position.set(x, y, z); for (const [r, o] of [[8, 0.25], [4, 0.45], [1.3, 0.8]]) { const m = new T.Mesh(new T.RingGeometry(r - 0.28, r, 48).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: o, depthWrite: false })); m.position.y = 0.12 + (8 - r) * 0.004; m.renderOrder = 2; g.add(m); } const f = models.golf_flag?.clone(); if (f) g.add(f); root.add(g); return { x, z, y, d, g }; });
  const ball = new T.Mesh(new T.SphereGeometry(0.075, 14, 10), new T.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.3 })); ball.castShadow = true; ball.visible = false; root.add(ball);
  const trailN = 40, trailGeo = new T.BufferGeometry().setFromPoints(Array.from({ length: trailN }, () => new T.Vector3())), trail = new T.Line(trailGeo, new T.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 })); trail.frustumCulled = false; trail.visible = false; root.add(trail);
  const aimGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), aimLine = new T.Line(aimGeo, new T.LineDashedMaterial({ color: '#ffffff', dashSize: 0.6, gapSize: 0.5, transparent: true, opacity: 0.8 })); aimLine.frustumCulled = false; aimLine.visible = false; root.add(aimLine);
  const club = models.golf_club?.clone(); if (club) { club.visible = false; club.rotation.set(Math.PI, 0, 0); club.position.set(0, -0.05, 0); hero.bones.handR.add(club); }
  const meter = el('meter glass hide', '<i style="width:0%"></i>'); hud.root.append(meter);
  let st = null; const v = new T.Vector3(), camP = new T.Vector3(), pts = [];
  const stop = (finished) => { if (!st) return; const total = st.score; st = null; ball.visible = trail.visible = aimLine.visible = false; if (club) club.visible = false; meter.classList.add('hide'); G.busy = false; G.ride = null; ctl.locked = false; ctl.cam.pos.set(0, 0, 0); G.act.A.cur = null;
    if (finished) { if (!S.best.golf || total > S.best.golf) S.best.golf = total; G.act.finish('golf', 'Driving Range', total >= 300 ? 3 : total >= 180 ? 2 : total >= 90 ? 1 : 0, [`${total} points from six balls`, 'Gold 300 · Silver 180 · Bronze 90']); } else { hud.activity(null); audio.ui(); } };
  const tee = () => { st.phase = 'aim'; st.power = 0; st.charging = false; st.t = 0; ball.position.set(TX - 0.55, heightAt(TX, TZ) + 0.13, TZ + 0.0); ball.visible = true; trail.visible = false; };
  G.thing({ x: TX, z: TZ, r: 3, marker: '#63c94a', icon: 'golf', kind: 'activity', name: 'Driving Range', label: () => `Play the Driving Range${S.best.golf ? ` · best ${S.best.golf}` : ''}`, act: () => { if (G.act.A.cur || st) return audio.bad(); audio.good(); if (!G.hasItem?.('club')) G.addItem?.('club', 1, true);
    st = { n: 0, score: 0, aim: 0, phase: 'aim', last: '' }; G.busy = true; G.ride = { label: 'Leave the range', exit: () => stop(false) }; ctl.locked = true; ctl.teleport(TX + 0.25, TZ + 0.42); ctl.yaw = BASE; if (club) club.visible = true; hud.activity('Driving Range'); G.act.A.cur = { update() {}, cancel() { stop(false); } }; tee(); hud.toast('Driving Range', 'A/D aim · hold Space to wind up · let go to swing'); } });
  G.activities?.push(['golf', 'Driving Range', 'Meadow west of town']); G.refreshMarkers?.();
  G.systems.push((dt) => { if (!st) return; st.t += dt; const wind = G.wind || { x: 0, z: 0 }; hud.activityUpdate(`Ball ${Math.min(6, st.n + 1)} / 6`, `${st.score} points${st.last ? ' · ' + st.last : ''}`);
    const yaw = BASE + st.aim, [fx, fz] = fwd(yaw); ctl.yaw = yaw + 0.0;
    if (st.phase === 'aim') { st.aim = Math.max(-0.5, Math.min(0.5, st.aim - input.mx * dt * 0.7));
      if (input.jumpHeld) { st.charging = true; st.power += dt * 1.15; } else if (st.charging) { const p = 1 - Math.abs((st.power % 2) - 1), speed = 15 + p * 30; st.phase = 'swing'; st.t = 0; st.p = p; hero.emote('swing'); st.vel = new T.Vector3(fx * Math.cos(0.6) * speed, Math.sin(0.6) * speed, fz * Math.cos(0.6) * speed); }
      const p = 1 - Math.abs((st.power % 2) - 1); meter.classList.toggle('hide', !st.charging); meter.firstChild.style.width = `${p * 100}%`;
      const a = aimGeo.attributes.position; a.setXYZ(0, ball.position.x, ball.position.y, ball.position.z); a.setXYZ(1, ball.position.x + fx * 9, ball.position.y, ball.position.z + fz * 9); a.needsUpdate = true; aimLine.computeLineDistances(); aimLine.visible = true;
      camP.set(ctl.pos.x - fx * 5.2 + fz * 1.6, ctl.pos.y + 2.4, ctl.pos.z - fz * 5.2 - fx * 1.6); G.camera.position.lerp(camP, Math.min(1, dt * 5)); G.camera.lookAt(ctl.pos.x + fx * 14, ctl.pos.y + 1.6, ctl.pos.z + fz * 14); }
    else if (st.phase === 'swing') { meter.classList.add('hide'); aimLine.visible = false; if (st.t > 0.36) { st.phase = 'fly'; st.t = 0; pts.length = 0; trail.visible = true; audio.pop(); audio.land(); G.puff?.(ball.position.x, ball.position.y, ball.position.z, 6, '#9ad65a', 1.4, 1.2); st.bounced = 0; } G.camera.lookAt(ctl.pos.x + fx * 14, ctl.pos.y + 1.6, ctl.pos.z + fz * 14); }
    else if (st.phase === 'fly') { const b = ball.position; st.vel.y -= 14 * dt; st.vel.x += wind.x * dt * 0.9; st.vel.z += wind.z * dt * 0.9; b.addScaledVector(st.vel, dt); const g = Math.max(groundAt(b.x, b.z, b.y + 2), -0.1) + 0.075;
      if (b.y <= g) { b.y = g; if (st.bounced < 2 && st.vel.y < -4) { st.vel.y *= -0.32; st.vel.x *= 0.5; st.vel.z *= 0.5; st.bounced++; audio.bounce(); G.puff?.(b.x, b.y, b.z, 5, heightAt(b.x, b.z) < 0 ? '#ffffff' : '#9ad65a', 1.2, 1); } else { st.vel.y = 0; st.vel.x *= Math.exp(-dt * 3.5); st.vel.z *= Math.exp(-dt * 3.5); if (Math.hypot(st.vel.x, st.vel.z) < 0.6) {
            let best = 0, name = ''; for (const t of targets) { const d = Math.hypot(b.x - t.x, b.z - t.z), p = d < 1.3 ? 100 : d < 4 ? 50 : d < 8 ? 25 : 0; if (p > best) { best = p; name = p === 100 ? 'On the pin!' : p === 50 ? 'Inner ring' : 'Outer ring'; } } const dist = Math.hypot(b.x - TX, b.z - TZ), wet = heightAt(b.x, b.z) < 0; const got = wet ? 0 : best + Math.floor(dist / 20) * 2;
            st.score += got; st.last = wet ? 'Splash!' : `${name || dist.toFixed(0) + ' m'} +${got}`; if (best === 100) { audio.fanfare(); G.sparkle(b.x, b.y + 0.5, b.z, 40, 5); hero.emote('celebrate'); } else if (best) { audio.good(); G.sparkle(b.x, b.y + 0.3, b.z, 14, 3); hero.emote('happy'); } else { audio.ui(); } st.phase = 'rest'; st.t = 0; } } }
      pts.push(b.clone()); if (pts.length > trailN) pts.shift(); const a = trailGeo.attributes.position; for (let i = 0; i < trailN; i++) { const p = pts[Math.min(i, pts.length - 1)]; a.setXYZ(i, p.x, p.y, p.z); } a.needsUpdate = true;
      const sp = Math.hypot(st.vel.x, st.vel.z) || 1; camP.set(b.x - st.vel.x / sp * 7, Math.max(b.y + 2.2, groundAt(b.x, b.z) + 2), b.z - st.vel.z / sp * 7 + 2.5); G.camera.position.lerp(camP, Math.min(1, dt * 3.2)); G.camera.lookAt(b); }
    else if (st.phase === 'rest') { G.camera.lookAt(ball.position); if (st.t > 1.5) { st.n++; if (st.n >= 6) stop(true); else { tee(); G.camera.position.set(ctl.pos.x - fx * 5.2, ctl.pos.y + 2.4, ctl.pos.z - fz * 5.2); } } }
  });
}
