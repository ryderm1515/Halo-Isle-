import * as T from 'three';
import { S, save, on } from './state.js';
import { audio } from './audio.js';
import { el } from '../ui/hud.js';
import { icon } from '../ui/icons.js';
import { groundAt } from '../world/colliders.js';
import { heightAt, grassAt } from '../world/terrain.js';
import { SPOTS, PONDS } from '../world/layout.js';
import { models, loadModels } from '../world/world.js';
import { rng, clamp, lerp } from '../util/noise.js';
// Things to carry: a bag (I), a quick slot (Q uses it, R picks the next), finds scattered round the island, stalls that sell and buy,
// first-person chats, a borrowed fishing rod and the spots to use it.
export const ITEMS = {
  mango: { name: 'Mango', icon: 'mango', desc: 'Sweet and quick. Run faster for 45 seconds.', use: 'boost', sell: 3 },
  coconut: { name: 'Coconut', icon: 'coconut', desc: 'A sip puts a spring in your step. Jump higher for 45 seconds.', use: 'spring', sell: 3 },
  seeds: { name: 'Bird seed', icon: 'seeds', desc: 'Scatter a handful and the birds come to you.', use: 'seeds', sell: 1 },
  flower: { name: 'Island flower', icon: 'flower', desc: 'Give it to an islander nearby. They love that.', use: 'gift', sell: 2 },
  shell: { name: 'Seashell', icon: 'shell', desc: 'Sandy trades coins for these on the beach.', sell: 4 },
  starfish: { name: 'Starfish', icon: 'starfish', desc: 'A lucky find. Sandy pays well.', sell: 7 },
  fish: { name: 'Fish', icon: 'fish', desc: 'Fresh off the line. Sandy will buy it.', sell: 12 },
  lantern: { name: 'Lantern', icon: 'lantern', desc: 'Carry a warm light at night. Use it again to put it out.', use: 'lantern', key: true },
  rod: { name: 'Fishing rod', icon: 'rod', desc: 'Borrowed from the lighthouse. Cast from the pier, the lake or the cape.', key: true },
  glider: { name: 'Hang glider', icon: 'glider', desc: 'Jump, hop again, then press Space in the air to open it.', key: true },
  club: { name: 'Golf club', icon: 'club', desc: 'For the driving range west of town.', key: true },
};
export async function initItems(G, loader) {
  await loadModels(loader, { seashell: 'props', starfish: 'props', coconut: 'props', mango: 'props', lantern: 'props' });
  const hud = G.hud, ctl = G.ctl, hero = G.hero, P = SPOTS.plaza, root = G.world, R = rng(77); S.inv ||= {}; if (S.flags.glider) S.inv.glider = 1; S.slot ||= null;
  const count = (id) => S.inv[id] || 0;
  // ------------------------------------------------ quick slot + bag panel
  const slot = el('slot glass hide', '<div class="ic"></div><b></b><span><span class="key">Q</span>use <span class="key">R</span>next <span class="key">I</span>bag</span>'); hud.root.append(slot);
  const bag = el('panel glass hide small bag', '<div class="bar">Bag<span class="x">I / Esc to close</span></div><div class="body"></div>'); hud.root.append(bag); let bagOpen = false;
  const usable = () => Object.keys(S.inv).filter((k) => S.inv[k] > 0 && ITEMS[k]?.use);
  const refresh = () => { if (S.slot && !(count(S.slot) > 0 && ITEMS[S.slot]?.use)) S.slot = usable()[0] || null; if (!S.slot) S.slot = usable()[0] || null; slot.classList.toggle('hide', !S.slot || G.inTitle); if (S.slot) { slot.querySelector('.ic').innerHTML = icon(ITEMS[S.slot].icon, 40); slot.querySelector('b').textContent = ITEMS[S.slot].key ? ITEMS[S.slot].name : `${ITEMS[S.slot].name} ×${count(S.slot)}`; } if (bagOpen) drawBag(); };
  G.addItem = (id, n = 1, quiet = false) => { S.inv[id] = (S.inv[id] || 0) + n; save(); if (!quiet) { hud.toast(`${n > 0 ? '+' : ''}${n} ${ITEMS[id].name}`, ITEMS[id].use ? 'Press Q to use it' : ITEMS[id].sell && !ITEMS[id].key ? 'Sandy on the beach buys these' : ''); audio.coin(3); } if (ITEMS[id].use && !S.slot) S.slot = id; refresh(); };
  G.hasItem = (id) => count(id) > 0;
  function drawBag() { const ids = Object.keys(S.inv).filter((k) => S.inv[k] > 0 && ITEMS[k]); bag.querySelector('.body').innerHTML = ids.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${ids.map((k) => { const it = ITEMS[k]; return `<div class="card pick ${S.slot === k ? 'on' : ''}" data-k="${k}">${icon(it.icon, 44)}<div>${it.name}${it.key ? '' : ` ×${S.inv[k]}`}</div><small>${it.desc}</small></div>`; }).join('')}</div><p style="font-size:12px;opacity:.75;margin:10px 0 0">Click something you can use to put it in your quick slot.</p>` : '<p>Your bag is empty. Shells on the beach, flowers in the meadows and the stalls in town are a good start.</p>';
    bag.querySelectorAll('.pick').forEach((c) => (c.onclick = () => { const k = c.dataset.k; if (ITEMS[k].use) { S.slot = k; save(); audio.ui(); refresh(); } else audio.bad(); })); }
  const toggleBag = (v = !bagOpen) => { if (v && (G.uiBusy?.() || hud.dialogOpen || hud.journalOpen)) return; bagOpen = v; bag.classList.toggle('hide', !v); if (v) { drawBag(); G.freeCursor?.(); ctl.locked = true; audio.ui(); } else if (!hud.dialogOpen && !shopOpen) ctl.locked = false; };
  // ------------------------------------------------ using things
  let boostT = 0, springT = 0, lampOn = false; const lamp = new T.PointLight('#ffd48a', 0, 13, 1.6), lampMesh = models.lantern?.clone(); if (lampMesh) { lampMesh.visible = false; lampMesh.scale.setScalar(0.8); hero.bones.handL.add(lampMesh); lampMesh.position.set(0, -0.02, 0.02); lampMesh.rotation.set(0, 0, Math.PI); } lamp.position.set(0.3, 0.6, 0.3); hero.group.add(lamp);
  const buff = el('buff', ''); hud.root.append(buff);
  function use() { const id = S.slot; if (!id || !count(id) || ctl.locked || G.busy) return; const it = ITEMS[id]; let spend = true;
    if (it.use === 'boost') { boostT = 45; hero.emote('determined'); audio.good(); hud.toast('Mango rush', 'Faster for 45 seconds'); G.sparkle(ctl.pos.x, ctl.pos.y + 0.8, ctl.pos.z, 14, 3); }
    else if (it.use === 'spring') { springT = 45; hero.emote('hop'); audio.good(); hud.toast('Coconut spring', 'Higher jumps for 45 seconds'); G.sparkle(ctl.pos.x, ctl.pos.y + 0.8, ctl.pos.z, 14, 3); }
    else if (it.use === 'seeds') { const near = (G.birds || []).filter((b) => Math.hypot(b.x - ctl.pos.x, b.z - ctl.pos.z) < 60); G.puff?.(ctl.pos.x + Math.sin(ctl.yaw) * 1.2, ctl.pos.y, ctl.pos.z + Math.cos(ctl.yaw) * 1.2, 10, '#e9d28a', 1.6, 1.4); hero.emote('wave');
      near.forEach((b, i) => { const a = i / Math.max(1, near.length) * 6.283, r = 1.6 + (i % 3) * 0.5; b.sx = b.x; b.sz = b.z; b.sy = b.y; b.tx = ctl.pos.x + Math.sin(ctl.yaw) * 1.6 + Math.cos(a) * r; b.tz = ctl.pos.z + Math.cos(ctl.yaw) * 1.6 + Math.sin(a) * r; b.state = 'fly'; b.fly = -i * 0.08; b.calm = 14; }); hud.toast(near.length ? 'The birds come fluttering over' : 'No birds close enough to notice'); if (near.length) audio.chirp?.(); S.flags.fed = (S.flags.fed || 0) + 1; }
    else if (it.use === 'gift') { const n = (G.npcs || []).map((q) => [Math.hypot(q.x - ctl.pos.x, q.z - ctl.pos.z), q]).sort((a, b) => a[0] - b[0])[0]; if (!n || n[0] > 3.5) { hud.toast('Nobody close enough', 'Stand next to an islander'); return; } n[1].h.emote('love'); hero.emote('happy'); audio.star(); S.coins += 5; hud.setCoins(S.coins); G.sparkle(n[1].x, n[1].y + 1, n[1].z, 16, 3); hud.toast(`${n[1].name} loves it`, '+5 coins'); }
    else if (it.use === 'lantern') { lampOn = !lampOn; audio.ui(); spend = false; hud.toast(lampOn ? 'Lantern lit' : 'Lantern out'); }
    if (spend && !it.key) { S.inv[id]--; save(); } refresh(); }
  addEventListener('keydown', (e) => { if (e.repeat || G.inTitle) return; if (e.code === 'KeyI') toggleBag(); else if (e.code === 'Escape' && bagOpen) toggleBag(false); else if (e.code === 'KeyQ') use(); else if (e.code === 'KeyR') { const u = usable(); if (u.length) { S.slot = u[(u.indexOf(S.slot) + 1) % u.length]; audio.ui(); refresh(); } } });
  // ------------------------------------------------ finds: shells and starfish on the sand, coconuts by the palms, flowers in the meadow. They come back after a while.
  const picks = [], glint = new T.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.fillRect(30, 6, 4, 52); g.fillRect(6, 30, 52, 4); return new T.CanvasTexture(c); })(), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  const flowerModel = (() => { const g = new T.Group(), pm = new T.MeshStandardMaterial({ color: '#ff8fb5', roughness: 0.5 }), st = new T.Mesh(new T.CylinderGeometry(0.012, 0.016, 0.3, 5).translate(0, 0.15, 0), new T.MeshStandardMaterial({ color: '#4fae2e' })); g.add(st); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, p = new T.Mesh(new T.SphereGeometry(0.06, 8, 6).scale(1, 0.4, 1.5), pm); p.position.set(Math.sin(a) * 0.07, 0.31, Math.cos(a) * 0.07); p.rotation.y = a; g.add(p); } const c = new T.Mesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshStandardMaterial({ color: '#ffd23f' })); c.position.y = 0.32; g.add(c); return g; })();
  const place = (id, model, x, z, s = 1) => { const h = heightAt(x, z), o = (model === 'flower' ? flowerModel : models[model])?.clone(); if (!o) return; o.position.set(x, h + 0.01, z); o.rotation.y = R() * 6.283; o.scale.setScalar(s); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); const sp = new T.Sprite(glint); sp.position.y = 0.35 / s; sp.scale.setScalar(0.5 / s); o.add(sp); root.add(o); picks.push({ id, o, x, z, y: h, sp, back: 0, ph: R() * 6 }); };
  for (let i = 0, n = 0; i < 900 && n < 18; i++) { const x = 6 + R() * 150, z = 206 + R() * 44, h = heightAt(x, z); if (h < 0.25 || h > 2.3) continue; n++; n % 4 === 0 ? place('starfish', 'starfish', x, z, 1.1) : place('shell', 'seashell', x, z, 1.2); }
  for (let i = 0, n = 0; i < 900 && n < 9; i++) { const x = -20 + R() * 190, z = 196 + R() * 30, h = heightAt(x, z); if (h < 2.5 || h > 4.6) continue; n++; place('coconut', 'coconut', x, z, 1); }
  for (let i = 0, n = 0; i < 3000 && n < 26; i++) { const x = (R() - 0.5) * 520, z = (R() - 0.5) * 480 + 40, h = heightAt(x, z); if (h < 3.2 || h > 90 || grassAt(x, z, h) < 0.7 || Math.hypot(x - P.x, z - P.z) < P.r + 4) continue; n++; place('flower', 'flower', x, z, 1.5); }
  // ------------------------------------------------ first-person chats: the camera steps into your eyes and you look at who you are talking to
  let fp = null; const eye = new T.Vector3(), tgt = new T.Vector3(), from = new T.Vector3();
  G.fpTalk = () => {}; const _fpOff = (n, onn) => { if (onn) { fp = { n, k: 0, out: false }; ctl.yaw = Math.atan2(n.x - ctl.pos.x, n.z - ctl.pos.z); hud.chrome(false); slot.classList.add('hide'); } else if (fp) fp.out = true; };
  // ------------------------------------------------ stalls: buy from the keeper, sell your finds to Sandy
  const SHOPS = { fruit: { title: "Papaya's Fruit", sells: [['mango', 6], ['coconut', 8], ['seeds', 3]] }, beach: { title: "Sandy's Beach Trade", sells: [['lantern', 40], ['seeds', 3]], buys: true } };
  const shop = el('shop glass hide', ''); hud.root.append(shop); let shopOpen = null;
  function drawShop() { const sh = SHOPS[shopOpen.n.shop], sellable = Object.keys(S.inv).filter((k) => S.inv[k] > 0 && ITEMS[k]?.sell && !ITEMS[k].key);
    shop.innerHTML = `<div class="bar">${sh.title}<span class="x">Esc</span></div><div class="body"><p class="purse">${icon('coin', 22)}<b>${S.coins}</b> coins</p><h3>FOR SALE</h3>${sh.sells.map(([k, c]) => `<div class="it">${icon(ITEMS[k].icon, 38)}<div><b>${ITEMS[k].name}</b><small>${ITEMS[k].desc}</small></div><button class="gel" data-buy="${k}:${c}" ${ITEMS[k].key && count(k) ? 'disabled' : ''}>${ITEMS[k].key && count(k) ? 'Owned' : c + ' coins'}</button></div>`).join('')}
      ${sh.buys ? `<h3>SANDY BUYS</h3>${sellable.length ? sellable.map((k) => `<div class="it">${icon(ITEMS[k].icon, 38)}<div><b>${ITEMS[k].name} ×${S.inv[k]}</b><small>${ITEMS[k].sell} coins each</small></div><button class="gel alt" data-sell="${k}">Sell all</button></div>`).join('') : '<p style="opacity:.7;font-size:13px">Bring shells, starfish or fish and I will make it worth your while.</p>'}` : ''}<div style="text-align:right;margin-top:10px"><button class="gel alt" data-x="1">Bye for now</button></div></div>`;
    shop.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => { const [k, c] = b.dataset.buy.split(':'); if (S.coins < +c) { audio.bad(); shopOpen.n.h.emote('sad'); return; } S.coins -= +c; hud.setCoins(S.coins); G.addItem(k, 1, true); audio.good(); shopOpen.n.h.emote('happy'); drawShop(); }));
    shop.querySelectorAll('[data-sell]').forEach((b) => (b.onclick = () => { const k = b.dataset.sell, n = S.inv[k], c = n * ITEMS[k].sell; S.inv[k] = 0; S.coins += c; hud.setCoins(S.coins); save(); audio.coin(5); audio.good(); shopOpen.n.h.emote('celebrate'); hud.toast(`Sold ${n} ${ITEMS[k].name}`, `+${c} coins`); refresh(); drawShop(); }));
    shop.querySelector('[data-x]').onclick = () => closeShop(); }
  const closeShop = () => { if (!shopOpen) return; const d = shopOpen.done; shopOpen = null; shop.classList.add('hide'); d?.(); };
  G.openShop = (n, done) => { if (n.shop === 'wardrobe') { done?.(); G.openWardrobe?.(); return; } shopOpen = { n, done }; G.freeCursor?.(); drawShop(); shop.classList.remove('hide'); };
  addEventListener('keydown', (e) => { if (e.code === 'Escape' && shopOpen) { e.stopImmediatePropagation(); closeShop(); } }, true);
  for (const n of G.npcs || []) { if (n.name === 'Papaya') n.shop = 'fruit'; else if (n.name === 'Brim' || n.name === 'Jelly Jo') n.shop = 'wardrobe'; else if (n.name === 'Sandy') { n.shop = 'beach'; n.wander = 2; n.lines = ['Sandy\'s the name, beachcombing\'s the game.', 'Bring me <b>shells</b>, <b>starfish</b> or <b>fish</b> and I\'ll pay you for them. I have a few useful things too.']; } }
  G.refreshMarkers?.();
  // ------------------------------------------------ per frame
  let t = 0;
  G.systems.push((dt) => { t += dt; const hp = ctl.pos;
    if (boostT > 0) { boostT -= dt; ctl.speedMul = 1.32; if (Math.random() < dt * 10 && ctl.state.speed > 5) G.puff?.(hp.x, hp.y + 0.3, hp.z, 1, '#ffb04a', 0.4, 0.6); if (boostT <= 0) ctl.speedMul = 1; } if (springT > 0) { springT -= dt; ctl.jumpMul = 1.28; if (springT <= 0) ctl.jumpMul = 1; }
    const bt = Math.max(boostT, springT); buff.innerHTML = bt > 0 ? `${boostT > 0 ? icon('mango', 26) : ''}${springT > 0 ? icon('coconut', 26) : ''}<b>${Math.ceil(bt)}s</b>` : ''; 
    const night = G.time?.night || 0; lamp.intensity += ((lampOn ? 14 + Math.sin(t * 9) * 0.8 : 0) - lamp.intensity) * Math.min(1, dt * 6); if (lampMesh) lampMesh.visible = lampOn;
    for (const p of picks) { if (p.back > 0) { p.back -= dt; if (p.back <= 0) p.o.visible = true; continue; } const d = Math.hypot(p.x - hp.x, p.z - hp.z); if (d > 60) continue; p.sp.material.rotation = t * 0.6; p.sp.scale.setScalar((0.35 + Math.max(0, Math.sin(t * 2.2 + p.ph)) * 0.45) / p.o.scale.x);
      if (d < 0.75 && Math.abs(hp.y - p.y) < 1.2 && !G.busy) { p.o.visible = false; p.back = 240 + Math.random() * 120; G.addItem(p.id, 1); G.sparkle(p.x, p.y + 0.4, p.z, 8, 2); } }
    if (fp) { const n = fp.n; fp.k = clamp(fp.k + dt * (fp.out ? -3.4 : 2.8), 0, 1); const e = fp.k * fp.k * (3 - 2 * fp.k), s = n.h.group.scale.x, dx = n.x - hp.x, dz = n.z - hp.z, d = Math.hypot(dx, dz) || 1;
      from.copy(G.camera.position); eye.set(hp.x + dx / d * 0.2, hp.y + 0.86, hp.z + dz / d * 0.2); tgt.set(n.x, n.y + 0.7 * s, n.z); G.camera.position.lerpVectors(from, eye, e); const lk = ctl.cam.look; tgt.set(lerp(lk.x, tgt.x, e), lerp(lk.y, tgt.y, e), lerp(lk.z, tgt.z, e)); G.camera.lookAt(tgt); G.camera.fov = lerp(G.camera.fov, 40, e); G.camera.updateProjectionMatrix(); hero.group.visible = e < 0.55; if (G.look) G.look.dof.focus.value = lerp(G.look.dof.focus.value, d, e);
      if (fp.out && fp.k <= 0) { fp = null; hero.group.visible = true; if (!G.cine) hud.chrome(true); refresh(); } }
  });
  on('land', () => {}); refresh(); setTimeout(refresh, 1500);
}
