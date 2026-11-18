// node tools/hats.mjs out.png -> every hat on the hero, front (top row) and side (bottom row)
import { createRequire } from 'module'; import { execSync } from 'child_process';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright'); const out = process.argv[2] || 'shots/hats.png';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 300, height: 300 } }); p.on('pageerror', (e) => console.log('PAGEERR', (e.stack || String(e)).slice(0, 300)));
await p.goto('http://localhost:5173/?shot=1&studio&notitle&nopost&face=0&dist=1.5&pitch=0.15'); await p.waitForFunction('window.game && window.game.ready && window.game.frames > 6', null, { timeout: 600000 });
await p.evaluate(`game.world.visible=false;game.scene.add(game.hero.group);document.querySelector('#hud').style.display='none'`);
const hats = (process.env.HATS || 'straw,cap,flower,crown,shades,headphones').split(','); let i = 0;
for (const yaw of [0, 1.5708]) for (const h of hats) { await p.evaluate(`{const H=game.hero;H.setHat('${h}');H.freeze=true;H.anim.emote=null;H.force={speed:0,grounded:true,vy:0};for(let i=0;i<30;i++)H.update(1/60,game.ctl.state);H.group.rotation.y=${yaw};H.freeze=true;game.ctl.yaw=${yaw};game.ctl.cam.look.y+=0.35}`);
  const f = await p.evaluate('game.frames'); await p.waitForFunction(`game.frames > ${f + 2}`, null, { timeout: 180000 }); await p.screenshot({ path: `/tmp/hat_${String(i++).padStart(2, '0')}.png` }); }
await b.close(); execSync(`ffmpeg -v error -y -i /tmp/hat_%02d.png -vf "tile=${hats.length}x2" -frames:v 1 ${out}`); console.log(hats.join(' | '));
