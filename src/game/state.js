// Save data + a tiny event bus. Everything the player earns lives here and persists in the browser.
const KEY = 'halo-isle-save-v1';
const fresh = () => ({ coins: 0, got: {}, shards: {}, stars: {}, medals: {}, best: {}, areas: {}, abilities: { glide: false }, tint: 'sky', owned: { sky: true, mint: true, peach: true, rose: true }, flags: {}, playSeconds: 0, hat: 'none', leaf: 'green', ownedHats: { none: true }, ownedLeaves: { green: true }, coinStyle: 'coins', settings: { vol: 1, music: 1, sens: 1, invertY: false, quality: 'high', waypoints: true, dayMinutes: 5 }, track: null });
export const S = fresh();
try { const raw = localStorage.getItem(KEY); if (raw && !new URLSearchParams(location.search).has('fresh')) Object.assign(S, fresh(), JSON.parse(raw)); } catch (e) { /* storage unavailable: play without saving */ }
let dirty = false; export const save = () => (dirty = true);
setInterval(() => { if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }, 1500);
const subs = {}; export const on = (ev, fn) => ((subs[ev] ||= []).push(fn), fn); export const emit = (ev, ...a) => (subs[ev] || []).forEach((f) => f(...a));
export const count = (o) => Object.keys(o).length;
export function reset() { Object.assign(S, fresh()); save(); }
