// node tools/map.mjs out.png  -> top-down height map of the island with spot markers (layout debugging)
import { createRequire } from 'module'; const sharp = createRequire('/opt/node22/lib/node_modules/')('sharp');
import { heightAt } from '../src/world/terrain.js'; import { SPOTS } from '../src/world/layout.js';
const S = 840, N = 840, buf = Buffer.alloc(N * N * 3);
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const x = (i / N - 0.5) * S, z = (j / N - 0.5) * S, h = heightAt(x, z), hx = heightAt(x + 1, z) - h; let c;
  if (h < 0) c = [40 + h * 2, 150 + h * 6, 230 + h * 3]; else if (h < 2.6) c = [240, 225, 170]; else { const t = Math.min(1, h / 190); c = [90 + t * 150, 190 - t * 40, 70 + t * 110]; }
  const sh = 1 + Math.max(-0.5, Math.min(0.5, -hx * 0.5)); let grid = (Math.abs(x % 100) < 0.6 || Math.abs(z % 100) < 0.6) ? 0.8 : 1;
  for (let k = 0; k < 3; k++) buf[(j * N + i) * 3 + k] = Math.max(0, Math.min(255, c[k] * sh * grid));
}
for (const [n, s] of Object.entries(SPOTS)) { const i = Math.round((s.x / S + 0.5) * N), j = Math.round((s.z / S + 0.5) * N); for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { const k = ((j + a) * N + i + b) * 3; buf[k] = 255; buf[k + 1] = 30; buf[k + 2] = 80; } console.log(n, s.x, s.z, heightAt(s.x, s.z).toFixed(1)); }
await sharp(buf, { raw: { width: N, height: N, channels: 3 } }).png().toFile(process.argv[2]);
