import * as T from 'three';
// Expression atlas drawn at runtime: 4x4 cells. Each cell is one eye (left eye as drawn; the right eye mirrors it).
export const EXPR = ['neutral', 'blink', 'happy', 'sleepy', 'surprised', 'star', 'heart', 'sad', 'angry', 'wink', 'half', 'excited', 'dizzy', 'look_l', 'look_r', 'tiny'];
const NAVY = '#16296a', HI = 'rgba(255,255,255,.92)';
export function makeEyeAtlas() {
  const S = 160, c = document.createElement('canvas'); c.width = c.height = S * 4; const g = c.getContext('2d');
  g.lineCap = g.lineJoin = 'round';
  const pill = (x, y, w, h) => { const r = Math.min(w, h) / 2; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, r); g.fill(); };
  const shine = (x, y, s = 1) => { g.fillStyle = HI; g.beginPath(); g.ellipse(x - 5 * s, y - 20 * s, 5.5 * s, 9 * s, 0.2, 0, 7); g.fill(); g.fillStyle = NAVY; };
  const arc = (x, y, r, a0, a1, w = 13) => { g.lineWidth = w; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); };
  const INNER = '#3f66c8';
  EXPR.forEach((name, i) => {
    const ox = (i % 4) * S, oy = ((i / 4) | 0) * S, x = 0, y = 0;
    g.save(); g.beginPath(); g.rect(ox, oy, S, S); g.clip(); g.translate(ox + S / 2, oy + S / 2); g.fillStyle = g.strokeStyle = NAVY;
    // the sheet's neutral eye: a tall glossy navy pill (.05 x .15 of body height) with a lighter blue inner edge
    const eye = (dx, w = 52, h = 126) => { pill(dx, 0, w, h); g.fillStyle = INNER; pill(dx - w * 0.2, 2, w * 0.32, h * 0.78); g.fillStyle = NAVY; pill(dx + w * 0.07, 0, w * 0.62, h * 0.9); g.fillStyle = HI; g.beginPath(); g.ellipse(dx - w * 0.12, -h * 0.3, w * 0.1, h * 0.07, 0.15, 0, 7); g.fill(); g.fillStyle = NAVY; };
    switch (name) {
      case 'neutral': eye(0); break;
      case 'look_l': eye(9); break;
      case 'look_r': eye(-9); break;
      case 'blink': g.lineWidth = 15; g.beginPath(); g.moveTo(-28, 4); g.quadraticCurveTo(0, 14, 28, 4); g.stroke(); break;
      case 'happy': arc(0, 22, 34, Math.PI * 1.1, Math.PI * 1.9, 17); break;
      case 'sleepy': arc(0, -16, 32, Math.PI * 0.14, Math.PI * 0.86, 15); break;
      case 'surprised': eye(0, 62, 140); break;
      case 'tiny': pill(0, 0, 30, 34); break;
      case 'half': g.beginPath(); g.rect(-60, -8, 120, 90); g.clip(); eye(0); g.fillRect(-34, -12, 68, 11); break;
      case 'sad': g.rotate(0.28); g.beginPath(); g.rect(-60, -30, 120, 120); g.clip(); eye(0, 46, 112); break;
      case 'angry': g.save(); g.beginPath(); g.moveTo(-70, 0); g.lineTo(70, -58); g.lineTo(70, 90); g.lineTo(-70, 90); g.closePath(); g.clip(); eye(0, 50, 112); g.restore(); g.lineWidth = 14; g.beginPath(); g.moveTo(40, -58); g.lineTo(-40, -6); g.stroke(); break;
      case 'wink': g.lineWidth = 17; g.beginPath(); g.moveTo(-26, -30); g.lineTo(24, 0); g.lineTo(-26, 30); g.stroke(); break;
      case 'star': case 'excited': { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, r = k % 2 ? 20 : 64; g.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = HI; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); break; }
      case 'heart': { const s = 3.4; g.beginPath(); g.moveTo(0, 15 * s); g.bezierCurveTo(-22 * s, -2 * s, -12 * s, -18 * s, 0, -7 * s); g.bezierCurveTo(12 * s, -18 * s, 22 * s, -2 * s, 0, 15 * s); g.fillStyle = '#f0478f'; g.fill(); g.fillStyle = HI; g.beginPath(); g.ellipse(-17, -16, 6, 10, -0.5, 0, 7); g.fill(); break; }
      case 'dizzy': g.lineWidth = 11; g.beginPath(); for (let a = 0; a < 15; a += 0.2) g.lineTo(Math.cos(a) * a * 3.2, Math.sin(a) * a * 3.2); g.stroke(); break;
    }
    g.restore();
  });
  const mk = (mirror) => { const t = new T.CanvasTexture(c); t.flipY = false; t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(mirror ? -0.25 : 0.25, 0.25); t.anisotropy = 8; return t; };
  const L = mk(false), R = mk(true);
  const set = (tex, mirror, name) => { const i = Math.max(0, EXPR.indexOf(name)), cx = i % 4, cy = (i / 4) | 0; tex.offset.set(mirror ? (cx + 1) * 0.25 : cx * 0.25, cy * 0.25); };
  return { L, R, setL: (n) => set(L, false, n), setR: (n) => set(R, true, n) };
}
