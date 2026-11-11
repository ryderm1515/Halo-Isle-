import { PATHS, SPOTS, PONDS, PEAK } from '../world/layout.js';
import { noise } from '../util/noise.js';
// The island chart: shaded relief, contour lines, reef shallows, footpaths and the town, painted once from the terrain's own height data.
export function paintMap(N, WORLD, terrain) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N), D = terrain.depthTex.image, dd = D.data, DS = D.width, size = terrain.depthSize;
  const H = (x, z, ch = 0) => { const fx = Math.min(DS - 1.001, Math.max(0, (x / size + 0.5) * (DS - 1))), fz = Math.min(DS - 1.001, Math.max(0, (z / size + 0.5) * (DS - 1))), i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = (j * DS + i) * 4 + ch; return (dd[k] * (1 - u) + dd[k + 4] * u) * (1 - v) + (dd[k + DS * 4] * (1 - u) + dd[k + DS * 4 + 4] * u) * v; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], st = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const DEEP = [38, 132, 226], SEA = [64, 170, 240], SHAL = [120, 222, 240], FOAM = [240, 252, 255], SAND = [252, 236, 178], G1 = [126, 212, 86], G2 = [92, 186, 72], G3 = [160, 226, 104], ROCK = [176, 164, 138], ROCK2 = [146, 136, 116], PEAKC = [222, 208, 176], SNOW = [248, 246, 240];
  const px = WORLD / N;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i / N - 0.5) * WORLD, z = (j / N - 0.5) * WORLD, h = H(x, z), k = (j * N + i) * 4; let col;
    const gx = (H(x + px, z) - H(x - px, z)) / (2 * px), gz = (H(x, z + px) - H(x, z - px)) / (2 * px), slope = Math.hypot(gx, gz);
    if (h < 0) { col = mix(SHAL, SEA, st(-0.2, -3.5, h)); col = mix(col, DEEP, st(-4, -13, h)); const band = Math.sin(h * 2.6 + noise(x * 0.02, z * 0.02) * 1.5); col = mix(col, FOAM, st(0.86, 1, band) * st(-7, -1, h) * 0.22); col = mix(col, FOAM, st(-0.5, 0, h) * 0.8); }
    else { const n1 = noise(x * 0.03, z * 0.03), n2 = noise(x * 0.11 + 9, z * 0.11); col = mix(G1, G2, st(-0.5, 0.6, n1)); col = mix(col, G3, st(0.3, 0.9, n2) * 0.5); col = mix(SAND, col, st(2.3, 3.4, h + n1 * 0.4));
      const cliff = st(0.75, 1.3, slope) * st(2.5, 5, h); col = mix(col, n2 > 0 ? ROCK : ROCK2, cliff); const bare = st(92, 124, h + n1 * 8); col = mix(col, PEAKC, bare * 0.9); col = mix(col, SNOW, st(150, 176, h) * 0.6);
      const shade = Math.max(-0.42, Math.min(0.42, (gx + gz) * 0.34)); col = [col[0] * (1 - shade), col[1] * (1 - shade), col[2] * (1 - shade * 0.9)];
      if (h > 4) { const lvl = h / 12, fr = Math.abs(lvl - Math.round(lvl)) * 12 / Math.max(slope, 0.06) / px; col = mix(col, [60, 110, 70], (1 - st(0.5, 1.3, fr)) * 0.3); } }
    im.data[k] = col[0]; im.data[k + 1] = col[1]; im.data[k + 2] = col[2]; im.data[k + 3] = 255; }
  g.putImageData(im, 0, 0);
  const X = (x) => (x / WORLD + 0.5) * N, s = N / WORLD;
  // ponds
  for (const K of PONDS) { g.beginPath(); g.ellipse(X(K.x), X(K.z), K.r * K.sx * s, K.r * s, 0, 0, 7); const gr = g.createRadialGradient(X(K.x), X(K.z), 0, X(K.x), X(K.z), K.r * K.sx * s); gr.addColorStop(0, '#3fa6ee'); gr.addColorStop(1, '#8fe0f6'); g.fillStyle = gr; g.fill(); g.lineWidth = 1.5 * s; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke(); }
  // the falls
  g.strokeStyle = '#eafcff'; g.lineWidth = 3 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(37), X(50)); g.lineTo(X(40), X(57)); g.stroke();
  // footpaths: pale stone with a soft edge
  const road = (pts, w) => { g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), X(z)) : g.moveTo(X(x), X(z)))); g.lineWidth = (w + 2.4) * 2 * s; g.strokeStyle = 'rgba(120,100,70,.55)'; g.stroke(); g.lineWidth = (w + 0.6) * 2 * s; g.strokeStyle = '#f3e6c6'; g.stroke(); };
  for (const p of PATHS) road(p.pts, p.w * 0.55);
  // town plaza: paved disc with its rings and the fountain
  { const P = SPOTS.plaza, x = X(P.x), z = X(P.z); g.beginPath(); g.arc(x, z, P.r * s, 0, 7); g.fillStyle = '#eadfce'; g.fill(); g.lineWidth = 2 * s; g.strokeStyle = 'rgba(120,100,70,.6)'; g.stroke(); for (const r of [16.4, P.r - 3.6]) { g.beginPath(); g.arc(x, z, r * s, 0, 7); g.lineWidth = 1.7 * s; g.strokeStyle = '#d98f7c'; g.stroke(); } g.beginPath(); g.arc(x, z, 4.6 * s, 0, 7); g.fillStyle = '#6fd0f6'; g.fill(); g.lineWidth = 1.2 * s; g.strokeStyle = '#fff'; g.stroke();
    // rooftops ringing the plaza
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + 0.4, r = P.r + 7, bx = X(P.x + Math.cos(a) * r), bz = X(P.z + Math.sin(a) * r); if (Math.sin(a) > 0.8) continue; g.save(); g.translate(bx, bz); g.rotate(a); g.fillStyle = ['#ee8a70', '#f2a48c', '#e0705a'][i % 3]; g.strokeStyle = '#fff'; g.lineWidth = 0.8 * s; g.beginPath(); g.roundRect(-4 * s, -5.5 * s, 8 * s, 11 * s, 1.5 * s); g.fill(); g.stroke(); g.restore(); } }
  // pier
  g.strokeStyle = '#b9824a'; g.lineWidth = 3.4 * s; g.lineCap = 'butt'; g.beginPath(); g.moveTo(X(62), X(238)); g.lineTo(X(57), X(276)); g.stroke();
  // little landmarks drawn as glyphs
  const dot = (x, z, r, fill) => { g.beginPath(); g.arc(X(x), X(z), r * s, 0, 7); g.fillStyle = fill; g.fill(); g.lineWidth = 1 * s; g.strokeStyle = '#fff'; g.stroke(); };
  dot(SPOTS.observatory.x, SPOTS.observatory.z, 7, '#8fc8f4'); dot(SPOTS.lighthouse.x, SPOTS.lighthouse.z, 4.5, '#fff'); dot(SPOTS.lighthouse.x, SPOTS.lighthouse.z, 2, '#f0524a'); dot(SPOTS.ruins.x, SPOTS.ruins.z, 6, '#aeb39a');
  // the halo over the peak
  g.beginPath(); g.ellipse(X(PEAK.x), X(PEAK.z) - 3 * s, 20 * s, 8 * s, 0, 0, 7); g.lineWidth = 2.2 * s; g.strokeStyle = 'rgba(190,245,255,.95)'; g.shadowColor = '#7fe6ff'; g.shadowBlur = 8 * s; g.stroke(); g.shadowBlur = 0;
  return c;
}
