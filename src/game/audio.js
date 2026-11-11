// All sound is synthesised (Web Audio): soft marimba blips, a boing for jumps, surf and wind beds, and a gentle generative island tune.
let ctx = null, master = null, musicGain = null, started = false; const st = { muted: false };
let lowpass = null;
function init() { if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55; lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 20000; master.connect(lowpass).connect(ctx.destination); musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master); }
function tone(f, t0, dur, type = 'sine', vol = 0.2, dest = master, glide = 0) { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (glide) o.frequency.exponentialRampToValueAtTime(f * glide, t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.05); }
function noiseBed(freq, q, vol, lfo) { const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = vol; const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfo; lg.gain.value = vol * 0.6; l.connect(lg).connect(g.gain); l.start(); s.connect(f).connect(g).connect(master); s.start(); return g; }
const REC = ['ocean', 'birds', 'falls', 'gull1', 'gull2', 'purr', 'splash', 'marimba', 'hawaiian_hotel'], buf = {}, loops = {};
async function loadRec() { await Promise.all(REC.map(async (n) => { try { const src = window.__AUD?.[n] || `./assets/audio/${n}.mp3`, ab = await (await fetch(src)).arrayBuffer(); buf[n] = await ctx.decodeAudioData(ab); } catch (e) { /* missing file: stay silent */ } }));
  for (const [n, dest] of [['ocean', master], ['birds', master], ['falls', master], ['marimba', musicGain], ['hawaiian_hotel', musicGain]]) { if (!buf[n]) continue; const g = ctx.createGain(); g.gain.value = 0; g.connect(dest); const src = ctx.createBufferSource(); src.buffer = buf[n]; src.loop = true; src.connect(g); src.start(0, Math.random() * 3); loops[n] = g; }
  { const g = ctx.createGain(); g.gain.value = 0; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400; const src = ctx.createBufferSource(); src.buffer = buf.ocean; src.loop = true; if (buf.ocean) { src.connect(hp).connect(g).connect(master); src.start(0, 9); loops.wind = g; } }
  { const g = ctx.createGain(); g.gain.value = 0; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.8; if (buf.hawaiian_hotel) { const src = ctx.createBufferSource(); src.buffer = buf.hawaiian_hotel; src.loop = true; src.connect(bp).connect(g).connect(master); src.start(0); loops.radio = g; } } }
function shot(n, vol = 0.6, rate = 1) { if (!ctx || !buf[n]) return false; const s2 = ctx.createBufferSource(), g = ctx.createGain(); s2.buffer = buf[n]; s2.playbackRate.value = rate; g.gain.value = vol; s2.connect(g).connect(master); s2.start(); return true; }
const setLoop = (n, v, tc = 0.8) => { if (loops[n]) loops[n].gain.setTargetAtTime(v, ctx.currentTime, tc); };
const beds = {}; const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]; let step = 0, nextT = 0;
function music() { if (!ctx || st.muted) return; const now = ctx.currentTime; while (nextT < now + 0.3) { const bar = Math.floor(step / 8) % 4, root = [0, -3, 5, -5][bar], base = 261.63 * Math.pow(2, root / 12);
    if (step % 8 === 0) for (const iv of [0, 7, 16]) tone(base * Math.pow(2, iv / 12) / 2, nextT, 2.2, 'sine', 0.05, musicGain);
    if (Math.random() < 0.62 || step % 4 === 0) { const n = SCALE[(Math.random() * SCALE.length) | 0]; tone(base * Math.pow(2, n / 12), nextT, 0.55, 'triangle', 0.09, musicGain); tone(base * Math.pow(2, n / 12) * 2, nextT, 0.2, 'sine', 0.03, musicGain); }
    step++; nextT += 0.27; } }
