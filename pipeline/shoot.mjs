// node shoot.mjs out.png "<query>" [w h]
import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const [out, query, w = 900, h = 900] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:8765/pipeline/viewer/index.html?' + query);
await p.waitForFunction('window.done', null, { timeout: 120000 });
console.log(JSON.stringify(await p.evaluate('window.report')), errs.length ? 'ERRORS ' + errs.join(' | ') : '');
await p.screenshot({ path: out }); await b.close();
