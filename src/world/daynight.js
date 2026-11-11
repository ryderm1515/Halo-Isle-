import * as T from 'three';
import { SUN_DIR } from './sky.js';
import { NIGHT, WSUN } from './water.js';
import { GLUM } from './grass.js';
import { matLib } from './materials.js';
import { heightAt } from './terrain.js';
import { SPOTS } from './layout.js';
// A full day every five minutes: long golden afternoon, a burning dusk, then a short bright night with aurora,
// shooting stars, lit windows, glowing lamps and fireflies, and a soft dawn back into day.
const lerp = (a, b, t) => a + (b - a) * t, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export async function initDayNight(G) {
  const { sun, hemi, scene, skyApi } = G, U = skyApi.uniforms, lib = matLib(), root = G.world, PERIOD = 300;
  const C = (h) => new T.Color(h), dayFog = C('#ffeccf'), duskFog = C('#ffb98a'), nightFog = C('#0c1838'), sunDay = C('#ffdc9c'), sunDusk = C('#ff9a55'), moonCol = C('#9fc0ff'), skyDay = C('#9cc8ff'), skyNight = C('#3b57a8'), gDay = C('#c7b48a'), gNight = C('#162446');
  const state = (G.time = { phase: 0.12, speed: 1, night: 0, dusk: 0, paused: false, set(p) { state.phase = ((p % 1) + 1) % 1; } });
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.3, 'rgba(255,220,140,.45)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const lamps = G.lamps || [], glows = lamps.map(([x, y, z]) => { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 })); s.position.set(x, y, z); s.scale.setScalar(5.5); root.add(s); return s; });
  const pls = [0, 1, 2].map(() => { const l = new T.PointLight('#ffd89a', 0, 22, 1.6); root.add(l); return l; });
  // fireflies: drift near the ground around you, thicker by lamps and planters
  const NF = 150, fg = new T.BufferGeometry(), fp = new Float32Array(NF * 3), fo = new Float32Array(NF * 4); for (let i = 0; i < NF; i++) { fo[i * 4] = (Math.random() - 0.5) * 50; fo[i * 4 + 1] = 0.3 + Math.random() * 2.6; fo[i * 4 + 2] = (Math.random() - 0.5) * 50; fo[i * 4 + 3] = Math.random() * 6.28; }
  fg.setAttribute('position', new T.BufferAttribute(fp, 3)); const flies = new T.Points(fg, new T.PointsMaterial({ map: glowTex, size: 0.3, color: '#d8ff7a', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); flies.frustumCulled = false; root.add(flies);
  let shootT = 4; const base = { exposure: G.renderer.toneMappingExposure, bloom: G.look?.bloom.strength ?? 0.26, warm: G.look?.grade.warm.value ?? 0.34, lamp: lib.M_Lamp.emissiveIntensity, env: scene.environmentIntensity };
  for (const k of ['M_GlassBlue', 'M_Glass']) { lib[k].emissive = new T.Color('#ffd27a'); lib[k].emissiveIntensity = 0; }
  const dirDay = new T.Vector3(), moonDir = new T.Vector3(-0.45, 0.62, -0.4).normalize(); G.lightDir = new T.Vector3().copy(SUN_DIR);
  let t = 0;
  G.systems.push((dt, g) => {
    if (!state.paused) state.phase = (state.phase + dt * state.speed / PERIOD) % 1; t += dt; const p = state.phase;
    // 0-.60 day · .60-.70 dusk · .70-.92 night · .92-1 dawn
    const night = sm(0.64, 0.72, p) * (1 - sm(0.92, 1.0, p)), dusk = Math.max(sm(0.54, 0.66, p) * (1 - sm(0.68, 0.76, p)), sm(0.9, 0.96, p) * (1 - sm(0.96, 1.0, p)) * 0.8);
    state.night = night; state.dusk = dusk;
    // the sun wheels round and sinks; at night the moon takes over as the key light
    const dayT = Math.min(1, p / 0.7), az = 0.6 + dayT * 1.5, el = lerp(0.62, 0.06, sm(0.25, 1, dayT)) * (p > 0.92 ? sm(0.92, 1, p) : 1) + (p > 0.92 ? 0.05 : 0);
    dirDay.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).normalize(); SUN_DIR.copy(dirDay); WSUN.copy(night > 0.5 ? moonDir : dirDay);
    G.lightDir.copy(night > 0.5 ? moonDir : dirDay); const cross = Math.abs(night - 0.5) * 2;   // dip to nothing while the key light swaps
    sun.color.copy(sunDay).lerp(sunDusk, dusk).lerp(moonCol, night); sun.intensity = lerp(3.9, 2.3, dusk) * (1 - night) * (night < 0.5 ? cross : 0) + (night >= 0.5 ? 1.25 * cross : 0) + 0.05;
    hemi.color.copy(skyDay).lerp(skyNight, night); hemi.groundColor.copy(gDay).lerp(gNight, night); hemi.intensity = lerp(0.72, 0.5, night);
    scene.fog?.color.copy(dayFog).lerp(duskFog, dusk * 0.8).lerp(nightFog, night); scene.environmentIntensity = lerp(base.env, 0.07, night);
    U.night.value = night; U.dusk.value = dusk; U.moon.value.copy(moonDir); NIGHT.value = night; GLUM.value.set(lerp(1, 0.2, night) + dusk * 0.05, lerp(1, 0.3, night), lerp(1, 0.52, night) - dusk * 0.1);
    skyApi.cloudMat.emissiveIntensity = lerp(0.6, 0.07, night); skyApi.cloudMat.emissive.setRGB(lerp(0.95, 0.35, night) + dusk * 0.3, lerp(0.96, 0.45, night) - dusk * 0.15, lerp(1, 0.85, night) - dusk * 0.3);
    G.renderer.toneMappingExposure = lerp(base.exposure, 0.95, night);
    if (G.look) { G.look.bloom.strength = lerp(base.bloom, 0.62, night) + dusk * 0.1; G.look.grade.warm.value = lerp(base.warm, -0.25, night) + dusk * 0.3; G.look.grade.vig.value = lerp(0.2, 0.34, night); }
    // lamps, windows, fireflies
    const lit = sm(0.3, 0.8, Math.max(night, dusk * 0.9)); lib.M_Lamp.emissiveIntensity = lerp(base.lamp, 5, lit); lib.M_GlassBlue.emissiveIntensity = lit * 1.1; lib.M_Glass.emissiveIntensity = lit * 0.35;
    for (const s of glows) s.material.opacity = lit * (0.75 + Math.sin(t * 3 + s.position.x) * 0.05);
    const hp = g.ctl.pos, near = lamps.map((l, i) => [Math.hypot(l[0] - hp.x, l[2] - hp.z), i]).sort((a, b) => a[0] - b[0]);
    pls.forEach((l, i) => { const n = near[i]; if (n && n[0] < 45) { const L = lamps[n[1]]; l.position.set(L[0], L[1] - 0.3, L[2]); l.intensity = lit * 55; } else l.intensity = 0; });
    flies.material.opacity = night * (0.65 + Math.sin(t * 2.1) * 0.2);
    if (night > 0.02) { for (let i = 0; i < NF; i++) { const ph = fo[i * 4 + 3], x = hp.x + ((fo[i * 4] + t * 0.3 * Math.sin(ph) - hp.x) % 50 + 75) % 50 - 25, z = hp.z + ((fo[i * 4 + 2] + t * 0.3 * Math.cos(ph) - hp.z) % 50 + 75) % 50 - 25; fp[i * 3] = x + Math.sin(t * 0.9 + ph) * 0.8; fp[i * 3 + 1] = Math.max(heightAt(x, z), 0) + fo[i * 4 + 1] + Math.sin(t * 1.3 + ph * 3) * 0.4 - (Math.sin(t * 1.7 + ph * 5) > 0.55 ? 500 : 0); fp[i * 3 + 2] = z + Math.cos(t * 0.8 + ph) * 0.8; } fg.attributes.position.needsUpdate = true; }
    // shooting stars
    if (U.shP.value >= 0) { U.shP.value += dt / 0.9; if (U.shP.value > 1) U.shP.value = -1; }
    else if (night > 0.8) { shootT -= dt; if (shootT < 0) { shootT = 3 + Math.random() * 7; const a = Math.random() * 6.283, e = 0.5 + Math.random() * 0.7, a2 = a + (Math.random() - 0.5) * 0.9, e2 = e - 0.25 - Math.random() * 0.2; U.shA.value.set(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)); U.shB.value.set(Math.cos(a2) * Math.cos(e2), Math.sin(e2), Math.sin(a2) * Math.cos(e2)); U.shP.value = 0; } }
    if (G.ambientDay) G.ambientDay(1 - night);
    // indoors the sun is shut out: soft, even room light with no bloom wash and no depth blur
    state.in = (state.in || 0) + ((G.indoors ? 1 : 0) - (state.in || 0)) * Math.min(1, dt * 6); if (state.in > 0.01) { const k = state.in; sun.intensity *= 1 - k; hemi.intensity = lerp(hemi.intensity, 0.42, k); hemi.color.lerp(skyDay, k); scene.environmentIntensity = lerp(scene.environmentIntensity, 0.28, k); G.renderer.toneMappingExposure = lerp(G.renderer.toneMappingExposure, 0.92, k); if (G.look) { G.look.bloom.strength = lerp(G.look.bloom.strength, 0.1, k); G.look.grade.warm.value = lerp(G.look.grade.warm.value, 0.2, k); G.look.grade.glow.value = lerp(0.1, 0.02, k); G.look.dof.amount.value = 1 - k; } } else if (G.look && G.look.dof.amount.value !== 1) { G.look.dof.amount.value = 1; G.look.grade.glow.value = 0.1; }
  });
}
