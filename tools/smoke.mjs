// Headless play-through of the core loop: shard pickup, ability unlock, a race, the ruins puzzle, a star and coins.
import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 270 } }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
await p.goto('http://localhost:5173/?shot=1&fresh=1&nopost=1'); await p.waitForFunction('window.game && window.game.ready && window.game.hud && window.game.things', null, { timeout: 420000 });
const frames = async (n) => p.waitForFunction(`window.game.frames > ${await p.evaluate('window.game.frames')} + ${n}`, null, { timeout: 300000 });
const ev = (js) => p.evaluate(js); const out = {};
const tp = async (x, z, y) => { await ev(`game.ctl.teleport(${x},${z}${y != null ? ',' + y : ''})`); await frames(4); };
out.coins0 = await ev('game.S.coins');
// 1 lighthouse shard
const L = await ev('game.SPOTS.lighthouse'); const k = Math.hypot(L.x, L.z); await tp(L.x + L.x / k * 15, L.z + L.z / k * 15); await frames(4); out.shardAfterLighthouse = await ev('Object.keys(game.S.shards)');
// 2 mayor unlocks glide
const mayor = await ev('(()=>{const t=game.things.find(t=>String(t.label).includes("Mayor"));return {x:t.x,z:t.z,y:t.y}})()'); await tp(mayor.x + 1.2, mayor.z + 1.2, mayor.y);
for (let i = 0; i < 12; i++) { await ev('game.input.interact=true'); await frames(3); if (i > 1 && !(await ev('game.hud.dialogOpen'))) break; } out.glide = await ev('game.S.abilities.glide');
// 3 plaza race: start then walk the rings by teleport
const race = await ev('(()=>{const t=game.things.find(t=>t.name==="Plaza Dash");return {x:t.x,z:t.z}})()'); await tp(race.x + 0.5, race.z + 0.5); await ev('game.input.interact=true'); await frames(3);
out.raceStarted = await ev('!document.querySelector("#hud .act").classList.contains("hide")');
const rings = await ev('(()=>{const r=[];game.world.traverse(o=>{if(o.isMesh&&o.geometry.type==="TorusGeometry"&&o.visible&&o.geometry.parameters.radius===1.5)r.push([o.position.x,o.position.y,o.position.z])});return r})()'); out.ringCount = rings.length;
for (const r of rings) { await ev(`game.ctl.teleport(${r[0]},${r[2]},${r[1] - 0.5});game.ctl.vel.set(0,0,0)`); await frames(2); }
await frames(3); out.plazaMedal = await ev('game.S.medals.plaza'); out.plazaBest = await ev('game.S.best.plaza');
// 4 ruins puzzle: plates in order circle, triangle, square  (plates were laid out triangle, square, circle => indices 2,0,1)
const plates = await ev('(()=>{const r=[];game.world.traverse(o=>{if(o.isMesh&&o.geometry.type==="CylinderGeometry"&&Array.isArray(o.material)&&o.material.length===3)r.push([o.position.x,o.position.z])});return r})()'); out.plates = plates.length;
for (const i of [2, 0, 1]) { await tp(plates[i][0], plates[i][1]); await frames(3); await tp(plates[i][0] + 6, plates[i][1] + 6); }
out.ruinsOpen = await ev('game.S.flags.ruinsOpen'); const U = await ev('game.SPOTS.ruins'); { const ry = Math.atan2(-30, 20); await tp(U.x - Math.sin(ry) * 3.2, U.z - Math.cos(ry) * 3.2); } await frames(4); out.shards = await ev('Object.keys(game.S.shards)');
// 5 fountain star + coins
const P = await ev('game.SPOTS.plaza'); await tp(P.x, P.z, P.h + 4.2); await frames(3); out.stars = await ev('Object.keys(game.S.stars).length'); out.coinsEnd = await ev('game.S.coins');
await ev('document.dispatchEvent(new KeyboardEvent("keydown",{code:"Tab"}));window.dispatchEvent(new KeyboardEvent("keydown",{code:"Tab"}))'); await frames(2); out.journal = await ev('!document.querySelector("#hud .journal").classList.contains("hide")');
console.log(JSON.stringify(out, null, 1)); if (errs.length) console.log('ERRORS', errs); await b.close();
