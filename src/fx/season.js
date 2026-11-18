import * as T from 'three';
import { S, save } from '../game/state.js';
import { audio } from '../game/audio.js';
import { groundAt } from '../world/colliders.js';
import { TERRACE } from '../world/layout.js';
// Winter, as an easter egg: shake the snow globe on the Cloudrest terrace and the island turns white. Shake it again for summer.
// SNOW (0..1) is read by the terrain, grass and foliage shaders; flakes fall in a box that follows the camera.
import { SNOW } from './snow.js';
export async function initSeason(G) {
  const hud = G.hud, ctl = G.ctl, hero = G.hero, root = G.world; let target = S.flags.winter ? 1 : 0; SNOW.value = target;
  // flakes: points in a 70 m box round the camera, drifting with the wind
  const N = 5000, B = 70, H = 36, pos = new Float32Array(N * 3), seed = new Float32Array(N); for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * B; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - 0.5) * B; seed[i] = Math.random(); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('seed', new T.BufferAttribute(seed, 1));
  const U = { t: { value: 0 }, cam: { value: new T.Vector3() }, k: SNOW, wind: { value: new T.Vector2(0.6, 0.2) } };
  const mat = new T.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `uniform float t;uniform vec3 cam;uniform vec2 wind;attribute float seed;varying float vA;void main(){vec3 p=position;float fall=t*(1.1+seed*.9);p.y=mod(p.y-fall-cam.y+${H / 2}.,${H}.)+cam.y-${H / 2}.;
      p.x=mod(p.x+wind.x*t+sin(t*.7+seed*30.)*1.2-cam.x+${B / 2}.,${B}.)+cam.x-${B / 2}.;p.z=mod(p.z+wind.y*t+cos(t*.6+seed*20.)*1.2-cam.z+${B / 2}.,${B}.)+cam.z-${B / 2}.;
      vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(2.+seed*4.)*(60./-mv.z);vA=smoothstep(60.,8.,-mv.z);}`,
    fragmentShader: `uniform float k;varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;gl_FragColor=vec4(1.,1.,1.,smoothstep(.5,.1,d)*vA*k*.9);}` });
  const flakes = new T.Points(geo, mat); flakes.frustumCulled = false; flakes.renderOrder = 6; G.scene.add(flakes);
  // the snow globe on the Cloudrest terrace
  const gx = TERRACE.x + 3.2, gz = TERRACE.z + 11.6, gy = groundAt(gx, gz), globe = new T.Group(); globe.position.set(gx, gy, gz); root.add(globe);
  { const ped = new T.Mesh(new T.CylinderGeometry(0.32, 0.4, 0.9, 20), new T.MeshStandardMaterial({ color: '#f6f3ea', roughness: 0.6 })); ped.position.y = 0.45; ped.castShadow = true; globe.add(ped);
    const baseM = new T.Mesh(new T.CylinderGeometry(0.28, 0.32, 0.18, 24), new T.MeshStandardMaterial({ color: '#c0392b', roughness: 0.4, metalness: 0.2 })); baseM.position.y = 0.99; globe.add(baseM);
    const glass = new T.Mesh(new T.SphereGeometry(0.34, 32, 20), new T.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transmission: 0.95, thickness: 0.2, clearcoat: 1, transparent: true, opacity: 0.35 })); glass.position.y = 1.36; globe.add(glass);
    const tiny = new T.Mesh(new T.ConeGeometry(0.16, 0.34, 16), new T.MeshStandardMaterial({ color: '#2f7a3a' })); tiny.position.y = 1.32; globe.add(tiny); const mound = new T.Mesh(new T.SphereGeometry(0.25, 20, 10, 0, 6.3, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 })); mound.position.y = 1.08; mound.scale.y = 0.4; globe.add(mound);
    const inner = []; for (let i = 0; i < 40; i++) { const f = new T.Mesh(new T.SphereGeometry(0.012, 4, 3), new T.MeshBasicMaterial({ color: '#ffffff' })); f.userData.s = Math.random() * 10; globe.add(f); inner.push(f); } globe.userData.inner = inner; }
  let shake = 0; const apply = (on) => { S.flags.winter = on ? 1 : 0; save(); target = on ? 1 : 0; };
  G.thing({ x: gx, z: gz, r: 1.8, marker: '#ffffff', kind: 'activity', name: 'Snow globe', label: () => S.flags.winter ? 'Shake the snow globe (back to summer)' : 'Shake the snow globe', act: () => { shake = 1.2; audio.star(); hero.emote(S.flags.winter ? 'happy' : 'surprised');
      if (!S.flags.winter && G.cutscene) { apply(true); G.cutscene([{ dur: 4.5, text: 'Somewhere over Halo Isle, it starts to snow…', from: [[gx + 4, gy + 3, gz + 6], [gx, gy + 1.3, gz]], to: [[TERRACE.x + 30, TERRACE.h + 26, TERRACE.z + 70], [78, 6, 158]] }], () => { hud.toast('Winter!', 'Shake the globe again any time for summer'); if (!S.flags.sawSnow) { S.flags.sawSnow = 1; S.coins += 25; hud.setCoins(S.coins); save(); } }); }
      else { apply(!S.flags.winter); hud.toast(S.flags.winter ? 'Winter!' : 'Summer again', S.flags.winter ? 'The whole island is snowing' : 'The snow melts away'); } } });
  G.setWinter = apply; G.snowNow = (v) => { apply(v); SNOW.value = target; }; let breath = 0;
  G.systems.push((dt) => { U.t.value += dt; U.cam.value.copy(G.camera.position); const gust = G.wind?.gust || 1; U.wind.value.set(0.7 * gust, 0.25 * gust);
    SNOW.value += (target - SNOW.value) * Math.min(1, dt * 0.35); flakes.visible = SNOW.value > 0.01 && !G.indoors;
    if (shake > 0) { shake -= dt; globe.rotation.z = Math.sin(shake * 30) * 0.12 * shake; } for (const f of globe.userData.inner) { f.userData.s += dt * (0.25 + shake); const s = f.userData.s; f.position.set(Math.sin(s * 3.1 + s) * 0.2 * Math.cos(s), 1.2 + ((s * 0.15) % 0.3), Math.cos(s * 2.3) * 0.2 * Math.sin(s * 0.7)); }
    // in winter your breath shows
    if (SNOW.value > 0.5 && !G.indoors && !ctl.state.swim) { breath -= dt; if (breath < 0) { breath = 1.6 + Math.random(); const h = ctl.pos; G.puff?.(h.x + Math.sin(ctl.yaw) * 0.35, h.y + 0.75, h.z + Math.cos(ctl.yaw) * 0.35, 2, '#ffffff', 0.25, 0.4); } } });
}
