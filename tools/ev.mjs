// node tools/ev.mjs "<js expr>" [query]  -> loads the game headless and prints the JSON of the expression (may be async)
import { createRequire } from 'module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 180 } }); p.on('pageerror', (e) => console.log('PAGEERR', (e.stack || e).toString().slice(0, 500))); p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
await p.goto('http://localhost:5173/?shot=1&nopost=1&notitle&fresh=1&' + (process.argv[3] || '')); await p.waitForFunction('window.game && window.game.ready && window.game.frames > 2', null, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(`(async()=>{const g=game,h=g.heightAt;return ${process.argv[2]}})()`))); await b.close();
