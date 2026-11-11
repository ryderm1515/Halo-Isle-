// node tools/shoot.mjs out.png "pos=78,158&yaw=3.1&pitch=.2" [w h] [js-to-eval-before-shot]
import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const [out, query = '', w = 1280, h = 720, pre = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text())); p.on('pageerror', (e) => { errs.push(String(e)); console.log('PAGEERR', String(e)); });
await p.goto('http://localhost:5173/?shot=1&' + query);
await p.waitForFunction('window.game && window.game.ready && window.game.frames > 6', null, { timeout: 420000 });
if (pre) { await p.evaluate(pre); await p.waitForFunction(`window.game.frames > ${await p.evaluate('window.game.frames')} + 8`, null, { timeout: 120000 }); }
await p.screenshot({ path: out }); if (errs.length) console.log('LOG', [...new Set(errs)].slice(0, 8).join(' | ')); await b.close();
