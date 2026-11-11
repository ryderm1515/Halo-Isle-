const D = process.env.OUT;
export default [
 () => { window.cam = (yaw, pitch, dist) => { const g = __restore.game; for (let i = 0; i < 2; i++) { g.cam.yaw = yaw; g.cam.pitch = pitch; g.cam.distance = dist; g.cam.snapTo(g.player.position); sim(0.03); } }; AquaX.isle.teleport(-33, -64, 0); sim(0.5); return 1; },
 'wait:5000',
 () => { sim(0.2); const r = window.__pipeReport; window.SX = r.start[0]; window.SZ = r.start[1]; return r; },
 () => { const I = AquaX.isle, C = I.C; const [sx, sz] = [SX, SZ];
   const gyAt = (lx, lz) => +(I.gy(C.x + lx, C.z + lz)).toFixed(3), grd = (lx, lz) => +(I.ground(C.x + lx, C.z + lz, 99)).toFixed(3);
   return { start: [sx, sz], onPath: [gyAt(sx + .5, sz + 1), grd(sx + .5, sz + 1)], offPath: [gyAt(sx - 3, sz + 1), grd(sx - 3, sz + 1)], heroY: +I.pipeHero.obj.position.y.toFixed(3) }; },
 // walk the player along the path (hero moved aside), sample height above terrain each step
 () => { const I = AquaX.isle, C = I.C, g = __restore.game; I.pipeHero.obj.position.x += 3; I.teleport(SX + 0.4, SZ - 1, 0); sim(0.4);
   const r = walkTo(C.x + SX + 0.4, C.z + SZ + 7.5, 8); const ab = r.path.map((p) => +(p[1] - I.gy(p[0], p[2])).toFixed(3));
   I.pipeHero.obj.position.x -= 3; return { end: r.end, heightAboveTerrainAlongWalk: ab }; },
 () => { const I = AquaX.isle; I.teleport(SX - 1.6, SZ - 2.8, 0); I.pipeHero.auto = false; I.pipeHero.play('Wave'); I.pipeHero.t = 0.75; },
 () => cam(Math.PI - 0.35, 0.2, 6.5), D + '/ingame-01-path-palms-hero.png',
 () => { const I = AquaX.isle; I.teleport(SX + 1.0, SZ + 0.6, 0); I.pipeHero.play('Idle'); I.pipeHero.t = 0.4; },
 () => cam(Math.PI + 0.5, 0.08, 2.6), D + '/ingame-02-hero-closeup.png',
 () => { const I = AquaX.isle; I.teleport(SX, SZ - 6, 0); I.pipeHero.play('Celebrate'); I.pipeHero.t = 0.4; },
 () => cam(Math.PI, 0.5, 14), D + '/ingame-03-overview.png',
 () => { const I = AquaX.isle; I.teleport(SX + 0.3, SZ + 3.5, Math.PI); I.pipeHero.play('Walk'); I.pipeHero.t = 0.25; },
 () => cam(0.4, 0.15, 4.5), D + '/ingame-04-player-and-hero.png',
];
