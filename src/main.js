import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildTerrain, heightAt } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { buildSky, SUN_DIR } from './world/sky.js';
import { SPOTS } from './world/layout.js';
import { createHero } from './hero/hero.js';
import { createController, bindPointer } from './hero/controller.js';

const Q = new URLSearchParams(location.search), SHOT = Q.has('shot');
const canvas = document.getElementById('game');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = T.NeutralToneMapping; renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene(); scene.fog = new T.Fog('#a9d8ff', 420, 3200);
const camera = new T.PerspectiveCamera(52, innerWidth / innerHeight, 0.12, 6000);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

const sky = buildSky(scene, renderer);
const sun = new T.DirectionalLight('#fff1d6', 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
const SH = 46; Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 400 }); scene.add(sun, sun.target);
scene.add(new T.HemisphereLight('#bfe2ff', '#86c46a', 0.95));
const terrain = buildTerrain(); scene.add(terrain.mesh);
const water = buildWater(terrain.depthTex, terrain.depthSize); scene.add(water.mesh);

const loader = new GLTFLoader();
const G = (window.game = { scene, camera, renderer, T, heightAt, SPOTS, ready: false, frames: 0, systems: [] });
const hero = await createHero(loader); scene.add(hero.group);
const ctl = createController(hero, camera); bindPointer(canvas);
G.hero = hero; G.ctl = ctl;
const spawn = Q.get('pos')?.split(',').map(Number) || [SPOTS.plaza.x, SPOTS.plaza.z];
ctl.teleport(spawn[0], spawn[1]); ctl.yaw = +(Q.get('face') ?? 0);
if (Q.has('yaw')) ctl.cam.yaw = +Q.get('yaw'); if (Q.has('pitch')) ctl.cam.pitch = +Q.get('pitch'); if (Q.has('dist')) ctl.cam.dist = ctl.cam.tDist = +Q.get('dist');

const { initWorld } = await import('./world/world.js').catch((e) => (console.warn('world module', e), {}));
if (initWorld) await initWorld(G, loader);

if (Q.has('studio')) { ctl.cam.lookH = 0.5; terrain.mesh.visible = water.mesh.visible = sky.sky.visible = sky.clouds.visible = false; scene.background = new T.Color('#e9f1fb'); scene.fog = null; const fl = new T.Mesh(new T.CircleGeometry(30, 48).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ color: '#eef4fc', roughness: 0.9 })); fl.receiveShadow = true; fl.position.copy(ctl.pos).y += 0.002; scene.add(fl); }
const clock = new T.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  ctl.update(dt);
  for (const s of G.systems) s(dt, G);
  sun.target.position.copy(ctl.pos); sun.position.copy(ctl.pos).addScaledVector(SUN_DIR, 160); sun.target.updateMatrixWorld();
  sky.update(dt, camera.position); water.update(dt, camera.position);
  renderer.render(scene, camera); G.frames++;
  requestAnimationFrame(frame);
}
G.ready = true; frame();
