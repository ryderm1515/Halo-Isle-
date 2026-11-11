// All sound is synthesised (Web Audio): soft marimba blips, a boing for jumps, surf and wind beds, and a gentle generative island tune.
let ctx = null, master = null, musicGain = null, started = false; const st = { muted: false };
function init() { if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination); musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master); }
function tone(f, t0, dur, type = 'sine', vol = 0.2, dest = master, glide = 0) { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (glide) o.frequency.exponentialRampToValueAtTime(f * glide, t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.05); }
function noiseBed(freq, q, vol, lfo) { const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = vol; const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfo; lg.gain.value = vol * 0.6; l.connect(lg).connect(g.gain); l.start(); s.connect(f).connect(g).connect(master); s.start(); return g; }
const beds = {}; const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]; let step = 0, nextT = 0;
function music() { if (!ctx || st.muted) return; const now = ctx.currentTime; while (nextT < now + 0.3) { const bar = Math.floor(step / 8) % 4, root = [0, -3, 5, -5][bar], base = 261.63 * Math.pow(2, root / 12);
    if (step % 8 === 0) for (const iv of [0, 7, 16]) tone(base * Math.pow(2, iv / 12) / 2, nextT, 2.2, 'sine', 0.05, musicGain);
    if (Math.random() < 0.62 || step % 4 === 0) { const n = SCALE[(Math.random() * SCALE.length) | 0]; tone(base * Math.pow(2, n / 12), nextT, 0.55, 'triangle', 0.09, musicGain); tone(base * Math.pow(2, n / 12) * 2, nextT, 0.2, 'sine', 0.03, musicGain); }
    step++; nextT += 0.27; } }
export const audio = {
  start() { if (started) return; init(); if (!ctx) return; started = true; ctx.resume(); beds.sea = noiseBed(420, 0.6, 0.0, 0.11); beds.wind = noiseBed(900, 0.4, 0.012, 0.07); nextT = ctx.currentTime + 0.2; setInterval(music, 120); },
  setSea(v) { if (beds.sea) beds.sea.gain.setTargetAtTime(v * 0.07, ctx.currentTime, 0.6); },
  toggle() { st.muted = !st.muted; if (master) master.gain.value = st.muted ? 0 : 0.55; return st.muted; },
  coin(k = 0) { if (!ctx) return; const t = ctx.currentTime, f = 880 * Math.pow(2, (k % 8) / 12); tone(f, t, 0.12, 'triangle', 0.16); tone(f * 1.5, t + 0.06, 0.2, 'sine', 0.12); },
  star() { if (!ctx) return; const t = ctx.currentTime; [0, 4, 7, 12, 16].forEach((n, i) => tone(523.25 * Math.pow(2, n / 12), t + i * 0.08, 0.45, 'triangle', 0.16)); },
  jump() { if (!ctx) return; tone(300, ctx.currentTime, 0.16, 'sine', 0.12, master, 2.1); },
  land() { if (!ctx) return; tone(170, ctx.currentTime, 0.1, 'sine', 0.1, master, 0.6); },
  splash() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone(900 + Math.random() * 900, t + i * 0.02, 0.09, 'sine', 0.04, master, 0.5); },
  pop() { if (!ctx) return; tone(700, ctx.currentTime, 0.07, 'square', 0.07, master, 1.8); },
  ui() { if (!ctx) return; tone(660, ctx.currentTime, 0.08, 'sine', 0.1); },
  talk() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 3; i++) tone(420 + Math.random() * 260, t + i * 0.06, 0.07, 'triangle', 0.08); },
  good() { if (!ctx) return; const t = ctx.currentTime; [0, 7, 12].forEach((n, i) => tone(659.25 * Math.pow(2, n / 12), t + i * 0.1, 0.3, 'triangle', 0.14)); },
  bad() { if (!ctx) return; const t = ctx.currentTime; tone(280, t, 0.18, 'triangle', 0.1, master, 0.75); tone(210, t + 0.12, 0.25, 'triangle', 0.1, master, 0.8); },
  fanfare() { if (!ctx) return; const t = ctx.currentTime; [0, 4, 7, 12, 7, 12, 16, 19].forEach((n, i) => tone(392 * Math.pow(2, n / 12), t + i * 0.11, 0.5, 'triangle', 0.15)); },
  bounce() { if (!ctx) return; tone(220, ctx.currentTime, 0.12, 'sine', 0.1, master, 1.5); },
  glide(on) { if (!ctx) return; if (on && !beds.glide) beds.glide = noiseBed(1500, 1.2, 0.03, 9); if (beds.glide) beds.glide.gain.setTargetAtTime(on ? 0.035 : 0, ctx.currentTime, 0.08); },
};
addEventListener('pointerdown', () => audio.start(), { once: true }); addEventListener('keydown', () => audio.start(), { once: true });
