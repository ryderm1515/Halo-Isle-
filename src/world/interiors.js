import * as T from 'three';
import { S, save } from '../game/state.js';
import { audio } from '../game/audio.js';
import { matLib } from './materials.js';
import { SPOTS, PEAK } from './layout.js';
import { groundAt, addPlatform } from './colliders.js';
import { models } from './world.js';
// Buildings you can walk into. Each interior is a real room tucked far below the island; doors fade you in and out,
// the camera pulls in close, and outside sound goes soft.
export async function initInteriors(G) {
  const hud = G.hud, ctl = G.ctl, lib = matLib(), root = G.world, P = SPOTS.plaza; let cur = null;
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || root).add(m); return m; };
  const M = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
  const rooms = [];
  function room({ name, R, H, at, floor, wall, glow = '#fff1d0', dome = true, build }) {
    const g = new T.Group(); g.position.set(at[0], at[1], at[2]); root.add(g); const add = (geo, mat, x, y, z) => mesh(geo, mat, x, y, z, g);
    const fl = add(new T.CircleGeometry(R, 56).rotateX(-Math.PI / 2), floor, 0, 0, 0); fl.geometry.setAttribute('uv', new T.BufferAttribute(new Float32Array([...fl.geometry.attributes.position.array].flatMap((v, i) => (i % 3 === 0 ? [v * 0.4] : i % 3 === 2 ? [v * 0.4] : []))), 2));
    const wm = wall.clone(); wm.side = T.BackSide; add(new T.CylinderGeometry(R, R, H, 56, 1, true), wm, 0, H / 2, 0);
    add(new T.TorusGeometry(R - 0.05, 0.12, 8, 56).rotateX(Math.PI / 2), lib.M_White, 0, 0.12, 0); add(new T.TorusGeometry(R - 0.05, 0.16, 8, 56).rotateX(Math.PI / 2), lib.M_White, 0, H, 0);
    if (dome) { const dm = new T.MeshBasicMaterial({ color: '#bfe6ff', side: T.BackSide }); add(new T.SphereGeometry(R, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), dm, 0, H, 0).scale.y = 0.55; for (let i = 0; i < 12; i++) { const rib = add(new T.TorusGeometry(R - 0.03, 0.05, 6, 24, Math.PI / 2), lib.M_White, 0, H, 0); rib.rotation.y = i / 12 * Math.PI * 2; rib.scale.y = 0.55; } }
    else add(new T.CircleGeometry(R, 40).rotateX(Math.PI / 2), wall, 0, H, 0);
    // door (south, +z) with a welcome mat
    add(new T.BoxGeometry(2.2, 2.9, 0.25), lib.M_GlassBlue, 0, 1.45, R - 0.1); add(new T.BoxGeometry(2.5, 0.2, 0.35), lib.M_White, 0, 3.0, R - 0.12); for (const sx of [-1.2, 1.2]) add(new T.BoxGeometry(0.18, 3.0, 0.35), lib.M_White, sx, 1.5, R - 0.12);
    add(new T.BoxGeometry(2.0, 0.03, 1.1), M('#3f9ff2'), 0, 0.02, R - 1.1);
    const l1 = new T.PointLight(glow, 90, R * 3.2, 1.3); l1.position.set(0, H - 0.6, 0); g.add(l1); const l2 = new T.PointLight('#cfe6ff', 30, R * 2.5, 1.5); l2.position.set(0, 1.6, R - 2); g.add(l2);
    l1.visible = l2.visible = false; const r = { name, R, H, at, g, things: [], lights: [l1, l2] }; build?.(add, g, r); rooms.push(r); return r;
  }
  const thing = (r, x, z, label, act, rad = 1.9) => { const t = G.thing({ x: r.at[0] + x, z: r.at[2] + z, y: r.at[1], r: rad, label, act }); r.things.push(t); return t; };
  function enter(r, back) { if (cur) return; hud.fadeTo(1, '#eaf6ff'); audio.ui(); ctl.locked = true; setTimeout(() => { cur = r; r.back = back; G.indoors = r; r.lights.forEach((l) => (l.visible = true)); ctl.floor = r.at[1]; ctl.teleport(r.at[0], r.at[2] + r.R - 2.2, r.at[1]); ctl.yaw = Math.PI; ctl.cam.yaw = 0; ctl.cam.pitch = 0.22; ctl.cam.indoor = r.at[1]; ctl.cam.maxDist = Math.min(5.5, r.R * 0.75); ctl.locked = false; hud.fadeTo(0); hud.area(r.name, ''); }, 420); }
  function exit() { if (!cur) return; const r = cur; r.lights.forEach((l) => (l.visible = false)); hud.fadeTo(1, '#eaf6ff'); ctl.locked = true; setTimeout(() => { cur = null; G.indoors = null; ctl.floor = null; ctl.cam.indoor = null; ctl.cam.maxDist = null; ctl.teleport(r.back[0], r.back[1], r.back[3]); ctl.yaw = r.back[2]; ctl.cam.yaw = r.back[2] + Math.PI; ctl.locked = false; hud.fadeTo(0); }, 420); }
  G.exitInterior = () => { if (cur) { cur.lights.forEach((l) => (l.visible = false)); cur = null; G.indoors = null; ctl.floor = null; ctl.cam.indoor = null; ctl.cam.maxDist = null; } };
  const door = (r, x, z, yawOut, label, y) => { G.thing({ x, z, y, r: 2.4, marker: '#bfe6ff', kind: 'door', name: r.name, label, act: () => enter(r, [x + Math.sin(yawOut) * 1.5, z + Math.cos(yawOut) * 1.5, yawOut, y]) }); thing(r, 0, r.R - 1.2, 'Go outside', exit, 1.7); };
  G.systems.push(() => { if (!cur) return; const dx = ctl.pos.x - cur.at[0], dz = ctl.pos.z - cur.at[2], d = Math.hypot(dx, dz), lim = cur.R - 0.55; if (d > lim) { ctl.pos.x = cur.at[0] + dx / d * lim; ctl.pos.z = cur.at[2] + dz / d * lim; } });
  const put = (g, name, x, z, ry = 0, s = 1, y = 0) => { const m = models[name]; if (!m) return; const o = m.clone(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); g.add(o); return o; };
  const desk = (add, x, z, w = 3, col = lib.M_Wood) => { add(new T.BoxGeometry(w, 1.0, 0.9), col, x, 0.5, z); add(new T.BoxGeometry(w + 0.2, 0.08, 1.1), lib.M_Marble, x, 1.04, z); };

  // ---- Town Hall lobby
  const hall = room({ name: 'Town Hall', R: 8.4, H: 5.2, at: [900, -120, 900], floor: lib.M_Marble, wall: lib.M_Plaster, build: (add, g, r) => {
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.31; if (Math.abs(Math.sin(a / 1) - 0) < 0 ) continue; if (Math.cos(a - Math.PI / 2) > 0.93) continue; add(new T.CylinderGeometry(0.3, 0.34, 5.2, 16), lib.M_Marble, Math.cos(a) * 7.4, 2.6, Math.sin(a) * 7.4); }
    add(new T.RingGeometry(2.2, 2.6, 48).rotateX(-Math.PI / 2), lib.M_PavingPink, 0, 0.012, 0); add(new T.RingGeometry(5.6, 5.9, 56).rotateX(-Math.PI / 2), lib.M_PavingPink, 0, 0.012, 0);
    desk(add, 0, -5.6, 4.2); add(new T.BoxGeometry(3.4, 1.1, 0.06), lib.M_Emblem, 0, 3.3, -8.2);
    // the island in miniature on a round table: open the map from here
    add(new T.CylinderGeometry(1.5, 1.3, 0.9, 32), lib.M_Marble, 0, 0.45, 0); const mini = add(new T.CylinderGeometry(1.35, 1.35, 0.06, 40), new T.MeshStandardMaterial({ map: new T.CanvasTexture(hud.mapBase), roughness: 0.6 }), 0, 0.95, 0); mini.material.map.colorSpace = T.SRGBColorSpace; add(new T.ConeGeometry(0.28, 0.5, 12), lib.M_Rock, -0.06, 1.2, -0.3); const halo = add(new T.TorusGeometry(0.2, 0.012, 6, 30).rotateX(Math.PI / 2), lib.M_Glow, -0.06, 1.62, -0.3); r.spin = halo;
    put(g, 'bench', -5.2, 2.5, Math.PI / 2 + 0.3); put(g, 'bench', 5.2, 2.5, -Math.PI / 2 - 0.3); put(g, 'planter_small', -4.6, -3.4); put(g, 'planter_small', 4.6, -3.4); put(g, 'plant_broadleaf_b', -4.6, -3.4, 0, 1.1, 0.5); put(g, 'plant_broadleaf_b', 4.6, -3.4, 2, 1.1, 0.5); put(g, 'notice_board', 6.2, -1.2, -Math.PI / 2);
    thing(r, 0, 0, 'Look at the island model', () => G.openMap?.(), 2.5);
    thing(r, 0, -4.6, 'Ring the desk bell', () => { audio.good(); ctl.locked = true; const n = Object.keys(S.shards).length, st = Object.keys(S.stars).length; hud.dialog('Clerk Dot-Matrix', [`Town records, let me see… <b>${n}</b> of 5 halo shards returned, <b>${st}</b> Sun Stars logged, <b>${Object.keys(S.medals).length}</b> activities with a medal.`, 'The Mayor is usually out on the steps. Says the view helps the thinking.'], () => (ctl.locked = false)); });
  } });
  door(hall, G.hall.x + Math.sin(G.hall.ry) * 9.6, G.hall.z + Math.cos(G.hall.ry) * 9.6, G.hall.ry, 'Enter the Town Hall', P.h + 0.8);
  // ---- Observatory
  const obs = room({ name: 'Observatory', R: 6.2, H: 4.2, at: [900, -120, 1000], floor: lib.M_WoodDark, wall: lib.M_PlasterBlue, glow: '#9fc4ff', dome: false, build: (add, g, r) => {
    const sm = new T.ShaderMaterial({ side: T.BackSide, uniforms: { t: { value: 0 } }, vertexShader: 'varying vec3 d;void main(){d=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'uniform float t;varying vec3 d;float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}void main(){vec3 n=normalize(d);vec3 g=floor(n*60.);float s=step(.985,h(g))*(.6+.4*sin(t*2.+h(g+3.)*30.));vec3 c=mix(vec3(.03,.06,.2),vec3(.01,.02,.08),n.y)+vec3(.9,.95,1.)*s;float a=atan(n.z,n.x);c+=vec3(.2,1.,.6)*pow(sin(a*6.+t*.3)*.5+.5,3.)*smoothstep(.2,.5,n.y)*smoothstep(.9,.5,n.y)*.25;gl_FragColor=vec4(c,1.);}' });
    add(new T.SphereGeometry(6.15, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), sm, 0, 4.2, 0).scale.y = 0.75; r.sky = sm;
    add(new T.CylinderGeometry(1.2, 1.4, 0.7, 24), lib.M_Metal, 0, 0.35, 0); const tube = add(new T.CylinderGeometry(0.42, 0.55, 4.6, 24), lib.M_Metal, 0.6, 2.4, -0.6); tube.rotation.set(0.75, 0.6, 0); const cap = add(new T.CylinderGeometry(0.6, 0.6, 0.5, 24), lib.M_NavyBlue, 1.5, 3.9, -2.05); cap.rotation.copy(tube.rotation); add(new T.CylinderGeometry(0.1, 0.1, 0.7, 10), lib.M_Navy, -0.55, 1.05, 0.7).rotation.x = 0.9;
    desk(add, -3.9, -2.2, 2.2, lib.M_WoodDark); add(new T.BoxGeometry(1.6, 0.02, 0.8), M('#1c3f86', { emissive: '#2f6fd6', emissiveIntensity: 0.6 }), -3.9, 1.1, -2.2); put(g, 'bench', 3.6, 2.4, -Math.PI / 2 - 0.5);
    for (let i = 0; i < 5; i++) add(new T.BoxGeometry(0.9, 1.1 + (i % 2) * 0.3, 0.05), M(['#22386f', '#2b4a8f'][i % 2], { emissive: '#3f66c8', emissiveIntensity: 0.5 }), Math.cos(2.2 + i * 0.42) * 6.0, 2.2, Math.sin(2.2 + i * 0.42) * 6.0).rotation.y = -(2.2 + i * 0.42) + Math.PI / 2;
    thing(r, 0, 1.4, 'Look through the telescope', () => { const top = G.peakTop || 200; G.cutscene([{ dur: 5.5, text: 'Through the lens, the halo fills the sky.', from: [[PEAK.x + 190, top + 40, PEAK.z + 150], [PEAK.x, top + 30, PEAK.z]], to: [[PEAK.x + 70, top + 36, PEAK.z + 60], [PEAK.x, top + 30, PEAK.z]] }, { dur: 4, text: `${Object.keys(S.shards).length} of its five shards are back where they belong.`, from: [[PEAK.x + 70, top + 36, PEAK.z + 60], [PEAK.x, top + 30, PEAK.z]], to: [[PEAK.x + 55, top + 60, PEAK.z + 20], [PEAK.x, top + 30, PEAK.z]] }], () => { ctl.cam.indoor = r.at[1]; }); }, 2.2);
    thing(r, -3.9, -1.2, 'Read the star charts', () => { ctl.locked = true; hud.dialog('Star Charts', ['Nova\'s notes: "The aurora only comes on nights when the halo is restless. It has been restless a lot lately."', '"Sun Stars seem to be fragments of the same light. Ten of them should be enough to wake the big lens."'], () => (ctl.locked = false)); });
  } });
  { const O = SPOTS.observatory, a = Math.atan2(-O.x, -O.z) + Math.PI, ry = Math.atan2(0 - O.x, 0 - O.z); door(obs, O.x + Math.sin(ry) * 7.6, O.z + Math.cos(ry) * 7.6, ry, 'Enter the observatory', O.h + 1.0); addPlatform({ x: O.x, z: O.z, r: 8.6, y: O.h + 0.5 }); addPlatform({ x: O.x, z: O.z, r: 7.9, y: O.h + 1.0 }); }
  // ---- Lighthouse keeper's room, with a radio and a ladder up to the lamp
  const lh = room({ name: 'Lighthouse', R: 3.6, H: 4.4, at: [1000, -120, 900], floor: lib.M_Wood, wall: lib.M_Plaster, glow: '#ffe2ae', dome: false, build: (add, g, r) => {
    add(new T.CylinderGeometry(0.6, 0.6, 0.06, 20), lib.M_Wood, -1.6, 0.8, -1.2); add(new T.CylinderGeometry(0.07, 0.1, 0.8, 8), lib.M_WoodDark, -1.6, 0.4, -1.2);
    const radio = new T.Group(); radio.position.set(-1.6, 0.83, -1.2); radio.rotation.y = 0.6; g.add(radio); mesh(new T.BoxGeometry(0.46, 0.28, 0.16), M('#f0524a', { roughness: 0.35 }), 0, 0.14, 0, radio); mesh(new T.CircleGeometry(0.09, 16), M('#2a2d33'), -0.1, 0.14, 0.081, radio); mesh(new T.BoxGeometry(0.14, 0.07, 0.01), M('#fff5d6', { emissive: '#ffe28a', emissiveIntensity: 0.8 }), 0.12, 0.17, 0.081, radio); const ant = mesh(new T.CylinderGeometry(0.006, 0.006, 0.4, 5), lib.M_Metal, 0.18, 0.44, -0.04, radio); ant.rotation.z = -0.3; r.radio = radio;
    add(new T.BoxGeometry(1.9, 0.4, 0.95), lib.M_Wood, 1.7, 0.2, -1.5); add(new T.BoxGeometry(1.85, 0.22, 0.9), lib.M_FabricWhite, 1.7, 0.5, -1.5); add(new T.BoxGeometry(0.5, 0.14, 0.7), lib.M_FabricBlue, 2.35, 0.66, -1.5);
    const rod = add(new T.CylinderGeometry(0.018, 0.03, 2.6, 6), lib.M_WoodDark, -3.2, 1.5, 0.6); rod.rotation.z = 0.16; add(new T.TorusGeometry(0.07, 0.02, 6, 12), lib.M_Metal, -3.05, 0.6, 0.6); add(new T.BoxGeometry(0.5, 0.3, 0.35), lib.M_NavyBlue, -2.8, 0.15, 1.3);
    for (let i = 0; i < 9; i++) add(new T.BoxGeometry(0.7, 0.05, 0.08), lib.M_WoodDark, 0, 0.4 + i * 0.45, -3.42); for (const sx of [-0.35, 0.35]) add(new T.BoxGeometry(0.06, 4.3, 0.06), lib.M_WoodDark, sx, 2.15, -3.44);
    add(new T.CircleGeometry(0.5, 24), new T.MeshBasicMaterial({ color: '#bfe6ff' }), 3.5, 2.2, 0.4).rotation.y = -Math.PI / 2; add(new T.TorusGeometry(0.52, 0.06, 8, 24), lib.M_White, 3.5, 2.2, 0.4).rotation.y = -Math.PI / 2;
    thing(r, -1.6, -0.9, () => audio.radioOn ? 'Switch the radio off' : 'Switch the radio on', () => { audio.radio?.(!audio.radioOn); hud.toast(audio.radioOn ? 'Radio on' : 'Radio off', audio.radioOn ? 'Island FM, all day and all night' : ''); }, 1.5);
    thing(r, 0, -2.9, 'Climb to the lamp', () => { const L = SPOTS.lighthouse; G.exitInterior(); hud.flash(); ctl.teleport(L.x + 3.3, L.z, L.h + 25.2); audio.good(); hud.toast('Top of the lighthouse', 'Quite a view. Mind the edge.'); }, 1.5);
    thing(r, -2.9, 0.8, 'Look at the fishing rod', () => { ctl.locked = true; hud.dialog('Fishing Rod', ['Well used. A tag on the reel says "Do not lend to Zip again."'], () => (ctl.locked = false)); }, 1.3);
  } });
  { const L = SPOTS.lighthouse, ry = Math.atan2(-L.x, -L.z); door(lh, L.x + Math.sin(ry) * 6.6, L.z + Math.cos(ry) * 6.6, ry, 'Enter the lighthouse', L.h); addPlatform({ x: L.x, z: L.z, r: 4.3, y: L.h + 24.9 }); }
  let t = 0; G.systems.push((dt) => { t += dt; if (cur === hall && hall.spin) hall.spin.rotation.z += dt; if (cur === obs) obs.sky.uniforms.t.value = t; if (cur === lh && audio.radioOn) lh.radio.scale.y = 1 + Math.sin(t * 16) * 0.03; });
}
