import * as T from 'three';
import { SPOTS, PEAK, PONDS } from './layout.js';
import { heightAt } from './terrain.js';
import { addCircle, addBox, addPlatform } from './colliders.js';
import { buildWater } from './water.js';
import { models, loadModels } from './world.js';
import { rng } from '../util/noise.js';

export async function initLandmarks(G, loader, terrain) {
  await loadModels(loader, { lighthouse: 'landmarks', turbine_tower: 'landmarks', turbine_rotor: 'landmarks', observatory: 'landmarks', sailboat: 'landmarks', ruins_gate: 'structures', glyph_block: 'props', glyph_pedestal: 'props',
    umbrella_orange: 'props', umbrella_blue: 'props', lounger: 'props', beach_ball: 'props', pier: 'structures', fence: 'props', surf_rack: 'props', cooler: 'props', sandcastle: 'props', life_ring_post: 'props', volleyball_net: 'props' });
  const root = G.world, R = rng(777);
  const put = (name, x, z, rotY = 0, s = 1, y = null) => { const m = models[name]; if (!m) return null; const o = m.clone(); o.position.set(x, y ?? heightAt(x, z), z); o.rotation.y = rotY; o.scale.setScalar(s); root.add(o); return o; };
  const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

  // ---- the halo over Halo Peak: a thin ring of light with a soft glow, visible from everywhere
  let top = 0, tx = PEAK.x, tz = PEAK.z; for (let x = PEAK.x - 30; x <= PEAK.x + 30; x += 3) for (let z = PEAK.z - 30; z <= PEAK.z + 30; z += 3) { const h = heightAt(x, z); if (h > top) top = h; }
  const halo = new T.Group(); halo.position.set(PEAK.x, top + 30, PEAK.z); halo.rotation.set(0.1, 0, 0.06);
  const ringM = new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.8, 3.2), toneMapped: false, fog: false });
  halo.add(new T.Mesh(new T.TorusGeometry(46, 0.9, 12, 120).rotateX(Math.PI / 2), ringM));
  const glowM = new T.MeshBasicMaterial({ color: '#9fe9ff', transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, fog: false, side: T.DoubleSide });
  halo.add(new T.Mesh(new T.TorusGeometry(46, 3.6, 10, 120).rotateX(Math.PI / 2), glowM)); halo.add(new T.Mesh(new T.RingGeometry(40, 52, 96).rotateX(-Math.PI / 2), glowM.clone()));
  root.add(halo); G.halo = halo; G.peakTop = top;

  // ---- lake + plunge pool + the waterfall between them
  const waters = [];
  for (const K of PONDS) { const geo = new T.CircleGeometry(K.r + 6, 48).rotateX(-Math.PI / 2); geo.scale(K.sx, 1, 1); geo.translate(K.x, 0, K.z); const w = buildWater(terrain.depthTex, terrain.depthSize, geo, K.level); root.add(w.mesh); waters.push(w); }
  { // ribbon that follows the cliff from the lake lip down into the pool
    const a = PONDS[0], b = PONDS[1], dir = new T.Vector2(b.x - a.x, b.z - a.z).normalize(), perp = new T.Vector2(-dir.y, dir.x), W = 5.2, N = 40, pos = [], uv = [], idx = [];
    const s0 = Math.hypot(SPOTS.falls.x - a.x, SPOTS.falls.z - a.z) - 9, len = 17; let dist = 0, prev = null;
    for (let i = 0; i <= N; i++) { const s = s0 + len * i / N, x = a.x + dir.x * s, z = a.z + dir.y * s; let y = Math.min(a.level, heightAt(x, z) + 0.35); if (i === N) y = b.level; y = Math.max(y, b.level);
      if (prev) dist += Math.hypot(len / N, y - prev); prev = y;
      for (const e of [-1, 1]) { pos.push(x + perp.x * e * W / 2 + dir.x * 0.6, y, z + perp.y * e * W / 2 + dir.y * 0.6); uv.push(e * 0.5 + 0.5, dist); } }
    for (let i = 0; i < N; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const U = { t: { value: 0 } }, U2 = { t: U.t };
    const mat = new T.ShaderMaterial({ uniforms: U, transparent: true, side: T.DoubleSide, depthWrite: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float t;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
        void main(){ float v=vUv.y*.35-t*1.35; float s=n(vec2(vUv.x*22.,v*2.))*.6+n(vec2(vUv.x*55.,v*5.))*.4; float edge=smoothstep(0.,.14,vUv.x)*smoothstep(1.,.86,vUv.x);
          vec3 c=mix(vec3(.50,.86,.98),vec3(1.),smoothstep(.35,.8,s)); float a=edge*mix(.72,1.,smoothstep(.3,.7,s)); gl_FragColor=vec4(c,a);
          #include <colorspace_fragment>
        }` });
    const fall = new T.Mesh(geo, mat); fall.renderOrder = 2; root.add(fall); G.fallMat = mat;
    { const P = SPOTS.plaza, cg = new T.CylinderGeometry(2.36, 2.44, 0.72, 48, 1, true); cg.translate(P.x, P.h + 0.9, P.z); const uvA = cg.attributes.uv; for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 6, (1 - uvA.getY(i)) * 1.4); const m2 = mat.clone(); m2.uniforms = U2; const fc = new T.Mesh(cg, m2); fc.renderOrder = 2; root.add(fc); } G.systems.push((dt) => (U.t.value += dt)); G.fallsBase = { x: b.x - dir.x * 5, z: b.z - dir.y * 5, y: b.level };
  }
  // ---- extra falls spilling off the plateau rims (found by marching outward until the land drops away)
  const HX = -10, HZ = -60;
  for (const [deg, r0, W] of [[38, 100, 6], [96, 100, 4.5], [118, 60, 5], [20, 58, 4], [150, 104, 4.5], [-20, 104, 5]]) {
    const a = deg * Math.PI / 180, dx = Math.cos(a), dz = Math.sin(a); let rr = r0, hTop = heightAt(HX + dx * r0, HZ + dz * r0), found = 0;
    for (; rr < r0 + 70; rr += 1.5) { const h = heightAt(HX + dx * rr, HZ + dz * rr); if (h < hTop - 14) { found = rr; break; } hTop = Math.max(hTop * 0.98 + h * 0.02, h > hTop ? h : hTop * 0.999); }
    if (!found) continue; const pos = [], uv = [], idx = [], N = 30, s0 = found - 12, len = 20; let dist = 0, py = null, lowest = 1e9; const px = -dz, pz = dx;
    for (let i = 0; i <= N; i++) { const sI = s0 + len * i / N, x = HX + dx * sI, z = HZ + dz * sI; let y = heightAt(x, z) + 0.3; if (py !== null) y = Math.min(y, py); if (py !== null) dist += Math.hypot(len / N, y - py); py = y; lowest = y; for (const e of [-1, 1]) { pos.push(x + px * e * W / 2 + dx * 0.5, y, z + pz * e * W / 2 + dz * 0.5); uv.push(e * 0.5 + 0.5, dist); } }
    for (let i = 0; i < N; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); const f = new T.Mesh(geo, G.fallMat); f.renderOrder = 2; root.add(f);
  }
  G.systems.push((dt, g) => { for (const w of waters) w.update(dt, g.camera.position); halo.rotation.y += dt * 0.05; const k = 1 + Math.sin(performance.now() * 0.0012) * 0.12; glowM.opacity = 0.2 * k; });

  // ---- lighthouse on the west cape
  { const L = SPOTS.lighthouse; put('lighthouse', L.x, L.z, face(L.x, L.z, 0, 0), 1.25, L.h); addCircle(L.x, L.z, 5.9); }
  // ---- wind turbines on Wind Ridge
  const rotors = [];
  for (const [dx, dz, s] of [[0, 0, 1.15], [-34, 22, 1], [26, -30, 0.95], [-58, -14, 0.9]]) { const x = SPOTS.windRidge.x + dx, z = SPOTS.windRidge.z + dz, y = heightAt(x, z) - 0.4, ry = 2.3; put('turbine_tower', x, z, ry, s, y); addCircle(x, z, 1.4 * s);
    const r = models.turbine_rotor.clone(), piv = new T.Group(); piv.position.set(x, y + 26.2 * s, z); piv.rotation.y = ry; r.position.set(0, 0, 2.0 * s); r.scale.setScalar(s); piv.add(r); root.add(piv); rotors.push([r, 0.5 + R() * 0.3]); }
  G.systems.push((dt) => { for (const [r, sp] of rotors) r.rotation.z += dt * sp; });
  // ---- observatory (north-east hill)
  { const O = SPOTS.observatory; put('observatory', O.x, O.z, face(O.x, O.z, 0, 0) + Math.PI, 1, O.h); addCircle(O.x, O.z, 7); }
  // ---- puzzle ruins: sealed gate with glowing glyph, pedestal and three glyph blocks (east)
  { const U = SPOTS.ruins, ry = face(U.x, U.z, U.x - 30, U.z + 20); put('ruins_gate', U.x, U.z, ry, 1, U.h);
    const f = new T.Vector3(Math.sin(ry), 0, Math.cos(ry)), s = new T.Vector3(f.z, 0, -f.x);
    for (const e of [-1, 1]) addBox(U.x + s.x * e * 3.5, U.z + s.z * e * 3.5, 1.6, 1.0, ry); G.ruinDoor = addBox(U.x, U.z, 2.0, 0.6, ry);
    put('glyph_pedestal', U.x + f.x * 7 + s.x * 3.6, U.z + f.z * 7 + s.z * 3.6, ry + Math.PI, 1); for (let i = -1; i <= 1; i++) put('glyph_block', U.x + f.x * 5.2 + s.x * (-3 + i * 1.3), U.z + f.z * 5.2 + s.z * (-3 + i * 1.3), ry, 1); }
  // ---- a smaller ruin at the edge of the plaza, like the key art (hint that the island is older than the resort)
  { const P = SPOTS.plaza, x = P.x - 39, z = P.z + 6, ry = face(x, z, P.x, P.z); put('ruins_gate', x, z, ry, 0.62, P.h - 0.1); addBox(x, z, 3.2, 0.9, ry); put('glyph_pedestal', x + 4.6, z + 3.4, ry + Math.PI + 0.3, 1, P.h); }

  // ---- resort beach (south cove)
  const B = SPOTS.beach = { x: 66, z: 221 };
  const bh = (x, z) => heightAt(x, z);
  for (const [dx, dz, kind] of [[-18, -2, 'umbrella_orange'], [-8, 1, 'umbrella_blue'], [4, 2, 'umbrella_orange'], [16, 4, 'umbrella_blue'], [30, 5, 'umbrella_orange']]) { const x = B.x + dx, z = B.z + dz; put(kind, x, z, R() * 6, 1); addCircle(x, z, 0.12);
    put('lounger', x - 1.2, z + 0.4, 3.3 + R() * 0.3, 1); put('lounger', x + 1.2, z + 0.5, 3.0 - R() * 0.3, 1); if (R() < 0.6) put('cooler', x + 0.1, z - 0.9, R() * 6, 1); }
  G.balls = []; for (const [dx, dz] of [[-12, 6], [9, 8], [22, 9]]) { const x = B.x + dx, z = B.z + dz, o = put('beach_ball', x, z, R() * 6, 1); o.userData.ball = { v: new T.Vector3(), r: 0.42 }; G.balls.push(o); }
  put('sandcastle', B.x - 2, B.z + 7, 0.5, 1); put('sandcastle', B.x + 26, B.z + 11, 2, 0.8); put('surf_rack', B.x - 26, B.z - 6, 0.5, 1); put('life_ring_post', B.x + 36, B.z + 8, -0.6, 1);
  { const x = B.x - 34, z = B.z - 1, ry = 0.25; put('volleyball_net', x, z, ry, 1); G.volley = { x, z, ry }; }
  // pier out into the cove
  { const px = B.x + 22, pz = B.z + 14.5, ry = Math.PI / 2 + 0.12, n = 5, d = new T.Vector3(Math.sin(ry + Math.PI / 2), 0, Math.cos(ry + Math.PI / 2));
    for (let i = 0; i < n; i++) { const x = px - d.x * i * 8 * -1 * 0 + Math.sin(ry - Math.PI / 2) * 0 + Math.cos(ry) * 0, z = pz; }
    const dirx = Math.sin(0.12), dirz = Math.cos(0.12);   // pier runs roughly south
    put('pier', px, pz, 0.12 - Math.PI / 2, 1, 1.0);
    addPlatform({ x: px + dirx * 20, z: pz + dirz * 20, hw: 1.6, hd: 20.2, rotY: 0.12, y: 1.0 }); addPlatform({ x: px + dirx * 44.5, z: pz + dirz * 44.5, hw: 4.5, hd: 4.5, rotY: 0.12, y: 1.0 }); G.pier = { x: px + dirx * 44, z: pz + dirz * 44 }; }
  for (let i = 0; i < 9; i++) { const x = B.x - 30 + i * 2.4, z = 203 + i * 1.6; if (bh(x, z) > 2.2) put('fence', x, z, -0.58, 1); }
  // sailboats bobbing offshore
  const boats = []; for (const [x, z, ry] of [[10, 300, 1], [150, 290, -0.6], [-120, 280, 2.2], [260, 160, 0.3], [-330, -60, 4]]) { const o = put('sailboat', x, z, ry, 1.6, 0.2); boats.push(o); }
  G.systems.push(() => { const t = performance.now() * 0.001; boats.forEach((o, i) => { o.position.y = 0.25 + Math.sin(t * 0.9 + i) * 0.18; o.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.05; }); });
}
