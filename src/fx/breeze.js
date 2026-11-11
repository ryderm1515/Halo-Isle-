import * as T from 'three';
import { WIND } from './wind.js';
import { heightAt } from '../world/terrain.js';
import { noise } from '../util/noise.js';
// The island's weather is its wind: it swings round slowly, rises into gusts that bend the trees harder,
// carries leaves and petals past you, and holds a few kites over the beach.
export function initBreeze(G) {
  const root = G.world, ctl = G.ctl, wind = (G.wind = { x: 1, z: 0.3, gust: 1, dir: 0.3 });
  const N = 110, geo = new T.PlaneGeometry(0.16, 0.09, 2, 1); { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) * (1 - Math.abs(x) / 0.085 * 0.75)); p.setZ(i, -Math.abs(x) * 0.25); } }
  const mat = new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: 0.6, vertexColors: false }), im = new T.InstancedMesh(geo, mat, N); im.frustumCulled = false; im.castShadow = false; root.add(im);
  const cols = ['#7fd03a', '#a8e04a', '#5fb82e', '#ffd84a', '#ff9ec4', '#ffffff', '#f2a65a'], c = new T.Color(), L = [], d = new T.Object3D(), BOX = 46;
  for (let i = 0; i < N; i++) { L.push({ x: (Math.random() - 0.5) * BOX, y: 0.3 + Math.random() * 7, z: (Math.random() - 0.5) * BOX, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.8, rx: Math.random() * 6, ry: Math.random() * 6 }); im.setColorAt(i, c.set(cols[i % cols.length])); } im.instanceColor.needsUpdate = true;
  // kites over the beach, each on a string to a post in the sand
  const kites = []; for (const [x, z, col, col2] of [[44, 214, '#ff6b5c', '#ffd23f'], [86, 220, '#3f9ff2', '#ffffff'], [112, 226, '#b79bff', '#ff9ec4']]) { const y = heightAt(x, z), g = new T.Group(), sh = new T.Shape(); sh.moveTo(0, 0.75); sh.lineTo(0.5, 0.1); sh.lineTo(0, -0.75); sh.lineTo(-0.5, 0.1); sh.closePath();
    const k = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, roughness: 0.6, emissive: col, emissiveIntensity: 0.15 })); g.add(k); const bar = new T.Mesh(new T.PlaneGeometry(0.08, 1.5), new T.MeshBasicMaterial({ color: col2, side: T.DoubleSide })); bar.position.z = 0.005; g.add(bar); const bar2 = new T.Mesh(new T.PlaneGeometry(1.0, 0.08), new T.MeshBasicMaterial({ color: col2, side: T.DoubleSide })); bar2.position.set(0, 0.1, 0.005); g.add(bar2);
    const tailG = new T.BufferGeometry().setFromPoints(Array.from({ length: 10 }, () => new T.Vector3())), tail = new T.Line(tailG, new T.LineBasicMaterial({ color: col2 })); tail.frustumCulled = false; root.add(tail); const strG = new T.BufferGeometry().setFromPoints(Array.from({ length: 8 }, () => new T.Vector3())), str = new T.Line(strG, new T.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 })); str.frustumCulled = false; root.add(str);
    const post = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 0.9, 6), new T.MeshStandardMaterial({ color: '#c98a4b' })); post.position.set(x, y + 0.45, z); root.add(post); root.add(g); kites.push({ g, x, y: y + 0.9, z, tailG, strG, ph: Math.random() * 6, p: new T.Vector3(x, y + 12, z) }); }
  let t = 0;
  G.systems.push((dt) => { t += dt; wind.dir = 0.3 + Math.sin(t * 0.021) * 0.9 + Math.sin(t * 0.008 + 2) * 0.6; const g0 = noise(t * 0.09, 3.7), gust = 1 + Math.max(0, g0) * 1.25 + Math.sin(t * 0.7) * 0.08; wind.gust += (gust - wind.gust) * Math.min(1, dt * 0.8); const sp = 2.6 * wind.gust; wind.x = Math.cos(wind.dir) * sp; wind.z = Math.sin(wind.dir) * sp; if (WIND.gust) WIND.gust.value = 0.75 + (wind.gust - 1) * 0.9;
    const cp = G.camera.position, show = G.indoors ? 0 : 1;
    for (let i = 0; i < N; i++) { const l = L[i]; l.x += (wind.x * l.sp + Math.sin(t * 1.3 + l.ph) * 0.8) * dt; l.z += (wind.z * l.sp + Math.cos(t * 1.1 + l.ph) * 0.8) * dt; l.y += (Math.sin(t * 0.9 + l.ph * 2) * 0.5 - 0.12 + (wind.gust - 1) * 0.35) * dt; l.rx += dt * (2 + wind.gust * 2) * l.sp; l.ry += dt * 1.7;
      let rx = l.x - cp.x, rz = l.z - cp.z; if (rx > BOX / 2) l.x -= BOX; else if (rx < -BOX / 2) l.x += BOX; if (rz > BOX / 2) l.z -= BOX; else if (rz < -BOX / 2) l.z += BOX; const gy = Math.max(heightAt(l.x, l.z), 0); if (l.y < 0.15 || l.y > 9) l.y = 0.4 + Math.random() * 6;
      d.position.set(l.x, gy + l.y, l.z); d.rotation.set(l.rx, l.ry, l.rx * 0.6); d.scale.setScalar(show * (0.7 + (i % 5) * 0.14)); d.updateMatrix(); im.setMatrixAt(i, d.matrix); } im.instanceMatrix.needsUpdate = true;
    for (const k of kites) { const L2 = 13, tx = k.x + Math.cos(wind.dir) * L2 * 0.62 + Math.sin(t * 0.8 + k.ph) * 1.6, tz = k.z + Math.sin(wind.dir) * L2 * 0.62 + Math.cos(t * 0.6 + k.ph) * 1.6, ty = k.y + L2 * (0.62 + Math.min(0.25, (wind.gust - 1) * 0.2)) + Math.sin(t * 1.1 + k.ph) * 0.8; k.p.x += (tx - k.p.x) * Math.min(1, dt * 1.5); k.p.y += (ty - k.p.y) * Math.min(1, dt * 1.5); k.p.z += (tz - k.p.z) * Math.min(1, dt * 1.5);
      k.g.position.copy(k.p); k.g.rotation.set(-0.5 + Math.sin(t * 2.2 + k.ph) * 0.12, -wind.dir + Math.PI / 2, Math.sin(t * 1.7 + k.ph) * 0.25);
      const a = k.strG.attributes.position; for (let i = 0; i < 8; i++) { const u = i / 7; a.setXYZ(i, k.x + (k.p.x - k.x) * u, k.y + (k.p.y - 0.75 - k.y) * u - Math.sin(u * Math.PI) * 1.2, k.z + (k.p.z - k.z) * u); } a.needsUpdate = true;
      const b = k.tailG.attributes.position; for (let i = 0; i < 10; i++) { const u = i / 9; b.setXYZ(i, k.p.x - Math.cos(wind.dir) * u * 0.6 + Math.sin(t * 5 + i * 0.9 + k.ph) * 0.18 * u * 3, k.p.y - 0.75 - u * 2.6, k.p.z - Math.sin(wind.dir) * u * 0.6 + Math.cos(t * 4 + i * 0.8) * 0.18 * u * 3); } b.needsUpdate = true; } });
}
