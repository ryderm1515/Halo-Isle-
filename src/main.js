import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildTerrain, heightAt } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { buildSky, SUN_DIR } from './world/sky.js';
import { SPOTS } from './world/layout.js';
import { groundAt } from './world/colliders.js';
import { buildGrass } from './world/grass.js';
import { buildPost } from './fx/post.js';
import { WIND } from './fx/wind.js';
import { createHero } from './hero/hero.js';
import { createController, bindPointer } from './hero/controller.js';

const Q = new URLSearchParams(location.search), SHOT = Q.has('shot');
const canvas = document.getElementById('game');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = T.NeutralToneMapping; renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene(); scene.fog = new T.Fog('#ffeccf', 520, 3600);
const camera = new T.PerspectiveCamera(52, innerWidth / innerHeight, 0.12, 6000);
const post = Q.has('nopost') ? null : buildPost(renderer, scene, camera, SHOT);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); post?.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

const sky = buildSky(scene, renderer);
const sun = new T.DirectionalLight('#ffdc9c', 3.9); sun.castShadow = true; sun.shadow.mapSize.set(SHOT ? 2048 : 4096, SHOT ? 2048 : 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
sun.shadow.radius = 1.4; const SH = 40; Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix(); scene.add(sun, sun.target);
scene.add(new T.HemisphereLight('#9cc8ff', '#c7b48a', 0.72));
const terrain = buildTerrain(); scene.add(terrain.mesh);
const water = buildWater(terrain.depthTex, terrain.depthSize); scene.add(water.mesh);

const grass = buildGrass(terrain.depthTex, terrain.depthSize); scene.add(grass.mesh);
const loader = new GLTFLoader();
if (window.__GLB) { const orig = loader.loadAsync.bind(loader); loader.loadAsync = (url) => { const b = window.__GLB[url.replace('./assets/', '')]; if (!b) return orig(url); return loader.parseAsync(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)).buffer, ''); }; }   // hosted build: models ship inside a script
const hemi = scene.children.find((o) => o.isHemisphereLight);
const G = (window.game = { scene, camera, renderer, T, look: post, sun, hemi, skyApi: sky, terrain, heightAt, SPOTS, ready: false, frames: 0, systems: [] });
const hero = await createHero(loader); scene.add(hero.group);
const ctl = createController(hero, camera); bindPointer(canvas);
G.hero = hero; G.ctl = ctl;
// soft contact shadow under the hero so he always sits on the ground
const blob = new T.Mesh(new T.PlaneGeometry(1.0, 1.0).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.3, color: '#0a2a45', map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#777'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(c); return t; })(), alphaMap: null }));
blob.material.alphaMap = blob.material.map; blob.material.map = null; blob.renderOrder = 2; scene.add(blob); G.blob = blob;
const spawn = Q.get('pos')?.split(',').map(Number) || [SPOTS.plaza.x + 2, SPOTS.plaza.z + 22];
ctl.teleport(spawn[0], spawn[1]); ctl.yaw = +(Q.get('face') ?? Math.PI); if (!Q.has('yaw')) ctl.cam.yaw = 0;
if (Q.has('yaw')) ctl.cam.yaw = +Q.get('yaw'); if (Q.has('pitch')) ctl.cam.pitch = +Q.get('pitch'); if (Q.has('dist')) ctl.cam.dist = ctl.cam.tDist = +Q.get('dist');

const { initWorld } = await import('./world/world.js').catch((e) => (console.warn('world module', e), {}));
if (initWorld) await initWorld(G, loader);
const { initLandmarks } = await import('./world/landmarks.js'); await initLandmarks(G, loader, terrain);
const { initAmbient } = await import('./fx/ambient.js'); initAmbient(G);
const { createHud } = await import('./ui/hud.js'); G.hud = createHud();
const { initGame } = await import('./game/game.js'); await initGame(G, loader);
for (const [file, fn, load] of [['extras', 'initExtras', () => import('./game/extras.js')], ['life', 'initLife', () => import('./game/life.js')], ['travel', 'initTravel', () => import('./game/travel.js')], ['daynight', 'initDayNight', () => import('./world/daynight.js')], ['interiors', 'initInteriors', () => import('./world/interiors.js')], ['more', 'initMore', () => import('./game/more.js')], ['screens', 'initScreens', () => import('./ui/screens.js')]]) { try { const m = await load(); await m[fn]?.(G, loader); } catch (e) { console.error('module failed', file, e); } }

if (Q.has('studio')) { ctl.cam.lookH = 0.5; terrain.mesh.visible = grass.mesh.visible = water.mesh.visible = sky.sky.visible = sky.clouds.visible = false; scene.background = new T.Color('#e9f1fb'); scene.fog = null; const fl = new T.Mesh(new T.CircleGeometry(30, 48).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#eef4fc', roughness: 0.9 })); fl.receiveShadow = true; fl.position.copy(ctl.pos).y += 0.002; scene.add(fl); }
if (Q.has('time') && G.time) { G.time.set(+Q.get('time')); G.time.paused = true; }
G.setQuality = (q) => { const pr = q === 'low' ? 0.75 : q === 'medium' ? 1 : Math.min(devicePixelRatio, 2); if (!SHOT) { renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); post?.setSize(innerWidth, innerHeight); } G.postOff = q === 'low'; const sz = q === 'high' && !SHOT ? 4096 : q === 'medium' || SHOT ? 2048 : 1024; if (sun.shadow.mapSize.x !== sz) { sun.shadow.mapSize.set(sz, sz); sun.shadow.map?.dispose(); sun.shadow.map = null; } };
const clock = new T.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  ctl.update(dt);
  WIND.time.value += dt; if (post) post.dof.focus.value = camera.position.distanceTo(ctl.cam.look);
  for (const s of G.systems) s(dt, G);
  { const gy = groundAt(ctl.pos.x, ctl.pos.z, ctl.pos.y + 0.3), air = Math.max(0, ctl.pos.y - gy); blob.position.set(ctl.pos.x, Math.max(gy, -0.02) + 0.06, ctl.pos.z); const k = 1 / (1 + air * 0.55); blob.scale.setScalar(k); blob.material.opacity = 0.3 * k; blob.visible = gy > -0.3; }
  sun.target.position.copy(ctl.pos); sun.position.copy(ctl.pos).addScaledVector(G.lightDir || SUN_DIR, 160); sun.target.updateMatrixWorld();
  sky.update(dt, camera.position); water.update(dt, camera.position); grass.update(dt, ctl.cam.look, ctl.pos);
  if (post && !G.postOff) post.render(); else renderer.render(scene, camera); G.frames++;
  requestAnimationFrame(frame);
}
G.ready = true; frame();
