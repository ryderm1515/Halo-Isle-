// node tools/tour.mjs prefix "x,z,camYaw,pitch,dist[,js]" ...   -> one page load, one screenshot per stop (shots/<prefix>-N.png)
import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const [prefix, ...stops] = process.argv.slice(2); const Q = process.env.Q || 'notitle&time=0.35';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +(process.env.W || 800), height: +(process.env.H || 450) } }); const errs = new Set(); p.on('pageerror', (e) => errs.add('PAGEERR ' + (e.stack || e).toString().slice(0, 300))); p.on('console', (m) => m.type() === 'error' && errs.add(m.text().slice(0, 200)));
await p.goto('http://localhost:5173/?shot=1&' + Q); await p.waitForFunction('window.game && window.game.ready && window.game.frames > 3', null, { timeout: 600000 });
let i = 0; for (const s of stops) { const [x, z, yaw, pitch, dist, ...js] = s.split(','); 
  await p.evaluate(`{const c=game.ctl; if(${x}!==null&&'${x}'!=='_'){c.teleport(${x === '_' ? 0 : x},${z === '_' ? 0 : z});} c.cam.yaw=${yaw};c.cam.pitch=${pitch};c.cam.dist=c.cam.tDist=${dist};c.cam.pos.set(0,0,0);c.cam.look.set(0,0,0); ${js.join(',')}}`);
  const f = await p.evaluate('game.frames'); await p.waitForFunction(`game.frames > ${f + +(process.env.N || 3)}`, null, { timeout: 300000 }); await p.screenshot({ path: `shots/${prefix}-${i++}.png` }); }
if (errs.size) console.log([...errs].slice(0, 6).join('\n')); await b.close();
