// node tools/poses.mjs out.png  -> contact sheet of hero poses in the studio (checks the rig + animation without playing)
import { createRequire } from 'module'; import { execSync } from 'child_process';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const out = process.argv[2] || 'shots/poses.png', only = process.argv[3];
const POSES = { idle: `h.force={speed:0,grounded:true,vy:0}`, walk1: `h.force={speed:2.4,grounded:true,vy:0};h.anim.phase=0.3`, walk2: `h.force={speed:2.4,grounded:true,vy:0};h.anim.phase=1.9`, walk3: `h.force={speed:2.4,grounded:true,vy:0};h.anim.phase=3.5`,
  run1: `h.force={speed:6.6,grounded:true,vy:0};h.anim.phase=0.2`, run2: `h.force={speed:6.6,grounded:true,vy:0};h.anim.phase=1.8`, run3: `h.force={speed:6.6,grounded:true,vy:0};h.anim.phase=3.4`, sprint: `h.force={speed:10.4,grounded:true,vy:0,sprint:true};h.anim.phase=4.6`,
  jumpUp: `h.force={speed:3,grounded:false,vy:8}`, fall: `h.force={speed:3,grounded:false,vy:-9}`, land: `h.force={speed:0,grounded:true,vy:0};h.anim.land=1;h.anim.sq=-.25`, slide: `h.force={speed:9,grounded:true,vy:0,sliding:true}`,
  glide: `h.force={speed:6,grounded:false,vy:-2,gliding:true}`, hang: `h.force={speed:12,grounded:false,vy:-1,hang:true}`, drive: `h.force={speed:0,grounded:true,vy:0,sitting:true,driving:true,steer:.6}`, sit: `h.force={speed:0,grounded:true,vy:0,sitting:true}`,
  wave: `h.force={speed:0,grounded:true,vy:0};h.emote('wave')`, celebrate: `h.force={speed:0,grounded:true,vy:0};h.emote('celebrate')`, think: `h.force={speed:0,grounded:true,vy:0};h.emote('think')`, stretch: `h.force={speed:0,grounded:true,vy:0};h.emote('stretch')` };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 420 } }); p.on('pageerror', (e) => console.log('PAGEERR', (e.stack||String(e)).slice(0,400)));
await p.goto('http://localhost:5173/?shot=1&studio&notitle&nopost&face=0.7&dist=2.6&pitch=0.12');
await p.waitForFunction('window.game && window.game.ready && window.game.frames > 6', null, { timeout: 420000 });
await p.evaluate('game.world.visible=false;game.hero.group.parent||0;game.scene.add(game.hero.group)');
const names = Object.keys(POSES).filter((n) => !only || only.split(',').includes(n)); let i = 0;
for (const n of names) { await p.evaluate(`{const h=game.hero;h.freeze=true;h.anim.emote=null;h.anim.idle=0;${POSES[n]};game.ctl.yaw=${n === 'hang' || n === 'slide' || n === 'glide' || n.startsWith('run') || n.startsWith('walk') || n === 'sprint' ? 1.5 : 0.7};const em=h.anim.emote;for(let i=0;i<${n === 'land' ? 3 : 70};i++){h.update(1/60,game.ctl.state);if(em&&h.anim.emoteT>0.9)h.anim.emoteT=0.9;}}`); const f = await p.evaluate('game.frames'); await p.waitForFunction(`game.frames > ${f + 2}`, null, { timeout: 180000 }).catch(() => console.log('slow', n));
  await p.screenshot({ path: `/tmp/pose_${String(i++).padStart(2, '0')}.png` }); }
await b.close(); const cols = Math.min(names.length, 5);
execSync(`ffmpeg -v error -y -i /tmp/pose_%02d.png -vf "scale=420:420,tile=${cols}x${Math.ceil(names.length / cols)}" -frames:v 1 ${out}`); console.log(names.join(' '));
