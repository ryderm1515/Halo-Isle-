import * as T from 'three';
import AVG from './texavg.json' with { type: 'json' };
import { windify } from '../fx/wind.js';
const L = new T.TextureLoader(), cache = {};
export function tex(name, kind = 'diff') {   // Poly Haven CC0 sets in public/assets/textures/<name>/
  const k = name + kind; if (cache[k]) return cache[k];
  const t = L.load(`./assets/textures/${name}/${name}_${kind}_1k.jpg`); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; if (kind === 'diff') t.colorSpace = T.SRGBColorSpace; return (cache[k] = t);
}
export const avg = (name) => new T.Vector3(...AVG[name]);
// A textured PBR material whose hue is art-directed: the photo texture supplies detail, `tint` supplies the colour.
export function tinted(name, tint, o = {}) {
  const a = AVG[name], c = new T.Color(tint), m = new T.MeshStandardMaterial({ map: tex(name), normalMap: o.normal === false ? null : tex(name, 'nor_gl'), roughnessMap: o.rough === false ? null : tex(name, 'rough'), roughness: o.roughness ?? 1, metalness: 0, ...o.extra });
  const k = o.keep ?? 0.0;   // keep = how much of the photo's own colour survives
  m.color.setRGB(lerpc(c.r / a[0], 1, k), lerpc(c.g / a[1], 1, k), lerpc(c.b / a[2], 1, k)); if (o.normalScale) m.normalScale.setScalar(o.normalScale); m.name = o.name || name; return m;
}
const lerpc = (a, b, t) => Math.min(6, a + (b - a) * t);
// Named material library: Blender exports carry material NAMES; the game swaps in these shared materials.
let lib;
export function matLib() {
  if (lib) return lib;
  const P = (color, o = {}) => new T.MeshPhysicalMaterial({ color, roughness: 0.5, ...o });
  lib = {
    M_Wood: tinted('wood_planks', '#c98a4b', { normalScale: 0.9 }),
    M_WoodDark: tinted('brown_planks_09', '#8a5a34'),
    M_Plaster: tinted('white_plaster_02', '#f6f3ea', { normalScale: 0.6 }),
    M_PlasterPink: tinted('white_plaster_02', '#f6c9d4', { normalScale: 0.6 }),
    M_PlasterBlue: tinted('white_plaster_02', '#bfdcf5', { normalScale: 0.6 }),
    M_PlasterYellow: tinted('white_plaster_02', '#f8e3a4', { normalScale: 0.6 }),
    M_Stone: tinted('large_sandstone_blocks', '#cfc8b8'),
    M_StoneRuin: tinted('mossy_sandstone', '#aeb39a', { keep: 0.35 }),
    M_Marble: tinted('marble_01', '#f1f0ee', { roughness: 0.35, rough: false, normalScale: 0.3 }),
    M_Paving: tinted('rectangular_paving', '#d9d2c6', { keep: 0.2 }),
    M_PavingPink: tinted('square_brick_paving', '#e3b9ae'),
    M_Rock: tinted('rock_face_03', '#a59a88', { keep: 0.3 }),
    M_RoofTile: tinted('clay_roof_tiles_02', '#e8826a'),
    M_Navy: P('#1c3f86', { roughness: 0.35, metalness: 0.3, clearcoat: 0.6 }),
    M_Metal: P('#c9d2dc', { roughness: 0.28, metalness: 0.9 }),
    M_White: P('#fbfcff', { roughness: 0.35, clearcoat: 0.5 }),
    M_Glass: P('#9fd6f7', { roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.42, envMapIntensity: 6, clearcoat: 1, side: T.DoubleSide, depthWrite: false }),
    M_GlassBlue: P('#4fb4f2', { roughness: 0.06, transparent: true, opacity: 0.62, envMapIntensity: 6, clearcoat: 1, side: T.DoubleSide, depthWrite: false }),
    M_Lamp: P('#fffdf2', { emissive: '#fff3c9', emissiveIntensity: 0.9, roughness: 0.3 }),
    M_Glow: new T.MeshBasicMaterial({ color: new T.Color(0.35, 2.4, 2.9), toneMapped: false }),
    M_FabricBlue: P('#3f9ff2', { roughness: 0.75, side: T.DoubleSide }), M_FabricWhite: P('#fdfdfd', { roughness: 0.8, side: T.DoubleSide }),
    M_FabricOrange: P('#ff9a45', { roughness: 0.75, side: T.DoubleSide }), M_FabricPink: P('#ff8fb5', { roughness: 0.75, side: T.DoubleSide }),
    M_FabricPurple: P('#9a7be0', { roughness: 0.75, side: T.DoubleSide }), M_FabricGreen: P('#8cd64a', { roughness: 0.75, side: T.DoubleSide }), M_FabricRed: P('#f0524a', { roughness: 0.7, side: T.DoubleSide }),
    M_Jelly: P('#50bafa', { roughness: 0.12, clearcoat: 1, emissive: '#1e86ee', emissiveIntensity: 0.3, envMapIntensity: 4.2 }),
    M_Water: P('#59d7f5', { roughness: 0.05, transparent: true, opacity: 0.8, envMapIntensity: 5 }),
    M_Vcol: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }),
    M_Leaf: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: T.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.0 }),
    M_Trunk: tinted('brown_planks_09', '#c59a5e', { keep: 0.1, normalScale: 0.5 }),
  };
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.flipY = false; return t; };
  const mascot = (g, x, y, s, fill = '#fff', eye = '#2f7fe0') => { g.fillStyle = fill; g.beginPath(); g.moveTo(x - 1.0 * s, y + 0.62 * s); g.bezierCurveTo(x - 1.25 * s, y + 0.1 * s, x - 0.7 * s, y - 0.05 * s, x - 0.55 * s, y - 0.35 * s); g.bezierCurveTo(x - 0.5 * s, y - 1.05 * s, x + 0.5 * s, y - 1.05 * s, x + 0.55 * s, y - 0.35 * s); g.bezierCurveTo(x + 0.7 * s, y - 0.05 * s, x + 1.25 * s, y + 0.1 * s, x + 1.0 * s, y + 0.62 * s); g.closePath(); g.fill(); g.fillStyle = eye; for (const d of [-0.22, 0.22]) { g.beginPath(); g.ellipse(x + d * s, y - 0.3 * s, 0.07 * s, 0.14 * s, 0, 0, 7); g.fill(); } };
  const banner = cv(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f8fea'); gr.addColorStop(1, '#63c3fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(0, h * 0.78); g.quadraticCurveTo(w * 0.5, h * 0.62, w, h * 0.8); g.lineTo(w, h); g.lineTo(0, h); g.fill(); mascot(g, w / 2, h * 0.4, 78); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.strokeRect(9, 9, w - 18, h - 18); });
  const emblem = cv(768, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a9bf0'); gr.addColorStop(1, '#7fd0ff'); g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill(); mascot(g, w / 2, h * 0.58, 92); g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, 32); g.stroke(); });
  const band = cv(1024, 128, (g, w, h) => { g.fillStyle = '#3d9df1'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) mascot(g, 64 + i * 128, h * 0.62, 36); });
  band.wrapS = T.RepeatWrapping; band.repeat.set(3, 1);
  const icon = { game: (g, x, y) => { g.beginPath(); g.roundRect(x - 62, y - 34, 124, 68, 30); g.fill(); g.globalCompositeOperation = 'destination-out'; g.fillRect(x - 44, y - 6, 28, 10); g.fillRect(x - 35, y - 15, 10, 28); g.beginPath(); g.arc(x + 26, y - 8, 7, 0, 7); g.arc(x + 42, y + 8, 7, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; },
    puzzle: (g, x, y) => { g.beginPath(); g.roundRect(x - 38, y - 30, 76, 66, 10); g.fill(); g.beginPath(); g.arc(x, y - 36, 15, 0, 7); g.arc(x + 44, y + 2, 15, 0, 7); g.fill(); },
    peak: (g, x, y) => { g.beginPath(); g.moveTo(x - 64, y + 36); g.lineTo(x - 14, y - 40); g.lineTo(x + 8, y - 6); g.lineTo(x + 26, y - 26); g.lineTo(x + 64, y + 36); g.fill(); } };
  const sign = (col, ic) => cv(512, 160, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, 0, w, h * 0.22); g.fillStyle = '#fff'; icon[ic](g, w * 0.42, h * 0.52); });
  const board = cv(512, 330, (g, w, h) => { g.fillStyle = '#e9d6a8'; g.fillRect(0, 0, w, h); const r = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); g.fillStyle = 'rgba(40,60,90,.45)'; for (let i = 0; i < hh / 16 - 2; i++) g.fillRect(x + 12, y + 30 + i * 16, ww - 24 - (i % 3) * 14, 5); g.fillStyle = '#e8524a'; g.beginPath(); g.arc(x + ww / 2, y + 12, 7, 0, 7); g.fill(); }; r(22, 26, 150, 190, '#fdfdf6'); r(188, 22, 140, 150, '#eaf5ff'); r(344, 30, 146, 200, '#fff9e6'); r(190, 186, 136, 120, '#fdeef2'); r(30, 228, 140, 84, '#f1ffe9'); g.fillStyle = '#2f8fea'; g.fillRect(360, 60, 114, 60); mascot(g, 417, 96, 22); });
  const B = (map, o = {}) => new T.MeshStandardMaterial({ map, roughness: 0.7, side: T.DoubleSide, ...o });
  Object.assign(lib, { M_Banner: B(banner), M_Emblem: B(emblem, { roughness: 0.4 }), M_BandBlue: B(band, { roughness: 0.4 }), M_SignA: B(sign('#3f9ff2', 'game')), M_SignB: B(sign('#86cf45', 'puzzle')), M_SignC: B(sign('#9a7be0', 'peak')), M_Board: B(board),
    M_Eye: P('#16296a', { roughness: 0.15, clearcoat: 1 }), M_Grey: P('#737c88', { roughness: 0.6 }), M_Soil: tinted('leafy_grass', '#5db02e'), M_Yellow: P('#ffd23f', { roughness: 0.5 }), M_Grass: P('#4fae2e', { roughness: 0.8 }),
    M_Paper: P('#fbf6e6', { roughness: 0.9 }), M_Coconut: P('#7a4b26', { roughness: 0.7 }), M_VcolGloss: new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 0.8 }), M_Rope: P('#d9c7a0', { roughness: 0.9 }), M_NavyBlue: P('#2f6fd6', { roughness: 0.4, clearcoat: 0.5 }), M_StoneDoor: tinted('mossy_sandstone', '#5f7180', { keep: 0.2 }),
    M_Net: B(cv(512, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 2; for (let x = 0; x <= w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }), { transparent: true, alphaTest: 0.3 }), M_Sand: tinted('coast_sand_01', '#f7e2a8'), M_Red: P('#f0524a', { roughness: 0.45, clearcoat: 0.5 }), M_Black: P('#22262e', { roughness: 0.5 }) });
  for (const [m, k] of [[lib.M_Leaf, 0.4], [lib.M_Vcol, 0.16]]) m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * ${k.toFixed(2)};`); };   // light glowing through leaves and petals
  windify(lib.M_Vcol, 'tree', 1); windify(lib.M_Leaf, 'tree', 2.2); windify(lib.M_Banner, 'cloth', 1);
  for (const k in lib) lib[k].name = k; return lib;
}
export function applyLib(root) {   // swap exported placeholder materials for library materials by name
  const lb = matLib();
  root.traverse((o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; const sw = (m) => lb[m.name] || (/palm|frond|leaf/i.test(m.name) ? windify(m, 'tree', 1.6) : m); o.material = Array.isArray(o.material) ? o.material.map(sw) : sw(o.material); if (o.material.transparent) { o.castShadow = false; o.renderOrder = 3; } if (o.material.name === 'M_Leaf') o.receiveShadow = false; });
  return root;
}
