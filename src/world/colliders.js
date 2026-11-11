import { heightAt } from './terrain.js';
// Simple world collision: circles (posts, trunks), boxes (walls) and walkable platforms (decks, steps, plaza paving).
export const circles = [], boxes = [], platforms = [];
export const addCircle = (x, z, r, top = 1e9) => circles.push({ x, z, r, top });
export const addBox = (x, z, hw, hd, rotY = 0, top = 1e9) => { const b = { x, z, hw, hd, c: Math.cos(rotY), s: Math.sin(rotY), top, off: false }; boxes.push(b); return b; };
// platform: rectangle (rotated) or disc with a walkable top at height y; only stands in if you are above (y - step)
export const addPlatform = (p) => platforms.push({ rotY: 0, ...p, c: Math.cos(p.rotY || 0), s: Math.sin(p.rotY || 0) });
export function groundAt(x, z, y = 1e9) {
  let g = heightAt(x, z);
  for (const p of platforms) {
    let inside;
    if (p.r) inside = (x - p.x) ** 2 + (z - p.z) ** 2 < p.r * p.r;
    else { const dx = x - p.x, dz = z - p.z, lx = dx * p.c - dz * p.s, lz = dx * p.s + dz * p.c; inside = Math.abs(lx) < p.hw && Math.abs(lz) < p.hd; }
    if (inside) { const top = typeof p.y === 'function' ? p.y(x, z) : p.y; if (top > g && top <= y + 0.45) g = top; }
  }
  return g;
}
export function resolve(pos, radius) {   // push a point out of solid things (xz only)
  for (const c of circles) { if (pos.y > c.top) continue; const dx = pos.x - c.x, dz = pos.z - c.z, rr = c.r + radius, d2 = dx * dx + dz * dz; if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2), k = (rr - d) / d; pos.x += dx * k; pos.z += dz * k; } }
  for (const b of boxes) {
    if (b.off || pos.y > b.top) continue;
    const dx = pos.x - b.x, dz = pos.z - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c, ox = b.hw + radius - Math.abs(lx), oz = b.hd + radius - Math.abs(lz);
    if (ox > 0 && oz > 0) { let nx = lx, nz = lz; if (ox < oz) nx = Math.sign(lx) * (b.hw + radius); else nz = Math.sign(lz) * (b.hd + radius); pos.x = b.x + nx * b.c + nz * b.s; pos.z = b.z - nx * b.s + nz * b.c; }
  }
}