export const audio = {
  start() { if (started) return; init(); if (!ctx) return; started = true; ctx.resume(); loadRec(); },
  setSea(v) { setLoop('ocean', v * 0.55); },
  // where you are decides what you hear: surf by the coast, birdsong inland by day, the falls up close, wind when you sprint, marimba in town, slack-key on the beach
  ambience(a) { if (!ctx) return; setLoop('ocean', a.sea * 0.6); setLoop('birds', a.birds * 0.5); setLoop('falls', a.falls * 0.7, 0.4); setLoop('wind', a.wind * 0.22, 0.25); setLoop('marimba', a.town * 0.8, 1.5); if (!audio.radioOn) setLoop('hawaiian_hotel', a.beach * 0.75, 1.5); if (a.gull && Math.random() < a.gull) shot(Math.random() < 0.5 ? 'gull1' : 'gull2', 0.25, 0.9 + Math.random() * 0.2); },
  setVolume(v) { st.vol = v; if (master && !st.muted) master.gain.value = 0.55 * v; },
  setMusic(v) { if (musicGain) musicGain.gain.value = 0.16 * v; st.music = v; },
  toggle() { st.muted = !st.muted; if (master) master.gain.value = st.muted ? 0 : 0.55 * (st.vol ?? 1); return st.muted; },
  coin(k = 0) { if (!ctx) return; const t = ctx.currentTime, f = 880 * Math.pow(2, (k % 8) / 12); tone(f, t, 0.12, 'triangle', 0.16); tone(f * 1.5, t + 0.06, 0.2, 'sine', 0.12); },
  star() { if (!ctx) return; const t = ctx.currentTime; [0, 4, 7, 12, 16].forEach((n, i) => tone(523.25 * Math.pow(2, n / 12), t + i * 0.08, 0.45, 'triangle', 0.16)); },
  jump() { if (!ctx) return; tone(300, ctx.currentTime, 0.16, 'sine', 0.12, master, 2.1); },
  land() { if (!ctx) return; tone(170, ctx.currentTime, 0.1, 'sine', 0.1, master, 0.6); },
  splash() { if (shot('splash', 0.55, 0.85 + Math.random() * 0.3)) return; if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone(900 + Math.random() * 900, t + i * 0.02, 0.09, 'sine', 0.04, master, 0.5); },
  pop() { if (!ctx) return; tone(700, ctx.currentTime, 0.07, 'square', 0.07, master, 1.8); },
  ui() { if (!ctx) return; tone(660, ctx.currentTime, 0.08, 'sine', 0.1); },
  talk() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 3; i++) tone(420 + Math.random() * 260, t + i * 0.06, 0.07, 'triangle', 0.08); },
  good() { if (!ctx) return; const t = ctx.currentTime; [0, 7, 12].forEach((n, i) => tone(659.25 * Math.pow(2, n / 12), t + i * 0.1, 0.3, 'triangle', 0.14)); },
  bad() { if (!ctx) return; const t = ctx.currentTime; tone(280, t, 0.18, 'triangle', 0.1, master, 0.75); tone(210, t + 0.12, 0.25, 'triangle', 0.1, master, 0.8); },
  fanfare() { if (!ctx) return; const t = ctx.currentTime; [0, 4, 7, 12, 7, 12, 16, 19].forEach((n, i) => tone(392 * Math.pow(2, n / 12), t + i * 0.11, 0.5, 'triangle', 0.15)); },
  bounce() { if (!ctx) return; tone(220, ctx.currentTime, 0.12, 'sine', 0.1, master, 1.5); },
  radioOn: false,
  radio(on) { audio.radioOn = on; if (!ctx) return; setLoop('radio', on ? 0.9 : 0, 0.2); if (on) setLoop('hawaiian_hotel', 0); },
  setMuffle(k) { if (lowpass) lowpass.frequency.setTargetAtTime(k > 0.8 ? 600 : k > 0.3 ? 2400 : 20000, ctx.currentTime, 0.15); },
  honk() { if (!ctx) return; const t = ctx.currentTime; tone(392, t, 0.16, 'square', 0.07); tone(494, t, 0.16, 'square', 0.07); tone(392, t + 0.2, 0.26, 'square', 0.07); tone(494, t + 0.2, 0.26, 'square', 0.07); },
  chirp() { if (!ctx) return; const t = ctx.currentTime, f = 2400 + Math.random() * 1400; for (let i = 0; i < 2 + ((Math.random() * 3) | 0); i++) tone(f * (1 + Math.random() * 0.2), t + i * 0.09, 0.07, 'sine', 0.035, master, 1.25); },
  purr() { if (shot('purr', 0.9)) return; if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 14; i++) tone(52 + (i % 2) * 6, t + i * 0.07, 0.07, 'sawtooth', 0.03); },
  glide(on) { if (!ctx) return; if (on && !beds.glide) beds.glide = noiseBed(1500, 1.2, 0.03, 9); if (beds.glide) beds.glide.gain.setTargetAtTime(on ? 0.035 : 0, ctx.currentTime, 0.08); },
};
addEventListener('pointerdown', () => audio.start(), { once: true }); addEventListener('keydown', () => audio.start(), { once: true });
