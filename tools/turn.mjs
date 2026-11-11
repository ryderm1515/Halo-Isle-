// node tools/turn.mjs out.png "pos=78,158" "yaw1,yaw2,..." [dist] [pitch] [cellW cellH] [pre-js]  -> one row of views around the hero
import { createRequire } from 'module'; const R = createRequire('/opt/node22/lib/node_modules/'), { chromium } = R('playwright'), sharp = R('sharp');
const [out, query = '', yaws = '0,0.9,1.57,3.14,-1.57', dist = 3, pitch = 0.1, w = 420, h = 520, pre = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } }); p.on('pageerror', (e) => console.log('ERR', String(e)));
await p.goto('http://localhost:5173/?shot=1&' + query); await p.waitForFunction('window.game && window.game.ready && window.game.frames > 6', null, { timeout: 180000 });
const wait = async (n = 6) => p.waitForFunction(`window.game.frames > ${await p.evaluate('window.game.frames')} + ${n}`, null, { timeout: 120000 });
if (pre) { await p.evaluate(pre); await wait(10); }
const imgs = [];
for (const y of yaws.split(',')) { await p.evaluate(`{const c=game.ctl.cam;c.yaw=${y}+game.ctl.yaw;c.pitch=${pitch};c.dist=c.tDist=${dist};c.pos.set(0,0,0);}`); await wait(5); imgs.push(await p.screenshot()); }
await sharp({ create: { width: w * imgs.length, height: +h, channels: 3, background: '#fff' } }).composite(imgs.map((input, i) => ({ input, left: i * w, top: 0 }))).png().toFile(out); await b.close();
